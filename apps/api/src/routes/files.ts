import type { FastifyInstance } from "fastify";
import { query } from "@frameworkx/shared";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

function guessContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

const storageRoot = path.resolve(process.env.FRAMEWORKX_STORAGE_ROOT ?? path.join(process.cwd(), "storage"));
const thumbRoot = path.join(storageRoot, ".thumbs");
const thumbScript = path.join(process.cwd(), "apps", "engine", "thumb.py");
const thumbPython = process.env.FRAMEWORKX_PYTHON || "python3";

function isImagePath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"].includes(ext);
}

function sanitizeThumbSize(raw: unknown) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 384;
  return Math.max(96, Math.min(1024, Math.round(parsed)));
}

async function ensureThumb(sourcePath: string, fileId: string, size: number) {
  const targetPath = path.join(thumbRoot, `${fileId}_${size}.webp`);
  try {
    await fsp.access(targetPath, fs.constants.R_OK);
    return targetPath;
  } catch {
    // create below
  }
  await fsp.mkdir(thumbRoot, { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      thumbPython,
      [thumbScript, "--input", sourcePath, "--output", targetPath, "--size", String(size), "--quality", "82"],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += String(chunk ?? "");
    });
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr.trim() || `thumbnail_failed_${code ?? "unknown"}`));
      }
    });
  });
  return targetPath;
}

export async function registerFileRoutes(app: FastifyInstance) {
  app.get("/api/files/:id", async (request: any, reply) => {
    const authHeader = request.headers.authorization ?? "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const queryToken = (request.query as { token?: string }).token ?? "";
    const variant = String((request.query as { variant?: string }).variant ?? "").trim().toLowerCase();
    const size = sanitizeThumbSize((request.query as { size?: string }).size);
    const token = bearer || queryToken;
    const fileId = (request.params as { id: string }).id;

    let payload: any = null;
    if (token) {
      try {
        payload = app.jwt.verify(token);
      } catch {
        reply.code(401);
        return { error: "unauthorized" };
      }
    }

    const userId = payload?.sub as string | undefined;
    const roleId = payload?.role_id as string | undefined;

    const [role] = roleId ? await query<{ name: string }>("SELECT name FROM core.roles WHERE id = $1", [roleId]) : [];
    const [file] = await query<{ owner_user_id: string | null; path: string }>(
      "SELECT owner_user_id, path FROM files.file_registry WHERE id = $1",
      [fileId]
    );
    if (!file) {
      reply.code(404);
      return { error: "not_found" };
    }

    let allowed = role?.name === "admin" || (userId && file.owner_user_id === userId);
    if (!allowed) {
      const publicAccess = await query(
        `SELECT 1
         FROM gallery.images i
         WHERE i.file_id = $1
           AND i.is_public = true
           AND NOT EXISTS (
             SELECT 1
             FROM gallery.nsfw_tags t
             WHERE COALESCE(i.prompt, '') ILIKE '%' || t.tag || '%'
           )
         LIMIT 1`,
        [fileId]
      );
      allowed = publicAccess.length > 0;
    }
    if (!allowed) {
      const access = await query(
        `SELECT 1
         FROM gallery.images i
         JOIN gallery.models m ON m.id = i.model_id
         WHERE i.file_id = $1 AND m.status = 'published'
         LIMIT 1`,
        [fileId]
      );
      allowed = access.length > 0;
    }
    if (!allowed) {
      const access = await query(
        `SELECT 1
         FROM gallery.lora_previews p
         JOIN gallery.loras l ON l.id = p.lora_id
         WHERE p.file_id = $1 AND l.is_public = true
         LIMIT 1`,
        [fileId]
      );
      allowed = access.length > 0;
    }
    if (!allowed) {
      const access = await query(
        `SELECT 1
         FROM core.profiles p
         WHERE p.avatar_file_id = $1
         LIMIT 1`,
        [fileId]
      );
      allowed = access.length > 0;
    }

    if (!allowed) {
      reply.code(403);
      return { error: "forbidden" };
    }

    let resolvedPath = file.path;
    if (!fs.existsSync(resolvedPath) && resolvedPath.startsWith("/data/models/")) {
      const storageRoot = (process.env.FRAMEWORKX_STORAGE_ROOT || "./storage").replace(/\/$/, "");
      const mapped = path.join(storageRoot, "models", resolvedPath.slice("/data/models/".length));
      if (fs.existsSync(mapped)) {
        resolvedPath = mapped;
      }
    }
    if (!fs.existsSync(resolvedPath)) {
      reply.code(404);
      return { error: "file_missing" };
    }

    let sendPath = resolvedPath;
    let contentType = guessContentType(resolvedPath);
    if (variant === "thumb" && isImagePath(resolvedPath)) {
      try {
        sendPath = await ensureThumb(resolvedPath, fileId, size);
        contentType = "image/webp";
      } catch {
        // fallback to original file when thumb generation fails
      }
    }

    reply.type(contentType);
    const filename = path.basename(sendPath).replace(/"/g, "");
    const isImage = contentType.startsWith("image/");
    reply.header(
      "Content-Disposition",
      `${isImage ? "inline" : "attachment"}; filename="${filename}"`
    );
    return reply.send(fs.createReadStream(sendPath));
  });
}
