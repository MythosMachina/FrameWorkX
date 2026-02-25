CREATE TABLE IF NOT EXISTS gallery.lora_delete_queue (
  id UUID PRIMARY KEY,
  lora_id UUID NOT NULL UNIQUE REFERENCES gallery.loras(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  error_message TEXT,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lora_delete_queue_status_available
  ON gallery.lora_delete_queue (status, available_at, created_at);
