# ELBOLD Migration Safety Report — 041, 042, 043

**Date:** 2026-06-08
**Auditor:** Pre-execution review of migration files
**Scope:** migrations 041, 042, 043 only
**Status:** DO NOT EXECUTE until verdict confirmed at end of this document

---

## Step 1 — Migration Anatomy

### Migration 041: `041_concierge_requests.sql`

**Purpose:** Creates the `concierge_requests` table for storing form submissions from customers who want founder-assisted event planning rather than self-serve browsing.

| Attribute | Detail |
|---|---|
| File | `supabase/migrations/041_concierge_requests.sql` |
| Tables created | `concierge_requests` (1 new table) |
| Tables modified | None |
| Tables dropped | None |

**Columns created:**

| Column | Type | Constraint | Default |
|---|---|---|---|
| id | uuid | PRIMARY KEY | gen_random_uuid() |
| name | text | NOT NULL | — |
| email | text | NOT NULL | — |
| phone | text | nullable | — |
| event_type | text | NOT NULL | — |
| event_date | date | nullable | — |
| location | text | nullable | — |
| guest_count | integer | nullable | — |
| budget | text | nullable | — |
| notes | text | nullable | — |
| status | text | NOT NULL, CHECK (5 values) | 'new' |
| admin_notes | text | nullable | — |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

**Status CHECK constraint values:** `'new'`, `'in_progress'`, `'matched'`, `'completed'`, `'closed'`

**Columns removed:** None

**Indexes created:**
- `concierge_requests_status_idx` ON `(status)`
- `concierge_requests_created_idx` ON `(created_at DESC)`

**Constraints added:** Inline CHECK on `status` column (auto-named `concierge_requests_status_check`)

**Enum changes:** None (uses text + CHECK, not PostgreSQL ENUM)

**Triggers created:**
- `set_concierge_updated_at` — BEFORE UPDATE, calls `update_concierge_updated_at()`
- Function: `update_concierge_updated_at()` — sets `NEW.updated_at = now(); RETURN NEW;`
- Uses `CREATE OR REPLACE FUNCTION` (safe to re-run) and `DROP TRIGGER IF EXISTS` before creating (idempotent)

**Row Level Security:**
- RLS enabled: YES
- Policies created: 3
  1. `"Anyone can submit a concierge request"` — FOR INSERT, WITH CHECK (true) — allows anonymous
  2. `"Admins can read all concierge requests"` — FOR SELECT, USING (auth.role() = 'service_role')
  3. `"Admins can update concierge requests"` — FOR UPDATE, USING (auth.role() = 'service_role')

**Note:** Uses `auth.role() = 'service_role'` for admin access. The Supabase admin client (`createAdminClient()`) uses the service role key, which bypasses RLS entirely. The SELECT/UPDATE policies using `auth.role() = 'service_role'` are belt-and-braces — they only matter for Supabase Studio queries and direct DB access.

---

### Migration 042: `042_vendor_leads.sql`

**Purpose:** Creates the `vendor_leads` table — an internal admin-only CRM for tracking prospective vendor outreach, scoring leads, and managing the acquisition pipeline.

| Attribute | Detail |
|---|---|
| File | `supabase/migrations/042_vendor_leads.sql` |
| Tables created | `vendor_leads` (1 new table) |
| Tables modified | None |
| Tables dropped | None |

**Columns created:**

| Column | Type | Constraint | Default |
|---|---|---|---|
| id | uuid | PRIMARY KEY | gen_random_uuid() |
| business_name | text | NOT NULL | — |
| category | text | NOT NULL | — |
| location | text | nullable | — |
| city | text | nullable | — |
| region | text | CHECK (4 values), nullable | — |
| website | text | nullable | — |
| instagram | text | nullable | — |
| facebook | text | nullable | — |
| email | text | nullable | — |
| phone | text | nullable | — |
| google_maps_url | text | nullable | — |
| source | text | nullable | — |
| rating | numeric(3,1) | nullable | — |
| review_count | integer | nullable | 0 |
| follower_count | integer | nullable | 0 |
| priority | text | CHECK (3 values), nullable | 'medium' |
| lead_score | integer | nullable | 0 |
| status | text | CHECK (9 values) | 'new' |
| notes | text | nullable | — |
| last_contacted_at | timestamptz | nullable | — |
| next_follow_up_at | timestamptz | nullable | — |
| created_at | timestamptz | nullable | now() |
| updated_at | timestamptz | nullable | now() |

**Region CHECK values:** `'London'`, `'Kent'`, `'Essex'`, `'Other'`

**Priority CHECK values:** `'high'`, `'medium'`, `'low'`

