import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { archivePaths, enqueueCreditIntentWithClient, loadConfig, query, pool } from "@frameworkx/shared";
import { requirePermission } from "../lib/permissions.js";

const config = loadConfig(process.cwd());
const previewExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const datasetImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp"]);
const ACTIVE_TRAINING_STATUSES = ["credit_pending", "queued", "running", "removing"];
const TERMINAL_TRAINING_STATUSES = ["failed", "cancelled", "stopped", "completed", "remove_failed"];

function guessMime(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

async function syncTrainingPreviewArtifacts(runId: string, userId: string) {
  const outputDir = path.join(config.storageRoot, "users", userId, "training", runId);
  const previewDirs = [path.join(outputDir, "sample"), path.join(outputDir, "samples")];
  const files: string[] = [];
  for (const dir of previewDirs) {
    if (!fsSync.existsSync(dir)) continue;
    let entries: fsSync.Dirent[] = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!previewExtensions.has(ext)) continue;
      files.push(path.join(dir, entry.name));
    }
  }
  if (!files.length) return;
  files.sort();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const filePath of files) {
      const stat = await fs.stat(filePath);
      const existing = await client.query<{ id: string }>("SELECT id FROM files.file_registry WHERE path = $1 LIMIT 1", [filePath]);
      const fileId = existing.rows[0]?.id ?? randomUUID();
      if (!existing.rows[0]?.id) {
        await client.query(
          `INSERT INTO files.file_registry
            (id, owner_user_id, kind, path, size_bytes, mime_type)
           VALUES
            ($1,$2,'image',$3,$4,$5)`,
          [fileId, userId, filePath, Number(stat.size || 0), guessMime(filePath)]
        );
      }
      await client.query(
        `INSERT INTO training.artifacts (id, run_id, kind, file_id)
         SELECT $1,$2,'preview',$3
         WHERE NOT EXISTS (
           SELECT 1 FROM training.artifacts
           WHERE run_id = $2 AND kind = 'preview' AND file_id = $3
         )`,
        [randomUUID(), runId, fileId]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function findInitialDatasetCoverPath(userId: string, pipelineRunId: string): Promise<string | null> {
  const runRoot = path.join(config.storageRoot, "users", userId, "datasets", pipelineRunId);
  const inputRoot = path.join(runRoot, "input");
  if (!fsSync.existsSync(inputRoot)) return null;

  const queue = [inputRoot];
  while (queue.length) {
    const current = queue.shift() as string;
    let entries: fsSync.Dirent[] = [];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith("_")) continue;
        queue.push(fullPath);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!datasetImageExtensions.has(ext)) continue;
      const relPath = path.relative(runRoot, fullPath);
      if (!relPath || relPath.startsWith("..")) continue;
      return relPath;
    }
  }
  return null;
}

async function requireAuth(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401);
    throw new Error("unauthorized");
  }
}

async function getGlobalSetting(key: string, fallback: any) {
  const rows = await query<{ value: any }>(
    "SELECT value FROM core.settings WHERE scope = 'global' AND key = $1 ORDER BY updated_at DESC, created_at DESC LIMIT 1",
    [key]
  );
  return rows[0]?.value ?? fallback;
}

