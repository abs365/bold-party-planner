-- Migration 057: financial_ledger -- commission_rate + Connect columns
--
-- commission_rate: stores the rate used when this ledger entry was created.
--   DEFAULT 0.1000 backfills all existing production rows correctly.
--   All future createLedgerEntry() calls write this field explicitly.
--
-- Connect columns (nullable): populated only when vendor has active Connect account.
--   These are informational during Phase 70B. Payout execution (Phase 70G) will write them.

ALTER TABLE financial_ledger
  ADD COLUMN IF NOT EXISTS commission_rate           DECIMAL(5,4) NOT NULL DEFAULT 0.1000,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id        TEXT,   -- 'tr_xxx' -- Phase 70G
  ADD COLUMN IF NOT EXISTS stripe_application_fee_id TEXT,   -- 'fee_xxx' -- Phase 70G
  ADD COLUMN IF NOT EXISTS connect_account_id        TEXT,   -- denormalized acct_xxx
  ADD COLUMN IF NOT EXISTS payout_scheduled_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_completed_at       TIMESTAMPTZ;

-- Index for payout reconciliation queries
CREATE INDEX IF NOT EXISTS idx_ledger_connect_account
  ON financial_ledger(connect_account_id)
  WHERE connect_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ledger_commission_rate
  ON financial_ledger(commission_rate);
