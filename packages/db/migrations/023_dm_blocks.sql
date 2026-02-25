ALTER TABLE social.dm_thread_participants
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS social.user_blocks (
  blocker_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_user_id, blocked_user_id),
  CHECK (blocker_user_id <> blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked
  ON social.user_blocks (blocked_user_id, created_at DESC);
