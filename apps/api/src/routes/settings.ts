import type { FastifyInstance } from "fastify";
import { query, execute, loadConfig, encryptWithKey } from "@frameworkx/shared";
import { randomUUID } from "node:crypto";

const config = loadConfig(process.cwd());

function normalizeSettingValue(value: any) {
  if (value === undefined) return null;
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  return value;
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

export async function registerSettingsRoutes(app: FastifyInstance) {
  app.get("/api/settings", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const global = await query<{ key: string; value: any }>(
      "SELECT key, value FROM core.settings WHERE scope = 'global'",
      []
    );
    const user = await query<{ key: string; value: any }>(
      "SELECT key, value FROM core.settings WHERE scope = 'user' AND scope_id = $1",
      [userId]
    );
    return { global, user };
  });

  app.put("/api/settings/admin", { preHandler: requireAdmin }, async (request) => {
    const body = request.body as { key?: string; value?: any };
    if (!body.key) {
      return { error: "key_required" };
    }
    const storedValue =
      body.key === "smtp_pass"
        ? { encrypted: true, value: encryptWithKey(config.installKey, String(body.value ?? "")) }
        : normalizeSettingValue(body.value ?? {});
    await execute(
      "INSERT INTO core.settings (id, scope, scope_id, key, value) VALUES ($1, 'global', NULL, $2, $3) ON CONFLICT (scope, scope_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
      [randomUUID(), body.key, storedValue]
    );
    return { status: "ok" };
  });

  app.put("/api/settings/user", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const body = request.body as { key?: string; value?: any };
    if (!body.key) {
      return { error: "key_required" };
    }
    await execute(
      "INSERT INTO core.settings (id, scope, scope_id, key, value) VALUES ($1, 'user', $2, $3, $4) ON CONFLICT (scope, scope_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
      [randomUUID(), userId, body.key, normalizeSettingValue(body.value ?? {})]
    );
    return { status: "ok" };
  });
}
