-- 050_vendor_slugs.sql
-- Adds slug-based public URLs for vendor profiles.
-- Enables /vendors/[slug] routing alongside legacy /vendors/[uuid].
-- Creates redirect history so old slugs continue to resolve after name changes.

-- ── 1. Slug column ───────────────────────────────────────────────────────────
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS slug TEXT;

-- ── 2. Redirect history ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_slug_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   UUID        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  old_slug    TEXT        NOT NULL,
  replaced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_slug_history_vendor_id ON vendor_slug_history(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_slug_history_old_slug  ON vendor_slug_history(old_slug);

-- ── 3. Slug generation function ──────────────────────────────────────────────
-- Produces a unique, lowercase, hyphen-separated slug from a business name.
-- Appends numeric suffix to resolve collisions: my-dj, my-dj-1, my-dj-2 …
CREATE OR REPLACE FUNCTION generate_vendor_slug(p_name TEXT, p_vendor_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  base_slug  TEXT;
  candidate  TEXT;
  suffix_num INT := 1;
BEGIN
  -- normalise: lowercase, strip non-alphanumeric (keep spaces/hyphens), collapse to single hyphens
  base_slug := lower(trim(p_name));
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s\-]', '', 'g');
  base_slug := regexp_replace(base_slug, '[\s\-]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  base_slug := left(base_slug, 60);
  IF base_slug = '' THEN base_slug := 'vendor'; END IF;

  candidate := base_slug;
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM vendors WHERE slug = candidate AND id <> p_vendor_id
    );
    candidate := base_slug || '-' || suffix_num;
    suffix_num := suffix_num + 1;
  END LOOP;

  RETURN candidate;
END;
$$;

-- ── 4. Backfill slugs for all existing vendors ───────────────────────────────
UPDATE vendors
SET    slug = generate_vendor_slug(business_name, id)
WHERE  slug IS NULL;

-- ── 5. Enforce NOT NULL + UNIQUE ─────────────────────────────────────────────
ALTER TABLE vendors ALTER COLUMN slug SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE  conname = 'vendors_slug_key' AND conrelid = 'vendors'::regclass
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(slug);

-- ── 6. RLS for slug history ───────────────────────────────────────────────────
ALTER TABLE vendor_slug_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendor reads own slug history"         ON vendor_slug_history;
DROP POLICY IF EXISTS "Service role full access slug history" ON vendor_slug_history;

CREATE POLICY "Vendor reads own slug history"
  ON vendor_slug_history FOR SELECT TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role full access slug history"
  ON vendor_slug_history FOR ALL TO service_role
  USING (true) WITH CHECK (true);
