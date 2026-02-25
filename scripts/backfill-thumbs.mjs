#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const dbUrl = process.env.FRAMEWORKX_DATABASE_URL;
if (!dbUrl) {
  console.error('FRAMEWORKX_DATABASE_URL missing');
  process.exit(1);
}

const size = Math.max(96, Math.min(1024, Number(process.env.THUMB_SIZE ?? 384) || 384));
const python = process.env.FRAMEWORKX_PYTHON || 'python3';
const storageRoot = path.resolve(process.env.FRAMEWORKX_STORAGE_ROOT || './storage');
const thumbRoot = path.join(storageRoot, '.thumbs');
const thumbScript = path.join(process.cwd(), 'apps', 'engine', 'thumb.py');

const client = new pg.Client({ connectionString: dbUrl });

function runThumb(inputPath, outputPath) {
  return new Promise((resolve) => {
    const proc = spawn(python, [thumbScript, '--input', inputPath, '--output', outputPath, '--size', String(size), '--quality', '82'], {
      stdio: ['ignore', 'ignore', 'pipe']
    });
    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += String(chunk ?? '');
    });
    proc.on('close', (code) => {
      resolve({ ok: code === 0, stderr: stderr.trim() });
    });
    proc.on('error', (err) => {
      resolve({ ok: false, stderr: String(err?.message ?? err) });
    });
  });
}

function isImagePath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'].includes(ext);
}

async function main() {
  await fs.mkdir(thumbRoot, { recursive: true });
  await client.connect();
  const { rows } = await client.query(
    `SELECT DISTINCT fr.id, fr.path
     FROM files.file_registry fr
     WHERE fr.id IN (
       SELECT file_id FROM gallery.images
       UNION
       SELECT file_id FROM gallery.lora_previews
       UNION
       SELECT avatar_file_id FROM core.profiles WHERE avatar_file_id IS NOT NULL
     )`
  );

  let done = 0;
  let skipped = 0;
  let failed = 0;
  for (const row of rows) {
    const fileId = String(row.id || '').trim();
    const filePath = String(row.path || '').trim();
    if (!fileId || !filePath || !isImagePath(filePath)) {
      skipped += 1;
      continue;
    }
    const outputPath = path.join(thumbRoot, `${fileId}_${size}.webp`);
    try {
      await fs.access(outputPath);
      skipped += 1;
      continue;
    } catch {
      // create
    }
    const result = await runThumb(filePath, outputPath);
    if (result.ok) {
      done += 1;
    } else {
      failed += 1;
      console.error(`thumb failed ${fileId}: ${result.stderr}`);
    }
  }

  await client.end();
  console.log(JSON.stringify({ size, total: rows.length, done, skipped, failed }, null, 2));
}

main().catch(async (err) => {
  console.error(err);
  try {
    await client.end();
  } catch {
    // ignore
  }
  process.exit(1);
});
