CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE core.credits
  ADD COLUMN IF NOT EXISTS credits_reserved INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS core.user_permissions (
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES core.permissions(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, permission_id)
);

INSERT INTO core.permissions (id, key, description)
VALUES
  (gen_random_uuid(), 'generate.create', 'Allow user to create generation jobs'),
  (gen_random_uuid(), 'train.run', 'Allow user to run training jobs')
ON CONFLICT (key) DO NOTHING;
