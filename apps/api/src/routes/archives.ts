import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { pipeline as streamPipeline } from "node:stream/promises";
import unzipper from "unzipper";
import { execute, loadConfig, purgeOldArchives, query } from "@frameworkx/shared";

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

type ArchiveManifestEntry = { path: string; name: string; type: string; size?: number };
type ArchiveManifest = {
  created_at?: string;
  label?: string;
  user_id?: string | null;
  origin?: string | null;
  type?: string | null;
  reason?: string | null;
  source_id?: string | null;
  source_name?: string | null;
  entries?: ArchiveManifestEntry[];
  [key: string]: any;
};

type ArchiveInfo = {
  path: string;
  size_bytes: number;
  modified_at: string;
  user_id: string | null;
  label: string | null;
  display_name: string | null;
  origin: string | null;
  type: string | null;
  reason: string | null;
  source_id: string | null;
  source_name: string | null;
  created_at: string | null;
  entry_count: number | null;
};

const userIdFromPath = (storageRoot: string, archivePath: string) => {
  const rel = path.relative(storageRoot, archivePath);
  const parts = rel.split(path.sep);
  if (parts[0] === "users" && parts[2] === "persistent" && parts[3] === "archive") {
    return parts[1] ?? null;
  }
  return null;
};

const isSafeArchivePath = (storageRoot: string, archivePath: string) => {
  const resolved = path.resolve(archivePath);
  return resolved.startsWith(path.resolve(storageRoot));
};

const sanitizeTargetPath = (storageRoot: string, targetPath: string) => {
  const resolved = path.resolve(targetPath);
  if (!resolved.startsWith(path.resolve(storageRoot))) return null;
  return resolved;
};

const deriveOwnerUserId = (storageRoot: string, targetPath: string) => {
  const rel = path.relative(storageRoot, targetPath);
  const parts = rel.split(path.sep);
  if (parts[0] === "users" && parts[1]) return parts[1];
  return null;
};

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

async function deriveSourceFromLabel(label?: string | null) {
  if (!label) return { source_id: null, source_name: null, type: null };
  const idMatch = label.match(UUID_RE);
  const sourceId = idMatch ? idMatch[0] : null;
  if (!sourceId) {
    if (label.startsWith("training_delete")) {
      return { source_id: null, source_name: null, type: "file_cleanup", reason: "delete_unused" };
    }
    return { source_id: null, source_name: null, type: null, reason: null };
  }

  if (label.startsWith("pipeline_")) {
    const [row] = await query<{ name: string | null; upload_file_id: string | null; dataset_file_id: string | null }>(
      "SELECT name, upload_file_id, dataset_file_id FROM pipeline.runs WHERE id = $1",
      [sourceId]
    );
    let sourceName = row?.name ?? null;
    if (!sourceName) {
      const fileId = row?.upload_file_id ?? row?.dataset_file_id ?? null;
      if (fileId) {
        const [fileRow] = await query<{ path: string }>("SELECT path FROM files.file_registry WHERE id = $1", [fileId]);
        if (fileRow?.path) sourceName = path.basename(fileRow.path);
      }
    }
    return {
      source_id: sourceId,
      source_name: sourceName,
      type: "pipeline_run",
      reason: "delete_pipeline_run"
    };
  }

  if (label.startsWith("training_")) {
    const [row] = await query<{ pipeline_run_id: string | null; dataset_file_id: string | null }>(
      "SELECT pipeline_run_id, dataset_file_id FROM training.runs WHERE id = $1",
      [sourceId]
    );
    let sourceName: string | null = null;
    if (row?.pipeline_run_id) {
      const [pipelineRow] = await query<{ name: string | null; upload_file_id: string | null; dataset_file_id: string | null }>(
        "SELECT name, upload_file_id, dataset_file_id FROM pipeline.runs WHERE id = $1",
        [row.pipeline_run_id]
      );
      sourceName = pipelineRow?.name ?? null;
      if (!sourceName) {
        const fileId = pipelineRow?.upload_file_id ?? pipelineRow?.dataset_file_id ?? null;
        if (fileId) {
          const [fileRow] = await query<{ path: string }>("SELECT path FROM files.file_registry WHERE id = $1", [fileId]);
          if (fileRow?.path) sourceName = path.basename(fileRow.path);
        }
      }
    }
    if (!sourceName && row?.dataset_file_id) {
      const [fileRow] = await query<{ path: string }>("SELECT path FROM files.file_registry WHERE id = $1", [
        row.dataset_file_id
      ]);
      if (fileRow?.path) sourceName = path.basename(fileRow.path);
    }
    return {
      source_id: sourceId,
      source_name: sourceName,
      type: "training_run",
      reason: "delete_training_run"
    };
  }

  if (label.startsWith("generation_")) {
    const [row] = await query<{ prompt: string | null }>("SELECT prompt FROM generation.jobs WHERE id = $1", [sourceId]);
    return {
      source_id: sourceId,
      source_name: row?.prompt ?? null,
      type: "generation_job",
      reason: "delete_generation_job"
    };
  }

  if (label.startsWith("lora_")) {
    const [row] = await query<{ name: string | null }>("SELECT name FROM gallery.loras WHERE id = $1", [sourceId]);
    return {
      source_id: sourceId,
      source_name: row?.name ?? null,
      type: "lora",
      reason: "delete_lora"
    };
  }

  return { source_id: sourceId, source_name: null, type: null, reason: null };
}

