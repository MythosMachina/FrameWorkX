import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { enqueueNotificationEventWithClient, execute, pool, query } from "@frameworkx/shared";

async function requireAuth(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401);
    throw new Error("unauthorized");
  }
}

function threadKeyForUsers(a: string, b: string) {
  return [String(a), String(b)].sort().join(":");
}

async function getBlockStateWithClient(client: any, userId: string, targetUserId: string) {
  const [row] = (
    await client.query(
      `SELECT
         EXISTS(
           SELECT 1
           FROM social.user_blocks b
           WHERE b.blocker_user_id = $1 AND b.blocked_user_id = $2
         ) AS blocked_by_me,
         EXISTS(
           SELECT 1
           FROM social.user_blocks b
           WHERE b.blocker_user_id = $2 AND b.blocked_user_id = $1
         ) AS blocked_by_peer`,
      [userId, targetUserId]
    )
  ).rows;
  return {
    blockedByMe: Boolean(row?.blocked_by_me),
    blockedByPeer: Boolean(row?.blocked_by_peer)
  };
}

export async function registerMessageRoutes(app: FastifyInstance) {
  app.post("/api/dm/open", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const body = request.body as { target_user_id?: string };
    const targetUserId = String(body.target_user_id ?? "");
    if (!targetUserId) {
      reply.code(400);
      return { error: "target_user_required" };
    }
    if (targetUserId === userId) {
      reply.code(400);
      return { error: "cannot_message_self" };
    }
    const [target] = await query<{ id: string }>("SELECT id FROM core.users WHERE id = $1", [targetUserId]);
    if (!target) {
      reply.code(404);
      return { error: "user_not_found" };
    }

    const key = threadKeyForUsers(userId, targetUserId);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const blockState = await getBlockStateWithClient(client, userId, targetUserId);
      if (blockState.blockedByMe || blockState.blockedByPeer) {
        await client.query("ROLLBACK");
        reply.code(403);
        return { error: "dm_blocked" };
      }
      let threadId = "";
      const [existing] = (await client.query("SELECT id FROM social.dm_threads WHERE thread_key = $1 FOR UPDATE", [key])).rows;
      if (existing?.id) {
        threadId = String(existing.id);
      } else {
        threadId = randomUUID();
        await client.query("INSERT INTO social.dm_threads (id, thread_key) VALUES ($1,$2)", [threadId, key]);
      }
      await client.query(
        `INSERT INTO social.dm_thread_participants (thread_id, user_id)
         VALUES ($1,$2), ($1,$3)
         ON CONFLICT (thread_id, user_id) DO UPDATE SET updated_at = NOW(), hidden_at = NULL`,
        [threadId, userId, targetUserId]
      );
      await client.query("COMMIT");
      return { status: "ok", thread_id: threadId };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  app.get("/api/dm/threads", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const rows = await query(
      `SELECT t.id,
              t.created_at,
              t.updated_at,
              t.last_message_at,
              peer.user_id AS peer_user_id,
              u.username AS peer_username,
              p.display_name AS peer_display_name,
              p.avatar_file_id AS peer_avatar_file_id,
              last_msg.id AS last_message_id,
              last_msg.body AS last_message_body,
              last_msg.created_at AS last_message_created_at,
              last_msg.sender_user_id AS last_message_sender_user_id,
              EXISTS(
                SELECT 1
                FROM social.user_blocks b
                WHERE b.blocker_user_id = $1 AND b.blocked_user_id = peer.user_id
              ) AS blocked_by_me,
              EXISTS(
                SELECT 1
                FROM social.user_blocks b
                WHERE b.blocker_user_id = peer.user_id AND b.blocked_user_id = $1
              ) AS blocked_by_peer,
              (
                SELECT COUNT(*)::int
                FROM social.dm_messages unread
                WHERE unread.thread_id = t.id
                  AND unread.sender_user_id <> $1
                  AND unread.created_at > COALESCE(self.last_read_at, to_timestamp(0))
              ) AS unread_count
       FROM social.dm_thread_participants self
       JOIN social.dm_threads t ON t.id = self.thread_id
       JOIN social.dm_thread_participants peer ON peer.thread_id = t.id AND peer.user_id <> $1
       JOIN core.users u ON u.id = peer.user_id
       LEFT JOIN core.profiles p ON p.user_id = peer.user_id
       LEFT JOIN LATERAL (
         SELECT id, body, created_at, sender_user_id
         FROM social.dm_messages
         WHERE thread_id = t.id
         ORDER BY created_at DESC
         LIMIT 1
       ) AS last_msg ON true
       WHERE self.user_id = $1
         AND self.hidden_at IS NULL
       ORDER BY COALESCE(last_msg.created_at, t.last_message_at, t.updated_at, t.created_at) DESC`,
      [userId]
    );
    return { threads: rows };
  });

  app.get("/api/dm/threads/:id/messages", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const threadId = request.params.id as string;
    const limitRaw = Number((request.query as { limit?: string }).limit ?? 50);
    const limit = Math.min(200, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 50));
    const beforeMessageId = String((request.query as { before?: string }).before ?? "").trim();
    const afterMessageId = String((request.query as { after?: string }).after ?? "").trim();

    const [member] = await query<{ thread_id: string }>(
      "SELECT thread_id FROM social.dm_thread_participants WHERE thread_id = $1 AND user_id = $2",
      [threadId, userId]
    );
    if (!member) {
      reply.code(404);
      return { error: "thread_not_found" };
    }

    let beforeCreatedAt: string | null = null;
    if (beforeMessageId) {
      const [cursor] = await query<{ created_at: string }>(
        "SELECT created_at FROM social.dm_messages WHERE id = $1 AND thread_id = $2",
        [beforeMessageId, threadId]
      );
      beforeCreatedAt = cursor?.created_at ?? null;
    }
    let afterCreatedAt: string | null = null;
    if (afterMessageId) {
      const [cursor] = await query<{ created_at: string }>(
        "SELECT created_at FROM social.dm_messages WHERE id = $1 AND thread_id = $2",
        [afterMessageId, threadId]
      );
      afterCreatedAt = cursor?.created_at ?? null;
    }

    const rows = afterCreatedAt
      ? await query(
          `SELECT m.id,
                  m.thread_id,
                  m.sender_user_id,
                  u.username AS sender_username,
                  m.body,
                  m.created_at,
                  m.updated_at
           FROM social.dm_messages m
           JOIN core.users u ON u.id = m.sender_user_id
           WHERE m.thread_id = $1
             AND m.created_at > $3::timestamptz
           ORDER BY m.created_at ASC
           LIMIT $2`,
          [threadId, limit, afterCreatedAt]
        )
      : await query(
          `SELECT m.id,
                  m.thread_id,
                  m.sender_user_id,
                  u.username AS sender_username,
                  m.body,
                  m.created_at,
                  m.updated_at
           FROM social.dm_messages m
           JOIN core.users u ON u.id = m.sender_user_id
           WHERE m.thread_id = $1
             AND ($3::timestamptz IS NULL OR m.created_at < $3::timestamptz)
           ORDER BY m.created_at DESC
           LIMIT $2`,
          [threadId, limit, beforeCreatedAt]
        );
    if (!afterCreatedAt) {
      rows.reverse();
    }
    return { messages: rows };
  });

  app.post("/api/dm/threads/:id/messages", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const threadId = request.params.id as string;
    const body = request.body as { body?: string };
    const messageBody = String(body.body ?? "").trim();
    if (!messageBody) {
      reply.code(400);
      return { error: "message_required" };
    }
    if (messageBody.length > 4000) {
      reply.code(400);
      return { error: "message_too_long" };
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [member] = (
        await client.query("SELECT thread_id FROM social.dm_thread_participants WHERE thread_id = $1 AND user_id = $2 FOR UPDATE", [
          threadId,
          userId
        ])
      ).rows;
      if (!member) {
        await client.query("ROLLBACK");
        reply.code(404);
        return { error: "thread_not_found" };
      }
      const [peer] = (
        await client.query<{ user_id: string }>(
          "SELECT user_id FROM social.dm_thread_participants WHERE thread_id = $1 AND user_id <> $2 LIMIT 1",
          [threadId, userId]
        )
      ).rows;
      if (!peer?.user_id) {
        await client.query("ROLLBACK");
        reply.code(404);
        return { error: "thread_not_found" };
      }
      const blockState = await getBlockStateWithClient(client, userId, peer.user_id);
      if (blockState.blockedByMe || blockState.blockedByPeer) {
        await client.query("ROLLBACK");
        reply.code(403);
        return { error: "dm_blocked" };
      }

      const messageId = randomUUID();
      const inserted = (
        await client.query(
          `INSERT INTO social.dm_messages (id, thread_id, sender_user_id, body)
           VALUES ($1,$2,$3,$4)
           RETURNING id, thread_id, sender_user_id, body, created_at, updated_at`,
          [messageId, threadId, userId, messageBody]
        )
      ).rows[0];

      await client.query(
        "UPDATE social.dm_threads SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1",
        [threadId]
      );
      await client.query(
        `UPDATE social.dm_thread_participants
         SET last_read_at = CASE WHEN user_id = $2 THEN NOW() ELSE last_read_at END,
             last_read_message_id = CASE WHEN user_id = $2 THEN $3 ELSE last_read_message_id END,
             hidden_at = NULL,
             updated_at = NOW()
         WHERE thread_id = $1`,
        [threadId, userId, messageId]
      );

      const recipients = (
        await client.query<{ user_id: string }>(
          "SELECT user_id FROM social.dm_thread_participants WHERE thread_id = $1 AND user_id <> $2",
          [threadId, userId]
        )
      ).rows;
      for (const recipient of recipients) {
        await enqueueNotificationEventWithClient(client, {
          userId: recipient.user_id,
          type: "dm_received",
          actorUserId: userId,
          refType: "dm_thread",
          refId: threadId,
          payload: {
            thread_id: threadId,
            message_id: messageId,
            body_preview: messageBody.slice(0, 200)
          },
          idempotencyKey: `notify_dm_received:${messageId}:${recipient.user_id}`
        });
      }

      await client.query("COMMIT");
      const [sender] = await query<{ username: string }>("SELECT username FROM core.users WHERE id = $1", [userId]);
      return {
        status: "ok",
        message: {
          ...inserted,
          sender_username: sender?.username ?? "unknown"
        }
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  app.post("/api/dm/threads/:id/read", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const threadId = request.params.id as string;
    const [latest] = await query<{ id: string }>(
      "SELECT id FROM social.dm_messages WHERE thread_id = $1 ORDER BY created_at DESC LIMIT 1",
      [threadId]
    );
    const result = await query<{ thread_id: string }>(
      `UPDATE social.dm_thread_participants
       SET last_read_at = NOW(),
           last_read_message_id = COALESCE($3, last_read_message_id),
           updated_at = NOW()
       WHERE thread_id = $1 AND user_id = $2
       RETURNING thread_id`,
      [threadId, userId, latest?.id ?? null]
    );
    if (!result[0]) {
      reply.code(404);
      return { error: "thread_not_found" };
    }
    return { status: "ok" };
  });

  app.delete("/api/dm/threads/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const threadId = request.params.id as string;
    const result = await query<{ thread_id: string }>(
      `UPDATE social.dm_thread_participants
       SET hidden_at = NOW(), updated_at = NOW()
       WHERE thread_id = $1 AND user_id = $2
       RETURNING thread_id`,
      [threadId, userId]
    );
    if (!result[0]) {
      reply.code(404);
      return { error: "thread_not_found" };
    }
    return { status: "ok" };
  });

  app.get("/api/dm/unread-count", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const [row] = await query<{ count: number }>(
      `SELECT COALESCE(SUM(unread_count), 0)::int AS count
       FROM (
         SELECT (
           SELECT COUNT(*)::int
           FROM social.dm_messages m
           WHERE m.thread_id = self.thread_id
             AND m.sender_user_id <> $1
             AND m.created_at > COALESCE(self.last_read_at, to_timestamp(0))
         ) AS unread_count
         FROM social.dm_thread_participants self
         WHERE self.user_id = $1
           AND self.hidden_at IS NULL
       ) q`,
      [userId]
    );
    return { unread_count: row?.count ?? 0 };
  });

  app.get("/api/dm/blocks", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const rows = await query(
      `SELECT b.blocked_user_id AS user_id,
              b.created_at,
              u.username,
              p.display_name,
              p.avatar_file_id
       FROM social.user_blocks b
       JOIN core.users u ON u.id = b.blocked_user_id
       LEFT JOIN core.profiles p ON p.user_id = b.blocked_user_id
       WHERE b.blocker_user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );
    return { blocks: rows };
  });

  app.post("/api/dm/blocks", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const body = request.body as { target_user_id?: string };
    const targetUserId = String(body.target_user_id ?? "");
    if (!targetUserId) {
      reply.code(400);
      return { error: "target_user_required" };
    }
    if (targetUserId === userId) {
      reply.code(400);
      return { error: "cannot_block_self" };
    }
    const [target] = await query<{ id: string }>("SELECT id FROM core.users WHERE id = $1", [targetUserId]);
    if (!target) {
      reply.code(404);
      return { error: "user_not_found" };
    }
    await execute(
      "INSERT INTO social.user_blocks (blocker_user_id, blocked_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [userId, targetUserId]
    );
    return { status: "ok" };
  });

  app.delete("/api/dm/blocks/:id", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const targetUserId = request.params.id as string;
    await execute("DELETE FROM social.user_blocks WHERE blocker_user_id = $1 AND blocked_user_id = $2", [
      userId,
      targetUserId
    ]);
    return { status: "ok" };
  });
}
