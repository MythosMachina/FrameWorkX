CREATE TABLE IF NOT EXISTS core.applications (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  handle TEXT,
  links TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES core.users(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS applications_status_idx ON core.applications(status);
CREATE INDEX IF NOT EXISTS applications_created_idx ON core.applications(created_at DESC);
