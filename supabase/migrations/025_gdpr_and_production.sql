-- ── Migration 025: GDPR compliance + production hardening ─────────────────────
-- Cookie consent tracking, account deletion audit, and production safety tables.

-- ── Cookie consents ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cookie_consents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id    TEXT,
  choice        TEXT NOT NULL CHECK (choice IN ('all', 'necessary')),
  ip_hash       TEXT,                           -- SHA-256 of IP, not raw IP
  user_agent    TEXT,
  consented_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '12 months',
  CONSTRAINT cookie_consents_user_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_cookie_consents_user ON cookie_consents(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own consent" ON cookie_consents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role full access" ON cookie_consents
  FOR ALL USING (auth.role() = 'service_role');

-- ── Account deletion audit ────────────────────────────────────────────────────
-- Records GDPR deletion/anonymisation requests for regulatory audit.
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,                 -- not FK — user may be deleted
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'anonymised', 'failed')),
  reason          TEXT,                          -- optional user-provided reason
  retained_records JSONB DEFAULT '[]'            -- list of record types retained for legal hold
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON account_deletion_requests(user_id);

ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on deletions" ON account_deletion_requests
  FOR ALL USING (auth.role() = 'service_role');

-- ── Stripe events idempotency table ──────────────────────────────────────────
-- Ensures webhook events are processed exactly once.
-- May already exist from earlier migrations; safe to CREATE IF NOT EXISTS.
CREATE TABLE IF NOT EXISTS stripe_events (
  id           TEXT PRIMARY KEY,                 -- Stripe event ID
  type         TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Vendor governance flags (if 022 not yet applied) ─────────────────────────
-- These are created by 022_vendor_governance.sql. Listed here as a safety net
-- for environments where 022 was skipped.
CREATE TABLE IF NOT EXISTS vendor_governance_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  flag_type   TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_open     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_governance_flags_vendor ON vendor_governance_flags(vendor_id, is_open);

ALTER TABLE vendor_governance_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on governance flags" ON vendor_governance_flags
  FOR ALL USING (auth.role() = 'service_role');

-- ── Grant service role access ─────────────────────────────────────────────────
GRANT ALL ON cookie_consents           TO service_role;
GRANT ALL ON account_deletion_requests TO service_role;
GRANT ALL ON stripe_events             TO service_role;
GRANT ALL ON vendor_governance_flags   TO service_role;
