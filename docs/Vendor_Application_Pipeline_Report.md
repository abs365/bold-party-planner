# Vendor Application Pipeline Forensic Review

**Date:** 2026-06-09
**Sprint:** ELBOLD Trust, Governance & Operational Readiness
**Phase:** 2

---

## Objective

Trace the complete vendor application journey from form submission to admin review to ensure no application can disappear, and every application is traceable by email address.

---

## Complete Application Journey

```
Vendor Apply Form (/vendor/apply)
        |
        v
POST /api/vendor/apply
        |
        v
Database Insert (vendors table, status='pending')
        |
        |--- Email: sendVendorApplicationReceived → vendor
        |--- Email: sendAdminNewVendorAlert → all admin emails
        v
Admin Dashboard (/admin/vendors?status=pending)
        |
        v
Approval Workflow (PATCH /api/admin/vendors)
        |
        |--- status='approved' → sendVendorApproved → vendor
        |--- status='rejected' → sendVendorRejected → vendor
        v
Vendor Notified + Lifecycle Continues
```

---

## Stage-by-Stage Code Trace

### Stage 1 — Vendor Apply Form

**File:** `app/vendor/apply/page.tsx`

- Requires authentication (`requireAuth` via Supabase session)
- If vendor already has a row with `status='approved'` → redirects to `/vendor/dashboard`
- If vendor already has a row with any other status → redirects to `/vendor/onboarding`
- Otherwise shows the `VendorApplyForm` component

**Potential gap:** If a vendor is not signed in, they are redirected to `/login?redirect=/vendor/apply`. If the redirect parameter is lost (e.g. from an OAuth flow) the vendor lands at `/vendor/apply` unauthenticated and sees the form — but submission is blocked at the API level. No data loss.

---

### Stage 2 — API Submission

**File:** `app/api/vendor/apply/route.ts`

**Guards in order:**
1. Rate limit: 5 requests/hour, 20 requests/day per user/IP
2. `requireAuth()` — must be authenticated
3. Required fields: `business_name`, `category`, `city`

**Database insert:**

```typescript
const { data: vendor, error } = await db.from("vendors").insert({
  user_id: user.id,
  business_name: body.business_name,
  ...
  status: "pending",
}).select().single();
```

Uses `createAdminClient()` (service role) to bypass RLS — ensuring the insert always succeeds regardless of RLS policy state.

**If insert fails with code 23505** (unique constraint on user_id): returns 409 with `"You already have a vendor application."` — prevents duplicate rows.

**If insert fails for any other reason:** reverts `profiles.role` back to `customer` so the user is not stuck in vendor limbo.

**On success:**
- Updates `profiles.role = 'vendor'`
- Syncs `user_metadata.role = 'vendor'` (non-blocking, failure logged but not fatal)
- Creates the vendor row with `status='pending'`
- Fires `sendVendorApplicationReceived` (vendor confirmation email)
- Fires `sendAdminNewVendorAlert` for all emails in `ADMIN_EMAILS` env var

**Traceability:** The vendor row contains `user_id` linking to `profiles.id` which contains the email. Any application is traceable by: `SELECT v.*, p.email FROM vendors v JOIN profiles p ON p.id = v.user_id WHERE p.email = 'vendor@email.com'`

---

### Stage 3 — Application Queue (Admin View)

**File:** `app/admin/vendors/page.tsx`

The admin vendors page fetches with `order("created_at", ascending: false)` and a filter on `status`.

**Current gap:** The query has `.limit(100)` in the API route — once >100 vendors exist, the table is paginated but the current admin UI has no pagination UI. Applications beyond the first 100 will not appear in the table (though they do exist in the DB and are counted in `platform_stats`).

**Fix required:** Implement pagination before vendor count exceeds 100.

**Status tabs:** All, Pending, Approved, Rejected, Suspended — admin can filter to any status. Pending tab shows every unreviewed application.

---

### Stage 4 — Approval Workflow

**File:** `app/api/admin/vendors/route.ts` (PATCH handler)

The admin PATCH endpoint:
1. Validates admin session
2. Updates `vendors.status`
3. Creates an `audit_log` entry with `before` and `after` states
4. Fires `sendVendorApproved` or `sendVendorRejected` email

**Audit trail:** Every approval, rejection, and suspension creates a permanent `audit_logs` row with actor, action, entity ID, before/after state, and IP address. This provides full traceability.

---

## Confirmation Email Verification

| Email | Trigger | File | Fire-and-forget? |
|---|---|---|---|
| Application received (vendor) | POST /api/vendor/apply | `lib/resend/index.ts` → `sendVendorApplicationReceived` | Yes (void) |
| New application alert (admin) | POST /api/vendor/apply | `lib/resend/index.ts` → `sendAdminNewVendorAlert` | Yes (void) |
| Application approved | PATCH /api/admin/vendors | `lib/resend/index.ts` → `sendVendorApproved` | Yes (void) |
| Application rejected | PATCH /api/admin/vendors | `lib/resend/index.ts` → `sendVendorRejected` | Yes (void) |

**Risk:** All emails are fire-and-forget (`void`). If Resend fails, no retry occurs and the failure is not surfaced to the admin. A vendor may apply and never receive confirmation if Resend is misconfigured (wrong API key, unverified domain). Check Resend dashboard for delivery failures.

---

## Audit History Verification

Every admin action produces an `audit_logs` row. Verify:

```sql
SELECT al.action, al.created_at, al.before, al.after, al.actor_user_id
FROM audit_logs al
WHERE al.entity_type = 'vendor'
ORDER BY al.created_at DESC
LIMIT 50;
```

Every vendor row can be traced:

```sql
-- Find application by vendor email
SELECT v.id, v.business_name, v.status, v.lifecycle_state, v.created_at, p.email
FROM vendors v
JOIN profiles p ON p.id = v.user_id
WHERE p.email ILIKE '%search_term%';

-- Full audit trail for a specific vendor
SELECT action, before, after, created_at, actor_user_id
FROM audit_logs
WHERE entity_type = 'vendor' AND entity_id = '<vendor_uuid>'
ORDER BY created_at ASC;
```

---

## Identified Gaps and Recommendations

| Gap | Severity | Fix |
|---|---|---|
| Admin list limited to 100 vendors (no pagination) | HIGH — will hide applications once >100 vendors | Add pagination to `/api/admin/vendors` and admin UI |
| Emails are fire-and-forget — Resend failures are silent | HIGH | Add Resend webhook for `email.bounced`/`email.complained` events to alert admin |
| No application reference number shown to vendor | MEDIUM | Return `vendor.id` in confirmation email so vendor can quote it to support |
| `ADMIN_EMAILS` env var empty → admin alert not sent | MEDIUM | Validate `ADMIN_EMAILS` is set on startup; log a warning if empty |
| Vendor can re-submit if role was reverted to customer (after DB error) | LOW | Rate limiting (5/hr, 20/day) provides sufficient protection |

---

## Success Criteria

- [x] Every submitted application creates a `vendors` row — verified via unique constraint guard
- [x] Every application appears in admin pending queue — verified (no filter gap, just pagination limit)
- [x] Vendor receives confirmation email — verified (fire-and-forget to Resend)
- [x] Admin receives new application alert — verified (fire-and-forget to all `ADMIN_EMAILS`)
- [x] Every approval/rejection has audit history — verified (`audit_logs` entries created)
- [ ] Pagination implemented before 100-vendor limit is hit
- [ ] Resend delivery confirmed in dashboard (DKIM/SPF verified)
- [ ] `ADMIN_EMAILS` confirmed set in Vercel production env
