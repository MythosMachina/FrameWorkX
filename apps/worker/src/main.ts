import { archivePaths, decryptWithKey, loadConfig, purgeOldArchives, query, execute, pool, escapeHtml, renderMailShell } from "@frameworkx/shared";
import { randomUUID, createHash } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import unzipper from "unzipper";
import nodemailer from "nodemailer";

const config = loadConfig(process.cwd());
const role = process.env.FRAMEWORKX_ROLE ?? "health";
const pollInterval = Number(process.env.FRAMEWORKX_POLL_MS ?? 3000);

const PIPELINE_STEPS = [
  "unzip",
  "rename",
  "cap",
  "archive",
  "move_capped",
  "merge_inputs",
  "select",
  "cropflip",
  "move_final",
  "autotag",
  "manual_pause",
  "manual_edit",
  "manual_done",
  "autochar",
  "package_dataset"
];

const TRAINING_STEPS = ["train_pre", "train_phase", "finishing"];

type GpuMemorySnapshot = {
  usedMb: number;
  totalMb: number;
  freeMb: number;
};

type GenerationRenderPlan = {
  width: number;
  height: number;
  steps: number;
  batchCount: number;
  memoryMode: "default" | "low_vram" | "safe";
  autoDowngraded: boolean;
  downgradeReason: string | null;
};

const generationOomRetries = new Map<string, number>();
const generationWaitState = new Map<string, string>();

async function heartbeat(runId?: string, message?: string, state: string = "idle") {
  await execute(
    "INSERT INTO pipeline.workers (role, pid, state, run_id, message, heartbeat_at) VALUES ($1,$2,$3,$4,$5,NOW()) ON CONFLICT (role) DO UPDATE SET pid = EXCLUDED.pid, state = EXCLUDED.state, run_id = EXCLUDED.run_id, message = EXCLUDED.message, heartbeat_at = NOW()",
    [role, process.pid, state, runId ?? null, message ?? ""]
  );
}

async function getGlobalSetting(key: string, fallback: any) {
  const rows = await query<{ value: any }>(
    "SELECT value FROM core.settings WHERE scope = 'global' AND key = $1 ORDER BY updated_at DESC, created_at DESC LIMIT 1",
    [key]
  );
  return rows[0]?.value ?? fallback;
}

async function enqueueCreditIntent(input: {
  userId: string;
  action: string;
  amount?: number;
  refType?: string | null;
  refId?: string | null;
  payload?: Record<string, unknown>;
  idempotencyKey: string;
}) {
  await execute(
    `INSERT INTO core.credit_intents
      (id, user_id, action, amount, ref_type, ref_id, payload, idempotency_key, available_at)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [
      randomUUID(),
      input.userId,
      input.action,
      Number(input.amount ?? 0),
      input.refType ?? null,
      input.refId ?? null,
      input.payload ?? {},
      input.idempotencyKey
    ]
  );
}

async function enqueueNotificationEvent(input: {
  userId: string;
  type: string;
  actorUserId?: string | null;
  refType?: string | null;
  refId?: string | null;
  payload?: Record<string, unknown>;
  idempotencyKey: string;
}) {
  await execute(
    `INSERT INTO core.notification_events
      (id, user_id, type, actor_user_id, ref_type, ref_id, payload, idempotency_key, available_at)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [
      randomUUID(),
      input.userId,
      input.type,
      input.actorUserId ?? null,
      input.refType ?? null,
      input.refId ?? null,
      input.payload ?? {},
      input.idempotencyKey
    ]
  );
}

function summarizeError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "unknown_error");
  return raw.trim().slice(0, 300) || "unknown_error";
}

function normalizeErrorCode(message: string) {
  return (
    message
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 64) || "unknown_error"
  );
}

function isOutOfMemoryError(error: unknown) {
  const message = summarizeError(error).toLowerCase();
  return message.includes("cuda out of memory") || message.includes("outofmemoryerror");
}

function clampDimensionPair(width: number, height: number, maxSide: number, maxPixels?: number) {
  let w = Math.max(64, Math.round(width));
  let h = Math.max(64, Math.round(height));
  const sideCap = Math.max(64, Math.round(maxSide));
  const longest = Math.max(w, h);
  if (longest > sideCap) {
    const scale = sideCap / longest;
    w = Math.max(64, Math.round(w * scale));
    h = Math.max(64, Math.round(h * scale));
  }
  if (maxPixels && maxPixels > 0 && w * h > maxPixels) {
    const scale = Math.sqrt(maxPixels / (w * h));
    w = Math.max(64, Math.round(w * scale));
    h = Math.max(64, Math.round(h * scale));
  }
  // Keep resolution multiples stable for SDXL pipelines.
  w = Math.max(64, Math.round(w / 64) * 64);
  h = Math.max(64, Math.round(h / 64) * 64);
  return { width: w, height: h };
}

function asFiniteNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function computeGenerationRenderPlan(input: {
  job: any;
  isTrainingActive: boolean;
  isPreviewJob: boolean;
  settingsMap: Record<string, any>;
  gpuSnapshot: GpuMemorySnapshot | null;
}) {
  const { job, isTrainingActive, isPreviewJob, settingsMap, gpuSnapshot } = input;
  let width = asFiniteNumber(job.width, 1024);
  let height = asFiniteNumber(job.height, 1024);
  let steps = asFiniteNumber(job.steps, 30);
  let batchCount = Math.max(1, asFiniteNumber(job.batch_count, 1));
  let memoryMode: GenerationRenderPlan["memoryMode"] = isTrainingActive ? "low_vram" : "default";
  let autoDowngraded = false;
  let downgradeReason: string | null = null;

  if (isPreviewJob && isTrainingActive) {
    const previewMaxSide = asFiniteNumber(settingsMap.generation_preview_max_side_training, 896);
    const previewMaxPixels = asFiniteNumber(settingsMap.generation_preview_max_pixels_training, 950000);
    const previewSteps = asFiniteNumber(settingsMap.generation_preview_steps_training, 36);
    const clamped = clampDimensionPair(width, height, previewMaxSide, previewMaxPixels);
    if (clamped.width !== width || clamped.height !== height) {
      autoDowngraded = true;
      downgradeReason = "preview_training_clamp";
    }
    width = clamped.width;
    height = clamped.height;
    const cappedSteps = Math.max(8, Math.min(steps, previewSteps));
    if (cappedSteps !== steps) {
      autoDowngraded = true;
      downgradeReason = downgradeReason ?? "preview_training_steps_cap";
    }
    steps = cappedSteps;
  }

  if (!isTrainingActive) {
    return { width, height, steps, batchCount, memoryMode, autoDowngraded, downgradeReason };
  }

  const minFree = isPreviewJob
    ? asFiniteNumber(settingsMap.generation_min_free_mb_preview_training, 4000)
    : asFiniteNumber(settingsMap.generation_min_free_mb_training, 7000);
  const headroom = asFiniteNumber(settingsMap.generation_downgrade_headroom_mb_training, 2200);
  const pressureThreshold = minFree + Math.max(250, headroom);
  const freeMb = gpuSnapshot?.freeMb ?? Number.POSITIVE_INFINITY;
  if (freeMb >= pressureThreshold) {
    return { width, height, steps, batchCount, memoryMode, autoDowngraded, downgradeReason };
  }

  memoryMode = "safe";
  const targetMaxSide = asFiniteNumber(settingsMap.generation_downgrade_max_side_training, 896);
  const targetMaxPixels = asFiniteNumber(settingsMap.generation_downgrade_max_pixels_training, 786432);
  const targetSteps = asFiniteNumber(settingsMap.generation_downgrade_steps_training, 28);
  const targetBatch = asFiniteNumber(settingsMap.generation_downgrade_batch_training, 1);

  const clamped = clampDimensionPair(width, height, targetMaxSide, targetMaxPixels);
  if (clamped.width !== width || clamped.height !== height) {
    autoDowngraded = true;
    downgradeReason = "auto_downgraded_resolution";
  }
  width = clamped.width;
  height = clamped.height;

  const cappedSteps = Math.max(8, Math.min(steps, targetSteps));
  if (cappedSteps !== steps) {
    autoDowngraded = true;
    downgradeReason = downgradeReason ?? "auto_downgraded_steps";
  }
  steps = cappedSteps;

  const cappedBatch = Math.max(1, Math.min(batchCount, Math.round(targetBatch)));
  if (cappedBatch !== batchCount) {
    autoDowngraded = true;
    downgradeReason = downgradeReason ?? "auto_downgraded_batch";
  }
  batchCount = cappedBatch;

  return { width, height, steps, batchCount, memoryMode, autoDowngraded, downgradeReason };
}

async function readGpuMemorySnapshot(): Promise<GpuMemorySnapshot | null> {
  return new Promise((resolve) => {
    const child = spawn("nvidia-smi", ["--query-gpu=memory.used,memory.total", "--format=csv,noheader,nounits"], {
      env: process.env
    });
    let stdout = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      if (code !== 0) {
        resolve(null);
        return;
      }
      const firstLine = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean);
      if (!firstLine) {
        resolve(null);
        return;
      }
      const [usedRaw, totalRaw] = firstLine.split(",").map((part) => Number(part.trim()));
      if (!Number.isFinite(usedRaw) || !Number.isFinite(totalRaw) || totalRaw <= 0) {
        resolve(null);
        return;
      }
      resolve({
        usedMb: usedRaw,
        totalMb: totalRaw,
        freeMb: Math.max(0, totalRaw - usedRaw)
      });
    });
  });
}

async function ensureCreditAccount(client: any, userId: string) {
  await client.query(
    "INSERT INTO core.credits (user_id, balance, daily_allowance, updated_at) VALUES ($1,0,0,NOW()) ON CONFLICT (user_id) DO NOTHING",
    [userId]
  );
}

async function markCreditIntent(client: any, intentId: string, status: "done" | "failed", error?: string | null) {
  await client.query(
    "UPDATE core.credit_intents SET status = $1, error_message = $2, processed_at = NOW(), updated_at = NOW() WHERE id = $3",
    [status, error ?? null, intentId]
  );
}

async function processReserveGenerateIntent(client: any, intent: any) {
  const [job] = (
    await client.query(
      "SELECT id, user_id, status, credits_reserved, credits_charged_at, credits_released_at FROM generation.jobs WHERE id = $1 FOR UPDATE",
      [intent.ref_id]
    )
  ).rows;
  if (!job) {
    await markCreditIntent(client, intent.id, "failed", "generation_job_missing");
    return;
  }
  if (job.user_id !== intent.user_id) {
    await markCreditIntent(client, intent.id, "failed", "user_mismatch");
    return;
  }
  if (job.status !== "credit_pending") {
    await markCreditIntent(client, intent.id, "done");
    return;
  }

  const amount = Math.max(0, Number(intent.amount ?? 0));
  await ensureCreditAccount(client, intent.user_id);
  const [creditRow] = (await client.query("SELECT balance FROM core.credits WHERE user_id = $1 FOR UPDATE", [intent.user_id])).rows;
  const balance = Number(creditRow?.balance ?? 0);
  if (balance < amount) {
    await client.query(
      "UPDATE generation.jobs SET status = 'failed', finished_at = NOW(), updated_at = NOW(), credits_reserved = 0 WHERE id = $1",
      [job.id]
    );
    await updateGenerationStatus(job.id, "insufficient_credits");
    await markCreditIntent(client, intent.id, "done", "insufficient_credits");
    return;
  }

  await client.query(
    "UPDATE core.credits SET balance = balance - $1, credits_reserved = credits_reserved + $1, updated_at = NOW() WHERE user_id = $2",
    [amount, intent.user_id]
  );
  await client.query(
    "INSERT INTO core.credit_ledger (id, user_id, delta, reason, ref_type, ref_id) VALUES ($1,$2,$3,$4,$5,$6)",
    [randomUUID(), intent.user_id, -amount, "reserve_generate", "generation_job", job.id]
  );
  await client.query(
    "UPDATE generation.jobs SET status = 'queued', credits_reserved = $1, updated_at = NOW() WHERE id = $2",
    [amount, job.id]
  );
  const [posRow] = (await client.query("SELECT COALESCE(MAX(position), 0)::int AS max FROM generation.queue")).rows;
  const nextPos = Number(posRow?.max ?? 0) + 1;
  await client.query(
    "INSERT INTO generation.queue (id, job_id, position) VALUES ($1,$2,$3) ON CONFLICT (job_id) DO NOTHING",
    [randomUUID(), job.id, nextPos]
  );
  await updateGenerationStatus(job.id);
  await markCreditIntent(client, intent.id, "done");
}

async function processReserveTrainIntent(client: any, intent: any) {
  const [run] = (
    await client.query("SELECT id, user_id, status, pipeline_run_id FROM training.runs WHERE id = $1 FOR UPDATE", [intent.ref_id])
  ).rows;
  if (!run) {
    await markCreditIntent(client, intent.id, "failed", "training_run_missing");
    return;
  }
  if (run.user_id !== intent.user_id) {
    await markCreditIntent(client, intent.id, "failed", "user_mismatch");
    return;
  }
  if (run.status !== "credit_pending") {
    await markCreditIntent(client, intent.id, "done");
    return;
  }

  const amount = Math.max(0, Number(intent.amount ?? 0));
  await ensureCreditAccount(client, intent.user_id);
  const [creditRow] = (await client.query("SELECT balance FROM core.credits WHERE user_id = $1 FOR UPDATE", [intent.user_id])).rows;
  const balance = Number(creditRow?.balance ?? 0);
  if (balance < amount) {
    await client.query(
      "UPDATE training.runs SET status = 'failed', finished_at = NOW(), updated_at = NOW(), credits_reserved = 0 WHERE id = $1",
      [run.id]
    );
    await enqueueNotificationEvent({
      userId: run.user_id,
      type: "training_failed",
      refType: "training_run",
      refId: run.id,
      payload: { run_name: run.id, error: "insufficient_credits" },
      idempotencyKey: `notify_training_failed:${run.id}:insufficient_credits`
    });
    if (run.pipeline_run_id) {
      await client.query(
        "UPDATE pipeline.runs SET status = 'failed', last_step = 'insufficient_credits', updated_at = NOW() WHERE id = $1",
        [run.pipeline_run_id]
      );
      await client.query(
        "INSERT INTO pipeline.events (id, run_id, level, message, details) VALUES ($1,$2,'error',$3,$4)",
        [randomUUID(), run.pipeline_run_id, "insufficient_credits", { stage: "training_queue", training_run_id: run.id }]
      );
      await updatePipelineStatus(run.pipeline_run_id, "insufficient_credits");
    }
    await updateTrainingStatus(run.id, "insufficient_credits");
    await markCreditIntent(client, intent.id, "done", "insufficient_credits");
    return;
  }

  await client.query(
    "UPDATE core.credits SET balance = balance - $1, credits_reserved = credits_reserved + $1, updated_at = NOW() WHERE user_id = $2",
    [amount, intent.user_id]
  );
  await client.query(
    "INSERT INTO core.credit_ledger (id, user_id, delta, reason, ref_type, ref_id) VALUES ($1,$2,$3,$4,$5,$6)",
    [randomUUID(), intent.user_id, -amount, "reserve_train", "training_run", run.id]
  );
  await client.query(
    "UPDATE training.runs SET status = 'queued', credits_reserved = $1, updated_at = NOW() WHERE id = $2",
    [amount, run.id]
  );
  if (run.pipeline_run_id) {
    await client.query(
      "UPDATE pipeline.runs SET status = 'training_queued', last_step = 'training_queued', updated_at = NOW() WHERE id = $1",
      [run.pipeline_run_id]
    );
    await updatePipelineStatus(run.pipeline_run_id);
  }
  await updateTrainingStatus(run.id);
  await markCreditIntent(client, intent.id, "done");
}

