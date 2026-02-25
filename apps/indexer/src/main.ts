import { loadConfig, query, execute } from "@frameworkx/shared";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

const config = loadConfig(process.cwd());

async function registerFile(userId: string | null, filePath: string, kind: string) {
  const stat = await fs.stat(filePath);
  const hash = createHash("sha256");
  const stream = fsSync.createReadStream(filePath);
  for await (const chunk of stream) {
    hash.update(chunk as Buffer);
  }
  const checksum = hash.digest("hex");
  const existing = await query<{ id: string }>("SELECT id FROM files.file_registry WHERE path = $1", [filePath]);
  if (existing.length > 0) return;
  await execute(
    "INSERT INTO files.file_registry (id, owner_user_id, kind, path, checksum, size_bytes, mime_type) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [randomUUID(), userId, kind, filePath, checksum, stat.size, "application/octet-stream"]
  );
}

async function scan() {
  const usersRoot = path.join(config.storageRoot, "users");
  if (!fsSync.existsSync(usersRoot)) return;
  const userDirs = await fs.readdir(usersRoot, { withFileTypes: true });
  for (const userDir of userDirs) {
    if (!userDir.isDirectory()) continue;
    const userId = userDir.name;
    const outputsDir = path.join(usersRoot, userId, "outputs");
    if (!fsSync.existsSync(outputsDir)) continue;
    const jobDirs = await fs.readdir(outputsDir, { withFileTypes: true });
    for (const jobDir of jobDirs) {
      if (!jobDir.isDirectory()) continue;
      const files = await fs.readdir(path.join(outputsDir, jobDir.name));
      for (const file of files) {
        const filePath = path.join(outputsDir, jobDir.name, file);
        await registerFile(userId, filePath, "image");
      }
    }
  }
}

async function loop() {
  while (true) {
    await scan();
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}

loop();
