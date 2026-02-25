CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS files;
CREATE SCHEMA IF NOT EXISTS pipeline;
CREATE SCHEMA IF NOT EXISTS generation;
CREATE SCHEMA IF NOT EXISTS training;
CREATE SCHEMA IF NOT EXISTS gallery;
CREATE SCHEMA IF NOT EXISTS social;
CREATE SCHEMA IF NOT EXISTS ui;

CREATE TABLE IF NOT EXISTS core.roles (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.permissions (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.role_permissions (
  role_id UUID NOT NULL REFERENCES core.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES core.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS core.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id UUID REFERENCES core.roles(id),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS files.file_registry (
  id UUID PRIMARY KEY,
  owner_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  checksum TEXT,
  size_bytes BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.profiles (
  user_id UUID PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_file_id UUID REFERENCES files.file_registry(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.api_keys (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  token_prefix TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS core.password_resets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.settings (
  id UUID PRIMARY KEY,
  scope TEXT NOT NULL,
  scope_id UUID,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scope, scope_id, key)
);

CREATE TABLE IF NOT EXISTS core.credits (
  user_id UUID PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0,
  daily_allowance INT NOT NULL DEFAULT 0,
  last_daily_grant_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.credit_ledger (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  reason TEXT NOT NULL,
  ref_type TEXT,
  ref_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.model_registry (
  id UUID PRIMARY KEY,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  version TEXT,
  source TEXT NOT NULL,
  file_id UUID REFERENCES files.file_registry(id),
  checksum TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.audit_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS files.lineage (
  id UUID PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES files.file_registry(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  source_run_id UUID,
  source_step TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline.runs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  last_step TEXT,
  flags JSONB,
  upload_file_id UUID REFERENCES files.file_registry(id),
  dataset_file_id UUID REFERENCES files.file_registry(id),
  lora_file_id UUID REFERENCES files.file_registry(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline.run_steps (
  run_id UUID NOT NULL REFERENCES pipeline.runs(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  status TEXT NOT NULL,
  meta JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (run_id, step)
);

CREATE TABLE IF NOT EXISTS pipeline.queue (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL UNIQUE REFERENCES pipeline.runs(id) ON DELETE CASCADE,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline.events (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES pipeline.runs(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline.workers (
  role TEXT PRIMARY KEY,
  pid INT,
  state TEXT,
  run_id UUID,
  message TEXT,
  heartbeat_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pipeline.run_files (
  run_id UUID NOT NULL REFERENCES pipeline.runs(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  file_id UUID NOT NULL REFERENCES files.file_registry(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (run_id, step, file_id)
);

CREATE TABLE IF NOT EXISTS training.datasets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  pipeline_run_id UUID REFERENCES pipeline.runs(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  root_file_id UUID REFERENCES files.file_registry(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training.dataset_items (
  dataset_id UUID NOT NULL REFERENCES training.datasets(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files.file_registry(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (dataset_id, file_id)
);

CREATE TABLE IF NOT EXISTS training.runs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  pipeline_run_id UUID REFERENCES pipeline.runs(id) ON DELETE SET NULL,
  dataset_id UUID REFERENCES training.datasets(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  base_model_file_id UUID REFERENCES files.file_registry(id) ON DELETE SET NULL,
  dataset_file_id UUID REFERENCES files.file_registry(id) ON DELETE SET NULL,
  output_file_id UUID REFERENCES files.file_registry(id) ON DELETE SET NULL,
  credits_reserved INT,
  credits_charged_at TIMESTAMPTZ,
  credits_released_at TIMESTAMPTZ,
  settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training.artifacts (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES training.runs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  file_id UUID NOT NULL REFERENCES files.file_registry(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training.metrics (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES training.runs(id) ON DELETE CASCADE,
  epoch INT,
  step INT,
  loss NUMERIC,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery.models (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  muid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  training_run_id UUID REFERENCES training.runs(id) ON DELETE SET NULL,
  model_file_id UUID REFERENCES files.file_registry(id) ON DELETE SET NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generation.jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  pipeline_run_id UUID REFERENCES pipeline.runs(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  sampler TEXT,
  scheduler TEXT,
  steps INT,
  cfg_scale NUMERIC,
  width INT,
  height INT,
  seed BIGINT,
  batch_count INT NOT NULL DEFAULT 1,
  model_id UUID REFERENCES gallery.models(id) ON DELETE SET NULL,
  model_file_id UUID REFERENCES files.file_registry(id) ON DELETE SET NULL,
  lora_file_ids UUID[],
  credits_reserved INT,
  credits_charged_at TIMESTAMPTZ,
  credits_released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generation.outputs (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES generation.jobs(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files.file_registry(id) ON DELETE CASCADE,
  prompt TEXT,
  negative_prompt TEXT,
  sampler TEXT,
  scheduler TEXT,
  steps INT,
  cfg_scale NUMERIC,
  seed BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generation.previews (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES generation.jobs(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files.file_registry(id) ON DELETE CASCADE,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generation.queue (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL UNIQUE REFERENCES generation.jobs(id) ON DELETE CASCADE,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training.datasets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  pipeline_run_id UUID REFERENCES pipeline.runs(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  root_file_id UUID REFERENCES files.file_registry(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training.dataset_items (
  dataset_id UUID NOT NULL REFERENCES training.datasets(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files.file_registry(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (dataset_id, file_id)
);

CREATE TABLE IF NOT EXISTS training.runs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  pipeline_run_id UUID REFERENCES pipeline.runs(id) ON DELETE SET NULL,
  dataset_id UUID REFERENCES training.datasets(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  base_model_file_id UUID REFERENCES files.file_registry(id) ON DELETE SET NULL,
  dataset_file_id UUID REFERENCES files.file_registry(id) ON DELETE SET NULL,
  output_file_id UUID REFERENCES files.file_registry(id) ON DELETE SET NULL,
  credits_reserved INT,
  credits_charged_at TIMESTAMPTZ,
  credits_released_at TIMESTAMPTZ,
  settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training.artifacts (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES training.runs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  file_id UUID NOT NULL REFERENCES files.file_registry(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training.metrics (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES training.runs(id) ON DELETE CASCADE,
  epoch INT,
  step INT,
  loss NUMERIC,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery.models (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  muid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  training_run_id UUID REFERENCES training.runs(id) ON DELETE SET NULL,
  model_file_id UUID REFERENCES files.file_registry(id) ON DELETE SET NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery.modelcards (
  id UUID PRIMARY KEY,
  model_id UUID NOT NULL REFERENCES gallery.models(id) ON DELETE CASCADE,
  title TEXT,
  summary TEXT,
  tags TEXT[],
  download_url TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery.images (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files.file_registry(id) ON DELETE CASCADE,
  model_id UUID REFERENCES gallery.models(id) ON DELETE SET NULL,
  generation_job_id UUID REFERENCES generation.jobs(id) ON DELETE SET NULL,
  generation_output_id UUID REFERENCES generation.outputs(id) ON DELETE SET NULL,
  prompt TEXT,
  negative_prompt TEXT,
  sampler TEXT,
  scheduler TEXT,
  steps INT,
  cfg_scale NUMERIC,
  seed BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery.tags (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery.image_tags (
  image_id UUID NOT NULL REFERENCES gallery.images(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES gallery.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (image_id, tag_id)
);

CREATE TABLE IF NOT EXISTS gallery.collections (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery.collection_items (
  collection_id UUID NOT NULL REFERENCES gallery.collections(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES gallery.images(id) ON DELETE CASCADE,
  position INT,
  PRIMARY KEY (collection_id, image_id)
);

CREATE TABLE IF NOT EXISTS social.comments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social.likes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS ui.pipeline_run_status (
  run_id UUID PRIMARY KEY,
  user_id UUID,
  status TEXT,
  last_step TEXT,
  total_steps INT,
  completed_steps INT,
  progress_pct NUMERIC,
  current_stage TEXT,
  eta_seconds INT,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS ui.training_run_status (
  training_run_id UUID PRIMARY KEY,
  user_id UUID,
  status TEXT,
  epoch INT,
  epoch_total INT,
  step INT,
  step_total INT,
  progress_pct NUMERIC,
  eta_seconds INT,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_loss NUMERIC,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS ui.generation_job_status (
  job_id UUID PRIMARY KEY,
  user_id UUID,
  status TEXT,
  batch_count INT,
  outputs_ready INT,
  previews_ready INT,
  progress_pct NUMERIC,
  eta_seconds INT,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS ui.queue_overview (
  item_type TEXT NOT NULL,
  item_id UUID PRIMARY KEY,
  user_id UUID,
  status TEXT,
  priority_rank INT,
  position INT,
  progress_pct NUMERIC,
  eta_seconds INT,
  label TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ui.user_activity (
  user_id UUID PRIMARY KEY,
  credits_balance INT,
  credits_daily_allowance INT,
  active_runs INT,
  active_training INT,
  active_generation INT,
  recent_run_id UUID,
  recent_job_id UUID,
  last_activity_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ui.model_card_status (
  model_id UUID PRIMARY KEY,
  user_id UUID,
  title TEXT,
  status TEXT,
  training_run_id UUID,
  last_training_status TEXT,
  preview_count INT,
  image_count INT,
  like_count INT,
  comment_count INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
