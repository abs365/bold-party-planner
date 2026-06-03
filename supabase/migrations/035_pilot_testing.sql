-- ============================================================================
-- Migration 035: Pilot Testing Centre
-- Tables: pilot_test_submissions, pilot_bug_reports
-- ============================================================================

-- Ensure uuid generation is available in this schema context.
-- Migration 001 already enables this extension, but declaring it here is
-- idempotent (IF NOT EXISTS) and makes this migration self-documenting.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─── Table: pilot_test_submissions ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pilot_test_submissions (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_type     TEXT        NOT NULL
                            CHECK (test_type IN ('customer', 'vendor', 'admin')),
  tester_name   TEXT        NOT NULL,
  tester_email  TEXT        NOT NULL,
  rating        INTEGER     NOT NULL
                            CHECK (rating >= 1 AND rating <= 10),
  results       JSONB       NOT NULL DEFAULT '{}',
  comments      TEXT,
  critical_bugs INTEGER     NOT NULL DEFAULT 0,
  high_bugs     INTEGER     NOT NULL DEFAULT 0,
  medium_bugs   INTEGER     NOT NULL DEFAULT 0,
  low_bugs      INTEGER     NOT NULL DEFAULT 0,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pilot_test_submissions ENABLE ROW LEVEL SECURITY;

-- Testers submit without a Supabase account, so INSERT must be open to anon.
CREATE POLICY "pilot_submissions_public_insert" ON pilot_test_submissions
  FOR INSERT WITH CHECK (true);

-- Client-side SELECT is blocked entirely. All admin reads use createAdminClient()
-- (service-role key) which bypasses RLS — no SELECT policy needed for admins.
CREATE POLICY "pilot_submissions_no_client_read" ON pilot_test_submissions
  FOR SELECT USING (false);

-- No UPDATE or DELETE policies: submissions are immutable after creation.


-- ─── Table: pilot_bug_reports ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pilot_bug_reports (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_name  TEXT        NOT NULL,
  reporter_email TEXT        NOT NULL,
  test_type      TEXT        NOT NULL
                             CHECK (test_type IN ('customer', 'vendor', 'admin')),
  title          TEXT        NOT NULL,
  description    TEXT        NOT NULL,
  page_url       TEXT,
  severity       TEXT        NOT NULL
                             CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  screenshot_url TEXT,
  status         TEXT        NOT NULL DEFAULT 'open'
                             CHECK (status IN ('open', 'investigating', 'fixed', 'verified', 'closed')),
  submission_id  UUID        REFERENCES pilot_test_submissions(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pilot_bug_reports ENABLE ROW LEVEL SECURITY;

-- Reporters submit without a Supabase account.
CREATE POLICY "pilot_bugs_public_insert" ON pilot_bug_reports
  FOR INSERT WITH CHECK (true);

-- Client-side SELECT blocked — admin reads use service-role.
CREATE POLICY "pilot_bugs_no_client_read" ON pilot_bug_reports
  FOR SELECT USING (false);

-- No client UPDATE policy.
-- Rationale: the original draft had FOR UPDATE USING (true), which would allow
-- any authenticated Supabase user (including testers) to update bug records
-- directly via the client. That is removed here.
-- Status changes flow exclusively through PATCH /api/pilot/testing/bugs/[id]:
--   requireAdmin() validates the caller is in ADMIN_EMAILS
--   createAdminClient() (service-role key) performs the UPDATE, bypassing RLS
-- Result: no authenticated client can mutate bug records outside the API layer.

-- No DELETE policy: bug records are audit-persistent; deletion requires
-- direct service-role intervention.


-- ─── Trigger: auto-update updated_at on pilot_bug_reports ───────────────────

-- Standalone function scoped to pilot bugs.
-- Uses CREATE OR REPLACE so re-running this migration in development is safe.
CREATE OR REPLACE FUNCTION set_pilot_bug_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fires BEFORE UPDATE so the new timestamp is included in the same write.
CREATE TRIGGER pilot_bug_reports_set_updated_at
  BEFORE UPDATE ON pilot_bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION set_pilot_bug_updated_at();


-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_pilot_submissions_type
  ON pilot_test_submissions(test_type);

CREATE INDEX IF NOT EXISTS idx_pilot_submissions_at
  ON pilot_test_submissions(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_pilot_bugs_severity
  ON pilot_bug_reports(severity);

CREATE INDEX IF NOT EXISTS idx_pilot_bugs_status
  ON pilot_bug_reports(status);

CREATE INDEX IF NOT EXISTS idx_pilot_bugs_created
  ON pilot_bug_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pilot_bugs_updated
  ON pilot_bug_reports(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_pilot_bugs_submission_id
  ON pilot_bug_reports(submission_id);
