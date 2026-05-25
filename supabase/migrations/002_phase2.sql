-- Bold Party Phase 2 Migration
-- Run this AFTER 001_initial.sql

-- ─── Stripe Events (deduplication) ───────────────────────────────────────────
CREATE TABLE stripe_events (
  id TEXT PRIMARY KEY,                 -- Stripe event ID (evt_...)
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Checklist Progress ───────────────────────────────────────────────────────
CREATE TABLE checklist_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE (event_id, category, item)
);

CREATE INDEX idx_checklist_event ON checklist_progress(event_id);

ALTER TABLE checklist_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_own" ON checklist_progress FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE customer_id = auth.uid()));

-- ─── Email Log ────────────────────────────────────────────────────────────────
CREATE TABLE email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  template TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Vendor Payouts ───────────────────────────────────────────────────────────
CREATE TABLE vendor_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed')),
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payouts_vendor" ON vendor_payouts FOR SELECT
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- ─── Augment payments table ───────────────────────────────────────────────────
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'gbp',
  ADD COLUMN IF NOT EXISTS description TEXT;

-- ─── Augment bookings table ───────────────────────────────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- ─── Augment vendors table ─────────────────────────────────────────────────────
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS event_types TEXT[] DEFAULT '{}';

-- ─── Augment invoices table ───────────────────────────────────────────────────
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- ─── Platform stats view ──────────────────────────────────────────────────────
CREATE OR REPLACE VIEW platform_stats AS
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
  (SELECT COALESCE(AVG(rating), 0) FROM vendors WHERE status = 'approved' AND rating > 0) AS avg_vendor_rating;

-- ─── Auto-seed checklist from AI plan when event is created ─────────────────
CREATE OR REPLACE FUNCTION seed_checklist_from_plan()
RETURNS TRIGGER AS $$
DECLARE
  cat JSONB;
  item TEXT;
BEGIN
  IF NEW.ai_plan IS NOT NULL AND NEW.ai_plan->'checklist' IS NOT NULL THEN
    FOR cat IN SELECT * FROM jsonb_array_elements(NEW.ai_plan->'checklist') LOOP
      FOR item IN SELECT * FROM jsonb_array_elements_text(cat->'items') LOOP
        INSERT INTO checklist_progress (event_id, category, item, completed)
        VALUES (NEW.id, cat->>'category', item, FALSE)
        ON CONFLICT (event_id, category, item) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER seed_checklist_on_event
  AFTER INSERT OR UPDATE OF ai_plan ON events
  FOR EACH ROW EXECUTE FUNCTION seed_checklist_from_plan();

-- ─── Function: auto-create vendor payout when booking completes ───────────────
CREATE OR REPLACE FUNCTION auto_create_payout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'fully_paid' AND OLD.payment_status != 'fully_paid' THEN
    INSERT INTO vendor_payouts (vendor_id, booking_id, amount, status)
    VALUES (NEW.vendor_id, NEW.id, NEW.vendor_payout, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_payout_on_payment
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION auto_create_payout();

-- ─── Reviews: prevent before booking complete ─────────────────────────────────
CREATE OR REPLACE FUNCTION check_review_allowed()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE id = NEW.booking_id
      AND customer_id = NEW.customer_id
      AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Reviews can only be submitted after the booking is completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_review_rules
  BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION check_review_allowed();
