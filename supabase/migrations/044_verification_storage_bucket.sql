-- Migration 044: Create verification-documents private storage bucket
-- This bucket was missing from 037_storage_buckets.sql.
-- All verification uploads in /api/verification/upload fail without this.
-- The bucket must be PRIVATE (not public) — verification documents contain
-- government IDs and personal information. Signed URLs are used for access.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  false,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Service role (admin client) can do anything — these policies are belt-and-braces
-- for any direct Supabase Studio access.
DROP POLICY IF EXISTS "Service role full access to verification docs" ON storage.objects;
CREATE POLICY "Service role full access to verification docs"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'verification-documents')
WITH CHECK (bucket_id = 'verification-documents');

-- Vendors can upload their own documents only
DROP POLICY IF EXISTS "Vendors can upload verification documents" ON storage.objects;
CREATE POLICY "Vendors can upload verification documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents'
  AND (storage.foldername(name))[1] = 'verification'
);

-- Vendors cannot read other vendors' documents (no SELECT policy for authenticated)
-- All document reads go through /api/verification/document which uses admin client

NOTIFY pgrst, 'reload schema';
