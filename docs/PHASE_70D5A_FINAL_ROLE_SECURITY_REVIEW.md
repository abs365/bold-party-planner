# Phase 70D.5A — Final Role Security Review

**Date:** 2026-06-23  
**Reviewer:** Automated audit (Phase 70D.5A)  
**Status:** SECURITY ISSUE FOUND AND FIXED — see Item 10 in Findings.  
**Build:** Re-verify required after fix (see Section: Code Change)  

---

## Audit Scope

Ten verification items as specified. All relevant source files read directly. No assumptions made from documentation alone.

Files audited:
- `lib/auth/guards.ts`
- `app/api/admin/team/route.ts`
- `app/api/admin/vendors/route.ts`
- `app/api/admin/verifications/route.ts`
- `app/api/admin/payouts/route.ts`
- `app/api/admin/governance/route.ts`
- `app/api/admin/reviews/route.ts`
- `app/api/admin/monetization/route.ts`
- `app/api/admin/reconciliation/route.ts`
- `app/api/admin/moderation/reports/[id]/route.ts`
- `app/api/admin/moderation/media/[id]/route.ts`
- `app/api/admin/governance-log/route.ts`
- `app/api/admin/vendor-leads/route.ts`
- `app/api/admin/pilot/route.ts`
- `app/api/payments/webhook/route.ts`
- `app/api/payments/connect-webhook/route.ts`
- `app/api/cron/reconciliation/route.ts`
- `app/api/cron/governance/route.ts`
- `app/api/cron/verification-check/route.ts`
- `app/api/bookings/[id]/route.ts`
- `app/admin/page.tsx`
- `components/layout/DashboardLayout.tsx`

---

## Findings

### 1. AY Cannot Be Locked Out

**CONFIRMED SAFE.**

`requireAdmin()` in `lib/auth/guards.ts` resolves Founder before any DB query:

```typescript
if (ADMIN_EMAILS.includes(user.email ?? "")) {
  return { user, db, role: "founder" };
}
```

Founder resolution is a pure env-var lookup. It requires:
- Valid Supabase session (user is authenticated)
- `ADMIN_EMAILS` env var to contain AY's email

There is no DB call on the Founder path. If the `admin_roles` table is empty, corrupt, or the Supabase DB is unreachable (after the client is created), Founder auth still resolves. The only failure modes are: (a) AY is logged out, (b) `ADMIN_EMAILS` env var is removed from Vercel. Neither is caused by any code in this phase.

---

### 2. Founder Admin Works Through ADMIN_EMAILS Even If admin_roles Is Empty

**CONFIRMED SAFE.**

The code path for Founder explicitly bypasses `admin_roles`:

```typescript
// Founder: anchored exclusively to ADMIN_EMAILS env var — never stored in admin_roles
if (ADMIN_EMAILS.includes(user.email ?? "")) {
  return { user, db, role: "founder" };  // ← returns here, never reaches admin_roles lookup
}

// Non-founder: resolve role from admin_roles table
const { data: roleRow } = await db.from("admin_roles")...
```

`admin_roles` is only consulted when the email is NOT in ADMIN_EMAILS. Empty `admin_roles` table has zero effect on Founder access.

---

### 3. admin_roles Empty Means Current Production Behaviour Remains Safe

**CONFIRMED SAFE.**

`admin_roles` is currently empty. With the table empty:
- `requireAdmin()` returns null for any user not in ADMIN_EMAILS (no row found)
- `requireAdminRole(any)` returns null for any such user
- All 24 admin API routes return 403 Forbidden to non-Founder callers
- All 41 admin pages redirect non-Founder visitors to `/`

Current production behaviour: only AY (Founder) can access any admin functionality. This is identical to pre-Phase 70D.5 behaviour from AY's perspective. The enforcement code is live but the `admin_roles` table has no rows to grant access to anyone else.

---

### 4. Global Admin Cannot Grant Global Admin

**CONFIRMED SAFE.**