async function deleteFileIfUnused(
  client: any,
  fileId: string,
  options?: {
    skipArchivePaths?: string[];
    archiveLabel?: string;
    manifest?: Record<string, any>;
    allowPersistentDelete?: boolean;
  }
) {
  const [refs] = (
    await client.query(
      `SELECT
        (SELECT COUNT(*)::int FROM gallery.images WHERE file_id = $1) AS gallery_count,
        (SELECT COUNT(*)::int FROM generation.outputs WHERE file_id = $1) AS output_count,
        (SELECT COUNT(*)::int FROM training.runs WHERE output_file_id = $1) AS training_count,
        (SELECT COUNT(*)::int FROM gallery.models WHERE model_file_id = $1) AS model_count,
        (SELECT COUNT(*)::int FROM core.model_registry WHERE file_id = $1) AS registry_count,
        (SELECT COUNT(*)::int FROM gallery.loras WHERE file_id = $1 OR dataset_file_id = $1) AS lora_count,
        (SELECT COUNT(*)::int FROM gallery.lora_previews WHERE file_id = $1) AS lora_preview_count,
        (SELECT COUNT(*)::int FROM generation.jobs WHERE model_file_id = $1 OR ($1::uuid = ANY(COALESCE(lora_file_ids, '{}'::uuid[])))) AS generation_job_count,
        (SELECT COUNT(*)::int FROM pipeline.run_files WHERE file_id = $1) AS pipeline_run_file_count,
        (SELECT COUNT(*)::int FROM pipeline.runs WHERE upload_file_id = $1 OR dataset_file_id = $1 OR lora_file_id = $1) AS pipeline_run_count,
        (SELECT COUNT(*)::int FROM training.datasets WHERE root_file_id = $1) AS training_dataset_count`,
      [fileId]
    )
  ).rows;
  const total =
    Number(refs?.gallery_count ?? 0) +
    Number(refs?.output_count ?? 0) +
    Number(refs?.training_count ?? 0) +
    Number(refs?.model_count ?? 0) +
    Number(refs?.registry_count ?? 0) +
    Number(refs?.lora_count ?? 0) +
    Number(refs?.lora_preview_count ?? 0) +
    Number(refs?.generation_job_count ?? 0) +
    Number(refs?.pipeline_run_file_count ?? 0) +
    Number(refs?.pipeline_run_count ?? 0) +
    Number(refs?.training_dataset_count ?? 0);
  if (total > 0) return;

  const [row] = (await client.query("SELECT path, owner_user_id FROM files.file_registry WHERE id = $1", [fileId])).rows;
  const skipArchive = options?.skipArchivePaths?.some((root) => row?.path?.startsWith(root ?? "")) ?? false;
  if (row?.path?.includes(`${path.sep}persistent${path.sep}`) && !options?.allowPersistentDelete) {
    return;
  }
  if (row?.path && !skipArchive) {
    await archivePaths({
      storageRoot: config.storageRoot,
      userId: row.owner_user_id,
      label: options?.archiveLabel ?? "training_delete",
      entries: [{ path: row.path }],
      manifest: {
        origin: "auto",
        type: "file_cleanup",
        reason: "delete_unused",
        file_id: fileId,
        ...options?.manifest
      }
    });
  }
  await client.query("DELETE FROM files.lineage WHERE file_id = $1", [fileId]);
  await client.query("DELETE FROM files.file_registry WHERE id = $1", [fileId]);
  if (row?.path) {
    try {
      await fs.unlink(row.path);
    } catch {
      // ignore
    }
  }
}

