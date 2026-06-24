-- ── Migration 065: Phase 70D.6 Stage 1 — Global Admin assignment ──────────────
-- Date: 2026-06-24
-- Actor: Founder Admin (blue2gtv@gmail.com, af0c7d7c-89b9-4079-b130-cdfdd9d356f4)
-- Subject: tosinlawal05@gmail.com (4e6d14b5-24a4-4c90-ab66-98c689bfe1f6)
-- Role: global_admin
--
-- Pre-assignment checks (verified before migration creation):
--   [1] blue2gtv@gmail.com present in ADMIN_EMAILS env var (.env.local confirmed)
--   [2] tosinlawal05@gmail.com exists in auth.users (id: 4e6d14b5-...)
--   [3] No active admin_role for tosinlawal05@gmail.com (admin_roles count = 0)
--
-- Mechanism:
--   CTE inserts into admin_roles and returns the new id.
--   Governance decision is inserted in the same transaction, referencing that id.
--   governance_decisions has an immutability trigger (blocks UPDATE/DELETE);
--   INSERT proceeds normally.
--
-- Authorisation:
--   Only Founder can grant global_admin (enforced in POST /api/admin/team:55).
--   This migration executes as the Founder-equivalent bootstrap actor.

BEGIN;

WITH inserted_role AS (
  INSERT INTO admin_roles (
    user_id,
    role,
    granted_by,
    notes
  )
  VALUES (
    '4e6d14b5-24a4-4c90-ab66-98c689bfe1f6',   -- tosinlawal05@gmail.com
    'global_admin',
    'af0c7d7c-89b9-4079-b130-cdfdd9d356f4',   -- blue2gtv@gmail.com (Founder)
    'Phase 70D.6 Stage 1 — Initial Global Admin assignment authorised by Founder'
  )
  RETURNING id
)
INSERT INTO governance_decisions (
  actor_user_id,
  actor_email,
  actor_role,
  action_type,
  entity_type,
  entity_id,
  new_status,
  admin_notes,
  is_automated,
  handbook_section
)
SELECT
  'af0c7d7c-89b9-4079-b130-cdfdd9d356f4',
  'blue2gtv@gmail.com',
  'founder',
  'role.granted',
  'admin_role',
  id,
  'global_admin',
  'Phase 70D.6 Stage 1 — tosinlawal05@gmail.com assigned global_admin. Authorised by Founder.',
  false,
  NULL
FROM inserted_role;

COMMIT;
