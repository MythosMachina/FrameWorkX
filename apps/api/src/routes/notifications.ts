import type { FastifyInstance } from "fastify";
import { execute, query } from "@frameworkx/shared";
import { randomUUID } from "node:crypto";

const USER_NOTIFICATION_KEYS = [
  "notify.like.email",
  "notify.comment.email",
  "notify.training_done.email",
  "notify.training_failed.email",
  "notify.new_follower.email",
  "notify.dm.email"
] as const;

const DEFAULT_NOTIFICATION_SETTINGS: Record<string, boolean> = Object.fromEntries(
  USER_NOTIFICATION_KEYS.map((key) => [key, true])
);

async function requireAuth(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401);
    throw new Error("unauthorized");
  }
}

function normalizeSetting(value: any) {
  if (typeof value === "string") {
    const next = value.trim().toLowerCase();
    if (next === "true") return true;
    if (next === "false") return false;
  }
  return Boolean(value);
}

export async function registerNotificationRoutes(app: FastifyInstance) {
  app.get("/api/notifications", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const limitRaw = Number((request.query as { limit?: string }).limit ?? 50);
    const unreadOnly = String((request.query as { unread_only?: string }).unread_only ?? "false") === "true";
    const limit = Math.min(200, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 50));
    const rows = await query(
      `SELECT n.id,
              n.type,
              n.title,
              n.body,
              n.ref_type,
              n.ref_id,
              n.payload,
              n.read_at,
              n.created_at,
              n.actor_user_id,
              u.username AS actor_username
       FROM core.notifications n
       LEFT JOIN core.users u ON u.id = n.actor_user_id
       WHERE n.user_id = $1
         AND ($2::boolean = false OR n.read_at IS NULL)
       ORDER BY n.created_at DESC
       LIMIT $3`,
      [userId, unreadOnly, limit]
    );
    const [unread] = await query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM core.notifications WHERE user_id = $1 AND read_at IS NULL",
      [userId]
    );
    return { notifications: rows, unread_count: unread?.count ?? 0 };
  });

  app.post("/api/notifications/:id/read", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const id = request.params.id as string;
    const [row] = await query<{ id: string }>(
      "SELECT id FROM core.notifications WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (!row) {
      reply.code(404);
      return { error: "not_found" };
    }
    await execute("UPDATE core.notifications SET read_at = COALESCE(read_at, NOW()) WHERE id = $1", [id]);
    return { status: "ok" };
  });

  app.post("/api/notifications/read-all", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    await execute("UPDATE core.notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL", [userId]);
    return { status: "ok" };
  });

  app.get("/api/notifications/settings", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const rows = await query<{ key: string; value: any }>(
      "SELECT key, value FROM core.settings WHERE scope = 'user' AND scope_id = $1 AND key = ANY($2::text[])",
      [userId, [...USER_NOTIFICATION_KEYS]]
    );
    const map = { ...DEFAULT_NOTIFICATION_SETTINGS };
    for (const row of rows) {
      map[row.key] = normalizeSetting(row.value);
    }
    return { settings: map };
  });

  app.put("/api/notifications/settings", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const body = request.body as { settings?: Record<string, any> };
    const settings = body.settings ?? {};
    const keys = Object.keys(settings);
    for (const key of keys) {
      if (!USER_NOTIFICATION_KEYS.includes(key as (typeof USER_NOTIFICATION_KEYS)[number])) {
        reply.code(400);
        return { error: "invalid_key", key };
      }
    }
    for (const key of keys) {
      await execute(
        "INSERT INTO core.settings (id, scope, scope_id, key, value) VALUES ($1,'user',$2,$3,$4) ON CONFLICT (scope, scope_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
        [randomUUID(), userId, key, Boolean(settings[key])]
      );
    }
    return { status: "ok" };
  });
}
