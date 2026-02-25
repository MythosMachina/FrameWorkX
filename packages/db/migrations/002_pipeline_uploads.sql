CREATE TABLE IF NOT EXISTS pipeline.staged_uploads (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  size_bytes INT NOT NULL,
  path TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training.profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  label TEXT,
  category TEXT,
  tier TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline.autochar_presets (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  patterns TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO training.profiles (id, name, label, category, tier, settings, is_default)
VALUES
  ('b2fb8a2e-6dc9-4f30-b9c5-8f0cbb9bcd4d', 'balanced', 'Balanced', 'default', 'mid', '{}'::jsonb, true),
  ('4a3c1f4a-8e62-4b2c-94b2-3b1b0a9656f4', 'fast', 'Fast', 'default', 'fast', '{}'::jsonb, false)
ON CONFLICT (name) DO NOTHING;

INSERT INTO pipeline.autochar_presets (id, name, description, patterns)
VALUES
  ('7c2cdb6e-2a46-43d7-94c8-46b7e2d39ac3', 'human', 'Human-focused cleanup', ARRAY[]::text[]),
  ('9acb89b3-8e64-4b61-9dc3-85fdc7e819a6', 'furry', 'Furry cleanup', ARRAY[]::text[]),
  ('3f0f0b86-1e6f-4f5e-9a2f-19af8b042f0f', 'dragon', 'Dragon cleanup', ARRAY[]::text[]),
  ('a7b42b68-5697-4dc0-8a2c-e5b5f0a7f5f8', 'daemon', 'Daemon cleanup', ARRAY[]::text[]),
  ('2d0cb5d0-4df5-4c53-8a6d-b1462bde2b8c', 'default', 'Default cleanup', ARRAY[]::text[])
ON CONFLICT (name) DO NOTHING;
