-- Migration 008: add the Admin Assistant role and moderation actions for
-- the Reports attendance change feed without resetting the database.
--
-- This migration does two things:
-- 1. Expands the users.role domain to allow 'Admin Assistant'.
-- 2. Adds an 'accepted' flag so feed items can be acknowledged persistently.

PRAGMA foreign_keys = OFF;

ALTER TABLE attendance_change_feed
  ADD COLUMN accepted INTEGER NOT NULL DEFAULT 0 CHECK (accepted IN (0, 1));

CREATE TABLE users_new (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  qualification TEXT NOT NULL DEFAULT 'NONE' CHECK (qualification IN ('NONE', 'PTT', 'ACT', 'PTT TO ACT')),
  role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('User', 'Admin Assistant', 'Admin')),
  image_url TEXT,
  special_instructions TEXT,
  last_login_at INTEGER,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 100000,
  password_algo TEXT NOT NULL DEFAULT 'pbkdf2-sha256'
);

INSERT INTO users_new (
  user_id,
  name,
  qualification,
  role,
  image_url,
  special_instructions,
  last_login_at,
  password_hash,
  password_salt,
  password_iterations,
  password_algo
)
SELECT
  user_id,
  name,
  qualification,
  role,
  image_url,
  special_instructions,
  last_login_at,
  password_hash,
  password_salt,
  password_iterations,
  password_algo
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name_nocase_unique
ON users(name COLLATE NOCASE);

PRAGMA foreign_keys = ON;