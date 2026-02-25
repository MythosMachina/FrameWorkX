import type { FastifyInstance } from "fastify";
import { execute, loadConfig, query } from "@frameworkx/shared";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

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

async function listTaggerModels() {
  const root = path.join(config.storageRoot, "tagger_models");
  await fs.mkdir(root, { recursive: true });
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      id: entry.name,
      name: entry.name,
      path: path.join(root, entry.name)
    }));
}

async function upsertSetting(key: string, value: any) {
  await execute(
    "INSERT INTO core.settings (id, scope, scope_id, key, value) VALUES ($1, 'global', NULL, $2, $3) ON CONFLICT (scope, scope_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
    [randomUUID(), key, normalizeSettingValue(value)]
  );
}

async function runCommand(command: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, { shell: true });
    let stderr = "";
    let stdout = "";
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error((stderr || stdout || `command_failed_${code}`).trim()));
    });
  });
}

function getPythonBin() {
  return process.env.FRAMEWORKX_PYTHON || "python3";
}

async function runPython(script: string, env: Record<string, string>) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(getPythonBin(), ["-c", script], { env: { ...process.env, ...env } });
    let stderr = "";
    let stdout = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error((stderr || stdout || `python_failed_${code}`).trim()));
    });
  });
}

export async function registerTaggerRoutes(app: FastifyInstance) {
  app.get("/api/admin/tagger/models", { preHandler: requireAdmin }, async () => {
    const models = await listTaggerModels();
    return { models };
  });

  app.post("/api/admin/tagger/default", { preHandler: requireAdmin }, async (request) => {
    const body = request.body as { model_id?: string };
    if (!body.model_id) return { error: "model_required" };
    await upsertSetting("autotag_model_id", body.model_id);
    return { status: "ok" };
  });

  app.post("/api/admin/tagger/download", { preHandler: requireAdmin }, async (request) => {
    const body = request.body as { repo_id?: string; force?: boolean };
    if (!body.repo_id) return { error: "repo_required" };
    const root = path.join(config.storageRoot, "tagger_models");
    await fs.mkdir(root, { recursive: true });
    const safeName = body.repo_id.replace(/[^a-zA-Z0-9._-]/g, "_");
    const targetDir = path.join(root, safeName);
    try {
      await fs.access(targetDir);
      if (!body.force) {
        return { status: "ok", model_id: safeName, message: "already_exists" };
      }
      await fs.rm(targetDir, { recursive: true, force: true });
    } catch {
      // continue
    }
    const [hfRow] = await query<{ value: any }>(
      "SELECT value FROM core.settings WHERE scope = 'global' AND key = 'hf_token'"
    );
    const hfToken = typeof hfRow?.value === "string" ? hfRow.value : "";
    const downloadScript = `
import os
from huggingface_hub import hf_hub_download

repo_id = os.environ["REPO_ID"]
dest_dir = os.environ["DEST_DIR"]
token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")
files = ["model.safetensors", "config.json", "selected_tags.csv"]
for name in files:
    hf_hub_download(
        repo_id=repo_id,
        filename=name,
        token=token,
        local_dir=dest_dir,
        local_dir_use_symlinks=False,
    )
`;
    try {
      await runPython(downloadScript, {
        REPO_ID: body.repo_id,
        DEST_DIR: targetDir,
        HF_TOKEN: hfToken
      });
    } catch (err) {
      return { error: "download_failed", details: (err as Error).message };
    }
    try {
      const weights = path.join(targetDir, "model.safetensors");
      const configPath = path.join(targetDir, "config.json");
      const tagsPath = path.join(targetDir, "selected_tags.csv");
      await fs.access(weights);
      await fs.access(configPath);
      await fs.access(tagsPath);
    } catch {
      await fs.rm(targetDir, { recursive: true, force: true });
      return { error: "invalid_model", details: "Missing model.safetensors, config.json, or selected_tags.csv" };
    }
    return { status: "ok", model_id: safeName, message: "downloaded" };
  });

  app.delete("/api/admin/tagger/models/:id", { preHandler: requireAdmin }, async (request: any, reply) => {
    const modelId = String((request.params as { id: string }).id || "");
    if (!modelId) {
      reply.code(400);
      return { error: "model_required" };
    }
    const [currentDefault] = await query<{ value: any }>(
      "SELECT value FROM core.settings WHERE scope = 'global' AND key = 'autotag_model_id' ORDER BY updated_at DESC LIMIT 1"
    );
    let currentId = currentDefault?.value ?? "";
    if (typeof currentId === "string") {
      try {
        currentId = JSON.parse(currentId);
      } catch {
        // keep raw string
      }
    }
    if (String(currentId ?? "") === modelId) {
      reply.code(409);
      return { error: "cannot_delete_default" };
    }
    const root = path.join(config.storageRoot, "tagger_models");
    const targetDir = path.join(root, modelId);
    try {
      await fs.rm(targetDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
    return { status: "ok" };
  });
}