async function processReservePipelineIntent(client: any, intent: any) {
  const [run] = (
    await client.query("SELECT id, user_id, status, flags FROM pipeline.runs WHERE id = $1 FOR UPDATE", [intent.ref_id])
  ).rows;
  if (!run) {
    await markCreditIntent(client, intent.id, "done");
    return;
  }
  if (run.user_id !== intent.user_id) {
    await markCreditIntent(client, intent.id, "failed", "user_mismatch");
    return;
  }
  const flags = run.flags ?? {};
  if (!flags.train || ["failed", "cancelled", "completed", "stopped"].includes(String(run.status ?? ""))) {
    await markCreditIntent(client, intent.id, "done");
    return;
  }
  const [trainingRef] = (
    await client.query("SELECT id FROM training.runs WHERE pipeline_run_id = $1 LIMIT 1", [run.id])
  ).rows;
  if (trainingRef) {
    await markCreditIntent(client, intent.id, "done");
    return;
  }
  const alreadyReserved = Number(flags.creditsReserved ?? 0);
  if (alreadyReserved > 0) {
    await markCreditIntent(client, intent.id, "done");
    return;
  }

  const amount = Math.max(0, Number(intent.amount ?? 0));
  await ensureCreditAccount(client, intent.user_id);
  const [creditRow] = (await client.query("SELECT balance FROM core.credits WHERE user_id = $1 FOR UPDATE", [intent.user_id])).rows;
  const balance = Number(creditRow?.balance ?? 0);
  if (balance < amount) {
    await client.query(
      "UPDATE pipeline.runs SET status = 'failed', last_step = 'insufficient_credits', updated_at = NOW() WHERE id = $1",
      [run.id]
    );
    await client.query(
      "INSERT INTO pipeline.events (id, run_id, level, message, details) VALUES ($1,$2,'error',$3,$4)",
      [randomUUID(), run.id, "insufficient_credits", { stage: "prep_queue" }]
    );
    await updatePipelineStatus(run.id, "insufficient_credits");
    await markCreditIntent(client, intent.id, "done", "insufficient_credits");
    return;
  }

  await client.query(
    "UPDATE core.credits SET balance = balance - $1, credits_reserved = credits_reserved + $1, updated_at = NOW() WHERE user_id = $2",
    [amount, intent.user_id]
  );
  await client.query(
    "INSERT INTO core.credit_ledger (id, user_id, delta, reason, ref_type, ref_id) VALUES ($1,$2,$3,$4,$5,$6)",
    [randomUUID(), intent.user_id, -amount, "reserve_pipeline", "pipeline_run", run.id]
  );
  flags.creditsReserved = amount;
  await client.query("UPDATE pipeline.runs SET flags = $1, updated_at = NOW() WHERE id = $2", [flags, run.id]);
  await markCreditIntent(client, intent.id, "done");
}

async function processReleaseGenerateIntent(client: any, intent: any) {
  const [job] = (
    await client.query("SELECT id, user_id, credits_reserved, credits_charged_at, credits_released_at FROM generation.jobs WHERE id = $1 FOR UPDATE", [
      intent.ref_id
    ])
  ).rows;
  if (!job || !job.credits_reserved || job.credits_charged_at || job.credits_released_at) {
    await markCreditIntent(client, intent.id, "done");
    return;
  }
  await ensureCreditAccount(client, job.user_id);
  await client.query(
    "UPDATE core.credits SET balance = balance + $1, credits_reserved = GREATEST(credits_reserved - $1, 0), updated_at = NOW() WHERE user_id = $2",
    [job.credits_reserved, job.user_id]
  );
  await client.query(
    "INSERT INTO core.credit_ledger (id, user_id, delta, reason, ref_type, ref_id) VALUES ($1,$2,$3,$4,$5,$6)",
    [randomUUID(), job.user_id, job.credits_reserved, "release_generate", "generation_job", job.id]
  );
  await client.query(
    "UPDATE generation.jobs SET credits_released_at = NOW(), credits_reserved = 0, updated_at = NOW() WHERE id = $1",
    [job.id]
  );
  await markCreditIntent(client, intent.id, "done");
}

async function processChargeGenerateIntent(client: any, intent: any) {
  const [job] = (
    await client.query("SELECT id, user_id, credits_reserved, credits_charged_at FROM generation.jobs WHERE id = $1 FOR UPDATE", [
      intent.ref_id
    ])
  ).rows;
  if (!job || !job.credits_reserved || job.credits_charged_at) {
    await markCreditIntent(client, intent.id, "done");
    return;
  }
  await ensureCreditAccount(client, job.user_id);
  await client.query(
    "UPDATE core.credits SET credits_reserved = GREATEST(credits_reserved - $1, 0), updated_at = NOW() WHERE user_id = $2",
    [job.credits_reserved, job.user_id]
  );
  await client.query(
    "UPDATE generation.jobs SET credits_charged_at = NOW(), credits_reserved = 0, updated_at = NOW() WHERE id = $1",
    [job.id]
  );
  await markCreditIntent(client, intent.id, "done");
}

async function processReleaseTrainIntent(client: any, intent: any) {
  const [run] = (
    await client.query("SELECT id, user_id, credits_reserved, credits_charged_at, credits_released_at FROM training.runs WHERE id = $1 FOR UPDATE", [
      intent.ref_id
    ])
  ).rows;
  if (!run || !run.credits_reserved || run.credits_charged_at || run.credits_released_at) {
    await markCreditIntent(client, intent.id, "done");
    return;
  }
  await ensureCreditAccount(client, run.user_id);
  await client.query(
    "UPDATE core.credits SET balance = balance + $1, credits_reserved = GREATEST(credits_reserved - $1, 0), updated_at = NOW() WHERE user_id = $2",
    [run.credits_reserved, run.user_id]
  );
  await client.query(
    "INSERT INTO core.credit_ledger (id, user_id, delta, reason, ref_type, ref_id) VALUES ($1,$2,$3,$4,$5,$6)",
    [randomUUID(), run.user_id, run.credits_reserved, "release_train", "training_run", run.id]
  );
  await client.query(
    "UPDATE training.runs SET credits_released_at = NOW(), credits_reserved = 0, updated_at = NOW() WHERE id = $1",
    [run.id]
  );
  await markCreditIntent(client, intent.id, "done");
}

async function processChargeTrainIntent(client: any, intent: any) {
  const [run] = (
    await client.query("SELECT id, user_id, credits_reserved, credits_charged_at FROM training.runs WHERE id = $1 FOR UPDATE", [
      intent.ref_id
    ])
  ).rows;
  if (!run || !run.credits_reserved || run.credits_charged_at) {
    await markCreditIntent(client, intent.id, "done");
    return;
  }
  await ensureCreditAccount(client, run.user_id);
  await client.query(
    "UPDATE core.credits SET credits_reserved = GREATEST(credits_reserved - $1, 0), updated_at = NOW() WHERE user_id = $2",
    [run.credits_reserved, run.user_id]
  );
  await client.query(
    "UPDATE training.runs SET credits_charged_at = NOW(), credits_reserved = 0, updated_at = NOW() WHERE id = $1",
    [run.id]
  );
  await markCreditIntent(client, intent.id, "done");
}

async function processAdminAdjustIntent(client: any, intent: any) {
  const amount = Number(intent.amount ?? 0);
  if (!Number.isFinite(amount) || amount === 0) {
    await markCreditIntent(client, intent.id, "done");
    return;
  }
  await ensureCreditAccount(client, intent.user_id);
  await client.query("UPDATE core.credits SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2", [
    amount,
    intent.user_id
  ]);
  await client.query(
    "INSERT INTO core.credit_ledger (id, user_id, delta, reason, ref_type, ref_id) VALUES ($1,$2,$3,$4,$5,$6)",
    [randomUUID(), intent.user_id, amount, "admin_adjust", intent.ref_type ?? "manual", intent.ref_id ?? null]
  );
  await markCreditIntent(client, intent.id, "done");
}

async function processDailyAllowanceIntent(client: any, intent: any) {
  const amount = Math.max(0, Number(intent.amount ?? 0));
  await ensureCreditAccount(client, intent.user_id);
  await client.query("UPDATE core.credits SET daily_allowance = $1, updated_at = NOW() WHERE user_id = $2", [
    amount,
    intent.user_id
  ]);
  await markCreditIntent(client, intent.id, "done");
}

async function processReleasePipelineIntent(client: any, intent: any) {
  const [run] = (
    await client.query("SELECT id, user_id, flags FROM pipeline.runs WHERE id = $1 FOR UPDATE", [intent.ref_id])
  ).rows;
  if (!run) {
    await markCreditIntent(client, intent.id, "done");
    return;
  }
  const flags = run.flags ?? {};
  const reserved = Number(flags.creditsReserved ?? 0);
  if (!reserved) {
    await markCreditIntent(client, intent.id, "done");
    return;
  }
  await ensureCreditAccount(client, run.user_id);
  await client.query(
    "UPDATE core.credits SET balance = balance + $1, credits_reserved = GREATEST(credits_reserved - $1, 0), updated_at = NOW() WHERE user_id = $2",
    [reserved, run.user_id]
  );
  await client.query(
    "INSERT INTO core.credit_ledger (id, user_id, delta, reason, ref_type, ref_id) VALUES ($1,$2,$3,$4,$5,$6)",
    [randomUUID(), run.user_id, reserved, "release_pipeline", "pipeline_run", run.id]
  );
  flags.creditsReserved = 0;
  await client.query("UPDATE pipeline.runs SET flags = $1, updated_at = NOW() WHERE id = $2", [flags, run.id]);
  await markCreditIntent(client, intent.id, "done");
}

async function processRewardIntent(client: any, intent: any) {
  const defaultAmount =
    intent.action === "reward_like_image" ? 1 : intent.action === "reward_like_model" ? 2 : Number(intent.amount ?? 0);
  const amount = Math.max(0, Number(intent.amount ?? defaultAmount));
  if (!amount) {
    await markCreditIntent(client, intent.id, "done");
    return;
  }
  await ensureCreditAccount(client, intent.user_id);
  await client.query("UPDATE core.credits SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2", [
    amount,
    intent.user_id
  ]);
  await client.query(
    "INSERT INTO core.credit_ledger (id, user_id, delta, reason, ref_type, ref_id) VALUES ($1,$2,$3,$4,$5,$6)",
    [randomUUID(), intent.user_id, amount, intent.action, intent.ref_type ?? null, intent.ref_id ?? null]
  );
  await markCreditIntent(client, intent.id, "done");
}

async function processCreditIntent(intent: any) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const [locked] = (
      await client.query("SELECT id, status FROM core.credit_intents WHERE id = $1 FOR UPDATE", [intent.id])
    ).rows;
    if (!locked || locked.status !== "processing") {
      await client.query("ROLLBACK");
      return;
    }
    if (intent.action === "reserve_generate") {
      await processReserveGenerateIntent(client, intent);
    } else if (intent.action === "reserve_train") {
      await processReserveTrainIntent(client, intent);
    } else if (intent.action === "reserve_pipeline") {
      await processReservePipelineIntent(client, intent);
    } else if (intent.action === "release_generate") {
      await processReleaseGenerateIntent(client, intent);
    } else if (intent.action === "charge_generate") {
      await processChargeGenerateIntent(client, intent);
    } else if (intent.action === "release_train") {
      await processReleaseTrainIntent(client, intent);
    } else if (intent.action === "charge_train") {
      await processChargeTrainIntent(client, intent);
    } else if (intent.action === "admin_adjust") {
      await processAdminAdjustIntent(client, intent);
    } else if (intent.action === "set_daily_allowance") {
      await processDailyAllowanceIntent(client, intent);
    } else if (intent.action === "release_pipeline") {
      await processReleasePipelineIntent(client, intent);
    } else if (
      intent.action === "reward_like_image" ||
      intent.action === "reward_like_model" ||
      intent.action === "reward_comment_first"
    ) {
      await processRewardIntent(client, intent);
    } else {
      await markCreditIntent(client, intent.id, "failed", "unknown_action");
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    await execute(
      "UPDATE core.credit_intents SET status = 'pending', error_message = $1, updated_at = NOW() WHERE id = $2 AND status = 'processing'",
      [(err as Error).message ?? "intent_error", intent.id]
    );
  } finally {
    client.release();
  }
}

