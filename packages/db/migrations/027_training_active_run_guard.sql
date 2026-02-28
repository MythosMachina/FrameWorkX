DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'training'
      AND indexname = 'training_runs_one_active_per_dataset_idx'
  ) THEN
    IF EXISTS (
      SELECT dataset_id
      FROM training.runs
      WHERE dataset_id IS NOT NULL
        AND status IN ('credit_pending','queued','running','removing')
      GROUP BY dataset_id
      HAVING COUNT(*) > 1
    ) THEN
      RAISE NOTICE 'Skipping training_runs_one_active_per_dataset_idx due to existing duplicate active dataset runs';
    ELSE
      CREATE UNIQUE INDEX training_runs_one_active_per_dataset_idx
        ON training.runs (dataset_id)
        WHERE dataset_id IS NOT NULL
          AND status IN ('credit_pending','queued','running','removing');
    END IF;
  END IF;
END $$;
