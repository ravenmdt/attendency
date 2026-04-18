-- Migration 006: Add persistent layout options to admin_settings.
--
-- Apply to local dev:
--   npx wrangler d1 execute DB --local --file db/migrate_006_admin_layout_options.sql
--
-- Apply to remote D1:
--   npx wrangler d1 execute DB --remote --file db/migrate_006_admin_layout_options.sql

ALTER TABLE admin_settings ADD COLUMN show_day_icons INTEGER NOT NULL DEFAULT 1 CHECK (show_day_icons IN (0, 1));
ALTER TABLE admin_settings ADD COLUMN show_night_icons INTEGER NOT NULL DEFAULT 1 CHECK (show_night_icons IN (0, 1));

UPDATE admin_settings
SET
  show_day_icons = COALESCE(show_day_icons, 1),
  show_night_icons = COALESCE(show_night_icons, 1)
WHERE settings_id = 1;
