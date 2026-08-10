-- Migration 074: time-boxed "Founding 100" commission waiver (design/prep only — NOT applied to production as part of this change)
--
-- The Founder has approved, in principle, two DIFFERENT things that must
-- never be conflated:
--   1. is_founding_vendor (migration 048)       — a PERMANENT recognition
--      badge for the first genuine 100 vendors. Unchanged by this migration.
--   2. founding_commission_expires_at (this one) — a SEPARATE, TIME-BOXED
--      0% marketplace commission introductory period (design: 6 months from
--      whenever a given vendor's waiver is activated), after which standard
--      commission (COMMISSION_RATE, currently 10%) resumes automatically.
--
-- A vendor can be a permanent Founding Vendor (badge) whose waiver has
-- already expired and who is back on standard commission — the two columns
-- are read independently. See lib/finance/commission.ts
-- getApplicableCommissionRate() for the one place that reconciles them into
-- an actual rate.
--
-- NULL = no active or ever-granted waiver for this vendor (the default for
-- every existing row, since the column does not exist until this migration
-- runs). This is what makes adding the column alone commercially inert:
-- getApplicableCommissionRate() treats NULL identically to "standard rate,
-- always has, always will" until someone deliberately sets a real timestamp
-- on a real vendor row - a separate, later activation decision.

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS founding_commission_expires_at timestamptz;

COMMENT ON COLUMN vendors.founding_commission_expires_at IS
  'End of this vendor''s time-boxed 0% introductory marketplace commission waiver (Founding 100 programme). NULL = no active waiver (default for all existing vendors - standard commission applies). Independent of is_founding_vendor, which is a permanent badge and never expires. Set via a deliberate activation action (e.g. join_date + 6 months), never inferred. Read exclusively through lib/finance/commission.ts getApplicableCommissionRate() - never compare against NOW() ad hoc elsewhere.';
