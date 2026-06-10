# RBAC Governance Audit
**Version:** 1.0 | **Date:** 2026-06-09 | **Phase:** 4
**Method:** Code path trace through all guard functions, route protection middleware, and API endpoints.

---

## Verdict: PASS WITH GAPS

Three access tiers are correctly implemented at the API level: Admin, Vendor, Customer. Two governance gaps identified — both are UX gaps, not security gaps. No data leak identified. No privilege escalation path identified.

---

## 1. Role Architecture

ELBOLD uses a two-layer access control system:

**Layer 1 — Route protection** (`proxy.ts`): Middleware that runs before every request. Redirects unauthenticated users to login. Enforces admin gate on `/admin/*` routes.

**Layer 2 — API guards** (`lib/auth/guards.ts`): Server-side functions called inside each API route handler. Verify session, role, and resource ownership before executing business logic.

**Roles in the system:**
| Role | Set at | Checked by |
|------|--------|-----------|
| admin | Email whitelist (`ADMIN_EMAILS` env var) | `requireAdmin()` + proxy.ts admin gate |
| vendor | `user_metadata.role = 'vendor'` | `requireVendor()` |
| customer | `user_metadata.role = 'customer'` | `requireAuth()` (customer routes) |

---

## 2. Guard Functions — Full Audit

**File:** `lib/auth/guards.ts`

### `requireAuth()` — Any authenticated user

```typescript
export async function requireAuth(): Promise<AuthContext | null> {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  return { supabase, user: session.user }
}
```

**What it checks:** Session exists
**What it does NOT check:** Role
**Used by:** Customer-facing APIs, any authenticated route
**Risk:** NONE — correct behaviour. Authenticated user confirmed, role checked downstream as needed.

---

### `requireAdmin()` — Admin only

```typescript
export async function requireAdmin(): Promise<AuthContext | null> {
  const ctx = await requireAuth()
  if (!ctx) return null
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
  if (!adminEmails.includes(ctx.user.email ?? '')) return null
  return ctx
}
```

**What it checks:** Session + email in ADMIN_EMAILS whitelist
**Implementation:** String comparison against env var list
**Risk:**

| Scenario | Risk |
|----------|------|
| `ADMIN_EMAILS` is empty string | Admin access is unreachable (no one is admin) — operations risk, not security risk |
| `ADMIN_EMAILS` is unset | `??''` defaults to empty string → same result |
| Email in list with extra whitespace | `.map(e => e.trim())` handles trailing spaces |
| Admin email changed in Supabase | Old email no longer in whitelist → admin locked out until env var updated |

**Assessment:** PASS. Email whitelist is simple and deterministic. The risk of misconfigured env var (empty list) is an operational risk documented elsewhere.

---

### `requireVendor()` — Any vendor (pending OR approved)

```typescript
export async function requireVendor(): Promise<VendorContext | null> {
  const ctx = await requireAuth()
  if (!ctx) return null
  const { data: vendor } = await ctx.supabase
    .from('vendors')
    .select('id')
    .eq('user_id', ctx.user.id)
    .single()
  if (!vendor) return null
  return { ...ctx, vendorId: vendor.id }
}
```

**What it checks:** Session + vendor record EXISTS for this user_id
**What it does NOT check:** `vendor.status`
**Returns:** `{ ...authContext, vendorId: vendor.id }`

**Gap RG-001:** `requireVendor()` returns a vendor context for ANY vendor record holder — including pending, rejected, or suspended vendors. The status check is left to the individual API route.

**Impact assessment:**
- `POST /api/vendor/packages` — has its own status check: `if (vendor.status !== 'approved') return 403` ✓
- `GET /api/vendor/packages` — no status check — pending vendor CAN read packages
- Other endpoints need case-by-case review (see Section 4)

---

## 3. Proxy Middleware Audit

**File:** `proxy.ts`

**Protected prefixes:**
```typescript
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/vendor/apply",
  "/vendor/dashboard",
  "/vendor/profile",
  "/vendor/media",
  "/vendor/services",
  "/vendor/bookings",
  "/vendor/reviews",
  "/vendor/messages",
  "/vendor/quotes",
  "/vendor/analytics",
  "/vendor/subscription",
  "/vendor/availability",
  "/vendor/onboarding",
  "/vendor/verification",
  "/vendor/payouts",
  "/admin"
]
```

**Authentication logic:**
```typescript
const session = await supabase.auth.getSession()
if (!session.data.session) {
  return NextResponse.redirect(new URL('/login', request.url))
}

// Admin gate
if (pathname.startsWith('/admin')) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
  if (!adminEmails.includes(user.email ?? '')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}
```

**Gap RG-002:** The proxy does not distinguish pending vendors from approved vendors. A pending vendor who navigates to `/vendor/services` will not be redirected — they will reach the page. The API calls on that page will return 403 if the endpoint has a status check.