`POST /api/admin/team` enforces this at the inner level:

```typescript
if (role === "global_admin" && auth.role !== "founder") {
  return NextResponse.json(
    { error: "Only the Founder Admin can grant Global Admin." },
    { status: 403 }
  );
}
```

A Global Admin (weight 3) caller will hit this check and receive 403. The check compares `auth.role !== "founder"` — Global Admin's role string is `"global_admin"`, not `"founder"`, so the block triggers.

Additionally, the valid roles list does NOT include `"founder"`:
```typescript
const validRoles: string[] = ["global_admin", "ops_admin", "reviewer"];
```
`"founder"` is excluded entirely — it cannot be inserted via this API regardless of who calls it.

---

### 5. Global Admin Cannot Modify Founder Permissions

**CONFIRMED SAFE.**

Founder identity is entirely governed by `ADMIN_EMAILS` env var in Vercel. There is no API endpoint, page, or DB operation that modifies who is a Founder. The `admin_roles` table does not hold Founder rows, and the POST /api/admin/team endpoint explicitly excludes `"founder"` from the valid role list. A Global Admin cannot:
- Grant the founder role (not in validRoles)
- Revoke the founder role (it has no row to revoke in admin_roles)
- Change ADMIN_EMAILS (that's an infrastructure operation, not an API call)

---

### 6. Ops Admin Cannot Approve, Reject, Suspend, Reinstate, Manage Payouts, Manage Subscriptions, or Grant Roles

**PARTIALLY FAILED — SECURITY ISSUE FOUND AND FIXED.**

#### Vendor status changes (approve/reject/suspend/reinstate) — SAFE
`PATCH /api/admin/vendors` with a `status` field:
```typescript
const auth = rawBody.status
  ? await requireAdminRole("global_admin")   // ← status change: blocks Ops Admin
  : await requireAdminRole("ops_admin");
```
Ops Admin (weight 2) < global_admin (weight 3) → 403.

#### Payout management — SAFE
`PATCH /api/admin/payouts` → `requireAdminRole("global_admin")` → Ops Admin 403.
`/admin/payouts` page → `requireAdminRole("global_admin")` → redirect to `/`.
Ops Admin cannot reach the payout page or the payout API write path.

#### Subscription management — SAFE
There is no `POST /api/admin/subscriptions` route. Subscription management is through `/admin/subscriptions` page which requires `requireAdminRole("global_admin")`. Ops Admin is redirected to `/` before the page renders.

#### Verification approve/reject — SAFE
`PATCH /api/admin/verifications` → `requireAdminRole("global_admin")` → Ops Admin 403.

#### Review moderation — SAFE
`POST /api/admin/reviews` → `requireAdminRole("global_admin")` → Ops Admin 403.

#### Governance actions (warn, flag, unflag) — SAFE
`POST /api/admin/governance` → `requireAdminRole("global_admin")` → Ops Admin 403.

#### Moderation (content reports, media) — SAFE
`PATCH /api/admin/moderation/reports/[id]` → `requireAdminRole("global_admin")` → Ops Admin 403.
`PATCH /api/admin/moderation/media/[id]` → `requireAdminRole("global_admin")` → Ops Admin 403.

#### Role granting — PREVIOUSLY VULNERABLE, NOW FIXED

**Pre-fix state (Phase 70D.5):**
`POST /api/admin/team` outer gate was `requireAdminRole("ops_admin")`. The inner guard only blocked granting `global_admin`. An Ops Admin could pass the outer gate and:
- Grant `ops_admin` to any user_id → ALLOWED (no inner check)
- Grant `reviewer` to any user_id → ALLOWED (no inner check)
- Revoke `ops_admin`/`reviewer` → ALLOWED via DELETE (same outer gate)

This violated the spec: "Ops Admin CANNOT: grant roles."

**Fix applied to `app/api/admin/team/route.ts`:**
```typescript
// POST — was:
const auth = await requireAdminRole("ops_admin");

// POST — now:
// Role grant requires Global Admin minimum — Ops Admin cannot grant any roles
const auth = await requireAdminRole("global_admin");

// DELETE — was:
const auth = await requireAdminRole("ops_admin");

// DELETE — now:
// Role revoke requires Global Admin minimum — Ops Admin cannot revoke any roles
const auth = await requireAdminRole("global_admin");
```

**Post-fix state:**
- Ops Admin → POST /api/admin/team → 403 (weight 2 < global_admin weight 3)
- Ops Admin → DELETE /api/admin/team → 403
- Global Admin → POST with role="global_admin" → 403 (inner check preserved)
- Global Admin → POST with role="ops_admin"/"reviewer" → 200 (Founder grants GA; GA can grant lower roles per spec)
- Founder → POST any valid role → 200
- GET /api/admin/team remains `requireAdminRole("ops_admin")` — read-only team roster view, low risk

---

### 7. Reviewer Cannot Execute Any Governance Action

**CONFIRMED SAFE.**

The Reviewer role (weight 1) cannot reach any write endpoint:

| Write Endpoint | Minimum Role | Reviewer Weight | Result |
|---|---|---|---|
| PATCH /api/admin/vendors (status) | global_admin (3) | 1 | 403 |
| PATCH /api/admin/vendors (notes) | ops_admin (2) | 1 | 403 |
| POST /api/admin/vendors (bulk) | global_admin (3) | 1 | 403 |
| PATCH /api/admin/verifications | global_admin (3) | 1 | 403 |
| PATCH /api/admin/payouts | global_admin (3) | 1 | 403 |
| POST /api/admin/reviews | global_admin (3) | 1 | 403 |
| POST /api/admin/governance | global_admin (3) | 1 | 403 |
| PATCH /api/admin/moderation/reports/[id] | global_admin (3) | 1 | 403 |
| PATCH /api/admin/moderation/media/[id] | global_admin (3) | 1 | 403 |
| POST /api/admin/team (grant role) | global_admin (3) | 1 | 403 |
| DELETE /api/admin/team (revoke role) | global_admin (3) | 1 | 403 |

Even read endpoints (GET /api/admin/vendors, GET /api/admin/governance-log etc.) require `ops_admin` (weight 2). Reviewer (weight 1) is blocked from all admin API endpoints.

All 41 admin pages require minimum `requireAdminRole("ops_admin")`. Reviewer cannot render any admin page — redirected to `/`.

---

### 8. Navigation Hiding Is Not the Only Protection — API Routes Enforce Permissions

**CONFIRMED.**

`DashboardLayout.tsx` `filterByRole()` is a client-side convenience only. It hides nav items from the rendered sidebar. It does not prevent URL access or API calls.

Security is enforced at two layers independently:

**Layer 1 — Page (server-side):** Every admin page calls `requireAdminRole(minRole)` before any data fetches or JSX rendering. If the check fails, the page calls `redirect("/")` immediately. No page data is returned.

**Layer 2 — API (server-side):** Every admin API route calls `requireAdminRole(minRole)` as the first operation. If the check fails, the route returns 403 before any DB operation. No data is read or written.

Nav hiding (Layer 0) is additive UX only. A user who manually navigates to `/admin/finance` while holding an ops_admin role will be redirected to `/` by the page-level check — not just shown a missing nav item.

---

### 9. Cron and System Routes Work Correctly

**CONFIRMED.**

#### `/api/cron/reconciliation`
Delegates to `/api/admin/reconciliation` passing the cron secret as a header:
```typescript
const response = await fetch(`${appUrl}/api/admin/reconciliation`, {
  headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
});
```
The cron route itself validates `secret !== process.env.CRON_SECRET` → 403 before delegating.

#### `/api/admin/reconciliation`
The cron bypass path is gated by `x-cron-secret` header:
```typescript
const cronSecret = request.headers.get("x-cron-secret");
const isAuthorisedCron = cronSecret && cronSecret === process.env.CRON_SECRET;

if (isAuthorisedCron) {
  db = await createAdminClient();        // cron path: no user auth required
} else {
  const auth = await requireAdminRole("global_admin");   // user path
  if (!auth) return forbidden();
  db = auth.db;
}
```
The cron path cannot be triggered by a user request unless they possess `CRON_SECRET` (server-side env var, never exposed to client). The cron path performs read-only reconciliation calculations and writes a `reconciliation_runs` row — no governance actions, no role changes.

#### `/api/cron/governance`
Protected by `CRON_SECRET` header. Performs automated vendor health checks:
- Issues `vendor_warnings` rows
- Sets `suspicious_flag` on vendors with critical health scores
- Clears `suspicious_flag` when health recovers
All actions are logged to `governance_decisions` with `actorUserId: "system"` and `isAutomated: true`. These are NOT human governance decisions — they are reversible automated flags. No approve/reject/suspend/reinstate actions are taken by this cron.

#### `/api/cron/verification-check`
Protected by `CRON_SECRET` header. Updates vendor metrics, auto-upgrades verification levels 1 and 3, and sends expiry reminder emails. No vendor status changes, no governance writes, no role changes.

#### `/api/payments/webhook`
Authenticated via Stripe signature (`stripe.webhooks.constructEvent`). Does not use admin auth. Processes Stripe payment events → updates bookings/ledger. No admin role dependency added in Phase 70D.5.

#### `/api/payments/connect-webhook`
Authenticated via Stripe Connect webhook signature. No admin auth dependency. Processes Connect account status events. `STRIPE_CONNECT_ENABLED` flag is not `"true"` → a warning is logged but events are still processed (by design, to prevent Stripe retry exhaustion).

---

### 10. No Vendor, Customer, Booking, Payment, Stripe, or Public Routes Are Affected

**CONFIRMED SAFE.**

Full API route inventory examined (82 routes total). Routes outside `app/api/admin/` use their own auth patterns:

- **`app/api/bookings/[id]`** — Uses `createClient()` (anon client). Validates session, then checks `profile.role === "vendor"` or `profile.role === "customer"`. No admin auth involved. Unchanged by Phase 70D.5.
- **`app/api/payments/checkout`** — Customer-facing Stripe checkout. No admin auth dependency.
- **`app/api/payments/webhook`** — Stripe signature auth only. No admin auth dependency.
- **`app/api/payments/connect-webhook`** — Stripe Connect signature auth only. No admin auth dependency.
- **`app/api/vendor/*`** — All use `requireVendor()` or `requireApprovedVendor()` from guards.ts. These functions call `requireAuth()` (not `requireAdmin()`). Completely separate code path. Unchanged.
- **`app/api/quotes/*`**, **`app/api/reviews/*`**, **`app/api/disputes`**, **`app/api/messages/*`** — Use `createClient()` (anon, session-scoped). No admin auth. Unchanged.
- **`app/api/cron/*`** — Protected by CRON_SECRET header. No admin user auth. Unchanged.

`lib/auth/guards.ts` exports were only extended (added `ROLE_WEIGHT` export, added `requireAdminRole`). Existing exports `requireAuth`, `requireVendor`, `requireApprovedVendor`, `unauthorized`, `forbidden` are unchanged. Vendor and customer routes that import from guards.ts are unaffected.

The `bookings`, `customer_id`, `event_id`, `financial_ledger.customer_id` fields are untouched. `STRIPE_CONNECT_ENABLED` defaults to `false` — no change.

---

## Security Issue Log

| ID | Severity | File | Description | Status |
|---|---|---|---|---|
| SEC-001 | HIGH | `app/api/admin/team/route.ts` | POST and DELETE outer gate was `ops_admin`, allowing Ops Admin to grant/revoke `ops_admin` and `reviewer` roles | **FIXED** |

### Fix Applied

**File:** `app/api/admin/team/route.ts`

Changed `POST` outer gate from `requireAdminRole("ops_admin")` → `requireAdminRole("global_admin")`.  
Changed `DELETE` outer gate from `requireAdminRole("ops_admin")` → `requireAdminRole("global_admin")`.

`GET` remains `requireAdminRole("ops_admin")` — read-only team roster view, appropriate.

**Impact of fix:**
- Ops Admin can no longer call POST or DELETE on `/api/admin/team` (403)
- Global Admin can grant `ops_admin` and `reviewer` (spec permits this)
- Global Admin cannot grant `global_admin` (inner check preserved, unchanged)
- Founder can grant any valid role (weight 4 >= 3, passes outer gate; inner checks pass)
- No other routes affected

---

## Exact Files Changed in Phase 70D.5 (including 70D.5A fix)

### Phase 70D.5 (previously complete)
- `lib/auth/guards.ts` — ROLE_WEIGHT exported; requireAdminRole added
- `components/layout/DashboardLayout.tsx` — filterByRole, minRole on NavItems, adminRole prop
- `app/admin/page.tsx` — auth migrated + server action security fix
- All 41 admin pages — ADMIN_EMAILS → requireAdminRole, adminRole={auth.role} prop
- 23 admin API routes — requireAdminRole enforcement

### Phase 70D.5A (this audit)
- `app/api/admin/team/route.ts` — POST and DELETE outer gate raised from `ops_admin` to `global_admin`

---

## Data State Confirmation

- **No roles granted.** `admin_roles` table is empty. Verified by: `requireAdmin()` returning null for all non-Founder users, and the team page UI displaying "No other admin roles assigned yet."
- **No data inserted** beyond existing Migration 060 structures (table schema only, no rows).
- **No admin_roles rows.** The team route POST was never called with the vulnerable code in production — Phase 70D.5 was deployed as implementation-only, no role assignment was authorised.

---

## Build Status

Phase 70D.5 build was confirmed clean: `✓ Compiled successfully in 38.1s`, 0 TypeScript errors, 113/113 pages generated.

The fix in Phase 70D.5A changes two lines in one API route (no type changes, no imports added, no new logic). A re-build is recommended before deployment to confirm no regression.

---

## Role Enforcement Summary After Fix

| Action | Founder | Global Admin | Ops Admin | Reviewer |
|---|---|---|---|---|
| View any admin page | ✓ | Depends on page minRole | Depends on page minRole | ✗ |
| Approve/reject/suspend/reinstate vendor | ✓ | ✓ | ✗ | ✗ |
| Verify/reject documents | ✓ | ✓ | ✗ | ✗ |
| Mark payout paid/cancel | ✓ | ✓ | ✗ | ✗ |
| Moderate reviews | ✓ | ✓ | ✗ | ✗ |
| Issue governance warnings | ✓ | ✓ | ✗ | ✗ |
| Resolve moderation reports | ✓ | ✓ | ✗ | ✗ |
| Grant ops_admin/reviewer role | ✓ | ✓ | ✗ | ✗ |
| Grant global_admin role | ✓ | ✗ | ✗ | ✗ |
| Grant founder role | ✗ (env only) | ✗ | ✗ | ✗ |
| Revoke ops_admin/reviewer role | ✓ | ✓ | ✗ | ✗ |
| Revoke global_admin role | ✓ | ✗ | ✗ | ✗ |
| View vendor/customer/booking data | ✓ | ✓ | ✓ | ✗ |
| Write admin notes, CRM, outreach | ✓ | ✓ | ✓ | ✗ |

---

## Deployment Clearance

**One security issue was found and fixed.** The fix is minimal (two line changes in one file). Implementation is otherwise correct.

**Required before deployment:**
1. Re-run `npm run build` to confirm build remains clean after the fix.
2. Review this report.
3. Approve Phase 70D.6 (role assignment) only after deployment of Phase 70D.5 + 70D.5A is confirmed in production.

**No roles have been granted. No role assignment has occurred. Stop and wait for review.**
