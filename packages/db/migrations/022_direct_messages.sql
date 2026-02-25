CREATE TABLE IF NOT EXISTS social.dm_threads (
  id UUID PRIMARY KEY,
  thread_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS social.dm_thread_participants (
  thread_id UUID NOT NULL REFERENCES social.dm_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  last_read_message_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_thread_participants_user
  ON social.dm_thread_participants (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS social.dm_messages (
  id UUID PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES social.dm_threads(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_messages_thread_created
  ON social.dm_messages (thread_id, created_at DESC);
