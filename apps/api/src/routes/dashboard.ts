import type { FastifyInstance } from "fastify";
import path from "node:path";
import fs from "node:fs/promises";
import { query, loadConfig } from "@frameworkx/shared";

const config = loadConfig(process.cwd());
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp"]);

async function countImages(root: string) {
  let count = 0;
  const stack = [root];
  while (stack.length) {
    const current = stack.pop() as string;
    let entries: any[];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith("_")) continue;
        stack.push(fullPath);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (imageExtensions.has(ext)) count += 1;
    }
  }
  return count;
}

async function fallbackRunImageCount(userId: string, runId: string) {
  const roots = [
    path.join(config.storageRoot, "users", userId, "datasets", runId, "input"),
    path.join(config.storageRoot, "users", userId, "datasets", runId, "workflow", "work"),
    path.join(config.storageRoot, "users", userId, "datasets", runId, "outputs", "datasets")
  ];
  for (const root of roots) {
    try {
      const stat = await fs.stat(root);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }
    const count = await countImages(root);
    if (count > 0) return count;
  }
  return 0;
}

async function requireAuth(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401);
    throw new Error("unauthorized");
  }
}

export async function registerDashboardRoutes(app: FastifyInstance) {
  app.get("/api/dashboard/overview", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;

    const pipelineRuns = await query(
      `SELECT r.id,
              r.name,
              r.status,
              r.last_step,
              s.progress_pct,
              s.eta_seconds,
              s.error_message,
              COALESCE(imgs.image_count, 0) AS image_count
       FROM pipeline.runs r
       LEFT JOIN ui.pipeline_run_status s ON s.run_id = r.id
       LEFT JOIN (
         SELECT d.pipeline_run_id, COUNT(*)::int AS image_count
         FROM training.datasets d
         JOIN training.dataset_items i ON i.dataset_id = d.id
         GROUP BY d.pipeline_run_id
       ) imgs ON imgs.pipeline_run_id = r.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    for (const run of pipelineRuns) {
      if (Number(run.image_count ?? 0) > 0) continue;
      const count = await fallbackRunImageCount(userId, run.id);
      if (count > 0) {
        run.image_count = count;
      }
    }

    const trainingRuns = await query(
      `SELECT r.id,
              r.status,
              r.pipeline_run_id,
              pr.name,
              s.progress_pct,
              s.eta_seconds,
              s.last_loss,
              s.error_message,
              COALESCE(imgs.image_count, 0) AS image_count
       FROM training.runs r
       LEFT JOIN pipeline.runs pr ON pr.id = r.pipeline_run_id
       LEFT JOIN ui.training_run_status s ON s.training_run_id = r.id
       LEFT JOIN (
         SELECT dataset_id, COUNT(*)::int AS image_count
         FROM training.dataset_items
         GROUP BY dataset_id
       ) imgs ON imgs.dataset_id = r.dataset_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    const trainingSteps = await query(
      `SELECT run_id, jsonb_object_agg(step, status) AS steps
       FROM training.run_steps
       WHERE run_id IN (SELECT id FROM training.runs WHERE user_id = $1)
       GROUP BY run_id`,
      [userId]
    );

    const queue = await query(
      `SELECT *
       FROM (
         SELECT q.position,
                r.id,
                r.name,
                r.status,
                'pipeline'::text AS item_type,
                r.created_at
         FROM pipeline.queue q
         JOIN pipeline.runs r ON r.id = q.run_id
         WHERE r.user_id = $1
         UNION ALL
         SELECT NULL::int AS position,
                tr.id,
                COALESCE(pr.name, tr.id::text) AS name,
                tr.status,
                'training'::text AS item_type,
                tr.created_at
         FROM training.runs tr
         LEFT JOIN pipeline.runs pr ON pr.id = tr.pipeline_run_id
         WHERE tr.user_id = $1
           AND tr.status IN ('credit_pending', 'queued')
       ) items
       ORDER BY
         CASE WHEN item_type = 'pipeline' THEN 0 ELSE 1 END ASC,
         position ASC NULLS LAST,
         created_at ASC`,
      [userId]
    );

    return {
      pipeline_runs: pipelineRuns,
      training_runs: trainingRuns,
      training_steps: trainingSteps,
      pipeline_queue: queue
    };
  });
}
