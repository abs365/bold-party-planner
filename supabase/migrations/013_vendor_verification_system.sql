-- ============================================================
-- 013_vendor_verification_system.sql
-- Phase 17: Vendor Trust & Verification System
-- ============================================================

-- 1. Extend vendors table with trust metrics and verification level
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS verification_level     INTEGER NOT NULL DEFAULT 0
    CHECK (verification_level BETWEEN 0 AND 4),
  ADD COLUMN IF NOT EXISTS response_rate          DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS completed_jobs_count   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_rate      DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS first_booking_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspicious_flag        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS suspicious_reason      TEXT,
  ADD COLUMN IF NOT EXISTS last_active_at         TIMESTAMPTZ;

-- 2. Expand vendor_verifications with new document types and admin fields
ALTER TABLE vendor_verifications
  DROP CONSTRAINT IF EXISTS vendor_verifications_type_check;

ALTER TABLE vendor_verifications
  ADD CONSTRAINT vendor_verifications_type_check
    CHECK (type IN (
      'identity', 'business', 'insurance', 'portfolio',
      'government_id', 'food_hygiene', 'sia_license',
      'operator_license', 'business_registration',
      'proof_of_address', 'bank_verification',
      'portfolio_authenticity'
    ));

ALTER TABLE vendor_verifications
  ADD COLUMN IF NOT EXISTS rejection_reason      TEXT,
  ADD COLUMN IF NOT EXISTS resubmission_allowed  BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS resubmit_count        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_notes           TEXT,
  ADD COLUMN IF NOT EXISTS expires_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_approved         BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. verification_documents: multiple files per verification record
CREATE TABLE IF NOT EXISTS verification_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id  UUID NOT NULL REFERENCES vendor_verifications(id) ON DELETE CASCADE,
  vendor_id        UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  document_type    TEXT NOT NULL,
  file_url         TEXT NOT NULL,
  file_name        TEXT,
  file_size        INTEGER,
  mime_type        TEXT,
  is_primary       BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. verification_activity_log: full audit trail
CREATE TABLE IF NOT EXISTS verification_activity_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  verification_id  UUID REFERENCES vendor_verifications(id) ON DELETE SET NULL,
  actor_id         UUID REFERENCES auth.users(id),
  actor_type       TEXT NOT NULL CHECK (actor_type IN ('vendor', 'admin', 'system')),
  action           TEXT NOT NULL CHECK (action IN (
    'submitted', 'resubmitted', 'approved', 'rejected',
    'flagged', 'unflagged', 'level_upgraded', 'level_downgraded',
    'document_uploaded', 'document_deleted', 'notes_added',
    'resubmission_requested', 'auto_approved', 'suspended'
  )),
  old_status       TEXT,
  new_status       TEXT,
  old_level        INTEGER,
  new_level        INTEGER,
  notes            TEXT,
  metadata         JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_verif_vendor_status
  ON vendor_verifications(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_verif_status
  ON vendor_verifications(status);
CREATE INDEX IF NOT EXISTS idx_verif_docs_verification
  ON verification_documents(verification_id);
CREATE INDEX IF NOT EXISTS idx_verif_docs_vendor
  ON verification_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_verif_activity_vendor
  ON verification_activity_log(vendor_id);
CREATE INDEX IF NOT EXISTS idx_verif_activity_created
  ON verification_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendors_verif_level
  ON vendors(verification_level);
CREATE INDEX IF NOT EXISTS idx_vendors_suspicious
  ON vendors(suspicious_flag) WHERE suspicious_flag = TRUE;

-- 6. RLS for verification_documents
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_own_documents_select" ON verification_documents
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "vendor_own_documents_insert" ON verification_documents
  FOR INSERT WITH CHECK (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "vendor_own_documents_delete" ON verification_documents
  FOR DELETE USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- 7. RLS for verification_activity_log (read-only for vendors)
ALTER TABLE verification_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_own_activity_select" ON verification_activity_log
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

NOTIFY pgrst, 'reload schema';
