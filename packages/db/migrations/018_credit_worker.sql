CREATE TABLE IF NOT EXISTS core.credit_intents (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  amount INT NOT NULL DEFAULT 0,
  ref_type TEXT,
  ref_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_intents_pending
  ON core.credit_intents (status, available_at, created_at);
