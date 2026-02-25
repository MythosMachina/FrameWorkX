import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

const databaseUrl = process.env.FRAMEWORKX_DATABASE_URL;
if (!databaseUrl) {
  console.error("FRAMEWORKX_DATABASE_URL is required");
  process.exit(1);
}

const migrationsDir = path.resolve(process.cwd(), "migrations");
const migrations = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

async function run() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  await client.query("CREATE SCHEMA IF NOT EXISTS core");
  await client.query("CREATE TABLE IF NOT EXISTS core.migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
  for (const file of migrations) {
    const id = file;
    const result = await client.query("SELECT 1 FROM core.migrations WHERE id = $1", [id]);
    if (result.rowCount > 0) {
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`Applying ${file}...`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO core.migrations (id) VALUES ($1)", [id]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }
  await client.end();
  console.log("Migrations complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
