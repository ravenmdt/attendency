-- Migration 002: enforce case-insensitive username uniqueness
--
-- Why this exists:
-- 1) Login now matches usernames case-insensitively.
-- 2) We also need DB enforcement so two accounts like "Sniff" and "sniff"
--    can never exist at the same time.
--
-- This unique index preserves the existing schema while adding a safety rule
-- for all current and future writes.
--
-- Local:  npx wrangler d1 execute DB --local  --file db/migrate_002_users_name_case_insensitive.sql
-- Remote: npx wrangler d1 execute DB --remote --file db/migrate_002_users_name_case_insensitive.sql

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name_nocase_unique
ON users(name COLLATE NOCASE);
