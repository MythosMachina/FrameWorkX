CREATE TABLE IF NOT EXISTS gallery.sfw_tags (
  tag TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO gallery.sfw_tags (tag)
VALUES ('safe'), ('sfw'), ('rating:safe')
ON CONFLICT DO NOTHING;
