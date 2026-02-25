CREATE TABLE IF NOT EXISTS social.follows (
  follower_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  followed_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_user_id, followed_user_id),
  CHECK (follower_user_id <> followed_user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_follows_followed
  ON social.follows (followed_user_id, created_at);

CREATE TABLE IF NOT EXISTS core.user_stats (
  user_id UUID PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
  models INT NOT NULL DEFAULT 0,
  images INT NOT NULL DEFAULT 0,
  likes_models INT NOT NULL DEFAULT 0,
  likes_images INT NOT NULL DEFAULT 0,
  followers INT NOT NULL DEFAULT 0,
  generations_with_my_assets INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
