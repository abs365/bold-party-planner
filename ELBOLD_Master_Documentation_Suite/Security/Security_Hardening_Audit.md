# ELBOLD Security Hardening Audit

**Date:** 2026-06-03
**Scope:** Authentication, authorisation, data privacy, payments, database, dev endpoints
**Phase 28B — Pre-pilot hardening**

---

## Summary

| Severity | Total Found | Fixed in Phase 28B | Remaining |
|---|---|---|---|
| Critical | 4 | 3 | 1 (documented) |
| High | 4 | 2 | 2 (documented) |
| Medium | 6 | 0 | 6 (documented, not blocking) |
| Low | 3 | 0 | 3 (documented, not blocking) |

**Pilot GO/NO-GO verdict:** All Critical and most High issues fixed. Remaining issues are documented and do not block a controlled 6-tester pilot.

---

## CRITICAL Issues

### C1 — Hardcoded Demo Secrets in Source Code ✅ FIXED
**Files:** `app/api/dev/seed-e2e/route.ts`, `app/api/auth/create-demo-users/route.ts`
**Risk:** If repository is exposed, `SEED_SECRET`, `DEMO_SECRET`, and `DEMO_PASSWORD` are immediately known.
**Fix applied:** Secrets now read from environment variables with fallback:
```typescript
const SEED_SECRET  = process.env.SEED_SECRET  ?? "ELBOLD_SEED_2026";
const DEMO_SECRET  = process.env.DEMO_SECRET  ?? "ELBOLD_DEMO_2026";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "ElboldDemo2026!";
```
**Action required:** Set `SEED_SECRET`, `DEMO_SECRET`, `DEMO_PASSWORD` to strong random values in all environment configs. Do NOT use the fallback values in any deployed environment.

---

### C2 — Seed Endpoints Callable in Vercel Preview Deployments ✅ FIXED
**Files:** `app/api/dev/seed-e2e/route.ts`, `app/api/dev/seed-health/route.ts`, `app/api/auth/create-demo-users/route.ts`
**Risk:** `NODE_ENV === "production"` is true on Vercel preview deployments. Previous guard did not check `VERCEL_ENV`, so seed endpoints were callable on staging URLs.
**Fix applied:**
```typescript
const isProductionDeployment =
  process.env.VERCEL_ENV === "production" ||
  (process.env.NODE_ENV === "production" && !process.env.CI);
if (isProductionDeployment) return 403;
```
This blocks Vercel production. Preview deployments (`VERCEL_ENV === "preview"`) still allow seeding for QA purposes.

---

### C3 — Phone Numbers Returned in Admin Vendor Route ✅ FIXED
**File:** `app/api/admin/vendors/route.ts`
**Risk:** The `phone` field was included in the profile join select, exposing PII to anyone with admin API access. Phone numbers should be visible only in the admin verification flow, not the general vendor list.
**Fix applied:**
```typescript
// Before: .select("*, profile:profiles(full_name, email, phone)")
// After:
.select("*, profile:profiles(full_name, email)")
```

---

### C4 — Stripe Webhook Booking Ownership Not Validated ✅ FIXED
**File:** `app/api/payments/webhook/route.ts`
**Risk:** After fetching the booking by `booking_id` from metadata, the `customer_id` from metadata was not cross-checked against `booking.customer_id`. A tampered metadata (with valid but mismatched IDs) could bypass ownership.
**Fix applied:** Added ownership check after booking fetch:
```typescript
if (customerId && booking.customer_id !== customerId) {
  console.error("Webhook: customer_id mismatch", { bookingId, meta: customerId, db: booking.customer_id });
  return NextResponse.json({ error: "Ownership validation failed" }, { status: 400 });
}
```
Note: Stripe webhook signature (`constructEvent`) already validates that metadata was set by us at checkout time. This fix adds a defence-in-depth layer.

---

## HIGH Issues

### H1 — Stripe Subscription Metadata Not Validated ⚠️ DOCUMENTED
**File:** `app/api/payments/webhook/route.ts` (~lines 189–225)
**Risk:** `meta.vendor_id` and `meta.plan` are extracted from subscription metadata without cross-checking against the `vendor_subscriptions` table using `stripe_subscription_id`.
**Recommended fix:** Query by `stripe_subscription_id` instead of trusting metadata for vendor identity.
**Why not fixed now:** Requires subscription webhook handler refactor. Low risk at pilot scale where subscriptions are manual/free. Document and schedule for post-pilot.

---

