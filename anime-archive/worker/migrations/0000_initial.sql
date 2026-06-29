-- Migration: 0000_initial
-- Create all tables for Anime Archive

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE anime_series (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_jp TEXT,
  description TEXT,
  cover_image TEXT,
  genre TEXT,
  episode_count INTEGER,
  studio TEXT,
  release_date INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_jp TEXT,
  anime_id TEXT REFERENCES anime_series(id) ON DELETE SET NULL,
  character_type TEXT NOT NULL DEFAULT 'OTHER',
  gender TEXT NOT NULL DEFAULT 'UNKNOWN',
  age INTEGER,
  birthday INTEGER,
  height TEXT,
  blood_type TEXT NOT NULL DEFAULT 'UNKNOWN',
  personality TEXT,
  background TEXT,
  abilities TEXT,
  voice_actor TEXT,
  voice_actor_jp TEXT,
  main_image_index INTEGER NOT NULL DEFAULT 0,
  created_by_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE character_images (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_character_images_cid ON character_images(character_id);

CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#1890ff',
  created_at INTEGER NOT NULL
);

CREATE TABLE character_tags (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX uq_character_tag ON character_tags(character_id, tag_id);

CREATE TABLE character_relationships (
  id TEXT PRIMARY KEY,
  from_character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  to_character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  description TEXT
);
CREATE UNIQUE INDEX uq_character_relationship ON character_relationships(from_character_id, to_character_id, relationship_type);

CREATE TABLE favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  collection TEXT NOT NULL DEFAULT 'default',
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX uq_favorite ON favorites(user_id, character_id);
CREATE INDEX idx_favorite_user ON favorites(user_id);
CREATE INDEX idx_favorite_character ON favorites(character_id);

CREATE TABLE ratings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX uq_rating ON ratings(user_id, character_id);
CREATE INDEX idx_rating_character ON ratings(character_id);

CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_comment_character ON comments(character_id);
CREATE INDEX idx_comment_parent ON comments(parent_id);

CREATE TABLE character_histories (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_char_history_cid ON character_histories(character_id);
