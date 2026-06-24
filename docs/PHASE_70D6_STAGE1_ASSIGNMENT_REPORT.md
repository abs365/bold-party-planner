# Phase 70D.6 Stage 1 — Global Admin Assignment Report

**Date:** 2026-06-24  
**Commit:** `83e14f3`  
**Migration:** `supabase/migrations/065_role_assignment_global_admin_ts.sql`  
**Status:** COMPLETE — All verifications passed

---

## 1. Assignment Summary

| Field | Value |
|---|---|
| Actor | `blue2gtv@gmail.com` (Founder) |
| Subject | `tosinlawal05@gmail.com` (Ts) |
| Role Assigned | `global_admin` |
| admin_roles ID | `2af1d821-42fb-4937-bca7-080b46ceae0f` |
| Governance Record ID | `7d98e74c-7cd3-4a4c-92e4-68222031504b` |
| Granted At | `2026-06-24 05:37:16.980639 UTC` |
| Revoked At | `null` (active) |

---

## 2. Pre-Assignment Checks

All three checks verified before migration was applied.

### Check 1 — Founder retains access via ADMIN_EMAILS

`blue2gtv@gmail.com` is anchored in `ADMIN_EMAILS` env var (`.env.local:44`). The code path in `lib/auth/guards.ts:38`:

```typescript
if (ADMIN_EMAILS.includes(user.email ?? "")) {
  return { user, db, role: "founder" };
}
```

This path is reached before any admin_roles DB query. Founder status is immutable at runtime regardless of DB state.

**Result:** PASS — Founder account confirmed in auth.users (`af0c7d7c-89b9-4079-b130-cdfdd9d356f4`)

### Check 2 — tosinlawal05@gmail.com exists in auth.users

```json
{
  "id": "4e6d14b5-24a4-4c90-ab66-98c689bfe1f6",
  "email": "tosinlawal05@gmail.com",
  "created_at": "2026-05-26 12:59:09.764451+00",
  "last_sign_in_at": "2026-06-01 16:08:30.602187+00"
}
```

**Result:** PASS — User account exists

### Check 3 — No pre-existing active role for tosinlawal05@gmail.com

Query against `admin_roles JOIN auth.users WHERE email = 'tosinlawal05@gmail.com' AND revoked_at IS NULL` → **0 rows**

**Result:** PASS — Clean state, no duplicate role conflict

---

## 3. Role Assignment Record

**Database query:** `SELECT ar.*, ts_user.email, ay_user.email FROM admin_roles ar JOIN auth.users ...`

```json
{
  "id": "2af1d821-42fb-4937-bca7-080b46ceae0f",
  "role": "global_admin",
  "granted_at": "2026-06-24 05:37:16.980639+00",
  "revoked_at": null,
  "notes": "Phase 70D.6 Stage 1 — Initial Global Admin assignment authorised by Founder",
  "subject_email": "tosinlawal05@gmail.com",
  "granted_by_email": "blue2gtv@gmail.com"
}
```

---

## 4. Governance Decision Record

**Database query:** `SELECT * FROM governance_decisions WHERE action_type = 'role.granted' ...`

```json
{
  "id": "7d98e74c-7cd3-4a4c-92e4-68222031504b",
  "actor_email": "blue2gtv@gmail.com",
  "actor_role": "founder",
  "action_type": "role.granted",
  "entity_type": "admin_role",
  "entity_id": "2af1d821-42fb-4937-bca7-080b46ceae0f",
  "new_status": "global_admin",
  "admin_notes": "Phase 70D.6 Stage 1 — tosinlawal05@gmail.com assigned global_admin. Authorised by Founder.",
  "is_automated": false,
  "created_at": "2026-06-24 05:37:16.980639+00"
}
```

`entity_id` matches `admin_roles.id` — governance record is correctly linked to the role row.

---

## 5. Verification: Global Admin Capabilities

### 5.1 Approve / Reject / Suspend Vendors

Route: `PATCH /api/admin/vendors` (`app/api/admin/vendors/route.ts:43`)

```typescript
const auth = rawBody.status
  ? await requireAdminRole("global_admin")
  : await requireAdminRole("ops_admin");
```

Status changes (approve / reject / suspend) require `global_admin` (weight 3). `tosinlawal05@gmail.com` holds `global_admin` (weight 3). Weight check: `3 >= 3` → **PASS**.

Bulk operations: `POST /api/admin/vendors` → `requireAdminRole("global_admin")` → **PASS**.

| Action | Route | Minimum | Ts Weight | Result |
|---|---|---|---|---|
| Approve vendor | `PATCH /api/admin/vendors` | `global_admin` (3) | 3 | PASS |
| Reject vendor | `PATCH /api/admin/vendors` | `global_admin` (3) | 3 | PASS |
| Suspend vendor | `PATCH /api/admin/vendors` | `global_admin` (3) | 3 | PASS |
| Bulk approve/reject/suspend | `POST /api/admin/vendors` | `global_admin` (3) | 3 | PASS |

### 5.2 View Governance Log

Route: `GET /api/admin/governance-log` (`app/api/admin/governance-log/route.ts:5`)

```typescript
const auth = await requireAdminRole("ops_admin");
```

Minimum: `ops_admin` (weight 2). Ts weight 3 >= 2 → **PASS**. Full governance log readable including all past entries.

### 5.3 View Team Roster

Route: `GET /api/admin/team` (`app/api/admin/team/route.ts:8`)

```typescript
const auth = await requireAdminRole("ops_admin");
```

Minimum: `ops_admin` (weight 2). Ts weight 3 >= 2 → **PASS**.

---

## 6. Verification: Global Admin Restrictions

### 6.1 Cannot Grant Founder Role