const deriveKind = (targetPath: string) => {
  if (targetPath.includes(`${path.sep}persistent${path.sep}loras${path.sep}`)) return "lora";
  if (targetPath.includes(`${path.sep}persistent${path.sep}datasets${path.sep}`)) return "dataset";
  if (targetPath.includes(`${path.sep}persistent${path.sep}models${path.sep}`)) return "model";
  if (targetPath.includes(`${path.sep}persistent${path.sep}avatars${path.sep}`)) return "avatar";
  if (targetPath.includes(`${path.sep}outputs${path.sep}`)) return "generation_output";
  if (targetPath.includes(`${path.sep}training${path.sep}`)) return "training_output";
  return "file";
};

async function readArchiveManifest(archivePath: string): Promise<ArchiveManifest | null> {
  try {
    const zip = await unzipper.Open.file(archivePath);
    const entry = zip.files.find((file) => file.path === "manifest.json");
    if (!entry) return null;
    const buffer = await entry.buffer();
    return JSON.parse(buffer.toString("utf-8"));
  } catch {
    return null;
  }
}

async function listArchiveFiles(root: string, results: string[]) {
  let entries: fsSync.Dirent[];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await listArchiveFiles(fullPath, results);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".zip")) {
      results.push(fullPath);
    }
  }
}

