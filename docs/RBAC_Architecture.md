# Role-Based Access Control Architecture

**Date:** 2026-06-09
**Sprint:** ELBOLD Trust, Governance & Operational Readiness
**Phase:** 7
**Status:** DESIGN ONLY — implement in Phase 2 before employee onboarding

---

## Objective

Replace the current binary admin model (admin vs non-admin based on email address) with a structured role-based access system that supports multiple team members with scoped permissions. Required by investors before onboarding operations staff.

---

## Current State

All admin access is determined by:

```typescript
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",")...
```

If your email is in `ADMIN_EMAILS`, you have full access to everything. There is no distinction between a founder reviewing financials and a support agent reading a customer message.

**Risk:** A compromised admin account, or a dishonest employee with admin access, can view all financial data, process all refunds, modify all vendor statuses, and access all customer data with no audit differentiation.

---

## Proposed Roles

### Founder
**Description:** Full platform access. Unrestricted.

**Access:**
- All admin pages
- Finance dashboard (payments, payouts, refunds)
- RBAC management (assign/revoke roles)
- Platform settings
- User deletion
- Audit logs (all)
- Vendor lifecycle (all stages)

---

### Operations Manager
**Description:** Day-to-day marketplace operations. No financial read access.

**Access:**
- Vendor management (approve, reject, suspend, advance lifecycle)
- Customer management (view profiles, booking history)
- Bookings management (view, resolve disputes)
- Messages (admin view of all threads)
- Notifications management

**Blocked from:**
- Finance dashboard
- Payout processing
- Refund processing
- Platform settings
- RBAC management

---

### Verification Officer
**Description:** Vendor document review only. Narrowly scoped.

**Access:**
- View vendor applications
- Access verification documents
- Update verification level
- Write verification notes
- Advance lifecycle from `applied` → `under_review` → `approved`

**Blocked from:**
- Customer data
- Bookings
- Financial data
- Messages
- Suspension/rejection

---

### Finance Officer
**Description:** Financial operations only. No vendor or customer profile access.

**Access:**
- Finance dashboard (GMV, revenue, commission)
- Payout queue (mark as paid)
- Refunds (process, view history)
- Stripe reconciliation report
- Financial ledger

**Blocked from:**
- Vendor profiles
- Customer profiles
- Messages
- Verification
- Marketplace operations

---

### Support Agent
**Description:** Customer and vendor support only.

**Access:**
- Messages (read all threads, write as admin)
- Booking status (read only)
- Customer profiles (read only — name, email, booking history)
- Vendor profiles (read only — business name, status)
- Support tickets
- Platform FAQ management

**Blocked from:**
- Payments
- Refunds
- Vendor approval/rejection
- Financial data
- Verification documents

---

## Database Design

### New Tables

```sql
-- Admin roles enum
CREATE TYPE admin_role AS ENUM (
  'founder',
  'operations_manager',
  'verification_officer',
  'finance_officer',
  'support_agent'
);

-- Admin users with assigned roles
CREATE TABLE admin_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        admin_role NOT NULL DEFAULT 'support_agent',
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- Permissions registry
CREATE TABLE admin_permissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role        admin_role NOT NULL,
  resource    TEXT NOT NULL,    -- e.g. 'vendors', 'finance', 'messages'
  action      TEXT NOT NULL,    -- e.g. 'read', 'write', 'approve', 'process_payment'
  UNIQUE(role, resource, action)
);
```

### Permission Matrix

| Resource | Founder | Ops Manager | Verification | Finance | Support |
|---|---|---|---|---|---|
| vendors.read | Y | Y | Y | N | Y (limited) |
| vendors.approve | Y | Y | Y | N | N |
| vendors.reject | Y | Y | N | N | N |
| vendors.suspend | Y | Y | N | N | N |
| vendors.verification | Y | N | Y | N | N |
| customers.read | Y | Y | N | N | Y |
| bookings.read | Y | Y | N | N | Y |
| bookings.resolve | Y | Y | N | N | N |
| finance.read | Y | N | N | Y | N |
| finance.payout | Y | N | N | Y | N |
| finance.refund | Y | N | N | Y | N |
| messages.read | Y | Y | N | N | Y |
| messages.write | Y | Y | N | N | Y |
| admin_users.manage | Y | N | N | N | N |
| platform.settings | Y | N | N | N | N |

---

## API Guard Design

### Current (replace this)

```typescript
export async function requireAdmin(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) return null;
  const db = await createAdminClient();
  return { user, db };
}
```

### New Design

```typescript
export type AdminRole =
  | "founder"
  | "operations_manager"
  | "verification_officer"
  | "finance_officer"
  | "support_agent";

export type AdminContext = {
  user: User;
  db: AdminClient;
  role: AdminRole;
};

export async function requireAdmin(
  requiredRole?: AdminRole | AdminRole[]
): Promise<AdminContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = await createAdminClient();

  // Founders are still identified by ADMIN_EMAILS for bootstrap access
  const isFounder = ADMIN_EMAILS.includes(user.email ?? "");

  if (isFounder) {
    return { user, db, role: "founder" };
  }

  // Other roles are looked up in admin_users table
  const { data: adminUser } = await db
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .maybeSingle();

  if (!adminUser) return null;

  const role = adminUser.role as AdminRole;

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(role)) return null;
  }

  return { user, db, role };
}

// Convenience guards
export const requireFinanceAccess = () =>
  requireAdmin(["founder", "finance_officer"]);

export const requireVerificationAccess = () =>
  requireAdmin(["founder", "operations_manager", "verification_officer"]);

export const requireVendorApproval = () =>
  requireAdmin(["founder", "operations_manager", "verification_officer"]);
```

---

## Admin UI Changes Required

### New: Admin User Management Page (`/admin/team`)

Founder-only page for managing team roles:
- List current admin users with roles
- Invite new admin user (by email)
- Change role
- Revoke access

### Existing Pages — Add Role Guards

| Page | Allowed Roles |
|---|---|
| `/admin/finance` | founder, finance_officer |
| `/admin/payouts` | founder, finance_officer |
| `/admin/vendors` | founder, operations_manager, verification_officer |
| `/admin/verifications` | founder, operations_manager, verification_officer |
| `/admin/messages` | founder, operations_manager, support_agent |
| `/admin/customers` | founder, operations_manager, support_agent |
| `/admin/bookings` | founder, operations_manager, support_agent |
| `/admin/analytics` | founder, operations_manager |
| `/admin` (launch/cockpit) | all admin roles |

---

## Migration Path

1. **Phase 1 (now):** Keep current email-based system for founder-only operation
2. **Phase 2 (before first employee):**
   - Apply DB migration to create `admin_users` + `admin_permissions`
   - Update `requireAdmin()` in `lib/auth/guards.ts`
   - Add role checks to all admin API routes
   - Build `/admin/team` management page
   - Test with a second account before onboarding any staff

---

## Audit Trail

Every admin action already produces an `audit_logs` entry with `actor_user_id`. Once RBAC is implemented, include `role` in the audit log `metadata` field so you can see which role performed which action.

---

## Estimated Implementation Time

| Component | Estimate |
|---|---|
| DB migration | 1 hour |
| Update requireAdmin() | 2 hours |
| Update all admin API routes | 4 hours |
| Update all admin pages (server-side guard) | 3 hours |
| Build /admin/team page | 3 hours |
| Testing | 3 hours |
| **Total** | **~16 hours** |
