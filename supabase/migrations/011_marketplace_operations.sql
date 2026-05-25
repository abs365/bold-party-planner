-- ═══════════════════════════════════════════════════════════════
-- Migration 011: Marketplace Operations + Automation Foundations
-- Run AFTER migrations 001–010
-- ═══════════════════════════════════════════════════════════════

-- ── Vendor operational metrics ────────────────────────────────────────────────
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS response_rate        NUMERIC(4,3)  DEFAULT 0.5 CHECK (response_rate >= 0 AND response_rate <= 1);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS avg_response_hours   NUMERIC(6,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS lead_count           INTEGER       DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS conversion_count     INTEGER       DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS conversion_rate      NUMERIC(4,3)  DEFAULT 0;

-- ── Quote intelligence fields ─────────────────────────────────────────────────
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS lead_score           INTEGER        DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS routed_at            TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS responded_at         TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS accepted_at          TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS viewed_at            TIMESTAMPTZ;

-- ── Event enrichment ──────────────────────────────────────────────────────────
ALTER TABLE events ADD COLUMN IF NOT EXISTS postcode             TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS setting              TEXT DEFAULT 'indoor' CHECK (setting IN ('indoor', 'outdoor', 'both'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS vendor_needs         TEXT[]  DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS rfq_sent_at          TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rfq_count            INTEGER DEFAULT 0;

-- ── Lead routing log ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_routing_log (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id        UUID          REFERENCES quotes(id) ON DELETE CASCADE,
  vendor_id       UUID          REFERENCES vendors(id) ON DELETE CASCADE,
  routing_reason  TEXT,
  score           INTEGER,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE lead_routing_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_routing_service_only" ON lead_routing_log FOR ALL USING (false);

-- ── Vendor saved by customers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_vendors (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id     UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id       UUID          NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE (customer_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_vendors_customer ON saved_vendors(customer_id);

ALTER TABLE saved_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_vendors_customer_all" ON saved_vendors FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "saved_vendors_vendor_read" ON saved_vendors FOR SELECT
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- ── Vendor invitations table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_invitations (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id        UUID          REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  sender_id       UUID          REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_email TEXT,
  recipient_id    UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  token           TEXT          UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status          TEXT          DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  message         TEXT,
  rsvp_at         TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ   DEFAULT NOW() + INTERVAL '30 days',
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_event ON event_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON event_invitations(token);

ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invitations_sender_all" ON event_invitations FOR ALL USING (auth.uid() = sender_id);
CREATE POLICY "invitations_recipient_read" ON event_invitations FOR SELECT USING (auth.uid() = recipient_id);

-- ── Grant access to new tables ────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON saved_vendors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_invitations TO authenticated;
GRANT SELECT ON saved_vendors TO anon;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
