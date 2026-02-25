CREATE TABLE IF NOT EXISTS training.run_steps (
  run_id UUID NOT NULL REFERENCES training.runs(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (run_id, step)
);