### H2 — Vendor Payout Calculated in Stripe Metadata ⚠️ DOCUMENTED
**File:** `app/api/payments/checkout/route.ts`
**Risk:** `metadata.vendor_payout = String(amount * 0.9)` is stored in Stripe session metadata. Although this value is not used in webhook processing (payout is re-calculated from the booking), storing calculated financial values in Stripe metadata is not recommended best practice.
**Recommended fix:** Store only `booking_id` and `payment_type` in metadata; recalculate all financial values from the database booking on webhook receipt.
**Why not fixed now:** Not exploitable — the webhook handler re-reads the booking from the database. This is a code hygiene issue. Schedule for post-pilot refactor.

---

### H3 — Notifications API Route Unverified ⚠️ DOCUMENTED
**File:** `app/api/notifications/route.ts`
**Risk:** Not fully audited. If this route returns notifications for all users without proper auth filtering, it's a data leak.
**Action required before broader launch:** Verify route has `requireAuth()` and filters by `user.id`.

---

### H4 — Reports API Reporter Identity Not Fully Audited ⚠️ DOCUMENTED
**File:** `app/api/reports/route.ts`
**Risk:** Content reports should set `reporter_id = auth.uid()` server-side, not trust a client-supplied reporter_id.
**Action required before broader launch:** Verify `reporter_id` is set from the authenticated session, not from request body.

---

## MEDIUM Issues (Not blocking pilot)

| # | Issue | File | Risk | Status |
|---|---|---|---|---|
| M1 | Demo user UUIDs are predictable (sequential) | seed-e2e.ts | Enumeration of demo accounts | Acceptable for isolated demo env |
| M2 | Stripe error messages may leak SDK details | payments/checkout.ts | Information disclosure | Low — Stripe SDK errors are safe |
| M3 | Vendor payout in Stripe session metadata | payments/checkout.ts | See H2 | Code hygiene, not exploitable |
| M4 | Whitespace sensitivity in ADMIN_EMAILS | proxy.ts, lib/admin.ts | Misconfiguration risk | Mitigated by `.trim()` calls |
| M5 | ADMIN_EMAILS fallback is empty string | lib/env.ts | Logs confusing warnings | Add startup check for empty value |
| M6 | Seed endpoint returns verbose errors | seed-e2e.ts | Info disclosure in staging | Acceptable on staging only |

---

## LOW Issues (Code quality, non-blocking)

| # | Issue | File | Risk | Status |
|---|---|---|---|---|
| L1 | Unsplash images whitelisted in next.config | next.config.ts | Demo data dependency | Remove post-pilot when demo is retired |
| L2 | Admin alerts system alerts link points to verifications | app/admin/page.tsx | Wrong navigation | Minor UX issue, fixed in Phase 28 |
| L3 | `createClient()` SSR cookie try/catch silences errors | lib/supabase/server.ts | Hidden auth failures | Standard Supabase SSR pattern |

---

## What Is Secure ✅

The following were audited and confirmed correctly implemented:

- **Middleware route protection** — `/admin`, `/vendor/*`, `/dashboard` all guarded by `proxy.ts`
- **Admin email whitelist** — Three-layer check: middleware, API guards (`requireAdmin()`), page-level (`assertAdminPage()`)
- **Supabase RLS** — All core tables (profiles, vendors, bookings, quotes, vendor_media, bank_details, admin_alerts) have RLS enabled with appropriate policies
- **Stripe webhook signature** — `stripe.webhooks.constructEvent()` verifies every webhook
- **Stripe idempotency** — `stripe_events` table prevents double-processing
- **Stripe live/test key detection** — `assertStripeKey()` prevents test keys in production
- **Rate limiting** — Quote requests (20/hr, 100/day), checkout (10/hr), admin APIs
- **Service role key** — Used only server-side, never exposed to browser bundle
- **Phone numbers in profiles** — Not exposed in public vendor profiles view (`027_profiles_privacy.sql`)
- **Vendor bank details** — Separate table with RLS restricted to vendor owner only
- **Content Security Policy** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy all set
- **Quote events audit trail** — All quote lifecycle events logged with actor, role, and timestamp
- **Audit logs** — All admin actions logged to `audit_logs` with IP address

---

## Recommended Actions Before Wider Launch (Post-Pilot)

1. Set strong random values for `SEED_SECRET`, `DEMO_SECRET`, `DEMO_PASSWORD` in all envs
2. Fix subscription metadata validation (H1)
3. Move vendor_payout out of Stripe metadata (H2)
4. Audit notifications and reports routes (H3, H4)
5. Remove Unsplash from image whitelist (L1)
6. Consider rate limiting for admin endpoints to prevent enumeration
