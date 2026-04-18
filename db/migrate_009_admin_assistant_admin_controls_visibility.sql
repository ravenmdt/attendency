-- Migration 009: allow Admin Assistant users to be granted access to the
-- Admin Controls screen independently from normal User-role access.
--
-- This is a forward-only update and does not reset any existing data.

ALTER TABLE admin_settings
  ADD COLUMN allow_admin_assistant_role_admin_controls INTEGER NOT NULL DEFAULT 0
  CHECK (allow_admin_assistant_role_admin_controls IN (0, 1));