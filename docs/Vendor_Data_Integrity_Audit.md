# Vendor Data Integrity Audit

**Date:** 2026-06-09
**Sprint:** ELBOLD Trust, Governance & Operational Readiness
**Phase:** 1

---

## Objective

Verify that vendor counts displayed in the admin dashboard are accurate and internally consistent.

The invariant that must hold at all times:

```
Total Vendors = Approved + Pending + Rejected + Suspended
```

---

## Root Cause Analysis

### Finding 1 — platform_stats view missing status breakdown

**File:** `supabase/migrations/004_phase4.sql` (lines 179–193)

The `platform_stats` database view, last recreated in migration 004, contained:

```sql
(SELECT COUNT(*) FROM vendors) AS total_vendors,
(SELECT COUNT(*) FROM vendors WHERE status = 'approved') AS approved_vendors,
(SELECT COUNT(*) FROM vendors WHERE status = 'pending') AS pending_vendors,
```

It did **not** include `rejected_vendors` or `suspended_vendors`.

**Impact:** Any vendor whose status is `rejected` or `suspended` contributed to `total_vendors` but was invisible in the breakdown. Example: if Total = 12, Approved = 2, Pending = 7, then 3 vendors were in `rejected` or `suspended` state with no counter exposed to the admin dashboard.

**Fix:** Migration `046_trust_governance_sprint.sql` drops and recreates `platform_stats` with:

```sql
(SELECT COUNT(*) FROM vendors WHERE status = 'rejected')  AS rejected_vendors,
(SELECT COUNT(*) FROM vendors WHERE status = 'suspended') AS suspended_vendors,
```

---

### Finding 2 — AdminVendorTable stats bar hid the gap

**File:** `components/admin/AdminVendorTable.tsx` (line 210)

The stats bar rendered 4 cards: Total, Approved, Pending, Platform Revenue. Rejected and suspended counts were never displayed, making it impossible to spot a reconciliation mismatch at a glance.

**Additional bug:** The fallback logic `stats?.total_vendors ?? stats?.approved_vendors ?? 0` meant that if `total_vendors` was NULL it silently fell back to `approved_vendors` — understating the true vendor count.

**Fix:** The stats bar now renders 6 cards: Total, Approved, Pending, Rejected, Suspended, Revenue. An inline integrity-check alert fires if `Total != Approved + Pending + Rejected + Suspended`, with a clear message pointing to this document.

---

### Finding 3 — API query limit of 100

**File:** `app/api/admin/vendors/route.ts` (line 23)

```typescript
const { data, error } = await query.limit(100);
```

The admin vendor list API caps results at 100 rows. Once the platform has more than 100 vendors the admin table will silently show a truncated list. This does not affect the `platform_stats` counts (which query the table directly) but may cause confusion when the table count differs from the stat cards.

**Recommendation:** Implement pagination with a `page` and `per_page` query parameter before the vendor count exceeds 100.

---

## SQL Queries Used

Run these queries in the Supabase SQL Editor to verify counts at any time.

### Count by status
```sql
SELECT
  COUNT(*)                                              AS total_vendors,
  COUNT(*) FILTER (WHERE status = 'approved')           AS approved,
  COUNT(*) FILTER (WHERE status = 'pending')            AS pending,
  COUNT(*) FILTER (WHERE status = 'rejected')           AS rejected,
  COUNT(*) FILTER (WHERE status = 'suspended')          AS suspended,
  COUNT(*) FILTER (WHERE status NOT IN ('approved','pending','rejected','suspended')) AS unknown_status
FROM vendors;
```

### Verify reconciliation
```sql
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status IN ('approved','pending','rejected','suspended')) AS accounted_for,
  COUNT(*) - COUNT(*) FILTER (WHERE status IN ('approved','pending','rejected','suspended')) AS gap
FROM vendors;
```

### Orphaned vendor rows (no matching auth user)
```sql
SELECT v.id, v.business_name, v.status, v.created_at
FROM vendors v
LEFT JOIN profiles p ON p.id = v.user_id
WHERE p.id IS NULL;
```

### Duplicate vendor rows for same user
```sql
SELECT user_id, COUNT(*) AS vendor_count, array_agg(id) AS vendor_ids
FROM vendors
GROUP BY user_id
HAVING COUNT(*) > 1;
```

### Missing profile for vendor
```sql
SELECT v.id, v.user_id, v.business_name, v.status
FROM vendors v
LEFT JOIN profiles p ON p.id = v.user_id
WHERE p.id IS NULL;
```

### Lifecycle state vs status consistency
```sql
SELECT id, business_name, status, lifecycle_state
FROM vendors
WHERE
  (status = 'approved'  AND lifecycle_state NOT IN ('approved','profile_setup','verified','live'))
  OR (status = 'rejected'  AND lifecycle_state != 'rejected')
  OR (status = 'suspended' AND lifecycle_state != 'suspended')
  OR (status = 'pending'   AND lifecycle_state NOT IN ('applied','under_review'));
```

---

## Expected Counts (run after migration 046)

| Column | Source |
|---|---|
| `total_vendors` | `COUNT(*) FROM vendors` |
| `approved_vendors` | `WHERE status = 'approved'` |
| `pending_vendors` | `WHERE status = 'pending'` |
| `rejected_vendors` | `WHERE status = 'rejected'` |
| `suspended_vendors` | `WHERE status = 'suspended'` |

**Invariant:** `total_vendors = approved_vendors + pending_vendors + rejected_vendors + suspended_vendors`

Any deviation indicates either a bad status value (covered by the `unknown_status` query above) or a view definition bug.

---

## Migration Applied

`supabase/migrations/046_trust_governance_sprint.sql`

Run in Supabase Dashboard SQL Editor. The migration is idempotent (uses DROP IF EXISTS / ADD COLUMN IF NOT EXISTS).

---

## Success Criteria

- [x] `platform_stats` view exposes `rejected_vendors` and `suspended_vendors`
- [x] Admin vendor table displays all 5 status counts
- [x] Inline reconciliation alert fires when Total != sum of status counts
- [ ] SQL queries above return zero orphaned/duplicate records in production
- [ ] Lifecycle state column consistent with status column for all existing vendors (run consistency query above)

---

## Recommended Follow-up

1. Apply migration 046 in Supabase Dashboard.
2. Run all 5 SQL queries above and record results.
3. If orphaned records exist, investigate via Supabase Auth dashboard and either repair or purge.
4. Set a weekly reminder to re-run the reconciliation query.
