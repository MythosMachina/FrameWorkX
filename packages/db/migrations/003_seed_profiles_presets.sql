INSERT INTO training.profiles (id, name, label, category, tier, settings, is_default)
VALUES
  ('d1c4a3f4-4d6f-4f0c-8a74-95b6c35f0b44', 'quality', 'quality (640p, rank 32)', 'default', 'quality', '{
    "trainer_resolution": 640,
    "trainer_batch_size": 1,
    "trainer_grad_accum": 1,
    "trainer_lora_rank": 32,
    "trainer_lora_alpha": 32,
    "trainer_gradient_checkpointing": true,
    "trainer_max_train_steps": 1200,
    "trainer_dataloader_workers": 4,
    "trainer_bucket_min_reso": 64,
    "trainer_bucket_max_reso": 768,
    "trainer_bucket_step": 64
  }'::jsonb, false),
  ('7a1cbbd7-0c2b-4f2b-9b2b-1ddf77c1b7b8', 'draft', 'draft (512p, rank 8)', 'default', 'draft', '{
    "trainer_resolution": 512,
    "trainer_batch_size": 1,
    "trainer_grad_accum": 1,
    "trainer_lora_rank": 8,
    "trainer_lora_alpha": 8,
    "trainer_gradient_checkpointing": true,
    "trainer_max_train_steps": 400,
    "trainer_dataloader_workers": 2,
    "trainer_bucket_min_reso": 64,
    "trainer_bucket_max_reso": 512,
    "trainer_bucket_step": 64
  }'::jsonb, false)
ON CONFLICT (name) DO NOTHING;

INSERT INTO pipeline.autochar_presets (id, name, description, patterns)
VALUES
  ('9a0d81b4-ef2a-4fb8-9b5b-6d5fd1f8f7e1', 'general', 'general cleanup', ARRAY[]::text[])
ON CONFLICT (name) DO NOTHING;
