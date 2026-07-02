-- Migration 068: CRM stage + follow-up tracking on manual_contacts
--
-- Wave 2 Commercial Execution, Priority 2 (CRM enhancements). The existing
-- manual_contacts table (migration 052) had no pipeline concept and no way
-- to track "when should I follow up next" - a vendor had no way to see who
-- needed a nudge. Adds two columns; no new table needed.
--
-- follow_up_at also backs Priority 3 (follow-up reminders): a cron reads
-- rows where follow_up_at <= now() to notify vendors.

ALTER TABLE manual_contacts
  ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'lead'
    CHECK (stage IN ('lead', 'contacted', 'quoted', 'won', 'lost')),
  ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_manual_contacts_follow_up_at ON manual_contacts(follow_up_at)
  WHERE follow_up_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_manual_contacts_stage ON manual_contacts(stage);
