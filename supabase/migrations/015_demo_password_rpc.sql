-- Fix seed.sql users: their encrypted_password is a malformed bcrypt hash (57 chars,
-- needs 60) that causes PostgreSQL's crypt() to throw during GoTrue authentication,
-- resulting in "Database error querying schema" for ALL sign-in attempts.
--
-- This migration:
--  1. Enables pgcrypto (needed for crypt/gen_salt)
--  2. Immediately fixes all 8 seed user passwords in-place
--  3. Creates set_demo_user_password() RPC so /api/auth/create-demo-users can
--     re-apply the correct password idempotently on each test run

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix the malformed hashes immediately so tests can run after this migration
DO $$
DECLARE
  demo_password TEXT := 'BoldPartyDemo2026!';
  demo_emails TEXT[] := ARRAY[
    'james.bennett@boldparty.demo',
    'sofia.martinez@boldparty.demo',
    'ravi.patel@boldparty.demo',
    'charlotte.hughes@boldparty.demo',
    'marcus.thompson@boldparty.demo',
    'emily.carter@boldparty.demo',
    'oliver.webb@boldparty.demo',
    'priya.singh@boldparty.demo'
  ];
  e TEXT;
BEGIN
  FOREACH e IN ARRAY demo_emails LOOP
    UPDATE auth.users
    SET
      encrypted_password = crypt(demo_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      is_anonymous       = COALESCE(is_anonymous, FALSE),
      is_sso_user        = COALESCE(is_sso_user, FALSE),
      updated_at         = NOW()
    WHERE email = e;
  END LOOP;
END;
$$;

-- RPC for ongoing use by /api/auth/create-demo-users on each test run
CREATE OR REPLACE FUNCTION set_demo_user_password(p_email TEXT, p_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = p_email LIMIT 1;
  IF v_id IS NULL THEN
    RETURN 'not_found';
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = crypt(p_password, gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    is_anonymous       = COALESCE(is_anonymous, FALSE),
    is_sso_user        = COALESCE(is_sso_user, FALSE),
    updated_at         = NOW()
  WHERE id = v_id;

  RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION set_demo_user_password(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_demo_user_password(TEXT, TEXT) TO service_role;
