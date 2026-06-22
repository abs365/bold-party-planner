-- Migration 051: Vendor Customer Notes
-- Vendor-private notes scoped to a specific customer relationship.
-- Each vendor's notes are completely invisible to other vendors and to customers.
-- Architecture recommendation presented in Phase 69B closure report.

CREATE TABLE vendor_customer_notes (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id   UUID         NOT NULL REFERENCES vendors(id)  ON DELETE CASCADE,
  customer_id UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note        TEXT         NOT NULL CHECK (char_length(trim(note)) > 0),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vcn_vendor_customer ON vendor_customer_notes(vendor_id, customer_id);
CREATE INDEX idx_vcn_created_at      ON vendor_customer_notes(created_at DESC);

CREATE OR REPLACE FUNCTION update_vcn_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vcn_updated_at
  BEFORE UPDATE ON vendor_customer_notes
  FOR EACH ROW EXECUTE FUNCTION update_vcn_updated_at();

ALTER TABLE vendor_customer_notes ENABLE ROW LEVEL SECURITY;

-- A vendor can only see and write notes scoped to their own vendor account.
-- The WITH CHECK ensures a vendor cannot insert notes attributed to another vendor.
CREATE POLICY "vcn_vendor_own" ON vendor_customer_notes
  FOR ALL TO authenticated
  USING   (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

NOTIFY pgrst, 'reload schema';
