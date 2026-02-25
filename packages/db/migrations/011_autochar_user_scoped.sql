ALTER TABLE pipeline.autochar_presets
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES core.users(id) ON DELETE CASCADE;

UPDATE pipeline.autochar_presets
SET user_id = COALESCE(
  (SELECT u.id
   FROM core.users u
   JOIN core.roles r ON r.id = u.role_id
   WHERE r.name = 'admin'
   ORDER BY u.created_at
   LIMIT 1),
  (SELECT id FROM core.users ORDER BY created_at LIMIT 1)
)
WHERE user_id IS NULL;

ALTER TABLE pipeline.autochar_presets
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE pipeline.autochar_presets
  DROP CONSTRAINT IF EXISTS autochar_presets_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS autochar_presets_user_name_idx
  ON pipeline.autochar_presets(user_id, name);