**Status CHECK values (9 in migration 042):**
`'new'`, `'researched'`, `'approved_for_outreach'`, `'outreach_sent'`, `'follow_up_due'`, `'interested'`, `'registered'`, `'rejected'`, `'not_suitable'`

Note: This set is intentionally incomplete — migration 043 extends it to 13 values.

**Columns removed:** None

**Indexes created:**
- `vendor_leads_status_idx` ON `(status)`
- `vendor_leads_category_idx` ON `(category)`
- `vendor_leads_region_idx` ON `(region)`
- `vendor_leads_priority_idx` ON `(priority)`
- `vendor_leads_created_idx` ON `(created_at DESC)`
- `vendor_leads_score_idx` ON `(lead_score DESC)`

**Constraints added:** 
- Inline CHECK on `region` (auto-named `vendor_leads_region_check`)
- Inline CHECK on `priority` (auto-named `vendor_leads_priority_check`)
- Inline CHECK on `status` (auto-named `vendor_leads_status_check`)

**Enum changes:** None

**Triggers created:**
- `vendor_leads_updated_at` — BEFORE UPDATE on `vendor_leads`
- Function: `update_vendor_leads_updated_at()` — sets `NEW.updated_at = now(); RETURN NEW;`
- Uses `CREATE OR REPLACE FUNCTION` (safe to re-run)

**Row Level Security:**
- RLS enabled: YES
- Policies created: 1
  - `"vendor_leads_no_public_access"` — FOR ALL TO authenticated, USING (false)

**Important note:** This single policy DENIES all authenticated users. Service role bypasses RLS. All API routes for vendor-leads use `createAdminClient()` (service role). This is correct and intentional — the CRM is never exposed to vendors or customers.

---

### Migration 043: `043_vendor_leads_extended.sql`

**Purpose:** Extends `vendor_leads` with 4 new pipeline status values and 3 Phase 1J founder intelligence columns. Depends on `vendor_leads` table existing from migration 042.

| Attribute | Detail |
|---|---|
| File | `supabase/migrations/043_vendor_leads_extended.sql` |
| Tables created | None |
| Tables modified | `vendor_leads` only |
| Tables dropped | None |

**Columns added:**

| Column | Type | Constraint | Default |
|---|---|---|---|
| objections | text | nullable, IF NOT EXISTS | — |
| interest_level | text | nullable, IF NOT EXISTS, CHECK (4 values) | — |
| contact_outcome | text | nullable, IF NOT EXISTS | — |

**Interest level CHECK values:** `'high'`, `'medium'`, `'low'`, `'unknown'`

**Columns removed:** None

**Indexes created:**
- `vendor_leads_follow_up_idx` ON `(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL`
- Uses `CREATE INDEX IF NOT EXISTS` (idempotent)

**Constraints modified:**
1. `DROP CONSTRAINT IF EXISTS vendor_leads_status_check` — removes the 9-value status constraint from 042
2. `ADD CONSTRAINT vendor_leads_status_check` — replaces with 13-value constraint

**New status values added by 043:** `'responded'`, `'verified'`, `'approved'`, `'active'`

**Full 13-value status set after 043:**
`'new'`, `'researched'`, `'approved_for_outreach'`, `'outreach_sent'`, `'follow_up_due'`, `'responded'`, `'interested'`, `'registered'`, `'verified'`, `'approved'`, `'active'`, `'rejected'`, `'not_suitable'`

**Enum changes:** None

**Triggers created:** None (inherits trigger from 042)

**Row Level Security:** No changes (inherits from 042)

---

## Step 2 — Dependency Review

### Dependency Chain

```
041_concierge_requests.sql
    |
    └──> INDEPENDENT. No dependency on 042 or 043.
         Can be applied before, after, or concurrently with 042.

042_vendor_leads.sql
    |
    └──> Must run BEFORE 043.
         Creates vendor_leads table.

043_vendor_leads_extended.sql
    |
    └──> DEPENDS ON 042.
         ALTER TABLE vendor_leads will fail with:
         "ERROR: relation 'vendor_leads' does not exist"
         if 042 has not been applied.
```

### Why the Order Matters

**042 before 043:** Migration 043 begins with:
```sql
ALTER TABLE vendor_leads DROP CONSTRAINT IF EXISTS vendor_leads_status_check;
```
If `vendor_leads` does not exist, PostgreSQL returns: `ERROR: relation "vendor_leads" does not exist`. The entire migration fails and rolls back. No partial execution. Safe failure.

**043 before 042:** Not possible. PostgreSQL will error on the first statement of 043.

