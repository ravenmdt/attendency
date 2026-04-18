-- Migration 005: Add audit metadata columns to calendar_info.
--
-- Apply to local dev:
--   npx wrangler d1 execute DB --local --file db/migrate_005_calendar_info_audit_fields.sql
--
-- Apply to remote D1:
--   npx wrangler d1 execute DB --remote --file db/migrate_005_calendar_info_audit_fields.sql

ALTER TABLE calendar_info ADD COLUMN created_at INTEGER;
ALTER TABLE calendar_info ADD COLUMN created_by_user_id INTEGER;
ALTER TABLE calendar_info ADD COLUMN updated_at INTEGER;
ALTER TABLE calendar_info ADD COLUMN updated_by_user_id INTEGER;

UPDATE calendar_info
SET
  created_at = COALESCE(created_at, unixepoch() * 1000),
  created_by_user_id = COALESCE(created_by_user_id, user_id),
  updated_at = COALESCE(updated_at, created_at, unixepoch() * 1000),
  updated_by_user_id = COALESCE(updated_by_user_id, created_by_user_id, user_id);
