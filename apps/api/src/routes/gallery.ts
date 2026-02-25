import type { FastifyInstance } from "fastify";
import {
  loadConfig,
  archivePaths,
  enqueueCreditIntentWithClient,
  enqueueNotificationEventWithClient,
  pool,
  query
} from "@frameworkx/shared";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

async function requireAuth(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401);
    throw new Error("unauthorized");
  }
}

const config = loadConfig(process.cwd());

async function isAdmin(request: any) {
  const roleId = request.user.role_id as string | undefined;
  if (!roleId) return false;
  const [role] = await query<{ name: string }>("SELECT name FROM core.roles WHERE id = $1", [roleId]);
  return role?.name === "admin";
}

async function deleteFileIfUnused(
  fileId: string,
  options?: { skipArchivePaths?: string[]; manifest?: Record<string, any>; allowPersistentDelete?: boolean }
) {
  const [refs] = await query<{
    gallery_count: number;
    output_count: number;
    training_count: number;
    model_count: number;
    registry_count: number;
  }>(
    `SELECT
      (SELECT COUNT(*)::int FROM gallery.images WHERE file_id = $1) AS gallery_count,
      (SELECT COUNT(*)::int FROM generation.outputs WHERE file_id = $1) AS output_count,
      (SELECT COUNT(*)::int FROM training.runs WHERE output_file_id = $1) AS training_count,
      (SELECT COUNT(*)::int FROM gallery.models WHERE model_file_id = $1) AS model_count,
      (SELECT COUNT(*)::int FROM core.model_registry WHERE file_id = $1) AS registry_count`,
    [fileId]
  );
  const total =
    Number(refs?.gallery_count ?? 0) +
    Number(refs?.output_count ?? 0) +
    Number(refs?.training_count ?? 0) +
    Number(refs?.model_count ?? 0) +
    Number(refs?.registry_count ?? 0);
  if (total > 0) return;

  const [row] = await query<{ path: string; owner_user_id: string | null }>(
    "SELECT path, owner_user_id FROM files.file_registry WHERE id = $1",
    [fileId]
  );
  const skipArchive = options?.skipArchivePaths?.some((root) => row?.path?.startsWith(root ?? "")) ?? false;
  if (row?.path?.includes(`${path.sep}persistent${path.sep}`) && !options?.allowPersistentDelete) {
    return;
  }
  if (row?.path && !skipArchive) {
    await archivePaths({
      storageRoot: config.storageRoot,
      userId: row.owner_user_id,
      label: "gallery_delete",
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
  await query("DELETE FROM files.lineage WHERE file_id = $1", [fileId]);
  await query("DELETE FROM files.file_registry WHERE id = $1", [fileId]);
  if (row?.path) {
    try {
      await fs.unlink(row.path);
    } catch {
      // ignore
    }
  }
}

export async function registerGalleryRoutes(app: FastifyInstance) {
  app.get("/api/gallery/public", async () => {
    const rows = await query(
      `SELECT i.id,
              i.file_id,
              i.user_id,
              i.prompt,
              i.created_at,
              u.username,
              p.avatar_file_id,
              (SELECT COUNT(*)::int FROM social.likes WHERE target_type = 'image' AND target_id = i.id) AS like_count,
              (SELECT COUNT(*)::int FROM social.comments WHERE target_type = 'image' AND target_id = i.id) AS comment_count
       FROM gallery.images i
       JOIN core.users u ON u.id = i.user_id
       LEFT JOIN core.profiles p ON p.user_id = i.user_id
       WHERE i.is_public = true
         AND NOT EXISTS (
           SELECT 1
           FROM gallery.nsfw_tags t
           WHERE COALESCE(i.prompt, '') ILIKE '%' || t.tag || '%'
         )
       ORDER BY i.created_at DESC
       LIMIT 200`
    );
    return { images: rows };
  });

  app.get("/api/gallery/images/public/:id", async (request: any, reply) => {
    const imageId = request.params.id as string;
    const [image] = await query(
      `SELECT i.id,
              i.file_id,
              i.user_id,
              i.prompt,
              i.negative_prompt,
              i.sampler,
              i.scheduler,
              i.steps,
              i.cfg_scale,
              i.seed,
              i.created_at,
              i.is_public,
              i.model_id,
              i.generation_job_id,
              u.username
       FROM gallery.images i
       JOIN core.users u ON u.id = i.user_id
       WHERE i.id = $1
         AND i.is_public = true
         AND NOT EXISTS (
           SELECT 1
           FROM gallery.nsfw_tags t
           WHERE COALESCE(i.prompt, '') ILIKE '%' || t.tag || '%'
         )`,
      [imageId]
    );
    if (!image) {
      reply.code(404);
      return { error: "not_found" };
    }

    let modelLabel: string | null = null;
    if (image.model_id) {
      const [modelRow] = await query<{ name: string }>(
        "SELECT name FROM gallery.models WHERE id = $1",
        [image.model_id]
      );
      modelLabel = modelRow?.name ?? null;
    }
    return { image, model_label: modelLabel };
  });

  app.get("/api/gallery/models/public", async () => {
    const models = await query(
      `SELECT m.id,
              m.user_id,
              m.muid,
              m.name,
              m.status,
              m.model_file_id,
              m.created_at,
              u.username,
              p.avatar_file_id,
              mc.title,
              mc.summary,
              mc.tags,
              (SELECT COUNT(*)::int FROM social.likes WHERE target_type = 'model' AND target_id = m.id) AS like_count,
              (SELECT COUNT(*)::int FROM social.comments WHERE target_type = 'model' AND target_id = m.id) AS comment_count
       FROM gallery.models m
       LEFT JOIN gallery.modelcards mc ON mc.model_id = m.id
       JOIN core.users u ON u.id = m.user_id
       LEFT JOIN core.profiles p ON p.user_id = m.user_id
       WHERE m.status = 'published'
       ORDER BY m.created_at DESC
       LIMIT 60`
    );

    const modelIds = models.map((m: any) => m.id);
    const images = modelIds.length
      ? await query<{ id: string; model_id: string; file_id: string; created_at: string }>(
          `SELECT i.id, i.model_id, i.file_id, i.created_at
           FROM gallery.images i
           WHERE i.model_id = ANY($1)
             AND i.is_public = true
             AND NOT EXISTS (
               SELECT 1
               FROM gallery.nsfw_tags t
               WHERE COALESCE(i.prompt, '') ILIKE '%' || t.tag || '%'
             )
           ORDER BY i.created_at DESC`,
          [modelIds]
        )
      : [];

    const grouped = new Map<string, any[]>();
    for (const image of images) {
      const list = grouped.get(image.model_id) ?? [];
      if (list.length < 8) {
        list.push(image);
        grouped.set(image.model_id, list);
      }
    }

    const enriched = models.map((model: any) => ({
      ...model,
      images: grouped.get(model.id) ?? []
    }));

    return { models: enriched };
  });

  app.get("/api/gallery/private", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const rows = await query(
      `SELECT i.id,
              i.file_id,
              i.user_id,
              i.prompt,
              i.created_at,
              i.is_public,
              u.username,
              p.avatar_file_id,
              (SELECT COUNT(*)::int FROM social.likes WHERE target_type = 'image' AND target_id = i.id) AS like_count,
              (SELECT COUNT(*)::int FROM social.comments WHERE target_type = 'image' AND target_id = i.id) AS comment_count
       FROM gallery.images i
       JOIN core.users u ON u.id = i.user_id
       LEFT JOIN core.profiles p ON p.user_id = i.user_id
       WHERE i.user_id = $1
         AND i.is_public = false
       ORDER BY i.created_at DESC
       LIMIT 200`,
      [userId]
    );
    return { images: rows };
  });

  app.get("/api/gallery/images/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const imageId = request.params.id as string;
    const userId = request.user.sub as string;
    const [image] = await query(
      `SELECT i.id,
              i.file_id,
              i.user_id,
              i.prompt,
              i.negative_prompt,
              i.sampler,
              i.scheduler,
              i.steps,
              i.cfg_scale,
              i.seed,
              i.created_at,
              i.is_public,
              i.model_id,
              i.generation_job_id,
              u.username
       FROM gallery.images i
       JOIN core.users u ON u.id = i.user_id
       WHERE i.id = $1`,
      [imageId]
    );
    if (!image) {
      reply.code(404);
      return { error: "not_found" };
    }
    if (!image.is_public && image.user_id !== userId) {
      reply.code(403);
      return { error: "forbidden" };
    }
    const [likeCount] = await query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM social.likes WHERE target_type = 'image' AND target_id = $1",
      [imageId]
    );
    const [commentCount] = await query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM social.comments WHERE target_type = 'image' AND target_id = $1",
      [imageId]
    );
    const [liked] = await query<{ id: string }>(
      "SELECT id FROM social.likes WHERE target_type = 'image' AND target_id = $1 AND user_id = $2",
      [imageId, userId]
    );
    let modelLabel: string | null = null;
    let loraLabels: string[] = [];
    if (image.model_id) {
      const [modelRow] = await query<{ name: string }>(
        "SELECT name FROM gallery.models WHERE id = $1",
        [image.model_id]
      );
      modelLabel = modelRow?.name ?? null;
    }
    if (image.generation_job_id) {
      const [job] = await query<{ model_file_id: string | null; lora_file_ids: string[] | null }>(
        "SELECT model_file_id, lora_file_ids FROM generation.jobs WHERE id = $1",
        [image.generation_job_id]
      );
      if (!modelLabel && job?.model_file_id) {
        const [modelRow] = await query<{ name: string }>(
          "SELECT name FROM core.model_registry WHERE file_id = $1",
          [job.model_file_id]
        );
        modelLabel = modelRow?.name ?? null;
      }
      if (job?.lora_file_ids?.length) {
        const rows = await query<{ name: string }>(
          "SELECT name FROM core.model_registry WHERE file_id = ANY($1::uuid[])",
          [job.lora_file_ids]
        );
        loraLabels = rows.map((row) => row.name).filter(Boolean);
      }
    }

    return {
      image,
      likes: likeCount?.count ?? 0,
      comments: commentCount?.count ?? 0,
      user_liked: Boolean(liked),
      model_label: modelLabel,
      lora_labels: loraLabels
    };
  });

  app.put("/api/gallery/images/:id/public", { preHandler: requireAuth }, async (request: any, reply) => {
    const imageId = request.params.id as string;
    const userId = request.user.sub as string;
    const body = request.body as { is_public?: boolean };
    const [image] = await query<{ user_id: string }>("SELECT user_id FROM gallery.images WHERE id = $1", [imageId]);
    if (!image) {
      reply.code(404);
      return { error: "not_found" };
    }
    if (image.user_id !== userId) {
      reply.code(403);
      return { error: "forbidden" };
    }
    await query("UPDATE gallery.images SET is_public = $1 WHERE id = $2", [Boolean(body.is_public), imageId]);
    return { status: "ok" };
  });

  app.delete("/api/gallery/images/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const imageId = request.params.id as string;
    const userId = request.user.sub as string;
    const [image] = await query<{ user_id: string; file_id: string; generation_output_id: string | null }>(
      "SELECT user_id, file_id, generation_output_id FROM gallery.images WHERE id = $1",
      [imageId]
    );
    if (!image) {
      reply.code(404);
      return { error: "not_found" };
    }
    if (image.user_id !== userId) {
      reply.code(403);
      return { error: "forbidden" };
    }
    await query("DELETE FROM social.likes WHERE target_type = 'image' AND target_id = $1", [imageId]);
    await query("DELETE FROM social.comments WHERE target_type = 'image' AND target_id = $1", [imageId]);
    await query("DELETE FROM gallery.image_tags WHERE image_id = $1", [imageId]);
    await query("DELETE FROM gallery.images WHERE id = $1", [imageId]);
    if (image.generation_output_id) {
      await query("DELETE FROM generation.outputs WHERE id = $1", [image.generation_output_id]);
    }
    if (image.file_id) {
      await deleteFileIfUnused(image.file_id, {
        manifest: { type: "gallery_image", reason: "delete_image", source_id: imageId }
      });
    }
    return { status: "deleted" };
  });

  app.get("/api/gallery/images/:id/comments", { preHandler: requireAuth }, async (request: any) => {
    const imageId = request.params.id as string;
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
       WHERE c.target_type = 'image' AND c.target_id = $1
       ORDER BY c.pinned DESC, c.featured DESC, c.created_at ASC`,
      [imageId]
    );
    return { comments: rows };
  });

  app.post("/api/gallery/images/:id/comments", { preHandler: requireAuth }, async (request: any, reply) => {
    const imageId = request.params.id as string;
    const userId = request.user.sub as string;
    const body = request.body as { body?: string };
    if (!body.body) {
      reply.code(400);
      return { error: "missing_body" };
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [image] = (
        await client.query<{ user_id: string }>("SELECT user_id FROM gallery.images WHERE id = $1", [imageId])
      ).rows;
      if (!image) {
        await client.query("ROLLBACK");
        reply.code(404);
        return { error: "not_found" };
      }
      const commentId = randomUUID();
      await client.query(
        "INSERT INTO social.comments (id, user_id, target_type, target_id, body) VALUES ($1, $2, 'image', $3, $4)",
        [commentId, userId, imageId, body.body]
      );
      if (image.user_id && image.user_id !== userId) {
        await enqueueCreditIntentWithClient(client, {
          userId: image.user_id,
          action: "reward_comment_first",
          amount: 1,
          refType: "image",
          refId: imageId,
          payload: { actor_user_id: userId, target_type: "image", target_id: imageId },
          idempotencyKey: `reward_comment_first:image:${imageId}:${userId}`
        });
        await enqueueNotificationEventWithClient(client, {
          userId: image.user_id,
          type: "comment_received",
          actorUserId: userId,
          refType: "image",
          refId: imageId,
          payload: { target_type: "image", target_id: imageId, body: body.body },
          idempotencyKey: `notify_comment:image:${commentId}`
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

  app.delete("/api/gallery/images/:id/comments/:commentId", { preHandler: requireAuth }, async (request: any, reply) => {
    const imageId = request.params.id as string;
    const commentId = request.params.commentId as string;
    const userId = request.user.sub as string;
    const [comment] = await query<{ user_id: string }>(
      "SELECT user_id FROM social.comments WHERE id = $1 AND target_type = 'image' AND target_id = $2",
      [commentId, imageId]
    );
    if (!comment) {
      reply.code(404);
      return { error: "not_found" };
    }
    const [image] = await query<{ user_id: string }>("SELECT user_id FROM gallery.images WHERE id = $1", [imageId]);
    const allowed = comment.user_id === userId || image?.user_id === userId || (await isAdmin(request));
    if (!allowed) {
      reply.code(403);
      return { error: "forbidden" };
    }
    await query("DELETE FROM social.comments WHERE id = $1", [commentId]);
    return { status: "deleted" };
  });

  app.patch("/api/gallery/images/:id/comments/:commentId", { preHandler: requireAuth }, async (request: any, reply) => {
    const imageId = request.params.id as string;
    const commentId = request.params.commentId as string;
    const userId = request.user.sub as string;
    const body = request.body as { pinned?: boolean; featured?: boolean };
    const [comment] = await query<{ user_id: string }>(
      "SELECT user_id FROM social.comments WHERE id = $1 AND target_type = 'image' AND target_id = $2",
      [commentId, imageId]
    );
    if (!comment) {
      reply.code(404);
      return { error: "not_found" };
    }
    const [image] = await query<{ user_id: string }>("SELECT user_id FROM gallery.images WHERE id = $1", [imageId]);
    const allowed = image?.user_id === userId || (await isAdmin(request));
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
    await query("UPDATE social.comments SET pinned = $1, featured = $2, updated_at = NOW() WHERE id = $3", [
      pinned,
      featured,
      commentId
    ]);
    return { status: "ok", pinned, featured };
  });

  app.post("/api/gallery/images/:id/like", { preHandler: requireAuth }, async (request: any, reply) => {
    const imageId = request.params.id as string;
    const userId = request.user.sub as string;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [image] = (
        await client.query<{ user_id: string }>("SELECT user_id FROM gallery.images WHERE id = $1", [imageId])
      ).rows;
      if (!image) {
        await client.query("ROLLBACK");
        reply.code(404);
        return { error: "not_found" };
      }
      const insertResult = await client.query(
        "INSERT INTO social.likes (id, user_id, target_type, target_id) VALUES ($1, $2, 'image', $3) ON CONFLICT DO NOTHING RETURNING id",
        [randomUUID(), userId, imageId]
      );
      if (insertResult.rowCount && image.user_id && image.user_id !== userId) {
        await enqueueCreditIntentWithClient(client, {
          userId: image.user_id,
          action: "reward_like_image",
          amount: 1,
          refType: "image",
          refId: imageId,
          payload: { actor_user_id: userId, target_type: "image", target_id: imageId },
          idempotencyKey: `reward_like_image:${imageId}:${userId}`
        });
        await enqueueNotificationEventWithClient(client, {
          userId: image.user_id,
          type: "like_received",
          actorUserId: userId,
          refType: "image",
          refId: imageId,
          payload: { target_type: "image", target_id: imageId },
          idempotencyKey: `notify_like:image:${imageId}:${userId}`
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

  app.delete("/api/gallery/images/:id/like", { preHandler: requireAuth }, async (request: any) => {
    const imageId = request.params.id as string;
    const userId = request.user.sub as string;
    await query("DELETE FROM social.likes WHERE user_id = $1 AND target_type = 'image' AND target_id = $2", [
      userId,
      imageId
    ]);
    return { status: "ok" };
  });

  app.get("/api/gallery/models", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const models = await query(
      `SELECT m.id,
              m.user_id,
              m.muid,
              m.name,
              m.status,
              m.model_file_id,
              m.created_at,
              u.username,
              p.avatar_file_id,
              mc.title,
              mc.summary,
              mc.tags,
              (SELECT COUNT(*)::int FROM social.likes WHERE target_type = 'model' AND target_id = m.id) AS like_count,
              (SELECT COUNT(*)::int FROM social.comments WHERE target_type = 'model' AND target_id = m.id) AS comment_count
       FROM gallery.models m
       LEFT JOIN gallery.modelcards mc ON mc.model_id = m.id
       JOIN core.users u ON u.id = m.user_id
       LEFT JOIN core.profiles p ON p.user_id = m.user_id
       WHERE m.status = 'published' OR m.user_id = $1
       ORDER BY m.created_at DESC`,
      [userId]
    );

    const modelIds = models.map((m: any) => m.id);
    const images = modelIds.length
      ? await query<{ id: string; model_id: string; file_id: string; created_at: string }>(
          `SELECT i.id, i.model_id, i.file_id, i.created_at
           FROM gallery.images i
           WHERE i.model_id = ANY($1)
           ORDER BY i.created_at DESC`,
          [modelIds]
        )
      : [];

    const grouped = new Map<string, any[]>();
    for (const image of images) {
      const list = grouped.get(image.model_id) ?? [];
      if (list.length < 8) {
        list.push(image);
        grouped.set(image.model_id, list);
      }
    }

    const enriched = models.map((model: any) => ({
      ...model,
      images: grouped.get(model.id) ?? []
    }));

    const orphaned = await query<{ id: string; file_id: string; created_at: string }>(
      `SELECT i.id, i.file_id, i.created_at
       FROM gallery.images i
       WHERE i.model_id IS NULL AND i.user_id = $1
       ORDER BY i.created_at DESC
       LIMIT 24`,
      [userId]
    );
    if (orphaned.length) {
      enriched.unshift({
        id: "generated",
        name: "Generated",
        status: "generated",
        images: orphaned
      });
    }

    return { models: enriched };
  });

  app.get("/api/gallery/models/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const modelId = request.params.id as string;
    const userId = request.user.sub as string;
    const [model] = await query(
      `SELECT m.id,
              m.user_id,
              m.muid,
              m.name,
              m.status,
              m.model_file_id,
              m.created_at,
              u.username
       FROM gallery.models m
       JOIN core.users u ON u.id = m.user_id
       WHERE m.id = $1`,
      [modelId]
    );
    if (!model) {
      reply.code(404);
      return { error: "not_found" };
    }
    if (model.status !== "published" && model.user_id !== userId) {
      reply.code(403);
      return { error: "forbidden" };
    }
    const [likeCount] = await query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM social.likes WHERE target_type = 'model' AND target_id = $1",
      [modelId]
    );
    const [commentCount] = await query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM social.comments WHERE target_type = 'model' AND target_id = $1",
      [modelId]
    );
    const [liked] = await query<{ id: string }>(
      "SELECT id FROM social.likes WHERE target_type = 'model' AND target_id = $1 AND user_id = $2",
      [modelId, userId]
    );
    const images = await query(
      `SELECT id, file_id, created_at
       FROM gallery.images
       WHERE model_id = $1
       ORDER BY created_at DESC
       LIMIT 32`,
      [modelId]
    );
    return {
      model,
      images,
      likes: likeCount?.count ?? 0,
      comments: commentCount?.count ?? 0,
      user_liked: Boolean(liked)
    };
  });

  app.get("/api/gallery/models/:id/comments", { preHandler: requireAuth }, async (request: any) => {
    const modelId = request.params.id as string;
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
       WHERE c.target_type = 'model' AND c.target_id = $1
       ORDER BY c.pinned DESC, c.featured DESC, c.created_at ASC`,
      [modelId]
    );
    return { comments: rows };
  });

  app.post("/api/gallery/models/:id/comments", { preHandler: requireAuth }, async (request: any, reply) => {
    const modelId = request.params.id as string;
    const userId = request.user.sub as string;
    const body = request.body as { body?: string };
    if (!body.body) {
      reply.code(400);
      return { error: "missing_body" };
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [model] = (
        await client.query<{ user_id: string }>("SELECT user_id FROM gallery.models WHERE id = $1", [modelId])
      ).rows;
      if (!model) {
        await client.query("ROLLBACK");
        reply.code(404);
        return { error: "not_found" };
      }
      const commentId = randomUUID();
      await client.query(
        "INSERT INTO social.comments (id, user_id, target_type, target_id, body) VALUES ($1, $2, 'model', $3, $4)",
        [commentId, userId, modelId, body.body]
      );
      if (model.user_id && model.user_id !== userId) {
        await enqueueCreditIntentWithClient(client, {
          userId: model.user_id,
          action: "reward_comment_first",
          amount: 2,
          refType: "model",
          refId: modelId,
          payload: { actor_user_id: userId, target_type: "model", target_id: modelId },
          idempotencyKey: `reward_comment_first:model:${modelId}:${userId}`
        });
        await enqueueNotificationEventWithClient(client, {
          userId: model.user_id,
          type: "comment_received",
          actorUserId: userId,
          refType: "model",
          refId: modelId,
          payload: { target_type: "model", target_id: modelId, body: body.body },
          idempotencyKey: `notify_comment:model:${commentId}`
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

  app.delete("/api/gallery/models/:id/comments/:commentId", { preHandler: requireAuth }, async (request: any, reply) => {
    const modelId = request.params.id as string;
    const commentId = request.params.commentId as string;
    const userId = request.user.sub as string;
    const [comment] = await query<{ user_id: string }>(
      "SELECT user_id FROM social.comments WHERE id = $1 AND target_type = 'model' AND target_id = $2",
      [commentId, modelId]
    );
    if (!comment) {
      reply.code(404);
      return { error: "not_found" };
    }
    const [model] = await query<{ user_id: string }>("SELECT user_id FROM gallery.models WHERE id = $1", [modelId]);
    const allowed = comment.user_id === userId || model?.user_id === userId || (await isAdmin(request));
    if (!allowed) {
      reply.code(403);
      return { error: "forbidden" };
    }
    await query("DELETE FROM social.comments WHERE id = $1", [commentId]);
    return { status: "deleted" };
  });

  app.patch("/api/gallery/models/:id/comments/:commentId", { preHandler: requireAuth }, async (request: any, reply) => {
    const modelId = request.params.id as string;
    const commentId = request.params.commentId as string;
    const userId = request.user.sub as string;
    const body = request.body as { pinned?: boolean; featured?: boolean };
    const [comment] = await query<{ user_id: string }>(
      "SELECT user_id FROM social.comments WHERE id = $1 AND target_type = 'model' AND target_id = $2",
      [commentId, modelId]
    );
    if (!comment) {
      reply.code(404);
      return { error: "not_found" };
    }
    const [model] = await query<{ user_id: string }>("SELECT user_id FROM gallery.models WHERE id = $1", [modelId]);
    const allowed = model?.user_id === userId || (await isAdmin(request));
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
    await query("UPDATE social.comments SET pinned = $1, featured = $2, updated_at = NOW() WHERE id = $3", [
      pinned,
      featured,
      commentId
    ]);
    return { status: "ok", pinned, featured };
  });

  app.post("/api/gallery/models/:id/like", { preHandler: requireAuth }, async (request: any, reply) => {
    const modelId = request.params.id as string;
    const userId = request.user.sub as string;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [model] = (
        await client.query<{ user_id: string }>("SELECT user_id FROM gallery.models WHERE id = $1", [modelId])
      ).rows;
      if (!model) {
        await client.query("ROLLBACK");
        reply.code(404);
        return { error: "not_found" };
      }
      const insertResult = await client.query(
        "INSERT INTO social.likes (id, user_id, target_type, target_id) VALUES ($1, $2, 'model', $3) ON CONFLICT DO NOTHING RETURNING id",
        [randomUUID(), userId, modelId]
      );
      if (insertResult.rowCount && model.user_id && model.user_id !== userId) {
        await enqueueCreditIntentWithClient(client, {
          userId: model.user_id,
          action: "reward_like_model",
          amount: 2,
          refType: "model",
          refId: modelId,
          payload: { actor_user_id: userId, target_type: "model", target_id: modelId },
          idempotencyKey: `reward_like_model:${modelId}:${userId}`
        });
        await enqueueNotificationEventWithClient(client, {
          userId: model.user_id,
          type: "like_received",
          actorUserId: userId,
          refType: "model",
          refId: modelId,
          payload: { target_type: "model", target_id: modelId },
          idempotencyKey: `notify_like:model:${modelId}:${userId}`
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

  app.delete("/api/gallery/models/:id/like", { preHandler: requireAuth }, async (request: any) => {
    const modelId = request.params.id as string;
    const userId = request.user.sub as string;
    await query("DELETE FROM social.likes WHERE user_id = $1 AND target_type = 'model' AND target_id = $2", [
      userId,
      modelId
    ]);
    return { status: "ok" };
  });
}
