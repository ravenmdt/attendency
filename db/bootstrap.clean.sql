-- Rebuild schema with a clean single-user seed for production-like resets.
--
-- Relevant terminal commands:
--   npm run db:reset:local:clean
--     Rebuilds the local D1 database from this clean file.
--
--   npm run db:reset:remote:clean
--     Applies the same clean reset to the remote Cloudflare D1 database.
--
-- Seeded credentials after this reset:
--   username: Sniff
--   password: test
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS auth_rate_limits;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS calendar_info;
DROP TABLE IF EXISTS admin_settings;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  qualification TEXT NOT NULL DEFAULT 'NONE' CHECK (qualification IN ('NONE', 'PTT', 'ACT', 'PTT TO ACT')),
  role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('User', 'Admin')),
  image_url TEXT,
  last_login_at INTEGER,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 100000,
  password_algo TEXT NOT NULL DEFAULT 'pbkdf2-sha256'
);

CREATE TABLE admin_settings (
  settings_id INTEGER PRIMARY KEY CHECK (settings_id = 1),
  default_password_hash TEXT NOT NULL,
  default_password_salt TEXT NOT NULL,
  default_password_iterations INTEGER NOT NULL DEFAULT 100000,
  default_password_algo TEXT NOT NULL DEFAULT 'pbkdf2-sha256',
  allow_user_role_admin_controls INTEGER NOT NULL DEFAULT 0 CHECK (allow_user_role_admin_controls IN (0, 1)),
  updated_at INTEGER,
  updated_by_user_id INTEGER,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE auth_rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL
);

CREATE TABLE calendar_info (
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  nights INTEGER NOT NULL CHECK (nights IN (0, 1)),
  priority INTEGER NOT NULL CHECK (priority IN (0, 1)),
  type TEXT NOT NULL,
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE availability (
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  wave INTEGER NOT NULL CHECK (wave IN (0, 1)),
  available INTEGER NOT NULL CHECK (available IN (0, 1)),
  PRIMARY KEY (user_id, date, wave),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE feedback (
  feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  text        TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  accepted    INTEGER NOT NULL DEFAULT 0 CHECK (accepted IN (0, 1)),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_feedback_created_at ON feedback(created_at);

-- Seed one clean admin account.
-- Plaintext password = test
INSERT INTO users (
  name,
  qualification,
  role,
  image_url,
  last_login_at,
  password_hash,
  password_salt,
  password_iterations,
  password_algo
)
VALUES (
  'Sniff',
  'ACT',
  'Admin',
  NULL,
  NULL,
  'ddab915ec3f5b5f682bea0e339e92bc5ae6ee1f98bbf17b0b8fbf1f835348785',
  '2383430387480621fce41cf90925717a',
  100000,
  'pbkdf2-sha256'
);

-- Keep the clean reset aligned so newly created users also default to password "test".
INSERT INTO admin_settings (
  settings_id,
  default_password_hash,
  default_password_salt,
  default_password_iterations,
  default_password_algo,
  allow_user_role_admin_controls,
  updated_at,
  updated_by_user_id
)
VALUES (
  1,
  'ddab915ec3f5b5f682bea0e339e92bc5ae6ee1f98bbf17b0b8fbf1f835348785',
  '2383430387480621fce41cf90925717a',
  100000,
  'pbkdf2-sha256',
  0,
  1776435000000,
  1
);
