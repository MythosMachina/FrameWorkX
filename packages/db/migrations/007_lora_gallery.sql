CREATE TABLE IF NOT EXISTS gallery.loras (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_id UUID NOT NULL REFERENCES files.file_registry(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_loras_public_created
  ON gallery.loras (is_public, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_loras_user_created
  ON gallery.loras (user_id, created_at DESC);