async function tickCredit() {
  await reconcileReservedCredits();
  await execute(
    "UPDATE core.credit_intents SET status = 'pending', updated_at = NOW() WHERE status = 'processing' AND updated_at < NOW() - INTERVAL '2 minutes'"
  );
  const client = await pool.connect();
  let intents: any[] = [];
  try {
    await client.query("BEGIN");
    intents = (
      await client.query(
        `SELECT *
         FROM core.credit_intents
         WHERE status = 'pending' AND available_at <= NOW()
         ORDER BY created_at ASC
         LIMIT 25
         FOR UPDATE SKIP LOCKED`
      )
    ).rows;
    if (intents.length) {
      await client.query("UPDATE core.credit_intents SET status = 'processing', attempts = attempts + 1, updated_at = NOW() WHERE id = ANY($1::uuid[])", [
        intents.map((row) => row.id)
      ]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  if (!intents.length) {
    await heartbeat(undefined, "idle", "idle");
    return;
  }
  for (const intent of intents) {
    await processCreditIntent(intent);
  }
  const granted = await query<{ user_id: string; daily_allowance: number }>(
    `UPDATE core.credits
     SET balance = balance + daily_allowance,
         last_daily_grant_at = NOW(),
         updated_at = NOW()
     WHERE daily_allowance > 0
       AND (last_daily_grant_at IS NULL OR last_daily_grant_at < DATE_TRUNC('day', NOW()))
     RETURNING user_id, daily_allowance`
  );
  for (const entry of granted) {
    await execute(
      "INSERT INTO core.credit_ledger (id, user_id, delta, reason, ref_type) VALUES ($1,$2,$3,$4,$5)",
      [randomUUID(), entry.user_id, entry.daily_allowance, "daily_grant", "system"]
    );
  }
  await heartbeat(undefined, `processed:${intents.length}`, "ok");
}

async function resolveTrainingProfileSettings(profileName?: string) {
  if (profileName) {
    const [row] = await query<{ settings: any }>("SELECT settings FROM training.profiles WHERE name = $1", [
      profileName
    ]);
    if (row?.settings && Object.keys(row.settings).length) {
      return row.settings;
    }
  }
  const [row] = await query<{ settings: any }>(
    "SELECT settings FROM training.profiles WHERE is_default = true LIMIT 1"
  );
  return row?.settings ?? {};
}

function normalizeTrainingSettings(settings: Record<string, any>) {
  const next = { ...settings };
  if (!Number.isFinite(Number(next.step_total)) && Number(next.trainer_max_train_steps) > 0) {
    next.step_total = Number(next.trainer_max_train_steps);
  }
  if (!Number.isFinite(Number(next.epoch_total)) && Number(next.trainer_epochs) > 0) {
    next.epoch_total = Number(next.trainer_epochs);
  }
  return next;
}

function applyTriggerPlaceholder(prompt: string, trigger: string, triggerRaw?: string) {
  let normalized = prompt.replace(/\{trigger\}/gi, trigger).replace(/<trigger>/gi, trigger);
  if (triggerRaw && triggerRaw !== trigger) {
    normalized = normalized.split(triggerRaw).join(trigger);
  }
  return normalized;
}

async function resolveTrainingBaseModelId() {
  const [preferred] = await query<{ file_id: string }>(
    "SELECT file_id FROM core.model_registry WHERE name ILIKE 'ponydiffusion%' ORDER BY created_at DESC LIMIT 1",
    []
  );
  if (preferred?.file_id) return preferred.file_id;
  const [row] = await query<{ file_id: string }>(
    "SELECT file_id FROM core.model_registry WHERE kind IN ('training_model','base_model') ORDER BY created_at ASC LIMIT 1",
    []
  );
  return row?.file_id ?? null;
}

async function releasePipelineCredits(run: any, reason: string) {
  const flags = run.flags ?? {};
  const reserved = Number(flags.creditsReserved ?? 0);
  if (!reserved) return;
  const [trainingRef] = await query<{ id: string }>(
    "SELECT id FROM training.runs WHERE pipeline_run_id = $1 LIMIT 1",
    [run.id]
  );
  if (trainingRef) return;
  await enqueueCreditIntent({
    userId: run.user_id,
    action: "release_pipeline",
    amount: reserved,
    refType: "pipeline_run",
    refId: run.id,
    payload: { reason },
    idempotencyKey: `release_pipeline:${run.id}:${reason}`
  });
}

async function reconcileReservedCredits() {
  const pipelineRows = await query<{ id: string; user_id: string; credits_reserved: number }>(
    `SELECT id,
            user_id,
            (flags->>'creditsReserved')::int AS credits_reserved
     FROM pipeline.runs
     WHERE (flags->>'creditsReserved')::int > 0
       AND status IN ('cancelled','failed','completed')`
  );
  for (const row of pipelineRows) {
    const [training] = await query<{ id: string }>(
      "SELECT id FROM training.runs WHERE pipeline_run_id = $1 LIMIT 1",
      [row.id]
    );
    if (training) continue;
    const reserved = Number(row.credits_reserved ?? 0);
    if (!reserved) continue;
    await execute(
      "UPDATE core.credits SET balance = balance + $1, credits_reserved = GREATEST(credits_reserved - $1, 0) WHERE user_id = $2",
      [reserved, row.user_id]
    );
    await execute(
      "INSERT INTO core.credit_ledger (id, user_id, delta, reason, ref_type, ref_id) VALUES ($1,$2,$3,$4,$5,$6)",
      [randomUUID(), row.user_id, reserved, "release_pipeline", "pipeline_run", row.id]
    );
    await execute(
      "UPDATE pipeline.runs SET flags = jsonb_set(COALESCE(flags,'{}'::jsonb), '{creditsReserved}', '0'::jsonb, true), updated_at = NOW() WHERE id = $1",
      [row.id]
    );
  }

  const trainingRows = await query<{ id: string; user_id: string; credits_reserved: number }>(
    `SELECT id, user_id, credits_reserved
     FROM training.runs
     WHERE credits_reserved > 0
       AND credits_released_at IS NULL
       AND status IN ('failed','cancelled')`
  );
  for (const row of trainingRows) {
    const reserved = Number(row.credits_reserved ?? 0);
    if (!reserved) continue;
    await execute(
      "UPDATE core.credits SET balance = balance + $1, credits_reserved = GREATEST(credits_reserved - $1, 0) WHERE user_id = $2",
      [reserved, row.user_id]
    );
    await execute(
      "INSERT INTO core.credit_ledger (id, user_id, delta, reason, ref_type, ref_id) VALUES ($1,$2,$3,$4,$5,$6)",
      [randomUUID(), row.user_id, reserved, "release_train", "training_run", row.id]
    );
    await execute("UPDATE training.runs SET credits_released_at = NOW() WHERE id = $1", [row.id]);
  }

  const generationRows = await query<{ id: string; user_id: string; credits_reserved: number }>(
    `SELECT id, user_id, credits_reserved
     FROM generation.jobs
     WHERE credits_reserved > 0
       AND credits_released_at IS NULL
       AND status IN ('failed','cancelled')`
  );
  for (const row of generationRows) {
    const reserved = Number(row.credits_reserved ?? 0);
    if (!reserved) continue;
    await execute(
      "UPDATE core.credits SET balance = balance + $1, credits_reserved = GREATEST(credits_reserved - $1, 0) WHERE user_id = $2",
      [reserved, row.user_id]
    );
    await execute(
      "INSERT INTO core.credit_ledger (id, user_id, delta, reason, ref_type, ref_id) VALUES ($1,$2,$3,$4,$5,$6)",
      [randomUUID(), row.user_id, reserved, "release_generate", "generation_job", row.id]
    );
    await execute("UPDATE generation.jobs SET credits_released_at = NOW() WHERE id = $1", [row.id]);
  }

  const expectedRows = await query<{ user_id: string; expected: number; current: number }>(
    `WITH expected AS (
       SELECT user_id, SUM(reserved) AS expected
       FROM (
         SELECT user_id, credits_reserved AS reserved
         FROM generation.jobs
         WHERE credits_reserved > 0 AND status IN ('queued','rendering','running')
         UNION ALL
         SELECT user_id, credits_reserved
         FROM training.runs
         WHERE credits_reserved > 0 AND status IN ('queued','running')
         UNION ALL
         SELECT user_id, (flags->>'creditsReserved')::int
         FROM pipeline.runs
         WHERE (flags->>'creditsReserved')::int > 0
           AND status NOT IN ('cancelled','failed','completed')
       ) t
       GROUP BY user_id
     )
     SELECT c.user_id,
            COALESCE(e.expected, 0) AS expected,
            c.credits_reserved AS current
     FROM core.credits c
     LEFT JOIN expected e ON e.user_id = c.user_id
     WHERE c.credits_reserved <> COALESCE(e.expected, 0)`
  );
  for (const row of expectedRows) {
    await execute("UPDATE core.credits SET credits_reserved = $1, updated_at = NOW() WHERE user_id = $2", [
      row.expected ?? 0,
      row.user_id
    ]);
  }
}

async function ensureTrainingRunFromPipeline(run: any) {
  const flags = run.flags ?? {};
  if (!flags.train) return;
  const [dataset] = await query<{ id: string; root_file_id: string | null }>(
    "SELECT id, root_file_id FROM training.datasets WHERE pipeline_run_id = $1 LIMIT 1",
    [run.id]
  );
  if (!dataset) {
    await execute(
      "INSERT INTO pipeline.events (id, run_id, level, message, details) VALUES ($1,$2,'error',$3,$4)",
      [randomUUID(), run.id, "training_dataset_missing", { stage: "training_queue" }]
    );
    await execute(
      "UPDATE pipeline.runs SET status = 'failed', last_step = 'training_dataset_missing', updated_at = NOW() WHERE id = $1",
      [run.id]
    );
    await updatePipelineStatus(run.id, "training_dataset_missing");
    return;
  }
  const [existing] = await query<{ id: string }>(
    "SELECT id FROM training.runs WHERE dataset_id = $1 LIMIT 1",
    [dataset.id]
  );
  if (existing) return;
  const baseModelId = flags.baseModelId ? String(flags.baseModelId) : await resolveTrainingBaseModelId();
  if (!baseModelId) {
    await execute(
      "INSERT INTO pipeline.events (id, run_id, level, message, details) VALUES ($1,$2,'error',$3,$4)",
      [randomUUID(), run.id, "training_base_model_missing", { stage: "training_queue" }]
    );
    await execute(
      "UPDATE pipeline.runs SET status = 'failed', last_step = 'training_base_model_missing', updated_at = NOW() WHERE id = $1",
      [run.id]
    );
    await updatePipelineStatus(run.id, "training_base_model_missing");
    return;
  }

  const costRaw = await getGlobalSetting("credits.train", 5);
  const cost = Number(normalizeSettingValue(costRaw) ?? 5) || 5;
  const pipelineReserved = Math.max(0, Number(flags.creditsReserved ?? 0));
  const settings = normalizeTrainingSettings(await resolveTrainingProfileSettings(flags.trainProfile));
  const triggerRaw = String(run.name ?? "").trim();
  const trigger = (triggerRaw || "trigger").replace(/\.zip$/i, "") || "trigger";
  if (!Number.isFinite(Number(settings.trainer_keep_tokens))) {
    settings.trainer_keep_tokens = 1;
  }
  const samplePrompts = Array.isArray(flags.samplePrompts)
    ? flags.samplePrompts
        .map((prompt: string) => String(prompt).trim())
        .filter(Boolean)
        .map((prompt: string) => applyTriggerPlaceholder(prompt, trigger, triggerRaw))
    : [];
  const defaultPrompts = [
    `${trigger}, standing, full body`,
    `${trigger}, lying down, full body`,
    `${trigger}, portrait, close-up`
  ];
  const prompts = samplePrompts.length ? samplePrompts : defaultPrompts;
  if (prompts.length) {
    settings.trainer_sample_prompts = prompts;
    settings.trainer_trigger = trigger;
    if (!Number.isFinite(Number(settings.trainer_sample_every_n_epochs))) {
      settings.trainer_sample_every_n_epochs = 1;
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const trainingRunId = randomUUID();
    if (pipelineReserved > 0) {
      await client.query(
        `INSERT INTO training.runs
          (id, user_id, pipeline_run_id, dataset_id, status, base_model_file_id, dataset_file_id, credits_reserved, settings)
         VALUES ($1,$2,$3,$4,'queued',$5,$6,$7,$8)`,
        [trainingRunId, run.user_id, run.id, dataset.id, baseModelId, dataset.root_file_id, pipelineReserved, settings]
      );
      const nextFlags = { ...flags, creditsReserved: 0 };
      await client.query(
        "UPDATE pipeline.runs SET flags = $1, status = 'training_queued', last_step = 'training_queued', updated_at = NOW() WHERE id = $2",
        [nextFlags, run.id]
      );
    } else {
      await client.query(
        `INSERT INTO training.runs
          (id, user_id, pipeline_run_id, dataset_id, status, base_model_file_id, dataset_file_id, credits_reserved, settings)
         VALUES ($1,$2,$3,$4,'credit_pending',$5,$6,0,$7)`,
        [trainingRunId, run.user_id, run.id, dataset.id, baseModelId, dataset.root_file_id, settings]
      );
      await enqueueCreditIntent({
        userId: run.user_id,
        action: "reserve_train",
        amount: cost,
        refType: "training_run",
        refId: trainingRunId,
        payload: { pipeline_run_id: run.id },
        idempotencyKey: `reserve_train:${trainingRunId}`
      });
      await client.query(
        "UPDATE pipeline.runs SET status = 'training_credit_pending', last_step = 'training_credit_pending', updated_at = NOW() WHERE id = $1",
        [run.id]
      );
    }
    await client.query("COMMIT");
    await updateTrainingStatus(trainingRunId, pipelineReserved > 0 ? undefined : "credit_pending");
    await updatePipelineStatus(run.id, pipelineReserved > 0 ? undefined : "credit_pending");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

function normalizeSettingValue(value: any) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function recoverStaleJobs() {
  const staleRaw = await getGlobalSetting("worker_stale_seconds", 180);
  const staleSeconds = Number(normalizeSettingValue(staleRaw) ?? 180) || 180;
  const staleInterval = `${staleSeconds} seconds`;
  const inactiveRaw = await getGlobalSetting("training_inactive_seconds", 300);
  const inactiveSeconds = Number(normalizeSettingValue(inactiveRaw) ?? 300) || 300;
  const inactiveInterval = `${inactiveSeconds} seconds`;

  const [generationWorker] = await query<{ heartbeat_at: string | null; state: string | null }>(
    "SELECT heartbeat_at, state FROM pipeline.workers WHERE role = 'generation'"
  );
  const [trainingWorker] = await query<{ heartbeat_at: string | null; state: string | null }>(
    "SELECT heartbeat_at, state FROM pipeline.workers WHERE role = 'training'"
  );

  const generationStale = !generationWorker?.heartbeat_at
    || new Date(generationWorker.heartbeat_at).getTime() < Date.now() - staleSeconds * 1000;
  const trainingStale = !trainingWorker?.heartbeat_at
    || new Date(trainingWorker.heartbeat_at).getTime() < Date.now() - staleSeconds * 1000;

  if (generationStale && generationWorker?.state !== "busy") {
    const jobs = await query<{ id: string }>(
      `SELECT id FROM generation.jobs
       WHERE status IN ('rendering','running')
         AND COALESCE(started_at, updated_at) < NOW() - $1::interval`,
      [staleInterval]
    );
    if (jobs.length) {
      const [posRow] = await query<{ pos: number }>("SELECT COALESCE(MAX(position),0)::int AS pos FROM generation.queue");
      let position = Number(posRow?.pos ?? 0);
      for (const job of jobs) {
        position += 1;
        await execute("UPDATE generation.jobs SET status = 'queued', updated_at = NOW() WHERE id = $1", [job.id]);
        await execute(
          "INSERT INTO generation.queue (id, job_id, position) VALUES ($1,$2,$3) ON CONFLICT (job_id) DO NOTHING",
          [randomUUID(), job.id, position]
        );
        await updateGenerationStatus(job.id, "recovered_from_restart");
      }
    }
  }

  if (trainingStale && trainingWorker?.state !== "busy") {
    const runs = await query<{ id: string }>(
      `SELECT id FROM training.runs
       WHERE status = 'running'
         AND COALESCE(started_at, updated_at) < NOW() - $1::interval`,
      [staleInterval]
    );
    for (const run of runs) {
      await execute("UPDATE training.runs SET status = 'queued', updated_at = NOW() WHERE id = $1", [run.id]);
      await updateTrainingStatus(run.id, "recovered_from_restart");
    }
  }

  const pendingRaw = await getGlobalSetting("training_credit_pending_seconds", 300);
  const pendingSeconds = Number(normalizeSettingValue(pendingRaw) ?? 300) || 300;
  const pendingInterval = `${pendingSeconds} seconds`;
  const pendingRuns = await query<{ id: string; user_id: string; pipeline_run_id: string | null }>(
    `SELECT id, user_id, pipeline_run_id
     FROM training.runs
     WHERE status = 'credit_pending'
       AND updated_at < NOW() - $1::interval`,
    [pendingInterval]
  );
  for (const run of pendingRuns) {
    await execute(
      "UPDATE training.runs SET status = 'failed', finished_at = NOW(), updated_at = NOW() WHERE id = $1 AND status = 'credit_pending'",
      [run.id]
    );
    await enqueueNotificationEvent({
      userId: run.user_id,
      type: "training_failed",
      refType: "training_run",
      refId: run.id,
      payload: { run_name: run.id, error: "credit_reservation_timeout" },
      idempotencyKey: `notify_training_failed:${run.id}:credit_timeout`
    });
    if (run.pipeline_run_id) {
      await execute(
        "UPDATE pipeline.runs SET status = 'failed', last_step = 'credit_reservation_timeout', updated_at = NOW() WHERE id = $1",
        [run.pipeline_run_id]
      );
      await execute(
        "INSERT INTO pipeline.events (id, run_id, level, message, details) VALUES ($1,$2,'error',$3,$4)",
        [randomUUID(), run.pipeline_run_id, "credit_reservation_timeout", { stage: "training_queue", training_run_id: run.id }]
      );
      await updatePipelineStatus(run.pipeline_run_id, "credit_reservation_timeout");
    }
    await updateTrainingStatus(run.id, "credit_reservation_timeout");
  }

  const inactiveRuns = await query<any>(
    `SELECT r.*,
            COALESCE(
              (SELECT MAX(created_at) FROM training.metrics WHERE run_id = r.id),
              r.started_at,
              r.updated_at
            ) AS last_activity
     FROM training.runs r
     WHERE r.status = 'running'
       AND COALESCE(
             (SELECT MAX(created_at) FROM training.metrics WHERE run_id = r.id),
             r.started_at,
             r.updated_at
           ) < NOW() - $1::interval`,
    [inactiveInterval]
  );
  for (const run of inactiveRuns) {
    await failTrainingRun(run, "training_inactive_timeout");
  }
}

async function loadGlobalSettingsMap() {
  const rows = await query<{ key: string; value: any }>(
    `SELECT DISTINCT ON (key) key, value
     FROM core.settings
     WHERE scope = 'global'
     ORDER BY key, updated_at DESC, created_at DESC`,
    []
  );
  const map: Record<string, any> = {};
  for (const row of rows) {
    map[row.key] = normalizeSettingValue(row.value);
  }
  return map;
}

async function queuePaused() {
  const raw = await getGlobalSetting("queue.paused", false);
  return Boolean(normalizeSettingValue(raw) ?? false);
}

async function registerFile(
  userId: string | null,
  filePath: string,
  kind: string,
  lineage?: { sourceType: string; sourceId: string; sourceRunId?: string; sourceStep?: string }
) {
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
  if (lineage) {
    await execute(
      "INSERT INTO files.lineage (id, file_id, source_type, source_id, source_run_id, source_step) VALUES ($1,$2,$3,$4,$5,$6)",
      [
        randomUUID(),
        id,
        lineage.sourceType,
        lineage.sourceId,
        lineage.sourceRunId ?? null,
        lineage.sourceStep ?? null
      ]
    );
  }
  return { id, checksum };
}

async function registerPersistentFile(
  userId: string,
  sourcePath: string,
  kind: string,
  category: string,
  targetName?: string,
  lineage?: { sourceType: string; sourceId: string; sourceRunId?: string; sourceStep?: string }
) {
  const userRoot = path.join(config.storageRoot, "users", userId, "persistent", category);
  await fs.mkdir(userRoot, { recursive: true });
  if (sourcePath.startsWith(userRoot)) {
    return registerFile(userId, sourcePath, kind, lineage);
  }
  const ext = path.extname(sourcePath);
  const baseName = targetName ?? `${randomUUID()}${ext}`;
  const targetPath = path.join(userRoot, baseName);
  await fs.copyFile(sourcePath, targetPath);
  return registerFile(userId, targetPath, kind, lineage);
}

async function persistFileById(
  fileId: string | null,
  userId: string,
  kind: string,
  category: string,
  targetName?: string
) {
  if (!fileId) return null;
  const [row] = await query<{ path: string }>("SELECT path FROM files.file_registry WHERE id = $1", [fileId]);
  if (!row?.path) return null;
  const userRoot = path.join(config.storageRoot, "users", userId, "persistent", category);
  if (row.path.startsWith(userRoot)) return fileId;
  const { id } = await registerPersistentFile(userId, row.path, kind, category, targetName, {
    sourceType: "persistent_copy",
    sourceId: fileId
  });
  return id;
}

async function deleteFileIfUnused(
  fileId: string,
  options?: { skipArchive?: boolean; allowPersistentDelete?: boolean; archiveLabel?: string; manifest?: Record<string, any> }
) {
  const [file] = await query<{ path: string; owner_user_id: string | null }>(
    "SELECT path, owner_user_id FROM files.file_registry WHERE id = $1",
    [fileId]
  );
  if (!file) return;
  const refs = await query(
    `SELECT 1 FROM training.artifacts WHERE file_id = $1
     UNION ALL SELECT 1 FROM gallery.lora_previews WHERE file_id = $1
     UNION ALL SELECT 1 FROM gallery.images WHERE file_id = $1
     UNION ALL SELECT 1 FROM generation.outputs WHERE file_id = $1
     UNION ALL SELECT 1 FROM gallery.models WHERE model_file_id = $1
     UNION ALL SELECT 1 FROM gallery.loras WHERE file_id = $1 OR dataset_file_id = $1
     UNION ALL SELECT 1 FROM training.datasets WHERE root_file_id = $1
     UNION ALL SELECT 1 FROM pipeline.runs WHERE upload_file_id = $1 OR dataset_file_id = $1 OR lora_file_id = $1
     UNION ALL SELECT 1 FROM generation.jobs WHERE model_file_id = $1 OR ($1::uuid = ANY(COALESCE(lora_file_ids, '{}'::uuid[])))
     LIMIT 1`,
    [fileId]
  );
  if (refs.length) return;
  if (file.path?.includes(`${path.sep}persistent${path.sep}`) && !options?.allowPersistentDelete) {
    return;
  }
  if (file.path && !options?.skipArchive) {
    await archivePaths({
      storageRoot: config.storageRoot,
      userId: file.owner_user_id,
      label: options?.archiveLabel ?? "worker_delete",
      entries: [{ path: file.path }],
      manifest: {
        origin: "auto",
        type: "file_cleanup",
        reason: "delete_unused",
        file_id: fileId,
        ...(options?.manifest ?? {})
      }
    });
  }
  await execute("DELETE FROM files.file_registry WHERE id = $1", [fileId]);
  try {
    await fs.unlink(file.path);
  } catch {
    // ignore
  }
}

async function deleteLoraByQueueEntry(queueId: string) {
  const client = await pool.connect();
  let loraId = "";
  let ownerUserId = "";
  let loraName = "";
  let modelFileId = "";
  let datasetFileId: string | null = null;
  let previewFileIds: string[] = [];
  try {
    await client.query("BEGIN");
    const [queueRow] = (
      await client.query<{ id: string; lora_id: string; user_id: string; status: string; attempts: number }>(
        "SELECT id, lora_id, user_id, status, attempts FROM gallery.lora_delete_queue WHERE id = $1 AND status = 'queued' FOR UPDATE",
        [queueId]
      )
    ).rows;
    if (!queueRow) {
      await client.query("ROLLBACK");
      return;
    }
    loraId = String(queueRow.lora_id ?? "");
    await client.query(
      "UPDATE gallery.lora_delete_queue SET status = 'processing', attempts = attempts + 1, started_at = COALESCE(started_at, NOW()), updated_at = NOW() WHERE id = $1",
      [queueId]
    );
    const [lora] = (
      await client.query<{
        id: string;
        user_id: string;
        file_id: string;
        dataset_file_id: string | null;
        name: string;
      }>("SELECT id, user_id, file_id, dataset_file_id, name FROM gallery.loras WHERE id = $1 FOR UPDATE", [loraId])
    ).rows;
    if (!lora) {
      await client.query(
        "UPDATE gallery.lora_delete_queue SET status = 'done', error_message = NULL, finished_at = NOW(), updated_at = NOW() WHERE id = $1",
        [queueId]
      );
      await client.query("COMMIT");
      return;
    }
    ownerUserId = lora.user_id;
    loraName = lora.name ?? "";
    modelFileId = lora.file_id;
    datasetFileId = lora.dataset_file_id ?? null;

    const previewRows = await client.query<{ file_id: string }>(
      "SELECT file_id FROM gallery.lora_previews WHERE lora_id = $1",
      [loraId]
    );
    previewFileIds = previewRows.rows.map((row) => row.file_id).filter(Boolean);
    const archiveIds = [modelFileId, datasetFileId, ...previewFileIds].filter(Boolean) as string[];
    if (archiveIds.length) {
      const fileRows = (
        await client.query("SELECT path FROM files.file_registry WHERE id = ANY($1::uuid[])", [archiveIds])
      ).rows as { path: string | null }[];
      const entries = fileRows.filter((row) => row.path).map((row) => ({ path: row.path as string }));
      if (entries.length) {
        await archivePaths({
          storageRoot: config.storageRoot,
          userId: ownerUserId,
          label: `lora_${loraId}`,
          entries,
          manifest: {
            origin: "auto",
            type: "lora",
            reason: "delete_lora",
            source_id: loraId,
            source_name: loraName || null,
            lora_id: loraId,
            user_id: ownerUserId,
            file_ids: archiveIds
          }
        });
      }
    }

    await client.query("DELETE FROM social.comments WHERE target_type = 'lora' AND target_id = $1", [loraId]);
    await client.query("DELETE FROM social.likes WHERE target_type = 'lora' AND target_id = $1", [loraId]);
    await client.query("DELETE FROM gallery.loras WHERE id = $1", [loraId]);
    await client.query(
      "UPDATE gallery.lora_delete_queue SET status = 'done', error_message = NULL, finished_at = NOW(), updated_at = NOW() WHERE id = $1",
      [queueId]
    );
    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback failures
    }
    const message = summarizeError(error);
    await execute(
      "UPDATE gallery.lora_delete_queue SET status = 'failed', error_message = $2, updated_at = NOW() WHERE id = $1",
      [queueId, message]
    );
    throw error;
  } finally {
    client.release();
  }

  for (const fileId of previewFileIds) {
    await deleteFileIfUnused(fileId, { skipArchive: true });
  }
  if (modelFileId) {
    await deleteFileIfUnused(modelFileId, { skipArchive: true, allowPersistentDelete: true });
  }
  if (datasetFileId) {
    await deleteFileIfUnused(datasetFileId, { skipArchive: true, allowPersistentDelete: true });
  }
}

async function tickLoraDeleteQueue() {
  const [row] = await query<{ id: string; lora_id: string }>(
    `SELECT id, lora_id
     FROM gallery.lora_delete_queue
     WHERE status = 'queued'
       AND available_at <= NOW()
     ORDER BY created_at ASC
     LIMIT 1`
  );
  if (!row?.id) return;
  await deleteLoraByQueueEntry(row.id);
}

async function ensureDatasetZipForPipeline(runId: string, userId: string, runName: string) {
  const [row] = await query<{ dataset_file_id: string | null }>(
    "SELECT dataset_file_id FROM pipeline.runs WHERE id = $1",
    [runId]
  );
  if (row?.dataset_file_id) return row.dataset_file_id;
  const runRoot = path.join(config.storageRoot, "users", userId, "datasets", runId);
  const payloadPath = path.join(runRoot, "pipeline_package.json");
  const outputPath = path.join(runRoot, "pipeline_package_out.json");
  const settingsMap = await loadGlobalSettingsMap();
  await fs.writeFile(
    payloadPath,
    JSON.stringify(
      {
        step: "package_dataset",
        run_id: runId,
        run_name: runName ?? "",
        user_id: userId,
        storage_root: config.storageRoot,
        flags: {},
        settings: settingsMap,
        autochar_patterns: [],
        output_path: outputPath
      },
      null,
      2
    )
  );
  const engineScript = path.join(process.cwd(), "apps", "engine", "pipeline.py");
  await runPython(engineScript, ["--input", payloadPath]);
  try {
    const outputRaw = await fs.readFile(outputPath, "utf-8");
    const output = JSON.parse(outputRaw);
    if (output?.dataset_zip && fsSync.existsSync(output.dataset_zip)) {
      const { id: fileId } = await registerFile(userId, output.dataset_zip, "dataset", {
        sourceType: "pipeline_run_dataset",
        sourceId: runId,
        sourceRunId: runId,
        sourceStep: "package_dataset"
      });
      await execute("UPDATE pipeline.runs SET dataset_file_id = $1, updated_at = NOW() WHERE id = $2", [
        fileId,
        runId
      ]);
      const [existing] = await query<{ id: string }>(
        "SELECT id FROM training.datasets WHERE pipeline_run_id = $1 LIMIT 1",
        [runId]
      );
      if (existing) {
        await execute("UPDATE training.datasets SET root_file_id = $1, updated_at = NOW() WHERE id = $2", [
          fileId,
          existing.id
        ]);
      }
      return fileId;
    }
  } catch {
    // ignore
  }
  return null;
}

async function runCommand(command: string, env: Record<string, string>) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, { shell: true, env: { ...process.env, ...env } });
    child.stdout.on("data", (d) => process.stdout.write(d));
    child.stderr.on("data", (d) => process.stderr.write(d));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`command_failed_${code}`));
    });
  });
}

