-- Migration 028: Add pricing_type to vendor_packages
-- Supports: fixed | starting_from | per_person | price_on_request
-- All existing packages default to 'fixed' — zero data loss.
-- Apply in Supabase SQL Editor before deploying code changes.

ALTER TABLE public.vendor_packages
  ADD COLUMN IF NOT EXISTS pricing_type TEXT NOT NULL DEFAULT 'fixed'
    CHECK (pricing_type IN ('fixed', 'starting_from', 'per_person', 'price_on_request'));

-- Backfill any rows that may have been inserted without the column
UPDATE public.vendor_packages
  SET pricing_type = 'fixed'
  WHERE pricing_type IS NULL;

NOTIFY pgrst, 'reload schema';
