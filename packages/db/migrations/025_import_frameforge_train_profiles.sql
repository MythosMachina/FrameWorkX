-- Import FrameForge training profiles into FrameWorkX (prepared migration, not auto-applied).
-- Source analyzed from: /ai/FrameForge/_system/db/db.sqlite (table: TrainProfile).

INSERT INTO training.profiles (id, name, label, category, tier, settings, is_default)
VALUES
  (
    'b2fb8a2e-6dc9-4f30-b9c5-8f0cbb9bcd4d',
    'balanced',
    'balanced (576p, batch 2x2, rank 24)',
    'default',
    'mid',
    $$
    {
      "trainer_resolution": 576,
      "trainer_batch_size": 2,
      "trainer_grad_accum": 2,
      "trainer_lora_rank": 24,
      "trainer_lora_alpha": 24,
      "trainer_gradient_checkpointing": true,
      "trainer_max_train_steps": 900,
      "trainer_dataloader_workers": 4,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 640,
      "trainer_bucket_step": 64,
      "trainer_dataset_repeats": 1
    }
    $$::jsonb,
    true
  ),
  (
    '4a3c1f4a-8e62-4b2c-94b2-3b1b0a9656f4',
    'fast',
    'fast (512p, batch 2x2, rank 16)',
    'default',
    'fast',
    $$
    {
      "trainer_resolution": 512,
      "trainer_batch_size": 2,
      "trainer_grad_accum": 2,
      "trainer_lora_rank": 16,
      "trainer_lora_alpha": 16,
      "trainer_gradient_checkpointing": true,
      "trainer_max_train_steps": 900,
      "trainer_dataloader_workers": 4,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 576,
      "trainer_bucket_step": 64,
      "trainer_dataset_repeats": 1
    }
    $$::jsonb,
    false
  ),
  (
    'e2985ccb-6424-4f4f-b2e4-e875bf98d2a2',
    'anime_low',
    'Anime - Low',
    'anime',
    'low',
    $$
    {
      "trainer_resolution": 512,
      "trainer_batch_size": 2,
      "trainer_grad_accum": 2,
      "trainer_lora_rank": 16,
      "trainer_lora_alpha": 16,
      "trainer_learning_rate": 0.0001,
      "trainer_te_learning_rate": 0.00005,
      "trainer_lr_scheduler": "cosine",
      "trainer_lr_warmup_steps": 180,
      "trainer_min_snr_gamma": 5.0,
      "trainer_max_train_steps": 700,
      "trainer_epochs": 10,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 576,
      "trainer_bucket_step": 64,
      "trainer_optimizer": "adamw",
      "trainer_use_8bit_adam": true,
      "trainer_gradient_checkpointing": true,
      "trainer_dataloader_workers": 4,
      "trainer_max_grad_norm": 0,
      "trainer_weight_decay": 0.01,
      "trainer_dataset_repeats": 1,
      "trainer_clip_skip": 2
    }
    $$::jsonb,
    false
  ),
  (
    'b2a01797-2bd4-4522-9702-6037f3698f14',
    'anime_med',
    'Anime - Med',
    'anime',
    'mid',
    $$
    {
      "trainer_resolution": 576,
      "trainer_batch_size": 2,
      "trainer_grad_accum": 2,
      "trainer_lora_rank": 24,
      "trainer_lora_alpha": 24,
      "trainer_learning_rate": 0.0001,
      "trainer_te_learning_rate": 0.00005,
      "trainer_lr_scheduler": "cosine",
      "trainer_lr_warmup_steps": 180,
      "trainer_min_snr_gamma": 5.0,
      "trainer_max_train_steps": 900,
      "trainer_epochs": 10,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 640,
      "trainer_bucket_step": 64,
      "trainer_optimizer": "adamw",
      "trainer_use_8bit_adam": true,
      "trainer_gradient_checkpointing": true,
      "trainer_dataloader_workers": 4,
      "trainer_max_grad_norm": 0,
      "trainer_weight_decay": 0.01,
      "trainer_dataset_repeats": 1,
      "trainer_clip_skip": 2
    }
    $$::jsonb,
    false
  ),
  (
    'df42a729-a8ed-4a1e-b5f7-766ece837183',
    'anime_high',
    'Anime - High',
    'anime',
    'high',
    $$
    {
      "trainer_resolution": 640,
      "trainer_batch_size": 1,
      "trainer_grad_accum": 4,
      "trainer_lora_rank": 32,
      "trainer_lora_alpha": 32,
      "trainer_learning_rate": 0.0001,
      "trainer_te_learning_rate": 0.00005,
      "trainer_lr_scheduler": "cosine",
      "trainer_lr_warmup_steps": 180,
      "trainer_min_snr_gamma": 5.0,
      "trainer_max_train_steps": 1200,
      "trainer_epochs": 12,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 704,
      "trainer_bucket_step": 64,
      "trainer_optimizer": "adamw",
      "trainer_use_8bit_adam": true,
      "trainer_gradient_checkpointing": true,
      "trainer_dataloader_workers": 4,
      "trainer_max_grad_norm": 0,
      "trainer_weight_decay": 0.01,
      "trainer_dataset_repeats": 1,
      "trainer_clip_skip": 2
    }
    $$::jsonb,
    false
  ),
  (
    '6a07af59-eb38-4fdd-9f2e-986c5f597c37',
    'real_low',
    'Real - Low',
    'real',
    'low',
    $$
    {
      "trainer_resolution": 512,
      "trainer_batch_size": 2,
      "trainer_grad_accum": 2,
      "trainer_lora_rank": 16,
      "trainer_lora_alpha": 16,
      "trainer_learning_rate": 0.0001,
      "trainer_te_learning_rate": 0.00005,
      "trainer_lr_scheduler": "cosine",
      "trainer_lr_warmup_steps": 180,
      "trainer_min_snr_gamma": 5.0,
      "trainer_max_train_steps": 700,
      "trainer_epochs": 10,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 576,
      "trainer_bucket_step": 64,
      "trainer_optimizer": "adamw",
      "trainer_use_8bit_adam": true,
      "trainer_gradient_checkpointing": true,
      "trainer_dataloader_workers": 4,
      "trainer_max_grad_norm": 0,
      "trainer_weight_decay": 0.01,
      "trainer_dataset_repeats": 1,
      "trainer_clip_skip": 2
    }
    $$::jsonb,
    false
  ),
  (
    '17cd553f-f6f4-4f7f-9b40-e5b84dca3f5f',
    'real_med',
    'Real - Med',
    'real',
    'mid',
    $$
    {
      "trainer_resolution": 576,
      "trainer_batch_size": 2,
      "trainer_grad_accum": 2,
      "trainer_lora_rank": 24,
      "trainer_lora_alpha": 24,
      "trainer_learning_rate": 0.0001,
      "trainer_te_learning_rate": 0.00005,
      "trainer_lr_scheduler": "cosine",
      "trainer_lr_warmup_steps": 180,
      "trainer_min_snr_gamma": 5.0,
      "trainer_max_train_steps": 900,
      "trainer_epochs": 10,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 640,
      "trainer_bucket_step": 64,
      "trainer_optimizer": "adamw",
      "trainer_use_8bit_adam": true,
      "trainer_gradient_checkpointing": true,
      "trainer_dataloader_workers": 4,
      "trainer_max_grad_norm": 0,
      "trainer_weight_decay": 0.01,
      "trainer_dataset_repeats": 1,
      "trainer_clip_skip": 2
    }
    $$::jsonb,
    false
  ),
  (
    '4fc6f709-bb5f-45ad-8409-8ce6794065bb',
    'real_high',
    'Real - High',
    'real',
    'high',
    $$
    {
      "trainer_resolution": 640,
      "trainer_batch_size": 1,
      "trainer_grad_accum": 4,
      "trainer_lora_rank": 32,
      "trainer_lora_alpha": 32,
      "trainer_learning_rate": 0.0001,
      "trainer_te_learning_rate": 0.00005,
      "trainer_lr_scheduler": "cosine",
      "trainer_lr_warmup_steps": 180,
      "trainer_min_snr_gamma": 5.0,
      "trainer_max_train_steps": 1200,
      "trainer_epochs": 12,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 704,
      "trainer_bucket_step": 64,
      "trainer_optimizer": "adamw",
      "trainer_use_8bit_adam": true,
      "trainer_gradient_checkpointing": true,
      "trainer_dataloader_workers": 4,
      "trainer_max_grad_norm": 0,
      "trainer_weight_decay": 0.01,
      "trainer_dataset_repeats": 1,
      "trainer_clip_skip": 2
    }
    $$::jsonb,
    false
  ),
  (
    'f6db013f-9b65-40e9-aea5-b6dd89431d57',
    'oneshot_fast',
    'Oneshot - Fast',
    'oneshot',
    'fast',
    $$
    {
      "trainer_resolution": 512,
      "trainer_batch_size": 4,
      "trainer_grad_accum": 1,
      "trainer_lora_rank": 16,
      "trainer_lora_alpha": 16,
      "trainer_gradient_checkpointing": true,
      "trainer_max_train_steps": 900,
      "trainer_dataloader_workers": 4,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 576,
      "trainer_bucket_step": 64,
      "trainer_dataset_repeats": 40
    }
    $$::jsonb,
    false
  ),
  (
    'e19e4c1c-6481-40d4-bf5d-f13ef4ef64a2',
    'oneshot_balanced',
    'Oneshot - Balanced',
    'oneshot',
    'mid',
    $$
    {
      "trainer_resolution": 576,
      "trainer_batch_size": 4,
      "trainer_grad_accum": 1,
      "trainer_lora_rank": 24,
      "trainer_lora_alpha": 24,
      "trainer_gradient_checkpointing": true,
      "trainer_max_train_steps": 900,
      "trainer_dataloader_workers": 4,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 640,
      "trainer_bucket_step": 64,
      "trainer_dataset_repeats": 40
    }
    $$::jsonb,
    false
  ),
  (
    'd38fc0ad-fad2-4292-bc8f-d89afef30781',
    'quickshot_low',
    'Quickshot - Low',
    'quickshot',
    'low',
    $$
    {
      "trainer_resolution": 512,
      "trainer_batch_size": 4,
      "trainer_grad_accum": 1,
      "trainer_lora_rank": 16,
      "trainer_lora_alpha": 16,
      "trainer_learning_rate": 0.0001,
      "trainer_te_learning_rate": 0.00005,
      "trainer_lr_scheduler": "cosine",
      "trainer_lr_warmup_steps": 180,
      "trainer_min_snr_gamma": 5.0,
      "trainer_max_train_steps": 400,
      "trainer_epochs": 6,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 576,
      "trainer_bucket_step": 64,
      "trainer_optimizer": "adamw",
      "trainer_use_8bit_adam": true,
      "trainer_gradient_checkpointing": true,
      "trainer_dataloader_workers": 4,
      "trainer_max_grad_norm": 0,
      "trainer_weight_decay": 0.01,
      "trainer_dataset_repeats": 40,
      "trainer_clip_skip": 2
    }
    $$::jsonb,
    false
  ),
  (
    'be9290e0-e5db-43ad-af17-27dc73f67b53',
    'quickshot_med',
    'Quickshot - Med',
    'quickshot',
    'mid',
    $$
    {
      "trainer_resolution": 576,
      "trainer_batch_size": 4,
      "trainer_grad_accum": 1,
      "trainer_lora_rank": 24,
      "trainer_lora_alpha": 24,
      "trainer_learning_rate": 0.0001,
      "trainer_te_learning_rate": 0.00005,
      "trainer_lr_scheduler": "cosine",
      "trainer_lr_warmup_steps": 180,
      "trainer_min_snr_gamma": 5.0,
      "trainer_max_train_steps": 600,
      "trainer_epochs": 6,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 640,
      "trainer_bucket_step": 64,
      "trainer_optimizer": "adamw",
      "trainer_use_8bit_adam": true,
      "trainer_gradient_checkpointing": true,
      "trainer_dataloader_workers": 4,
      "trainer_max_grad_norm": 0,
      "trainer_weight_decay": 0.01,
      "trainer_dataset_repeats": 40,
      "trainer_clip_skip": 2
    }
    $$::jsonb,
    false
  ),
  (
    '43333cb8-e4cb-4608-99cb-412977f4d918',
    'quickshot_high',
    'Quickshot - High',
    'quickshot',
    'high',
    $$
    {
      "trainer_resolution": 640,
      "trainer_batch_size": 3,
      "trainer_grad_accum": 1,
      "trainer_lora_rank": 32,
      "trainer_lora_alpha": 32,
      "trainer_learning_rate": 0.0001,
      "trainer_te_learning_rate": 0.00005,
      "trainer_lr_scheduler": "cosine",
      "trainer_lr_warmup_steps": 180,
      "trainer_min_snr_gamma": 5.0,
      "trainer_max_train_steps": 800,
      "trainer_epochs": 8,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 704,
      "trainer_bucket_step": 64,
      "trainer_optimizer": "adamw",
      "trainer_use_8bit_adam": true,
      "trainer_gradient_checkpointing": true,
      "trainer_dataloader_workers": 4,
      "trainer_max_grad_norm": 0,
      "trainer_weight_decay": 0.01,
      "trainer_dataset_repeats": 40,
      "trainer_clip_skip": 2
    }
    $$::jsonb,
    false
  ),
  (
    'd80a47ad-f039-437b-b43b-ca8a8fd49b42',
    'fast_5090',
    'fast 5090',
    'gpu',
    '5090-fast',
    $$
    {
      "trainer_resolution": 576,
      "trainer_batch_size": 4,
      "trainer_grad_accum": 1,
      "trainer_lora_rank": 16,
      "trainer_lora_alpha": 16,
      "trainer_clip_skip": 2,
      "trainer_learning_rate": 0.0001,
      "trainer_te_learning_rate": 0.00005,
      "trainer_lr_scheduler": "cosine",
      "trainer_lr_warmup_steps": 180,
      "trainer_min_snr_gamma": 5.0,
      "trainer_max_train_steps": 900,
      "trainer_epochs": 10,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 640,
      "trainer_bucket_step": 64,
      "trainer_optimizer": "adamw",
      "trainer_use_8bit_adam": true,
      "trainer_gradient_checkpointing": false,
      "trainer_dataloader_workers": 6,
      "trainer_max_grad_norm": 0,
      "trainer_weight_decay": 0.01,
      "trainer_dataset_repeats": 1
    }
    $$::jsonb,
    false
  ),
  (
    '05c8bb2b-6a1d-4d16-a613-240e5f76336e',
    'balanced_5090',
    'balanced 5090',
    'gpu',
    '5090-balanced',
    $$
    {
      "trainer_resolution": 640,
      "trainer_batch_size": 3,
      "trainer_grad_accum": 1,
      "trainer_lora_rank": 24,
      "trainer_lora_alpha": 24,
      "trainer_clip_skip": 2,
      "trainer_learning_rate": 0.0001,
      "trainer_te_learning_rate": 0.00005,
      "trainer_lr_scheduler": "cosine",
      "trainer_lr_warmup_steps": 180,
      "trainer_min_snr_gamma": 5.0,
      "trainer_max_train_steps": 900,
      "trainer_epochs": 10,
      "trainer_bucket_min_reso": 64,
      "trainer_bucket_max_reso": 704,
      "trainer_bucket_step": 64,
      "trainer_optimizer": "adamw",
      "trainer_use_8bit_adam": true,
      "trainer_gradient_checkpointing": false,
      "trainer_dataloader_workers": 6,
      "trainer_max_grad_norm": 0,
      "trainer_weight_decay": 0.01,
      "trainer_dataset_repeats": 1
    }
    $$::jsonb,
    false
  )
ON CONFLICT (name)
DO UPDATE SET
  label = EXCLUDED.label,
  category = EXCLUDED.category,
  tier = EXCLUDED.tier,
  settings = EXCLUDED.settings,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();
