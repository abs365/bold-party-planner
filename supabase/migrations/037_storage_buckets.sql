-- Migration 037: Ensure vendor media storage buckets exist + RLS policies
-- Buckets are created idempotently via ON CONFLICT DO NOTHING.
-- Policies use DROP IF EXISTS + CREATE (PostgreSQL-compatible on all versions).
-- NOTE: CREATE POLICY IF NOT EXISTS is NOT valid syntax — do not use it.

-- ── Buckets ───────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-images',
  'vendor-images',
  true,
  104857600,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-videos',
  'vendor-videos',
  true,
  104857600,
  ARRAY['video/mp4','video/quicktime','video/webm','video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- ── vendor-images RLS policies ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can upload vendor images" ON storage.objects;
CREATE POLICY "Authenticated users can upload vendor images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vendor-images');

DROP POLICY IF EXISTS "Public can read vendor images" ON storage.objects;
CREATE POLICY "Public can read vendor images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'vendor-images');

DROP POLICY IF EXISTS "Vendors can delete own images" ON storage.objects;
CREATE POLICY "Vendors can delete own images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'vendor-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ── vendor-videos RLS policies ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can upload vendor videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload vendor videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vendor-videos');

DROP POLICY IF EXISTS "Public can read vendor videos" ON storage.objects;
CREATE POLICY "Public can read vendor videos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'vendor-videos');

DROP POLICY IF EXISTS "Vendors can delete own videos" ON storage.objects;
CREATE POLICY "Vendors can delete own videos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'vendor-videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

NOTIFY pgrst, 'reload schema';
