-- Migration 072: durable test-data flag, replacing manual cleanup migrations
-- with an explicit, permanent marker.
--
-- Migrations 067 and 071 both had to hunt down and delete test/demo data
-- after the fact, by name-pattern-matching and careful manual verification.
-- Going forward: any test record (vendor or customer/profile) created for
-- QA, smoke testing, or demos MUST be marked is_test_data = true at creation
-- time. Every existing row defaults to false, which is correct as of this
-- migration - all previously-identified test data was already removed by
-- migration 071.

ALTER TABLE vendors  ADD COLUMN IF NOT EXISTS is_test_data boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_test_data boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN vendors.is_test_data IS
  'True for records created for testing/QA/demo purposes. Must be excluded from all production dashboards, marketplace listings, commercial reporting, and KPIs - see lib/test-vendors.ts. Never set true on a real vendor.';
COMMENT ON COLUMN profiles.is_test_data IS
  'True for records created for testing/QA/demo purposes. Must be excluded from all production dashboards, commercial reporting, and KPIs - see lib/test-vendors.ts. Never set true on a real person.';

CREATE INDEX IF NOT EXISTS idx_vendors_is_test_data ON vendors(is_test_data) WHERE is_test_data = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_test_data ON profiles(is_test_data) WHERE is_test_data = true;
