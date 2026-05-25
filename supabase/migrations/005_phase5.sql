-- ═══════════════════════════════════════════════════════
-- Phase 5: Guest Management, Invitations & Experience Polish
-- ═══════════════════════════════════════════════════════

-- ── Guests ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guests (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id        UUID        REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  customer_id     UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  full_name       TEXT        NOT NULL,
  email           TEXT,
  phone           TEXT,
  rsvp_status     TEXT        DEFAULT 'pending'
                              CHECK (rsvp_status IN ('pending','accepted','declined','tentative')),
  is_vip          BOOLEAN     DEFAULT false,
  plus_one_allowed BOOLEAN    DEFAULT false,
  plus_one_name   TEXT,
  meal_preference TEXT,
  dietary_notes   TEXT,
  tags            TEXT[]      DEFAULT '{}',
  notes           TEXT,
  invited_at      TIMESTAMPTZ,
  responded_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Invitations ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id        UUID        REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  customer_id     UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template        TEXT        DEFAULT 'classic'
                              CHECK (template IN ('classic','elegant','playful','minimal','luxury')),
  title           TEXT,
  message         TEXT,
  dress_code      TEXT,
  rsvp_deadline   DATE,
  cover_image_url TEXT,
  rsvp_token      TEXT        UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex') NOT NULL,
  is_active       BOOLEAN     DEFAULT true,
  view_count      INTEGER     DEFAULT 0,
  rsvp_count      INTEGER     DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── RSVP Responses ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rsvp_responses (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id   UUID        REFERENCES invitations(id) ON DELETE CASCADE NOT NULL,
  guest_id        UUID        REFERENCES guests(id) ON DELETE SET NULL,
  guest_name      TEXT        NOT NULL,
  email           TEXT,
  status          TEXT        DEFAULT 'accepted'
                              CHECK (status IN ('accepted','declined','tentative')),
  plus_one        BOOLEAN     DEFAULT false,
  meal_preference TEXT,
  message         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Invitation Views ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitation_views (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id   UUID        REFERENCES invitations(id) ON DELETE CASCADE NOT NULL,
  user_agent      TEXT,
  viewed_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Event Guest Stats View ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW event_guest_stats AS
SELECT
  g.event_id,
  COUNT(*)                                              AS total_guests,
  COUNT(*) FILTER (WHERE g.rsvp_status = 'accepted')   AS accepted,
  COUNT(*) FILTER (WHERE g.rsvp_status = 'declined')   AS declined,
  COUNT(*) FILTER (WHERE g.rsvp_status = 'tentative')  AS tentative,
  COUNT(*) FILTER (WHERE g.rsvp_status = 'pending')    AS pending,
  COUNT(*) FILTER (WHERE g.is_vip = true)              AS vip_count,
  COUNT(*) FILTER (WHERE g.plus_one_allowed = true AND g.plus_one_name IS NOT NULL) AS plus_ones_confirmed
FROM guests g
GROUP BY g.event_id;

-- ── Notification Improvements ─────────────────────────────────────────────────
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE guests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_responses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_views ENABLE ROW LEVEL SECURITY;

-- Guests: only the owning customer
DROP POLICY IF EXISTS "customers_own_guests" ON guests;
CREATE POLICY "customers_own_guests" ON guests
  FOR ALL USING (customer_id = auth.uid());

-- Invitations: only the owning customer for write; anyone can read active ones
DROP POLICY IF EXISTS "customers_own_invitations" ON invitations;
CREATE POLICY "customers_own_invitations" ON invitations
  FOR ALL USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "public_read_active_invitations" ON invitations;
CREATE POLICY "public_read_active_invitations" ON invitations
  FOR SELECT USING (is_active = true);

-- RSVP responses: anyone can insert; owner can read
DROP POLICY IF EXISTS "anyone_can_rsvp" ON rsvp_responses;
CREATE POLICY "anyone_can_rsvp" ON rsvp_responses
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "owner_reads_rsvp" ON rsvp_responses;
CREATE POLICY "owner_reads_rsvp" ON rsvp_responses
  FOR SELECT USING (
    invitation_id IN (SELECT id FROM invitations WHERE customer_id = auth.uid())
  );

-- Views: anyone can insert; owner can read
DROP POLICY IF EXISTS "anyone_tracks_view" ON invitation_views;
CREATE POLICY "anyone_tracks_view" ON invitation_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "owner_reads_views" ON invitation_views;
CREATE POLICY "owner_reads_views" ON invitation_views
  FOR SELECT USING (
    invitation_id IN (SELECT id FROM invitations WHERE customer_id = auth.uid())
  );

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_guests_event_id     ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_customer_id  ON guests(customer_id);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status  ON guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_invitations_event   ON invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token   ON invitations(rsvp_token);
CREATE INDEX IF NOT EXISTS idx_rsvp_invitation_id  ON rsvp_responses(invitation_id);
CREATE INDEX IF NOT EXISTS idx_inv_views_inv_id    ON invitation_views(invitation_id);
