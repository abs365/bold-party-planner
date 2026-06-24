-- ── Migration 062: P1a — financial_events policy fix ─────────────────────────
-- Phase 70D.5D — Security Remediation
-- Date: 2026-06-24
-- Risk: Low — drops and recreates one SELECT policy; adds one missing customer policy
-- Route impact: None
--   appendLedgerEvent() in lib/finance/ledger.ts writes via createAdminClient() (service role)
--   No application route reads financial_events via authenticated client
--
-- Finding addressed:
--   EXP-002 (HIGH) — financial_events: ledger_id IS NULL branch allowed any
--   authenticated user to read system-level events (RECONCILIATION_RUN,
--   WEBHOOK_REJECTED, WEBHOOK_RECEIVED, WEBHOOK_RECEIVED).
--
-- Additional fix:
--   Customers had no SELECT policy on financial_events — they could not read
--   their own financial events at all. Adding the customer policy here.

-- Drop the existing vendor policy that contains the leak
DROP POLICY IF EXISTS "fin_events_vendor_select" ON financial_events;

-- Vendors can read events linked to their own ledger entries only.
-- System events (ledger_id IS NULL) are no longer accessible to authenticated users.
CREATE POLICY "fin_events_vendor_select" ON financial_events FOR SELECT
  USING (
    ledger_id IN (
      SELECT id FROM financial_ledger
      WHERE vendor_id IN (
        SELECT id FROM vendors WHERE user_id = auth.uid()
      )
    )
  );

-- Customers can read events linked to their own ledger entries.
-- Previously missing — customers had no SELECT policy at all.
CREATE POLICY "fin_events_customer_select" ON financial_events FOR SELECT
  USING (
    ledger_id IN (
      SELECT id FROM financial_ledger
      WHERE customer_id = auth.uid()
    )
  );

-- System events (ledger_id IS NULL) are now accessible only via service role.
-- No authenticated policy covers them — deny-by-default for all non-service-role callers.

NOTIFY pgrst, 'reload schema';
