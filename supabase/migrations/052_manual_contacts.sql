-- Migration 052: manual_contacts + manual_contact_notes
-- Additive foundation for Vendor-Owned Contacts (Phase 69C Stage A).
-- No changes to bookings, events, financial_ledger, or any NOT NULL constraint.

-- ── manual_contacts ───────────────────────────────────────────────────────────
-- Stores off-platform contacts managed by vendors.
-- Decoupled from auth.users by design: a manual contact does not need an Elbold account.
-- linked_profile_id is set only if the contact later registers on Elbold.

CREATE TABLE manual_contacts (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id         UUID         NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  display_name      TEXT         NOT NULL CHECK (char_length(trim(display_name)) > 0),
  display_email     TEXT         CHECK (display_email IS NULL OR display_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  display_phone     TEXT,
  source            TEXT         NOT NULL DEFAULT 'direct'
    CHECK (source IN (
      'instagram','facebook','tiktok','whatsapp',
      'referral','existing_customer','direct','other'
    )),
  source_detail     TEXT,
  notes             TEXT,
  linked_profile_id UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  is_archived       BOOLEAN      NOT NULL DEFAULT FALSE,
  gdpr_anonymised   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_manual_contacts_vendor_id      ON manual_contacts(vendor_id);
CREATE INDEX idx_manual_contacts_linked_profile ON manual_contacts(linked_profile_id);
CREATE INDEX idx_manual_contacts_source         ON manual_contacts(source);
CREATE INDEX idx_manual_contacts_is_archived    ON manual_contacts(is_archived);
CREATE INDEX idx_manual_contacts_created_at     ON manual_contacts(created_at DESC);

CREATE OR REPLACE FUNCTION update_manual_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manual_contacts_updated_at
  BEFORE UPDATE ON manual_contacts
  FOR EACH ROW EXECUTE FUNCTION update_manual_contacts_updated_at();

ALTER TABLE manual_contacts ENABLE ROW LEVEL SECURITY;

-- Vendor can read their own contacts only
CREATE POLICY "mc_vendor_select" ON manual_contacts FOR SELECT
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Vendor can create contacts for themselves
CREATE POLICY "mc_vendor_insert" ON manual_contacts FOR INSERT
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Vendor can update their own contacts
CREATE POLICY "mc_vendor_update" ON manual_contacts FOR UPDATE
  USING  (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Vendor can delete their own contacts
CREATE POLICY "mc_vendor_delete" ON manual_contacts FOR DELETE
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));


-- ── manual_contact_notes ──────────────────────────────────────────────────────
-- Private notes a vendor records about a manual contact.
-- Kept separate from vendor_customer_notes (which requires a profiles.id FK)
-- to avoid any constraint changes to existing tables in Stage A.

CREATE TABLE manual_contact_notes (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id         UUID         NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  manual_contact_id UUID         NOT NULL REFERENCES manual_contacts(id) ON DELETE CASCADE,
  note              TEXT         NOT NULL CHECK (char_length(trim(note)) > 0),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mcn_vendor_id   ON manual_contact_notes(vendor_id);
CREATE INDEX idx_mcn_contact_id  ON manual_contact_notes(manual_contact_id);
CREATE INDEX idx_mcn_created_at  ON manual_contact_notes(created_at DESC);

CREATE OR REPLACE FUNCTION update_mcn_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mcn_updated_at
  BEFORE UPDATE ON manual_contact_notes
  FOR EACH ROW EXECUTE FUNCTION update_mcn_updated_at();

ALTER TABLE manual_contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mcn_vendor_select" ON manual_contact_notes FOR SELECT
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "mcn_vendor_insert" ON manual_contact_notes FOR INSERT
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "mcn_vendor_delete" ON manual_contact_notes FOR DELETE
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));
