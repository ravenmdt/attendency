-- Rebuild schema and seed demo data for attendency
--
-- Relevant terminal commands:
--   npm run db:reset:local
--     Rebuilds the local D1 database from this file.
--
--   npm run db:reset:remote
--     Applies the same reset to the remote Cloudflare D1 database.
--
--   npx wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table';"
--     Quick check that the local tables were recreated.
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS auth_rate_limits;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS calendar_info;
DROP TABLE IF EXISTS admin_settings;
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

-- Demo credentials:
--   usernames: john, boy, ladder, neushoorn
--   password for all demo users: test
-- The plaintext password is NEVER stored. We store PBKDF2 output + per-user salt.
INSERT INTO users (name, qualification, role, image_url, last_login_at, password_hash, password_salt, password_iterations, password_algo)
VALUES
  (
    'john',
    'NONE',
    'Admin',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    1776412800000,
    'd8d8dd3728ad24f269051c0b3ee7e075fc2fc7b3bd859b1405125e9be23b2031',
    '01d44adafb2212bee8e3ff97361f73aa',
    100000,
    'pbkdf2-sha256'
  ),
  (
    'boy',
    'PTT',
    'User',
    'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    1776405600000,
    'bd6dbce6ab9eb7d193c405bd90b9657da8e518f984932b2de8f6370680cb1214',
    '92d719c27a9107e46b63f186717e7fa0',
    100000,
    'pbkdf2-sha256'
  ),
  (
    'ladder',
    'ACT',
    'User',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    1776330000000,
    '05485177e2dd4900e201e15aaf422f1fa84ecfc594e56b8f3f552f12622f3545',
    '6bd8db3943ba36690430d50ad7fe0cec',
    100000,
    'pbkdf2-sha256'
  ),
  (
    'neushoorn',
    'PTT TO ACT',
    'User',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    1776254400000,
    '1ea837f423151fd02fc0167ba9c7ea091f4fef855ef4519dcc058792c6604331',
    '51cfa36b8cff8828bf592ebe3dab1491',
    100000,
    'pbkdf2-sha256'
  );

-- Admin settings are stored once for the whole project.
-- The default password below starts as TigerTiger313#!# but only the hash and salt are saved.
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
  '3c1f49ff8070b2c0bbb75822663140a84a0ea0c9248161a6d74155203627c22a',
  '8f3d5c2b9a7041e6d8c1f0ab37de9245',
  100000,
  'pbkdf2-sha256',
  0,
  1776420000000,
  1
);

INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-13', 1, 0, 'OFF');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-14', 0, 0, 'OFF');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-15', 1, 1, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-16', 1, 1, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-17', 0, 0, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-18', 0, 1, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-19', 0, 0, 'OFF');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-20', 1, 1, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-21', 1, 0, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-22', 1, 1, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-23', 1, 1, 'OFF');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-24', 1, 1, 'ACT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-25', 0, 0, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-26', 1, 0, 'ACT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-27', 0, 1, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-28', 0, 0, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-29', 0, 0, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-30', 0, 0, 'ACT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-03-31', 1, 0, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-01', 1, 0, 'OFF');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-02', 1, 1, 'ACT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-03', 0, 0, 'ACT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-04', 1, 0, 'ACT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-05', 1, 1, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-06', 0, 0, 'ACT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-07', 1, 0, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-08', 1, 0, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-09', 0, 0, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-10', 0, 1, 'OFF');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-11', 0, 1, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-12', 0, 0, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-13', 1, 0, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-14', 1, 1, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-15', 1, 0, 'OFF');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-16', 0, 1, 'ACT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-17', 1, 0, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-18', 0, 0, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-19', 1, 0, 'OFF');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-20', 0, 0, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-21', 0, 1, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-22', 0, 0, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-23', 1, 0, 'OFF');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-24', 0, 0, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-25', 1, 1, 'ACT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-26', 1, 0, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-27', 1, 0, 'ACT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-28', 1, 0, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-29', 1, 0, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-04-30', 0, 0, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-05-01', 0, 0, 'ACT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-05-02', 0, 0, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-05-03', 1, 1, 'TRG');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-05-04', 0, 0, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-05-05', 0, 0, 'OFF');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-05-06', 0, 0, 'OFF');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-05-07', 1, 0, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-05-08', 1, 0, 'ACT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-05-09', 1, 0, 'OFF');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-05-10', 1, 1, 'PTT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-05-11', 0, 0, 'OFF');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-05-12', 1, 0, 'ACT');
INSERT INTO calendar_info (user_id, date, nights, priority, type) VALUES (1, '2026-05-13', 0, 0, 'ACT');

INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-13', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-13', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-14', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-14', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-15', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-15', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-16', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-16', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-17', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-17', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-18', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-18', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-19', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-19', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-20', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-20', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-21', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-21', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-22', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-22', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-23', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-23', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-24', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-24', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-25', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-25', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-26', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-26', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-27', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-27', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-28', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-28', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-29', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-29', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-30', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-30', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-31', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-03-31', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-01', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-01', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-02', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-02', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-03', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-03', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-04', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-04', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-05', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-05', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-06', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-06', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-07', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-07', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-08', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-08', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-09', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-09', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-10', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-10', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-11', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-11', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-12', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-12', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-13', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-13', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-14', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-14', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-16', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-16', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-17', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-17', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-18', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-18', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-19', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-19', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-20', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-20', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-21', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-21', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-22', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-22', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-23', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-23', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-24', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-24', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-25', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-25', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-26', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-26', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-27', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-27', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-28', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-28', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-29', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-29', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-30', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-04-30', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-01', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-01', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-02', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-02', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-03', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-03', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-04', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-04', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-05', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-05', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-06', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-06', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-07', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-07', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-08', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-08', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-09', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-09', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-10', 0, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-10', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-11', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-11', 1, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-12', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-12', 1, 0);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-13', 0, 1);
INSERT INTO availability (user_id, date, wave, available) VALUES (1, '2026-05-13', 1, 0);
