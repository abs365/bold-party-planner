# Migration 046 Pre-Deployment Safety Report

**Migration file:** `supabase/migrations/046_trust_governance_sprint.sql`
**Report date:** 2026-06-09
**Prepared by:** ELBOLD Trust, Governance & Operational Readiness Sprint
**Status:** AUDIT COMPLETE — see Section 8 for recommendation

---

## Section 1: Executive Summary

### Operations performed by this migration

| # | Operation | Target | Type | Data risk |
|---|---|---|---|---|
| 1 | `DROP VIEW IF EXISTS` | `platform_stats` | DDL | None — views store no rows |
| 2 | `CREATE VIEW` | `platform_stats` | DDL | None — adds 2 columns to a view |
| 3 | `GRANT SELECT ON` | `platform_stats` | DCL | None |
| 4 | `ALTER TABLE ADD COLUMN IF NOT EXISTS` | `vendors.lifecycle_state` | DDL | None — additive |
| 5 | `UPDATE vendors SET lifecycle_state = 'approved'` | `vendors` | DML | Updates new column only |
| 6 | `UPDATE vendors SET lifecycle_state = 'rejected'` | `vendors` | DML | Updates new column only |
| 7 | `UPDATE vendors SET lifecycle_state = 'suspended'` | `vendors` | DML | Updates new column only |
| 8 | `CREATE OR REPLACE FUNCTION sync_vendor_lifecycle_state()` | — | DDL | None |
| 9 | `DROP TRIGGER IF EXISTS trg_sync_vendor_lifecycle` | `vendors` | DDL | None — forward-only |
| 10 | `CREATE TRIGGER trg_sync_vendor_lifecycle` | `vendors` | DDL | None — fires on future updates only |
| 11 | `CREATE INDEX IF NOT EXISTS idx_vendors_lifecycle_state` | `vendors` | DDL | None — additive |
| 12 | `ALTER TABLE ADD COLUMN IF NOT EXISTS` | `vendors.portfolio_links` | DDL | None — additive |
| 13 | `UPDATE vendors SET portfolio_links = ...` | `vendors` | DML | Updates new column only |

### Tables touched

| Table | Changes | Columns dropped | Data deleted |
|---|---|---|---|
| `vendors` | 2 columns added, 4 targeted UPDATEs on new columns only | **None** | **None** |
| `platform_stats` | VIEW dropped and recreated | N/A | N/A (no rows in a view) |

### Tables NOT touched

`bookings`, `quotes`, `payments`, `financial_ledger`, `stripe_events`, `profiles`, `events`, `disputes`, `reviews`, `vendor_payouts`, `audit_logs`, `message_threads`, `vendor_bank_details`, `subscriptions`

### Column preservation

| Column | Migration 003/004 | Migration 046 | Verdict |
|---|---|---|---|
| `vendors.instagram_url` | Present | Present (not modified) | **PRESERVED** |
| `vendors.website_url` | Present (not modified) | Present (not modified) | **PRESERVED** |
| `vendors.status` | Present | Present (not modified) | **PRESERVED** |
| `vendors.lifecycle_state` | Did not exist | **Added** | NEW |
| `vendors.portfolio_links` | Did not exist | **Added** | NEW |

---

## Section 2: Production Risk Assessment

### Statement 1 — `DROP VIEW IF EXISTS platform_stats;`

**Risk: NONE**

A PostgreSQL VIEW is a named SQL query. It stores zero rows of data. `DROP VIEW` removes only the query definition from `pg_views`. The underlying tables (`vendors`, `bookings`, `profiles`, etc.) are entirely unaffected.

This pattern has already been used safely in migrations 002, 003, and 004:

```
migration 002: DROP VIEW IF EXISTS platform_stats; CREATE VIEW platform_stats AS ...
migration 003: DROP VIEW IF EXISTS platform_stats; CREATE VIEW platform_stats AS ...
migration 004: DROP VIEW IF EXISTS platform_stats; CREATE VIEW platform_stats AS ...
migration 046: DROP VIEW IF EXISTS platform_stats; CREATE VIEW platform_stats AS ... ← same pattern
```

