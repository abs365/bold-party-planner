-- ── Migration 061: P0 RLS Fixes — email_log + stripe_events ─────────────────
-- Phase 70D.5D — Security Remediation
-- Date: 2026-06-24
-- Risk: Hotfix / Low — additive only, no existing policies affected
-- Route impact: None
--   email_log:    not queried by any application route
--   stripe_events: written only via createAdminClient() (service role)
--
-- Findings addressed:
--   RLS-001 (CRITICAL) — email_log: no RLS, PII exposure to authenticated users
--   RLS-002 (CRITICAL) — stripe_events: no RLS, event metadata exposure

-- ── email_log ─────────────────────────────────────────────────────────────────
-- Created in 002_phase2.sql without ENABLE ROW LEVEL SECURITY.
-- Contains: recipient_email (PII), template, subject, status, error.
-- Written by: no current application route (Resend is called directly).
-- All access must be service-role only.

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_log_service_only" ON email_log;
CREATE POLICY "email_log_service_only" ON email_log
  FOR ALL
  USING (false);

-- ── stripe_events ─────────────────────────────────────────────────────────────
-- Created in 002_phase2.sql without ENABLE ROW LEVEL SECURITY.
-- Recreated as IF NOT EXISTS in 025_gdpr_and_production.sql (still no RLS).
-- Contains: Stripe event ID (evt_...), event type, processed_at.
-- Written only by webhook/route.ts and connect-webhook/route.ts via createAdminClient().
-- All access must be service-role only.

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stripe_events_service_only" ON stripe_events;
CREATE POLICY "stripe_events_service_only" ON stripe_events
  FOR ALL
  USING (false);

NOTIFY pgrst, 'reload schema';
