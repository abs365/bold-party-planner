-- Migration 069: Customer Timeline foundation for manual contacts
--
-- Wave 2 Commercial Execution, Priority 2. Real marketplace customers already
-- get a unified activity timeline (bookings+quotes+reviews+messages, joined
-- on the fly - see app/vendor/customers/[id]/page.tsx). Off-platform
-- manual_contacts had no equivalent - just a flat notes list with no record
-- of stage changes, follow-up scheduling, or system actions taken on them.
--
-- Mirrors the existing quote_events audit-table pattern (migration 031:
-- event_type + actor + details JSONB) rather than inventing a new shape.
--
-- Automation-ready by design: `actor` distinguishes vendor-initiated events
-- from system-initiated ones (e.g. a reminder the cron sent), and
-- `event_type` is a fixed, extensible vocabulary a future automation engine
-- can both read (trigger conditions) and write (its own logged actions)
-- without any schema change.

CREATE TABLE manual_contact_activity (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id         UUID         NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  manual_contact_id UUID         NOT NULL REFERENCES manual_contacts(id) ON DELETE CASCADE,
  event_type        TEXT         NOT NULL CHECK (event_type IN (
    'created', 'stage_changed', 'follow_up_set', 'follow_up_cleared',
    'follow_up_reminder_sent', 'archived', 'restored'
  )),
  description       TEXT         NOT NULL,
  metadata          JSONB        DEFAULT '{}',
  actor             TEXT         NOT NULL DEFAULT 'vendor' CHECK (actor IN ('vendor', 'system')),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mca_vendor_id  ON manual_contact_activity(vendor_id);
CREATE INDEX idx_mca_contact_id ON manual_contact_activity(manual_contact_id, created_at DESC);

ALTER TABLE manual_contact_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mca_vendor_select" ON manual_contact_activity FOR SELECT
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Vendor-triggered events (stage change, follow-up set, archive) are logged
-- from the existing user-scoped API routes, matching the manual_contacts /
-- manual_contact_notes insert-policy pattern. System events (the follow-up
-- reminder cron) use createAdminClient(), which bypasses RLS entirely.
CREATE POLICY "mca_vendor_insert" ON manual_contact_activity FOR INSERT
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

GRANT SELECT, INSERT ON manual_contact_activity TO authenticated;
GRANT ALL             ON manual_contact_activity TO service_role;