async function runPython(scriptPath: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const venvPython = path.join(process.cwd(), ".venv", "bin", "python");
    const pythonBin = process.env.FRAMEWORKX_PYTHON || (fsSync.existsSync(venvPython) ? venvPython : "python3");
    const child = spawn(pythonBin, [scriptPath, ...args], { env: process.env });
    let output = "";
    child.stdout.on("data", (d) => {
      output += d.toString();
      process.stdout.write(d);
    });
    child.stderr.on("data", (d) => {
      output += d.toString();
      process.stderr.write(d);
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else {
        const trimmed = output.trim();
        const tail = trimmed.length > 400 ? trimmed.slice(trimmed.length - 400) : trimmed;
        reject(new Error(`python_failed_${code}${tail ? `: ${tail}` : ""}`));
      }
    });
  });
}

type TrainingMetricSnapshot = {
  epoch?: number | null;
  epoch_total?: number | null;
  step?: number | null;
  step_total?: number | null;
  loss?: number | null;
};

async function recordTrainingMetric(runId: string, snapshot: TrainingMetricSnapshot, rawLine: string) {
  if (!snapshot.epoch && !snapshot.step && !snapshot.loss) return;
  await execute(
    "INSERT INTO training.metrics (id, run_id, epoch, step, loss, payload) VALUES ($1,$2,$3,$4,$5,$6)",
    [
      randomUUID(),
      runId,
      snapshot.epoch ?? null,
      snapshot.step ?? null,
      snapshot.loss ?? null,
      {
        epoch_total: snapshot.epoch_total ?? null,
        step_total: snapshot.step_total ?? null,
        line: rawLine.trim()
      }
    ]
  );
}