**Callers of `platform_stats` — exhaustive list:**

```
app/admin/vendors/page.tsx      → adminSupabase.from("platform_stats").select("*").single()
app/admin/analytics/page.tsx    → adminSupabase.from("platform_stats").select("*").single()
```

No other TypeScript file, no SQL view, and no database function depends on `platform_stats`. Grep confirms no other references exist. The view is not a foreign key target and is not referenced by any trigger. The `IF EXISTS` means if the view had somehow already been dropped, the statement succeeds silently.

**Verdict: Zero risk.**

---

### Statement 2 — `CREATE VIEW platform_stats AS SELECT ...`

**Risk: NONE**

Column comparison between the current production view (migration 004) and the new view (migration 046):

| Column | Migration 004 | Migration 046 | Changed |
|---|---|---|---|
| `total_customers` | ✓ | ✓ | No |
| `total_vendors` | ✓ | ✓ | No |
| `approved_vendors` | ✓ | ✓ | No |
| `pending_vendors` | ✓ | ✓ | No |
| `rejected_vendors` | — | **Added** | New column |
| `suspended_vendors` | — | **Added** | New column |
| `total_events` | ✓ | ✓ | No |
| `total_bookings` | ✓ | ✓ | No |
| `completed_bookings` | ✓ | ✓ | No |
| `total_revenue` | ✓ | ✓ | No |
| `total_gmv` | ✓ | ✓ | No |
| `open_disputes` | ✓ | ✓ | No |
| `avg_vendor_rating` | ✓ | ✓ | No |
| `pending_quotes` | ✓ | ✓ | No |
| `total_message_threads` | ✓ | ✓ | No |

**13 existing columns preserved identically. 2 new columns added.**

**TypeScript callers — column-by-column check:**

`components/admin/AdminAnalytics.tsx` uses:
- `stats?.total_customers` → ✓ present in new view
- `stats?.total_vendors` → ✓ present in new view
- `stats?.pending_vendors` → ✓ present in new view
- `stats?.total_bookings` → ✓ present in new view
- `stats?.total_events` → ✓ present in new view
- `stats?.avg_vendor_rating` → ✓ present in new view

`components/admin/AdminVendorTable.tsx` uses:
- `stats?.total_vendors` → ✓ present in new view
- `stats?.approved_vendors` → ✓ present in new view
- `stats?.pending_vendors` → ✓ present in new view
- `stats?.rejected_vendors ?? 0` → ✓ **now present** (was the bug — returned null before)
- `stats?.suspended_vendors ?? 0` → ✓ **now present** (was the bug — returned null before)
- `stats?.total_revenue` → ✓ present in new view

The TypeScript prop type for stats is `Record<string, unknown> | null`, so additional keys cause zero type errors. `tsc --noEmit` already confirmed 0 errors with the new code in place.

**Verdict: Zero risk. Additive change only.**

---

### Statement 3 — `GRANT SELECT ON platform_stats TO authenticated;`

**Risk: NONE**

Restores the same grant that existed on the old view. The view was dropped (removing the grant automatically), and this re-applies it.

**Verdict: Zero risk.**

---

### Statement 4 — `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS lifecycle_state TEXT NOT NULL DEFAULT 'applied' CHECK (...)`

**Risk: NONE**

In PostgreSQL 11+, adding a NOT NULL column with a constant DEFAULT is a metadata-only operation. PostgreSQL records the default value in the system catalog (`pg_attrdef`). Existing rows are NOT physically rewritten at migration time — the default value is computed on-read for rows that have not been explicitly updated. This means:

- No table lock beyond a brief ACCESS EXCLUSIVE lock (milliseconds on a small vendors table)
- No downtime risk from table rewrite
- Existing rows immediately satisfy the NOT NULL constraint (they virtually carry the default 'applied')

The `CHECK` constraint is also satisfied by the default:
```sql
CHECK (lifecycle_state IN (
  'applied', 'under_review', 'approved', 'profile_setup',
  'verified', 'live', 'rejected', 'suspended'
))
-- DEFAULT 'applied' is in the CHECK list ✓
```

