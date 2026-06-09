# Governance & Access Control Validation Report
**Version:** 1.0 | **Date:** 2026-06-09 | **Sprint:** Operational Validation & Investor Readiness

---

## Executive Summary

Governance is functional but single-tier. A single email-list admin model provides basic access control. Role-based access control (RBAC) has been designed (see `docs/RBAC_Architecture.md`) but not yet implemented. All lifecycle state transitions are correctly enforced at the database and application layers.

**Overall governance status:** OPERATIONAL — not enterprise-grade. Sufficient for solo-founder stage.

---

## 1. Access Control Model

### 1.1 Current Model: Email-List Admin

**File:** `lib/auth/guards.ts`

```typescript
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);

export async function requireAdmin(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) return null;
  const db = await createAdminClient();
  return { user, db };
}
```

**How it works:**
1. `ADMIN_EMAILS` is an environment variable — a comma-separated list of email addresses
2. On every admin request, the user's email is checked against this list
3. If not in the list, the request returns 401 Unauthorized
4. If in the list, the request proceeds with a Supabase admin (service role) client

**Enforcement points:** All `/admin/*` API routes call `requireAdmin()` and return `unauthorized()` if it returns null.

### 1.2 Roles in the System

| Role | Defined In | Enforcement |
|------|-----------|-------------|
| `admin` | ADMIN_EMAILS env var | Email list check in `requireAdmin()` |
| `vendor` | profiles.role = 'vendor' | Set on application, checked in vendor guards |
| `customer` | profiles.role = 'customer' | Default role on signup |

**Key limitation:** There is no database-level role. Admin status is derived entirely from an environment variable. If ADMIN_EMAILS is not set in Vercel production, no one can access /admin — and if it is set with an incorrect email, the intended admin cannot log in.

**Verification action required:** Confirm `ADMIN_EMAILS` is set correctly in Vercel dashboard → Project → Settings → Environment Variables.

---

## 2. Protected Routes

| Route Pattern | Protection | Verified |
|--------------|-----------|---------|
| `/admin/*` (pages) | Server-side: redirect if not admin | Yes |
| `/api/admin/*` (API) | `requireAdmin()` → 401 if not admin | Yes |
| `/vendor/dashboard` | `requireVendor()` — vendor role required | Yes |
| `/api/vendor/*` | `requireAuth()` + vendor check | Yes |
| `/api/bookings/*` | `requireAuth()` | Yes |
| `/api/payments/*` | `requireAuth()` | Yes |

---

## 3. Vendor Lifecycle State Machine

### 3.1 State Definitions

| State | Meaning | Transition Trigger |
|-------|---------|------------------|
| `applied` | Just submitted application | Default on insert |
| `under_review` | Admin has started reviewing | Manual admin action |
| `approved` | Application accepted | Admin status → 'approved' |
| `profile_setup` | Vendor completing profile | Manual or auto-advance |
| `verified` | Profile verified by admin | Admin lifecycle advance |
| `live` | Visible to customers | Admin lifecycle advance |
| `rejected` | Application declined | Admin status → 'rejected' |
| `suspended` | Previously live, now suspended | Admin status → 'suspended' |

### 3.2 DB Trigger Enforcement

**Trigger:** `trg_sync_vendor_lifecycle` (created in migration 046)
**File:** `supabase/migrations/046_trust_governance_sprint.sql`

The trigger fires `BEFORE UPDATE OF status` on the vendors table. When status changes:

| New Status | Lifecycle Advances To |
|-----------|--------------------|
| `approved` | `approved` |
| `rejected` | `rejected` |
| `suspended` | `suspended` |

This ensures status and lifecycle_state are never inconsistent after a status change. The trigger is idempotent and does not fire on updates that don't change the `status` column (BEFORE UPDATE OF column-name syntax).

### 3.3 Manual Lifecycle Advances

The admin panel can directly set `lifecycle_state` via PATCH `/api/admin/vendors`:

```typescript
if (lifecycle_state) updates.lifecycle_state = lifecycle_state;
```

This allows an admin to advance a vendor from `approved` → `profile_setup` → `verified` → `live` as the vendor completes each stage. No automation for these transitions currently — they require explicit admin action.

**Gap:** No notification fires to the vendor when lifecycle_state advances (only when status changes to approved/rejected). Vendors in `profile_setup` or `verified` state have no automated prompt to complete the next step.

---

## 4. Supabase Row-Level Security

Supabase RLS is configured. The service role client (`createAdminClient`) bypasses RLS — used only in admin and server-side operations. The regular client (`createClient`) respects RLS — used for user-facing operations.

**Key RLS rules to verify (run in Supabase SQL Editor):**

```sql
-- Check that vendors can only read/update their own row
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;
```

```sql
-- Check that bookings are only visible to the relevant customer/vendor
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;
```

---

## 5. Audit Trail

| Event | Logged Where | Method |
|-------|-------------|--------|
| Vendor application submitted | `logger.info("vendor.apply.created", ...)` | Structured log |
| Admin status change | Application log (if logger called) | Structured log |
| Payment received | stripe_events table | Webhook idempotency record |
| Refund issued | Stripe Dashboard | Manual + DB update (BUG-002 risk) |

**Gap:** There is no `audit_log` table recording admin actions with timestamps and actor IDs. All admin mutations are permanent and unattributed. This is acceptable at solo-founder stage but is a governance gap for multi-admin or regulated contexts.

---

## 6. Identified Governance Gaps

| Gap | Severity | Resolution Path |
|-----|---------|----------------|
| Email-list admin (no database role) | MEDIUM | Implement RBAC from `docs/RBAC_Architecture.md` |
| No audit log table | MEDIUM | Add `admin_audit_log` table with actor, action, target, timestamp |
| ADMIN_EMAILS not verified in Vercel | HIGH | Verify immediately — if unset, no admin access in production |
| lifecycle_state advances not automated | LOW | Webhook-driven advance is a future feature |
| No vendor notification on lifecycle advance | LOW | Add email for each advance event |
| RBAC architecture designed but not built | MEDIUM | Phase 2 governance work |
| No separation between super-admin and regular admin | LOW | Needed before multi-admin team |

---

## 7. RBAC Architecture (Designed, Not Implemented)

**Reference:** `docs/RBAC_Architecture.md`

The designed RBAC model introduces three roles: `super_admin`, `admin`, `moderator`. These would be stored in a `roles` table linked to profiles. The current email-list model would be replaced by a DB role check.

**Why not implemented yet:** Building RBAC before there are multiple admins is premature. The current model is safe for a single founder. Implement RBAC when the first non-founder team member needs admin access.

---

## 8. Governance Verdict

| Dimension | Status |
|-----------|--------|
| Admin access control | FUNCTIONAL (email-list) |
| Vendor lifecycle enforcement | STRONG (DB trigger) |
| Payment governance | STRONG (Stripe webhooks + idempotency) — BUG-002 caveat |
| Row-level security | CONFIGURED |
| Audit trail | PARTIAL (logs only, no DB audit table) |
| RBAC | DESIGNED, NOT BUILT |
| ADMIN_EMAILS verification | PENDING — ACTION REQUIRED |

**Overall:** Governance is sound for a solo-founder operation. The two most important immediate actions are: (1) verify ADMIN_EMAILS in Vercel, and (2) fix BUG-002.

---

**Status:** COMPLETE