async function runPythonWithMetrics(scriptPath: string, args: string[], runId: string) {
  return new Promise<void>((resolve, reject) => {
    const venvPython = path.join(process.cwd(), ".venv", "bin", "python");
    const pythonBin = process.env.FRAMEWORKX_PYTHON || (fsSync.existsSync(venvPython) ? venvPython : "python3");
    const child = spawn(pythonBin, [scriptPath, ...args], { env: process.env });
    let output = "";
    let buffer = "";
    let lastMetricAt = 0;
    let lastHeartbeatAt = 0;
    const current: TrainingMetricSnapshot = {};
    let lastStep: number | null = null;
    let lastEpoch: number | null = null;
    let lastLoss: number | null = null;

    const flushLine = async (line: string) => {
      const chunks = line.split("\r").filter(Boolean);
      for (const chunk of chunks) {
        const stepMatches = Array.from(chunk.matchAll(/steps:\s*.*?(\d+)\s*\/\s*(\d+)/gi));
        const epochMatches = Array.from(chunk.matchAll(/epoch\s+(\d+)\s*\/\s*(\d+)/gi));
        const lossMatch = chunk.match(/avr_loss=([0-9.]+)/i);
        if (stepMatches.length) {
          const last = stepMatches[stepMatches.length - 1];
          current.step = Number(last[1]);
          current.step_total = Number(last[2]);
        }
        if (epochMatches.length) {
          const last = epochMatches[epochMatches.length - 1];
          current.epoch = Number(last[1]);
          current.epoch_total = Number(last[2]);
        }
        if (lossMatch) {
          current.loss = Number(lossMatch[1]);
        }
      }

      const now = Date.now();
      const stepChanged = typeof current.step === "number" && current.step !== lastStep;
      const epochChanged = typeof current.epoch === "number" && current.epoch !== lastEpoch;
      const lossChanged = typeof current.loss === "number" && current.loss !== lastLoss;
      const shouldWrite = stepChanged || epochChanged || (lossChanged && now - lastMetricAt > 5000);
      if (shouldWrite) {
        lastStep = typeof current.step === "number" ? current.step : lastStep;
        lastEpoch = typeof current.epoch === "number" ? current.epoch : lastEpoch;
        lastLoss = typeof current.loss === "number" ? current.loss : lastLoss;
        lastMetricAt = now;
        await recordTrainingMetric(runId, current, line);
        await updateTrainingStatus(runId);
      }
      if (now - lastHeartbeatAt > 5000) {
        lastHeartbeatAt = now;
        await heartbeat(runId, "training", "busy");
      }
    };

    const handleData = (d: Buffer, stream: NodeJS.WriteStream) => {
      const text = d.toString();
      output += text;
      stream.write(d);
      buffer += text;
      const lines = buffer.split(/[\r\n]+/);
      if (/[\r\n]$/.test(buffer)) {
        buffer = "";
      } else {
        buffer = lines.pop() ?? "";
      }
      for (const line of lines) {
        if (line) void flushLine(line);
      }
    };

    child.stdout.on("data", (d) => handleData(d, process.stdout));
    child.stderr.on("data", (d) => {
      handleData(d, process.stderr);
    });
    child.on("close", (code) => {
      if (buffer.trim()) {
        void flushLine(buffer);
      }
      if (code === 0) resolve();
      else {
        const trimmed = output.trim();
        const tail = trimmed.length > 400 ? trimmed.slice(trimmed.length - 400) : trimmed;
        reject(new Error(`python_failed_${code}${tail ? `: ${tail}` : ""}`));
      }
    });
  });
}

async function resolveFilePath(fileId?: string | null) {
  if (!fileId) return null;
  const [row] = await query<{ path: string }>("SELECT path FROM files.file_registry WHERE id = $1", [fileId]);
  const filePath = row?.path ?? null;
  if (!filePath) return null;
  if (fsSync.existsSync(filePath)) return filePath;
  if (filePath.startsWith("/data/models/")) {
    const mapped = path.join(config.storageRoot, "models", filePath.slice("/data/models/".length));
    if (fsSync.existsSync(mapped)) return mapped;
  }
  return filePath;
}

async function resolveModelPath(job: any) {
  if (job.model_file_id) {
    return await resolveFilePath(job.model_file_id);
  }
  if (job.model_id) {
    const [model] = await query<{ model_file_id: string | null }>(
      "SELECT model_file_id FROM gallery.models WHERE id = $1",
      [job.model_id]
    );
    if (model?.model_file_id) {
      return await resolveFilePath(model.model_file_id);
    }
  }
  return null;
}

async function resolveLoraPaths(ids?: string[] | null) {
  if (!ids || ids.length === 0) return [];
  const rows = await query<{ path: string }>("SELECT path FROM files.file_registry WHERE id = ANY($1::uuid[])", [
    ids
  ]);
  return rows.map((row) => row.path).filter(Boolean);
}

async function ensureRunSteps(runId: string) {
  for (const step of PIPELINE_STEPS) {
    await execute(
      "INSERT INTO pipeline.run_steps (run_id, step, status) VALUES ($1,$2,'pending') ON CONFLICT (run_id, step) DO NOTHING",
      [runId, step]
    );
  }
}

async function ensureTrainingRunSteps(runId: string) {
  for (const step of TRAINING_STEPS) {
    await execute(
      "INSERT INTO training.run_steps (run_id, step, status) VALUES ($1,$2,'pending') ON CONFLICT (run_id, step) DO NOTHING",
      [runId, step]
    );
  }
}

async function updateTrainingStep(runId: string, step: string, status: string) {
  await execute(
    "UPDATE training.run_steps SET status = $1, updated_at = NOW() WHERE run_id = $2 AND step = $3",
    [status, runId, step]
  );
}

async function ensureTrainingDatasetItems(run: any) {
  const runRoot = path.join(config.storageRoot, "users", run.user_id, "datasets", run.id);
  const workRoot = path.join(runRoot, "workflow", "work");
  const outputRoot = path.join(runRoot, "outputs", "datasets");
  const inputRoot = path.join(runRoot, "input");
  const [dataset] = await query<{ id: string; root_file_id: string | null }>(
    "SELECT id, root_file_id FROM training.datasets WHERE pipeline_run_id = $1 LIMIT 1",
    [run.id]
  );
  let datasetId = dataset?.id ?? null;
  if (!datasetId) {
    datasetId = randomUUID();
    const rootFileId = run.dataset_file_id ?? run.upload_file_id ?? null;
    await execute(
      "INSERT INTO training.datasets (id, user_id, pipeline_run_id, status, root_file_id) VALUES ($1,$2,$3,'ready',$4)",
      [datasetId, run.user_id, run.id, rootFileId]
    );
  }
  await query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM training.dataset_items WHERE dataset_id = $1",
    [datasetId]
  );
  const listImages = async (root: string) => {
    const found: string[] = [];
    if (!fsSync.existsSync(root)) return found;
    const stack = [root];
    while (stack.length) {
      const current = stack.pop() as string;
      let entries: fsSync.Dirent[];
      try {
        entries = await fs.readdir(current, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          if (entry.name.startsWith("_")) continue;
          stack.push(fullPath);
          continue;
        }
        const ext = path.extname(entry.name).toLowerCase();
        if (![".png", ".jpg", ".jpeg", ".webp", ".bmp"].includes(ext)) continue;
        found.push(fullPath);
      }
    }
    return found;
  };

  let images = await listImages(outputRoot);
  if (images.length === 0) {
    images = await listImages(workRoot);
  }
  if (images.length === 0) {
    images = await listImages(inputRoot);
  }
  if (images.length === 0) return;

  const uniqueImages = new Set(images);
  for (const imgPath of uniqueImages) {
    const { id: fileId } = await registerFile(run.user_id, imgPath, "dataset_image", {
      sourceType: "dataset_image",
      sourceId: datasetId,
      sourceRunId: run.id,
      sourceStep: "autotag_prep"
    });
    await execute(
      "INSERT INTO training.dataset_items (dataset_id, file_id, role) VALUES ($1,$2,'train') ON CONFLICT DO NOTHING",
      [datasetId, fileId]
    );
  }
}

async function updatePipelineStatus(runId: string, errorMessage?: string) {
  const [run] = await query<{
    id: string;
    user_id: string;
    status: string;
    last_step: string | null;
    started_at: string | null;
    updated_at: string;
  }>("SELECT id, user_id, status, last_step, started_at, updated_at FROM pipeline.runs WHERE id = $1", [runId]);
  if (!run) return;
  const [counts] = await query<{ total: number; done: number }>(
    "SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'done')::int AS done FROM pipeline.run_steps WHERE run_id = $1",
    [runId]
  );
  const total = Number(counts?.total ?? 0);
  const done = Number(counts?.done ?? 0);
  let progress = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : null;
  if (run.status === "ready_to_train") {
    progress = 100;
  }
  let eta = null;
  if (progress && run.started_at) {
    const elapsed = Math.max(1, Math.round((Date.now() - new Date(run.started_at).getTime()) / 1000));
    const totalEstimate = Math.round(elapsed / (progress / 100));
    eta = Math.max(0, totalEstimate - elapsed);
  }
  await execute(
    `INSERT INTO ui.pipeline_run_status
      (run_id, user_id, status, last_step, total_steps, completed_steps, progress_pct, current_stage, eta_seconds, started_at, updated_at, error_message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),$11)
     ON CONFLICT (run_id) DO UPDATE SET
       status = EXCLUDED.status,
       last_step = EXCLUDED.last_step,
       total_steps = EXCLUDED.total_steps,
       completed_steps = EXCLUDED.completed_steps,
       progress_pct = EXCLUDED.progress_pct,
       current_stage = EXCLUDED.current_stage,
       eta_seconds = EXCLUDED.eta_seconds,
       started_at = EXCLUDED.started_at,
       updated_at = NOW(),
       error_message = EXCLUDED.error_message`,
    [
      run.id,
      run.user_id,
      run.status,
      run.last_step,
      total,
      done,
      progress,
      run.last_step,
      eta,
      run.started_at,
      errorMessage ?? null
    ]
  );
}

async function updateGenerationStatus(jobId: string, errorMessage?: string) {
  const [job] = await query<{
    id: string;
    user_id: string;
    status: string;
    batch_count: number;
    started_at: string | null;
    updated_at: string;
  }>("SELECT id, user_id, status, batch_count, started_at, updated_at FROM generation.jobs WHERE id = $1", [
    jobId
  ]);
  if (!job) return;
  const [counts] = await query<{ outputs: number }>(
    "SELECT COUNT(*)::int AS outputs FROM generation.outputs WHERE job_id = $1",
    [jobId]
  );
  const total = Number(job.batch_count ?? 1);
  const ready = Number(counts?.outputs ?? 0);
  let progress = total > 0 ? Math.min(100, Math.round((ready / total) * 100)) : null;
  if (job.status === "completed") {
    progress = 100;
  }
  let eta = null;
  if (progress && job.started_at && progress < 100) {
    const elapsed = Math.max(1, Math.round((Date.now() - new Date(job.started_at).getTime()) / 1000));
    const totalEstimate = Math.round(elapsed / (progress / 100));
    eta = Math.max(0, totalEstimate - elapsed);
  }
  await execute(
    `INSERT INTO ui.generation_job_status
      (job_id, user_id, status, batch_count, outputs_ready, previews_ready, progress_pct, eta_seconds, started_at, updated_at, error_message)
     VALUES ($1,$2,$3,$4,$5,0,$6,$7,$8,NOW(),$9)
     ON CONFLICT (job_id) DO UPDATE SET
       status = EXCLUDED.status,
       batch_count = EXCLUDED.batch_count,
       outputs_ready = EXCLUDED.outputs_ready,
       progress_pct = EXCLUDED.progress_pct,
       eta_seconds = EXCLUDED.eta_seconds,
       started_at = EXCLUDED.started_at,
       updated_at = NOW(),
       error_message = EXCLUDED.error_message`,
    [job.id, job.user_id, job.status, total, ready, progress, eta, job.started_at, errorMessage ?? null]
  );
}

async function updateTrainingStatus(runId: string, errorMessage?: string) {
  const [run] = await query<{
    id: string;
    user_id: string;
    status: string;
    settings: any;
    started_at: string | null;
  }>("SELECT id, user_id, status, settings, started_at FROM training.runs WHERE id = $1", [runId]);
  if (!run) return;
  const [latestMetric] = await query<{ step: number; epoch: number; loss: number; payload: any }>(
    "SELECT step, epoch, loss, payload FROM training.metrics WHERE run_id = $1 ORDER BY created_at DESC LIMIT 1",
    [runId]
  );
  const settings = run.settings ?? {};
  const payloadTotals = latestMetric?.payload ?? {};
  const stepValue = Number(latestMetric?.step ?? 0);
  const epochValue = Number(latestMetric?.epoch ?? 0);
  let stepTotal = Number(settings.step_total ?? 0);
  let epochTotal = Number(settings.epoch_total ?? 0);
  if (stepTotal <= 0 && Number(payloadTotals.step_total) > 0) {
    stepTotal = Number(payloadTotals.step_total);
  }
  if (epochTotal <= 0 && Number(payloadTotals.epoch_total) > 0) {
    epochTotal = Number(payloadTotals.epoch_total);
  }
  let progressRaw: number | null = null;
  // In our trainer output, step_total is the global target across all epochs.
  // Prefer step-based progress to avoid under-reporting and inflated ETA.
  if (stepTotal > 0) {
    progressRaw = Math.min(100, (stepValue / stepTotal) * 100);
  } else if (epochTotal > 0) {
    progressRaw = Math.min(100, (epochValue / epochTotal) * 100);
  }
  let progress = progressRaw === null ? null : Math.min(100, Math.round(progressRaw));
  if (progress !== null && run.status !== "completed" && progress >= 100) {
    const stepIncomplete = stepTotal > 0 && stepValue < stepTotal;
    const epochIncomplete = epochTotal > 0 && epochValue < epochTotal;
    if (stepIncomplete || epochIncomplete) {
      progress = 99;
    }
  }
  if (run.status === "completed") {
    progress = 100;
  }
  let eta = null;
  if (progressRaw !== null && progressRaw > 0 && progressRaw < 100 && run.started_at) {
    const elapsed = Math.max(1, Math.round((Date.now() - new Date(run.started_at).getTime()) / 1000));
    const totalEstimate = Math.round(elapsed / (progressRaw / 100));
    eta = Math.max(0, totalEstimate - elapsed);
  }
  await execute(
    `INSERT INTO ui.training_run_status
      (training_run_id, user_id, status, epoch, epoch_total, step, step_total, progress_pct, eta_seconds, started_at, updated_at, last_loss, error_message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),$11,$12)
     ON CONFLICT (training_run_id) DO UPDATE SET
       status = EXCLUDED.status,
       epoch = EXCLUDED.epoch,
       epoch_total = EXCLUDED.epoch_total,
       step = EXCLUDED.step,
       step_total = EXCLUDED.step_total,
       progress_pct = EXCLUDED.progress_pct,
       eta_seconds = EXCLUDED.eta_seconds,
       started_at = EXCLUDED.started_at,
       updated_at = NOW(),
       last_loss = EXCLUDED.last_loss,
       error_message = EXCLUDED.error_message`,
    [
      run.id,
      run.user_id,
      run.status,
      epochValue,
      epochTotal || null,
      stepValue,
      stepTotal || null,
      progress,
      eta,
      run.started_at,
      latestMetric?.loss ?? null,
      errorMessage ?? null
    ]
  );
}

async function unzipRun(run: any) {
  const [upload] = await query<{ path: string }>("SELECT path FROM files.file_registry WHERE id = $1", [run.upload_file_id]);
  if (!upload?.path) {
    throw new Error("upload_missing");
  }
  const outDir = path.join(config.storageRoot, "users", run.user_id, "datasets", run.id, "input");
  await fs.mkdir(outDir, { recursive: true });
  try {
    await fsSync.createReadStream(upload.path).pipe(unzipper.Extract({ path: outDir })).promise();
  } catch (err) {
    const message = summarizeError(err).toLowerCase();
    // Some valid ZIPs fail in unzipper with data-descriptor signature parsing.
    // Fall back to Python zipfile extraction before failing the pipeline run.
    if (!message.includes("invalid signature")) {
      throw err;
    }
    await fs.rm(outDir, { recursive: true, force: true });
    await fs.mkdir(outDir, { recursive: true });
    const venvPython = path.join(process.cwd(), ".venv", "bin", "python");
    const pythonBin = process.env.FRAMEWORKX_PYTHON || (fsSync.existsSync(venvPython) ? venvPython : "python3");
    await new Promise<void>((resolve, reject) => {
      const inline = [
        "import zipfile,sys",
        "z=sys.argv[1]",
        "d=sys.argv[2]",
        "f=zipfile.ZipFile(z,'r')",
        "f.extractall(d)",
        "f.close()"
      ].join(";");
      const child = spawn(pythonBin, ["-c", inline, upload.path, outDir], { env: process.env });
      let output = "";
      child.stdout.on("data", (d) => {
        output += d.toString();
      });
      child.stderr.on("data", (d) => {
        output += d.toString();
      });
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        const trimmed = output.trim();
        const tail = trimmed.length > 300 ? trimmed.slice(trimmed.length - 300) : trimmed;
        reject(new Error(`unzip_fallback_failed_${code}${tail ? `: ${tail}` : ""}`));
      });
    });
  }
  await execute("UPDATE pipeline.run_steps SET status = 'done', updated_at = NOW() WHERE run_id = $1 AND step = 'unzip'", [run.id]);
}

