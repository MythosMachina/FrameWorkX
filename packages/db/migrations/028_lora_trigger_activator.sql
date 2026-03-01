ALTER TABLE gallery.loras
  ADD COLUMN IF NOT EXISTS trigger_token TEXT,
  ADD COLUMN IF NOT EXISTS activator_token TEXT;
