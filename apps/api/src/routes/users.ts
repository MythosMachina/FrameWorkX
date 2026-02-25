import type { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { randomUUID, createHash } from "node:crypto";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import {
  enqueueCreditIntentWithClient,
  enqueueNotificationEventWithClient,
  execute,
  hashToken,
  pool,
  query,
  randomToken
} from "@frameworkx/shared";
import { loadConfig } from "@frameworkx/shared";
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

async function requireAdmin(request: any, reply: any) {
  await requireAuth(request, reply);
  const roleId = request.user.role_id as string;
  const [role] = await query<{ name: string }>("SELECT name FROM core.roles WHERE id = $1", [roleId]);
  if (role?.name !== "admin") {
    reply.code(403);
    throw new Error("forbidden");
  }
}

export async function registerUserRoutes(app: FastifyInstance) {
  const ADMIN_USER_SELECT = `SELECT u.id,
              u.email,
              u.username,
              u.status,
              r.name AS role,
              u.must_change_password,
              u.created_at,
              u.updated_at,
              c.balance AS credits_balance,
              c.daily_allowance AS credits_daily_allowance,
              c.credits_reserved AS credits_reserved,
              COALESCE(u2.enabled, false) AS twofa_enabled,
              COALESCE(u2.locked, false) AS twofa_locked,
              COALESCE(tip.trusted_ip_count, 0) AS trusted_ip_count,
              COALESCE(rec.recovery_remaining, 0) AS recovery_remaining,
              COALESCE(
                jsonb_object_agg(p.key, up.enabled) FILTER (WHERE p.key IS NOT NULL),
                '{}'::jsonb
              ) AS permissions
       FROM core.users u
       LEFT JOIN core.roles r ON r.id = u.role_id
       LEFT JOIN core.credits c ON c.user_id = u.id
       LEFT JOIN core.user_permissions up ON up.user_id = u.id
       LEFT JOIN core.permissions p ON p.id = up.permission_id
       LEFT JOIN core.user_2fa u2 ON u2.user_id = u.id
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS trusted_ip_count
         FROM core.user_trusted_ips t
         WHERE t.user_id = u.id
           AND t.expires_at > NOW()
       ) tip ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS recovery_remaining
         FROM core.user_2fa_recovery_codes rc
         WHERE rc.user_id = u.id
           AND rc.used_at IS NULL
       ) rec ON true`;

  const registerFileWithHash = async (userId: string, filePath: string, kind: string, checksum: string, size: number) => {
    const id = randomUUID();
    await execute(
      "INSERT INTO files.file_registry (id, owner_user_id, kind, path, checksum, size_bytes, mime_type) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [id, userId, kind, filePath, checksum, size, "application/octet-stream"]
    );
    return id;
  };

  app.get("/api/users/me", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const [user] = await query(
      `SELECT u.id,
              u.email,
              u.username,
              u.status,
              u.role_id,
              u.must_change_password,
              r.name AS role,
              c.balance AS credits_balance,
              c.daily_allowance AS credits_daily_allowance,
              c.credits_reserved AS credits_reserved,
              COALESCE(
                jsonb_object_agg(p.key, up.enabled) FILTER (WHERE p.key IS NOT NULL),
                '{}'::jsonb
              ) AS permissions
       FROM core.users u
       LEFT JOIN core.roles r ON r.id = u.role_id
       LEFT JOIN core.credits c ON c.user_id = u.id
       LEFT JOIN core.user_permissions up ON up.user_id = u.id
       LEFT JOIN core.permissions p ON p.id = up.permission_id
       WHERE u.id = $1
       GROUP BY u.id, r.name, c.balance, c.daily_allowance, c.credits_reserved`,
      [userId]
    );
    return user;
  });

  app.get("/api/users/me/profile", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const [profile] = await query(
      "SELECT user_id, display_name, bio, avatar_file_id FROM core.profiles WHERE user_id = $1",
      [userId]
    );
    return profile ?? { user_id: userId, display_name: "", bio: "", avatar_file_id: null };
  });

  app.put("/api/users/me/profile", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const body = request.body as { display_name?: string; bio?: string; avatar_file_id?: string };
    await execute(
      "INSERT INTO core.profiles (user_id, display_name, bio, avatar_file_id) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, bio = EXCLUDED.bio, avatar_file_id = EXCLUDED.avatar_file_id, updated_at = NOW()",
      [userId, body.display_name ?? "", body.bio ?? "", body.avatar_file_id ?? null]
    );
    return { status: "ok" };
  });

  app.post("/api/users/me/avatar", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const parts = await request.files();
    let filePath = "";
    let checksum = "";
    let sizeBytes = 0;
    for await (const part of parts) {
      if (part.type !== "file") continue;
      const original = part.filename || "avatar.png";
      const ext = path.extname(original) || ".png";
      const base = path.basename(original, ext);
      const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32) || "avatar";
      const userRoot = path.join(config.storageRoot, "users", userId, "persistent", "avatars");
      await fs.mkdir(userRoot, { recursive: true });
      const fileName = `${randomUUID()}_${safeBase}${ext}`;
      filePath = path.join(userRoot, fileName);
      const hash = createHash("sha256");
      const hasher = new Transform({
        transform(chunk, _enc, cb) {
          hash.update(chunk as Buffer);
          sizeBytes += (chunk as Buffer).length;
          cb(null, chunk);
        }
      });
      await streamPipeline(part.file, hasher, fsSync.createWriteStream(filePath));
      checksum = hash.digest("hex");
      break;
    }
    if (!filePath) {
      reply.code(400);
      return { error: "missing_file" };
    }
    const fileId = await registerFileWithHash(userId, filePath, "avatar", checksum, sizeBytes);
    await execute(
      "INSERT INTO core.profiles (user_id, display_name, bio, avatar_file_id) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id) DO UPDATE SET avatar_file_id = EXCLUDED.avatar_file_id, updated_at = NOW()",
      [userId, "", "", fileId]
    );
    return { status: "ok", file_id: fileId };
  });

  app.get("/api/users/public/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.params.id as string;
    const actorUserId = request.user.sub as string;
    const [profile] = await query(
      `SELECT u.id,
              u.username,
              p.display_name,
              p.bio,
              p.avatar_file_id
       FROM core.users u
       LEFT JOIN core.profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    if (!profile) {
      reply.code(404);
      return { error: "not_found" };
    }

    const publicImages = await query(
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
       WHERE i.user_id = $1
         AND i.is_public = true
         AND NOT EXISTS (
           SELECT 1
           FROM gallery.nsfw_tags t
           WHERE COALESCE(i.prompt, '') ILIKE '%' || t.tag || '%'
         )
       ORDER BY i.created_at DESC
       LIMIT 120`,
      [userId]
    );

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
              (SELECT COUNT(*)::int FROM social.likes WHERE target_type = 'model' AND target_id = m.id) AS like_count,
              (SELECT COUNT(*)::int FROM social.comments WHERE target_type = 'model' AND target_id = m.id) AS comment_count
       FROM gallery.models m
       JOIN core.users u ON u.id = m.user_id
       LEFT JOIN core.profiles p ON p.user_id = m.user_id
       WHERE m.user_id = $1 AND m.status = 'published'
       ORDER BY m.created_at DESC`,
      [userId]
    );

    const modelIds = models.map((m: any) => m.id);
    const modelImages = modelIds.length
      ? await query<{ id: string; model_id: string; file_id: string; created_at: string }>(
          `SELECT i.id, i.model_id, i.file_id, i.created_at
           FROM gallery.images i
           WHERE i.model_id = ANY($1)
           ORDER BY i.created_at DESC`,
          [modelIds]
        )
      : [];
    const modelGroups = new Map<string, any[]>();
    for (const image of modelImages) {
      const list = modelGroups.get(image.model_id) ?? [];
      if (list.length < 8) {
        list.push(image);
        modelGroups.set(image.model_id, list);
      }
    }
    const enrichedModels = models.map((model: any) => ({
      ...model,
      images: modelGroups.get(model.id) ?? []
    }));

    const loras = await query(
      `SELECT l.id,
              l.name,
              l.file_id,
              l.user_id,
              l.is_public,
              l.created_at,
              l.source,
              u.username,
              l.dataset_file_id,
              (SELECT COUNT(*)::int FROM social.likes WHERE target_type = 'lora' AND target_id = l.id) AS like_count,
              (SELECT COUNT(*)::int FROM social.comments WHERE target_type = 'lora' AND target_id = l.id) AS comment_count,
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
              ) AS preview_in_flight
       FROM gallery.loras l
       JOIN core.users u ON u.id = l.user_id
       WHERE l.user_id = $1 AND l.is_public = true
       ORDER BY l.created_at DESC`,
      [userId]
    );

    const [statsRow] = await query<{
      models: number;
      images: number;
      likes_models: number;
      likes_images: number;
      followers: number;
      generations_with_my_assets: number;
    }>(
      `SELECT models, images, likes_models, likes_images, followers, generations_with_my_assets
       FROM core.user_stats
       WHERE user_id = $1`,
      [userId]
    );
    const [followRow] = await query<{ follower_user_id: string }>(
      "SELECT follower_user_id FROM social.follows WHERE follower_user_id = $1 AND followed_user_id = $2",
      [actorUserId, userId]
    );

    return {
      profile,
      stats: {
        models: statsRow?.models ?? 0,
        images: statsRow?.images ?? 0,
        likes_models: statsRow?.likes_models ?? 0,
        likes_images: statsRow?.likes_images ?? 0,
        followers: statsRow?.followers ?? 0,
        generations_with_my_assets: statsRow?.generations_with_my_assets ?? 0
      },
      relationship: {
        is_self: actorUserId === userId,
        is_following: Boolean(followRow)
      },
      models: enrichedModels,
      loras,
      images: publicImages
    };
  });

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
    await execute("DELETE FROM social.follows WHERE follower_user_id = $1 AND followed_user_id = $2", [
      followerUserId,
      followedUserId
    ]);
    return { status: "ok" };
  });

  app.post("/api/users/me/tokens", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const token = randomToken(32);
    const hash = hashToken(token);
    const prefix = token.slice(0, 8);
    await execute(
      "INSERT INTO core.api_keys (id, user_id, token_hash, token_prefix) VALUES ($1,$2,$3,$4)",
      [randomUUID(), userId, hash, prefix]
    );
    return { token, prefix };
  });

  app.put("/api/users/me/password", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const body = request.body as { current_password?: string; new_password?: string };
    const newPassword = String(body.new_password ?? "");
    if (!newPassword || newPassword.length < 8) {
      reply.code(400);
      return { error: "password_too_short" };
    }
    const [row] = await query<{ password_hash: string; must_change_password: boolean }>(
      "SELECT password_hash, must_change_password FROM core.users WHERE id = $1",
      [userId]
    );
    if (!row) {
      reply.code(404);
      return { error: "user_not_found" };
    }
    if (!row.must_change_password) {
      const currentPassword = String(body.current_password ?? "");
      if (!currentPassword) {
        reply.code(400);
        return { error: "current_password_required" };
      }
      const valid = await argon2.verify(row.password_hash, currentPassword);
      if (!valid) {
        reply.code(401);
        return { error: "invalid_credentials" };
      }
    }
    const hash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await execute(
      "UPDATE core.users SET password_hash = $1, must_change_password = false, updated_at = NOW() WHERE id = $2",
      [hash, userId]
    );
    return { status: "ok" };
  });

  app.post("/api/admin/credits", { preHandler: requireAdmin }, async (request: any, reply) => {
    const body = request.body as { user_id?: string; delta?: number; daily_allowance?: number };
    if (!body.user_id || (!Number.isFinite(body.delta) && !Number.isFinite(body.daily_allowance))) {
      reply.code(400);
      return { error: "missing_fields" };
    }
    const idOrHandle = String(body.user_id);
    const uuidMatch = /^[0-9a-fA-F-]{36}$/.test(idOrHandle);
    let resolvedId = idOrHandle;
    if (!uuidMatch) {
      const [user] = await query<{ id: string }>(
        "SELECT id FROM core.users WHERE username = $1 OR email = $1",
        [idOrHandle]
      );
      if (!user) {
        reply.code(404);
        return { error: "user_not_found" };
      }
      resolvedId = user.id;
    }
    if (Number.isFinite(body.delta)) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await enqueueCreditIntentWithClient(client, {
          userId: resolvedId,
          action: "admin_adjust",
          amount: Number(body.delta),
          refType: "manual",
          refId: null,
          payload: {},
          idempotencyKey: `admin_adjust:${resolvedId}:${Date.now()}`
        });
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }
    if (Number.isFinite(body.daily_allowance)) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await enqueueCreditIntentWithClient(client, {
          userId: resolvedId,
          action: "set_daily_allowance",
          amount: Number(body.daily_allowance),
          refType: "manual",
          refId: null,
          payload: {},
          idempotencyKey: `set_daily_allowance:${resolvedId}:${Date.now()}`
        });
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }
    return { status: "ok" };
  });

  app.get("/api/admin/credits/ledger", { preHandler: requireAdmin }, async (request: any, reply) => {
    const q = request.query as {
      user?: string;
      reason?: string;
      ref_type?: string;
      delta_sign?: string;
      from?: string;
      to?: string;
      page?: string;
      page_size?: string;
    };
    const page = Math.max(1, Number(q.page ?? "1") || 1);
    const pageSize = Math.min(100, Math.max(1, Number(q.page_size ?? "25") || 25));
    const where: string[] = [];
    const params: any[] = [];

    const userQuery = String(q.user ?? "").trim().toLowerCase();
    if (userQuery) {
      params.push(`%${userQuery}%`);
      where.push(
        `(LOWER(u.username) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(CAST(l.user_id AS text)) LIKE $${params.length})`
      );
    }
    const reason = String(q.reason ?? "").trim().toLowerCase();
    if (reason) {
      params.push(`%${reason}%`);
      where.push(`LOWER(COALESCE(l.reason, '')) LIKE $${params.length}`);
    }
    const refType = String(q.ref_type ?? "").trim().toLowerCase();
    if (refType) {
      params.push(refType);
      where.push(`LOWER(COALESCE(l.ref_type, '')) = $${params.length}`);
    }
    const deltaSign = String(q.delta_sign ?? "all").toLowerCase();
    if (deltaSign === "plus") {
      where.push("l.delta > 0");
    } else if (deltaSign === "minus") {
      where.push("l.delta < 0");
    }
    const fromRaw = String(q.from ?? "").trim();
    if (fromRaw) {
      const fromDate = new Date(fromRaw);
      if (Number.isNaN(fromDate.getTime())) {
        reply.code(400);
        return { error: "invalid_from" };
      }
      params.push(fromDate.toISOString());
      where.push(`l.created_at >= $${params.length}::timestamptz`);
    }
    const toRaw = String(q.to ?? "").trim();
    if (toRaw) {
      const toDate = new Date(toRaw);
      if (Number.isNaN(toDate.getTime())) {
        reply.code(400);
        return { error: "invalid_to" };
      }
      params.push(toDate.toISOString());
      where.push(`l.created_at <= $${params.length}::timestamptz`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const offset = (page - 1) * pageSize;
    params.push(pageSize);
    const limitParam = params.length;
    params.push(offset);
    const offsetParam = params.length;

    const rows = await query(
      `SELECT l.id,
              l.user_id,
              u.username,
              u.email,
              l.delta,
              l.reason,
              l.ref_type,
              l.ref_id,
              l.created_at
       FROM core.credit_ledger l
       JOIN core.users u ON u.id = l.user_id
       ${whereSql}
       ORDER BY l.created_at DESC
       LIMIT $${limitParam}::int OFFSET $${offsetParam}::int`,
      params
    );
    const countParams = params.slice(0, params.length - 2);
    const [countRow] = await query<{ count: number }>(
      `SELECT COUNT(*)::int AS count
       FROM core.credit_ledger l
       JOIN core.users u ON u.id = l.user_id
       ${whereSql}`,
      countParams
    );
    return {
      entries: rows,
      page,
      page_size: pageSize,
      total: Number(countRow?.count ?? 0)
    };
  });

  app.get("/api/admin/credits/ledger/:id", { preHandler: requireAdmin }, async (request: any, reply) => {
    const id = String((request.params as { id: string }).id ?? "");
    const [entry] = await query(
      `SELECT l.id,
              l.user_id,
              u.username,
              u.email,
              l.delta,
              l.reason,
              l.ref_type,
              l.ref_id,
              l.created_at
       FROM core.credit_ledger l
       JOIN core.users u ON u.id = l.user_id
       WHERE l.id = $1
       LIMIT 1`,
      [id]
    );
    if (!entry) {
      reply.code(404);
      return { error: "not_found" };
    }
    const [intent] = await query(
      `SELECT id,
              action,
              amount,
              ref_type,
              ref_id,
              payload,
              status,
              error_message,
              created_at,
              processed_at,
              updated_at
       FROM core.credit_intents
       WHERE user_id = $1
         AND amount = $2
         AND COALESCE(ref_type, '') = COALESCE($3, '')
         AND (ref_id = $4 OR ($4 IS NULL AND ref_id IS NULL))
         AND status = 'processed'
       ORDER BY ABS(EXTRACT(EPOCH FROM (COALESCE(processed_at, updated_at, created_at) - $5::timestamptz))) ASC
       LIMIT 1`,
      [entry.user_id, entry.delta, entry.ref_type ?? null, entry.ref_id ?? null, entry.created_at]
    );
    return { entry, intent: intent ?? null };
  });

  app.get("/api/admin/users", { preHandler: requireAdmin }, async () => {
    const rows = await query(
      `${ADMIN_USER_SELECT}
       GROUP BY u.id, r.name, c.balance, c.daily_allowance, c.credits_reserved, u2.enabled, u2.locked, tip.trusted_ip_count, rec.recovery_remaining
       ORDER BY u.created_at DESC`
    );
    return { users: rows };
  });

  app.get("/api/admin/users/search", { preHandler: requireAdmin }, async (request: any, reply) => {
    const queryRaw = request.query as { field?: string; value?: string; limit?: string };
    const field = String(queryRaw?.field ?? "any");
    const value = String(queryRaw?.value ?? "").trim();
    if (!value) {
      return { users: [] };
    }
    const limit = Math.min(25, Math.max(1, Number(queryRaw?.limit ?? "10") || 10));
    const allowedFields = new Set(["any", "email", "username", "id"]);
    if (!allowedFields.has(field)) {
      reply.code(400);
      return { error: "invalid_field" };
    }

    const filters: string[] = [];
    const params: string[] = [];
    if (field === "email") {
      params.push(`%${value.toLowerCase()}%`);
      filters.push(`LOWER(u.email) LIKE $${params.length}`);
    } else if (field === "username") {
      params.push(`%${value.toLowerCase()}%`);
      filters.push(`LOWER(u.username) LIKE $${params.length}`);
    } else if (field === "id") {
      params.push(value.toLowerCase());
      filters.push(`LOWER(CAST(u.id AS text)) = $${params.length}`);
    } else {
      params.push(`%${value.toLowerCase()}%`);
      filters.push(
        `(LOWER(u.email) LIKE $${params.length} OR LOWER(u.username) LIKE $${params.length} OR LOWER(CAST(u.id AS text)) LIKE $${params.length})`
      );
    }
    params.push(String(limit));
    const rows = await query(
      `${ADMIN_USER_SELECT}
       WHERE ${filters.join(" AND ")}
       GROUP BY u.id, r.name, c.balance, c.daily_allowance, c.credits_reserved, u2.enabled, u2.locked, tip.trusted_ip_count, rec.recovery_remaining
       ORDER BY u.created_at DESC
       LIMIT $${params.length}::int`,
      params
    );
    return { users: rows };
  });

  app.post("/api/admin/users/:id/impersonate", { preHandler: requireAdmin }, async (request: any, reply) => {
    const targetUserId = (request.params as { id: string }).id;
    const actorUserId = request.user.sub as string;
    const body = request.body as { password?: string };
    const password = String(body?.password ?? "");
    if (!password) {
      reply.code(400);
      return { error: "password_required" };
    }
    const [actor] = await query<{ password_hash: string }>("SELECT password_hash FROM core.users WHERE id = $1", [actorUserId]);
    if (!actor) {
      reply.code(401);
      return { error: "unauthorized" };
    }
    const passwordOk = await argon2.verify(actor.password_hash, password);
    if (!passwordOk) {
      reply.code(401);
      return { error: "invalid_credentials" };
    }
    const [target] = await query<{ id: string; role_id: string; status: string; username: string; email: string }>(
      "SELECT id, role_id, status, username, email FROM core.users WHERE id = $1",
      [targetUserId]
    );
    if (!target) {
      reply.code(404);
      return { error: "user_not_found" };
    }
    if (target.status !== "active") {
      reply.code(409);
      return { error: "user_inactive" };
    }
    const expiresInSec = 60 * 60 * 8;
    const token = app.jwt.sign(
      {
        sub: target.id,
        role_id: target.role_id,
        impersonation: true,
        impersonated_by: actorUserId
      },
      { expiresIn: expiresInSec }
    );
    return {
      status: "ok",
      token,
      target_user_id: target.id,
      target_username: target.username,
      target_email: target.email,
      expires_in: expiresInSec
    };
  });

  app.put("/api/admin/users/:id", { preHandler: requireAdmin }, async (request: any, reply) => {
    const userId = (request.params as { id: string }).id;
    const body = request.body as { status?: string; role?: string };
    if (!body.status && !body.role) {
      reply.code(400);
      return { error: "missing_fields" };
    }
    if (body.role) {
      const [role] = await query<{ id: string }>("SELECT id FROM core.roles WHERE name = $1", [body.role]);
      if (!role) {
        reply.code(400);
        return { error: "invalid_role" };
      }
      await execute("UPDATE core.users SET role_id = $1, updated_at = NOW() WHERE id = $2", [role.id, userId]);
    }
    if (body.status) {
      await execute("UPDATE core.users SET status = $1, updated_at = NOW() WHERE id = $2", [body.status, userId]);
    }
    return { status: "ok" };
  });

  app.put("/api/admin/users/:id/permissions", { preHandler: requireAdmin }, async (request: any, reply) => {
    const userId = (request.params as { id: string }).id;
    const body = request.body as { key?: string; enabled?: boolean };
    if (!body.key || typeof body.enabled !== "boolean") {
      reply.code(400);
      return { error: "missing_fields" };
    }
    const [perm] = await query<{ id: string }>("SELECT id FROM core.permissions WHERE key = $1", [body.key]);
    if (!perm) {
      reply.code(404);
      return { error: "permission_not_found" };
    }
    await execute(
      `INSERT INTO core.user_permissions (user_id, permission_id, enabled)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, permission_id)
       DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW()`,
      [userId, perm.id, body.enabled]
    );
    return { status: "ok" };
  });

  app.post("/api/admin/users/:id/password/reset", { preHandler: requireAdmin }, async (request: any, reply) => {
    const userId = (request.params as { id: string }).id;
    const body = request.body as { password?: string; must_change_password?: boolean };
    const [target] = await query<{ id: string }>("SELECT id FROM core.users WHERE id = $1", [userId]);
    if (!target) {
      reply.code(404);
      return { error: "not_found" };
    }
    const nextPassword = String(body.password ?? randomToken(12));
    if (nextPassword.length < 8) {
      reply.code(400);
      return { error: "password_too_short" };
    }
    const mustChangePassword = body.must_change_password !== false;
    const hash = await argon2.hash(nextPassword, { type: argon2.argon2id });
    await execute(
      "UPDATE core.users SET password_hash = $1, must_change_password = $2, updated_at = NOW() WHERE id = $3",
      [hash, mustChangePassword, userId]
    );
    await execute("DELETE FROM core.password_resets WHERE user_id = $1", [userId]);
    return { status: "ok", password: nextPassword, must_change_password: mustChangePassword };
  });

  app.delete("/api/admin/users/:id", { preHandler: requireAdmin }, async (request: any, reply) => {
    const targetId = (request.params as { id: string }).id;
    const actorId = request.user.sub as string;
    if (targetId === actorId) {
      reply.code(400);
      return { error: "cannot_delete_self" };
    }
    const [target] = await query<{ role: string }>(
      "SELECT r.name AS role FROM core.users u JOIN core.roles r ON r.id = u.role_id WHERE u.id = $1",
      [targetId]
    );
    if (!target) {
      reply.code(404);
      return { error: "not_found" };
    }
    if (target.role === "admin") {
      const [admins] = await query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM core.users u JOIN core.roles r ON r.id = u.role_id WHERE r.name = 'admin'",
        []
      );
      if (Number(admins?.count ?? 0) <= 1) {
        reply.code(409);
        return { error: "cannot_delete_last_admin" };
      }
    }
    await execute("DELETE FROM core.users WHERE id = $1", [targetId]);
    return { status: "deleted" };
  });
}
