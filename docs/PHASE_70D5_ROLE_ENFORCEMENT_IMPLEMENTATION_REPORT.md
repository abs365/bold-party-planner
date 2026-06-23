# Phase 70D.5 — Role Enforcement Implementation Report

**Date:** 2026-06-23  
**Status:** IMPLEMENTATION COMPLETE — Awaiting review before role assignment  
**Build:** ✓ 0 TypeScript errors · 113/113 pages generated  

---

## Section 1: Enforcement Matrix

| Route / Page | Founder (4) | Global Admin (3) | Ops Admin (2) | Reviewer (1) |
|---|---|---|---|---|
| **API Routes** | | | | |
| GET /api/admin/vendors | ✓ | ✓ | ✓ | ✗ |
| PATCH /api/admin/vendors (status change) | ✓ | ✓ | ✗ | ✗ |
| PATCH /api/admin/vendors (notes/featured) | ✓ | ✓ | ✓ | ✗ |
| POST /api/admin/vendors (bulk) | ✓ | ✓ | ✗ | ✗ |
| GET /api/admin/verifications | ✓ | ✓ | ✓ | ✗ |
| PATCH /api/admin/verifications | ✓ | ✓ | ✗ | ✗ |
| POST /api/admin/verifications | ✓ | ✓ | ✓ | ✗ |
| GET /api/admin/payouts | ✓ | ✓ | ✓ | ✗ |
| PATCH /api/admin/payouts | ✓ | ✓ | ✗ | ✗ |
| GET /api/admin/reviews | ✓ | ✓ | ✓ | ✗ |
| POST /api/admin/reviews | ✓ | ✓ | ✗ | ✗ |
| GET /api/admin/governance | ✓ | ✓ | ✓ | ✗ |
| POST /api/admin/governance | ✓ | ✓ | ✗ | ✗ |
| GET /api/admin/governance-log | ✓ | ✓ | ✓ | ✗ |
| GET /api/admin/governance-log/vendor/[id] | ✓ | ✓ | ✓ | ✗ |
| GET/PATCH /api/admin/team | ✓ | ✓ | ✓ | ✗ |
| POST /api/admin/team (grant global_admin) | ✓ | ✗ | ✗ | ✗ |
| DELETE /api/admin/team (revoke global_admin) | ✓ | ✗ | ✗ | ✗ |
| PATCH /api/admin/moderation/reports/[id] | ✓ | ✓ | ✗ | ✗ |
| PATCH /api/admin/moderation/media/[id] | ✓ | ✓ | ✗ | ✗ |
| GET /api/admin/customers | ✓ | ✓ | ✓ | ✗ |
| GET/PATCH /api/admin/alerts | ✓ | ✓ | ✓ | ✗ |
| GET /api/admin/audit | ✓ | ✓ | ✓ | ✗ |
| GET /api/admin/email-verify | ✓ | ✓ | ✓ | ✗ |
| POST /api/admin/outreach | ✓ | ✓ | ✓ | ✗ |
| ALL /api/admin/pilot | ✓ | ✓ | ✓ | ✗ |
| ALL /api/admin/pilot/vendors | ✓ | ✓ | ✓ | ✗ |
| GET/POST /api/admin/monetization | ✓ | ✓ | ✗ | ✗ |
| GET/POST /api/admin/reconciliation | ✓ | ✓ | ✗ | ✗ |
| ALL /api/admin/vendor-leads | ✓ | ✓ | ✓ | ✗ |
| ALL /api/admin/vendor-leads/[id] | ✓ | ✓ | ✓ | ✗ |
| POST /api/admin/vendor-leads/outreach | ✓ | ✓ | ✓ | ✗ |
| POST /api/admin/vendor-leads/import | ✓ | ✓ | ✓ | ✗ |
| **Admin Pages** | | | | |
| /admin (dashboard) | ✓ | ✓ | ✓ | ✗ |
| /admin/vendors | ✓ | ✓ | ✓ | ✗ |
| /admin/customers | ✓ | ✓ | ✓ | ✗ |
| /admin/bookings | ✓ | ✓ | ✓ | ✗ |
| /admin/quotes | ✓ | ✓ | ✓ | ✗ |
| /admin/reviews | ✓ | ✓ | ✓ | ✗ |
| /admin/disputes | ✓ | ✓ | ✓ | ✗ |
| /admin/verifications | ✓ | ✓ | ✓ | ✗ |
| /admin/governance | ✓ | ✓ | ✓ | ✗ |
| /admin/governance-log | ✓ | ✓ | ✗ | ✗ |
| /admin/moderation | ✓ | ✓ | ✓ | ✗ |
| /admin/analytics | ✓ | ✓ | ✓ | ✗ |
| /admin/support | ✓ | ✓ | ✓ | ✗ |
| /admin/system | ✓ | ✓ | ✓ | ✗ |
| /admin/health | ✓ | ✓ | ✓ | ✗ |
| /admin/scoreboard | ✓ | ✓ | ✓ | ✗ |
| /admin/finance | ✓ | ✓ | ✗ | ✗ |
| /admin/payouts | ✓ | ✓ | ✗ | ✗ |
| /admin/subscriptions | ✓ | ✓ | ✗ | ✗ |
| /admin/monetization | ✓ | ✓ | ✗ | ✗ |
| /admin/team | ✓ | ✗ | ✗ | ✗ |
| /admin/founder | ✓ | ✗ | ✗ | ✗ |
| /admin/cohort | ✓ | ✗ | ✗ | ✗ |
| /admin/launch-freeze | ✓ | ✗ | ✗ | ✗ |
| /admin/concierge | ✓ | ✓ | ✓ | ✗ |
| /admin/feedback | ✓ | ✓ | ✓ | ✗ |
| /admin/recruitment | ✓ | ✓ | ✓ | ✗ |
| /admin/operations | ✓ | ✓ | ✓ | ✗ |
| /admin/launch | ✓ | ✓ | ✓ | ✗ |
| /admin/direct-contacts | ✓ | ✓ | ✓ | ✗ |
| /admin/verification-audit | ✓ | ✓ | ✓ | ✗ |
| /admin/trust-audit | ✓ | ✓ | ✓ | ✗ |
| /admin/vendor-growth | ✓ | ✓ | ✓ | ✗ |
| /admin/vendor-activation | ✓ | ✓ | ✓ | ✗ |
| /admin/vendor-coverage | ✓ | ✓ | ✓ | ✗ |
| /admin/pilot/* | ✓ | ✓ | ✓ | ✗ |
| /admin/pilot-testing/* | ✓ | ✓ | ✓ | ✗ |

---

## Section 2: API Enforcement

### Mechanism
All admin API routes use `requireAdminRole(minRole)` from `lib/auth/guards.ts`. This function:
1. Calls `requireAdmin()` which resolves identity — Founder from `ADMIN_EMAILS` env var, others from `admin_roles` table (`revoked_at IS NULL`)
2. Checks `ROLE_WEIGHT[ctx.role] >= ROLE_WEIGHT[minRole]`
3. Returns `AdminContext { user: User; db: AdminClient; role: AdminRole }` or `null`
4. Returns 403 Forbidden via `forbidden()` when null

### Split Enforcement (Vendors PATCH)
`/api/admin/vendors` PATCH reads the request body first, then authenticates:
```
rawBody.status present → requireAdminRole("global_admin")  // approve/reject/suspend/reinstate
rawBody.status absent  → requireAdminRole("ops_admin")     // notes, featured, phone_verified
```
This allows Ops Admin to write non-governance fields while blocking governance status changes.

### Team Route Inner Guards
`/api/admin/team` enforces two levels:
- Outer: `requireAdminRole("ops_admin")` — blocks unauthenticated / reviewer / unknown
- Inner: `if (role === "global_admin" && auth.role !== "founder") return 403` — blocks non-Founder from granting/revoking Global Admin

### Cron Bypass Pattern
`/api/admin/reconciliation` has a cron path that bypasses user auth:
```
x-cron-secret header matches CRON_SECRET → direct createAdminClient()
No header or mismatch → requireAdminRole("global_admin")
```
The bypass is header-keyed, not user-context-keyed — safe for scheduled execution.

### Routes Migrated from Inline ADMIN_EMAILS to requireAdminRole
The following routes previously used local `ADMIN_EMAILS` checks or `assertAdmin()` patterns and were fully rewritten:
- `api/admin/monetization/route.ts`
- `api/admin/reconciliation/route.ts`
- `api/admin/pilot/route.ts`
- `api/admin/vendor-leads/route.ts`
- `api/admin/vendor-leads/[id]/route.ts`
- `api/admin/vendor-leads/outreach/route.ts`
- `api/admin/vendor-leads/import/route.ts`

---

## Section 3: UI Enforcement

### Navigation Filtering
`DashboardLayout.tsx` (client component) implements role-based nav filtering:

```typescript
const ROLE_WEIGHT: Record<AdminRole, number> = {
  founder: 4, global_admin: 3, ops_admin: 2, reviewer: 1,
};

function filterByRole(items: NavItem[], adminRole?: AdminRole): NavItem[] {
  if (!adminRole) return items;
  return items.filter((item) => {
    const min = item.minRole ?? "ops_admin";
    return ROLE_WEIGHT[adminRole] >= ROLE_WEIGHT[min];
  });
}
```

Each `NavGroup` is filtered before rendering. Groups with zero visible items are hidden entirely.

**Nav items with restricted minRole:**
| Nav Item | minRole |
|---|---|
| Finance Dashboard | global_admin |
| Payouts | global_admin |
| Subscriptions | global_admin |
| Monetization | global_admin |
| Governance Log | global_admin |
| Admin Team | founder |
| Founder Dashboard | founder |
| Founder Queue | founder |
| Launch Freeze | founder |

All other admin nav items default to `ops_admin`.

### Page-Level Auth
All 41 admin pages (including nested pilot-testing) now use `requireAdminRole(minRole)` at page load. No admin page uses `ADMIN_EMAILS.includes()` for access control. Pages also pass `adminRole={auth.role}` to `DashboardLayout` so nav filtering receives the caller's resolved role.

**Role assignment per page tier:**
- `founder` minRole: `/admin/team`, `/admin/founder`, `/admin/cohort`, `/admin/launch-freeze`
- `global_admin` minRole: `/admin/finance`, `/admin/payouts`, `/admin/subscriptions`, `/admin/monetization`, `/admin/governance-log`
- `ops_admin` minRole: all remaining 32 pages

### Server Actions (app/admin/page.tsx)
Two inline `"use server"` closures in the admin dashboard previously called `createAdminClient()` with no identity check. Both now use `requireAdminRole("global_admin")` internally:

```typescript
"use server";
const ga = await requireAdminRole("global_admin");
if (!ga) return;
await ga.db.from("vendors").update({ status: "rejected" }).eq("id", vendor.id);
```

Ops Admin users landing on the dashboard cannot trigger vendor approve/reject via form POST, even if they craft a direct request.

### Fixed Bug: actorRole in Moderation Media
`/api/admin/moderation/media/[id]` previously hardcoded `actorRole: "admin"` in the audit log. Fixed to `actorRole: auth.role`.

---

## Section 4: Governance Protection Proofs

**Claim:** Ops Admin and Reviewer cannot execute any governance action.

### vendor.approved / vendor.rejected / vendor.suspended / vendor.reinstated
- API: `PATCH /api/admin/vendors` with `status` field → `requireAdminRole("global_admin")` 
- Ops Admin (weight 2) < global_admin (weight 3) → 403 Forbidden
- Reviewer (weight 1) < global_admin → 403 Forbidden
- Page: `/admin/vendors` uses Ops Admin minRole for viewing, but the approve/reject buttons call the PATCH API which enforces Global Admin. Ops Admin can view but cannot write status.

### verification.approved / verification.rejected
- API: `PATCH /api/admin/verifications` → `requireAdminRole("global_admin")`
- Ops Admin → 403. Reviewer → 403.

### payout.mark_paid / payout.cancelled
- API: `PATCH /api/admin/payouts` → `requireAdminRole("global_admin")`
- Ops Admin → 403. Reviewer → 403.
- Page: `/admin/payouts` itself requires `global_admin` — Ops Admin cannot even view the payout page.

### review.approved / review.flagged / review.removed
- API: `POST /api/admin/reviews` → `requireAdminRole("global_admin")`
- Ops Admin → 403. Reviewer → 403.

### role.granted / role.revoked
- API: `POST /api/admin/team` (grant) → outer `requireAdminRole("ops_admin")`, inner founder-only check
- Ops Admin passes outer check but inner check blocks: only Founder can grant/revoke roles
- Reviewer → blocked at outer check (weight 1 < ops_admin weight 2)

---

## Section 5: Founder Protection Proofs

**Claim:** Only Founder (AY) can manage admin roles. Specifically, Founder cannot be granted via the DB — it is anchored exclusively to `ADMIN_EMAILS` env var.

### Role Grant Path
```
POST /api/admin/team
  → requireAdminRole("ops_admin")  [outer gate: rejects Reviewer]
  → if (grantedRole === "founder") return 403  [inner: blocks all — Founder not grantable via DB]
  → if (grantedRole === "global_admin" && auth.role !== "founder") return 403  [inner: only Founder grants GA]
  → if (grantedRole === "ops_admin"/"reviewer" && auth.role !== "founder") return 403  [inner: only Founder grants any role]
```

The inner checks (pre-existing from Phase 70D.4) remain unchanged. Phase 70D.5 added the outer `requireAdminRole("ops_admin")` gate.

### Founder Identity
`requireAdmin()` in `guards.ts` checks `ADMIN_EMAILS` env var first:
```typescript
if (ADMIN_EMAILS.includes(user.email ?? "")) {
  return { user, db, role: "founder" };
}
```
This is evaluated before any DB lookup. A DB row for a Founder email in `admin_roles` would be ignored — Founder role cannot be elevated via the DB.

### Page-Level Founder Gates
Pages `/admin/team`, `/admin/founder`, `/admin/cohort`, `/admin/launch-freeze` all use `requireAdminRole("founder")`. A Global Admin (weight 3) calling these pages gets a redirect to `/` because `ROLE_WEIGHT["global_admin"] (3) < ROLE_WEIGHT["founder"] (4)` is false — wait, 3 < 4 is true, so Global Admin is blocked. Correct.

---

## Section 6: Verification Tests

### Pre-Role-Assignment Tests (Runnable Now)
These tests verify enforcement structure before any roles are assigned. The `admin_roles` table is currently empty.

#### Test 1: Unauthenticated API Access
```
curl -X PATCH https://[domain]/api/admin/vendors \
  -H "Content-Type: application/json" \
  -d '{"vendor_id":"any","status":"approved"}'
→ Expected: 401 Unauthorized (no session)
```

#### Test 2: Non-Admin User API Access
As any authenticated non-admin user (customer or vendor):
```
PATCH /api/admin/vendors → 403 Forbidden
GET /api/admin/vendors → 403 Forbidden
```
Because `requireAdmin()` returns null when the user is not in ADMIN_EMAILS and has no admin_roles row.

#### Test 3: Founder Access (AY)
As AY (email in ADMIN_EMAILS):
```
GET /admin → 200 (ops_admin+)
GET /admin/team → 200 (founder only)
GET /admin/finance → 200 (global_admin+)
PATCH /api/admin/vendors {"vendor_id":"...","status":"approved"} → 200
POST /api/admin/team {"user_id":"...","role":"global_admin"} → 200
```

### Post-Role-Assignment Tests (Run after Phase 70D.6)

#### Test 4: Global Admin (Ts)
```
GET /admin → 200
GET /admin/governance-log → 200
GET /admin/finance → 200
GET /admin/team → 302 redirect to / (founder-only)
GET /admin/founder → 302 redirect to /
PATCH /api/admin/vendors {"status":"approved"} → 200
POST /api/admin/team {"role":"global_admin"} → 403 (inner: only Founder)
POST /api/admin/team {"role":"ops_admin"} → 403 (inner: only Founder)
```

#### Test 5: Ops Admin (Lz, ML)
```
GET /admin → 200
GET /admin/vendors → 200
GET /admin/governance-log → 302 redirect to / (global_admin+)
GET /admin/finance → 302 redirect to / (global_admin+)
GET /admin/team → 302 redirect to / (founder-only)
PATCH /api/admin/vendors {"status":"approved"} → 403 (global_admin required)
PATCH /api/admin/vendors {"admin_notes":"..."} → 200 (ops_admin allowed)
POST /api/admin/reviews → 403 (global_admin required)
GET /api/admin/governance → 200 (ops_admin+)
```

#### Test 6: Reviewer
```
GET /admin → 302 (ops_admin minimum for all pages)
GET /api/admin/vendors → 403
```

---

## Section 7: Deployment Risk Review

### Risk: Admin lockout
**Mitigation:** Founder (AY) is resolved from `ADMIN_EMAILS` env var — no DB dependency. If `admin_roles` table is corrupt/empty, Founder retains full access. No lockout possible.

### Risk: Role escalation via DB manipulation
**Mitigation:** `requireAdmin()` always checks ADMIN_EMAILS first. A Founder email added to `admin_roles` with `role: "ops_admin"` would still resolve as Founder (ADMIN_EMAILS check takes precedence). A non-Founder cannot insert their own `admin_roles` row because that would require the `/api/admin/team` POST endpoint, which requires Founder-level auth for role grants.

### Risk: Bypass via direct server action POST
**Mitigation:** Fixed in Phase 70D.5. Server actions in `app/admin/page.tsx` now use `requireAdminRole("global_admin")` internally. Direct form POST cannot bypass auth.

### Risk: Cron bypass exploitation
**Mitigation:** `/api/admin/reconciliation` cron bypass is gated by `x-cron-secret` header match against `process.env.CRON_SECRET`. The cron path only performs reconciliation reads/writes with no governance or role-management operations.

### Risk: Nav filtering bypass (UX, not security)
**Status:** Nav filtering is client-side convenience only. Hiding nav items does not block access. Security is enforced at API layer (server-side). An Ops Admin cannot access restricted data even if they manually navigate to a restricted URL — the page will `redirect("/")` before rendering.

### Breaking Changes
None. The API response shape is unchanged. The only behavioral change is that callers without the required role now receive 403 instead of 200. The Founder (AY) retains full access — no regression.

### Deployment Order
1. Deploy this commit to Vercel production.
2. Verify `/admin` accessible as AY.
3. Verify `/api/admin/vendors` returns 200 as AY.
4. Stop. Wait for review before Phase 70D.6 (role assignment).

---

## Files Changed

### `lib/auth/guards.ts`
- `ROLE_WEIGHT` exported (was private)

### API Routes (24 files)
- `app/api/admin/vendors/route.ts` — split enforcement per HTTP method and body
- `app/api/admin/verifications/route.ts`
- `app/api/admin/payouts/route.ts`
- `app/api/admin/reviews/route.ts`
- `app/api/admin/governance/route.ts`
- `app/api/admin/governance-log/route.ts`
- `app/api/admin/governance-log/vendor/[id]/route.ts`
- `app/api/admin/team/route.ts`
- `app/api/admin/moderation/reports/[id]/route.ts`
- `app/api/admin/moderation/media/[id]/route.ts` (also fixed hardcoded actorRole)
- `app/api/admin/customers/route.ts`
- `app/api/admin/alerts/route.ts`
- `app/api/admin/audit/route.ts`
- `app/api/admin/email-verify/route.ts`
- `app/api/admin/outreach/route.ts`
- `app/api/admin/pilot/vendors/route.ts`
- `app/api/admin/monetization/route.ts` (rewritten)
- `app/api/admin/reconciliation/route.ts` (rewritten, cron bypass retained)
- `app/api/admin/pilot/route.ts` (rewritten)
- `app/api/admin/vendor-leads/route.ts` (rewritten)
- `app/api/admin/vendor-leads/[id]/route.ts` (rewritten)
- `app/api/admin/vendor-leads/outreach/route.ts` (rewritten)
- `app/api/admin/vendor-leads/import/route.ts` (rewritten)

### Admin Pages (41 files)
All admin pages under `app/admin/` migrated from `ADMIN_EMAILS.includes()` / `assertAdminPage()` to `requireAdminRole(minRole)`. All pass `adminRole={auth.role}` to `DashboardLayout`.

### UI Components (2 files)
- `components/layout/DashboardLayout.tsx` — nav filtering, `minRole` on nav items, `adminRole` prop
- `app/admin/page.tsx` — server action security fix, auth migration

---

## Critical Restriction Confirmation

**No roles have been granted. No role records have been inserted. `admin_roles` table remains empty.**

Phase 70D.6 (role assignment for Ts, Lz, ML) must not begin until this report is reviewed and approved.
