-- Migration 075: first-touch marketing attribution on quotes
-- (Master Growth OS Commercial Operating Upgrade, Wave 5 / FD-19 Option A).
--
-- No attribution column has ever existed on quotes (checked every migration
-- from 003_phase3.sql through 074_founding_vendor_commission_waiver.sql) —
-- this is the minimum addition needed to eventually answer "what generated
-- this enquiry?" Follows the existing JSONB-metadata convention already used
-- by vendor_analytics.metadata (004_phase4.sql) and migration 073's ref-
-- tagging pattern, rather than adding five separate utm_* columns.

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS attribution JSONB DEFAULT NULL;

COMMENT ON COLUMN quotes.attribution IS
  'First-touch marketing attribution captured at the visitor''s first page load and carried through to quote submission. Shape: {utm_source, utm_medium, utm_campaign, utm_content, referrer}. Only populated once cookie consent (bp_cookie_consent) includes "all" — see lib/attribution. NULL for quotes with no captured attribution (direct traffic, no consent, or rows created before this migration).';
