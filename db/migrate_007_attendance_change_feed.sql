-- Add a persistent attendance change feed so Reports can show
-- a rolling audit timeline of upcoming attendance edits.

ALTER TABLE admin_settings
  ADD COLUMN attendance_feed_cutoff_days INTEGER NOT NULL DEFAULT 13
  CHECK (attendance_feed_cutoff_days BETWEEN 1 AND 21);

CREATE TABLE attendance_change_feed (
  change_id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_user_id INTEGER NOT NULL,
  actor_user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  wave INTEGER NOT NULL CHECK (wave IN (0, 1)),
  previous_available INTEGER CHECK (previous_available IN (0, 1) OR previous_available IS NULL),
  next_available INTEGER CHECK (next_available IN (0, 1) OR next_available IS NULL),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'cleared')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (subject_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_attendance_change_feed_created_at
  ON attendance_change_feed(created_at DESC);

CREATE INDEX idx_attendance_change_feed_date
  ON attendance_change_feed(date);

CREATE INDEX idx_attendance_change_feed_expires_at
  ON attendance_change_feed(expires_at);