-- Migration 004: Restrict calendar_info.type values to PTT or ACT.
--
-- This is a forward-only migration for existing databases.
-- It does not reset or wipe data.
--
-- Apply to local dev:
--   npx wrangler d1 execute DB --local --file db/migrate_004_calendar_info_type_constraint.sql
--
-- Apply to remote (Cloudflare D1):
--   npx wrangler d1 execute DB --remote --file db/migrate_004_calendar_info_type_constraint.sql

PRAGMA foreign_keys = OFF;

-- Normalize legacy values before enforcing the stricter domain.
UPDATE calendar_info
SET type = 'ACT'
WHERE UPPER(type) NOT IN ('PTT', 'ACT');

CREATE TABLE calendar_info_new (
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  nights INTEGER NOT NULL CHECK (nights IN (0, 1)),
  priority INTEGER NOT NULL CHECK (priority IN (0, 1)),
  type TEXT NOT NULL CHECK (type IN ('PTT', 'ACT')),
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

INSERT INTO calendar_info_new (user_id, date, nights, priority, type)
SELECT
  user_id,
  date,
  nights,
  priority,
  CASE
    WHEN UPPER(type) = 'PTT' THEN 'PTT'
    ELSE 'ACT'
  END AS type
FROM calendar_info;

DROP TABLE calendar_info;
ALTER TABLE calendar_info_new RENAME TO calendar_info;
PRAGMA foreign_keys = ON;
