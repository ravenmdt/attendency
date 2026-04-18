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
DROP TABLE IF EXISTS attendance_change_feed;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Username uniqueness is case-insensitive by convention.
  -- This prevents separate accounts like "Sniff" and "sniff".
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  qualification TEXT NOT NULL DEFAULT 'NONE' CHECK (qualification IN ('NONE', 'PTT', 'ACT', 'PTT TO ACT')),
  role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('User', 'Admin Assistant', 'Admin')),
  image_url TEXT,
  -- Free-text notes the user writes about themselves (e.g. shift caveats).
  -- Shown as a hover tooltip in the Reports view. NULL means no notes set.
  special_instructions TEXT,
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
  allow_admin_assistant_role_admin_controls INTEGER NOT NULL DEFAULT 0 CHECK (allow_admin_assistant_role_admin_controls IN (0, 1)),
  show_day_icons INTEGER NOT NULL DEFAULT 1 CHECK (show_day_icons IN (0, 1)),
  show_night_icons INTEGER NOT NULL DEFAULT 1 CHECK (show_night_icons IN (0, 1)),
  -- The Reports change feed only shows attendance edits for the next N days.
  attendance_feed_cutoff_days INTEGER NOT NULL DEFAULT 13 CHECK (attendance_feed_cutoff_days BETWEEN 1 AND 21),
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
  type TEXT NOT NULL CHECK (type IN ('PTT', 'ACT')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_by_user_id INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_by_user_id INTEGER,
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE availability (
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  wave INTEGER NOT NULL CHECK (wave IN (0, 1)),
  available INTEGER NOT NULL CHECK (available IN (0, 1)),
  PRIMARY KEY (user_id, date, wave),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE attendance_change_feed (
  change_id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_user_id INTEGER NOT NULL,
  actor_user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  wave INTEGER NOT NULL CHECK (wave IN (0, 1)),
  previous_available INTEGER CHECK (previous_available IN (0, 1) OR previous_available IS NULL),
  next_available INTEGER CHECK (next_available IN (0, 1) OR next_available IS NULL),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'cleared')),
  accepted INTEGER NOT NULL DEFAULT 0 CHECK (accepted IN (0, 1)),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (subject_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_attendance_change_feed_created_at ON attendance_change_feed(created_at DESC);
CREATE INDEX idx_attendance_change_feed_date ON attendance_change_feed(date);
CREATE INDEX idx_attendance_change_feed_expires_at ON attendance_change_feed(expires_at);

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
  allow_admin_assistant_role_admin_controls,
  show_day_icons,
  show_night_icons,
  attendance_feed_cutoff_days,
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
  0,
  1,
  1,
  13,
  1776435000000,
  1
);