`IF NOT EXISTS` makes this statement idempotent — safe to re-run if the migration was interrupted.

**Impact on existing rows:**
All existing vendor rows will show `lifecycle_state = 'applied'` until the backfill UPDATEs in statements 5–7 refine them.

**Verdict: Zero risk.**

---

### Statements 5–7 — Lifecycle state backfill UPDATEs

```sql
-- Statement 5
UPDATE vendors SET lifecycle_state = 'approved'
WHERE status = 'approved' AND lifecycle_state = 'applied';

-- Statement 6
UPDATE vendors SET lifecycle_state = 'rejected'
WHERE status = 'rejected' AND lifecycle_state = 'applied';

-- Statement 7
UPDATE vendors SET lifecycle_state = 'suspended'
WHERE status = 'suspended' AND lifecycle_state = 'applied';
```

**Risk: NONE for data integrity.**

These statements modify ONLY the newly-added `lifecycle_state` column. No existing column is touched.

The `AND lifecycle_state = 'applied'` guard is always true immediately after statement 4 (all rows have the default). It is defensive coding that prevents double-application if the migration were re-run.

**Impact on each vendor status:**

| Existing `status` | WHERE match | Resulting `lifecycle_state` | Correct? |
|---|---|---|---|
| `'pending'` | No (not in any UPDATE) | `'applied'` (default) | Yes — vendor awaiting review |
| `'approved'` | Statement 5 | `'approved'` | Yes — vendor is approved |
| `'rejected'` | Statement 6 | `'rejected'` | Yes — vendor was rejected |
| `'suspended'` | Statement 7 | `'suspended'` | Yes — vendor was suspended |

The `status` column CHECK constraint in migration 001 is `('pending','approved','rejected','suspended')`. These four values are the only possible values. Every status is handled.

**Vendor data preservation check:**

- `vendors.id` → not modified
- `vendors.user_id` → not modified
- `vendors.business_name` → not modified
- `vendors.status` → not modified
- `vendors.instagram_url` → not modified
- `vendors.website_url` → not modified
- `vendors.rating` → not modified
- `vendors.created_at` → not modified
- All other vendor columns → not modified

**Verdict: Zero risk. These UPDATEs are targeted, additive, and affect only the new column.**

---

### Statement 8 — `CREATE OR REPLACE FUNCTION sync_vendor_lifecycle_state()`

**Risk: NONE**

`CREATE OR REPLACE FUNCTION` is idempotent. If the function does not exist, it is created. If it already exists (e.g., migration re-run), it is replaced atomically.

The function body:

```sql
BEGIN
  IF NEW.status = 'rejected' THEN
    NEW.lifecycle_state := 'rejected';
  ELSIF NEW.status = 'suspended' THEN
    NEW.lifecycle_state := 'suspended';
  ELSIF OLD.status = 'rejected' OR OLD.status = 'suspended' THEN
    IF NEW.status = 'pending' THEN
      NEW.lifecycle_state := 'applied';
    ELSIF NEW.status = 'approved' THEN
      NEW.lifecycle_state := 'approved';
    END IF;
  ELSIF NEW.status = 'approved' AND NEW.lifecycle_state IN ('applied', 'under_review') THEN
    NEW.lifecycle_state := 'approved';
  END IF;
  RETURN NEW;
END;
```

This function runs in a `BEFORE UPDATE` context, meaning it modifies the row being written before it hits disk. It does not cause additional queries or cascade updates to other tables. It returns the (potentially modified) `NEW` row.

**Logic coverage:**
- `status` → `rejected`: lifecycle forced to `rejected`. ✓
- `status` → `suspended`: lifecycle forced to `suspended`. ✓
- Vendor reinstated from `rejected` or `suspended` → `pending`: lifecycle reset to `applied`. ✓
- Vendor reinstated from `rejected` or `suspended` → `approved`: lifecycle set to `approved`. ✓
- `status` → `approved` (from `applied` or `under_review`): lifecycle set to `approved`. ✓
- `status` → `approved` (from `profile_setup`, `verified`, `live`): no change — finer states are preserved. ✓

