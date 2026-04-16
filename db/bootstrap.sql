-- Rebuild schema and seed demo data for attendency
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS auth_rate_limits;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS calendar_info;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 100000,
  password_algo TEXT NOT NULL DEFAULT 'pbkdf2-sha256'
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

-- Demo credential:
--   username: john
--   password: test
-- The plaintext password is NEVER stored. We store PBKDF2 output + per-user salt.
INSERT INTO users (name, password_hash, password_salt, password_iterations, password_algo)
VALUES (
  'john',
  'd8d8dd3728ad24f269051c0b3ee7e075fc2fc7b3bd859b1405125e9be23b2031',
  '01d44adafb2212bee8e3ff97361f73aa',
  100000,
  'pbkdf2-sha256'
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
