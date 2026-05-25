-- Bold Party Phase 3 Migration
-- Run this AFTER 001_initial.sql AND 002_phase2.sql

-- ─── Quotes ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','responded','accepted','declined','expired','converted')),
  message TEXT,
  requirements TEXT,
  event_date DATE,
  event_type TEXT,
  guest_count INTEGER,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  converted_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_vendor ON quotes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quotes_customer_all" ON quotes;
CREATE POLICY "quotes_customer_all" ON quotes FOR ALL USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "quotes_vendor_read" ON quotes;
CREATE POLICY "quotes_vendor_read" ON quotes FOR SELECT
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "quotes_vendor_update" ON quotes;
CREATE POLICY "quotes_vendor_update" ON quotes FOR UPDATE
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- ─── Quote Responses ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2),
  message TEXT,
  includes TEXT[] DEFAULT '{}',
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quote_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qr_vendor_all" ON quote_responses;
CREATE POLICY "qr_vendor_all" ON quote_responses FOR ALL
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "qr_customer_read" ON quote_responses;
CREATE POLICY "qr_customer_read" ON quote_responses FOR SELECT
  USING (quote_id IN (SELECT id FROM quotes WHERE customer_id = auth.uid()));

-- ─── Contracts ────────────────────────────────────────────────────────────────
-- Drop and recreate if it exists from a failed prior run without correct columns
DROP TABLE IF EXISTS contracts CASCADE;
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  terms TEXT NOT NULL DEFAULT '',
  cancellation_policy TEXT NOT NULL DEFAULT '',
  refund_policy TEXT NOT NULL DEFAULT '',
  customer_accepted_at TIMESTAMPTZ,
  vendor_accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','customer_signed','both_signed','declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_booking ON contracts(booking_id);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_parties" ON contracts FOR ALL USING (
  auth.uid() = customer_id OR
  vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
);

-- ─── Vendor Onboarding Tracker ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID UNIQUE NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  payout_name TEXT,
  payout_bank TEXT,
  payout_sort_code TEXT,
  payout_account_number TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vendor_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendor_onboarding_own" ON vendor_onboarding;
CREATE POLICY "vendor_onboarding_own" ON vendor_onboarding FOR ALL
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- ─── Automation Logs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  result TEXT NOT NULL DEFAULT 'sent' CHECK (result IN ('sent','failed','skipped')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_type ON automation_logs(type, created_at);

-- ─── Vendor Payouts (needed for platform_stats view) ─────────────────────────
CREATE TABLE IF NOT EXISTS vendor_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor ON vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_status ON vendor_payouts(status);

ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendor_payouts_own" ON vendor_payouts;
CREATE POLICY "vendor_payouts_own" ON vendor_payouts FOR ALL
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- ─── Augment disputes table for Phase 3 ──────────────────────────────────────
ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS refund_status TEXT CHECK (refund_status IN ('pending','approved','denied','processed')),
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS customer_evidence TEXT,
  ADD COLUMN IF NOT EXISTS vendor_response_text TEXT;

-- ─── Trigger: auto-create contract when booking is accepted ──────────────────
CREATE OR REPLACE FUNCTION auto_create_contract()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    INSERT INTO contracts (
      booking_id, customer_id, vendor_id, terms, cancellation_policy, refund_policy
    )
    VALUES (
      NEW.id,
      NEW.customer_id,
      NEW.vendor_id,
      'This booking agreement is between the customer and the vendor listed above. The vendor agrees to provide the services described in the selected package on the agreed event date. The customer agrees to make payment as per the agreed schedule: 30% deposit to confirm, 70% balance due 7 days before the event.',
      'Cancellations made 14 or more days before the event: 100% deposit refund. Cancellations 7-13 days before the event: 50% deposit refund. Cancellations fewer than 7 days before the event: deposit is non-refundable. Cancellations on the day: full invoice amount may be charged.',
      'Refunds are processed within 5-10 business days after approval. Platform commission (10%) is non-refundable in all cases. Refund requests must be submitted within 48 hours of the event. Disputes must be raised through the platform dispute system.'
    )
    ON CONFLICT (booking_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_contract_on_accept ON bookings;
CREATE TRIGGER create_contract_on_accept
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION auto_create_contract();

-- ─── Trigger: mark quote as converted when booking is created from it ─────────
CREATE OR REPLACE FUNCTION mark_quote_converted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.converted_booking_id IS NOT NULL THEN
    UPDATE quotes SET status = 'converted' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS quote_converted_trigger ON quotes;
CREATE TRIGGER quote_converted_trigger
  AFTER UPDATE OF converted_booking_id ON quotes
  FOR EACH ROW EXECUTE FUNCTION mark_quote_converted();

-- ─── Expire old pending quotes daily ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION expire_old_quotes()
RETURNS void AS $$
BEGIN
  UPDATE quotes
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Update platform_stats view to include Phase 3 metrics ───────────────────
DROP VIEW IF EXISTS platform_stats;
CREATE VIEW platform_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'customer') AS total_customers,
  (SELECT COUNT(*) FROM vendors) AS total_vendors,
  (SELECT COUNT(*) FROM vendors WHERE status = 'approved') AS approved_vendors,
  (SELECT COUNT(*) FROM vendors WHERE status = 'pending') AS pending_vendors,
  (SELECT COUNT(*) FROM events) AS total_events,
  (SELECT COUNT(*) FROM bookings) AS total_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'completed') AS completed_bookings,
  (SELECT COALESCE(SUM(commission_amount),0) FROM bookings WHERE payment_status IN ('deposit_paid','fully_paid')) AS total_revenue,
  (SELECT COALESCE(SUM(total_amount),0) FROM bookings WHERE payment_status = 'fully_paid') AS total_gmv,
  (SELECT COUNT(*) FROM disputes WHERE status = 'open') AS open_disputes,
  (SELECT COUNT(*) FROM disputes WHERE status = 'investigating') AS investigating_disputes,
  (SELECT COALESCE(AVG(rating), 0) FROM vendors WHERE status = 'approved' AND rating > 0) AS avg_vendor_rating,
  (SELECT COUNT(*) FROM quotes WHERE status = 'pending') AS pending_quotes,
  (SELECT COALESCE(SUM(amount),0) FROM vendor_payouts WHERE status = 'pending') AS pending_payouts;