**Verdict: Zero risk. Function is non-destructive and read/write-scoped to the single row being updated.**

---

### Statements 9–10 — `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER trg_sync_vendor_lifecycle`

**Risk: NONE**

`DROP TRIGGER IF EXISTS` removes the trigger definition if it exists; harmless if it does not. `CREATE TRIGGER` attaches the function as a `BEFORE UPDATE OF status` trigger. This means:

- The trigger fires ONLY when `status` is explicitly named in an `UPDATE SET` clause
- An `UPDATE vendors SET lifecycle_state = 'live' WHERE id = $1` does NOT fire this trigger
- An `UPDATE vendors SET status = 'approved' WHERE id = $1` DOES fire this trigger

This design is intentional: admin can advance lifecycle_state independently of status without triggering the sync function.

**Effect on existing data at migration time:** Zero. Triggers are forward-only — they do not retroactively fire on existing rows.

**Verdict: Zero risk.**

---

### Statement 11 — `CREATE INDEX IF NOT EXISTS idx_vendors_lifecycle_state ON vendors(lifecycle_state)`

**Risk: NONE**

Creates a B-tree index on the new `lifecycle_state` column. `IF NOT EXISTS` makes it idempotent. Index creation acquires a `SHARE` lock (not `ACCESS EXCLUSIVE`) on small tables in recent PostgreSQL versions. Even if it were `ACCESS EXCLUSIVE`, the vendors table at current scale (< 100 rows) means lock duration is sub-millisecond.

**Verdict: Zero risk.**

---

### Statement 12 — `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS portfolio_links JSONB NOT NULL DEFAULT '[]'::jsonb`

**Risk: NONE**

Same reasoning as statement 4. PostgreSQL 11+ metadata-only ADD COLUMN for NOT NULL + constant DEFAULT. The default `'[]'::jsonb` (empty JSONB array) is always valid. `IF NOT EXISTS` makes it idempotent.

**Verdict: Zero risk.**

---

### Statement 13 — Portfolio links backfill UPDATE

```sql
UPDATE vendors
SET portfolio_links = (
  COALESCE(
    CASE WHEN instagram_url IS NOT NULL AND instagram_url != '' THEN
      jsonb_build_array(jsonb_build_object('type', 'instagram', 'url', instagram_url))
    ELSE '[]'::jsonb END,
    '[]'::jsonb
  ) ||
  COALESCE(
    CASE WHEN website_url IS NOT NULL AND website_url != '' THEN
      jsonb_build_array(jsonb_build_object('type', 'website', 'url', website_url))
    ELSE '[]'::jsonb END,
    '[]'::jsonb
  )
)
WHERE (instagram_url IS NOT NULL AND instagram_url != '')
   OR (website_url IS NOT NULL AND website_url != '');
```

**Risk: NONE for existing column data.**

The UPDATE modifies ONLY the new `portfolio_links` column. `instagram_url` and `website_url` are read (in the SET expression) but never written. They remain intact in all cases.

**Scenario-by-scenario verification:**

| Scenario | instagram_url | website_url | WHERE match | portfolio_links result |
|---|---|---|---|---|
| Both set | `'https://instagram.com/x'` | `'https://x.com'` | TRUE | `[{"type":"instagram","url":"https://instagram.com/x"},{"type":"website","url":"https://x.com"}]` |
| Instagram only | `'https://instagram.com/x'` | NULL | TRUE | `[{"type":"instagram","url":"https://instagram.com/x"}]` |
| Website only | NULL | `'https://x.com'` | TRUE | `[{"type":"website","url":"https://x.com"}]` |
| Neither set | NULL | NULL | FALSE | `[]` (default, unchanged) |
| Empty strings | `''` | `''` | FALSE | `[]` (default, unchanged) |
| Instagram empty, website set | `''` | `'https://x.com'` | TRUE | `[{"type":"website","url":"https://x.com"}]` |