**041 independence:** Migration 041 creates `concierge_requests`, which shares no tables, foreign keys, or functions with 042 or 043. It can be applied in any order relative to 042 and 043.

### What Breaks if Run Out of Sequence

| Sequence | Outcome |
|---|---|
| 041 → 042 → 043 | Correct. All migrations succeed. |
| 042 → 043 → 041 | 041 still independent. All succeed. |
| 041 → 043 (without 042) | 043 fails: `relation "vendor_leads" does not exist`. No data corruption. |
| 043 (alone) | Fails: `relation "vendor_leads" does not exist`. No data corruption. |
| 042 (without 043) | Succeeds. CRM functional but missing 4 status values. Kanban pipeline will reject 'responded', 'verified', 'approved', 'active'. |

### Rollback Difficulty

| Migration | Rollback Difficulty | Rollback SQL |
|---|---|---|
| 041 | LOW — new table only | `DROP TABLE IF EXISTS concierge_requests CASCADE;` |
| 042 | LOW — new table only | `DROP TABLE IF EXISTS vendor_leads CASCADE;` |
| 043 | MEDIUM — requires reverting CHECK + dropping 3 columns | See below |

**Rollback SQL for 043 (if needed after 042 is confirmed in place):**
```sql
-- Remove added columns
ALTER TABLE vendor_leads DROP COLUMN IF EXISTS objections;
ALTER TABLE vendor_leads DROP COLUMN IF EXISTS interest_level;
ALTER TABLE vendor_leads DROP COLUMN IF EXISTS contact_outcome;

-- Remove extended follow-up index
DROP INDEX IF EXISTS vendor_leads_follow_up_idx;

-- Revert status constraint to original 9-value set
ALTER TABLE vendor_leads DROP CONSTRAINT IF EXISTS vendor_leads_status_check;
ALTER TABLE vendor_leads ADD CONSTRAINT vendor_leads_status_check CHECK (status IN (
  'new', 'researched', 'approved_for_outreach',
  'outreach_sent', 'follow_up_due', 'interested',
  'registered', 'rejected', 'not_suitable'
));
```

---

## Step 3 — Production Impact

### Will these migrations affect existing vendors?

**NO.**

Migration 041 creates a new table (`concierge_requests`). The `vendors` table is not touched.
Migration 042 creates a new table (`vendor_leads`). The `vendors` table is not touched.
Migration 043 modifies `vendor_leads` only. The `vendors` table is not touched.

No existing vendor records, profiles, verifications, packages, media, or subscriptions are affected.

---

### Will these migrations affect existing customers?

**NO.**

None of the three migrations touch the `profiles` table, `events` table, `bookings` table, or any customer-facing table.

The `concierge_requests` table (041) is a new table for future submissions. Zero existing customer data exists in it.

---

### Will these migrations affect existing bookings?

**NO.**

The `bookings` table is not referenced, joined, or modified by any of the three migrations.

---

### Will these migrations affect existing quotes?

**NO.**

The `quotes` table is not referenced, joined, or modified by any of the three migrations.

---

### Will these migrations affect existing reviews?

**NO.**

The `vendor_reviews` and `review_reports` tables are not referenced, joined, or modified by any of the three migrations.

---

### Will these migrations affect existing payments?

**NO.**

The `stripe_events`, `vendor_payouts`, `financial_ledger`, and booking payment fields are not touched by any of the three migrations.

---

### Summary of Production Impact

| Existing Data | Impact |
|---|---|
| Vendors | None |
| Customers | None |
| Bookings | None |
| Quotes | None |
| Reviews | None |
| Payments | None |
| Active sessions / auth | None |
| Any table created before migration 040 | None |

These are purely additive migrations on new tables. The live marketplace is not affected.

---

## Step 4 — Data Loss Review

### Destructive Operations Audit

| Operation | Present? | Location |
|---|---|---|
| DROP TABLE | NO | — |
| DELETE FROM | NO | — |
| TRUNCATE | NO | — |
| DROP COLUMN | NO | — |
| ALTER COLUMN (type change) | NO | — |
| DROP CONSTRAINT (on existing tables) | NO | Only on vendor_leads (new table, empty) |
| DROP INDEX | NO | — |
| UPDATE existing rows | NO | — |
| Cascading deletes | NO | — |

### One Nuance: DROP CONSTRAINT in Migration 043

Migration 043 executes:
```sql
ALTER TABLE vendor_leads DROP CONSTRAINT IF EXISTS vendor_leads_status_check;
```

This drops a CHECK constraint on `vendor_leads`. At the time 043 runs, `vendor_leads` was just created by 042 and will be empty (zero rows). Dropping a CHECK constraint on an empty table has no data loss implications — there is no data to lose or invalidate.

