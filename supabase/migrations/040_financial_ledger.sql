-- ── Financial Ledger Infrastructure ──────────────────────────────────────────
-- Migration 040: financial_ledger + financial_events + reconciliation_runs
-- These tables are the single source of truth for all money movement.
-- financial_events is append-only: no UPDATE, no DELETE, ever.

-- ── Financial Ledger ─────────────────────────────────────────────────────────
-- One row per booking. Accumulates all payment, refund, and chargeback amounts.
CREATE TABLE financial_ledger (
  id                        UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id                UUID         REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id               UUID         NOT NULL REFERENCES profiles(id),
  vendor_id                 UUID         NOT NULL REFERENCES vendors(id),

  stripe_payment_intent_id  TEXT,
  stripe_checkout_session_id TEXT,
  stripe_charge_id          TEXT,

  gross_amount              DECIMAL(12,2) NOT NULL DEFAULT 0,
  platform_commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  vendor_amount             DECIMAL(12,2) NOT NULL DEFAULT 0,
  refund_amount             DECIMAL(12,2) NOT NULL DEFAULT 0,
  chargeback_amount         DECIMAL(12,2) NOT NULL DEFAULT 0,

  currency                  TEXT         NOT NULL DEFAULT 'gbp',

  payment_status            TEXT         NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','refunded','partially_refunded','chargeback','failed')),

  payout_status             TEXT         NOT NULL DEFAULT 'not_due'
    CHECK (payout_status IN ('not_due','scheduled','paid','failed')),

  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_booking_id        ON financial_ledger(booking_id);
CREATE INDEX idx_ledger_customer_id       ON financial_ledger(customer_id);
CREATE INDEX idx_ledger_vendor_id         ON financial_ledger(vendor_id);
CREATE INDEX idx_ledger_payment_intent    ON financial_ledger(stripe_payment_intent_id);
CREATE INDEX idx_ledger_payment_status    ON financial_ledger(payment_status);
CREATE INDEX idx_ledger_payout_status     ON financial_ledger(payout_status);
CREATE INDEX idx_ledger_created_at        ON financial_ledger(created_at);

CREATE OR REPLACE FUNCTION update_ledger_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_updated_at
  BEFORE UPDATE ON financial_ledger
  FOR EACH ROW EXECUTE FUNCTION update_ledger_updated_at();

ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;

-- Vendors can read their own ledger entries; admins read via service role (bypasses RLS)
CREATE POLICY "ledger_vendor_select" ON financial_ledger FOR SELECT
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Customers can read their own entries
CREATE POLICY "ledger_customer_select" ON financial_ledger FOR SELECT
  USING (customer_id = auth.uid());

-- ── Financial Events ──────────────────────────────────────────────────────────
-- Append-only audit log. Never update, never delete.
-- ledger_id is nullable for events not tied to a specific booking (e.g., WEBHOOK_REJECTED, RECONCILIATION_RUN).
CREATE TABLE financial_events (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ledger_id   UUID        REFERENCES financial_ledger(id) ON DELETE SET NULL,
  event_type  TEXT        NOT NULL CHECK (event_type IN (
    'PAYMENT_RECEIVED',
    'BOOKING_CONFIRMED',
    'REFUND_REQUESTED',
    'REFUND_COMPLETED',
    'PAYOUT_CREATED',
    'PAYOUT_SCHEDULED',
    'PAYOUT_COMPLETED',
    'PAYOUT_FAILED',
    'CHARGEBACK_RECEIVED',
    'CHARGEBACK_RESOLVED',
    'PAYMENT_FAILED',
    'WEBHOOK_RECEIVED',
    'WEBHOOK_REJECTED',
    'RECONCILIATION_RUN',
    'LEDGER_CREATED',
    'LEDGER_UPDATED'
  )),
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fin_events_ledger_id   ON financial_events(ledger_id);
CREATE INDEX idx_fin_events_event_type  ON financial_events(event_type);
CREATE INDEX idx_fin_events_created_at  ON financial_events(created_at);

ALTER TABLE financial_events ENABLE ROW LEVEL SECURITY;

-- Vendors can see events for their own bookings
CREATE POLICY "fin_events_vendor_select" ON financial_events FOR SELECT
  USING (
    ledger_id IS NULL
    OR ledger_id IN (
      SELECT id FROM financial_ledger
      WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );

-- ── Reconciliation Runs ───────────────────────────────────────────────────────
-- One row per reconciliation run. Stores the outcome and any discrepancy details.
CREATE TABLE reconciliation_runs (
  id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  payments_gmv          DECIMAL(12,2) NOT NULL DEFAULT 0,
  ledger_gmv            DECIMAL(12,2) NOT NULL DEFAULT 0,
  expected_commission   DECIMAL(12,2) NOT NULL DEFAULT 0,
  actual_commission     DECIMAL(12,2) NOT NULL DEFAULT 0,
  pending_payout_total  DECIMAL(12,2) NOT NULL DEFAULT 0,
  refund_total          DECIMAL(12,2) NOT NULL DEFAULT 0,
  discrepancies_found   INTEGER       NOT NULL DEFAULT 0,
  discrepancy_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  status                TEXT          NOT NULL DEFAULT 'healthy'
    CHECK (status IN ('healthy', 'warning', 'critical')),
  details               JSONB         NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recon_runs_created_at ON reconciliation_runs(created_at);
CREATE INDEX idx_recon_runs_status     ON reconciliation_runs(status);

ALTER TABLE reconciliation_runs ENABLE ROW LEVEL SECURITY;
-- Only admins via service role can read/write reconciliation runs
