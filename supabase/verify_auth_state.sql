-- Verification queries for *.demo auth state
-- Run in Supabase Dashboard → SQL Editor to inspect before/after cleanup.

-- ── 1. auth.users ──────────────────────────────────────────────────────────────
SELECT
  id,
  email,
  LENGTH(encrypted_password) AS pw_len,
  email_confirmed_at IS NOT NULL AS email_confirmed,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email LIKE '%@elbold.demo'
ORDER BY email;

-- ── 2. auth.identities (orphaned rows here cause "Database error checking email") ──
SELECT
  user_id,
  identity_data->>'email' AS email,
  provider,
  created_at
FROM auth.identities
WHERE identity_data->>'email' LIKE '%@elbold.demo'
ORDER BY 2;

-- ── 3. auth.sessions ───────────────────────────────────────────────────────────
SELECT user_id, created_at, not_after
FROM auth.sessions
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@elbold.demo'
)
ORDER BY created_at DESC;

-- ── 4. auth.refresh_tokens ─────────────────────────────────────────────────────
SELECT user_id, created_at, revoked
FROM auth.refresh_tokens
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@elbold.demo'
)
ORDER BY created_at DESC;

-- ── 5. auth.mfa_factors ────────────────────────────────────────────────────────
SELECT user_id, factor_type, status, created_at
FROM auth.mfa_factors
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@elbold.demo'
);

-- ── 6. profiles ────────────────────────────────────────────────────────────────
SELECT id, email, role, full_name, created_at
FROM profiles
WHERE email LIKE '%@elbold.demo'
ORDER BY email;

-- ── 7. vendors ─────────────────────────────────────────────────────────────────
SELECT v.id, v.user_id, p.email, v.business_name, v.status, v.created_at
FROM vendors v
JOIN profiles p ON p.id = v.user_id
WHERE p.email LIKE '%@elbold.demo'
ORDER BY p.email;

-- ── 8. Summary counts across all tables ────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM auth.users        WHERE email LIKE '%@elbold.demo')                                              AS auth_users,
  (SELECT COUNT(*) FROM auth.identities   WHERE identity_data->>'email' LIKE '%@elbold.demo')                            AS auth_identities,
  (SELECT COUNT(*) FROM auth.sessions     WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@elbold.demo')) AS auth_sessions,
  (SELECT COUNT(*) FROM auth.refresh_tokens WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@elbold.demo')) AS auth_refresh_tokens,
  (SELECT COUNT(*) FROM auth.mfa_factors  WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@elbold.demo')) AS auth_mfa_factors,
  (SELECT COUNT(*) FROM profiles          WHERE email LIKE '%@elbold.demo')                                              AS profiles,
  (SELECT COUNT(*) FROM vendors v JOIN profiles p ON p.id = v.user_id WHERE p.email LIKE '%@elbold.demo')                AS vendors;
