import type { FastifyInstance } from "fastify";
import { enqueueNotificationEventWithClient, pool, query } from "@frameworkx/shared";

async function requireAuth(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401);
    throw new Error("unauthorized");
  }
}

export async function registerFollowRoutes(app: FastifyInstance) {
  app.post("/api/users/:id/follow", { preHandler: requireAuth }, async (request: any, reply) => {
    const followedUserId = request.params.id as string;
    const followerUserId = request.user.sub as string;
    if (followedUserId === followerUserId) {
      reply.code(400);
      return { error: "cannot_follow_self" };
    }
    const [target] = await query<{ id: string }>("SELECT id FROM core.users WHERE id = $1", [followedUserId]);
    if (!target) {
      reply.code(404);
      return { error: "not_found" };
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query(
        "INSERT INTO social.follows (follower_user_id, followed_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING follower_user_id",
        [followerUserId, followedUserId]
      );
      if (inserted.rowCount) {
        await enqueueNotificationEventWithClient(client, {
          userId: followedUserId,
          type: "new_follower",
          actorUserId: followerUserId,
          refType: "user",
          refId: followedUserId,
          payload: { follower_user_id: followerUserId },
          idempotencyKey: `notify_new_follower:${followedUserId}:${followerUserId}`
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

  app.delete("/api/users/:id/follow", { preHandler: requireAuth }, async (request: any, reply) => {
    const followedUserId = request.params.id as string;
    const followerUserId = request.user.sub as string;
    if (followedUserId === followerUserId) {
      reply.code(400);
      return { error: "cannot_follow_self" };
    }
    await query("DELETE FROM social.follows WHERE follower_user_id = $1 AND followed_user_id = $2", [
      followerUserId,
      followedUserId
    ]);
    return { status: "ok" };
  });
}
