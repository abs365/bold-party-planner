-- Migration 034: Identity hardening — phone verification tracking
--
-- Adds phone_verified flags to profiles and vendors.
-- Phone numbers already exist on both tables (profiles.phone, vendors.phone).
-- This migration only adds the verification tracking columns.
-- Phone numbers are collected and stored; admin toggles phone_verified manually.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

-- Grant access to the new columns for authenticated users (profiles own-write, vendors own-write via RLS).
-- phone_verified is admin-set only; no explicit additional policy needed beyond existing RLS.

NOTIFY pgrst, 'reload schema';
