import type { FastifyInstance } from "fastify";
import { createHash } from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { archivePaths, enqueueCreditIntentWithClient, execute, loadConfig, pool, query } from "@frameworkx/shared";
import { requirePermission } from "../lib/permissions.js";
import { pipeline as streamPipeline } from "node:stream/promises";
import unzipper from "unzipper";

const config = loadConfig(process.cwd());

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp"]);
const videoExtensions = new Set([".mp4", ".mov", ".mkv", ".webm", ".avi", ".mpeg", ".mpg", ".m4v", ".wmv", ".flv"]);

async function inspectArchiveMedia(filePath: string) {
  try {
    const zip = await unzipper.Open.file(filePath);
    let imageCount = 0;
    let videoCount = 0;
    for (const entry of zip.files) {
      if (!entry.path || entry.type !== "File") continue;
      const ext = path.extname(entry.path).toLowerCase();
      if (imageExtensions.has(ext)) imageCount += 1;
      if (videoExtensions.has(ext)) videoCount += 1;
    }
    return {
      image_count: imageCount,
      video_count: videoCount,
      contains_videos: videoCount > 0
    };
  } catch {
    return {
      image_count: 0,
      video_count: 0,
      contains_videos: false
    };
  }
}

function normalizeSettingValue(value: any) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function getGlobalSetting(key: string, fallback: any) {
  const [row] = await query<{ value: any }>(
    "SELECT value FROM core.settings WHERE scope = 'global' AND key = $1 ORDER BY updated_at DESC, created_at DESC LIMIT 1",
    [key]
  );
  return normalizeSettingValue(row?.value ?? fallback);
}

