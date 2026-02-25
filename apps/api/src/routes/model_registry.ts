import type { FastifyInstance } from "fastify";
import { query, execute } from "@frameworkx/shared";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { loadConfig } from "@frameworkx/shared";

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

async function registerFile(userId: string | null, filePath: string, kind: string) {
  const stat = await fs.stat(filePath);
  const hash = createHash("sha256");
  const stream = fsSync.createReadStream(filePath);
  for await (const chunk of stream) {
    hash.update(chunk as Buffer);
  }
  const checksum = hash.digest("hex");
  const existing = await query<{ id: string }>("SELECT id FROM files.file_registry WHERE path = $1", [filePath]);
  if (existing.length > 0) return { id: existing[0].id, checksum };
  const id = randomUUID();
  await execute(
    "INSERT INTO files.file_registry (id, owner_user_id, kind, path, checksum, size_bytes, mime_type) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [id, userId, kind, filePath, checksum, stat.size, "application/octet-stream"]
  );
  return { id, checksum };
}

export async function registerModelRegistryRoutes(app: FastifyInstance) {
  app.get("/api/models/registry", { preHandler: requireAuth }, async () => {
    const rows = await query("SELECT * FROM core.model_registry ORDER BY created_at DESC", []);
    return { models: rows };
  });

  app.post("/api/models/registry", { preHandler: requireAdmin }, async (request) => {
    const body = request.body as { kind?: string; name?: string; version?: string; file_path?: string; source?: string };
    if (!body.kind || !body.name || !body.file_path) {
      return { error: "missing_fields" };
    }
    const { id: fileId, checksum } = await registerFile(null, body.file_path, body.kind);
    await execute(
      "INSERT INTO core.model_registry (id, kind, name, version, source, file_id, checksum, is_active, meta) VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8)",
      [randomUUID(), body.kind, body.name, body.version ?? null, body.source ?? "manual", fileId, checksum, {}]
    );
    return { status: "ok" };
  });

  app.post("/api/models/registry/reload", { preHandler: requireAdmin }, async () => {
    const ftpPath = path.join(config.storageRoot, "models", "ftp");
    await fs.mkdir(ftpPath, { recursive: true });
    const entries = await fs.readdir(ftpPath, { withFileTypes: true });
    const inferKind = (filename: string) => {
      const lower = filename.toLowerCase();
      if (lower.includes("yolo")) {
        return "capper_model";
      }
      if (lower.includes("tagger") || lower.includes("wd-") || lower.includes("wd_")) {
        return "tagger_model";
      }
      return "training_model";
    };
    let added = 0;
    const existingRows = await query<{ id: string; name: string; source: string }>(
      "SELECT id, name, source FROM core.model_registry WHERE source = 'ftp'"
    );
    const existingByName = new Map(existingRows.map((row) => [row.name, row]));
    const existingNames = new Set(existingRows.map((row) => row.name));
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const filePath = path.join(ftpPath, entry.name);
      const kind = inferKind(entry.name);
      const { id: fileId, checksum } = await registerFile(null, filePath, kind);
      const existing = await query("SELECT id FROM core.model_registry WHERE file_id = $1", [fileId]);
      if (existing.length > 0) {
        await execute("UPDATE core.model_registry SET kind = $1, updated_at = NOW() WHERE id = $2", [
          kind,
          existing[0].id
        ]);
        existingNames.delete(entry.name);
        continue;
      }
      if (existingByName.has(entry.name)) {
        const row = existingByName.get(entry.name)!;
        await execute(
          "UPDATE core.model_registry SET kind = $1, file_id = $2, checksum = $3, updated_at = NOW() WHERE id = $4",
          [kind, fileId, checksum, row.id]
        );
        existingNames.delete(entry.name);
        continue;
      }
      await execute(
        "INSERT INTO core.model_registry (id, kind, name, version, source, file_id, checksum, is_active, meta) VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8)",
        [randomUUID(), kind, entry.name, null, "ftp", fileId, checksum, {}]
      );
      added += 1;
    }
    if (existingNames.size > 0) {
      await execute(
        "DELETE FROM core.model_registry WHERE source = 'ftp' AND name = ANY($1::text[])",
        [[...existingNames]]
      );
    }
    return { status: "ok", added };
  });
}