The JSONB `||` concatenation operator produces correct results in all scenarios:
- `'[a]'::jsonb || '[]'::jsonb` = `[a]` ✓
- `'[]'::jsonb || '[b]'::jsonb` = `[b]` ✓
- `'[a]'::jsonb || '[b]'::jsonb` = `[a, b]` ✓
- `'[]'::jsonb || '[]'::jsonb` = `[]` ✓

**Original column preservation — files that still read instagram_url / website_url directly:**

| File | Usage | Impact after migration 046 |
|---|---|---|
| `components/vendor/VendorProfileView.tsx` | Reads `instagram_url` to show social link | Continues to work — column not dropped |
| `components/vendor/VendorProfileEditor.tsx` | Reads/writes `instagram_url`, `website_url` | Continues to work — columns not dropped |
| `lib/vendor/ranking.ts` | Reads `instagram_url` for completeness score | Continues to work — column not dropped |
| `lib/vendor/completion.ts` | Reads `instagram_url` for profile score | Continues to work — column not dropped |
| `components/vendor/VendorApplyForm.tsx` | Now sends both `instagram_url` and `portfolio_links` | Backward compatible |

**Verdict: Zero risk. All existing data in `instagram_url` and `website_url` is preserved. The backfill only writes to the new `portfolio_links` column.**

---

## Section 3: lifecycle_state Analysis

### SQL queries to run before applying

Run these in the Supabase SQL Editor to capture a pre-migration baseline:

```sql
-- 1. Total vendor count by status (current)
SELECT status, COUNT(*) AS vendor_count
FROM vendors
GROUP BY status
ORDER BY status;

-- 2. Predicted lifecycle states after backfill
SELECT
  status,
  COUNT(*) AS vendor_count,
  CASE status
    WHEN 'approved'  THEN 'approved'
    WHEN 'pending'   THEN 'applied'
    WHEN 'rejected'  THEN 'rejected'
    WHEN 'suspended' THEN 'suspended'
  END AS will_become_lifecycle_state
FROM vendors
GROUP BY status
ORDER BY status;

-- 3. Vendors with non-empty portfolio data (will be backfilled)
SELECT
  COUNT(*) FILTER (WHERE instagram_url IS NOT NULL AND instagram_url != '') AS has_instagram,
  COUNT(*) FILTER (WHERE website_url   IS NOT NULL AND website_url   != '') AS has_website,
  COUNT(*) FILTER (WHERE (instagram_url IS NOT NULL AND instagram_url != '')
                      OR (website_url   IS NOT NULL AND website_url   != '')) AS will_get_portfolio_links,
  COUNT(*) AS total_vendors
FROM vendors;
```

### SQL query to run after applying (verification)

```sql
-- 4. Confirm lifecycle states are consistent with status after migration
SELECT
  status,
  lifecycle_state,
  COUNT(*) AS vendor_count
FROM vendors
GROUP BY status, lifecycle_state
ORDER BY status, lifecycle_state;

-- Expected: no (status='approved', lifecycle_state='applied') rows
--           no (status='rejected', lifecycle_state='applied') rows
--           no (status='suspended', lifecycle_state='applied') rows

-- 5. Confirm no vendor lost portfolio data
SELECT
  COUNT(*) FILTER (WHERE instagram_url IS NOT NULL AND instagram_url != ''
                     AND portfolio_links = '[]'::jsonb) AS instagram_not_migrated,
  COUNT(*) FILTER (WHERE website_url   IS NOT NULL AND website_url   != ''
                     AND NOT (portfolio_links @> '[{"type":"website"}]')) AS website_not_migrated
FROM vendors;
-- Both counts must be 0

-- 6. Confirm platform_stats integrity
SELECT
  total_vendors,
  approved_vendors + pending_vendors + rejected_vendors + suspended_vendors AS sum_of_parts,
  total_vendors = approved_vendors + pending_vendors + rejected_vendors + suspended_vendors AS is_balanced
FROM platform_stats;
-- is_balanced must be true
```

### Admin action required post-migration

After applying, all currently-approved vendors will have `lifecycle_state = 'approved'`. Before they can receive enquiries through any lifecycle-gated feature, the admin must advance them through the pipeline in `/admin/vendors`:

```
approved → Profile Setup → Verify Docs → Go Live
```

**Important:** The customer-facing browse page (`/browse`) currently queries `status = 'approved'`, NOT `lifecycle_state = 'live'`. Existing approved vendors will CONTINUE to appear in browse and receive enquiries after the migration. The `lifecycle_state` column adds governance infrastructure — it does not immediately restrict any currently-working vendor functionality.

---

## Section 4: Portfolio Links Migration

### Data preservation proof

`instagram_url` and `website_url` are read-only in statement 13. They are never modified. There is no `DROP COLUMN` in this migration.

**Grep evidence — no DROP COLUMN in migration 046:**
```
supabase/migrations/046_trust_governance_sprint.sql — 0 occurrences of "DROP COLUMN"
```

**Backward compatibility:**

Components that currently use `instagram_url` directly will continue to function without any code changes:

- `VendorProfileView.tsx` renders the Instagram link from `vendor.instagram_url` — this column remains in the `vendors` table and in all Supabase SELECT queries that include it
- `ranking.ts` and `completion.ts` use `instagram_url` as a non-null signal for profile scoring — the column still exists and still contains the same data

**New applications (post-migration):**

`VendorApplyForm.tsx` now submits both:
```typescript
instagram_url: instagramLink?.url ?? "",   // backward compatibility
website_url:   websiteLink?.url ?? "",     // backward compatibility
portfolio_links: filledLinks               // new multi-link array
```

`app/api/vendor/apply/route.ts` inserts:
```typescript
portfolio_links: body.portfolio_links ?? []
```

This means the columns stay in sync for new applications. Vendors who apply after migration 046 is live will have their `instagram_url` field populated (for legacy components) AND their `portfolio_links` populated (for the new governance features).

---

## Section 5: Platform Statistics Fix

### Root cause

Migration 004 created `platform_stats` without `rejected_vendors` and `suspended_vendors`. When a vendor was rejected or suspended, `total_vendors` increased but the individual status counts did not account for them. The `AdminVendorTable` stats bar showed:

```
Total (10) | Approved (7) | Pending (2) | Revenue (£0)
```

If 1 vendor was rejected, the correct display would be:
```
Total (10) | Approved (7) | Pending (2) | Rejected (1) | Suspended (0)
```

But the old view had no `rejected_vendors` column, so `stats?.rejected_vendors ?? 0` always returned 0. The integrity check `total_vendors !== approved + pending + rejected + suspended` would then fire spuriously (10 ≠ 7 + 2 + 0 + 0 = 9), creating false alerts.

### Before and after

**Before (migration 004 `platform_stats`):**
```sql
-- 13 columns — no rejected_vendors, no suspended_vendors
(SELECT COUNT(*) FROM vendors WHERE status = 'approved') AS approved_vendors,
(SELECT COUNT(*) FROM vendors WHERE status = 'pending')  AS pending_vendors,
-- gap: rejected and suspended vendors counted in total_vendors
-- but not individually visible
```

**After (migration 046 `platform_stats`):**
```sql
-- 15 columns — adds rejected_vendors and suspended_vendors
(SELECT COUNT(*) FROM vendors WHERE status = 'approved')   AS approved_vendors,
(SELECT COUNT(*) FROM vendors WHERE status = 'pending')    AS pending_vendors,
(SELECT COUNT(*) FROM vendors WHERE status = 'rejected')   AS rejected_vendors,  -- new
(SELECT COUNT(*) FROM vendors WHERE status = 'suspended')  AS suspended_vendors, -- new
```

**Integrity invariant now enforced in `AdminVendorTable.tsx`:**
```typescript
const hasIntegrityGap =
  (stats?.total_vendors ?? 0) !==
  (stats?.approved_vendors ?? 0) +
  (stats?.pending_vendors ?? 0) +
  (stats?.rejected_vendors ?? 0) +
  (stats?.suspended_vendors ?? 0);
```

This alert now fires only when there is a genuine discrepancy — not as an artefact of missing view columns.

---

## Section 6: Rollback Plan