async function runPipelineStep(run: any, step: string) {
  const flags = run.flags ?? {};
  const manualEnabled = Boolean(flags.manualTagging);
  const autotagEnabled = flags.autotag !== false;
  const autocharEnabled = Boolean(flags.autochar);
  const imagesOnly = Boolean(flags.imagesOnly);

  const skipStep = async () => {
    await execute("UPDATE pipeline.run_steps SET status = 'done', updated_at = NOW() WHERE run_id = $1 AND step = $2", [
      run.id,
      step
    ]);
    await execute("UPDATE pipeline.runs SET last_step = $1, updated_at = NOW() WHERE id = $2", [step, run.id]);
    return { paused: false, skipped: true };
  };

  if (imagesOnly && ["cap", "archive", "move_capped"].includes(step)) {
    return skipStep();
  }
  if (step === "autotag" || (step === "package_dataset" && !autotagEnabled)) {
    await ensureTrainingDatasetItems(run);
  }
  if (step === "autotag") {
    if (!autotagEnabled) {
      return skipStep();
    }
  }
  if (step === "autochar" && !autocharEnabled) {
    return skipStep();
  }
  if (step.startsWith("manual_") && !manualEnabled) {
    return skipStep();
  }
  if (step === "manual_pause" && manualEnabled) {
    await execute("UPDATE pipeline.runs SET status = 'manual_tagging', last_step = 'manual_pause', updated_at = NOW() WHERE id = $1", [run.id]);
    return { paused: true, skipped: false };
  }
  if (step.startsWith("manual_")) {
    await execute("UPDATE pipeline.run_steps SET status = 'done', updated_at = NOW() WHERE run_id = $1 AND step = $2", [run.id, step]);
    return { paused: false, skipped: false };
  }
  if (step === "train_plan" || step === "train_stage" || step === "train_run" || step === "collect_training") {
    return skipStep();
  }

  const settingsMap = await loadGlobalSettingsMap();
  const autocharNames = Array.isArray(flags.autocharPresets) ? flags.autocharPresets : [];
  let autocharPatterns: string[] = [];
  if (autocharNames.length) {
    const rows = await query<{ patterns: string[] }>(
      "SELECT patterns FROM pipeline.autochar_presets WHERE user_id = $1 AND name = ANY($2::text[])",
      [run.user_id, autocharNames]
    );
    autocharPatterns = rows.flatMap((row) => row.patterns ?? []);
  }

  const runRoot = path.join(config.storageRoot, "users", run.user_id, "datasets", run.id);
  const payloadPath = path.join(runRoot, "pipeline_step.json");
  const outputPath = path.join(runRoot, "pipeline_step_out.json");
  await fs.mkdir(runRoot, { recursive: true });
  await fs.writeFile(
    payloadPath,
    JSON.stringify(
      {
        step,
        run_id: run.id,
        run_name: run.name ?? "",
        user_id: run.user_id,
        storage_root: config.storageRoot,
        flags,
        settings: settingsMap,
        autochar_patterns: autocharPatterns,
        output_path: outputPath
      },
      null,
      2
    )
  );
  const engineScript = path.join(process.cwd(), "apps", "engine", "pipeline.py");
  await runPython(engineScript, ["--input", payloadPath]);
  if (step === "package_dataset") {
    try {
      const outputRaw = await fs.readFile(outputPath, "utf-8");
      const output = JSON.parse(outputRaw);
      if (output?.dataset_zip && fsSync.existsSync(output.dataset_zip)) {
        const { id: fileId } = await registerFile(run.user_id, output.dataset_zip, "dataset", {
          sourceType: "pipeline_run_dataset",
          sourceId: run.id,
          sourceRunId: run.id,
          sourceStep: step
        });
        await execute("UPDATE pipeline.runs SET dataset_file_id = $1, updated_at = NOW() WHERE id = $2", [
          fileId,
          run.id
        ]);
        const [existing] = await query<{ id: string }>(
          "SELECT id FROM training.datasets WHERE pipeline_run_id = $1 LIMIT 1",
          [run.id]
        );
        if (existing) {
          await execute("UPDATE training.datasets SET root_file_id = $1, updated_at = NOW() WHERE id = $2", [
            fileId,
            existing.id
          ]);
        } else {
          await execute(
            "INSERT INTO training.datasets (id, user_id, pipeline_run_id, status, root_file_id) VALUES ($1,$2,$3,'ready',$4)",
            [randomUUID(), run.user_id, run.id, fileId]
          );
        }
      }
    } catch {
      // ignore dataset packaging errors here
    }
  }
  await execute("UPDATE pipeline.run_steps SET status = 'done', updated_at = NOW() WHERE run_id = $1 AND step = $2", [run.id, step]);
  await execute("UPDATE pipeline.runs SET last_step = $1, updated_at = NOW() WHERE id = $2", [step, run.id]);
  return { paused: false, skipped: false };
}

async function tickIntake() {
  if (await queuePaused()) {
    await heartbeat(undefined, "paused", "idle");
    return;
  }
  const [run] = await query(
    "SELECT r.* FROM pipeline.runs r JOIN pipeline.queue q ON q.run_id = r.id WHERE r.status = 'queued' ORDER BY q.position ASC LIMIT 1"
  );
  if (!run) {
    await heartbeat(undefined, "idle", "idle");
    return;
  }
  await heartbeat(run.id, "intake", "busy");
  try {
    await execute("DELETE FROM pipeline.queue WHERE run_id = $1", [run.id]);
    await ensureRunSteps(run.id);
    await unzipRun(run);
    await execute("UPDATE pipeline.runs SET status = 'queued_initiated', updated_at = NOW() WHERE id = $1", [run.id]);
    await updatePipelineStatus(run.id);
  } catch (err) {
    const errorSummary = summarizeError(err);
    const errorCode = normalizeErrorCode(errorSummary);
    await execute("UPDATE pipeline.runs SET status = 'failed', updated_at = NOW() WHERE id = $1", [run.id]);
    await updatePipelineStatus(run.id, errorSummary);
    await releasePipelineCredits(run, "release_pipeline_failed");
    await execute(
      "INSERT INTO pipeline.events (id, run_id, level, message, details) VALUES ($1,$2,'error',$3,$4)",
      [randomUUID(), run.id, errorSummary, { stage: "intake", error_code: errorCode }]
    );
    try {
      await enqueueNotificationEvent({
        userId: run.user_id,
        type: "training_failed",
        refType: "pipeline_run",
        refId: run.id,
        payload: {
          run_name: run.name ?? run.id,
          stage: "intake",
          error_code: errorCode,
          error: errorSummary
        },
        idempotencyKey: `notify_pipeline_failed:${run.id}:intake:${errorCode}`
      });
    } catch {
      // keep pipeline failure path non-blocking for notifications
    }
  }
  await heartbeat(undefined, "idle", "idle");
}

async function tickPrep() {
  if (await queuePaused()) {
    await heartbeat(undefined, "paused", "idle");
    return;
  }
  let [run] = await query(
    "SELECT * FROM pipeline.runs WHERE status IN ('queued_initiated','running') ORDER BY created_at ASC LIMIT 1"
  );
  if (!run) {
    [run] = await query(
      "SELECT * FROM pipeline.runs WHERE status = 'ready_to_train' ORDER BY created_at ASC LIMIT 1"
    );
  }
  if (!run) {
    await heartbeat(undefined, "idle", "idle");
    return;
  }
  await heartbeat(run.id, "prep", "busy");
  try {
    if (run.status === "ready_to_train") {
      const flags = run.flags ?? {};
      if (!flags.train) {
        await execute(
          "UPDATE pipeline.runs SET status = 'completed', finished_at = NOW(), updated_at = NOW() WHERE id = $1",
          [run.id]
        );
        await updatePipelineStatus(run.id);
        await heartbeat(undefined, "idle", "idle");
        return;
      }
      await ensureTrainingRunFromPipeline(run);
      await updatePipelineStatus(run.id);
      await heartbeat(undefined, "idle", "idle");
      return;
    }
    if (run.status !== "running") {
      await execute(
        "UPDATE pipeline.runs SET status = 'running', started_at = COALESCE(started_at, NOW()), updated_at = NOW() WHERE id = $1",
        [run.id]
      );
    }
    const [next] = await query<{ step: string }>(
      "SELECT step FROM pipeline.run_steps WHERE run_id = $1 AND status = 'pending' ORDER BY ARRAY_POSITION($2::text[], step) ASC LIMIT 1",
      [run.id, PIPELINE_STEPS]
    );
    if (!next) {
      await execute(
        "UPDATE pipeline.runs SET status = 'ready_to_train', finished_at = NOW(), updated_at = NOW() WHERE id = $1",
        [run.id]
      );
      const [existing] = await query<{ id: string }>(
        "SELECT id FROM training.datasets WHERE pipeline_run_id = $1 LIMIT 1",
        [run.id]
      );
      if (!existing) {
        const rootFileId = run.dataset_file_id ?? run.upload_file_id ?? null;
        if (rootFileId) {
          await execute(
            "INSERT INTO training.datasets (id, user_id, pipeline_run_id, status, root_file_id) VALUES ($1,$2,$3,'ready',$4)",
            [randomUUID(), run.user_id, run.id, rootFileId]
          );
        }
      }
      await ensureTrainingRunFromPipeline(run);
      await updatePipelineStatus(run.id);
      await heartbeat(undefined, "idle", "idle");
      return;
    }
    const result = await runPipelineStep(run, next.step);
    await updatePipelineStatus(run.id);
    if (result.paused) {
      await heartbeat(run.id, "manual_tagging", "blocked");
      return;
    }
    await heartbeat(undefined, "idle", "idle");
  } catch (err) {
    const errorSummary = summarizeError(err);
    const errorCode = normalizeErrorCode(errorSummary);
    await execute("UPDATE pipeline.runs SET status = 'failed', updated_at = NOW() WHERE id = $1", [run.id]);
    await updatePipelineStatus(run.id, errorSummary);
    await releasePipelineCredits(run, "release_pipeline_failed");
    await execute(
      "INSERT INTO pipeline.events (id, run_id, level, message, details) VALUES ($1,$2,'error',$3,$4)",
      [randomUUID(), run.id, errorSummary, { stage: "prep", error_code: errorCode }]
    );
    try {
      await enqueueNotificationEvent({
        userId: run.user_id,
        type: "training_failed",
        refType: "pipeline_run",
        refId: run.id,
        payload: {
          run_name: run.name ?? run.id,
          stage: "prep",
          error_code: errorCode,
          error: errorSummary
        },
        idempotencyKey: `notify_pipeline_failed:${run.id}:prep:${errorCode}`
      });
    } catch {
      // keep pipeline failure path non-blocking for notifications
    }
    await heartbeat(undefined, errorSummary, "error");
  }
}

async function processGenerationJob(
  job: any,
  options?: {
    isTrainingActive?: boolean;
    settingsMap?: Record<string, any>;
    gpuSnapshot?: GpuMemorySnapshot | null;
  }
) {
  await heartbeat(job.id, "generation", "busy");
  const userRoot = path.join(config.storageRoot, "users", job.user_id, "outputs", job.id);
  await fs.mkdir(userRoot, { recursive: true });
  let jobSeed = job.seed ?? null;
  if (!jobSeed || Number(jobSeed) <= 0) {
    jobSeed = Math.floor(Math.random() * 1_000_000_000);
    await execute("UPDATE generation.jobs SET seed = $1, updated_at = NOW() WHERE id = $2", [jobSeed, job.id]);
    job.seed = jobSeed;
  }
  const [previewJob] = await query<{ lora_id: string; position: number }>(
    "SELECT lora_id, position FROM gallery.lora_preview_jobs WHERE job_id = $1",
    [job.id]
  );
  const isPreviewJob = Boolean(previewJob?.lora_id);
  const isTrainingActive = Boolean(options?.isTrainingActive);
  const settingsMap = options?.settingsMap ?? {};
  const gpuSnapshot = options?.gpuSnapshot ?? null;
  const modelPath = await resolveModelPath(job);
  if (!modelPath) {
    throw new Error("generation_model_missing");
  }
  const loraPaths = await resolveLoraPaths(job.lora_file_ids);
  const promptVariants = Array.isArray(job.prompt_variants)
    ? job.prompt_variants.map((value: any) => String(value).trim()).filter(Boolean)
    : [];
  const plannedPrompts = promptVariants.length ? promptVariants : null;
  const baseBatchTarget = plannedPrompts ? plannedPrompts.length : Math.max(1, Number(job.batch_count ?? 1));
  const renderPlan = computeGenerationRenderPlan({
    job: { ...job, batch_count: baseBatchTarget },
    isTrainingActive,
    isPreviewJob,
    settingsMap,
    gpuSnapshot
  });
  const batchTarget = plannedPrompts ? plannedPrompts.length : renderPlan.batchCount;
  const renderWidth = renderPlan.width;
  const renderHeight = renderPlan.height;
  const renderSteps = renderPlan.steps;
  const memoryMode = renderPlan.memoryMode;
  if (renderPlan.autoDowngraded) {
    await updateGenerationStatus(job.id, renderPlan.downgradeReason ?? "auto_downgraded");
  } else if (generationWaitState.has(job.id)) {
    generationWaitState.delete(job.id);
    await updateGenerationStatus(job.id);
  }

  const payloadPath = path.join(userRoot, "job.json");
  await fs.writeFile(
    payloadPath,
    JSON.stringify(
      {
        prompt: plannedPrompts ? plannedPrompts[0] ?? job.prompt ?? "" : job.prompt ?? "",
        prompt_variants: plannedPrompts ?? null,
        negative_prompt: job.negative_prompt ?? "",
        model_path: modelPath,
        lora_paths: loraPaths,
        width: renderWidth,
        height: renderHeight,
        steps: renderSteps,
        cfg_scale: Number(job.cfg_scale ?? 7.5),
        seed: Number.isFinite(Number(job.seed)) ? Number(job.seed) : null,
        batch_count: batchTarget,
        sampler: job.sampler ?? "",
        scheduler: job.scheduler ?? "",
        output_dir: userRoot,
        memory_mode: memoryMode
      },
      null,
      2
    )
  );
  const engineScript = path.join(process.cwd(), "apps", "engine", "run.py");
  await runPython(engineScript, ["--input", payloadPath]);

  const files = (await fs.readdir(userRoot)).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".png", ".jpg", ".jpeg", ".webp"].includes(ext);
  });
  if (files.length === 0) {
    throw new Error("generation_output_missing");
  }
  files.sort();
  const outputs = files.slice(0, batchTarget);
  const previewFileIds: string[] = [];
  for (let index = 0; index < outputs.length; index += 1) {
    const file = outputs[index];
    const filePath = path.join(userRoot, file);
    const promptUsed = plannedPrompts?.[index] ?? job.prompt;
    if (isPreviewJob) {
      const { id: previewFileId } = await registerPersistentFile(
        job.user_id,
        filePath,
        "image",
        "lora_previews",
        undefined,
        {
          sourceType: "lora_preview",
          sourceId: previewJob.lora_id,
          sourceRunId: job.id
        }
      );
      previewFileIds.push(previewFileId);
      continue;
    }
    const { id: outputFileId } = await registerFile(job.user_id, filePath, "image", {
      sourceType: "generation_job",
      sourceId: job.id
    });
    const { id: galleryFileId } = await registerPersistentFile(
      job.user_id,
      filePath,
      "image",
      "gallery_images",
      undefined,
      {
        sourceType: "gallery_image",
        sourceId: job.id,
        sourceRunId: job.id
      }
    );
    const outputId = randomUUID();
    await execute(
      "INSERT INTO generation.outputs (id, job_id, file_id, prompt, negative_prompt, sampler, scheduler, steps, cfg_scale, seed) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [
        outputId,
        job.id,
        outputFileId,
        promptUsed,
        job.negative_prompt,
        job.sampler,
        job.scheduler,
        renderSteps,
        job.cfg_scale,
        job.seed
      ]
    );
    await execute(
      "INSERT INTO gallery.images (id, user_id, file_id, model_id, generation_job_id, generation_output_id, prompt, negative_prompt, sampler, scheduler, steps, cfg_scale, seed, is_public) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)",
      [
        randomUUID(),
        job.user_id,
        galleryFileId,
        job.model_id,
        job.id,
        outputId,
        promptUsed,
        job.negative_prompt,
        job.sampler,
        job.scheduler,
        job.steps,
        job.cfg_scale,
        job.seed,
        Boolean(job.is_public ?? false)
      ]
    );
  }

  if (isPreviewJob && previewJob) {
    const [lora] = await query<{ file_id: string }>("SELECT file_id FROM gallery.loras WHERE id = $1", [
      previewJob.lora_id
    ]);
    const [linked] = lora?.file_id
      ? await query<{ training_run_id: string }>(
          "SELECT training_run_id FROM gallery.models WHERE model_file_id = $1 AND training_run_id IS NOT NULL ORDER BY created_at DESC LIMIT 1",
          [lora.file_id]
        )
      : [];
    const positionBase = Number(previewJob.position ?? 1);
    for (let i = 0; i < previewFileIds.length; i += 1) {
      const fileId = previewFileIds[i];
      await execute(
        "INSERT INTO gallery.lora_previews (id, lora_id, file_id, position) VALUES ($1,$2,$3,$4)",
        [randomUUID(), previewJob.lora_id, fileId, positionBase + i]
      );
      if (linked?.training_run_id) {
        await execute(
          "INSERT INTO training.artifacts (id, run_id, kind, file_id) VALUES ($1,$2,'preview',$3)",
          [randomUUID(), linked.training_run_id, fileId]
        );
      }
    }
    await execute("DELETE FROM gallery.lora_preview_jobs WHERE job_id = $1", [job.id]);
  }
  await execute(
    "UPDATE generation.jobs SET status = 'completed', finished_at = NOW(), updated_at = NOW() WHERE id = $1",
    [job.id]
  );
  if (job.credits_reserved) {
    await enqueueCreditIntent({
      userId: job.user_id,
      action: "charge_generate",
      amount: Number(job.credits_reserved),
      refType: "generation_job",
      refId: job.id,
      payload: {},
      idempotencyKey: `charge_generate:${job.id}`
    });
  }
  await updateGenerationStatus(job.id);
  await heartbeat(undefined, "idle", "idle");
}

