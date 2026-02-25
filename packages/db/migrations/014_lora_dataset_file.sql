ALTER TABLE gallery.loras
  ADD COLUMN IF NOT EXISTS dataset_file_id UUID REFERENCES files.file_registry(id) ON DELETE SET NULL;