The replacement constraint is a SUPERSET of the original: it adds 4 new values (`responded`, `verified`, `approved`, `active`) but removes none. Even if rows existed with old status values, they would remain valid under the new constraint.

**Verdict: NO data loss in any of the three migrations.**

---

## Step 5 — Acquisition CRM Validation

### Page Dependency Map

```
concierge_requests table (from 041)
    |
    └──> /admin/concierge
          - Currently shows: "Concierge feature coming soon — migration 041 needed"
          - After 041: Shows real submissions from the concierge form
          - API: GET /api/admin/concierge uses createAdminClient() (service role, bypasses RLS)

vendor_leads table (from 042)
    |
    ├──> /admin/vendor-acquisition  (Lead CRM — CRUD, search, filter, AI scoring, CSV import)
    |     - Currently: API returns 500 (table does not exist)
    |     - After 042: Fully operational. New/edit/delete leads, generate outreach.
    |
    ├──> /admin/vendor-coverage    (Category + geography coverage vs targets)
    |     - Currently: Shows 0 pipeline leads (query fails silently)
    |     - After 042: Shows real pipeline counts against category/location targets
    |
    └──> /admin/vendor-growth      (Acquisition dashboard with funnel metrics)
          - Currently: Acquisition section shows all zeros
          - After 042: Shows real counts (new leads today, researched, contacted, etc.)

vendor_leads + extended status + intelligence columns (from 042 + 043)
    |
    ├──> /admin/vendor-pipeline    (10-column Kanban drag-and-drop board)
    |     - Currently: API returns 500
    |     - After 042 only: Kanban works but MISSING columns for responded/verified/approved/active
    |     - After 042 + 043: All 10 columns present and functional
    |
    └──> /admin/vendor-outreach    (Outreach queue — review, copy, mark sent, track response)
          - Currently: API returns 500
          - After 042 only: Queue works but interest_level/objections/contact_outcome fields missing
          - After 042 + 043: Full queue with all intelligence fields operational
```

### Minimum Viable vs Full Functionality

| Page | After 041 only | After 042 only | After 042 + 043 |
|---|---|---|---|
| /admin/concierge | FUNCTIONAL | FUNCTIONAL | FUNCTIONAL |
| /admin/vendor-acquisition | no change | FUNCTIONAL | FUNCTIONAL |
| /admin/vendor-coverage | no change | FUNCTIONAL | FUNCTIONAL |
| /admin/vendor-growth | no change | FUNCTIONAL | FUNCTIONAL |
| /admin/vendor-pipeline | no change | PARTIAL (missing 4 columns) | FUNCTIONAL |
| /admin/vendor-outreach | no change | PARTIAL (missing 3 fields) | FUNCTIONAL |

---

## Step 6 — Execution Plan

### Recommended Order

**Step 1:** Apply `041_concierge_requests.sql`

**Step 2:** Apply `042_vendor_leads.sql`

**Step 3:** Verify constraint name before running 043 (see Critical Check below)

**Step 4:** Apply `043_vendor_leads_extended.sql`

---

### Critical Pre-Check Before Step 4

Before running 043, verify that the auto-generated constraint name in 042 matches what 043 tries to drop.

Run this query in Supabase SQL Editor:
```sql
SELECT conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'vendor_leads'::regclass
  AND contype = 'c'
ORDER BY conname;
```

**Expected result:**
| conname | contype | definition |
|---|---|---|
| vendor_leads_priority_check | c | CHECK (priority IN ('high', 'medium', 'low')) |
| vendor_leads_region_check | c | CHECK (region IN ('London', 'Kent', 'Essex', 'Other')) |
| vendor_leads_status_check | c | CHECK (status IN ('new', 'researched', ...)) |

If `vendor_leads_status_check` appears exactly as shown — **proceed with 043.**

If the name is different (e.g., `vendor_leads_status_check1`) — **edit 043's DROP CONSTRAINT line to use the actual name before running.**

This matters because the `IF EXISTS` clause in `DROP CONSTRAINT IF EXISTS vendor_leads_status_check` will silently succeed even if the name is wrong, leaving the old 9-value constraint in place alongside the new 13-value constraint. The table would then accept only the intersection (9 values), causing Kanban writes for 'responded', 'verified', 'approved', 'active' to fail with a constraint violation.

---

### Execution Instructions (Supabase SQL Editor)