export async function registerTrainingRoutes(app: FastifyInstance) {
  app.get("/api/training/profiles", { preHandler: requireAuth }, async () => {
    const rows = await query(
      "SELECT id, name, label, category, tier, is_default FROM training.profiles ORDER BY category, tier, name"
    );
    return { profiles: rows };
  });

  app.get("/api/training/datasets", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const rows = await query("SELECT * FROM training.datasets WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    return { datasets: rows };
  });

  app.get("/api/training/runs", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const rows = await query("SELECT * FROM training.runs WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    return { runs: rows };
  });

  app.get("/api/training/runs/:id/details", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const runId = request.params.id as string;
    const [run] = (
      await pool.query(
        `SELECT r.*,
                pr.name,
                s.status AS status_live,
                s.progress_pct,
                s.eta_seconds,
                s.epoch,
                s.epoch_total,
                s.step,
                s.step_total,
                s.last_loss,
                s.error_message
         FROM training.runs r
         LEFT JOIN pipeline.runs pr ON pr.id = r.pipeline_run_id
         LEFT JOIN ui.training_run_status s ON s.training_run_id = r.id
         WHERE r.id = $1 AND r.user_id = $2`,
        [runId, userId]
      )
    ).rows;
    if (!run) {
      reply.code(404);
      return { error: "not_found" };
    }
    const steps = await query("SELECT step, status, updated_at FROM training.run_steps WHERE run_id = $1", [runId]);
    const [images] = await query<{ image_count: number }>(
      "SELECT COUNT(*)::int AS image_count FROM training.dataset_items WHERE dataset_id = $1",
      [run.dataset_id]
    );
    if (run.status === "running" || run.status === "queued" || run.status === "completed") {
      try {
        await syncTrainingPreviewArtifacts(runId, userId);
      } catch {
        // best effort sync for live previews; do not fail details endpoint
      }
    }
    const trainingPreviews = await query<{ file_id: string; epoch: number | null }>(
      `SELECT a.file_id,
              NULLIF((regexp_match(fr.path, '_e([0-9]+)_'))[1], '')::int AS epoch
       FROM training.artifacts a
       LEFT JOIN files.file_registry fr ON fr.id = a.file_id
       WHERE a.run_id = $1
         AND a.kind = 'preview'
       ORDER BY a.created_at DESC`,
      [runId]
    );
    let datasetCoverUrl: string | null = null;
    let datasetCoverFileId: string | null = null;
    if (run.pipeline_run_id) {
      const relPath = await findInitialDatasetCoverPath(userId, String(run.pipeline_run_id));
      if (relPath) {
        datasetCoverUrl = `/api/runs/${run.pipeline_run_id}/manual/file?path=${encodeURIComponent(relPath)}`;
      }
    }
    if (!datasetCoverUrl && run.dataset_id) {
      const [coverRow] = await query<{ file_id: string }>(
        `SELECT i.file_id
         FROM training.dataset_items i
         JOIN files.file_registry fr ON fr.id = i.file_id
         WHERE i.dataset_id = $1
           AND (
             fr.mime_type LIKE 'image/%'
             OR fr.path ~* '\\.(png|jpe?g|webp|bmp)$'
           )
         ORDER BY i.created_at ASC
         LIMIT 1`,
        [run.dataset_id]
      );
      datasetCoverFileId = coverRow?.file_id ?? null;
    }
    return {
      run,
      steps,
      image_count: images?.image_count ?? 0,
      training_previews: trainingPreviews,
      dataset_cover_url: datasetCoverUrl,
      dataset_cover_file_id: datasetCoverFileId
    };
  });

  app.post("/api/training/runs", { preHandler: requireAuth }, async (request: any, reply) => {
    await requirePermission(request, reply, "train.run");
    const userId = request.user.sub as string;
    const body = request.body as {
      dataset_id?: string;
      base_model_file_id?: string;
      settings?: Record<string, unknown>;
    };
    if (!body.dataset_id || !body.base_model_file_id) {
      reply.code(400);
      return { error: "missing_fields" };
    }

    const cost = Number((await getGlobalSetting("credits.train", 5)) ?? 5);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const runId = randomUUID();
      let settings = body.settings ?? {};
      if (!Object.keys(settings).length) {
        const profileResult = await client.query("SELECT settings FROM training.profiles WHERE is_default = true LIMIT 1");
        const profile = profileResult.rows[0];
        if (profile?.settings) {
          settings = profile.settings;
        }
      }
      await client.query(
        "INSERT INTO training.runs (id, user_id, dataset_id, status, base_model_file_id, credits_reserved, settings) VALUES ($1,$2,$3,'credit_pending',$4,0,$5)",
        [runId, userId, body.dataset_id, body.base_model_file_id, settings]
      );
      await enqueueCreditIntentWithClient(client, {
        userId,
        action: "reserve_train",
        amount: cost,
        refType: "training_run",
        refId: runId,
        payload: {},
        idempotencyKey: `reserve_train:${runId}`
      });

      await client.query("COMMIT");
      return { status: "credit_pending", run_id: runId };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  app.post("/api/training/runs/:id/cancel", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const runId = request.params.id as string;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [run] = (
        await client.query(
          "SELECT id, status, credits_reserved, credits_charged_at, credits_released_at, pipeline_run_id, dataset_id FROM training.runs WHERE id = $1 AND user_id = $2",
          [runId, userId]
        )
      ).rows;
      if (!run) {
        await client.query("ROLLBACK");
        reply.code(404);
        return { error: "not_found" };
      }
      if (run.status === "running") {
        await client.query("ROLLBACK");
        reply.code(409);
        return { error: "cannot_cancel_running" };
      }
      if (run.credits_reserved && !run.credits_charged_at && !run.credits_released_at) {
        await enqueueCreditIntentWithClient(client, {
          userId,
          action: "release_train",
          amount: Number(run.credits_reserved),
          refType: "training_run",
          refId: runId,
          payload: { reason: "cancel_training_run" },
          idempotencyKey: `release_train:${runId}:cancel`
        });
      }
      await client.query(
        "UPDATE training.runs SET status = 'cancelled', updated_at = NOW(), finished_at = NOW() WHERE id = $1",
        [runId]
      );
      if (run.pipeline_run_id && run.dataset_id) {
        const [activeRun] = (
          await client.query(
            "SELECT id FROM training.runs WHERE dataset_id = $1 AND id <> $2 AND status = ANY($3::text[]) LIMIT 1",
            [run.dataset_id, runId, ACTIVE_TRAINING_STATUSES]
          )
        ).rows;
        if (!activeRun) {
          await client.query(
            "UPDATE pipeline.runs SET status = 'ready_to_train', last_step = 'ready_to_train', updated_at = NOW() WHERE id = $1 AND status IN ('training_credit_pending','training_queued')",
            [run.pipeline_run_id]
          );
        }
      }
      await client.query("COMMIT");
      return { status: "cancelled" };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  app.post("/api/training/runs/:id/retry", { preHandler: requireAuth }, async (request: any, reply) => {
    await requirePermission(request, reply, "train.run");
    const userId = request.user.sub as string;
    const sourceRunId = request.params.id as string;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [sourceRun] = (
        await client.query(
          `SELECT id, status, dataset_id, pipeline_run_id, base_model_file_id, dataset_file_id, settings
           FROM training.runs
           WHERE id = $1 AND user_id = $2`,
          [sourceRunId, userId]
        )
      ).rows;
      if (!sourceRun) {
        await client.query("ROLLBACK");
        reply.code(404);
        return { error: "not_found" };
      }
      const sourceStatus = String(sourceRun.status ?? "");
      if (!TERMINAL_TRAINING_STATUSES.includes(sourceStatus)) {
        await client.query("ROLLBACK");
        reply.code(409);
        return { error: "cannot_retry_status" };
      }
      if (!sourceRun.dataset_id) {
        await client.query("ROLLBACK");
        reply.code(409);
        return { error: "dataset_not_ready" };
      }

      const [dataset] = (
        await client.query("SELECT id, status, root_file_id FROM training.datasets WHERE id = $1 AND user_id = $2", [
          sourceRun.dataset_id,
          userId
        ])
      ).rows;
      if (!dataset) {
        await client.query("ROLLBACK");
        reply.code(409);
        return { error: "dataset_not_ready" };
      }

      const [activeRun] = (
        await client.query(
          "SELECT id FROM training.runs WHERE dataset_id = $1 AND status = ANY($2::text[]) LIMIT 1 FOR UPDATE",
          [sourceRun.dataset_id, ACTIVE_TRAINING_STATUSES]
        )
      ).rows;
      if (activeRun) {
        await client.query("ROLLBACK");
        reply.code(409);
        return { error: "active_training_exists" };
      }

      const runId = randomUUID();
      const cost = Number((await getGlobalSetting("credits.train", 5)) ?? 5);
      await client.query(
        `INSERT INTO training.runs
          (id, user_id, pipeline_run_id, dataset_id, status, base_model_file_id, dataset_file_id, credits_reserved, settings)
         VALUES ($1,$2,$3,$4,'credit_pending',$5,$6,0,$7)`,
        [
          runId,
          userId,
          sourceRun.pipeline_run_id ?? null,
          sourceRun.dataset_id,
          sourceRun.base_model_file_id ?? null,
          sourceRun.dataset_file_id ?? dataset.root_file_id ?? null,
          sourceRun.settings ?? {}
        ]
      );
      await enqueueCreditIntentWithClient(client, {
        userId,
        action: "reserve_train",
        amount: cost,
        refType: "training_run",
        refId: runId,
        payload: { reason: "retry_training_run", source_run_id: sourceRunId, pipeline_run_id: sourceRun.pipeline_run_id ?? null },
        idempotencyKey: `reserve_train:${runId}`
      });
      if (sourceRun.pipeline_run_id) {
        await client.query(
          "UPDATE pipeline.runs SET status = 'training_credit_pending', last_step = 'training_credit_pending', updated_at = NOW() WHERE id = $1",
          [sourceRun.pipeline_run_id]
        );
      }

      await client.query("COMMIT");
      return { status: "credit_pending", run_id: runId, source_run_id: sourceRunId };
    } catch (err: any) {
      await client.query("ROLLBACK");
      if (err?.code === "23505") {
        reply.code(409);
        return { error: "active_training_exists" };
      }
      throw err;
    } finally {
      client.release();
    }
  });

  app.delete("/api/training/runs/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const runId = request.params.id as string;
    const client = await pool.connect();
    let run: any | null = null;
    try {
      await client.query("BEGIN");
      [run] = (
        await client.query(
          "SELECT id, user_id, status, output_file_id, credits_reserved, credits_charged_at, credits_released_at, pipeline_run_id, dataset_id, dataset_file_id FROM training.runs WHERE id = $1 AND user_id = $2",
          [runId, userId]
        )
      ).rows;
      if (!run) {
        await client.query("ROLLBACK");
        reply.code(404);
        return { error: "not_found" };
      }
      if (run.status === "running") {
        await client.query("ROLLBACK");
        reply.code(409);
        return { error: "cannot_delete_running" };
      }
      if (run.status === "removing") {
        await client.query("ROLLBACK");
        reply.code(409);
        return { error: "already_removing" };
      }

      await client.query("UPDATE training.runs SET status = 'removing', updated_at = NOW() WHERE id = $1", [runId]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }

    try {
      await client.query("BEGIN");
      const [freshRun] = (
        await client.query(
          "SELECT id, user_id, status, output_file_id, credits_reserved, credits_charged_at, credits_released_at, pipeline_run_id, dataset_id, dataset_file_id FROM training.runs WHERE id = $1 AND user_id = $2 FOR UPDATE",
          [runId, userId]
        )
      ).rows;
      if (!freshRun) {
        await client.query("ROLLBACK");
        return { status: "deleted" };
      }
      run = freshRun;

      await client.query("DELETE FROM training.metrics WHERE run_id = $1", [runId]);
      const previewRows = (
        await client.query<{ file_id: string }>(
          "SELECT file_id FROM training.artifacts WHERE run_id = $1 AND kind = 'preview'",
          [runId]
        )
      ).rows;
      const previewFileIds = previewRows.map((row) => row.file_id).filter(Boolean);
      await client.query("DELETE FROM training.artifacts WHERE run_id = $1", [runId]);

      if (run.credits_reserved && !run.credits_charged_at && !run.credits_released_at) {
        await enqueueCreditIntentWithClient(client, {
          userId,
          action: "release_train",
          amount: Number(run.credits_reserved),
          refType: "training_run",
          refId: runId,
          payload: { reason: "delete_training_run" },
          idempotencyKey: `release_train:${runId}:delete`
        });
      }
      await client.query("DELETE FROM training.runs WHERE id = $1", [runId]);
      if (run.pipeline_run_id && run.dataset_id) {
        const [activeRun] = (
          await client.query(
            "SELECT id FROM training.runs WHERE dataset_id = $1 AND status = ANY($2::text[]) LIMIT 1",
            [run.dataset_id, ACTIVE_TRAINING_STATUSES]
          )
        ).rows;
        if (!activeRun) {
          await client.query(
            "UPDATE pipeline.runs SET status = 'ready_to_train', last_step = 'ready_to_train', updated_at = NOW() WHERE id = $1 AND status IN ('training_credit_pending','training_queued')",
            [run.pipeline_run_id]
          );
        }
      }

      const outputRoot = path.join(config.storageRoot, "users", userId, "training", runId);
      let datasetRoot: string | null = null;
      let datasetRootFileId: string | null = null;
      if (run.dataset_id) {
        const [remainingRun] = (
          await client.query("SELECT id FROM training.runs WHERE dataset_id = $1 LIMIT 1", [run.dataset_id])
        ).rows;
        if (!remainingRun) {
          const [datasetRow] = (
            await client.query("SELECT id, root_file_id, pipeline_run_id FROM training.datasets WHERE id = $1", [run.dataset_id])
          ).rows as { id: string; root_file_id: string | null; pipeline_run_id: string | null }[];
          if (datasetRow) {
            let pipelineStatus = "";
            if (datasetRow.pipeline_run_id) {
              const [pipelineRow] = (
                await client.query("SELECT status FROM pipeline.runs WHERE id = $1", [datasetRow.pipeline_run_id])
              ).rows as { status?: string }[];
              pipelineStatus = String(pipelineRow?.status ?? "");
            }
            const canDeleteDataset =
              !datasetRow.pipeline_run_id ||
              ["completed", "failed", "cancelled", "stopped", "remove_failed"].includes(pipelineStatus);
            if (canDeleteDataset) {
              if (datasetRow.pipeline_run_id) {
                await client.query(
                  "UPDATE pipeline.runs SET dataset_file_id = NULL, updated_at = NOW() WHERE id = $1",
                  [datasetRow.pipeline_run_id]
                );
              }
              await client.query("DELETE FROM training.datasets WHERE id = $1", [datasetRow.id]);
              datasetRootFileId = datasetRow.root_file_id ?? null;
              if (datasetRow.pipeline_run_id) {
                datasetRoot = path.join(config.storageRoot, "users", userId, "datasets", datasetRow.pipeline_run_id);
              }
            }
          }
        }
      }
      let anchorName: string | null = null;
      if (run.pipeline_run_id) {
        const [pipelineRow] = (
          await client.query("SELECT name, upload_file_id, dataset_file_id FROM pipeline.runs WHERE id = $1", [
            run.pipeline_run_id
          ])
        ).rows as { name?: string | null; upload_file_id?: string | null; dataset_file_id?: string | null }[];
        anchorName = pipelineRow?.name ?? null;
        if (!anchorName) {
          const fileId = pipelineRow?.upload_file_id ?? pipelineRow?.dataset_file_id ?? null;
          if (fileId) {
            const [fileRow] = (await client.query("SELECT path FROM files.file_registry WHERE id = $1", [fileId]))
              .rows as { path?: string }[];
            if (fileRow?.path) anchorName = path.basename(fileRow.path);
          }
        }
      }
      if (!anchorName && run.dataset_file_id) {
        const [fileRow] = (await client.query("SELECT path FROM files.file_registry WHERE id = $1", [run.dataset_file_id]))
          .rows as { path?: string }[];
        if (fileRow?.path) anchorName = path.basename(fileRow.path);
      }
      const archiveEntries: { path: string }[] = [];
      try {
        await fs.stat(outputRoot);
        archiveEntries.push({ path: outputRoot });
      } catch {
        // ignore
      }
      if (datasetRoot) {
        try {
          await fs.stat(datasetRoot);
          archiveEntries.push({ path: datasetRoot });
        } catch {
          // ignore
        }
      }
      if (run.output_file_id) {
        const rows = (
          await client.query("SELECT path FROM files.file_registry WHERE id = $1", [run.output_file_id])
        ).rows as { path: string | null }[];
        const row = rows[0];
        if (row?.path && !row.path.startsWith(outputRoot) && !row.path.includes(`${path.sep}persistent${path.sep}`)) {
          archiveEntries.push({ path: row.path });
        }
      }
      if (archiveEntries.length) {
        await archivePaths({
          storageRoot: config.storageRoot,
          userId,
          label: `training_${runId}`,
          entries: archiveEntries,
          manifest: {
            origin: "auto",
            type: "training_run",
            reason: "delete_training_run",
            source_id: runId,
            source_name: anchorName,
            run_id: runId,
            user_id: userId,
            output_file_id: run.output_file_id
          }
        });
      }

      if (run.output_file_id) {
        await deleteFileIfUnused(client, run.output_file_id, {
          skipArchivePaths: [outputRoot, ...(datasetRoot ? [datasetRoot] : [])],
          archiveLabel: "training_delete",
          manifest: { type: "training_output", reason: "delete_training_run", source_id: runId },
          allowPersistentDelete: false
        });
      }
      if (datasetRootFileId) {
        await deleteFileIfUnused(client, datasetRootFileId, {
          skipArchivePaths: [outputRoot, ...(datasetRoot ? [datasetRoot] : [])],
          archiveLabel: "training_delete",
          manifest: { type: "training_dataset", reason: "delete_training_run", source_id: runId },
          allowPersistentDelete: false
        });
      }
      for (const fileId of previewFileIds) {
        await deleteFileIfUnused(client, fileId, {
          skipArchivePaths: [outputRoot, ...(datasetRoot ? [datasetRoot] : [])],
          archiveLabel: "training_delete",
          manifest: { type: "training_preview", reason: "delete_training_run", source_id: runId },
          allowPersistentDelete: true
        });
      }

      try {
        await fs.rm(outputRoot, { recursive: true, force: true });
      } catch {
        // ignore
      }
      if (datasetRoot) {
        try {
          await fs.rm(datasetRoot, { recursive: true, force: true });
        } catch {
          // ignore
        }
      }

      await client.query("COMMIT");
      return { status: "deleted" };
    } catch (err) {
      await client.query("ROLLBACK");
      try {
        await client.query(
          "UPDATE training.runs SET status = 'remove_failed', updated_at = NOW() WHERE id = $1 AND user_id = $2",
          [runId, userId]
        );
      } catch {
        // best effort status update
      }
      throw err;
    } finally {
      client.release();
    }
  });
}
