-- Migration 001: Add feedback table
--
-- Run this once against local and remote to add the feedback system.
-- Do NOT run this if you have already run a full bootstrap reset that
-- includes the feedback table definition.
--
-- Local:  npx wrangler d1 execute DB --local  --file db/migrate_001_add_feedback.sql
-- Remote: npx wrangler d1 execute DB --remote --file db/migrate_001_add_feedback.sql

CREATE TABLE IF NOT EXISTS feedback (
  -- Auto-incrementing primary key for each feedback entry
  feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- The user who posted this feedback (cascades on user delete)
  user_id     INTEGER NOT NULL,

  -- The actual feedback text submitted by the user
  text        TEXT NOT NULL,

  -- Unix timestamp (ms) of when the feedback was submitted
  created_at  INTEGER NOT NULL,

  -- 0 = pending / 1 = accepted (admin can toggle this to strike through the text)
  accepted    INTEGER NOT NULL DEFAULT 0 CHECK (accepted IN (0, 1)),

  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Index to allow fast newest-first ordering on the feedback feed
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
