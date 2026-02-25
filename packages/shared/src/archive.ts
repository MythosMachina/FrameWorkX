import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import archiver from "archiver";

export type ArchiveEntry = {
  path: string;
  name?: string;
};

type ArchiveOptions = {
  storageRoot: string;
  userId?: string | null;
  label?: string;
  entries: ArchiveEntry[];
  manifest?: Record<string, any>;
};

const sanitizeLabel = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "archive";

const formatDateParts = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return { year, month, day };
};

const buildArchiveRoot = (storageRoot: string, userId?: string | null) => {
  if (userId) {
    return path.join(storageRoot, "users", userId, "persistent", "archive");
  }
  return path.join(storageRoot, "archive", "system");
};

const resolveArchiveName = (storageRoot: string, entryPath: string, entryName?: string) => {
  if (entryName) return entryName;
  const rel = path.relative(storageRoot, entryPath);
  if (rel && !rel.startsWith("..") && !path.isAbsolute(rel)) {
    return rel;
  }
  return path.join("external", path.basename(entryPath));
};

export async function archivePaths(options: ArchiveOptions) {
  const { storageRoot, userId, label, entries, manifest } = options;
  const timestamp = new Date();
  const { year, month, day } = formatDateParts(timestamp);
  const archiveRoot = buildArchiveRoot(storageRoot, userId);
  const targetDir = path.join(archiveRoot, String(year), month, day);
  await fsPromises.mkdir(targetDir, { recursive: true });

  const safeLabel = sanitizeLabel(label ?? "archive");
  const fileName = `${safeLabel}_${timestamp.toISOString().replace(/[:.]/g, "-")}_${randomUUID().slice(0, 8)}.zip`;
  const archivePath = path.join(targetDir, fileName);

  const output = fs.createWriteStream(archivePath);
  const zip = archiver("zip", { zlib: { level: 9 } });
  const entryDetails: Array<{ path: string; name: string; type: string; size?: number }> = [];

  const finalizePromise = new Promise<void>((resolve, reject) => {
    output.on("close", () => resolve());
    output.on("error", (err: unknown) => reject(err));
    zip.on("error", (err: unknown) => reject(err));
  });

  zip.pipe(output);

  for (const entry of entries) {
    if (!entry?.path) continue;
    let stat: fs.Stats;
    try {
      stat = await fsPromises.stat(entry.path);
    } catch {
      continue;
    }
    const name = resolveArchiveName(storageRoot, entry.path, entry.name);
    if (stat.isDirectory()) {
      zip.directory(entry.path, name);
      entryDetails.push({ path: entry.path, name, type: "directory" });
    } else if (stat.isFile()) {
      zip.file(entry.path, { name });
      entryDetails.push({ path: entry.path, name, type: "file", size: stat.size });
    }
  }

  zip.append(
    JSON.stringify(
      {
        created_at: timestamp.toISOString(),
        label: label ?? "archive",
        user_id: userId ?? null,
        entries: entryDetails,
        ...manifest
      },
      null,
      2
    ),
    { name: "manifest.json" }
  );

  await zip.finalize();
  await finalizePromise;

  return { archivePath, entries: entryDetails };
}

export async function purgeOldArchives(storageRoot: string, retentionDays: number) {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const roots: string[] = [];
  const usersRoot = path.join(storageRoot, "users");
  try {
    const users = await fsPromises.readdir(usersRoot, { withFileTypes: true });
    for (const entry of users) {
      if (!entry.isDirectory()) continue;
      roots.push(path.join(usersRoot, entry.name, "persistent", "archive"));
    }
  } catch {
    // ignore
  }
  roots.push(path.join(storageRoot, "archive", "system"));

  const walk = async (dir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = await fsPromises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".zip")) continue;
      try {
        const stat = await fsPromises.stat(fullPath);
        if (stat.mtimeMs < cutoff) {
          await fsPromises.unlink(fullPath);
        }
      } catch {
        // ignore
      }
    }
  };

  for (const root of roots) {
    await walk(root);
  }
}
