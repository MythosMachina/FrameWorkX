import type { FastifyInstance } from "fastify";
import { randomUUID, createHash } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import {
  archivePaths,
  enqueueCreditIntentWithClient,
  enqueueNotificationEventWithClient,
  execute,
  loadConfig,
  pool,
  query
} from "@frameworkx/shared";
import { requirePermission } from "../lib/permissions.js";
import { pipeline as streamPipeline } from "node:stream/promises";
import { Transform } from "node:stream";

const config = loadConfig(process.cwd());

async function requireAuth(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401);
    throw new Error("unauthorized");
  }
}

export async function registerLoraRoutes(app: FastifyInstance) {
  const DEFAULT_PREVIEW_PROMPTS = [
    "standing, arms crossed",
    "standing, weight on one leg, casual pose",
    "walking, mid-step, relaxed",
    "sitting cross-legged, relaxed posture",
    "lying on side, hand under head",
    "lying on stomach, head resting on arms",
    "kneeling on both knees, upright posture",
    "crouching low, ready to spring",
    "jumping, arms and legs spread",
    "spinning, dynamic motion blur implied",
    "portrait, hand on chin, thoughtful"
  ];

  const requireAdminOrOwner = async (userId: string, ownerId: string) => {
    if (userId === ownerId) return true;
    const [role] = await query<{ name: string }>(
      "SELECT r.name FROM core.users u JOIN core.roles r ON r.id = u.role_id WHERE u.id = $1",
      [userId]
    );
    return role?.name === "admin";
  };

  const isAdmin = async (userId: string) => {
    const [role] = await query<{ name: string }>(
      "SELECT r.name FROM core.users u JOIN core.roles r ON r.id = u.role_id WHERE u.id = $1",
      [userId]
    );
    return role?.name === "admin";
  };

  const deleteFileIfUnused = async (
    fileId: string,
    options?: {
      skipArchive?: boolean;
      archiveLabel?: string;
      manifest?: Record<string, any>;
      allowPersistentDelete?: boolean;
    }
  ) => {
    const [file] = await query<{ path: string; owner_user_id: string | null }>(
      "SELECT path, owner_user_id FROM files.file_registry WHERE id = $1",
      [fileId]
    );
    if (!file) return;
    const refs = await query(
      `SELECT 1 FROM gallery.lora_previews WHERE file_id = $1
       UNION ALL SELECT 1 FROM training.artifacts WHERE file_id = $1
       UNION ALL SELECT 1 FROM gallery.images WHERE file_id = $1
       UNION ALL SELECT 1 FROM generation.outputs WHERE file_id = $1
       UNION ALL SELECT 1 FROM gallery.models WHERE model_file_id = $1
       UNION ALL SELECT 1 FROM gallery.loras WHERE file_id = $1 OR dataset_file_id = $1
       UNION ALL SELECT 1 FROM training.datasets WHERE root_file_id = $1
       UNION ALL SELECT 1 FROM pipeline.runs WHERE upload_file_id = $1 OR dataset_file_id = $1 OR lora_file_id = $1
       UNION ALL SELECT 1 FROM generation.jobs WHERE model_file_id = $1 OR ($1::uuid = ANY(COALESCE(lora_file_ids, '{}'::uuid[])))
       LIMIT 1`,
      [fileId]
    );
    if (refs.length) return;
    if (file.path?.includes(`${path.sep}persistent${path.sep}`) && !options?.allowPersistentDelete) {
      return;
    }
    if (file.path && !options?.skipArchive) {
      await archivePaths({
        storageRoot: config.storageRoot,
        userId: file.owner_user_id,
        label: options?.archiveLabel ?? "lora_delete",
        entries: [{ path: file.path }],
        manifest: {
          origin: "auto",
          type: "file_cleanup",
          reason: "delete_unused",
          file_id: fileId,
          ...options?.manifest
        }
      });
    }
    await execute("DELETE FROM files.file_registry WHERE id = $1", [fileId]);
    try {
      await fs.unlink(file.path);
    } catch {
      // ignore
    }
  };

  const parsePreviewPromptsSetting = (value: any) => {
    if (Array.isArray(value)) {
      return value.map((line) => String(line ?? "").trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    }
    if (value && typeof value === "object" && Array.isArray(value.prompts)) {
      return value.prompts.map((line: any) => String(line ?? "").trim()).filter(Boolean);
    }
    return [];
  };

  const loadPreviewPrompts = async () => {
    const [row] = await query<{ value: any }>(
      `SELECT value
       FROM core.settings
       WHERE scope = 'global' AND key = 'lora.preview_prompts'
       ORDER BY updated_at DESC, created_at DESC
       LIMIT 1`
    );
    const prompts = parsePreviewPromptsSetting(row?.value ?? null).slice(0, 11);
    if (prompts.length) return prompts;
    return DEFAULT_PREVIEW_PROMPTS;
  };

  const resolveBlendermixModel = async () => {
    const [row] = await query<{ file_id: string }>(
      "SELECT file_id FROM core.model_registry WHERE name ILIKE 'blendermix_v20%' AND file_id IS NOT NULL ORDER BY created_at DESC LIMIT 1"
    );
    return row?.file_id ?? null;
  };

  const normalizeSettingValue = (value: any) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  };

  const registerFile = async (userId: string, filePath: string, kind: string) => {
    const stat = await fs.stat(filePath);
    const hash = createHash("sha256");
    const stream = fsSync.createReadStream(filePath);
    for await (const chunk of stream) {
      hash.update(chunk as Buffer);
    }
    const checksum = hash.digest("hex");
    const id = randomUUID();
    await execute(
      "INSERT INTO files.file_registry (id, owner_user_id, kind, path, checksum, size_bytes, mime_type) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [id, userId, kind, filePath, checksum, stat.size, "application/octet-stream"]
    );
    return { id, checksum };
  };

  const registerFileWithHash = async (userId: string, filePath: string, kind: string, checksum: string, size: number) => {
    const id = randomUUID();
    await execute(
      "INSERT INTO files.file_registry (id, owner_user_id, kind, path, checksum, size_bytes, mime_type) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [id, userId, kind, filePath, checksum, size, "application/octet-stream"]
    );
    return id;
  };

  app.get("/api/loras/public", async () => {
    const rows = await query(
      `SELECT l.id,
              l.name,
              l.description,
              l.trigger_token,
              l.activator_token,
              l.file_id,
              l.user_id,
              l.is_public,
              l.created_at,
              l.source,
              u.username,
              p.avatar_file_id,
              l.dataset_file_id,
              (SELECT COUNT(*)::int FROM social.likes WHERE target_type = 'lora' AND target_id = l.id) AS like_count,
              (SELECT COUNT(*)::int FROM social.comments WHERE target_type = 'lora' AND target_id = l.id) AS comment_count,
              COALESCE(
                (
                  SELECT COUNT(*)::int
                  FROM gallery.lora_previews pcount
                  WHERE pcount.lora_id = l.id
                ),
                0
              ) AS preview_count,
              COALESCE(
                (
                  SELECT COUNT(*)::int
                  FROM gallery.lora_preview_jobs pj
                  JOIN generation.jobs gj ON gj.id = pj.job_id
                  WHERE pj.lora_id = l.id AND gj.status IN ('queued','rendering','running')
                ),
                0
              ) AS preview_in_flight,
              COALESCE(
                (
                  SELECT json_agg(p.file_id ORDER BY p.position)
                  FROM gallery.lora_previews p
                  WHERE p.lora_id = l.id
                ),
                '[]'::json
              ) AS preview_file_ids,
              COALESCE(
                (
                  SELECT dq.status
                  FROM gallery.lora_delete_queue dq
                  WHERE dq.lora_id = l.id AND dq.status IN ('queued','processing','failed')
                  ORDER BY dq.created_at DESC
                  LIMIT 1
                ),
                ''
              ) AS remove_status
       FROM gallery.loras l
       JOIN core.users u ON u.id = l.user_id
       LEFT JOIN core.profiles p ON p.user_id = l.user_id
       WHERE l.is_public = true
         AND NOT EXISTS (
           SELECT 1
           FROM gallery.lora_delete_queue dq
           WHERE dq.lora_id = l.id AND dq.status IN ('queued','processing')
         )
       ORDER BY l.created_at DESC
       LIMIT 200`
    );
    return { loras: rows };
  });

  app.get("/api/loras/public/:id", async (request: any, reply) => {
    const loraId = request.params.id as string;
    const [lora] = await query(
      `SELECT l.id,
              l.name,
              l.description,
              l.trigger_token,
              l.activator_token,
              l.file_id,
              l.user_id,
              l.is_public,
              l.created_at,
              l.source,
              u.username,
              p.avatar_file_id,
              l.dataset_file_id,
              COALESCE(
                (
                  SELECT COUNT(*)::int
                  FROM gallery.lora_previews pcount
                  WHERE pcount.lora_id = l.id
                ),
                0
              ) AS preview_count,
              COALESCE(
                (
                  SELECT COUNT(*)::int
                  FROM gallery.lora_preview_jobs pj
                  JOIN generation.jobs gj ON gj.id = pj.job_id
                  WHERE pj.lora_id = l.id AND gj.status IN ('queued','rendering','running')
                ),
                0
              ) AS preview_in_flight,
              COALESCE(
                (
                  SELECT json_agg(p.file_id ORDER BY p.position)
                  FROM gallery.lora_previews p
                  WHERE p.lora_id = l.id
                ),
                '[]'::json
              ) AS preview_file_ids,
              COALESCE(
                (
                  SELECT dq.status
                  FROM gallery.lora_delete_queue dq
                  WHERE dq.lora_id = l.id AND dq.status IN ('queued','processing','failed')
                  ORDER BY dq.created_at DESC
                  LIMIT 1
                ),
                ''
              ) AS remove_status
       FROM gallery.loras l
       JOIN core.users u ON u.id = l.user_id
       LEFT JOIN core.profiles p ON p.user_id = l.user_id
       WHERE l.id = $1
         AND l.is_public = true
         AND NOT EXISTS (
           SELECT 1
           FROM gallery.lora_delete_queue dq
           WHERE dq.lora_id = l.id AND dq.status IN ('queued','processing')
         )`,
      [loraId]
    );
    if (!lora) {
      reply.code(404);
      return { error: "not_found" };
    }
    return { lora };
  });

  app.get("/api/loras/private", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const rows = await query(
      `SELECT l.id,
              l.name,
              l.description,
              l.trigger_token,
              l.activator_token,
              l.file_id,
              l.user_id,
              l.is_public,
              l.created_at,
              l.source,
              u.username,
              p.avatar_file_id,
              l.dataset_file_id,
              (SELECT COUNT(*)::int FROM social.likes WHERE target_type = 'lora' AND target_id = l.id) AS like_count,
              (SELECT COUNT(*)::int FROM social.comments WHERE target_type = 'lora' AND target_id = l.id) AS comment_count,
              COALESCE(
                (
                  SELECT COUNT(*)::int
                  FROM gallery.lora_previews pcount
                  WHERE pcount.lora_id = l.id
                ),
                0
              ) AS preview_count,
              COALESCE(
                (
                  SELECT COUNT(*)::int
                  FROM gallery.lora_preview_jobs pj
                  JOIN generation.jobs gj ON gj.id = pj.job_id
                  WHERE pj.lora_id = l.id AND gj.status IN ('queued','rendering','running')
                ),
                0
              ) AS preview_in_flight,
              COALESCE(
                (
                  SELECT json_agg(p.file_id ORDER BY p.position)
                  FROM gallery.lora_previews p
                  WHERE p.lora_id = l.id
                ),
                '[]'::json
              ) AS preview_file_ids,
              COALESCE(
                (
                  SELECT dq.status
                  FROM gallery.lora_delete_queue dq
                  WHERE dq.lora_id = l.id AND dq.status IN ('queued','processing','failed')
                  ORDER BY dq.created_at DESC
                  LIMIT 1
                ),
                ''
              ) AS remove_status
       FROM gallery.loras l
       JOIN core.users u ON u.id = l.user_id
       LEFT JOIN core.profiles p ON p.user_id = l.user_id
       WHERE l.user_id = $1
         AND l.is_public = false
       ORDER BY l.created_at DESC
       LIMIT 200`,
      [userId]
    );
    return { loras: rows };
  });

  app.post("/api/loras", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const body = request.body as {
      file_id?: string;
      name?: string;
      is_public?: boolean;
      dataset_file_id?: string;
      description?: string;
    };
    if (!body.file_id || !body.name) {
      reply.code(400);
      return { error: "missing_fields" };
    }
    await execute(
      "INSERT INTO gallery.loras (id, user_id, name, description, file_id, is_public, dataset_file_id, source) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        randomUUID(),
        userId,
        body.name.trim(),
        body.description ? String(body.description).trim() : null,
        body.file_id,
        Boolean(body.is_public ?? false),
        body.dataset_file_id ?? null,
        "manual"
      ]
    );
    return { status: "ok" };
  });

  app.get("/api/loras/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const loraId = request.params.id as string;
    const [lora] = await query(
      `SELECT l.id,
              l.name,
              l.description,
              l.trigger_token,
              l.activator_token,
              l.file_id,
              l.user_id,
              l.is_public,
              l.created_at,
              l.source,
              u.username,
              p.avatar_file_id,
              l.dataset_file_id,
              COALESCE(
                (
                  SELECT COUNT(*)::int
                  FROM gallery.lora_previews pcount
                  WHERE pcount.lora_id = l.id
                ),
                0
              ) AS preview_count,
              COALESCE(
                (
                  SELECT COUNT(*)::int
                  FROM gallery.lora_preview_jobs pj
                  JOIN generation.jobs gj ON gj.id = pj.job_id
                  WHERE pj.lora_id = l.id AND gj.status IN ('queued','rendering','running')
                ),
                0
              ) AS preview_in_flight,
              COALESCE(
                (
                  SELECT json_agg(p.file_id ORDER BY p.position)
                  FROM gallery.lora_previews p
                  WHERE p.lora_id = l.id
                ),
                '[]'::json
              ) AS preview_file_ids,
              COALESCE(
                (
                  SELECT dq.status
                  FROM gallery.lora_delete_queue dq
                  WHERE dq.lora_id = l.id AND dq.status IN ('queued','processing','failed')
                  ORDER BY dq.created_at DESC
                  LIMIT 1
                ),
                ''
              ) AS remove_status
       FROM gallery.loras l
       JOIN core.users u ON u.id = l.user_id
       LEFT JOIN core.profiles p ON p.user_id = l.user_id
       WHERE l.id = $1`,
      [loraId]
    );
    if (!lora) {
      reply.code(404);
      return { error: "not_found" };
    }
    if (!lora.is_public && lora.user_id !== userId && !(await isAdmin(userId))) {
      reply.code(403);
      return { error: "forbidden" };
    }
    const [likeCount] = await query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM social.likes WHERE target_type = 'lora' AND target_id = $1",
      [loraId]
    );
    const [commentCount] = await query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM social.comments WHERE target_type = 'lora' AND target_id = $1",
      [loraId]
    );
    const [liked] = await query<{ id: string }>(
      "SELECT id FROM social.likes WHERE target_type = 'lora' AND target_id = $1 AND user_id = $2",
      [loraId, userId]
    );
    return {
      lora,
      likes: likeCount?.count ?? 0,
      comments: commentCount?.count ?? 0,
      user_liked: Boolean(liked)
    };
  });

  app.get("/api/loras/:id/comments", { preHandler: requireAuth }, async (request: any) => {
    const loraId = request.params.id as string;
    const rows = await query(
      `SELECT c.id,
              c.user_id,
              c.body,
              c.created_at,
              c.pinned,
              c.featured,
              u.username
       FROM social.comments c
       JOIN core.users u ON u.id = c.user_id
       WHERE c.target_type = 'lora' AND c.target_id = $1
       ORDER BY c.pinned DESC, c.featured DESC, c.created_at ASC`,
      [loraId]
    );
    return { comments: rows };
  });

  app.post("/api/loras/:id/comments", { preHandler: requireAuth }, async (request: any, reply) => {
    const loraId = request.params.id as string;
    const userId = request.user.sub as string;
    const body = request.body as { body?: string };
    if (!body.body) {
      reply.code(400);
      return { error: "missing_body" };
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [lora] = (
        await client.query<{ user_id: string }>("SELECT user_id FROM gallery.loras WHERE id = $1", [loraId])
      ).rows;
      if (!lora) {
        await client.query("ROLLBACK");
        reply.code(404);
        return { error: "not_found" };
      }
      const commentId = randomUUID();
      await client.query(
        "INSERT INTO social.comments (id, user_id, target_type, target_id, body) VALUES ($1, $2, 'lora', $3, $4)",
        [commentId, userId, loraId, body.body]
      );
      if (lora.user_id && lora.user_id !== userId) {
        await enqueueCreditIntentWithClient(client, {
          userId: lora.user_id,
          action: "reward_comment_first",
          amount: 2,
          refType: "lora",
          refId: loraId,
          payload: { actor_user_id: userId, target_type: "lora", target_id: loraId },
          idempotencyKey: `reward_comment_first:lora:${loraId}:${userId}`
        });
        await enqueueNotificationEventWithClient(client, {
          userId: lora.user_id,
          type: "comment_received",
          actorUserId: userId,
          refType: "lora",
          refId: loraId,
          payload: { target_type: "lora", target_id: loraId, body: body.body },
          idempotencyKey: `notify_comment:lora:${commentId}`
        });
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
    return { status: "ok" };
  });

  app.delete("/api/loras/:id/comments/:commentId", { preHandler: requireAuth }, async (request: any, reply) => {
    const loraId = request.params.id as string;
    const commentId = request.params.commentId as string;
    const userId = request.user.sub as string;
    const [comment] = await query<{ user_id: string }>(
      "SELECT user_id FROM social.comments WHERE id = $1 AND target_type = 'lora' AND target_id = $2",
      [commentId, loraId]
    );
    if (!comment) {
      reply.code(404);
      return { error: "not_found" };
    }
    const [lora] = await query<{ user_id: string }>("SELECT user_id FROM gallery.loras WHERE id = $1", [loraId]);
    const allowed = comment.user_id === userId || lora?.user_id === userId || (await isAdmin(userId));
    if (!allowed) {
      reply.code(403);
      return { error: "forbidden" };
    }
    await execute("DELETE FROM social.comments WHERE id = $1", [commentId]);
    return { status: "deleted" };
  });

  app.patch("/api/loras/:id/comments/:commentId", { preHandler: requireAuth }, async (request: any, reply) => {
    const loraId = request.params.id as string;
    const commentId = request.params.commentId as string;
    const userId = request.user.sub as string;
    const body = request.body as { pinned?: boolean; featured?: boolean };
    const [comment] = await query<{ user_id: string }>(
      "SELECT user_id FROM social.comments WHERE id = $1 AND target_type = 'lora' AND target_id = $2",
      [commentId, loraId]
    );
    if (!comment) {
      reply.code(404);
      return { error: "not_found" };
    }
    const [lora] = await query<{ user_id: string }>("SELECT user_id FROM gallery.loras WHERE id = $1", [loraId]);
    const allowed = lora?.user_id === userId || (await isAdmin(userId));
    if (!allowed) {
      reply.code(403);
      return { error: "forbidden" };
    }
    if (typeof body.pinned === "undefined" && typeof body.featured === "undefined") {
      reply.code(400);
      return { error: "missing_fields" };
    }
    const [current] = await query<{ pinned: boolean; featured: boolean }>(
      "SELECT pinned, featured FROM social.comments WHERE id = $1",
      [commentId]
    );
    const pinned = typeof body.pinned === "boolean" ? body.pinned : current?.pinned ?? false;
    const featured = typeof body.featured === "boolean" ? body.featured : current?.featured ?? false;
    await execute("UPDATE social.comments SET pinned = $1, featured = $2, updated_at = NOW() WHERE id = $3", [
      pinned,
      featured,
      commentId
    ]);
    return { status: "ok", pinned, featured };
  });

  app.post("/api/loras/:id/like", { preHandler: requireAuth }, async (request: any, reply) => {
    const loraId = request.params.id as string;
    const userId = request.user.sub as string;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [lora] = (
        await client.query<{ user_id: string }>("SELECT user_id FROM gallery.loras WHERE id = $1", [loraId])
      ).rows;
      if (!lora) {
        await client.query("ROLLBACK");
        reply.code(404);
        return { error: "not_found" };
      }
      const inserted = await client.query(
        "INSERT INTO social.likes (id, user_id, target_type, target_id) VALUES ($1, $2, 'lora', $3) ON CONFLICT DO NOTHING RETURNING id",
        [randomUUID(), userId, loraId]
      );
      if (inserted.rowCount && lora.user_id && lora.user_id !== userId) {
        await enqueueCreditIntentWithClient(client, {
          userId: lora.user_id,
          action: "reward_like_model",
          amount: 2,
          refType: "lora",
          refId: loraId,
          payload: { actor_user_id: userId, target_type: "lora", target_id: loraId },
          idempotencyKey: `reward_like_model:lora:${loraId}:${userId}`
        });
        await enqueueNotificationEventWithClient(client, {
          userId: lora.user_id,
          type: "like_received",
          actorUserId: userId,
          refType: "lora",
          refId: loraId,
          payload: { target_type: "lora", target_id: loraId },
          idempotencyKey: `notify_like:lora:${loraId}:${userId}`
        });
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
    return { status: "ok" };
  });

  app.delete("/api/loras/:id/like", { preHandler: requireAuth }, async (request: any) => {
    const loraId = request.params.id as string;
    const userId = request.user.sub as string;
    await execute("DELETE FROM social.likes WHERE user_id = $1 AND target_type = 'lora' AND target_id = $2", [
      userId,
      loraId
    ]);
    return { status: "ok" };
  });

  app.post("/api/loras/upload", { preHandler: requireAuth }, async (request: any, reply) => {
    await requirePermission(request, reply, "lora.upload");
    const userId = request.user.sub as string;
    const parts = await request.files();
    let name = "";
    let isPublic = false;
    let filePath = "";
    let safeBase = "";
    let fileChecksum = "";
    let fileSize = 0;
    for await (const part of parts) {
      if (part.type === "field") {
        if (part.fieldname === "name") name = String(part.value ?? "");
        if (part.fieldname === "is_public") isPublic = String(part.value ?? "") === "true";
        continue;
      }
      if (part.type === "file") {
        if (filePath) {
          // Only accept the first file.
          await part.toBuffer().catch(() => null);
          continue;
        }
        const original = part.filename || "lora.safetensors";
        const ext = path.extname(original) || ".safetensors";
        const base = path.basename(original, ext);
        safeBase = base.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "lora";
        const userRoot = path.join(config.storageRoot, "users", userId, "persistent", "loras");
        await fs.mkdir(userRoot, { recursive: true });
        const fileName = `${randomUUID()}_${safeBase}${ext}`;
        filePath = path.join(userRoot, fileName);
        const hash = createHash("sha256");
        const hasher = new Transform({
          transform(chunk, _enc, cb) {
            hash.update(chunk as Buffer);
            fileSize += (chunk as Buffer).length;
            cb(null, chunk);
          }
        });
        await streamPipeline(part.file, hasher, fsSync.createWriteStream(filePath));
        fileChecksum = hash.digest("hex");
      }
    }
    if (!filePath) {
      reply.code(400);
      return { error: "missing_file" };
    }
    const loraName = name.trim() || safeBase || "lora";
    const fileId = await registerFileWithHash(userId, filePath, "lora", fileChecksum, fileSize);
    await execute(
      "INSERT INTO core.model_registry (id, kind, name, version, source, file_id, checksum, is_active, meta) VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8)",
      [randomUUID(), "lora", loraName, null, "upload", fileId, fileChecksum, {}]
    );
    const loraId = randomUUID();
    await execute(
      "INSERT INTO gallery.loras (id, user_id, name, description, file_id, is_public, dataset_file_id, source) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [loraId, userId, loraName, null, fileId, Boolean(isPublic), null, "external"]
    );
    return { status: "ok", id: loraId, file_id: fileId, name: loraName };
  });

  app.put("/api/loras/:id/public", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const loraId = request.params.id as string;
    const body = request.body as { is_public?: boolean };
    const [row] = await query<{ user_id: string }>("SELECT user_id FROM gallery.loras WHERE id = $1", [loraId]);
    if (!row) {
      reply.code(404);
      return { error: "not_found" };
    }
    if (row.user_id !== userId) {
      reply.code(403);
      return { error: "forbidden" };
    }
    await execute("UPDATE gallery.loras SET is_public = $1, updated_at = NOW() WHERE id = $2", [
      Boolean(body.is_public),
      loraId
    ]);
    return { status: "ok" };
  });

  app.patch("/api/loras/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const loraId = request.params.id as string;
    const body = request.body as { name?: string; description?: string; trigger_token?: string; activator_token?: string };
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const description = typeof body.description === "string" ? body.description.trim() : undefined;
    const triggerToken = typeof body.trigger_token === "string" ? body.trigger_token.trim() : undefined;
    const activatorToken = typeof body.activator_token === "string" ? body.activator_token.trim() : undefined;
    const unifiedToken = typeof triggerToken !== "undefined" ? triggerToken : activatorToken;
    const [row] = await query<{ user_id: string }>("SELECT user_id FROM gallery.loras WHERE id = $1", [loraId]);
    if (!row) {
      reply.code(404);
      return { error: "not_found" };
    }
    if (!(await requireAdminOrOwner(userId, row.user_id))) {
      reply.code(403);
      return { error: "forbidden" };
    }
    if (
      typeof name === "undefined" &&
      typeof description === "undefined" &&
      typeof unifiedToken === "undefined"
    ) {
      reply.code(400);
      return { error: "missing_fields" };
    }
    await execute(
      `UPDATE gallery.loras
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           trigger_token = COALESCE($3, trigger_token),
           activator_token = COALESCE($3, activator_token),
           updated_at = NOW()
       WHERE id = $5`,
      [name, description, unifiedToken, unifiedToken, loraId]
    );
    return { status: "ok" };
  });

  app.post("/api/loras/:id/previews", { preHandler: requireAuth }, async (request: any, reply) => {
    const actorId = request.user.sub as string;
    const loraId = request.params.id as string;
    const [lora] = await query<{ id: string; user_id: string; name: string; file_id: string }>(
      "SELECT id, user_id, name, file_id FROM gallery.loras WHERE id = $1",
      [loraId]
    );
    if (!lora) {
      reply.code(404);
      return { error: "not_found" };
    }
    const allowed = await requireAdminOrOwner(actorId, lora.user_id);
    if (!allowed) {
      reply.code(403);
      return { error: "forbidden" };
    }

    const prompts = await loadPreviewPrompts();
    if (!prompts.length) {
      reply.code(400);
      return { error: "preview_prompts_missing" };
    }

    const modelFileId = await resolveBlendermixModel();
    if (!modelFileId) {
      reply.code(400);
      return { error: "blendermix_missing" };
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const inFlight = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM gallery.lora_preview_jobs j
         JOIN generation.jobs g ON g.id = j.job_id
         WHERE j.lora_id = $1 AND g.status IN ('queued','rendering','running')`,
        [loraId]
      );
      if (Number(inFlight.rows[0]?.count ?? 0) > 0) {
        await client.query("ROLLBACK");
        reply.code(409);
        return { error: "preview_in_progress" };
      }

      const costPerImageRaw = await query(
        "SELECT value FROM core.settings WHERE scope = 'global' AND key = 'credits.generate' LIMIT 1"
      );
      const costPerImage = Number(normalizeSettingValue(costPerImageRaw?.[0]?.value ?? 1)) || 1;

      const previewRows = await client.query(
        "SELECT file_id FROM gallery.lora_previews WHERE lora_id = $1",
        [loraId]
      );
      await client.query("DELETE FROM gallery.lora_previews WHERE lora_id = $1", [loraId]);

      const [linked] = (
        await client.query(
          "SELECT training_run_id FROM gallery.models WHERE model_file_id = $1 AND training_run_id IS NOT NULL ORDER BY created_at DESC LIMIT 1",
          [lora.file_id]
        )
      ).rows;
      if (linked?.training_run_id) {
        const artifacts = await client.query(
          "SELECT file_id FROM training.artifacts WHERE run_id = $1 AND kind = 'preview'",
          [linked.training_run_id]
        );
        await client.query("DELETE FROM training.artifacts WHERE run_id = $1 AND kind = 'preview'", [
          linked.training_run_id
        ]);
        for (const row of artifacts.rows as { file_id: string }[]) {
          await deleteFileIfUnused(row.file_id, {
            archiveLabel: "preview_cleanup",
            manifest: { type: "preview", reason: "cleanup_lora_preview", source_id: linked.training_run_id }
          });
        }
      }
      for (const row of previewRows.rows as { file_id: string }[]) {
        await deleteFileIfUnused(row.file_id, {
          archiveLabel: "preview_cleanup",
          manifest: { type: "preview", reason: "cleanup_lora_preview", source_id: loraId }
        });
      }

      const jobIds: string[] = [];
      for (let i = 0; i < prompts.length; i += 1) {
        const jobId = randomUUID();
        const prompt = `${lora.name}, ${prompts[i]}`;
        await client.query(
          "INSERT INTO generation.jobs (id, user_id, status, prompt, negative_prompt, sampler, scheduler, steps, cfg_scale, width, height, seed, batch_count, model_id, model_file_id, lora_file_ids, credits_reserved, is_public) VALUES ($1,$2,'credit_pending',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,0,$16)",
          [
            jobId,
            lora.user_id,
            prompt,
            "",
            "",
            "",
            30,
            7.5,
            1024,
            1024,
            null,
            1,
            null,
            modelFileId,
            [lora.file_id],
            false
          ]
        );
        await enqueueCreditIntentWithClient(client, {
          userId: lora.user_id,
          action: "reserve_generate",
          amount: costPerImage,
          refType: "generation_job",
          refId: jobId,
          payload: { preview: true, lora_id: loraId },
          idempotencyKey: `reserve_generate:${jobId}`
        });
        await client.query(
          "INSERT INTO gallery.lora_preview_jobs (job_id, lora_id, position) VALUES ($1,$2,$3)",
          [jobId, loraId, i + 1]
        );
        jobIds.push(jobId);
      }

      await client.query("COMMIT");
      return { status: "queued", jobs: jobIds };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  app.delete("/api/loras/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const { id: loraId } = request.params as { id: string };
    const userId = request.user.sub as string;
    const [lora] = await query<{
      id: string;
      user_id: string;
      file_id: string;
      dataset_file_id: string | null;
      name: string;
    }>("SELECT id, user_id, file_id, dataset_file_id, name FROM gallery.loras WHERE id = $1",
      [loraId]
    );
    if (!lora) {
      reply.code(404);
      return { error: "not_found" };
    }
    if (!(await requireAdminOrOwner(userId, lora.user_id))) {
      reply.code(403);
      return { error: "forbidden" };
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [existingQueue] = (
        await client.query<{ status: string }>(
          "SELECT status FROM gallery.lora_delete_queue WHERE lora_id = $1 FOR UPDATE",
          [loraId]
        )
      ).rows;
      if (existingQueue && ["queued", "processing"].includes(String(existingQueue.status ?? ""))) {
        await client.query("ROLLBACK");
        reply.code(409);
        return { error: "already_removing" };
      }
      if (existingQueue) {
        await client.query(
          `UPDATE gallery.lora_delete_queue
           SET status = 'queued',
               attempts = 0,
               error_message = NULL,
               available_at = NOW(),
               started_at = NULL,
               finished_at = NULL,
               updated_at = NOW()
           WHERE lora_id = $1`,
          [loraId]
        );
      } else {
        await client.query(
          `INSERT INTO gallery.lora_delete_queue (id, lora_id, user_id, status, attempts, available_at)
           VALUES ($1,$2,$3,'queued',0,NOW())`,
          [randomUUID(), loraId, userId]
        );
      }
      await client.query("COMMIT");
      return { status: "queued" };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  app.post("/api/loras/bulk-delete", { preHandler: requireAuth }, async (request: any, reply) => {
    const actorId = request.user.sub as string;
    const body = request.body as { lora_ids?: string[] };
    const ids = Array.from(
      new Set((Array.isArray(body?.lora_ids) ? body.lora_ids : []).map((id) => String(id ?? "").trim()).filter(Boolean))
    );
    if (!ids.length) {
      reply.code(400);
      return { error: "item_required" };
    }
    const client = await pool.connect();
    let queued = 0;
    let skipped = 0;
    const errors: Array<{ id: string; error: string }> = [];
    try {
      await client.query("BEGIN");
      for (const loraId of ids) {
        const [lora] = (
          await client.query<{ id: string; user_id: string }>("SELECT id, user_id FROM gallery.loras WHERE id = $1", [loraId])
        ).rows;
        if (!lora) {
          skipped += 1;
          errors.push({ id: loraId, error: "not_found" });
          continue;
        }
        if (!(await requireAdminOrOwner(actorId, lora.user_id))) {
          skipped += 1;
          errors.push({ id: loraId, error: "forbidden" });
          continue;
        }
        const [existingQueue] = (
          await client.query<{ status: string }>(
            "SELECT status FROM gallery.lora_delete_queue WHERE lora_id = $1 FOR UPDATE",
            [loraId]
          )
        ).rows;
        if (existingQueue && ["queued", "processing"].includes(String(existingQueue.status ?? ""))) {
          skipped += 1;
          errors.push({ id: loraId, error: "already_removing" });
          continue;
        }
        if (existingQueue) {
          await client.query(
            `UPDATE gallery.lora_delete_queue
             SET status = 'queued',
                 attempts = 0,
                 error_message = NULL,
                 available_at = NOW(),
                 started_at = NULL,
                 finished_at = NULL,
                 updated_at = NOW()
             WHERE lora_id = $1`,
            [loraId]
          );
        } else {
          await client.query(
            `INSERT INTO gallery.lora_delete_queue (id, lora_id, user_id, status, attempts, available_at)
             VALUES ($1,$2,$3,'queued',0,NOW())`,
            [randomUUID(), loraId, actorId]
          );
        }
        queued += 1;
      }
      await client.query("COMMIT");
      return { status: "queued", queued, skipped, errors };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });
}
