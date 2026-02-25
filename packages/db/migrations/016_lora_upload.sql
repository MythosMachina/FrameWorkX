ALTER TABLE gallery.loras
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'training';

INSERT INTO core.permissions (id, key, description)
VALUES
  (gen_random_uuid(), 'lora.upload', 'Allow user to upload LoRA files')
ON CONFLICT (key) DO NOTHING;
