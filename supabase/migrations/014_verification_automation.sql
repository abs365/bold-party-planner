-- ============================================================
-- 014_verification_automation.sql
-- Phase 18: Secure Verification Infrastructure & Automation
-- ============================================================

-- 1. Add metrics_updated_at to vendors
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS metrics_updated_at TIMESTAMPTZ;

-- 2. Private storage bucket for verification documents
-- File size limit: 10MB. Allowed types: PDF, JPG, PNG, WebP.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS — vendors upload/read only their own folder
--    Path convention: verification/{vendorId}/{docType}/{filename}
DROP POLICY IF EXISTS "verif_vendor_upload"   ON storage.objects;
CREATE POLICY "verif_vendor_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = 'verification'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM vendors WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "verif_vendor_read_own" ON storage.objects;
CREATE POLICY "verif_vendor_read_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = 'verification'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM vendors WHERE user_id = auth.uid()
    )
  );

-- 4. Admin alerts table
CREATE TABLE IF NOT EXISTS admin_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL CHECK (type IN (
    'verification_submitted', 'vendor_flagged', 'verification_expiring',
    'multiple_reports', 'level_upgraded', 'suspicious_activity',
    'resubmission_received'
  )),
  title           TEXT NOT NULL,
  body            TEXT,
  vendor_id       UUID REFERENCES vendors(id) ON DELETE CASCADE,
  verification_id UUID REFERENCES vendor_verifications(id) ON DELETE SET NULL,
  severity        TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'danger')),
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_alerts_unread
  ON admin_alerts(read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_admin_alerts_created
  ON admin_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_vendor
  ON admin_alerts(vendor_id);

NOTIFY pgrst, 'reload schema';
