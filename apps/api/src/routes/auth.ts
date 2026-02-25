import type { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { randomUUID } from "node:crypto";
import {
  query,
  execute,
  randomToken,
  hashToken,
  pool,
  encryptWithKey,
  decryptWithKey
} from "@frameworkx/shared";
import { loadConfig } from "@frameworkx/shared";
import { loadMailSettings, sendMail } from "../lib/mailer.js";
import { renderPasswordResetEmail } from "../templates/email_templates.js";
import {
  buildOtpAuthUri,
  generateBase32Secret,
  generateRecoverySequences,
  hashIp,
  hashRecoveryCode,
  hashUserAgent,
  detectRecoverySequenceFormat,
  normalizeIpFromRequest,
  normalizeRecoverySequence,
  verifyTotpCode
} from "../lib/totp.js";

const config = loadConfig(process.cwd());

async function ensureCoreSeeds() {
  const roles = await query<{ name: string }>("SELECT name FROM core.roles", []);
  const have = new Set(roles.map((r) => r.name));
  const now = new Date().toISOString();
  const seed = [
    { name: "admin", description: "Full access" },
    { name: "member", description: "Standard user" },
    { name: "guest", description: "Read-only" }
  ];
  for (const role of seed) {
    if (have.has(role.name)) continue;
    await execute(
      "INSERT INTO core.roles (id, name, description, created_at, updated_at) VALUES ($1,$2,$3,$4,$4)",
      [randomUUID(), role.name, role.description, now]
    );
  }
}

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

function issueAccessToken(app: FastifyInstance, user: { id: string; role_id: string }, ipHash?: string | null) {
  return app.jwt.sign({ sub: user.id, role_id: user.role_id, ip_hash: ipHash ?? null });
}

async function upsertTrustedIp(input: {
  userId: string;
  ipHash: string;
  userAgentHash?: string | null;
  days?: number;
}) {
  const ttlDays = Math.max(1, Number(input.days ?? 30));
  await execute(
    `INSERT INTO core.user_trusted_ips
      (id, user_id, ip_hash, first_seen_at, last_seen_at, expires_at, user_agent_hash, updated_at)
     VALUES
      ($1,$2,$3,NOW(),NOW(),NOW() + ($4 || ' days')::interval,$5,NOW())
     ON CONFLICT (user_id, ip_hash)
     DO UPDATE SET
       last_seen_at = NOW(),
       expires_at = NOW() + ($4 || ' days')::interval,
       user_agent_hash = EXCLUDED.user_agent_hash,
       updated_at = NOW()`,
    [randomUUID(), input.userId, input.ipHash, String(ttlDays), input.userAgentHash ?? null]
  );
  await execute(
    `DELETE FROM core.user_trusted_ips
     WHERE user_id = $1
       AND id NOT IN (
         SELECT id
         FROM core.user_trusted_ips
         WHERE user_id = $1
         ORDER BY last_seen_at DESC
         LIMIT 20
       )`,
    [input.userId]
  );
}

export async function registerAuthRoutes(app: FastifyInstance) {
  await ensureCoreSeeds();

  app.post("/api/auth/register", async (request, reply) => {
    const body = request.body as { email?: string; username?: string; password?: string };
    if (!body.email || !body.username || !body.password) {
      reply.code(400);
      return { error: "missing_fields" };
    }

    const existing = await query("SELECT id FROM core.users WHERE email = $1 OR username = $2", [
      body.email,
      body.username
    ]);
    if (existing.length > 0) {
      reply.code(409);
      return { error: "user_exists" };
    }

    const users = await query<{ count: string }>("SELECT COUNT(*)::int AS count FROM core.users");
    const isFirstUser = Number(users[0]?.count ?? 0) === 0;
    const roleName = isFirstUser ? "admin" : "member";
    const [role] = await query<{ id: string }>("SELECT id FROM core.roles WHERE name = $1", [roleName]);

    const hash = await argon2.hash(body.password, { type: argon2.argon2id });
    const id = randomUUID();
    await execute(
      "INSERT INTO core.users (id, email, username, password_hash, role_id) VALUES ($1,$2,$3,$4,$5)",
      [id, body.email, body.username, hash, role?.id ?? null]
    );
    await execute("INSERT INTO core.credits (user_id, balance, daily_allowance) VALUES ($1, 0, 0)", [id]);

    return { status: "ok", id, role: roleName };
  });

  app.post("/api/auth/login", async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    if (!body.email || !body.password) {
      reply.code(400);
      return { error: "missing_fields" };
    }

    const [user] = await query<{ id: string; password_hash: string; status: string; role_id: string }>(
      "SELECT id, password_hash, status, role_id FROM core.users WHERE email = $1",
      [body.email]
    );
    if (!user) {
      reply.code(401);
      return { error: "invalid_credentials" };
    }
    if (user.status !== "active") {
      reply.code(403);
      return { error: "user_inactive" };
    }

    const valid = await argon2.verify(user.password_hash, body.password);
    if (!valid) {
      reply.code(401);
      return { error: "invalid_credentials" };
    }

    const ip = normalizeIpFromRequest(request);
    const userAgent = String(request.headers["user-agent"] ?? "");
    const ipHash = hashIp(config.installKey, ip);
    const userAgentHash = userAgent ? hashUserAgent(config.installKey, userAgent) : null;

    const [twoFa] = await query<{
      enabled: boolean;
      locked: boolean;
    }>("SELECT enabled, locked FROM core.user_2fa WHERE user_id = $1", [user.id]);

    if (!twoFa?.enabled) {
      const token = issueAccessToken(app, user, ipHash);
      return { token };
    }

    if (twoFa.locked) {
      await execute(
        "UPDATE core.auth_challenges SET status = 'consumed', updated_at = NOW() WHERE user_id = $1 AND challenge_type = 'login_2fa' AND status = 'pending'",
        [user.id]
      );
      const lockedChallengeId = randomUUID();
      await execute(
        `INSERT INTO core.auth_challenges
          (id, user_id, challenge_type, status, ip_hash, user_agent_hash, expires_at, payload)
         VALUES
          ($1,$2,'login_2fa','pending',$3,$4,NOW() + INTERVAL '10 minutes','{}'::jsonb)`,
        [lockedChallengeId, user.id, ipHash, userAgentHash]
      );
      return { error: "totp_locked", challenge_id: lockedChallengeId };
    }

    const [trusted] = await query<{ id: string }>(
      "SELECT id FROM core.user_trusted_ips WHERE user_id = $1 AND ip_hash = $2 AND expires_at > NOW() LIMIT 1",
      [user.id, ipHash]
    );
    if (trusted?.id) {
      await execute("UPDATE core.user_trusted_ips SET last_seen_at = NOW(), updated_at = NOW() WHERE id = $1", [trusted.id]);
      const token = issueAccessToken(app, user, ipHash);
      return { token };
    }

    await execute(
      "UPDATE core.auth_challenges SET status = 'consumed', updated_at = NOW() WHERE user_id = $1 AND challenge_type = 'login_2fa' AND status = 'pending'",
      [user.id]
    );
    const challengeId = randomUUID();
    await execute(
      `INSERT INTO core.auth_challenges
        (id, user_id, challenge_type, status, ip_hash, user_agent_hash, expires_at, payload)
       VALUES
        ($1,$2,'login_2fa','pending',$3,$4,NOW() + INTERVAL '10 minutes','{}'::jsonb)`,
      [challengeId, user.id, ipHash, userAgentHash]
    );
    return { status: "totp_required", challenge_id: challengeId };
  });

  app.post("/api/auth/login/2fa/verify", async (request: any, reply) => {
    const body = request.body as {
      challenge_id?: string;
      code?: string;
      emergency_sequence?: string;
    };
    const challengeId = String(body.challenge_id ?? "");
    if (!challengeId) {
      reply.code(400);
      return { error: "challenge_required" };
    }
    const [challenge] = await query<{
      id: string;
      user_id: string;
      status: string;
      expires_at: string;
      ip_hash: string | null;
      user_agent_hash: string | null;
    }>(
      `SELECT id, user_id, status, expires_at, ip_hash, user_agent_hash
       FROM core.auth_challenges
       WHERE id = $1 AND challenge_type = 'login_2fa'`,
      [challengeId]
    );
    if (!challenge || challenge.status !== "pending" || new Date(challenge.expires_at).getTime() < Date.now()) {
      reply.code(400);
      return { error: "challenge_invalid" };
    }

    const [user] = await query<{ id: string; role_id: string }>(
      "SELECT id, role_id FROM core.users WHERE id = $1",
      [challenge.user_id]
    );
    if (!user) {
      reply.code(404);
      return { error: "user_not_found" };
    }

    const [twoFa] = await query<{
      enabled: boolean;
      locked: boolean;
      failed_attempts: number;
      totp_secret_encrypted: string | null;
    }>(
      "SELECT enabled, locked, failed_attempts, totp_secret_encrypted FROM core.user_2fa WHERE user_id = $1",
      [challenge.user_id]
    );
    if (!twoFa?.enabled || !twoFa.totp_secret_encrypted) {
      reply.code(400);
      return { error: "totp_not_enabled" };
    }

    const emergencyRaw = String(body.emergency_sequence ?? "").trim();
    const emergencyFormat = detectRecoverySequenceFormat(emergencyRaw);
    const emergencyInput = normalizeRecoverySequence(emergencyRaw);
    if (emergencyInput) {
      if (!emergencyFormat) {
        reply.code(400);
        return { error: "emergency_code_invalid" };
      }
      const emergencyHash = hashRecoveryCode(emergencyInput);
      const [row] = await query<{ id: string }>(
        `SELECT id
         FROM core.user_2fa_recovery_codes
         WHERE user_id = $1 AND used_at IS NULL AND code_hash = $2
         LIMIT 1`,
        [challenge.user_id, emergencyHash]
      );
      if (!row) {
        reply.code(400);
        return { error: "emergency_code_invalid" };
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("UPDATE core.user_2fa_recovery_codes SET used_at = NOW() WHERE id = $1", [row.id]);
        await client.query(
          `UPDATE core.user_2fa
           SET enabled = false,
               totp_secret_encrypted = NULL,
               pending_secret_encrypted = NULL,
               onboarding_started_at = NULL,
               failed_attempts = 0,
               locked = false,
               locked_at = NULL,
               updated_at = NOW()
           WHERE user_id = $1`,
          [challenge.user_id]
        );
        await client.query("DELETE FROM core.user_2fa_recovery_codes WHERE user_id = $1 AND id <> $2", [
          challenge.user_id,
          row.id
        ]);
        await client.query("DELETE FROM core.user_trusted_ips WHERE user_id = $1", [challenge.user_id]);
        await client.query("UPDATE core.auth_challenges SET status = 'consumed', updated_at = NOW() WHERE id = $1", [challengeId]);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
      const token = issueAccessToken(app, user, challenge.ip_hash ?? null);
      return { token, status: "recovered_reset", reset_required: true };
    }

    if (twoFa.locked) {
      reply.code(403);
      return { error: "totp_locked" };
    }

    const submittedCode = String(body.code ?? "");
    const secret = decryptWithKey(config.installKey, twoFa.totp_secret_encrypted);
    const ok = verifyTotpCode(secret, submittedCode);
    if (!ok) {
      const nextFailed = Number(twoFa.failed_attempts ?? 0) + 1;
      const lock = nextFailed >= 3;
      await execute(
        `UPDATE core.user_2fa
         SET failed_attempts = $2,
             locked = $3,
             locked_at = CASE WHEN $3 THEN NOW() ELSE locked_at END,
             updated_at = NOW()
         WHERE user_id = $1`,
        [challenge.user_id, nextFailed, lock]
      );
      if (lock) {
        reply.code(403);
        return { error: "totp_locked" };
      }
      reply.code(400);
      return { error: "totp_invalid", attempts_left: Math.max(0, 3 - nextFailed) };
    }

    await execute(
      "UPDATE core.user_2fa SET failed_attempts = 0, locked = false, locked_at = NULL, updated_at = NOW() WHERE user_id = $1",
      [challenge.user_id]
    );
    await execute("UPDATE core.auth_challenges SET status = 'consumed', updated_at = NOW() WHERE id = $1", [challengeId]);
    if (challenge.ip_hash) {
      await upsertTrustedIp({
        userId: challenge.user_id,
        ipHash: challenge.ip_hash,
        userAgentHash: challenge.user_agent_hash
      });
    }
    const token = issueAccessToken(app, user, challenge.ip_hash ?? null);
    return { token };
  });

  app.get("/api/auth/2fa/status", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const [state] = await query<{
      enabled: boolean;
      locked: boolean;
      failed_attempts: number;
      pending_secret_encrypted: string | null;
    }>(
      `SELECT enabled, locked, failed_attempts, pending_secret_encrypted
       FROM core.user_2fa
       WHERE user_id = $1`,
      [userId]
    );
    const [trusted] = await query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM core.user_trusted_ips WHERE user_id = $1 AND expires_at > NOW()",
      [userId]
    );
    const [remaining] = await query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM core.user_2fa_recovery_codes WHERE user_id = $1 AND used_at IS NULL",
      [userId]
    );
    return {
      enabled: Boolean(state?.enabled ?? false),
      locked: Boolean(state?.locked ?? false),
      failed_attempts: Number(state?.failed_attempts ?? 0),
      onboarding_pending: Boolean(state?.pending_secret_encrypted),
      trusted_ip_count: Number(trusted?.count ?? 0),
      recovery_remaining: Number(remaining?.count ?? 0)
    };
  });

  app.post("/api/auth/2fa/onboarding/start", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const [user] = await query<{ email: string; username: string }>(
      "SELECT email, username FROM core.users WHERE id = $1",
      [userId]
    );
    const secret = generateBase32Secret();
    const otpAuthUri = buildOtpAuthUri("FrameWorkX", user?.email || user?.username || "user", secret);
    await execute(
      `INSERT INTO core.user_2fa
        (user_id, enabled, pending_secret_encrypted, onboarding_started_at, failed_attempts, locked, updated_at)
       VALUES
        ($1,false,$2,NOW(),0,false,NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         enabled = false,
         pending_secret_encrypted = EXCLUDED.pending_secret_encrypted,
         onboarding_started_at = NOW(),
         failed_attempts = 0,
         locked = false,
         locked_at = NULL,
         updated_at = NOW()`,
      [userId, encryptWithKey(config.installKey, secret)]
    );
    return { status: "ok", secret, otpauth_uri: otpAuthUri };
  });

  app.post("/api/auth/2fa/onboarding/verify", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const body = request.body as { code?: string };
    const code = String(body.code ?? "");
    const [state] = await query<{ pending_secret_encrypted: string | null }>(
      "SELECT pending_secret_encrypted FROM core.user_2fa WHERE user_id = $1",
      [userId]
    );
    if (!state?.pending_secret_encrypted) {
      reply.code(400);
      return { error: "onboarding_not_started" };
    }
    const pendingSecret = decryptWithKey(config.installKey, state.pending_secret_encrypted);
    if (!verifyTotpCode(pendingSecret, code)) {
      reply.code(400);
      return { error: "totp_invalid" };
    }
    const sequences = generateRecoverySequences(4);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE core.user_2fa
         SET enabled = true,
             totp_secret_encrypted = $2,
             pending_secret_encrypted = NULL,
             onboarding_started_at = NULL,
             failed_attempts = 0,
             locked = false,
             locked_at = NULL,
             updated_at = NOW()
         WHERE user_id = $1`,
        [userId, encryptWithKey(config.installKey, pendingSecret)]
      );
      await client.query("DELETE FROM core.user_2fa_recovery_codes WHERE user_id = $1", [userId]);
      for (let i = 0; i < sequences.length; i += 1) {
        await client.query(
          `INSERT INTO core.user_2fa_recovery_codes
            (id, user_id, sequence_index, code_hash, used_at)
           VALUES ($1,$2,$3,$4,NULL)`,
          [randomUUID(), userId, i + 1, hashRecoveryCode(sequences[i])]
        );
      }
      await client.query("DELETE FROM core.user_trusted_ips WHERE user_id = $1", [userId]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
    return { status: "ok", recovery_sequences: sequences };
  });

  app.post("/api/auth/2fa/disable", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const body = request.body as { password?: string; code?: string; emergency_sequence?: string };
    const [user] = await query<{ password_hash: string }>(
      "SELECT password_hash FROM core.users WHERE id = $1",
      [userId]
    );
    if (!user) {
      reply.code(404);
      return { error: "user_not_found" };
    }
    const validPassword = await argon2.verify(user.password_hash, String(body.password ?? ""));
    if (!validPassword) {
      reply.code(401);
      return { error: "invalid_credentials" };
    }
    const [state] = await query<{ totp_secret_encrypted: string | null }>(
      "SELECT totp_secret_encrypted FROM core.user_2fa WHERE user_id = $1 AND enabled = true",
      [userId]
    );
    if (!state?.totp_secret_encrypted) {
      return { status: "ok" };
    }
    const emergencyRaw = String(body.emergency_sequence ?? "").trim();
    const emergencyFormat = detectRecoverySequenceFormat(emergencyRaw);
    const hasEmergency = normalizeRecoverySequence(emergencyRaw).length > 0;
    if (hasEmergency) {
      if (!emergencyFormat) {
        reply.code(400);
        return { error: "emergency_code_invalid" };
      }
      const emergencyHash = hashRecoveryCode(emergencyRaw);
      const [codeRow] = await query<{ id: string }>(
        "SELECT id FROM core.user_2fa_recovery_codes WHERE user_id = $1 AND used_at IS NULL AND code_hash = $2 LIMIT 1",
        [userId, emergencyHash]
      );
      if (!codeRow) {
        reply.code(400);
        return { error: "emergency_code_invalid" };
      }
      await execute("UPDATE core.user_2fa_recovery_codes SET used_at = NOW() WHERE id = $1", [codeRow.id]);
    } else {
      const secret = decryptWithKey(config.installKey, state.totp_secret_encrypted);
      if (!verifyTotpCode(secret, String(body.code ?? ""))) {
        reply.code(400);
        return { error: "totp_invalid" };
      }
    }
    await execute(
      `UPDATE core.user_2fa
       SET enabled = false,
           totp_secret_encrypted = NULL,
           pending_secret_encrypted = NULL,
           onboarding_started_at = NULL,
           failed_attempts = 0,
           locked = false,
           locked_at = NULL,
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
    await execute("DELETE FROM core.user_2fa_recovery_codes WHERE user_id = $1", [userId]);
    await execute("DELETE FROM core.user_trusted_ips WHERE user_id = $1", [userId]);
    return { status: "ok" };
  });

  app.post("/api/admin/users/:id/2fa/unlock", { preHandler: requireAdmin }, async (request: any, reply) => {
    const userId = request.params.id as string;
    const [user] = await query<{ id: string }>("SELECT id FROM core.users WHERE id = $1", [userId]);
    if (!user) {
      reply.code(404);
      return { error: "user_not_found" };
    }
    await execute(
      "UPDATE core.user_2fa SET failed_attempts = 0, locked = false, locked_at = NULL, updated_at = NOW() WHERE user_id = $1",
      [userId]
    );
    return { status: "ok" };
  });

  app.post("/api/auth/password/reset/request", async (request, reply) => {
    const body = request.body as { email?: string };
    if (!body.email) {
      reply.code(400);
      return { error: "email_required" };
    }
    const [user] = await query<{ id: string }>("SELECT id FROM core.users WHERE email = $1", [body.email]);
    if (!user) {
      return { status: "ok" };
    }
    const token = randomToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
    await execute(
      "INSERT INTO core.password_resets (id, user_id, token_hash, expires_at) VALUES ($1,$2,$3,$4)",
      [randomUUID(), user.id, tokenHash, expiresAt]
    );
    const settings = await loadMailSettings();
    const resetLink = `${settings.smtp_base_url ?? ""}/reset?token=${token}`;
    const email = renderPasswordResetEmail({
      resetUrl: resetLink,
      instanceLabel: settings.instance_label ?? "",
      instanceUrl: settings.instance_url ?? ""
    });
    await sendMail({ to: body.email, subject: email.subject, text: email.text, html: email.html });
    return { status: "ok" };
  });

  app.post("/api/auth/password/reset/confirm", async (request, reply) => {
    const body = request.body as { token?: string; password?: string };
    if (!body.token || !body.password) {
      reply.code(400);
      return { error: "missing_fields" };
    }
    const tokenHash = hashToken(body.token);
    const [reset] = await query<{ user_id: string; expires_at: string }>(
      "SELECT user_id, expires_at FROM core.password_resets WHERE token_hash = $1",
      [tokenHash]
    );
    if (!reset || new Date(reset.expires_at).getTime() < Date.now()) {
      reply.code(400);
      return { error: "invalid_or_expired" };
    }
    const hash = await argon2.hash(body.password, { type: argon2.argon2id });
    await execute("UPDATE core.users SET password_hash = $1 WHERE id = $2", [hash, reset.user_id]);
    await execute("DELETE FROM core.password_resets WHERE token_hash = $1", [tokenHash]);
    return { status: "ok" };
  });
}
