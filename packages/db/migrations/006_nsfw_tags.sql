CREATE TABLE IF NOT EXISTS gallery.nsfw_tags (
  tag TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO gallery.nsfw_tags (tag)
VALUES
  ('nsfw'),
  ('explicit'),
  ('nude'),
  ('naked'),
  ('nipples'),
  ('nipple'),
  ('areola'),
  ('penis'),
  ('vagina'),
  ('pussy'),
  ('boobs'),
  ('breasts'),
  ('sex'),
  ('cum'),
  ('genitals')
ON CONFLICT DO NOTHING;