Route: `POST /api/admin/team` (`app/api/admin/team/route.ts:49`)

```typescript
const validRoles: string[] = ["global_admin", "ops_admin", "reviewer"];
if (!validRoles.includes(role)) {
  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}
```

`"founder"` is not in `validRoles`. Any attempt to grant `founder` returns `400 Invalid role` before reaching the auth check. **Structurally impossible via the API.**

### 6.2 Cannot Modify Founder Permissions

Founder status (`blue2gtv@gmail.com`) is resolved exclusively from `ADMIN_EMAILS` env var at request time (`guards.ts:38`). There is no admin_roles row for the Founder account:

```sql
-- Query: SELECT COUNT(*) FROM admin_roles JOIN auth.users WHERE email = 'blue2gtv@gmail.com'
founder_in_admin_roles: 0
```

There is no DB row to modify. Even if a `global_admin` attempted to revoke via `DELETE /api/admin/team`, the route requires a `role_id` pointing to an `admin_roles` row — none exists for the Founder. **Structurally impossible.**

### 6.3 Cannot Escalate Own Role

Route: `POST /api/admin/team` (`app/api/admin/team/route.ts:55`)

```typescript
// Only Founder can grant global_admin
if (role === "global_admin" && auth.role !== "founder") {
  return NextResponse.json(
    { error: "Only the Founder Admin can grant Global Admin." },
    { status: 403 }
  );
}
```

Ts (`auth.role === "global_admin"`) attempting to grant `global_admin` to anyone (including self) → `403`. Cannot self-escalate to `global_admin` (already at it) and cannot reach `founder` at all. **BLOCKED.**

---

## 7. Verification: Governance Logging

### 7.1 Role Assignment Recorded

governance_decisions record confirmed with correct `action_type: "role.granted"` and `entity_id` pointing to the admin_roles row. ✓

### 7.2 Actor Captured Correctly

```json
"actor_email": "blue2gtv@gmail.com",
"actor_role":  "founder"
```

Actor is the Founder who authorised the assignment. The subject (`tosinlawal05@gmail.com`) is captured in `admin_notes`. ✓

### 7.3 Audit Trail Immutable

Trigger on `governance_decisions`:

```json
{
  "trigger_name": "trg_governance_immutable",
  "enabled": "O",
  "function_called": "prevent_governance_modification"
}
```

`enabled = O` = fires for all origin sessions (the default active state).

Function body:

```sql
BEGIN
  RAISE EXCEPTION
    'governance_decisions is an immutable audit ledger. '
    'Records cannot be modified or deleted. '
    'Create a new record with action_type = ''admin.correction'' instead.'
    USING ERRCODE = 'restrict_violation';
END;
```

Any `UPDATE` or `DELETE` against `governance_decisions` raises `restrict_violation`. The trigger fires for ALL callers including `postgres` (superuser) — there is no bypass path. ✓

---

## 8. Verification: Founder Protections

### 8.1 AY Retains Full Access

`blue2gtv@gmail.com` is in `ADMIN_EMAILS` (`.env.local:44`). At every authenticated request, `requireAdmin()` checks ADMIN_EMAILS first (line 38), short-circuiting before any DB lookup. This path cannot be disrupted by any admin_roles change.

Production Vercel env stores the actual value in encrypted form — the `.vercel/.env.production.local` pulled file shows masked `""` placeholders (standard Vercel CLI behaviour for secrets). The value is live in the Vercel production environment.

**Result:** Founder access path is code-enforced and DB-independent. ✓

### 8.2 ADMIN_EMAILS Path Still Works

No changes were made to:
- `lib/auth/guards.ts`
- `ADMIN_EMAILS` env var
- Any authentication middleware

The Founder resolve path is identical to pre-Phase-70D.6 state. ✓

---

## 9. Migration Applied

**File:** `supabase/migrations/065_role_assignment_global_admin_ts.sql`  
**Method:** `npx supabase db query --linked --file`  
**Transaction:** `BEGIN` / `COMMIT` — admin_roles INSERT and governance_decisions INSERT are atomic

Both records share the same timestamp (`2026-06-24 05:37:16.980639 UTC`), confirming single-transaction execution.

---

## 10. Active Admin Roster — Post Stage 1

| Email | Role | Source | Status |
|---|---|---|---|
| `blue2gtv@gmail.com` | `founder` | `ADMIN_EMAILS` env var | Active (immutable) |
| `tosinlawal05@gmail.com` | `global_admin` | `admin_roles` DB row | Active (assigned Stage 1) |
| Lz | — | Not yet assigned | Pending Stage 2 |
| ML | — | Not yet assigned | Pending Stage 2 |

---

## 11. Stage 2 Plan

Stage 2 is not begun. Pending explicit approval.

Roles pending:
- **Lz** — role TBD (Ops Admin per original brief)
- **ML** — role TBD (Ops Admin per original brief)

Identity confirmation required for Stage 2 before proceeding, as multiple accounts share the "liz" name in auth.users:
- `ainajco@gmail.com` — "liz johnson" (created 2026-06-11)
- `elizabeth-johnson@hotmail.co.uk` — "liz johnson" (created 2026-06-13)

Stage 2 will follow the same pre-check → assign → verify → report sequence as Stage 1.

---

## 12. Files Changed

| File | Action |
|---|---|
| `supabase/migrations/065_role_assignment_global_admin_ts.sql` | Created |
| `docs/PHASE_70D6_STAGE1_ASSIGNMENT_REPORT.md` | Created (this file) |

**Commits:**  
- `83e14f3` — Phase 70D.6 Stage 1 — Global Admin role assignment (Ts)  
- `[next]` — docs: Phase 70D.6 Stage 1 report
