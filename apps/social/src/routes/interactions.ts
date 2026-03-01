import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { enqueueCreditIntentWithClient, enqueueNotificationEventWithClient, execute, pool, query } from "@frameworkx/shared";

type TargetType = "image" | "model" | "lora";

async function requireAuth(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401);
    throw new Error("unauthorized");
  }
}

async function isAdminByRoleId(roleId?: string | null) {
  if (!roleId) return false;
  const [role] = await query<{ name: string }>("SELECT name FROM core.roles WHERE id = $1", [roleId]);
  return role?.name === "admin";
}

function targetTable(targetType: TargetType) {
  if (targetType === "image") return "gallery.images";
  if (targetType === "model") return "gallery.models";
  return "gallery.loras";
}

async function getTargetOwner(targetType: TargetType, targetId: string) {
  const table = targetTable(targetType);
  const [row] = await query<{ user_id: string }>(`SELECT user_id FROM ${table} WHERE id = $1`, [targetId]);
  return row?.user_id ?? null;
}

async function listComments(targetType: TargetType, targetId: string) {
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
     WHERE c.target_type = $1 AND c.target_id = $2
     ORDER BY c.pinned DESC, c.featured DESC, c.created_at ASC`,
    [targetType, targetId]
  );
  return { comments: rows };
}

async function addComment(targetType: TargetType, targetId: string, actorUserId: string, body: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ownerUserId = await getTargetOwner(targetType, targetId);
    if (!ownerUserId) {
      await client.query("ROLLBACK");
      return { code: 404, payload: { error: "not_found" } };
    }

    const commentId = randomUUID();
    await client.query(
      "INSERT INTO social.comments (id, user_id, target_type, target_id, body) VALUES ($1, $2, $3, $4, $5)",
      [commentId, actorUserId, targetType, targetId, body]
    );

    if (ownerUserId !== actorUserId) {
      const reward = targetType === "image" ? 1 : 2;
      await enqueueCreditIntentWithClient(client, {
        userId: ownerUserId,
        action: "reward_comment_first",
        amount: reward,
        refType: targetType,
        refId: targetId,
        payload: { actor_user_id: actorUserId, target_type: targetType, target_id: targetId },
        idempotencyKey: `reward_comment_first:${targetType}:${targetId}:${actorUserId}`
      });
      await enqueueNotificationEventWithClient(client, {
        userId: ownerUserId,
        type: "comment_received",
        actorUserId,
        refType: targetType,
        refId: targetId,
        payload: { target_type: targetType, target_id: targetId, body },
        idempotencyKey: `notify_comment:${targetType}:${commentId}`
      });
    }

    await client.query("COMMIT");
    return { code: 200, payload: { status: "ok" } };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function deleteComment(targetType: TargetType, targetId: string, commentId: string, actorUserId: string, actorRoleId?: string | null) {
  const [comment] = await query<{ user_id: string }>(
    "SELECT user_id FROM social.comments WHERE id = $1 AND target_type = $2 AND target_id = $3",
    [commentId, targetType, targetId]
  );
  if (!comment) return { code: 404, payload: { error: "not_found" } };

  const ownerUserId = await getTargetOwner(targetType, targetId);
  const isAdmin = await isAdminByRoleId(actorRoleId);
  const allowed = comment.user_id === actorUserId || ownerUserId === actorUserId || isAdmin;
  if (!allowed) return { code: 403, payload: { error: "forbidden" } };

  await execute("DELETE FROM social.comments WHERE id = $1", [commentId]);
  return { code: 200, payload: { status: "deleted" } };
}

async function patchComment(
  targetType: TargetType,
  targetId: string,
  commentId: string,
  actorUserId: string,
  actorRoleId: string | null | undefined,
  pinned?: boolean,
  featured?: boolean
) {
  const [comment] = await query<{ user_id: string }>(
    "SELECT user_id FROM social.comments WHERE id = $1 AND target_type = $2 AND target_id = $3",
    [commentId, targetType, targetId]
  );
  if (!comment) return { code: 404, payload: { error: "not_found" } };

  const ownerUserId = await getTargetOwner(targetType, targetId);
  const isAdmin = await isAdminByRoleId(actorRoleId);
  if (!(ownerUserId === actorUserId || isAdmin)) return { code: 403, payload: { error: "forbidden" } };

  if (typeof pinned === "undefined" && typeof featured === "undefined") {
    return { code: 400, payload: { error: "missing_fields" } };
  }

  const [current] = await query<{ pinned: boolean; featured: boolean }>(
    "SELECT pinned, featured FROM social.comments WHERE id = $1",
    [commentId]
  );
  const nextPinned = typeof pinned === "boolean" ? pinned : current?.pinned ?? false;
  const nextFeatured = typeof featured === "boolean" ? featured : current?.featured ?? false;
  await execute("UPDATE social.comments SET pinned = $1, featured = $2, updated_at = NOW() WHERE id = $3", [
    nextPinned,
    nextFeatured,
    commentId
  ]);
  return { code: 200, payload: { status: "ok", pinned: nextPinned, featured: nextFeatured } };
}

async function likeTarget(targetType: TargetType, targetId: string, actorUserId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ownerUserId = await getTargetOwner(targetType, targetId);
    if (!ownerUserId) {
      await client.query("ROLLBACK");
      return { code: 404, payload: { error: "not_found" } };
    }

    const inserted = await client.query(
      "INSERT INTO social.likes (id, user_id, target_type, target_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING id",
      [randomUUID(), actorUserId, targetType, targetId]
    );

    if (inserted.rowCount && ownerUserId !== actorUserId) {
      const reward = targetType === "image" ? 1 : 2;
      const rewardAction = targetType === "image" ? "reward_like_image" : "reward_like_model";
      await enqueueCreditIntentWithClient(client, {
        userId: ownerUserId,
        action: rewardAction,
        amount: reward,
        refType: targetType,
        refId: targetId,
        payload: { actor_user_id: actorUserId, target_type: targetType, target_id: targetId },
        idempotencyKey: `${rewardAction}:${targetType === "lora" ? "lora:" : ""}${targetId}:${actorUserId}`
      });
      await enqueueNotificationEventWithClient(client, {
        userId: ownerUserId,
        type: "like_received",
        actorUserId,
        refType: targetType,
        refId: targetId,
        payload: { target_type: targetType, target_id: targetId },
        idempotencyKey: `notify_like:${targetType}:${targetId}:${actorUserId}`
      });
    }

    await client.query("COMMIT");
    return { code: 200, payload: { status: "ok" } };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function unlikeTarget(targetType: TargetType, targetId: string, actorUserId: string) {
  await execute("DELETE FROM social.likes WHERE user_id = $1 AND target_type = $2 AND target_id = $3", [
    actorUserId,
    targetType,
    targetId
  ]);
  return { code: 200, payload: { status: "ok" } };
}

function registerTargetRoutes(app: FastifyInstance, targetType: TargetType, prefix: string) {
  app.get(`${prefix}/:id/comments`, { preHandler: requireAuth }, async (request: any) => {
    const targetId = request.params.id as string;
    return listComments(targetType, targetId);
  });

  app.post(`${prefix}/:id/comments`, { preHandler: requireAuth }, async (request: any, reply) => {
    const targetId = request.params.id as string;
    const userId = request.user.sub as string;
    const body = request.body as { body?: string };
    const message = String(body.body ?? "").trim();
    if (!message) {
      reply.code(400);
      return { error: "missing_body" };
    }
    const result = await addComment(targetType, targetId, userId, message);
    reply.code(result.code);
    return result.payload;
  });

  app.delete(`${prefix}/:id/comments/:commentId`, { preHandler: requireAuth }, async (request: any, reply) => {
    const targetId = request.params.id as string;
    const commentId = request.params.commentId as string;
    const userId = request.user.sub as string;
    const roleId = request.user.role_id as string | undefined;
    const result = await deleteComment(targetType, targetId, commentId, userId, roleId);
    reply.code(result.code);
    return result.payload;
  });

  app.patch(`${prefix}/:id/comments/:commentId`, { preHandler: requireAuth }, async (request: any, reply) => {
    const targetId = request.params.id as string;
    const commentId = request.params.commentId as string;
    const userId = request.user.sub as string;
    const roleId = request.user.role_id as string | undefined;
    const body = request.body as { pinned?: boolean; featured?: boolean };
    const result = await patchComment(targetType, targetId, commentId, userId, roleId, body.pinned, body.featured);
    reply.code(result.code);
    return result.payload;
  });

  app.post(`${prefix}/:id/like`, { preHandler: requireAuth }, async (request: any, reply) => {
    const targetId = request.params.id as string;
    const userId = request.user.sub as string;
    const result = await likeTarget(targetType, targetId, userId);
    reply.code(result.code);
    return result.payload;
  });

  app.delete(`${prefix}/:id/like`, { preHandler: requireAuth }, async (request: any, reply) => {
    const targetId = request.params.id as string;
    const userId = request.user.sub as string;
    const result = await unlikeTarget(targetType, targetId, userId);
    reply.code(result.code);
    return result.payload;
  });
}

export async function registerInteractionRoutes(app: FastifyInstance) {
  registerTargetRoutes(app, "image", "/api/gallery/images");
  registerTargetRoutes(app, "model", "/api/gallery/models");
  registerTargetRoutes(app, "lora", "/api/loras");
}