async function processTrainingRun(run: any) {
  await heartbeat(run.id, "training", "busy");
  const outputDir = path.join(config.storageRoot, "users", run.user_id, "training", run.id);
  await fs.mkdir(outputDir, { recursive: true });
  const [pipelineRun] = await query<{ id: string; name: string; dataset_file_id: string | null; flags?: any }>(
    "SELECT id, name, dataset_file_id, flags FROM pipeline.runs WHERE id = $1",
    [run.pipeline_run_id]
  );
  const baseNameRaw = (pipelineRun?.name || run.id || "lora").toString().replace(/\.zip$/i, "");
  const baseNameSafe = baseNameRaw.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  const baseName = baseNameSafe || run.id;
  const [dataset] = await query<{ root_file_id: string | null }>(
    "SELECT root_file_id FROM training.datasets WHERE id = $1",
    [run.dataset_id]
  );
  const datasetPath = await resolveFilePath(dataset?.root_file_id ?? null);
  if (!datasetPath) {
    throw new Error("training_dataset_missing");
  }
  const baseModelPath = await resolveFilePath(run.base_model_file_id ?? null);
  if (!baseModelPath) {
    throw new Error("training_base_model_missing");
  }
  await ensureTrainingRunSteps(run.id);
  let currentStep = "train_pre";
  const payloadPath = path.join(outputDir, "train.json");
  try {
    await updateTrainingStep(run.id, "train_pre", "running");
    await fs.writeFile(
      payloadPath,
      JSON.stringify(
        {
          run_id: run.id,
          dataset_path: datasetPath,
          output_dir: outputDir,
          base_model_path: baseModelPath,
          settings: run.settings ?? {}
        },
        null,
        2
      )
    );
    await updateTrainingStep(run.id, "train_pre", "done");

    currentStep = "train_phase";
    await updateTrainingStep(run.id, "train_phase", "running");
    const engineScript = path.join(process.cwd(), "apps", "engine", "train.py");
    await runPythonWithMetrics(engineScript, ["--input", payloadPath], run.id);
    await updateTrainingStep(run.id, "train_phase", "done");

    currentStep = "finishing";
    await updateTrainingStep(run.id, "finishing", "running");
  } catch (err) {
    await updateTrainingStep(run.id, currentStep, "failed");
    throw err;
  }
  const outputPath = path.join(outputDir, "model.safetensors");
  if (!fsSync.existsSync(outputPath)) {
    throw new Error("training_output_missing");
  }
  const previewDirs = [path.join(outputDir, "sample"), path.join(outputDir, "samples")];
  for (const dir of previewDirs) {
    if (!fsSync.existsSync(dir)) continue;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const lower = entry.name.toLowerCase();
      if (!lower.endsWith(".png") && !lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".webp")) {
        continue;
      }
      const previewPath = path.join(dir, entry.name);
      const { id: fileId } = await registerPersistentFile(
        run.user_id,
        previewPath,
        "image",
        "lora_previews",
        undefined,
        {
          sourceType: "training_preview",
          sourceId: run.id
        }
      );
      await execute(
        "INSERT INTO training.artifacts (id, run_id, kind, file_id) VALUES ($1,$2,'preview',$3) ON CONFLICT DO NOTHING",
        [randomUUID(), run.id, fileId]
      );
    }
  }
  const { id: fileId } = await registerPersistentFile(
    run.user_id,
    outputPath,
    "model",
    "loras",
    `${baseName}.safetensors`,
    {
      sourceType: "training_run",
      sourceId: run.id
    }
  );
  await execute(
    "UPDATE training.runs SET status = 'completed', finished_at = NOW(), output_file_id = $1, updated_at = NOW() WHERE id = $2",
    [fileId, run.id]
  );
  await enqueueNotificationEvent({
    userId: run.user_id,
    type: "training_done",
    refType: "training_run",
    refId: run.id,
    payload: { run_name: pipelineRun?.name ?? run.id },
    idempotencyKey: `notify_training_done:${run.id}`
  });
  if (run.credits_reserved) {
    await enqueueCreditIntent({
      userId: run.user_id,
      action: "charge_train",
      amount: Number(run.credits_reserved),
      refType: "training_run",
      refId: run.id,
      payload: {},
      idempotencyKey: `charge_train:${run.id}`
    });
  }
  const datasetFileId =
    (pipelineRun?.id ? await ensureDatasetZipForPipeline(pipelineRun.id, run.user_id, pipelineRun.name) : null) ??
    pipelineRun?.dataset_file_id ??
    run.dataset_file_id ??
    null;
  const datasetGalleryFileId = await persistFileById(
    datasetFileId,
    run.user_id,
    "dataset",
    "datasets",
    `${baseName}.zip`
  );

  const loraName = pipelineRun?.name || `lora_${run.id}`;
  const loraDescription = pipelineRun?.flags?.description ? String(pipelineRun.flags.description).trim() : "";
  const [existingLora] = await query<{ id: string }>("SELECT id FROM gallery.loras WHERE file_id = $1", [fileId]);
  if (existingLora?.id) {
    await execute(
      "UPDATE gallery.loras SET name = $1, description = $2, dataset_file_id = $3, updated_at = NOW() WHERE id = $4",
      [loraName, loraDescription || null, datasetGalleryFileId ?? datasetFileId, existingLora.id]
    );
  } else {
    await execute(
      "INSERT INTO gallery.loras (id, user_id, name, description, file_id, is_public, dataset_file_id, source) VALUES ($1,$2,$3,$4,$5,false,$6,$7)",
      [randomUUID(), run.user_id, loraName, loraDescription || null, fileId, datasetGalleryFileId ?? datasetFileId, "training"]
    );
  }

  const previewRows = await query<{ file_id: string }>(
    "SELECT file_id FROM training.artifacts WHERE run_id = $1 AND kind = 'preview'",
    [run.id]
  );
  await execute("DELETE FROM training.artifacts WHERE run_id = $1 AND kind = 'preview'", [run.id]);
  for (const row of previewRows) {
    await deleteFileIfUnused(row.file_id);
  }
  if (run.pipeline_run_id) {
    await execute(
      "UPDATE pipeline.runs SET status = 'completed', last_step = 'finishing', finished_at = NOW(), updated_at = NOW() WHERE id = $1",
      [run.pipeline_run_id]
    );
    await execute(
      "INSERT INTO pipeline.events (id, run_id, level, message, details) VALUES ($1,$2,'info',$3,$4)",
      [randomUUID(), run.pipeline_run_id, "training_completed", { training_run_id: run.id }]
    );
    await updatePipelineStatus(run.pipeline_run_id);
  }
  await updateTrainingStatus(run.id);
  await updateTrainingStep(run.id, "finishing", "done");
  await heartbeat(undefined, "idle", "idle");
}

async function tickGeneration() {
  if (await queuePaused()) {
    await heartbeat(undefined, "paused", "idle");
    return;
  }
  const [job] = await query(
    "SELECT j.* FROM generation.jobs j JOIN generation.queue q ON q.job_id = j.id WHERE j.status = 'queued' ORDER BY q.position ASC LIMIT 1"
  );
  if (!job) {
    await heartbeat(undefined, "idle", "idle");
    return;
  }
  const settingsMap = await loadGlobalSettingsMap();
  const [trainingActiveRow] = await query<{ id: string }>(
    "SELECT id FROM training.runs WHERE status = 'running' ORDER BY started_at ASC NULLS LAST LIMIT 1"
  );
  const isTrainingActive = Boolean(trainingActiveRow?.id);
  const [previewJob] = await query<{ lora_id: string }>("SELECT lora_id FROM gallery.lora_preview_jobs WHERE job_id = $1", [
    job.id
  ]);
  const isPreviewJob = Boolean(previewJob?.lora_id);
  const gpuSnapshot = await readGpuMemorySnapshot();
  const minFreeMbNoTrain = Number(
    isPreviewJob
      ? settingsMap.generation_min_free_mb_preview ?? 1800
      : settingsMap.generation_min_free_mb ?? 2500
  );
  const minFreeMbWithTrain = Number(
    isPreviewJob
      ? settingsMap.generation_min_free_mb_preview_training ?? 4000
      : settingsMap.generation_min_free_mb_training ?? 7000
  );
  const minFreeMb = isTrainingActive ? minFreeMbWithTrain : minFreeMbNoTrain;
  if (gpuSnapshot && Number.isFinite(minFreeMb) && gpuSnapshot.freeMb < minFreeMb) {
    const waitMessage = `waiting_for_vram free=${Math.round(gpuSnapshot.freeMb)}MB min=${Math.round(minFreeMb)}MB`;
    if (generationWaitState.get(job.id) !== waitMessage) {
      generationWaitState.set(job.id, waitMessage);
      await updateGenerationStatus(job.id, waitMessage);
    }
    await heartbeat(
      job.id,
      `waiting_vram_free_${Math.round(gpuSnapshot.freeMb)}mb_min_${Math.round(minFreeMb)}mb`,
      "blocked"
    );
    return;
  }
  try {
    await execute("DELETE FROM generation.queue WHERE job_id = $1", [job.id]);
    await execute("UPDATE generation.jobs SET status = 'rendering', started_at = NOW() WHERE id = $1", [job.id]);
    generationWaitState.delete(job.id);
    await updateGenerationStatus(job.id);
    await processGenerationJob(job, {
      isTrainingActive,
      settingsMap,
      gpuSnapshot
    });
    generationOomRetries.delete(job.id);
  } catch (err) {
    const maxRetriesRaw = Number(settingsMap.generation_oom_retry_max ?? 2);
    const maxRetries = Number.isFinite(maxRetriesRaw) ? Math.max(0, Math.min(3, Math.round(maxRetriesRaw))) : 2;
    const oom = isOutOfMemoryError(err);
    if (oom) {
      const nextAttempt = (generationOomRetries.get(job.id) ?? 0) + 1;
      if (nextAttempt <= maxRetries) {
        generationOomRetries.set(job.id, nextAttempt);
        await execute(
          "UPDATE generation.jobs SET status = 'queued', started_at = NULL, finished_at = NULL, updated_at = NOW() WHERE id = $1",
          [job.id]
        );
        const [positionRow] = await query<{ next: number }>(
          "SELECT COALESCE(MAX(position), 0) + 1 AS next FROM generation.queue"
        );
        const nextPosition = Number(positionRow?.next ?? 1);
        await execute(
          "INSERT INTO generation.queue (id, job_id, position) VALUES ($1,$2,$3) ON CONFLICT (job_id) DO UPDATE SET position = EXCLUDED.position",
          [randomUUID(), job.id, nextPosition]
        );
        await updateGenerationStatus(job.id, `oom_retry_${nextAttempt}_of_${maxRetries}`);
        await heartbeat(job.id, `oom_retry_${nextAttempt}_of_${maxRetries}`, "blocked");
        return;
      }
    }
    generationOomRetries.delete(job.id);
    await execute("UPDATE generation.jobs SET status = 'failed', updated_at = NOW(), finished_at = NOW() WHERE id = $1", [job.id]);
    if (job.credits_reserved) {
      await enqueueCreditIntent({
        userId: job.user_id,
        action: "release_generate",
        amount: Number(job.credits_reserved),
        refType: "generation_job",
        refId: job.id,
        payload: { reason: "job_failed" },
        idempotencyKey: `release_generate:${job.id}:failed`
      });
    }
    await execute("DELETE FROM gallery.lora_preview_jobs WHERE job_id = $1", [job.id]);
    await updateGenerationStatus(job.id, (err as Error).message);
    const state = oom ? "blocked" : "error";
    await heartbeat(undefined, (err as Error).message, state);
  }
}

async function tickTraining() {
  if (await queuePaused()) {
    await heartbeat(undefined, "paused", "idle");
    return;
  }
  const [run] = await query("SELECT * FROM training.runs WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1");
  if (!run) {
    await heartbeat(undefined, "idle", "idle");
    return;
  }
  try {
    await execute("UPDATE training.runs SET status = 'running', started_at = NOW() WHERE id = $1", [run.id]);
    await updateTrainingStatus(run.id);
    await processTrainingRun(run);
  } catch (err) {
    const message = (err as Error).message || "training_failed";
    await failTrainingRun(run, message);
  }
}

