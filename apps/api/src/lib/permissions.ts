import { query } from "@frameworkx/shared";

export async function isAdminRole(roleId?: string | null) {
  if (!roleId) return false;
  const [role] = await query<{ name: string }>("SELECT name FROM core.roles WHERE id = $1", [roleId]);
  return role?.name === "admin";
}

export async function requirePermission(request: any, reply: any, key: string) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401);
    throw new Error("unauthorized");
  }

  const roleId = request.user.role_id as string | undefined;
  if (await isAdminRole(roleId)) {
    return;
  }

  const userId = request.user.sub as string;
  const rows = await query<{ enabled: boolean }>(
    `SELECT up.enabled
     FROM core.user_permissions up
     JOIN core.permissions p ON p.id = up.permission_id
     WHERE up.user_id = $1 AND p.key = $2`,
    [userId, key]
  );
  const defaultDeny = new Set(["lora.upload"]);
  if (!rows.length && defaultDeny.has(key)) {
    reply.code(403);
    throw new Error("forbidden");
  }
  if (rows.length && rows[0]?.enabled === false) {
    reply.code(403);
    throw new Error("forbidden");
  }
}
