#!/usr/bin/env node
import { Client } from "pg";
import argon2 from "argon2";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const clean = line.startsWith("export ") ? line.slice(7) : line;
    const eq = clean.indexOf("=");
    if (eq === -1) continue;
    const key = clean.slice(0, eq).trim();
    let value = clean.slice(eq + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function ensureRoles(client) {
  const { rows } = await client.query("SELECT name FROM core.roles");
  const have = new Set(rows.map((r) => r.name));
  const now = new Date().toISOString();
  const seed = [
    { name: "admin", description: "Full access" },
    { name: "member", description: "Standard user" },
    { name: "guest", description: "Read-only" }
  ];
  for (const role of seed) {
    if (have.has(role.name)) continue;
    await client.query(
      "INSERT INTO core.roles (id, name, description, created_at, updated_at) VALUES ($1,$2,$3,$4,$4)",
      [randomUUID(), role.name, role.description, now]
    );
  }
}

async function ensureAdminUser(client) {
  const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM core.users");
  const count = Number(rows[0]?.count ?? 0);
  if (count > 0) return { created: false };

  let email = process.env.FRAMEWORKX_ADMIN_EMAIL;
  let username = process.env.FRAMEWORKX_ADMIN_USERNAME;
  let password = process.env.FRAMEWORKX_ADMIN_PASSWORD;

  if (!email && process.stdin.isTTY) email = await ask("Admin email: ");
  if (!username && process.stdin.isTTY) username = await ask("Admin username: ");
  if (!password && process.stdin.isTTY) password = await ask("Admin password (will be visible): ");

  if (!email || !username || !password) {
    throw new Error("missing_admin_credentials");
  }

  const [role] = (await client.query("SELECT id FROM core.roles WHERE name = 'admin' LIMIT 1")).rows;
  const hash = await argon2.hash(password, { type: argon2.argon2id });
  const id = randomUUID();
  await client.query(
    "INSERT INTO core.users (id, email, username, password_hash, role_id) VALUES ($1,$2,$3,$4,$5)",
    [id, email, username, hash, role?.id ?? null]
  );
  await client.query("INSERT INTO core.credits (user_id, balance, daily_allowance) VALUES ($1,$2,$3)", [
    id,
    Number(process.env.FRAMEWORKX_ADMIN_CREDITS ?? 0),
    Number(process.env.FRAMEWORKX_ADMIN_DAILY_ALLOWANCE ?? 0)
  ]);
  await client.query(
    "INSERT INTO core.profiles (user_id, display_name) VALUES ($1,$2) ON CONFLICT (user_id) DO NOTHING",
    [id, username]
  );
  return { created: true, email, username };
}

async function main() {
  loadEnvFile(path.resolve(process.cwd(), ".env"));

  const databaseUrl = process.env.FRAMEWORKX_DATABASE_URL;
  if (!databaseUrl) {
    console.error("FRAMEWORKX_DATABASE_URL is required. Set it in .env or the environment.");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("BEGIN");
    await ensureRoles(client);
    const admin = await ensureAdminUser(client);
    await client.query("COMMIT");
    if (admin.created) {
      console.log(`Created admin user: ${admin.email} (${admin.username})`);
    } else {
      console.log("Admin user already exists. No user changes made.");
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err?.message ?? err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
