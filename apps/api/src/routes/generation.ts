import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { archivePaths, enqueueCreditIntentWithClient, loadConfig, query, pool } from "@frameworkx/shared";
import { presetStylesById } from "../styles/presets.js";
import { requirePermission } from "../lib/permissions.js";

const config = loadConfig(process.cwd());

async function requireAuth(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401);
    throw new Error("unauthorized");
  }
}

async function getGlobalSetting(key: string, fallback: any) {
  const rows = await query<{ value: any }>(
    "SELECT value FROM core.settings WHERE scope = 'global' AND key = $1 ORDER BY updated_at DESC, created_at DESC LIMIT 1",
    [key]
  );
  return rows[0]?.value ?? fallback;
}

function normalizeTriggerSeed(value: string) {
  const cleaned = String(value ?? "").trim();
  return cleaned.replace(/\.(tar\.gz|tgz|zip|rar|7z|tar)$/i, "").trim();
}

type WildcardListMap = Record<string, string[]>;

function normalizeWildcardName(value: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

function parseWildcardLists(raw: any): WildcardListMap {
  const source = raw?.lists ?? raw;
  const next: WildcardListMap = {};
  if (!source || typeof source !== "object") return next;
  if (Array.isArray(source)) {
    for (const row of source) {
      const name = normalizeWildcardName(row?.name ?? "");
      const entries = Array.isArray(row?.entries) ? row.entries.map((v: any) => String(v).trim()).filter(Boolean) : [];
      if (!name || !entries.length) continue;
      next[name] = entries;
    }
    return next;
  }
  for (const [key, value] of Object.entries(source)) {
    const name = normalizeWildcardName(key);
    const entries = Array.isArray(value) ? value.map((v: any) => String(v).trim()).filter(Boolean) : [];
    if (!name || !entries.length) continue;
    next[name] = entries;
  }
  return next;
}

async function getUserWildcardLists(userId: string): Promise<WildcardListMap> {
  const rows = await query<{ value: any }>(
    "SELECT value FROM core.settings WHERE scope = 'user' AND scope_id = $1 AND key = 'generation.wildcards' ORDER BY updated_at DESC, created_at DESC LIMIT 1",
    [userId]
  );
  return parseWildcardLists(rows[0]?.value ?? {});
}

function expandWildcardPrompt(
  prompt: string,
  lists: WildcardListMap,
  mode: "sequential" | "random"
): { prompts: string[]; tokens: string[]; error?: string; details?: string[] } {
  const tokenRegex = /__([a-z0-9_-]+)__/gi;
  const tokenNames = new Set<string>();
  for (const match of prompt.matchAll(tokenRegex)) {
    tokenNames.add(normalizeWildcardName(match[1]));
  }
  const tokens = Array.from(tokenNames);
  if (!tokens.length) {
    return { prompts: [prompt], tokens: [] };
  }
  const tokenEntries = tokens.map((token) => ({ token, entries: lists[token] ?? [] }));
  const missing = tokenEntries.filter((row) => row.entries.length === 0).map((row) => row.token);
  if (missing.length) {
    return { prompts: [], tokens, error: "wildcard_list_missing", details: missing };
  }
  const variantCount = Math.max(...tokenEntries.map((row) => row.entries.length), 1);
  const prompts: string[] = [];
  for (let i = 0; i < variantCount; i += 1) {
    let nextPrompt = prompt;
    for (const row of tokenEntries) {
      const selected =
        mode === "random"
          ? row.entries[Math.floor(Math.random() * row.entries.length)]
          : row.entries[i % row.entries.length];
      nextPrompt = nextPrompt.replace(new RegExp(`__${row.token}__`, "gi"), selected);
    }
    prompts.push(nextPrompt);
  }
  return { prompts, tokens };
}

async function deleteFileIfUnused(
  client: any,
  fileId: string,
  options?: {
    skipArchivePaths?: string[];
    archiveLabel?: string;
    manifest?: Record<string, any>;
    allowPersistentDelete?: boolean;
  }
) {
  const [refs] = (
    await client.query(
      `SELECT
        (SELECT COUNT(*)::int FROM gallery.images WHERE file_id = $1) AS gallery_count,
        (SELECT COUNT(*)::int FROM generation.outputs WHERE file_id = $1) AS output_count,
        (SELECT COUNT(*)::int FROM training.runs WHERE output_file_id = $1) AS training_count,
        (SELECT COUNT(*)::int FROM gallery.models WHERE model_file_id = $1) AS model_count,
        (SELECT COUNT(*)::int FROM core.model_registry WHERE file_id = $1) AS registry_count`,
      [fileId]
    )
  ).rows;
  const total =
    Number(refs?.gallery_count ?? 0) +
    Number(refs?.output_count ?? 0) +
    Number(refs?.training_count ?? 0) +
    Number(refs?.model_count ?? 0) +
    Number(refs?.registry_count ?? 0);
  if (total > 0) return;

  const [row] = (await client.query("SELECT path, owner_user_id FROM files.file_registry WHERE id = $1", [fileId])).rows;
  const skipArchive = options?.skipArchivePaths?.some((root) => row?.path?.startsWith(root ?? "")) ?? false;
  if (row?.path?.includes(`${path.sep}persistent${path.sep}`) && !options?.allowPersistentDelete) {
    return;
  }
  if (row?.path && !skipArchive) {
    await archivePaths({
      storageRoot: config.storageRoot,
      userId: row.owner_user_id,
      label: options?.archiveLabel ?? "generation_delete",
      entries: [{ path: row.path }],
      manifest: {
        origin: "auto",
        type: "file_cleanup",
        reason: "delete_unused",
        file_id: fileId,
        ...options?.manifest
      }
    });
  }
  await client.query("DELETE FROM files.lineage WHERE file_id = $1", [fileId]);
  await client.query("DELETE FROM files.file_registry WHERE id = $1", [fileId]);
  if (row?.path) {
    try {
      await fs.unlink(row.path);
    } catch {
      // ignore
    }
  }
}

async function deleteGenerationJob(client: any, jobId: string, userId: string, allowRunning = false) {
  const [job] = (
    await client.query("SELECT id, status, prompt, credits_reserved, credits_charged_at, credits_released_at FROM generation.jobs WHERE id = $1 AND user_id = $2", [
      jobId,
      userId
    ])
  ).rows;
  if (!job) {
    return { error: "not_found", status: 404 };
  }
  if (!allowRunning && (job.status === "rendering" || job.status === "running")) {
    return { error: "cannot_cancel_running", status: 409 };
  }

  await client.query("DELETE FROM generation.queue WHERE job_id = $1", [jobId]);

  const imageRows = (
    await client.query(
      "SELECT id, file_id, generation_output_id FROM gallery.images WHERE generation_job_id = $1",
      [jobId]
    )
  ).rows as { id: string; file_id: string; generation_output_id: string | null }[];

  if (imageRows.length) {
    await client.query(
      "UPDATE gallery.images SET generation_job_id = NULL, generation_output_id = NULL WHERE generation_job_id = $1",
      [jobId]
    );
  }

  const outputRows = (await client.query("SELECT file_id FROM generation.outputs WHERE job_id = $1", [jobId])).rows as {
    file_id: string;
  }[];
  await client.query("DELETE FROM generation.outputs WHERE job_id = $1", [jobId]);
  await client.query("DELETE FROM generation.previews WHERE job_id = $1", [jobId]);

  const fileIds = new Set<string>();
  outputRows.forEach((row) => {
    if (row.file_id) fileIds.add(row.file_id);
  });

  if (job.credits_reserved && !job.credits_charged_at && !job.credits_released_at) {
    await enqueueCreditIntentWithClient(client, {
      userId,
      action: "release_generate",
      amount: Number(job.credits_reserved),
      refType: "generation_job",
      refId: jobId,
      payload: { reason: "delete_generation_job" },
      idempotencyKey: `release_generate:${jobId}:delete`
    });
  }

  await client.query("DELETE FROM generation.jobs WHERE id = $1", [jobId]);

  const outputRoot = path.join(config.storageRoot, "users", userId, "outputs", jobId);
  const archiveEntries: { path: string }[] = [];
  try {
    await fs.stat(outputRoot);
    archiveEntries.push({ path: outputRoot });
  } catch {
    // ignore
  }
  if (fileIds.size) {
    const fileRows = (
      await client.query("SELECT path FROM files.file_registry WHERE id = ANY($1::uuid[])", [Array.from(fileIds)])
    ).rows as { path: string | null }[];
    for (const row of fileRows) {
      if (!row?.path) continue;
      if (outputRoot && row.path.startsWith(outputRoot)) continue;
      archiveEntries.push({ path: row.path });
    }
  }
  if (archiveEntries.length) {
    await archivePaths({
      storageRoot: config.storageRoot,
      userId,
      label: `generation_${jobId}`,
      entries: archiveEntries,
      manifest: {
        origin: "auto",
        type: "generation_job",
        reason: "delete_generation_job",
        source_id: jobId,
        source_name: job.prompt ?? null,
        job_id: jobId,
        user_id: userId,
        file_ids: Array.from(fileIds)
      }
    });
  }

  for (const fileId of fileIds) {
    await deleteFileIfUnused(client, fileId, {
      skipArchivePaths: [outputRoot],
      archiveLabel: "generation_delete",
      manifest: { type: "generation_output", reason: "delete_generation_job", source_id: jobId }
    });
  }

  try {
    await fs.rm(outputRoot, { recursive: true, force: true });
  } catch {
    // ignore
  }

  return { status: "ok" };
}

export async function registerGenerationRoutes(app: FastifyInstance) {
  app.get("/api/generation/jobs", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const rows = await query(
      `SELECT j.*,
        s.error_message,
        s.progress_pct,
        s.eta_seconds
       FROM generation.jobs j
       LEFT JOIN ui.generation_job_status s ON s.job_id = j.id
       WHERE j.user_id = $1
       ORDER BY j.created_at DESC`,
      [userId]
    );
    return { jobs: rows };
  });

  app.get("/api/generation/jobs/:id/outputs", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const jobId = request.params.id as string;
    const [job] = await query<{ user_id: string }>("SELECT user_id FROM generation.jobs WHERE id = $1", [jobId]);
    if (!job) {
      reply.code(404);
      return { error: "not_found" };
    }
    if (job.user_id !== userId) {
      reply.code(403);
      return { error: "forbidden" };
    }
    const rows = await query<{ id: string; file_id: string; created_at: string }>(
      "SELECT id, file_id, created_at FROM generation.outputs WHERE job_id = $1 ORDER BY created_at ASC",
      [jobId]
    );
    return { outputs: rows };
  });

  app.post("/api/generation/jobs", { preHandler: requireAuth }, async (request: any, reply) => {
    await requirePermission(request, reply, "generate.create");
    const userId = request.user.sub as string;
    const body = request.body as {
      prompt?: string;
      negative_prompt?: string;
      sampler?: string;
      scheduler?: string;
      steps?: number;
      cfg_scale?: number;
      width?: number;
      height?: number;
      seed?: number;
      batch_count?: number;
      model_id?: string;
      model_file_id?: string;
      lora_file_ids?: string[];
      is_public?: boolean;
      preset_style_ids?: string[];
      wildcard_mode?: "sequential" | "random";
    };
    if (!body.prompt) {
      reply.code(400);
      return { error: "prompt_required" };
    }

    const presetIds = Array.isArray(body.preset_style_ids) ? body.preset_style_ids : [];
    const stylePrompts = presetIds
      .map((id) => presetStylesById[id])
      .filter(Boolean)
      .map((style) => style.prompt)
      .filter(Boolean);
    const styleNegatives = presetIds
      .map((id) => presetStylesById[id])
      .filter(Boolean)
      .map((style) => style.negative_prompt)
      .filter(Boolean);
    const loraNames =
      Array.isArray(body.lora_file_ids) && body.lora_file_ids.length
        ? await query<{ name: string }>(
            "SELECT name FROM gallery.loras WHERE file_id = ANY($1::uuid[]) ORDER BY created_at ASC",
            [body.lora_file_ids]
          )
        : [];
    const loraTrigger = loraNames
      .map((row) => normalizeTriggerSeed(row.name))
      .filter(Boolean)
      .join(", ");
    const mergedPromptRaw = [loraTrigger, ...stylePrompts, body.prompt].filter(Boolean).join(", ");
    const wildcardMode = body.wildcard_mode === "random" ? "random" : "sequential";
    const wildcardLists = await getUserWildcardLists(userId);
    const expanded = expandWildcardPrompt(mergedPromptRaw, wildcardLists, wildcardMode);
    if (expanded.error) {
      reply.code(400);
      return { error: expanded.error, wildcard_lists: expanded.details ?? [] };
    }
    const promptVariants = expanded.prompts.filter(Boolean);
    const mergedPrompt = promptVariants[0] ?? mergedPromptRaw;
    const mergedNegative = [body.negative_prompt ?? "", ...styleNegatives].filter(Boolean).join(", ");
    const rawSeed = typeof body.seed === "number" ? body.seed : Number(body.seed);
    const seed = Number.isFinite(rawSeed) && rawSeed > 0 ? Math.floor(rawSeed) : null;
    const promptVariantsJson = promptVariants.length > 1 ? JSON.stringify(promptVariants) : null;

    const costPerImage = Number((await getGlobalSetting("credits.generate", 1)) ?? 1);
    const requestedBatchCount = Math.max(1, Number(body.batch_count ?? 1));
    const batchCount = Math.max(1, promptVariants.length > 1 ? promptVariants.length : requestedBatchCount);
    const cost = costPerImage * batchCount;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const jobId = randomUUID();
      await client.query(
        "INSERT INTO generation.jobs (id, user_id, status, prompt, negative_prompt, sampler, scheduler, steps, cfg_scale, width, height, seed, batch_count, model_id, model_file_id, lora_file_ids, prompt_variants, wildcard_mode, credits_reserved, is_public) VALUES ($1,$2,'credit_pending',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,0,$18)",
        [
          jobId,
          userId,
          mergedPrompt,
          mergedNegative,
          body.sampler ?? "",
          body.scheduler ?? "",
          body.steps ?? 30,
          body.cfg_scale ?? 7.5,
          body.width ?? 1024,
          body.height ?? 1024,
          seed,
          batchCount,
          body.model_id ?? null,
          body.model_file_id ?? null,
          body.lora_file_ids ?? null,
          promptVariantsJson,
          promptVariants.length > 1 ? wildcardMode : null,
          Boolean(body.is_public ?? false)
        ]
      );
      await enqueueCreditIntentWithClient(client, {
        userId,
        action: "reserve_generate",
        amount: cost,
        refType: "generation_job",
        refId: jobId,
        payload: { batch_count: batchCount, cost_per_image: costPerImage },
        idempotencyKey: `reserve_generate:${jobId}`
      });

      await client.query("COMMIT");
      return { status: "credit_pending", job_id: jobId };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  app.post("/api/generation/jobs/:id/cancel", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const jobId = request.params.id as string;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const [job] = (await client.query("SELECT * FROM generation.jobs WHERE id = $1 AND user_id = $2", [jobId, userId]))
        .rows;
      if (!job) {
        await client.query("ROLLBACK");
        reply.code(404);
        return { error: "not_found" };
      }
      if (job.status === "rendering" || job.status === "running") {
        await client.query("ROLLBACK");
        reply.code(409);
        return { error: "cannot_cancel_running" };
      }
      await client.query("DELETE FROM generation.queue WHERE job_id = $1", [jobId]);
      if (job.credits_reserved && !job.credits_charged_at && !job.credits_released_at) {
        await enqueueCreditIntentWithClient(client, {
          userId,
          action: "release_generate",
          amount: Number(job.credits_reserved),
          refType: "generation_job",
          refId: jobId,
          payload: { reason: "cancel_generation_job" },
          idempotencyKey: `release_generate:${jobId}:cancel`
        });
      }
      await client.query(
        "UPDATE generation.jobs SET status = 'cancelled', updated_at = NOW(), finished_at = NOW() WHERE id = $1",
        [jobId]
      );
      await client.query("COMMIT");
      return { status: "cancelled" };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  app.delete("/api/generation/jobs/:id", { preHandler: requireAuth }, async (request: any, reply) => {
    const userId = request.user.sub as string;
    const jobId = request.params.id as string;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await deleteGenerationJob(client, jobId, userId, false);
      if ((result as any).error) {
        await client.query("ROLLBACK");
        reply.code((result as any).status ?? 400);
        return { error: (result as any).error };
      }
      await client.query("COMMIT");
      return { status: "deleted" };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  app.delete("/api/generation/jobs", { preHandler: requireAuth }, async (request: any) => {
    const userId = request.user.sub as string;
    const scope = String((request.query as { scope?: string }).scope ?? "");
    if (scope !== "history") {
      return { error: "invalid_scope" };
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const rows = (
        await client.query(
          "SELECT id FROM generation.jobs WHERE user_id = $1 AND status IN ('failed','completed','cancelled','stopped')",
          [userId]
        )
      ).rows as { id: string }[];
      for (const row of rows) {
        await deleteGenerationJob(client, row.id, userId, false);
      }
      await client.query("COMMIT");
      return { status: "deleted", count: rows.length };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });
}
