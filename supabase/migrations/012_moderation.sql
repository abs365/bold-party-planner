-- ── 012_moderation.sql ─────────────────────────────────────────────────────
-- Moderation infrastructure: media moderation states, content reports,
-- platform announcements.

-- 1. Add moderation fields to vendor_media
ALTER TABLE vendor_media
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS flagged_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS flag_reason       TEXT,
  ADD COLUMN IF NOT EXISTS moderated_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by      UUID REFERENCES auth.users(id);

-- Auto-approve existing media so the queue isn't flooded on deploy
UPDATE vendor_media SET moderation_status = 'approved' WHERE moderation_status = 'pending';

-- 2. Content reports — any authenticated user can report any content
CREATE TABLE IF NOT EXISTS content_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      UUID NOT NULL REFERENCES auth.users(id),
  content_type     TEXT NOT NULL CHECK (content_type IN ('vendor_media', 'review', 'vendor', 'message')),
  content_id       UUID NOT NULL,
  vendor_id        UUID REFERENCES vendors(id),
  reason           TEXT NOT NULL CHECK (reason IN ('inappropriate', 'spam', 'misleading', 'offensive', 'copyright', 'other')),
  details          TEXT,
  status           TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  resolved_by      UUID REFERENCES auth.users(id),
  resolved_at      TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Platform announcements — admin-published, time-bounded notices
CREATE TABLE IF NOT EXISTS platform_announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info'
    CHECK (type IN ('info', 'warning', 'maintenance', 'feature')),
  audience    TEXT NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all', 'vendors', 'customers')),
  published   BOOLEAN DEFAULT false,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Row-level security
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;

-- Users can submit reports; cannot read others' reports (admin uses service role)
CREATE POLICY "Authenticated users can file reports"
  ON content_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can see their own past reports
CREATE POLICY "Users can see own reports"
  ON content_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Anyone authenticated can read published, active announcements
CREATE POLICY "Read published announcements"
  ON platform_announcements FOR SELECT
  TO authenticated
  USING (published = true AND (ends_at IS NULL OR ends_at > NOW()));

-- Service role has full access
CREATE POLICY "Service manages reports"
  ON content_reports FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service manages announcements"
  ON platform_announcements FOR ALL
  TO service_role
  USING (true);

-- 5. Indexes for fast admin queue lookups
CREATE INDEX IF NOT EXISTS content_reports_status
  ON content_reports (status) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS content_reports_content
  ON content_reports (content_type, content_id);

CREATE INDEX IF NOT EXISTS content_reports_vendor
  ON content_reports (vendor_id) WHERE vendor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS vendor_media_moderation
  ON vendor_media (moderation_status) WHERE moderation_status = 'pending';

-- 6. Grants
GRANT SELECT, INSERT ON content_reports TO authenticated;
GRANT SELECT ON platform_announcements TO authenticated;
GRANT ALL ON content_reports TO service_role;
GRANT ALL ON platform_announcements TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;

NOTIFY pgrst, 'reload schema';
