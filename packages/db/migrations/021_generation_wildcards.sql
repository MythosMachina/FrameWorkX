ALTER TABLE generation.jobs
  ADD COLUMN IF NOT EXISTS prompt_variants JSONB,
  ADD COLUMN IF NOT EXISTS wildcard_mode TEXT;
