-- Migration 029: Storage bucket RLS policies for vendor media uploads
--
-- IMPORTANT — Run this AFTER creating the buckets manually in the Supabase Dashboard:
--   Storage > Create bucket > "vendor-images"  (public: true)
--   Storage > Create bucket > "vendor-videos"  (public: true)
--
-- These policies allow the /api/uploads route's auth-aware client to work.
-- The upload API also uses the service-role (admin) client, so uploads succeed
-- even before these policies are applied. These policies are belt-and-suspenders
-- and provide defence-in-depth.

-- ── vendor-images ─────────────────────────────────────────────────────────────

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

-- ── vendor-videos ─────────────────────────────────────────────────────────────

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
