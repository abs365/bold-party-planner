-- Migration 048: Add founding vendor badge column
-- Marks vendors who joined Elbold during the founding cohort.
-- Badge is earned (tenure-based), not purchased. Distinct from the Featured paid tier.
-- Set is_founding_vendor = true for the initial four approved vendors.

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS is_founding_vendor boolean NOT NULL DEFAULT false;

-- Set the founding badge for the initial approved vendor cohort.
-- These names must match the business_name values exactly in the vendors table.
UPDATE vendors
  SET is_founding_vendor = true
  WHERE business_name IN ('Mastaly', 'Baptist', 'Tinms', 'Ballet')
    AND status = 'approved';
