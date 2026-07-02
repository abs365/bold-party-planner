-- Migration 070: Vendor notification preferences + Daily Summary Email
--
-- Wave 2 Commercial Execution, Priority 4. No preference/opt-out mechanism
-- existed anywhere for vendor emails (verified by repo search - only a
-- decorative List-Unsubscribe mailto header on one template). A new daily
-- digest email needs a real one-click opt-out.
--
-- Deliberately a dedicated preferences table keyed on vendor_id, not a
-- column bolted onto `vendors` - automation-ready: future notification
-- types (e.g. a follow-up-reminder email channel, alongside the existing
-- in-app one) get a new boolean column here without touching vendors.
-- A missing row means "all defaults" (every column DEFAULT true) rather
-- than requiring a backfill for existing vendors.

CREATE TABLE vendor_notification_preferences (
  vendor_id           UUID        PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  daily_summary_email BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_vendor_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendor_notification_prefs_updated_at
  BEFORE UPDATE ON vendor_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_vendor_notification_prefs_updated_at();

ALTER TABLE vendor_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vnp_vendor_select" ON vendor_notification_preferences FOR SELECT
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "vnp_vendor_upsert" ON vendor_notification_preferences FOR INSERT
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "vnp_vendor_update" ON vendor_notification_preferences FOR UPDATE
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE ON vendor_notification_preferences TO authenticated;
GRANT ALL                    ON vendor_notification_preferences TO service_role;