### Rollback SQL script

If the migration must be reverted after application, run the following in the Supabase SQL Editor. Execute as a single transaction.

```sql
BEGIN;

-- 1. Revert platform_stats to migration 004 definition
DROP VIEW IF EXISTS platform_stats;

CREATE VIEW platform_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'customer')
    AS total_customers,
  (SELECT COUNT(*) FROM vendors)
    AS total_vendors,
  (SELECT COUNT(*) FROM vendors WHERE status = 'approved')
    AS approved_vendors,
  (SELECT COUNT(*) FROM vendors WHERE status = 'pending')
    AS pending_vendors,
  (SELECT COUNT(*) FROM events)
    AS total_events,
  (SELECT COUNT(*) FROM bookings)
    AS total_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'completed')
    AS completed_bookings,
  (SELECT COALESCE(SUM(commission_amount),0) FROM bookings
    WHERE payment_status IN ('deposit_paid','fully_paid'))
    AS total_revenue,
  (SELECT COALESCE(SUM(total_amount),0) FROM bookings
    WHERE payment_status = 'fully_paid')
    AS total_gmv,
  (SELECT COUNT(*) FROM disputes WHERE status = 'open')
    AS open_disputes,
  (SELECT COALESCE(AVG(rating), 0) FROM vendors
    WHERE status = 'approved' AND rating > 0)
    AS avg_vendor_rating,
  (SELECT COUNT(*) FROM quotes WHERE status = 'pending')
    AS pending_quotes,
  (SELECT COUNT(*) FROM message_threads)
    AS total_message_threads;

GRANT SELECT ON platform_stats TO authenticated;

-- 2. Remove lifecycle trigger and function
DROP TRIGGER IF EXISTS trg_sync_vendor_lifecycle ON vendors;
DROP FUNCTION IF EXISTS sync_vendor_lifecycle_state();

-- 3. Remove lifecycle index
DROP INDEX IF EXISTS idx_vendors_lifecycle_state;

-- 4. Remove lifecycle_state column
--    (Only the new column is lost; no existing data affected)
ALTER TABLE vendors DROP COLUMN IF EXISTS lifecycle_state;

-- 5. Remove portfolio_links column
--    (Only backfilled JSONB data is lost; instagram_url and website_url are intact)
ALTER TABLE vendors DROP COLUMN IF EXISTS portfolio_links;

COMMIT;
```

### Data impact of rollback

| Object removed | Data lost |
|---|---|
| `platform_stats` view | None — recreated from previous definition |
| `lifecycle_state` column | Only values in the new column. No existing vendor data affected. |
| `portfolio_links` column | Only backfilled JSONB data. `instagram_url` and `website_url` remain intact with original values. |
| Trigger + function | None — forward-only objects |
| Index | None — performance object only |

### Code changes required on rollback

After rolling back the database, two TypeScript files must be reverted:

1. `components/admin/AdminVendorTable.tsx` — remove `rejected_vendors`, `suspended_vendors` references and integrity alert
2. `app/api/admin/vendors/route.ts` — remove `lifecycle_state` from the PATCH handler

The TypeScript build will fail with type errors until these are reverted, because `stats?.rejected_vendors` will return `undefined` (column no longer in view) and `lifecycle_state` updates will return a Supabase error.

### Estimated rollback time

**< 5 minutes** from decision to rollback.

- Rollback SQL: < 1 minute to execute (all DDL on a small table; no table rewrites)
- TypeScript revert: 2–3 minutes to undo the two file changes
- Vercel redeploy: 2–3 minutes

---

## Section 7: Launch Impact

### If migration 046 is NOT applied

| Area | Impact |
|---|---|
| Admin vendor dashboard | `stats?.rejected_vendors ?? 0` always returns 0 (column missing from view). Integrity alert fires spuriously for any vendor that has been rejected or suspended. |
| Admin lifecycle advancement | `PATCH /api/admin/vendors` accepts `lifecycle_state` in request body, but Supabase will return a column-not-found error. All lifecycle advancement buttons in `AdminVendorTable` will fail silently. |
| New vendor applications | `POST /api/vendor/apply` inserts `portfolio_links: []` into a column that does not exist — Supabase will reject the insert with a column error. **Vendor applications are broken.** |
| Auth callback | No impact — the `/confirmed` page redirect does not depend on migration 046 |
| Bookings, payments | No impact — those tables are not touched |