async function failTrainingRun(run: any, message: string) {
  await execute("UPDATE training.runs SET status = 'failed', updated_at = NOW(), finished_at = NOW() WHERE id = $1", [
    run.id
  ]);
  await enqueueNotificationEvent({
    userId: run.user_id,
    type: "training_failed",
    refType: "training_run",
    refId: run.id,
    payload: { run_name: run.id, error: message },
    idempotencyKey: `notify_training_failed:${run.id}`
  });
  if (run.pipeline_run_id) {
    await execute(
      "UPDATE pipeline.runs SET status = 'failed', last_step = 'training_failed', updated_at = NOW() WHERE id = $1",
      [run.pipeline_run_id]
    );
    await execute(
      "INSERT INTO pipeline.events (id, run_id, level, message, details) VALUES ($1,$2,'error',$3,$4)",
      [randomUUID(), run.pipeline_run_id, "training_failed", { training_run_id: run.id, error: message }]
    );
    await updatePipelineStatus(run.pipeline_run_id, message);
  }
  if (run.credits_reserved) {
    await enqueueCreditIntent({
      userId: run.user_id,
      action: "release_train",
      amount: Number(run.credits_reserved),
      refType: "training_run",
      refId: run.id,
      payload: { reason: message },
      idempotencyKey: `release_train:${run.id}:failed`
    });
  }
  await updateTrainingStatus(run.id, message);
  await heartbeat(undefined, message, "error");
}

async function tickHealth() {
  await recoverStaleJobs();
  await tickLoraDeleteQueue();
  const settingsMap = await loadGlobalSettingsMap();
  let retentionDays = Number(settingsMap.archive_retention_days ?? 30);
  if (!Number.isFinite(retentionDays) || retentionDays < 1) retentionDays = 30;
  await purgeOldArchives(config.storageRoot, retentionDays);
  await heartbeat(undefined, "health", "ok");
}

async function recomputeUserStats() {
  await execute(
    `INSERT INTO core.user_stats
      (user_id, models, images, likes_models, likes_images, followers, generations_with_my_assets, updated_at)
     WITH
       model_counts AS (
         SELECT user_id, COUNT(*)::int AS count
         FROM gallery.models
         WHERE status = 'published'
         GROUP BY user_id
       ),
       lora_counts AS (
         SELECT user_id, COUNT(*)::int AS count
         FROM gallery.loras
         WHERE is_public = true
         GROUP BY user_id
       ),
       image_counts AS (
         SELECT user_id, COUNT(*)::int AS count
         FROM gallery.images
         WHERE is_public = true
         GROUP BY user_id
       ),
       model_likes AS (
         SELECT m.user_id, COUNT(*)::int AS count
         FROM social.likes s
         JOIN gallery.models m ON m.id = s.target_id
         WHERE s.target_type = 'model' AND m.status = 'published'
         GROUP BY m.user_id
       ),
       lora_likes AS (
         SELECT l.user_id, COUNT(*)::int AS count
         FROM social.likes s
         JOIN gallery.loras l ON l.id = s.target_id
         WHERE s.target_type = 'lora' AND l.is_public = true
         GROUP BY l.user_id
       ),
       image_likes AS (
         SELECT i.user_id, COUNT(*)::int AS count
         FROM social.likes s
         JOIN gallery.images i ON i.id = s.target_id
         WHERE s.target_type = 'image' AND i.is_public = true
         GROUP BY i.user_id
       ),
       follower_counts AS (
         SELECT followed_user_id AS user_id, COUNT(*)::int AS count
         FROM social.follows
         GROUP BY followed_user_id
       ),
       generation_owner_map AS (
         SELECT j.id AS job_id, gm.user_id AS owner_user_id, j.user_id AS actor_user_id
         FROM generation.jobs j
         JOIN gallery.models gm ON gm.id = j.model_id
         UNION
         SELECT j.id AS job_id, gl.user_id AS owner_user_id, j.user_id AS actor_user_id
         FROM generation.jobs j
         JOIN gallery.loras gl ON gl.file_id = j.model_file_id
         UNION
         SELECT j.id AS job_id, gl.user_id AS owner_user_id, j.user_id AS actor_user_id
         FROM generation.jobs j
         JOIN gallery.loras gl ON gl.file_id = ANY(COALESCE(j.lora_file_ids, '{}'::uuid[]))
       ),
       generation_uses AS (
         SELECT gom.owner_user_id AS user_id, COUNT(*)::int AS count
         FROM generation.outputs o
         JOIN generation_owner_map gom ON gom.job_id = o.job_id
         WHERE gom.owner_user_id IS NOT NULL
           AND gom.owner_user_id <> gom.actor_user_id
         GROUP BY gom.owner_user_id
       )
     SELECT
       u.id,
       COALESCE(mc.count, 0) + COALESCE(lc.count, 0) AS models,
       COALESCE(ic.count, 0) AS images,
       COALESCE(ml.count, 0) + COALESCE(ll.count, 0) AS likes_models,
       COALESCE(il.count, 0) AS likes_images,
       COALESCE(fc.count, 0) AS followers,
       COALESCE(gu.count, 0) AS generations_with_my_assets,
       NOW() AS updated_at
     FROM core.users u
     LEFT JOIN model_counts mc ON mc.user_id = u.id
     LEFT JOIN lora_counts lc ON lc.user_id = u.id
     LEFT JOIN image_counts ic ON ic.user_id = u.id
     LEFT JOIN model_likes ml ON ml.user_id = u.id
     LEFT JOIN lora_likes ll ON ll.user_id = u.id
     LEFT JOIN image_likes il ON il.user_id = u.id
     LEFT JOIN follower_counts fc ON fc.user_id = u.id
     LEFT JOIN generation_uses gu ON gu.user_id = u.id
     ON CONFLICT (user_id)
     DO UPDATE SET
       models = EXCLUDED.models,
       images = EXCLUDED.images,
       likes_models = EXCLUDED.likes_models,
       likes_images = EXCLUDED.likes_images,
       followers = EXCLUDED.followers,
       generations_with_my_assets = EXCLUDED.generations_with_my_assets,
       updated_at = NOW()`
  );
}

async function tickStats() {
  await recomputeUserStats();
  await heartbeat(undefined, "stats", "ok");
}

type NotificationMailSettings = {
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
  smtp_ssl?: boolean;
  smtp_tls?: boolean;
  smtp_from?: string;
  smtp_base_url?: string;
  instance_label?: string;
  instance_url?: string;
};

function mapNotificationSettingKey(type: string) {
  if (type === "like_received") return "notify.like.email";
  if (type === "comment_received") return "notify.comment.email";
  if (type === "training_done") return "notify.training_done.email";
  if (type === "training_failed") return "notify.training_failed.email";
  if (type === "new_follower") return "notify.new_follower.email";
  if (type === "dm_received") return "notify.dm.email";
  return "";
}

function humanizeWorkerError(input: unknown) {
  const raw = String(input ?? "").trim();
  if (!raw) return "Unknown error.";
  const lower = raw.toLowerCase();
  if (lower.includes("cuda out of memory") || lower.includes("outofmemoryerror")) {
    return "GPU out of memory. Try lower settings or reduce parallel GPU load.";
  }
  if (lower.includes("insufficient_credits")) {
    return "Insufficient credits for this run.";
  }
  if (lower.includes("credit_reservation_timeout")) {
    return "Credit reservation timed out.";
  }
  if (lower.includes("no such file or directory") || lower.includes("enoent")) {
    return "Required file not found.";
  }
  if (lower.includes("permission denied") || lower.includes("eacces")) {
    return "Permission denied while accessing required resources.";
  }
  return raw.slice(0, 240);
}

function mapNotificationContent(event: any, actorUsername?: string) {
  const actor = actorUsername ? `@${actorUsername}` : "Someone";
  const payload = event.payload ?? {};
  if (event.type === "like_received") {
    return {
      title: "New Like",
      body: `${actor} liked your ${String(payload.target_type ?? event.ref_type ?? "content")}.`
    };
  }
  if (event.type === "comment_received") {
    const body = payload.body ? `: "${String(payload.body)}"` : ".";
    return {
      title: "New Comment",
      body: `${actor} commented on your ${String(payload.target_type ?? event.ref_type ?? "content")}${body}`
    };
  }
  if (event.type === "training_done") {
    return {
      title: "Training Completed",
      body: `Your training run ${payload.run_name ? `"${String(payload.run_name)}"` : String(event.ref_id ?? "")} finished successfully.`
    };
  }
  if (event.type === "training_failed") {
    const detail = payload.error ? humanizeWorkerError(payload.error) : null;
    return {
      title: "Training Failed",
      body: `Your training run ${payload.run_name ? `"${String(payload.run_name)}"` : String(event.ref_id ?? "")} failed${
        detail ? `: ${detail}` : "."
      }`
    };
  }
  if (event.type === "new_follower") {
    return { title: "New Follower", body: `${actor} is now following you.` };
  }
  if (event.type === "dm_received") {
    const preview = payload.body_preview ? `: "${String(payload.body_preview)}"` : ".";
    return { title: "New Direct Message", body: `${actor} sent you a message${preview}` };
  }
  return { title: "Notification", body: "You have a new notification." };
}

async function loadNotificationMailSettings(): Promise<NotificationMailSettings> {
  const rows = await query<{ key: string; value: any }>(
    `SELECT DISTINCT ON (key) key, value
     FROM core.settings
     WHERE scope='global'
       AND key IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ORDER BY key, updated_at DESC, created_at DESC`,
    [
      "smtp_host",
      "smtp_port",
      "smtp_user",
      "smtp_pass",
      "smtp_ssl",
      "smtp_tls",
      "smtp_from",
      "smtp_base_url",
      "instance_label",
      "instance_url"
    ]
  );
  const map: Record<string, any> = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const smtpPassValue = map.smtp_pass as any;
  const smtpPass =
    smtpPassValue && typeof smtpPassValue === "object" && smtpPassValue.encrypted && smtpPassValue.value
      ? decryptWithKey(config.installKey, smtpPassValue.value)
      : String(smtpPassValue ?? "");
  return {
    smtp_host: String(map.smtp_host ?? ""),
    smtp_port: Number(map.smtp_port ?? 0),
    smtp_user: String(map.smtp_user ?? ""),
    smtp_pass: smtpPass,
    smtp_ssl: Boolean(map.smtp_ssl ?? false),
    smtp_tls: Boolean(map.smtp_tls ?? false),
    smtp_from: String(map.smtp_from ?? ""),
    smtp_base_url: String(map.smtp_base_url ?? ""),
    instance_label: String(map.instance_label ?? ""),
    instance_url: String(map.instance_url ?? "")
  };
}

async function sendNotificationEmail(
  settings: NotificationMailSettings,
  to: string,
  subject: string,
  text: string
) {
  if (!settings.smtp_host || !settings.smtp_port || !settings.smtp_from) return;
  const transporter = nodemailer.createTransport({
    host: settings.smtp_host,
    port: Number(settings.smtp_port),
    secure: Boolean(settings.smtp_ssl ?? false),
    requireTLS: Boolean(settings.smtp_tls ?? false),
    auth: settings.smtp_user ? { user: settings.smtp_user, pass: settings.smtp_pass } : undefined
  });
  await transporter.sendMail({
    from: settings.smtp_from,
    to,
    subject,
    text,
    html: renderMailShell({
      title: subject,
      bodyHtml: `<div style="font-size:14px;line-height:1.6;">${escapeHtml(text).replace(/\n/g, "<br/>")}</div>`,
      instanceLabel: settings.instance_label,
      instanceUrl: settings.instance_url
    })
  });
}

async function shouldSendNotificationEmail(client: any, userId: string, type: string) {
  const key = mapNotificationSettingKey(type);
  if (!key) return false;
  const [row] = (
    await client.query("SELECT value FROM core.settings WHERE scope = 'user' AND scope_id = $1 AND key = $2 LIMIT 1", [
      userId,
      key
    ])
  ).rows;
  if (!row) return true;
  if (typeof row.value === "string") return row.value.toLowerCase() === "true";
  return Boolean(row.value);
}

async function processNotificationEvent(event: any, mailSettings: NotificationMailSettings) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const [locked] = (
      await client.query("SELECT id, status, attempts FROM core.notification_events WHERE id = $1 FOR UPDATE", [event.id])
    ).rows;
    if (!locked || locked.status !== "processing") {
      await client.query("ROLLBACK");
      return;
    }
    const [actor] = event.actor_user_id
      ? (await client.query("SELECT username FROM core.users WHERE id = $1", [event.actor_user_id])).rows
      : [];
    const content = mapNotificationContent(event, actor?.username);
    await client.query(
      `INSERT INTO core.notifications
        (id, user_id, type, actor_user_id, title, body, ref_type, ref_id, payload, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
      [
        randomUUID(),
        event.user_id,
        event.type,
        event.actor_user_id ?? null,
        content.title,
        content.body,
        event.ref_type ?? null,
        event.ref_id ?? null,
        event.payload ?? {}
      ]
    );
    const sendEmail = await shouldSendNotificationEmail(client, event.user_id, event.type);
    if (sendEmail) {
      const [user] = (await client.query("SELECT email FROM core.users WHERE id = $1", [event.user_id])).rows;
      if (user?.email) {
        await sendNotificationEmail(mailSettings, user.email, `FrameWorkX: ${content.title}`, content.body);
      }
    }
    await client.query(
      "UPDATE core.notification_events SET status = 'done', error_message = NULL, processed_at = NOW(), updated_at = NOW() WHERE id = $1",
      [event.id]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    const message = (err as Error).message ?? "notification_error";
    await execute(
      `UPDATE core.notification_events
       SET status = CASE WHEN attempts >= 5 THEN 'failed' ELSE 'pending' END,
           error_message = $1,
           updated_at = NOW(),
           available_at = CASE WHEN attempts >= 5 THEN available_at ELSE NOW() + INTERVAL '30 seconds' END
       WHERE id = $2`,
      [message, event.id]
    );
  } finally {
    client.release();
  }
}

async function tickNotification() {
  await execute(
    "UPDATE core.notification_events SET status = 'pending', updated_at = NOW() WHERE status = 'processing' AND updated_at < NOW() - INTERVAL '3 minutes'"
  );
  const mailSettings = await loadNotificationMailSettings();
  const client = await pool.connect();
  let events: any[] = [];
  try {
    await client.query("BEGIN");
    events = (
      await client.query(
        `SELECT *
         FROM core.notification_events
         WHERE status = 'pending' AND available_at <= NOW()
         ORDER BY created_at ASC
         LIMIT 30
         FOR UPDATE SKIP LOCKED`
      )
    ).rows;
    if (events.length) {
      await client.query(
        "UPDATE core.notification_events SET status = 'processing', attempts = attempts + 1, updated_at = NOW() WHERE id = ANY($1::uuid[])",
        [events.map((row) => row.id)]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  if (!events.length) {
    await heartbeat(undefined, "idle", "idle");
    return;
  }
  for (const event of events) {
    await processNotificationEvent(event, mailSettings);
  }
  await heartbeat(undefined, `notifications:${events.length}`, "ok");
}

async function loop() {
  while (true) {
    try {
      if (role === "intake") {
        await tickIntake();
      } else if (role === "prep") {
        await tickPrep();
      } else if (role === "generation") {
        await tickGeneration();
      } else if (role === "training") {
        await tickTraining();
      } else if (role === "credit") {
        await tickCredit();
      } else if (role === "stats") {
        await tickStats();
      } else if (role === "notification") {
        await tickNotification();
      } else {
        await tickHealth();
      }
    } catch {
      await heartbeat(undefined, "loop_error", "error");
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
}

loop();