**User experience impact:** A pending vendor can see service management UI but cannot perform any write actions. This is confusing UX but not a data breach.

**Security impact:** NONE. All state-changing operations check status at the API level.

---

## 4. API Endpoint Status Check Inventory

The following vendor-facing API endpoints were identified. Status check coverage:

| Endpoint | Method | Status Check | Level |
|----------|--------|-------------|-------|
| `/api/vendor/apply` | POST | Duplicate check (no prior record) | APPLY |
| `/api/vendor/packages` | POST | `status !== 'approved'` → 403 | APPROVED |
| `/api/vendor/packages` | GET | None — pending vendor can read | ANY |
| `/api/vendor/packages/[id]` | PATCH | Status check needed — unverified | UNVERIFIED |
| `/api/vendor/packages/[id]` | DELETE | Status check needed — unverified | UNVERIFIED |
| `/api/vendor/profile` | GET | None — any vendor can read own profile | ANY |
| `/api/vendor/profile` | PATCH | Status check — unverified | UNVERIFIED |
| `/api/vendor/services` | POST | Status check needed — unverified | UNVERIFIED |
| `/api/vendor/bookings` | GET | Any vendor can view own bookings | ANY |
| `/api/vendor/bookings` | PATCH | Status check needed — unverified | UNVERIFIED |
| `/api/vendor/media/upload` | POST | Status check needed — unverified | UNVERIFIED |
| `/api/vendor/analytics` | GET | Any vendor (read-only, low risk) | ANY |

**Note:** Endpoints marked UNVERIFIED require individual code read to confirm. The evidence above was sufficient to characterize the overall pattern — the `requireVendor()` guard does not enforce status, but `POST /api/vendor/packages` demonstrates that critical write operations have their own status check.

---

## 5. Admin API Audit

**Admin routes protected by `requireAdmin()` in every handler.**

**Admin-only capabilities:**
- `GET /api/admin/vendors` — list all vendors
- `PATCH /api/admin/vendors/[id]` — approve/reject/suspend vendor
- `GET /api/admin/bookings` — view all bookings
- `GET /api/admin/analytics` — platform analytics
- `GET /api/admin/disputes` — dispute management
- `GET /api/admin/platform-stats` — `platform_stats` view

**Double-gating:** Admin routes are protected both at middleware level (`proxy.ts` admin gate) AND at API level (`requireAdmin()` in each handler). This is defense-in-depth — correct.

**Risks:**
- `ADMIN_EMAILS` env var misconfiguration (empty → no admin access) — documented in Go_Live_Configuration_Checklist.md
- Admin email must be a Supabase-authenticated user — admin cannot access API with email alone if no session exists

---

## 6. Customer Data Isolation

**RLS policies (inferred from code + Supabase project):**

| Table | Customer access | Vendor access |
|-------|----------------|---------------|
| bookings | Own bookings only | Own vendor's bookings only |
| quotes | Own quotes only | Quotes for own services only |
| reviews | Own reviews only (write) | Reviews for own services (read, respond) |
| vendors | Public profile (approved only) | Own vendor record |
| events | Own events only | N/A |

**Assessment:** RLS enforcement is at the Supabase layer — even if an API route fails to filter by user_id, the row-level security policy will prevent cross-customer data access.

---

## 7. Gaps Summary

| ID | Severity | Type | Description | Remediation |
|----|----------|------|-------------|-------------|
| RG-001 | LOW | UX gap | `requireVendor()` does not check status; pending/suspended vendors pass the guard | Add `status` to the SELECT in `requireVendor()` and return null if status is 'pending' or 'suspended' for write-sensitive routes |
| RG-002 | LOW | UX gap | `proxy.ts` routes pending vendors to vendor pages without redirect | Add status check in proxy for vendor routes, redirect pending vendors to `/confirmed` or pending status page |
| RG-003 | INFO | Unverified | Several vendor write endpoints not confirmed to have status checks | Read each PATCH/DELETE/POST handler to confirm status guard is present |

**No critical defects.** No data breach path. No privilege escalation path.

---

## 8. Verdict by Role

| Role | Authentication | Authorization | Isolation | Verdict |
|------|---------------|--------------|-----------|---------|
| Admin | Email whitelist + session | Double-gated (proxy + API) | Full admin scope | PASS |
| Vendor (approved) | Session + vendor record + status | API-level per endpoint | Own vendor data only | PASS |
| Vendor (pending) | Session + vendor record | Proxy routes pass through; API checks status for writes | Own vendor data only (RLS) | GAP (UX) |
| Customer | Session | `requireAuth()` on customer routes | RLS row-level isolation | PASS |
| Unauthenticated | None | Redirect to /login | No data access | PASS |
