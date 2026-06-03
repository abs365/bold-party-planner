-- Pilot Testing Centre
-- Migration 035: pilot_test_submissions + pilot_bug_reports

CREATE TABLE IF NOT EXISTS pilot_test_submissions (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_type        TEXT         NOT NULL CHECK (test_type IN ('customer', 'vendor', 'admin')),
  tester_name      TEXT         NOT NULL,
  tester_email     TEXT         NOT NULL,
  rating           INTEGER      NOT NULL CHECK (rating >= 1 AND rating <= 10),
  results          JSONB        NOT NULL DEFAULT '{}',
  comments         TEXT,
  critical_bugs    INTEGER      NOT NULL DEFAULT 0,
  high_bugs        INTEGER      NOT NULL DEFAULT 0,
  medium_bugs      INTEGER      NOT NULL DEFAULT 0,
  low_bugs         INTEGER      NOT NULL DEFAULT 0,
  submitted_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE pilot_test_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (public forms, no login required)
CREATE POLICY "pilot_submissions_public_insert" ON pilot_test_submissions
  FOR INSERT WITH CHECK (true);

-- Client-side SELECT blocked; admin reads use service-role which bypasses RLS
CREATE POLICY "pilot_submissions_no_client_read" ON pilot_test_submissions
  FOR SELECT USING (false);


CREATE TABLE IF NOT EXISTS pilot_bug_reports (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_name    TEXT         NOT NULL,
  reporter_email   TEXT         NOT NULL,
  test_type        TEXT         NOT NULL CHECK (test_type IN ('customer', 'vendor', 'admin')),
  title            TEXT         NOT NULL,
  description      TEXT         NOT NULL,
  page_url         TEXT,
  severity         TEXT         NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  screenshot_url   TEXT,
  status           TEXT         NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'fixed', 'verified', 'closed')),
  submission_id    UUID         REFERENCES pilot_test_submissions(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE pilot_bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pilot_bugs_public_insert" ON pilot_bug_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "pilot_bugs_no_client_read" ON pilot_bug_reports
  FOR SELECT USING (false);

-- Allow admin update via authenticated role (service-role bypass also works)
CREATE POLICY "pilot_bugs_admin_update" ON pilot_bug_reports
  FOR UPDATE USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pilot_submissions_type     ON pilot_test_submissions(test_type);
CREATE INDEX IF NOT EXISTS idx_pilot_submissions_at       ON pilot_test_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_pilot_bugs_severity        ON pilot_bug_reports(severity);
CREATE INDEX IF NOT EXISTS idx_pilot_bugs_status          ON pilot_bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_pilot_bugs_created         ON pilot_bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pilot_bugs_submission_id   ON pilot_bug_reports(submission_id);
