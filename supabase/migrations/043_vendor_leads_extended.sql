-- Migration 043: Extend vendor_leads for full pipeline
-- Adds new Kanban status values (responded, verified, approved, active)
-- Adds Phase 1J founder intelligence fields (objections, interest_level, contact_outcome)

-- 1. Drop the old status CHECK constraint and replace with extended one
ALTER TABLE vendor_leads DROP CONSTRAINT IF EXISTS vendor_leads_status_check;

ALTER TABLE vendor_leads ADD CONSTRAINT vendor_leads_status_check CHECK (status IN (
  'new',
  'researched',
  'approved_for_outreach',
  'outreach_sent',
  'follow_up_due',
  'responded',
  'interested',
  'registered',
  'verified',
  'approved',
  'active',
  'rejected',
  'not_suitable'
));

-- 2. Phase 1J: Founder intelligence fields
ALTER TABLE vendor_leads
  ADD COLUMN IF NOT EXISTS objections      text,
  ADD COLUMN IF NOT EXISTS interest_level  text CHECK (interest_level IN ('high', 'medium', 'low', 'unknown')),
  ADD COLUMN IF NOT EXISTS contact_outcome text;

-- 3. Lead score index already exists from 042; add one for next_follow_up_at for queue sorting
CREATE INDEX IF NOT EXISTS vendor_leads_follow_up_idx ON vendor_leads (next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