async function countImagesInRun(userId: string, runId: string) {
  const roots = [
    path.join(config.storageRoot, "users", userId, "datasets", runId, "input"),
    path.join(config.storageRoot, "users", userId, "datasets", runId, "workflow", "work"),
    path.join(config.storageRoot, "users", userId, "datasets", runId, "outputs", "datasets")
  ];
  for (const root of roots) {
    try {
      const stat = await fsPromises.stat(root);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }
    let count = 0;
    const stack = [root];
    while (stack.length) {
      const current = stack.pop() as string;
      let entries: fs.Dirent[];
      try {
        entries = await fsPromises.readdir(current, { withFileTypes: true });
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
    if (count > 0) return count;
  }
  return 0;
}

async function findInitialDatasetCoverPath(userId: string, runId: string): Promise<string | null> {
  const runRoot = path.join(config.storageRoot, "users", userId, "datasets", runId);
  const inputRoot = path.join(runRoot, "input");
  if (!fs.existsSync(inputRoot)) return null;

  const queue = [inputRoot];
  while (queue.length) {
    const current = queue.shift() as string;
    let entries: fs.Dirent[] = [];
    try {
      entries = await fsPromises.readdir(current, { withFileTypes: true });
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
      if (!imageExtensions.has(ext)) continue;
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

async function requireAuthOrToken(request: any, reply: any) {
  try {
    if (!request.headers.authorization) {
      const query = request.query as { token?: string; access_token?: string };
      const raw = String(query.token || query.access_token || "");
      if (raw) {
        const token = raw.toLowerCase().startsWith("bearer ") ? raw.slice(7).trim() : raw;
        request.headers.authorization = `Bearer ${token}`;
        await request.jwtVerify();
        return;
      }
    }
    await request.jwtVerify();
  } catch {
    reply.code(401);
    throw new Error("unauthorized");
  }
}

async function registerFile(userId: string, filePath: string, kind: string) {
  const stat = await fsPromises.stat(filePath);
  const hash = createHash("sha256");
  const stream = fs.createReadStream(filePath);
  for await (const chunk of stream) {
    hash.update(chunk as Buffer);
  }
  const checksum = hash.digest("hex");
  const id = randomUUID();
  await execute(
    "INSERT INTO files.file_registry (id, owner_user_id, kind, path, checksum, size_bytes, mime_type) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [id, userId, kind, filePath, checksum, stat.size, "application/octet-stream"]
  );
  return id;
}

async function registerFileWithClient(client: any, userId: string, filePath: string, kind: string) {
  const stat = await fsPromises.stat(filePath);
  const hash = createHash("sha256");
  const stream = fs.createReadStream(filePath);
  for await (const chunk of stream) {
    hash.update(chunk as Buffer);
  }
  const checksum = hash.digest("hex");
  const id = randomUUID();
  await client.query(
    "INSERT INTO files.file_registry (id, owner_user_id, kind, path, checksum, size_bytes, mime_type) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [id, userId, kind, filePath, checksum, stat.size, "application/octet-stream"]
  );
  return id;
}

async function releasePipelineCredits(client: any, run: any, reason: string) {
  const flags = run?.flags ?? {};
  const reserved = Number(flags.creditsReserved ?? 0);
  if (!reserved) return;
  const [trainingRef] = (
    await client.query("SELECT id FROM training.runs WHERE pipeline_run_id = $1 LIMIT 1", [run.id])
  ).rows;
  if (trainingRef) return;
  await enqueueCreditIntentWithClient(client, {
    userId: run.user_id,
    action: "release_pipeline",
    amount: reserved,
    refType: "pipeline_run",
    refId: run.id,
    payload: { reason },
    idempotencyKey: `release_pipeline:${run.id}:${reason}`
  });
}

async function cleanupExpiredUploads(userId: string) {
  const expired = await query<{ id: string; path: string }>(
    "SELECT id, path FROM pipeline.staged_uploads WHERE user_id = $1 AND expires_at < NOW()",
    [userId]
  );
  for (const row of expired) {
    try {
      await fsPromises.unlink(row.path);
    } catch {
      // ignore
    }
  }
  await execute("DELETE FROM pipeline.staged_uploads WHERE user_id = $1 AND expires_at < NOW()", [userId]);
}

async function moveFileSafe(src: string, dest: string) {
  try {
    await fsPromises.rename(src, dest);
  } catch {
    await fsPromises.copyFile(src, dest);
    await fsPromises.unlink(src);
  }
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
        (SELECT COUNT(*)::int FROM pipeline.run_files WHERE file_id = $1) AS pipeline_count,
        (SELECT COUNT(*)::int FROM training.datasets WHERE root_file_id = $1) AS dataset_count`,
      [fileId]
    )
  ).rows;
  const total =
    Number(refs?.gallery_count ?? 0) +
    Number(refs?.output_count ?? 0) +
    Number(refs?.training_count ?? 0) +
    Number(refs?.model_count ?? 0) +
    Number(refs?.registry_count ?? 0) +
    Number(refs?.pipeline_count ?? 0) +
    Number(refs?.dataset_count ?? 0);
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
      label: options?.archiveLabel ?? "pipeline_delete",
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
      await fsPromises.unlink(row.path);
    } catch {
      // ignore
    }
  }
}

async function listManualImages(runRoot: string) {
  const images: { path: string; name: string; caption: string; isFace: boolean }[] = [];
  const outputRoot = path.join(runRoot, "outputs", "datasets");
  const workRoot = path.join(runRoot, "workflow", "work");
  const stack = [outputRoot, workRoot];
  while (stack.length) {
    const current = stack.pop() as string;
    let entries: any[];
    try {
      entries = await fsPromises.readdir(current, { withFileTypes: true });
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
      if (![".png", ".jpg", ".jpeg", ".webp", ".bmp"].includes(ext)) continue;
      const relPath = path.relative(runRoot, fullPath);
      let caption = "";
      try {
        const captionPath = fullPath.replace(ext, ".txt");
        caption = await fsPromises.readFile(captionPath, "utf-8");
      } catch {
        caption = "";
      }
      images.push({
        path: relPath,
        name: entry.name,
        caption: caption.trim(),
        isFace: relPath.toLowerCase().includes(`${path.sep}face${path.sep}`) || entry.name.toLowerCase().includes("face")
      });
    }
  }
  return images;
}

function parseTags(caption: string) {
  return String(caption || "")
    .toLowerCase()
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.replace(/\s+/g, "_"));
}

export async function registerPipelineRoutes(app: FastifyInstance) {
  app.get("/api/uploads/staged", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    await cleanupExpiredUploads(userId);
    const rows = await query<{ id: string; original_name: string; size_bytes: number; expires_at: string; path: string }>(
      "SELECT id, original_name, size_bytes, expires_at, path FROM pipeline.staged_uploads WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    const uploads = await Promise.all(
      rows.map(async (row) => {
        const media = await inspectArchiveMedia(row.path);
        return {
          id: row.id,
          name: row.original_name,
          size: row.size_bytes,
          expires_at: row.expires_at,
          ...media
        };
      })
    );
    return {
      uploads
    };
  });

  app.post("/api/uploads/stage", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const parts = await request.files();
    for await (const part of parts) {
      if (part.type !== "file") continue;
      const uploadId = randomUUID();
      const userRoot = path.join(config.storageRoot, "users", userId, "staging");
      await fsPromises.mkdir(userRoot, { recursive: true });
      const filePath = path.join(userRoot, `${uploadId}.zip`);
      await streamPipeline(part.file, fs.createWriteStream(filePath));
      const stat = await fsPromises.stat(filePath);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      const media = await inspectArchiveMedia(filePath);
      await execute(
        "INSERT INTO pipeline.staged_uploads (id, user_id, original_name, size_bytes, path, expires_at) VALUES ($1,$2,$3,$4,$5,$6)",
        [uploadId, userId, part.filename, stat.size, filePath, expiresAt]
      );
      return {
        upload: {
          id: uploadId,
          name: part.filename,
          size: stat.size,
          expires_at: expiresAt,
          ...media
        }
      };
    }
    reply.code(400);
    return { error: "missing_file" };
  });

  app.delete("/api/uploads/stage/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const uploadId = (request.params as { id: string }).id;
    const [row] = await query<{ path: string }>(
      "SELECT path FROM pipeline.staged_uploads WHERE id = $1 AND user_id = $2",
      [uploadId, userId]
    );
    if (!row) {
      reply.code(404);
      return { error: "not_found" };
    }
    try {
      await fsPromises.unlink(row.path);
    } catch {
      // ignore
    }
    await execute("DELETE FROM pipeline.staged_uploads WHERE id = $1 AND user_id = $2", [uploadId, userId]);
    return { status: "ok" };
  });

  app.post("/api/uploads/commit", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const body = request.body as {
      uploads?: string[];
      name?: string;
      note?: string;
      autotag?: boolean;
      autochar?: boolean;
      manualTagging?: boolean;
      tagverify?: boolean;
      facecap?: boolean;
      imagesOnly?: boolean;
      train?: boolean;
      gpu?: boolean;
      baseModelId?: string;
      trainProfile?: string;
      description?: string;
      autocharPresets?: string[];
      samplePrompts?: string[];
    };
    const uploads = Array.isArray(body.uploads) ? body.uploads : [];
    if (!uploads.length) {
      reply.code(400);
      return { error: "missing_uploads" };
    }
    const manualTagging = Boolean(body.manualTagging);
    const flags = {
      autotag: manualTagging ? true : Boolean(body.autotag ?? true),
      autochar: manualTagging ? false : Boolean(body.autochar ?? false),
      manualTagging,
      tagverify: manualTagging ? false : Boolean(body.tagverify ?? false),
      facecap: Boolean(body.facecap ?? false),
      imagesOnly: Boolean(body.imagesOnly ?? false),
      train: Boolean(body.train ?? false),
      gpu: Boolean(body.gpu ?? true),
      baseModelId: body.baseModelId ? String(body.baseModelId) : "",
      trainProfile: body.trainProfile ? String(body.trainProfile) : "",
      autocharPresets: Array.isArray(body.autocharPresets) ? body.autocharPresets : [],
      note: body.note ? String(body.note) : "",
      description: body.description ? String(body.description) : "",
      samplePrompts: Array.isArray(body.samplePrompts) ? body.samplePrompts : [],
      creditsReserved: 0
    };

    if (flags.train) {
      await requirePermission(request, reply, "train.run");
    }
    const trainCost = flags.train ? Number((await getGlobalSetting("credits.train", 5)) ?? 5) || 5 : 0;

    const runIds: string[] = [];
    for (const uploadId of uploads) {
      const [row] = await query<{ original_name: string; path: string }>(
        "SELECT original_name, path FROM pipeline.staged_uploads WHERE id = $1 AND user_id = $2",
        [uploadId, userId]
      );
      if (!row) {
        reply.code(404);
        return { error: "staged_not_found", upload_id: uploadId };
      }
      const runId = randomUUID();
      const userRoot = path.join(config.storageRoot, "users", userId, "datasets", runId);
      await fsPromises.mkdir(userRoot, { recursive: true });
      const uploadPath = path.join(userRoot, "input.zip");
      await moveFileSafe(row.path, uploadPath);
      const rawName = body.name ? String(body.name) : row.original_name;
      const runName = rawName.replace(/\.zip$/i, "").trim();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const fileId = await registerFileWithClient(client, userId, uploadPath, "dataset");
        await client.query(
          "INSERT INTO pipeline.runs (id, user_id, name, status, flags, upload_file_id) VALUES ($1,$2,$3,'queued',$4,$5)",
          [runId, userId, runName || `run_${runId}`, flags, fileId]
        );
        await client.query(
          "INSERT INTO files.lineage (id, file_id, source_type, source_id, source_run_id) VALUES ($1,$2,$3,$4,$5)",
          [randomUUID(), fileId, "pipeline_run_upload", runId, runId]
        );
        const posRows = await client.query<{ max: number }>(
          "SELECT COALESCE(MAX(position), 0)::int AS max FROM pipeline.queue"
        );
        const pos = Number(posRows.rows[0]?.max ?? 0) + 1;
        await client.query(
          "INSERT INTO pipeline.queue (id, run_id, position) VALUES ($1,$2,$3)",
          [randomUUID(), runId, pos]
        );
        if (flags.train && trainCost > 0) {
          await enqueueCreditIntentWithClient(client, {
            userId,
            action: "reserve_pipeline",
            amount: trainCost,
            refType: "pipeline_run",
            refId: runId,
            payload: { stage: "prep_queue" },
            idempotencyKey: `reserve_pipeline:${runId}`
          });
        }
        await client.query("DELETE FROM pipeline.staged_uploads WHERE id = $1 AND user_id = $2", [uploadId, userId]);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
      runIds.push(runId);
    }
    return { status: "queued", runs: runIds };
  });

  app.post("/api/runs", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const parts = await request.files();
    let name = "";
    let uploadPath = "";
    for await (const part of parts) {
      if (part.type === "field" && part.fieldname === "name") {
        name = String(part.value || "");
      }
      if (part.type === "file") {
        const runId = randomUUID();
        const userRoot = path.join(config.storageRoot, "users", userId, "datasets", runId);
        await fsPromises.mkdir(userRoot, { recursive: true });
        uploadPath = path.join(userRoot, "input.zip");
        await fsPromises.writeFile(uploadPath, await part.toBuffer());
        const fileId = await registerFile(userId, uploadPath, "dataset");
        await execute(
          "INSERT INTO pipeline.runs (id, user_id, name, status, flags, upload_file_id) VALUES ($1,$2,$3,'queued',$4,$5)",
          [runId, userId, name || `run_${runId}`, {}, fileId]
        );
        await execute(
          "INSERT INTO files.lineage (id, file_id, source_type, source_id, source_run_id) VALUES ($1,$2,$3,$4,$5)",
          [randomUUID(), fileId, "pipeline_run_upload", runId, runId]
        );
        const posRows = await query<{ max: number }>("SELECT COALESCE(MAX(position), 0)::int AS max FROM pipeline.queue");
        const pos = Number(posRows[0]?.max ?? 0) + 1;
        await execute(
          "INSERT INTO pipeline.queue (id, run_id, position) VALUES ($1,$2,$3)",
          [randomUUID(), runId, pos]
        );
        return { status: "queued", run_id: runId };
      }
    }
    reply.code(400);
    return { error: "missing_file" };
  });

  app.get("/api/runs", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const rows = await query("SELECT * FROM pipeline.runs WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    return { runs: rows };
  });

  app.get("/api/runs/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const runId = (request.params as { id: string }).id;
    const [run] = await query("SELECT * FROM pipeline.runs WHERE id = $1 AND user_id = $2", [runId, userId]);
    if (!run) {
      reply.code(404);
      return { error: "not_found" };
    }
    const [statusRow] = await query<{ error_message: string | null }>(
      "SELECT error_message FROM ui.pipeline_run_status WHERE run_id = $1",
      [runId]
    );
    const steps = await query(
      "SELECT step, status, meta, updated_at FROM pipeline.run_steps WHERE run_id = $1 ORDER BY updated_at ASC",
      [runId]
    );
    const events = await query(
      "SELECT level, message, details, created_at FROM pipeline.events WHERE run_id = $1 ORDER BY created_at DESC LIMIT 50",
      [runId]
    );
    const previews = await query(
      `SELECT p.job_id, p.file_id, p.position, j.status AS job_status, j.created_at
       FROM generation.previews p
       JOIN generation.jobs j ON j.id = p.job_id
       WHERE j.pipeline_run_id = $1 AND j.user_id = $2
       ORDER BY j.created_at DESC, p.position ASC`,
      [runId, userId]
    );
    const [images] = await query<{ image_count: number }>(
      `SELECT COUNT(*)::int AS image_count
       FROM training.datasets d
       JOIN training.dataset_items i ON i.dataset_id = d.id
       WHERE d.pipeline_run_id = $1`,
      [runId]
    );
    let imageCount = images?.image_count ?? 0;
    if (imageCount === 0) {
      imageCount = await countImagesInRun(userId, runId);
    }
    const [training] = await query(
      `SELECT r.id,
              r.status,
              r.started_at,
              r.updated_at,
              s.epoch,
              s.epoch_total,
              s.step,
              s.step_total,
              s.progress_pct,
              s.eta_seconds,
              s.last_loss,
              s.error_message
       FROM training.runs r
       JOIN training.datasets d ON d.id = r.dataset_id
       LEFT JOIN ui.training_run_status s ON s.training_run_id = r.id
       WHERE d.pipeline_run_id = $1
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [runId]
    );
    const trainingPreviews = training
      ? await query(
          `SELECT a.file_id
           FROM training.artifacts a
           WHERE a.run_id = $1 AND a.kind = 'preview'
           ORDER BY a.created_at DESC`,
          [training.id]
        )
      : [];
    let datasetCoverUrl: string | null = null;
    let datasetCoverFileId: string | null = null;
    const relPath = await findInitialDatasetCoverPath(userId, runId);
    if (relPath) {
      datasetCoverUrl = `/api/runs/${runId}/manual/file?path=${encodeURIComponent(relPath)}`;
    } else {
      const [coverRow] = await query<{ file_id: string }>(
        `SELECT i.file_id
         FROM training.datasets d
         JOIN training.dataset_items i ON i.dataset_id = d.id
         JOIN files.file_registry fr ON fr.id = i.file_id
         WHERE d.pipeline_run_id = $1
           AND (
             fr.mime_type LIKE 'image/%'
             OR fr.path ~* '\\.(png|jpe?g|webp|bmp)$'
           )
         ORDER BY i.created_at ASC
         LIMIT 1`,
        [runId]
      );
      datasetCoverFileId = coverRow?.file_id ?? null;
    }
    return {
      run: {
        ...run,
        error_message: statusRow?.error_message ?? null,
        training: training ?? null,
        image_count: imageCount
      },
      steps,
      events,
      previews,
      training_previews: trainingPreviews,
      dataset_cover_url: datasetCoverUrl,
      dataset_cover_file_id: datasetCoverFileId
    };
  });

  app.post("/api/runs/:id/cancel", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const runId = request.params.id as string;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [run] = (
        await client.query("SELECT id, user_id, status, flags FROM pipeline.runs WHERE id = $1 AND user_id = $2", [
          runId,
          userId
        ])
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
      await client.query("DELETE FROM pipeline.queue WHERE run_id = $1", [runId]);
      await client.query(
        "UPDATE pipeline.runs SET status = 'cancelled', updated_at = NOW(), finished_at = NOW() WHERE id = $1",
        [runId]
      );
      await releasePipelineCredits(client, run, "release_pipeline_cancel");
      await client.query("COMMIT");
      return { status: "cancelled" };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  app.post("/api/runs/:id/retry", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const runId = request.params.id as string;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [run] = (
        await client.query("SELECT id, user_id, status, flags FROM pipeline.runs WHERE id = $1 AND user_id = $2", [
          runId,
          userId
        ])
      ).rows;
      if (!run) {
        await client.query("ROLLBACK");
        reply.code(404);
        return { error: "not_found" };
      }
      if (!["failed", "cancelled", "stopped"].includes(String(run.status))) {
        await client.query("ROLLBACK");
        reply.code(409);
        return { error: "cannot_retry_status" };
      }

      const flags = run.flags ?? {};
      if (flags.train) {
        await requirePermission(request, reply, "train.run");
      }

      await client.query(
        "UPDATE pipeline.run_steps SET status = 'pending', meta = NULL, updated_at = NOW() WHERE run_id = $1",
        [runId]
      );
      await client.query(
        "UPDATE pipeline.runs SET status = 'queued', last_step = NULL, started_at = NULL, finished_at = NULL, flags = $1, updated_at = NOW() WHERE id = $2",
        [flags, runId]
      );
      await client.query("DELETE FROM pipeline.queue WHERE run_id = $1", [runId]);
      const posRows = await client.query<{ max: number }>(
        "SELECT COALESCE(MAX(position), 0)::int AS max FROM pipeline.queue"
      );
      const pos = Number(posRows.rows[0]?.max ?? 0) + 1;
      await client.query(
        "INSERT INTO pipeline.queue (id, run_id, position) VALUES ($1,$2,$3)",
        [randomUUID(), runId, pos]
      );
      await client.query("COMMIT");
      return { status: "queued" };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  app.delete("/api/runs/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const runId = request.params.id as string;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [run] = (
        await client.query(
          "SELECT id, user_id, name, status, flags, upload_file_id, dataset_file_id, lora_file_id FROM pipeline.runs WHERE id = $1 AND user_id = $2",
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

      let trainingRef: { id: string; status: string; output_file_id: string | null } | null = null;
      const [dataset] = (
        await client.query("SELECT id, root_file_id FROM training.datasets WHERE pipeline_run_id = $1", [runId])
      ).rows;
      if (dataset) {
        const [trainingRow] = (
          await client.query(
            "SELECT id, status, output_file_id FROM training.runs WHERE dataset_id = $1 LIMIT 1",
            [dataset.id]
          )
        ).rows;
        if (trainingRow) {
          trainingRef = trainingRow;
          const status = String(trainingRow.status ?? "");
          if (!["failed", "cancelled", "stopped"].includes(status)) {
            await client.query("ROLLBACK");
            reply.code(409);
            return { error: "dataset_in_use" };
          }
          await client.query("DELETE FROM training.metrics WHERE run_id = $1", [trainingRow.id]);
          await client.query("DELETE FROM training.artifacts WHERE run_id = $1", [trainingRow.id]);
          await client.query("DELETE FROM training.runs WHERE id = $1", [trainingRow.id]);
        }
      }

      await client.query("DELETE FROM pipeline.queue WHERE run_id = $1", [runId]);
      await releasePipelineCredits(client, run, "release_pipeline_delete");
      const fileRows = (
        await client.query("SELECT file_id FROM pipeline.run_files WHERE run_id = $1", [runId])
      ).rows as { file_id: string }[];
      const fileIds = new Set<string>(fileRows.map((row) => row.file_id));
      if (run.upload_file_id) fileIds.add(run.upload_file_id);
      if (run.dataset_file_id) fileIds.add(run.dataset_file_id);
      if (run.lora_file_id) fileIds.add(run.lora_file_id);
      if (trainingRef?.output_file_id) fileIds.add(trainingRef.output_file_id);

      let anchorName: string | null = run.name ?? null;
      const getFileBasename = async (fileId?: string | null) => {
        if (!fileId) return null;
        const [row] = (await client.query("SELECT path FROM files.file_registry WHERE id = $1", [fileId])).rows as {
          path?: string;
        }[];
        return row?.path ? path.basename(row.path) : null;
      };
      if (!anchorName) {
        anchorName = (await getFileBasename(run.upload_file_id)) ?? (await getFileBasename(run.dataset_file_id));
      }

      await client.query("DELETE FROM pipeline.run_files WHERE run_id = $1", [runId]);
      await client.query("DELETE FROM pipeline.run_steps WHERE run_id = $1", [runId]);
      await client.query("DELETE FROM pipeline.events WHERE run_id = $1", [runId]);

      if (dataset) {
        await client.query("DELETE FROM training.datasets WHERE id = $1", [dataset.id]);
        if (dataset.root_file_id) {
          fileIds.add(dataset.root_file_id);
        }
      }

      const runRoot = path.join(config.storageRoot, "users", userId, "datasets", runId);
      const trainingRoot =
        dataset && trainingRef ? path.join(config.storageRoot, "users", userId, "training", trainingRef.id) : null;
      const archiveEntries: { path: string }[] = [];
      try {
        await fsPromises.stat(runRoot);
        archiveEntries.push({ path: runRoot });
      } catch {
        // ignore
      }
      if (trainingRoot) {
        try {
          await fsPromises.stat(trainingRoot);
          archiveEntries.push({ path: trainingRoot });
        } catch {
          // ignore
        }
      }
      if (fileIds.size) {
        const filePathRows = (
          await client.query("SELECT path FROM files.file_registry WHERE id = ANY($1::uuid[])", [Array.from(fileIds)])
        ).rows as { path: string | null }[];
        for (const row of filePathRows) {
          if (!row?.path) continue;
          if (row.path.startsWith(runRoot)) continue;
          if (trainingRoot && row.path.startsWith(trainingRoot)) continue;
          if (row.path.includes(`${path.sep}persistent${path.sep}`)) continue;
          archiveEntries.push({ path: row.path });
        }
      }
      if (archiveEntries.length) {
        await archivePaths({
          storageRoot: config.storageRoot,
          userId,
          label: `pipeline_${runId}`,
          entries: archiveEntries,
          manifest: {
            origin: "auto",
            type: "pipeline_run",
            reason: "delete_pipeline_run",
            source_id: runId,
            source_name: anchorName,
            run_id: runId,
            run_name: run.name ?? null,
            user_id: userId,
            file_ids: Array.from(fileIds)
          }
        });
      }

      await client.query("DELETE FROM pipeline.runs WHERE id = $1", [runId]);

      for (const fileId of fileIds) {
        await deleteFileIfUnused(client, fileId, {
          skipArchivePaths: [runRoot, ...(trainingRoot ? [trainingRoot] : [])],
          archiveLabel: "pipeline_delete",
          manifest: { type: "pipeline_output", reason: "delete_pipeline_run", source_id: runId },
          allowPersistentDelete: false
        });
      }

      try {
        await fsPromises.rm(runRoot, { recursive: true, force: true });
      } catch {
        // ignore
      }
      if (trainingRoot) {
        try {
          await fsPromises.rm(trainingRoot, { recursive: true, force: true });
        } catch {
          // ignore
        }
      }

      await client.query("COMMIT");
      return { status: "deleted" };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  app.post("/api/runs/:id/manual/complete", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const runId = (request.params as { id: string }).id;
    const [run] = await query<{ id: string; user_id: string }>(
      "SELECT id, user_id FROM pipeline.runs WHERE id = $1",
      [runId]
    );
    if (!run || run.user_id !== userId) {
      reply.code(404);
      return { error: "not_found" };
    }
    await execute(
      "UPDATE pipeline.run_steps SET status = 'done', updated_at = NOW() WHERE run_id = $1 AND step IN ('manual_pause','manual_edit','manual_done')",
      [runId]
    );
    await execute("UPDATE pipeline.runs SET status = 'queued_initiated', updated_at = NOW() WHERE id = $1", [runId]);
    return { status: "ok" };
  });

  app.get("/api/runs/:id/manual/dataset", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const runId = (request.params as { id: string }).id;
    const [run] = await query<{ id: string; user_id: string }>(
      "SELECT id, user_id FROM pipeline.runs WHERE id = $1 AND user_id = $2",
      [runId, userId]
    );
    if (!run) {
      reply.code(404);
      return { error: "not_found" };
    }
    const runRoot = path.join(config.storageRoot, "users", userId, "datasets", runId);
    const images = await listManualImages(runRoot);
    return {
      images: images.map((img) => ({
        ...img,
        url: `/api/runs/${runId}/manual/file?path=${encodeURIComponent(img.path)}`
      }))
    };
  });

  app.get("/api/runs/:id/manual/file", { preHandler: requireAuthOrToken }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const runId = (request.params as { id: string }).id;
    const relPath = String((request.query as { path?: string }).path || "");
    if (!relPath) {
      reply.code(400);
      return { error: "missing_path" };
    }
    const runRoot = path.join(config.storageRoot, "users", userId, "datasets", runId);
    const fullPath = path.resolve(runRoot, relPath);
    if (!fullPath.startsWith(runRoot)) {
      reply.code(400);
      return { error: "invalid_path" };
    }
    try {
      const file = await fsPromises.readFile(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      const mime =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";
      reply.header("content-type", mime);
      return reply.send(file);
    } catch {
      reply.code(404);
      return { error: "not_found" };
    }
  });

  app.get("/api/runs/:id/manual/tags", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const runId = (request.params as { id: string }).id;
    const [run] = await query<{ id: string; user_id: string }>(
      "SELECT id, user_id FROM pipeline.runs WHERE id = $1 AND user_id = $2",
      [runId, userId]
    );
    if (!run) {
      reply.code(404);
      return { error: "not_found" };
    }
    const runRoot = path.join(config.storageRoot, "users", userId, "datasets", runId);
    const images = await listManualImages(runRoot);
    const counts = new Map<string, number>();
    for (const img of images) {
      const tags = parseTags(img.caption);
      for (const tag of tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    const tags = Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    return { tags };
  });

  app.post("/api/runs/:id/manual/update", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const runId = (request.params as { id: string }).id;
    const body = request.body as { updates?: { path: string; caption: string }[] };
    const updates = Array.isArray(body.updates) ? body.updates : [];
    if (!updates.length) {
      reply.code(400);
      return { error: "missing_updates" };
    }
    const runRoot = path.join(config.storageRoot, "users", userId, "datasets", runId);
    for (const update of updates) {
      const rel = String(update.path || "");
      if (!rel) continue;
      const fullPath = path.resolve(runRoot, rel);
      if (!fullPath.startsWith(runRoot)) continue;
      const ext = path.extname(fullPath).toLowerCase();
      const captionPath = fullPath.replace(ext, ".txt");
      await fsPromises.writeFile(captionPath, String(update.caption ?? ""), "utf-8");
    }
    return { status: "ok" };
  });

  app.post("/api/runs/:id/manual/tags/remove", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const runId = (request.params as { id: string }).id;
    const body = request.body as { tags?: string[] };
    const tags = Array.isArray(body.tags) ? body.tags.map((t) => String(t).toLowerCase()) : [];
    if (!tags.length) {
      reply.code(400);
      return { error: "missing_tags" };
    }
    const runRoot = path.join(config.storageRoot, "users", userId, "datasets", runId);
    const images = await listManualImages(runRoot);
    const removeSet = new Set(tags);
    let updated = 0;
    for (const img of images) {
      const next = parseTags(img.caption).filter((tag) => !removeSet.has(tag));
      const ext = path.extname(img.path);
      const fullPath = path.resolve(runRoot, img.path);
      const captionPath = fullPath.replace(ext, ".txt");
      await fsPromises.writeFile(captionPath, next.join(", "), "utf-8");
      updated += 1;
    }
    return { status: "ok", updated };
  });

  app.post("/api/runs/:id/manual/commit", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const runId = (request.params as { id: string }).id;
    const [run] = await query<{ id: string; user_id: string }>(
      "SELECT id, user_id FROM pipeline.runs WHERE id = $1 AND user_id = $2",
      [runId, userId]
    );
    if (!run) {
      reply.code(404);
      return { error: "not_found" };
    }
    const runRoot = path.join(config.storageRoot, "users", userId, "datasets", runId);
    const images = await listManualImages(runRoot);
    const missing = images.filter((img) => !parseTags(img.caption).length).map((img) => img.name);
    if (missing.length) {
      reply.code(400);
      return { error: "missing_tags", missing };
    }
    await execute(
      "UPDATE pipeline.run_steps SET status = 'done', updated_at = NOW() WHERE run_id = $1 AND step IN ('manual_pause','manual_edit','manual_done')",
      [runId]
    );
    await execute("UPDATE pipeline.runs SET status = 'queued_initiated', last_step = 'manual_done', updated_at = NOW() WHERE id = $1", [
      runId
    ]);
    return { status: "ok" };
  });

  app.get("/api/autochar/presets", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const rows = await query(
      "SELECT id, name, description, patterns FROM pipeline.autochar_presets WHERE user_id = $1 ORDER BY name ASC",
      [userId]
    );
    return { presets: rows };
  });

  app.post("/api/autochar/presets", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const body = request.body as { name?: string; description?: string; patterns?: string[] };
    const name = String(body.name ?? "").trim();
    if (!name) {
      reply.code(400);
      return { error: "name_required" };
    }
    const patterns = Array.isArray(body.patterns) ? body.patterns.map((p) => String(p).trim()).filter(Boolean) : [];
    try {
      await execute(
        "INSERT INTO pipeline.autochar_presets (id, user_id, name, description, patterns) VALUES ($1,$2,$3,$4,$5)",
        [randomUUID(), userId, name, body.description ?? "", patterns]
      );
    } catch (err: any) {
      if (String(err?.code) === "23505") {
        reply.code(409);
        return { error: "preset_exists" };
      }
      throw err;
    }
    return { status: "ok" };
  });

  app.put("/api/autochar/presets/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const presetId = request.params.id as string;
    const body = request.body as { name?: string; description?: string; patterns?: string[] };
    const name = body.name !== undefined ? String(body.name).trim() : undefined;
    const patterns = Array.isArray(body.patterns) ? body.patterns.map((p) => String(p).trim()).filter(Boolean) : undefined;
    if (name !== undefined && !name) {
      reply.code(400);
      return { error: "name_required" };
    }
    const [row] = await query("SELECT id FROM pipeline.autochar_presets WHERE id = $1 AND user_id = $2", [
      presetId,
      userId
    ]);
    if (!row) {
      reply.code(404);
      return { error: "not_found" };
    }
    try {
      await execute(
        `UPDATE pipeline.autochar_presets
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             patterns = COALESCE($3, patterns),
             updated_at = NOW()
         WHERE id = $4 AND user_id = $5`,
        [name ?? null, body.description ?? null, patterns ?? null, presetId, userId]
      );
    } catch (err: any) {
      if (String(err?.code) === "23505") {
        reply.code(409);
        return { error: "preset_exists" };
      }
      throw err;
    }
    return { status: "ok" };
  });

  app.delete("/api/autochar/presets/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const presetId = request.params.id as string;
    const [row] = await query("SELECT id FROM pipeline.autochar_presets WHERE id = $1 AND user_id = $2", [
      presetId,
      userId
    ]);
    if (!row) {
      reply.code(404);
      return { error: "not_found" };
    }
    await execute("DELETE FROM pipeline.autochar_presets WHERE id = $1 AND user_id = $2", [presetId, userId]);
    return { status: "ok" };
  });
}
