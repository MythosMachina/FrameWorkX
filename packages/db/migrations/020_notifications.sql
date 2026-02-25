CREATE TABLE IF NOT EXISTS core.notification_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_notification_events_pending
  ON core.notification_events (status, available_at, created_at);

CREATE TABLE IF NOT EXISTS core.notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  ref_type TEXT,
  ref_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON core.notifications (user_id, created_at DESC);
