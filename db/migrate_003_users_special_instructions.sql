-- Migration 003: Add special_instructions column to users table.
--
-- This column stores per-user free-text notes (e.g. shift limitations,
-- medical caveats) that appear as a hover tooltip in the Reports view.
-- It is nullable so existing rows are unaffected by this migration.
--
-- Apply to local dev:
--   npx wrangler d1 execute DB --local --file db/migrate_003_users_special_instructions.sql
--
-- Apply to remote (Cloudflare D1):
--   npx wrangler d1 execute DB --remote --file db/migrate_003_users_special_instructions.sql

ALTER TABLE users ADD COLUMN special_instructions TEXT;
