import fs from "node:fs";
import path from "node:path";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import pg from "pg";

const storageRoot = process.env.FRAMEWORKX_STORAGE_ROOT
  ? path.resolve(process.env.FRAMEWORKX_STORAGE_ROOT)
  : path.resolve(process.cwd(), "storage");
const databaseUrl = process.env.FRAMEWORKX_DATABASE_URL;
const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION;
const prefix = (process.env.S3_PREFIX ?? "").replace(/^\/+|\/+$/g, "");
const dryRun = process.env.DRY_RUN === "true";

if (!databaseUrl) {
  console.error("FRAMEWORKX_DATABASE_URL is required");
  process.exit(1);
}
if (!bucket || !region) {
  console.error("S3_BUCKET and S3_REGION are required");
  process.exit(1);
}

const { Client } = pg;
const s3 = new S3Client({ region });

function toKey(relPath) {
  const clean = relPath.split(path.sep).join("/");
  return prefix ? `${prefix}/${clean}` : clean;
}

async function uploadFile(filePath, key) {
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: fs.createReadStream(filePath)
    }
  });
  await upload.done();
}

async function run() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const result = await client.query("SELECT id, path FROM files.file_registry ORDER BY created_at ASC");

  for (const row of result.rows) {
    const filePath = row.path;
    if (!filePath || !filePath.startsWith(storageRoot)) {
      continue;
    }
    if (!fs.existsSync(filePath)) {
      console.warn(`Missing file: ${filePath}`);
      continue;
    }
    const rel = path.relative(storageRoot, filePath);
    const key = toKey(rel);
    const s3Path = `s3://${bucket}/${key}`;
    if (dryRun) {
      console.log(`[DRY RUN] ${filePath} -> ${s3Path}`);
      continue;
    }
    console.log(`Uploading ${filePath} -> ${s3Path}`);
    await uploadFile(filePath, key);
    await client.query("UPDATE files.file_registry SET path = $1, updated_at = NOW() WHERE id = $2", [s3Path, row.id]);
  }
  await client.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
