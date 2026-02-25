CREATE TABLE IF NOT EXISTS gallery.lora_previews (
  id UUID PRIMARY KEY,
  lora_id UUID NOT NULL REFERENCES gallery.loras(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files.file_registry(id) ON DELETE CASCADE,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery.lora_preview_jobs (
  job_id UUID PRIMARY KEY REFERENCES generation.jobs(id) ON DELETE CASCADE,
  lora_id UUID NOT NULL REFERENCES gallery.loras(id) ON DELETE CASCADE,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lora_previews_lora_pos
  ON gallery.lora_previews (lora_id, position);

CREATE INDEX IF NOT EXISTS idx_lora_preview_jobs_lora
  ON gallery.lora_preview_jobs (lora_id);
