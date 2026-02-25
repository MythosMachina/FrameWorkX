import type { FastifyInstance } from "fastify";
import { execute, pool, query } from "@frameworkx/shared";
import { randomUUID } from "node:crypto";

async function requireAuth(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401);
    throw new Error("unauthorized");
  }
}

async function requireAdmin(request: any, reply: any) {
  await requireAuth(request, reply);
  const roleId = request.user.role_id as string;
  const [role] = await query<{ name: string }>("SELECT name FROM core.roles WHERE id = $1", [roleId]);
  if (role?.name !== "admin") {
    reply.code(403);
    throw new Error("forbidden");
  }
}

async function upsertSetting(key: string, value: any) {
  const storedValue = typeof value === "string" ? JSON.stringify(value) : value;
  await execute(
    "INSERT INTO core.settings (id, scope, scope_id, key, value) VALUES ($1, 'global', NULL, $2, $3) ON CONFLICT (scope, scope_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
    [randomUUID(), key, storedValue]
  );
}

function normalizeSettingValue(value: any) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function registerQueueRoutes(app: FastifyInstance) {
  app.get("/api/queue", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const pipeline = await query(
      `SELECT r.id AS item_id,
              'pipeline_run' AS item_type,
              r.status,
              r.name AS label,
              q.position,
              r.created_at,
              r.started_at,
              COALESCE(rs.total_steps, 0)::int AS total_steps,
              COALESCE(rs.done_steps, 0)::int AS done_steps
       FROM pipeline.runs r
       LEFT JOIN pipeline.queue q ON q.run_id = r.id
       LEFT JOIN (
         SELECT run_id,
                COUNT(*)::int AS total_steps,
                COUNT(*) FILTER (WHERE status = 'done')::int AS done_steps
         FROM pipeline.run_steps
         GROUP BY run_id
       ) rs ON rs.run_id = r.id
       WHERE r.user_id = $1`,
      [userId]
    );
    const generation = await query(
      `SELECT j.id AS item_id,
              'generation_job' AS item_type,
              j.status,
              j.prompt AS label,
              q.position,
              j.created_at,
              j.started_at,
              j.batch_count,
              COALESCE(COUNT(o.id), 0)::int AS outputs_ready
       FROM generation.jobs j
       LEFT JOIN generation.queue q ON q.job_id = j.id
       LEFT JOIN generation.outputs o ON o.job_id = j.id
       WHERE j.user_id = $1
       GROUP BY j.id, q.position`,
      [userId]
    );
    const training = await query(
      `SELECT r.id AS item_id,
              'training_run' AS item_type,
              r.status,
              r.dataset_id::text AS label,
              r.created_at,
              r.started_at,
              r.settings,
              COALESCE(MAX(m.step), 0)::int AS step,
              COALESCE(MAX(m.epoch), 0)::int AS epoch
       FROM training.runs r
       LEFT JOIN training.metrics m ON m.run_id = r.id
       WHERE r.user_id = $1
       GROUP BY r.id`,
      [userId]
    );

    const now = Date.now();
    const items = [...pipeline, ...generation, ...training].map((row: any) => {
      let progress = null;
      let eta = null;
      if (row.item_type === "pipeline_run") {
        const total = Number(row.total_steps ?? 0);
        const done = Number(row.done_steps ?? 0);
        if (total > 0) {
          progress = Math.min(100, Math.round((done / total) * 100));
        }
        if (row.status === "ready_to_train") {
          progress = 100;
        }
      } else if (row.item_type === "generation_job") {
        const total = Number(row.batch_count ?? 1);
        const done = Number(row.outputs_ready ?? 0);
        if (total > 0) {
          progress = Math.min(100, Math.round((done / total) * 100));
        }
        if (row.status === "completed") {
          progress = 100;
        }
      } else if (row.item_type === "training_run") {
        const settings = row.settings ?? {};
        const stepTotal = Number(settings.step_total ?? 0);
        const epochTotal = Number(settings.epoch_total ?? 0);
        if (stepTotal > 0) {
          progress = Math.min(100, Math.round((Number(row.step ?? 0) / stepTotal) * 100));
        } else if (epochTotal > 0) {
          progress = Math.min(100, Math.round((Number(row.epoch ?? 0) / epochTotal) * 100));
        }
        if (row.status === "completed") {
          progress = 100;
        }
      }

      if (progress !== null && row.started_at && progress > 0 && progress < 100) {
        const elapsed = Math.max(1, Math.round((now - new Date(row.started_at).getTime()) / 1000));
        const totalEstimate = Math.round(elapsed / (progress / 100));
        eta = Math.max(0, totalEstimate - elapsed);
      }

      const active =
        row.status === "running" ||
        row.status === "rendering" ||
        row.status === "manual_tagging";

      return {
        ...row,
        progress_pct: progress,
        eta_seconds: eta,
        priority_rank: active ? 0 : 1
      };
    });
    items.sort((a, b) => {
      if (a.priority_rank !== b.priority_rank) return a.priority_rank - b.priority_rank;
      const posA = a.position ?? 999999;
      const posB = b.position ?? 999999;
      if (posA !== posB) return posA - posB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    return { queue: items };
  });

  app.get("/api/admin/queue/status", { preHandler: requireAdmin }, async () => {
    const [pausedRow] = await query<{ value: any }>(
      "SELECT value FROM core.settings WHERE scope = 'global' AND key = 'queue.paused' ORDER BY updated_at DESC, created_at DESC LIMIT 1"
    );
    const queuePaused = Boolean(normalizeSettingValue(pausedRow?.value ?? false) ?? false);
    const [pipeline] = await query<{ id: string; status: string }>(
      "SELECT id, status FROM pipeline.runs WHERE status IN ('running','queued_initiated','manual_tagging') ORDER BY started_at ASC NULLS LAST LIMIT 1"
    );
    const [generation] = await query<{ id: string; status: string }>(
      "SELECT id, status FROM generation.jobs WHERE status IN ('running','rendering') ORDER BY started_at ASC NULLS LAST LIMIT 1"
    );
    const [training] = await query<{ id: string; status: string }>(
      "SELECT id, status FROM training.runs WHERE status IN ('running') ORDER BY started_at ASC NULLS LAST LIMIT 1"
    );
    return {
      queue_paused: queuePaused,
      active_pipeline_id: pipeline?.id ?? null,
      active_generation_id: generation?.id ?? null,
      active_training_id: training?.id ?? null
    };
  });

  app.post("/api/admin/queue/command", { preHandler: requireAdmin }, async (request) => {
    const body = request.body as { action?: string };
    const action = String(body.action ?? "").toLowerCase();
    if (!action) return { error: "action_required" };
    if (action === "start" || action === "restart") {
      await upsertSetting("queue.paused", false);
      return { status: "ok", queue_paused: false };
    }
    if (action === "pause") {
      await upsertSetting("queue.paused", true);
      return { status: "ok", queue_paused: true };
    }
    if (action === "stop") {
      await upsertSetting("queue.paused", true);
      await execute("UPDATE pipeline.runs SET status = 'stopped', updated_at = NOW() WHERE status = 'queued'");
      await execute("DELETE FROM pipeline.queue");
      await execute("UPDATE generation.jobs SET status = 'stopped', updated_at = NOW() WHERE status = 'queued'");
      await execute("DELETE FROM generation.queue");
      await execute("UPDATE training.runs SET status = 'stopped', updated_at = NOW() WHERE status = 'queued'");
      return { status: "ok", queue_paused: true };
    }
    if (action === "refresh") {
      const [pausedRow] = await query<{ value: any }>(
        "SELECT value FROM core.settings WHERE scope = 'global' AND key = 'queue.paused'"
      );
      return { status: "ok", queue_paused: Boolean(pausedRow?.value ?? false) };
    }
    return { error: "invalid_action" };
  });

  app.post("/api/queue/reorder", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const body = request.body as { item_id?: string; item_type?: string; direction?: "up" | "down" };
    const itemId = String(body.item_id ?? "").trim();
    const itemType = String(body.item_type ?? "").trim();
    const direction = body.direction === "down" ? "down" : body.direction === "up" ? "up" : "";

    if (!itemId) {
      reply.code(400);
      return { error: "item_required" };
    }
    if (!direction) {
      reply.code(400);
      return { error: "direction_required" };
    }
    if (itemType !== "pipeline_run") {
      reply.code(400);
      return { error: "item_type_not_supported" };
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [target] = (
        await client.query<{ run_id: string; position: number }>(
          `SELECT q.run_id, q.position
           FROM pipeline.queue q
           JOIN pipeline.runs r ON r.id = q.run_id
           WHERE q.run_id = $1
             AND r.user_id = $2
             AND r.status = 'queued'
           FOR UPDATE`,
          [itemId, userId]
        )
      ).rows;
      if (!target) {
        await client.query("ROLLBACK");
        reply.code(409);
        return { error: "not_reorderable" };
      }

      const neighborSql =
        direction === "up"
          ? `SELECT q.run_id, q.position
             FROM pipeline.queue q
             JOIN pipeline.runs r ON r.id = q.run_id
             WHERE r.user_id = $1
               AND r.status = 'queued'
               AND q.position < $2
             ORDER BY q.position DESC
             LIMIT 1
             FOR UPDATE`
          : `SELECT q.run_id, q.position
             FROM pipeline.queue q
             JOIN pipeline.runs r ON r.id = q.run_id
             WHERE r.user_id = $1
               AND r.status = 'queued'
               AND q.position > $2
             ORDER BY q.position ASC
             LIMIT 1
             FOR UPDATE`;

      const [neighbor] = (await client.query<{ run_id: string; position: number }>(neighborSql, [userId, target.position])).rows;
      if (!neighbor) {
        await client.query("COMMIT");
        return { status: "noop", reason: "edge_of_queue" };
      }

      await client.query(
        `UPDATE pipeline.queue
         SET position = CASE
           WHEN run_id = $1 THEN $2
           WHEN run_id = $3 THEN $4
           ELSE position
         END
         WHERE run_id IN ($1, $3)`,
        [target.run_id, neighbor.position, neighbor.run_id, target.position]
      );

      await client.query("COMMIT");
      return { status: "ok" };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });
}
