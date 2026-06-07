-- Migration 038: Phone OTP verification codes
-- Stores short-lived 6-digit codes used to verify a user owns a phone number.
-- Codes are sent to the user's email (not SMS) and expire after 15 minutes.

CREATE TABLE IF NOT EXISTS phone_otp_codes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone        TEXT        NOT NULL,
  code         TEXT        NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phone_otp_user_idx ON phone_otp_codes (user_id);

ALTER TABLE phone_otp_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see and act on their own OTP rows (via service role for writes)
CREATE POLICY "phone_otp_owner_read" ON phone_otp_codes
  FOR SELECT USING (auth.uid() = user_id);
