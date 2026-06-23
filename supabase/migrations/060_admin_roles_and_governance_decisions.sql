-- ── Migration 060: admin_roles + governance_decisions ───────────────────────
-- Phase 70D.4 — Governance Decision Log Implementation
-- Applied: 2026-06-23
-- No existing tables altered. Additive only.

-- ── admin_roles ──────────────────────────────────────────────────────────────
-- Non-Founder admin role assignments. Founder role is NOT stored here —
-- it is exclusively derived from ADMIN_EMAILS env var at runtime.

CREATE TABLE IF NOT EXISTS admin_roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL
                CHECK (role IN ('global_admin', 'ops_admin', 'reviewer')),
  granted_by  UUID        NOT NULL REFERENCES auth.users(id),
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_by  UUID        REFERENCES auth.users(id),
  revoked_at  TIMESTAMPTZ,
  notes       TEXT
);

-- One active role per user at a time (revoked_at IS NULL = active)
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_roles_active_user
  ON admin_roles(user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id    ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role        ON admin_roles(role) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_roles_granted_by  ON admin_roles(granted_by);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can see active role assignments (admin reads use service role anyway)
CREATE POLICY "admin_roles_read"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (revoked_at IS NULL);

-- All writes go through service role (createAdminClient) — no authenticated write policy

-- ── governance_decisions ─────────────────────────────────────────────────────
-- Immutable, append-only ledger of every human governance decision.
-- actor_user_id is TEXT (not UUID) to allow the sentinel value "system"
-- for automated cron-driven governance actions.

CREATE TABLE IF NOT EXISTS governance_decisions (
  -- Identity
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Actor (denormalized at write time — snapshot of who acted)
  actor_user_id         TEXT        NOT NULL,
  actor_email           TEXT        NOT NULL,
  actor_name            TEXT,
  actor_role            TEXT        NOT NULL
    CHECK (actor_role IN ('founder', 'global_admin', 'ops_admin', 'reviewer', 'system')),

  -- Action
  action_type           TEXT        NOT NULL,
  entity_type           TEXT        NOT NULL
    CHECK (entity_type IN (
      'vendor', 'vendor_verification', 'customer',
      'subscription', 'admin_role', 'review',
      'dispute', 'appeal', 'payout'
    )),
  entity_id             TEXT        NOT NULL,

  -- State change
  previous_status       TEXT,
  new_status            TEXT,

  -- Decision content
  reason                TEXT,
  handbook_section      TEXT,
  admin_notes           TEXT,

  -- Evidence (array of {type, ref, description})
  evidence_refs         JSONB       NOT NULL DEFAULT '[]'::jsonb,

  -- Linkage
  related_decision_id   UUID        REFERENCES governance_decisions(id),
  appeal_outcome_for    UUID        REFERENCES governance_decisions(id),

  -- Technical context
  ip_address            TEXT,
  is_automated          BOOLEAN     NOT NULL DEFAULT FALSE,
  handbook_version      TEXT        NOT NULL DEFAULT '1.0'
);

-- ── Immutability trigger ──────────────────────────────────────────────────────
-- Fires for ALL callers including service role. The only bypass is
-- SET session_replication_role = replica via direct DB connection
-- (requires Supabase dashboard access — Founder Admin only).

CREATE OR REPLACE FUNCTION prevent_governance_modification()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'governance_decisions is an immutable audit ledger. '
    'Records cannot be modified or deleted. '
    'Create a new record with action_type = ''admin.correction'' instead.'
    USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER trg_governance_immutable
  BEFORE UPDATE OR DELETE ON governance_decisions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_governance_modification();

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_gov_entity
  ON governance_decisions(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gov_actor
  ON governance_decisions(actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gov_action
  ON governance_decisions(action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gov_role
  ON governance_decisions(actor_role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gov_appeal
  ON governance_decisions(appeal_outcome_for)
  WHERE appeal_outcome_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gov_related
  ON governance_decisions(related_decision_id)
  WHERE related_decision_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gov_created
  ON governance_decisions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gov_automated
  ON governance_decisions(is_automated, created_at DESC)
  WHERE is_automated = TRUE;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE governance_decisions ENABLE ROW LEVEL SECURITY;

-- Users with an active admin_roles entry can read via authenticated key.
-- Founders use service role (bypasses RLS) so no Founder-specific policy needed.
CREATE POLICY "gov_decisions_read"
  ON governance_decisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
        AND revoked_at IS NULL
    )
  );

-- No INSERT/UPDATE/DELETE policy for authenticated.
-- All inserts go through service role (createAdminClient).
-- UPDATE/DELETE are blocked by trigger regardless of caller.