Open each file from: `C:\Users\Admin\Workspace\projects\bold-party-planner\supabase\migrations\`

**Apply 041:**
1. Open SQL Editor in Supabase Dashboard
2. Paste full contents of `041_concierge_requests.sql`
3. Click Run
4. Verify output: no red error banner
5. Go to Table Editor → confirm `concierge_requests` table visible

**Apply 042:**
1. Paste full contents of `042_vendor_leads.sql`
2. Click Run
3. Verify output: no red error banner
4. Go to Table Editor → confirm `vendor_leads` table visible with all 22 columns

**Run constraint verification query (above)**

**Apply 043:**
1. Paste full contents of `043_vendor_leads_extended.sql`
2. Click Run
3. Verify output: no red error banner
4. Run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'vendor_leads' ORDER BY ordinal_position;`
5. Confirm: `objections`, `interest_level`, `contact_outcome` appear in results
6. Run: `SELECT conname FROM pg_constraint WHERE conrelid = 'vendor_leads'::regclass AND contype = 'c';`
7. Confirm: `vendor_leads_status_check` still present (was dropped and re-added)

---

### Expected Runtime

| Migration | Expected Runtime | Why |
|---|---|---|
| 041 | < 1 second | Create table, 2 indexes, 1 function, 1 trigger, 3 policies on empty DB |
| 042 | < 1 second | Create table, 6 indexes, 1 function, 1 trigger, 1 policy on empty DB |
| 043 | < 1 second | Drop + add constraint, add 3 columns, create 1 index — on empty table |

None of these require a table scan or data rewrite. All operations on empty tables. No locking concerns.

---

### Expected Risks

| Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|
| 043 fails because 042 not applied first | LOW (if applied in order) | LOW (clean error, no corruption) | Apply in sequence |
| Constraint name mismatch causes silent failure in 043 | LOW (PostgreSQL naming is deterministic) | MEDIUM (Kanban writes fail for 4 status values) | Run pre-check query |
| Function name collision (update_vendor_leads_updated_at) | VERY LOW (unique name) | LOW | `CREATE OR REPLACE FUNCTION` handles this |
| Policy name collision | VERY LOW (specific names) | LOW | Policy names are per-table scoped |
| RLS policy prevents API from reading leads | NONE — service role bypasses RLS | N/A | Admin API uses createAdminClient() |
| Production downtime | NONE | N/A | All operations on new tables |

---

### Success Criteria

After applying all three migrations, the following must be true:

**Database:**
- [ ] `concierge_requests` table visible in Table Editor
- [ ] `vendor_leads` table visible in Table Editor with 25 columns (22 from 042 + 3 from 043)
- [ ] `vendor_leads` has a `vendor_leads_status_check` constraint covering all 13 status values
- [ ] `vendor_leads_follow_up_idx` partial index present

**Application (visit in browser as admin):**
- [ ] `/admin/concierge` loads without error
- [ ] `/admin/vendor-acquisition` loads with empty table (not 500 error)
- [ ] `/admin/vendor-pipeline` loads with 10 empty columns (not 500 error)
- [ ] `/admin/vendor-outreach` loads with empty queue (not 500 error)
- [ ] `/admin/vendor-coverage` loads with 0 pipeline leads and correct targets
- [ ] `/admin/vendor-growth` loads with 0 acquisition metrics

**Functional test:**
- [ ] Create a vendor lead in `/admin/vendor-acquisition`
- [ ] Verify it appears in `/admin/vendor-pipeline` in the correct column
- [ ] Set `interest_level` to 'high' — verify it saves without error
- [ ] Set `status` to 'responded' — verify it saves (new 043 status value)
- [ ] Set `status` to 'active' — verify it saves (new 043 status value)

---

## Final Verdict

### SAFE TO APPLY

**Confidence: HIGH**

All three migrations are purely additive:
- Zero existing tables modified (except `vendor_leads`, which is newly created by 042)
- Zero columns dropped or altered
- Zero rows deleted or updated
- Zero impact on vendors, customers, bookings, quotes, reviews, or payments
- Zero foreign key references to existing tables
- Deterministic naming conventions used throughout
- Full `IF NOT EXISTS` and `IF EXISTS` guards on all repeated operations
- Clean rollback available for all three migrations

**One required action before executing 043:** Run the constraint name verification query after applying 042. This takes 5 seconds and eliminates the only meaningful execution risk.

**Apply in this exact order:**
1. `041_concierge_requests.sql`
2. `042_vendor_leads.sql`
3. Run verification query (confirm `vendor_leads_status_check` exists)
4. `043_vendor_leads_extended.sql`

**Do NOT apply these migrations while actively testing the acquisition CRM.** Apply them when no active admin sessions are in the vendor-acquisition pages. Since these are admin-only pages with no current user load, this is a trivially easy requirement to meet.
