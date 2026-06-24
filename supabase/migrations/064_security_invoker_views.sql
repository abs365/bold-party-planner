-- ── Migration 064: Phase 70D.5E — Security Invoker View Remediation ──────────
-- Date: 2026-06-24
-- Risk: Medium
-- Route impact: None (all sensitive callers use service role; behaviour unchanged)
--
-- Findings addressed (Phase 70D.5E):
--   vendor_performance_summary  CRITICAL — anon sees all vendor earnings/bookings/customers
--   event_guest_stats           HIGH     — anon sees RSVP/VIP stats for all events
--   platform_stats              MEDIUM   — anon sees platform revenue (£95.50)
--   public_vendor_profiles      LOW      — intentional anon access; technical flag only
--
-- Mechanism:
--   ALTER VIEW ... SET (security_invoker = true) — forces underlying table queries
--   to execute as the CALLING user, not the view owner (postgres/BYPASSRLS).
--   RLS policies on underlying tables are then enforced per caller identity.
--
--   REVOKE SELECT FROM anon — removes the unintentional anon grant that arrived
--   via ALTER DEFAULT PRIVILEGES in migration 009.

-- ── 1. vendor_performance_summary ────────────────────────────────────────────
-- CRITICAL. Not called by any application route (grep confirmed zero callers).
-- After security_invoker: anon would see 3 approved vendors with 0-value metrics.
-- After REVOKE: anon sees nothing (correct — no legitimate anon use case).
-- Authenticated vendor: sees own performance stats correctly via bookings_vendor policy.

ALTER VIEW vendor_performance_summary SET (security_invoker = true);
REVOKE SELECT ON vendor_performance_summary FROM anon;

-- ── 2. event_guest_stats ─────────────────────────────────────────────────────
-- HIGH. App callers (guests/route.ts, events/[id]/guests/page.tsx) pre-validate
-- event ownership before querying — security_invoker aligns DB enforcement with
-- application intent. Anon: guests policy (customer_id = auth.uid()) returns 0 rows.
-- Authenticated customer: sees own events' guest stats only (correct).

ALTER VIEW event_guest_stats SET (security_invoker = true);

-- ── 3. platform_stats ────────────────────────────────────────────────────────
-- MEDIUM. Do NOT set security_invoker = true — aggregate subqueries would return
-- wrong counts for admin dashboard (only rows visible to caller, not platform-wide).
-- Both app callers (admin/vendors/page.tsx, admin/analytics/page.tsx) use service role
-- which bypasses REVOKE entirely. Admin functionality is unaffected.

REVOKE SELECT ON platform_stats FROM anon;

-- ── 4. public_vendor_profiles ────────────────────────────────────────────────
-- LOW / Intentional. Explicit anon GRANT in migration 027 remains.
-- Underlying RLS (profiles_approved_vendor_public + vendors_public_read) already
-- permits exactly this data to anon. Output is identical before and after.
-- Setting security_invoker clears the Security Advisor flag with zero risk.

ALTER VIEW public_vendor_profiles SET (security_invoker = true);

NOTIFY pgrst, 'reload schema';