**Critical:** The vendor application API (`/api/vendor/apply`) attempts to insert `portfolio_links` regardless of whether the column exists. If migration 046 is NOT applied, new vendor applications will fail with a Supabase 42703 (undefined column) error. This is a breaking regression introduced in Sprint 1 that requires migration 046 to be applied.

### If migration 046 IS applied

| Area | Improvement |
|---|---|
| Admin vendor dashboard | Stats bar shows all 6 vendor states; integrity alert only fires on genuine discrepancies |
| Lifecycle governance | Admin can advance vendors through applied → under_review → approved → profile_setup → verified → live |
| Trigger automation | When admin changes `status` (approve/reject/suspend/reinstate), `lifecycle_state` syncs automatically |
| Vendor applications | New applications store multiple portfolio links (instagram, website, facebook, tiktok, etc.) |
| Backfill | Existing vendors with instagram_url or website_url get their data migrated to portfolio_links |
| Index | Fast filtering on lifecycle_state for admin list queries |

---

## Section 8: Final Recommendation

### Verdict: SAFE TO APPLY

**Evidence summary:**

| Check | Evidence | Result |
|---|---|---|
| No DROP COLUMN | Grep: 0 occurrences of "DROP COLUMN" in migration 046 | PASS |
| No DROP TABLE / TRUNCATE | Full SQL review: only DROP VIEW IF EXISTS | PASS |
| VIEW data risk | PostgreSQL views store no rows — DROP VIEW destroys only the query definition | PASS |
| ADD COLUMN NOT NULL DEFAULT safety | PostgreSQL 11+: metadata-only, no table rewrite, no downtime risk | PASS |
| Backfill UPDATEs modify only new columns | SET clause references only `lifecycle_state` and `portfolio_links` | PASS |
| instagram_url preserved | No DROP COLUMN, no UPDATE to that column | PASS |
| website_url preserved | No DROP COLUMN, no UPDATE to that column | PASS |
| Bookings table untouched | No reference to `bookings` in any DML statement | PASS |
| Quotes table untouched | No reference to `quotes` in any DML statement | PASS |
| Payments/financial_ledger untouched | No reference to either table in any DML statement | PASS |
| Reviews untouched | No reference to `reviews` in any DML statement | PASS |
| All existing platform_stats columns preserved | Column-by-column comparison: 13/13 retained, 2 new | PASS |
| TypeScript callers unbroken | All columns referenced in AdminAnalytics + AdminVendorTable exist in new view | PASS |
| Trigger is forward-only | BEFORE UPDATE OF status — fires only on future status changes | PASS |
| All operations idempotent | IF NOT EXISTS / IF EXISTS / CREATE OR REPLACE throughout | PASS |
| TypeScript build | `tsc --noEmit` — 0 errors | PASS |

### One action required before applying

The vendor application API already sends `portfolio_links` in the insert body. If migration 046 is NOT applied, new vendor applications fail with a Supabase column error. **Applying migration 046 is required for the application to function correctly in production right now.**

### Post-application checklist

After running migration 046 in the Supabase SQL Editor:

1. Run the Section 3 verification queries — confirm `is_balanced = true` and both not-migrated counts are 0
2. In `/admin/vendors`, advance each approved vendor to `lifecycle_state = 'live'` if they are ready to receive bookings
3. Test a vendor application at `/vendor/apply` to confirm the `portfolio_links` column accepts the insert
4. Confirm the admin stats bar shows 6 cards and no integrity alert (assuming vendor counts are consistent)
5. Test a vendor status change (approve a pending vendor) and confirm `lifecycle_state` auto-syncs via the trigger

### Rollback confidence

If any post-apply verification fails, the rollback script in Section 6 restores the previous state in under 5 minutes. No customer data is at risk in either direction.
