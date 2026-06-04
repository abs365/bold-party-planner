-- Migration 037: Ensure vendor media storage buckets exist
-- The vendor-images and vendor-videos buckets must exist before uploads work.
-- Previously documented as "create manually in dashboard" — this migration
-- makes them idempotent and part of the tracked migration chain.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-images',
  'vendor-images',
  true,
  104857600,  -- 100 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-videos',
  'vendor-videos',
  true,
  104857600,  -- 100 MB
  ARRAY['video/mp4','video/quicktime','video/webm','video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies — idempotent (re-runs are safe via IF NOT EXISTS)
-- Note: the upload API uses service-role (admin) client which bypasses RLS.
-- These policies provide defence-in-depth for direct client access.

CREATE POLICY IF NOT EXISTS "Authenticated users can upload vendor images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vendor-images');

CREATE POLICY IF NOT EXISTS "Public can read vendor images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'vendor-images');

CREATE POLICY IF NOT EXISTS "Vendors can delete own images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'vendor-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Authenticated users can upload vendor videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vendor-videos');

CREATE POLICY IF NOT EXISTS "Public can read vendor videos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'vendor-videos');

CREATE POLICY IF NOT EXISTS "Vendors can delete own videos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'vendor-videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

NOTIFY pgrst, 'reload schema';