export async function registerArchiveRoutes(app: FastifyInstance) {
  const resolveArchiveRetentionDays = async () => {
    const [row] = await query<{ value: any }>(
      "SELECT value FROM core.settings WHERE scope = 'global' AND key = 'archive_retention_days' ORDER BY updated_at DESC, created_at DESC LIMIT 1"
    );
    const parsed = Number(row?.value ?? 30);
    if (!Number.isFinite(parsed) || parsed < 1) return 30;
    return Math.round(parsed);
  };
  const storeArchiveRetentionDays = async (days: number) => {
    const normalized = Math.max(1, Math.min(3650, Math.round(days)));
    await execute(
      "INSERT INTO core.settings (id, scope, scope_id, key, value) VALUES ($1, 'global', NULL, 'archive_retention_days', $2) ON CONFLICT (scope, scope_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
      [randomUUID(), normalized]
    );
    return normalized;
  };

  app.get("/api/admin/archives/retention", { preHandler: requireAdmin }, async () => {
    const retentionDays = await resolveArchiveRetentionDays();
    return { retention_days: retentionDays };
  });

  app.put("/api/admin/archives/retention", { preHandler: requireAdmin }, async (request: any, reply: any) => {
    const raw = Number(request.body?.retention_days);
    if (!Number.isFinite(raw) || raw < 1) {
      reply.code(400);
      return { error: "retention_days_invalid" };
    }
    const retentionDays = await storeArchiveRetentionDays(raw);
    return { status: "ok", retention_days: retentionDays };
  });

  app.get("/api/admin/archives", { preHandler: requireAdmin }, async (request: any) => {
    const limit = Math.min(Math.max(Number(request.query?.limit ?? 200), 1), 500);
    const queryText = String(request.query?.query ?? "").trim().toLowerCase();
    const filterUserId = String(request.query?.user_id ?? "").trim() || null;

    const roots: string[] = [];
    const usersRoot = path.join(config.storageRoot, "users");
    try {
      const userDirs = await fs.readdir(usersRoot, { withFileTypes: true });
      for (const entry of userDirs) {
        if (!entry.isDirectory()) continue;
        if (filterUserId && entry.name !== filterUserId) continue;
        roots.push(path.join(usersRoot, entry.name, "persistent", "archive"));
      }
    } catch {
      // ignore
    }
    if (!filterUserId) {
      roots.push(path.join(config.storageRoot, "archive", "system"));
    }

    const files: string[] = [];
    for (const root of roots) {
      await listArchiveFiles(root, files);
    }

    const infos: Array<{ path: string; size_bytes: number; modified_at: number; user_id: string | null }> = [];
    for (const filePath of files) {
      try {
        const stat = await fs.stat(filePath);
        infos.push({
          path: filePath,
          size_bytes: stat.size,
          modified_at: stat.mtimeMs,
          user_id: userIdFromPath(config.storageRoot, filePath)
        });
      } catch {
        // ignore
      }
    }

    infos.sort((a, b) => b.modified_at - a.modified_at);
    const archives: ArchiveInfo[] = [];
    for (const info of infos) {
      if (archives.length >= limit) break;
      let manifest: ArchiveManifest | null = null;
      if (queryText && !info.path.toLowerCase().includes(queryText)) {
        manifest = await readArchiveManifest(info.path);
        const labelMatch = manifest?.label?.toLowerCase().includes(queryText);
        const nameMatch = manifest?.source_name?.toLowerCase().includes(queryText);
        const typeMatch = manifest?.type?.toLowerCase().includes(queryText);
        const reasonMatch = manifest?.reason?.toLowerCase().includes(queryText);
        if (!labelMatch && !nameMatch && !typeMatch && !reasonMatch) continue;
      } else if (queryText || archives.length < limit) {
        manifest = await readArchiveManifest(info.path);
      }
      const createdAt = manifest?.created_at ?? null;
      const label = manifest?.label ?? null;
      const entryCount = manifest?.entries?.length ?? null;
      const derived = await deriveSourceFromLabel(label);
      const firstEntry = manifest?.entries?.find((entry) => entry?.path) ?? null;
      const zipEntry = manifest?.entries?.find((entry) => entry?.path?.toLowerCase().endsWith(".zip")) ?? null;
      const derivedName = firstEntry?.path ? path.basename(firstEntry.path) : null;
      const zipName = zipEntry?.path ? path.basename(zipEntry.path) : null;
      const sourceName = manifest?.source_name ?? derived.source_name ?? null;
      const sourceId = manifest?.source_id ?? derived.source_id ?? null;
      const type = manifest?.type ?? derived.type ?? null;
      const displayName = sourceName ?? zipName ?? label ?? derivedName ?? path.basename(info.path);
      archives.push({
        path: info.path,
        size_bytes: info.size_bytes,
        modified_at: new Date(info.modified_at).toISOString(),
        user_id: info.user_id ?? manifest?.user_id ?? null,
        label,
        display_name: displayName,
        origin: manifest?.origin ?? null,
        type,
        reason: manifest?.reason ?? derived.reason ?? null,
        source_id: sourceId,
        source_name: sourceName,
        created_at: createdAt,
        entry_count: entryCount
      });
    }

    return { archives };
  });

  app.post("/api/admin/archives/prune", { preHandler: requireAdmin }, async (request: any, reply: any) => {
    let retentionDays = await resolveArchiveRetentionDays();
    const overrideRaw = Number(request.body?.retention_days);
    if (Number.isFinite(overrideRaw)) {
      if (overrideRaw < 1) {
        reply.code(400);
        return { error: "retention_days_invalid" };
      }
      retentionDays = await storeArchiveRetentionDays(overrideRaw);
    }
    await purgeOldArchives(config.storageRoot, retentionDays);
    return { status: "ok", retention_days: retentionDays };
  });

  app.post("/api/admin/archives/restore", { preHandler: requireAdmin }, async (request: any, reply: any) => {
    const body = request.body as { archive_path?: string; overwrite?: boolean };
    const archivePath = body?.archive_path ? String(body.archive_path) : "";
    const overwrite = Boolean(body?.overwrite);
    if (!archivePath) {
      reply.code(400);
      return { error: "missing_archive_path" };
    }
    if (!isSafeArchivePath(config.storageRoot, archivePath)) {
      reply.code(400);
      return { error: "invalid_archive_path" };
    }
    const manifest = await readArchiveManifest(archivePath);
    const manifestEntries = manifest?.entries ?? [];
    const manifestByName = new Map<string, ArchiveManifestEntry>();
    for (const entry of manifestEntries) {
      if (entry?.name) manifestByName.set(entry.name, entry);
    }

    let zip: unzipper.CentralDirectory;
    try {
      zip = await unzipper.Open.file(archivePath);
    } catch {
      reply.code(400);
      return { error: "invalid_archive" };
    }

    const restored: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const entry of zip.files) {
      if (entry.path === "manifest.json") continue;
      const manifestEntry = manifestByName.get(entry.path);
      const desiredPath = manifestEntry?.path ?? path.join(config.storageRoot, entry.path);
      const targetPath = sanitizeTargetPath(config.storageRoot, desiredPath);
      if (!targetPath) {
        skipped.push(entry.path);
        try {
          entry.stream().resume();
        } catch {
          // ignore
        }
        continue;
      }
      if (entry.type === "Directory") {
        try {
          await fs.mkdir(targetPath, { recursive: true });
        } catch {
          // ignore
        }
        continue;
      }
      try {
        if (!overwrite) {
          const existing = await fs.stat(targetPath).then(() => true).catch(() => false);
          if (existing) {
            skipped.push(entry.path);
            try {
              entry.stream().resume();
            } catch {
              // ignore
            }
            continue;
          }
        }
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        const stream = entry.stream();
        await streamPipeline(stream, (await fs.open(targetPath, "w")).createWriteStream());
        restored.push(targetPath);
      } catch (err: any) {
        errors.push(`${entry.path}: ${err?.message ?? "restore_failed"}`);
        try {
          entry.stream().resume();
        } catch {
          // ignore
        }
      }
    }

    for (const restoredPath of restored) {
      try {
        const [existing] = await query<{ id: string }>("SELECT id FROM files.file_registry WHERE path = $1", [
          restoredPath
        ]);
        if (existing) continue;
        const stat = await fs.stat(restoredPath);
        const ownerId = deriveOwnerUserId(config.storageRoot, restoredPath);
        const kind = deriveKind(restoredPath);
        await execute(
          "INSERT INTO files.file_registry (id, owner_user_id, kind, path, size_bytes, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW())",
          [randomUUID(), ownerId, kind, restoredPath, stat.size]
        );
      } catch {
        // ignore
      }
    }

    return { restored: restored.length, skipped: skipped.length, errors };
  });

  app.get("/api/admin/archives/details", { preHandler: requireAdmin }, async (request: any, reply: any) => {
    const archivePath = String(request.query?.path ?? "");
    if (!archivePath) {
      reply.code(400);
      return { error: "missing_archive_path" };
    }
    if (!isSafeArchivePath(config.storageRoot, archivePath)) {
      reply.code(400);
      return { error: "invalid_archive_path" };
    }
    const manifest = await readArchiveManifest(archivePath);
    let stat: fsSync.Stats | null = null;
    try {
      stat = await fs.stat(archivePath);
    } catch {
      // ignore
    }
    const derived = await deriveSourceFromLabel(manifest?.label ?? null);
    const sourceName = manifest?.source_name ?? derived.source_name ?? null;
    const sourceId = manifest?.source_id ?? derived.source_id ?? null;
    const type = manifest?.type ?? derived.type ?? null;
    const reason = manifest?.reason ?? derived.reason ?? null;
    const displayName =
      sourceName ??
      manifest?.label ??
      (manifest?.entries?.[0]?.path ? path.basename(manifest.entries[0].path) : null) ??
      path.basename(archivePath);
    return {
      archive: {
        path: archivePath,
        size_bytes: stat?.size ?? null,
        modified_at: stat?.mtime?.toISOString() ?? null,
        user_id: userIdFromPath(config.storageRoot, archivePath),
        label: manifest?.label ?? null,
        display_name: displayName,
        origin: manifest?.origin ?? null,
        type,
        reason,
        source_id: sourceId,
        source_name: sourceName,
        created_at: manifest?.created_at ?? null,
        entry_count: manifest?.entries?.length ?? null
      },
      entries: manifest?.entries ?? [],
      manifest: manifest ?? null
    };
  });

  app.delete("/api/admin/archives", { preHandler: requireAdmin }, async (request: any, reply: any) => {
    const archivePath = String(request.query?.path ?? "");
    if (!archivePath) {
      reply.code(400);
      return { error: "missing_archive_path" };
    }
    if (!isSafeArchivePath(config.storageRoot, archivePath)) {
      reply.code(400);
      return { error: "invalid_archive_path" };
    }
    try {
      await fs.unlink(archivePath);
    } catch {
      reply.code(404);
      return { error: "not_found" };
    }
    return { status: "deleted" };
  });
}
