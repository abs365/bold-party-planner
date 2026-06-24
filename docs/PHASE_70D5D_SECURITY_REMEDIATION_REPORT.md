# Phase 70D.5D — Security Remediation Report

**Date:** 2026-06-24  
**Migrations applied:** 061, 062, 063  
**Deployment method:** `supabase db query --linked --file` (bypasses version format check; SQL applied directly to production DB)  
**Status:** ALL P0 AND P1 FINDINGS RESOLVED  
**New findings discovered during Security Advisor re-run:** Yes — documented below (Phase 70D.5E required)

---

## 1. Migration Execution Results

| Migration | Finding addressed | Applied | Result |
|---|---|---|---|
| 061 | RLS-001 (`email_log`) + RLS-002 (`stripe_events`) | ✓ | `rows: []` — no errors |
| 062 | EXP-002 (`financial_events` policy leak + missing customer policy) | ✓ | `rows: []` — no errors |
| 063 | SDF-001/SDF-002 (8 SECURITY DEFINER functions missing `SET search_path`) | ✓ | `rows: []` — no errors |

---

## 2. Database Verification — Evidence

### 2.1 RLS Status on Remediated Tables

**Query:** `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('email_log','stripe_events','financial_events') AND schemaname = 'public'`

| Table | rowsecurity |
|---|---|
| `email_log` | **true** ✓ |
| `financial_events` | **true** ✓ |
| `stripe_events` | **true** ✓ |

### 2.2 Exact Policies — Post-Migration

**Query:** `SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE tablename IN ('email_log','stripe_events','financial_events') AND schemaname = 'public' ORDER BY tablename, policyname`

| Table | Policy | Cmd | Effective qual |
|---|---|---|---|
| `email_log` | `email_log_service_only` | ALL | `false` — service role only |
| `financial_events` | `fin_events_customer_select` | SELECT | `ledger_id IN (SELECT id FROM financial_ledger WHERE customer_id = auth.uid())` |
| `financial_events` | `fin_events_vendor_select` | SELECT | `ledger_id IN (SELECT id FROM financial_ledger WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))` |
| `stripe_events` | `stripe_events_service_only` | ALL | `false` — service role only |

**Confirmed:** The `ledger_id IS NULL` branch has been completely removed from `fin_events_vendor_select`. System-level events (RECONCILIATION_RUN, WEBHOOK_REJECTED, WEBHOOK_RECEIVED) are now inaccessible to authenticated users. The customer policy (`fin_events_customer_select`) now exists for the first time — customers can read their own financial events.

### 2.3 SECURITY DEFINER Functions — search_path Verification

**Query:** `SELECT proname, prosecdef, proconfig FROM pg_proc JOIN pg_namespace ON ... WHERE nspname = 'public' AND prosecdef = true ORDER BY proname`

All 12 SECURITY DEFINER functions in the public schema now have explicit `search_path` set:

| Function | search_path | Status |
|---|---|---|
| `auto_create_contract` | `public` | ✓ Fixed by 063 |
| `auto_create_payout` | `public` | ✓ Fixed by 063 |
| `check_review_allowed` | `public` | ✓ Fixed by 063 |
| `expire_old_quotes` | `public` | ✓ Fixed by 063 |
| `handle_new_user` | `public, auth` | ✓ Pre-existing (migration 020) |
| `increment_vendor_profile_views` | `public` | ✓ Fixed by 063 |
| `mark_quote_converted` | `public` | ✓ Fixed by 063 |
| `notify_user` | `public` | ✓ Fixed by 063 |
| `purge_demo_auth_entries` | `public, auth` | ✓ Pre-existing (already set) |
| `seed_checklist_from_plan` | `public` | ✓ Fixed by 063 |
| `set_demo_user_password` | `auth, public` | ✓ Pre-existing (already set) |
| `update_vendor_rating` | `public` | ✓ Pre-existing (migration 054) |

**Result:** 0 SECURITY DEFINER functions without explicit search_path remaining.

---

## 3. Security Advisor Re-Run Results

**Command:** `supabase db advisors --linked --output json`

### 3.1 Summary by Finding Type

| Finding | Count | Status |
|---|---|---|
| `rls_disabled_in_public` | **0** | ✅ **RESOLVED** — was 2 (email_log, stripe_events) |
| `security_definer_view` | 4 | 🔴 **NEW FINDING** — discovered this run; not in prior audit |
| `function_search_path_mutable` | 17 | ⚠️ Pre-existing; SECURITY INVOKER functions (not DEFINER) |
| `authenticated_security_definer_function_executable` | 12 | ℹ️ Expected — Option B not approved, no REVOKE implemented |
| `anon_security_definer_function_executable` | 12 | ℹ️ Expected — same |
| `rls_policy_always_true` | 5 | ⚠️ Pre-existing — includes `platform_settings` public read |
| `multiple_permissive_policies` | 174 | ℹ️ Performance advisory — not a security vulnerability |
| `auth_rls_initplan` | 98 | ℹ️ Performance advisory — not a security vulnerability |
| `public_bucket_allows_listing` | 2 | ⚠️ Pre-existing — storage buckets, not in scope |
| `auth_leaked_password_protection` | 1 | ⚠️ Pre-existing — auth config, not in scope |
| `extension_in_public` | 1 | ℹ️ Pre-existing — `uuid-ossp` in public schema |

### 3.2 rls_disabled_in_public — RESOLVED

**Before Phase 70D.5D:** 2 findings (`email_log`, `stripe_events`)  
**After Phase 70D.5D:** **0 findings**

---

## 4. New Findings Discovered During Re-Run

### NEW-001: security_definer_view — 4 Views Without security_invoker = true

**Severity: HIGH**  
**Discovery:** Security Advisor re-run. Not detected in Phase 70D.5C because the migration files declare no SECURITY DEFINER clause — the flag arises from PostgreSQL default view semantics (views run as the view owner unless `security_invoker = true` is explicitly set via `reloptions`).

**Technical explanation:** In PostgreSQL 15+, the `security_invoker = true` view option makes a view's underlying queries run as the calling user, respecting their RLS policies. Without this option, views run as the **view owner** (postgres/supabase superuser), which has `BYPASSRLS` — meaning RLS on underlying tables is bypassed for queries made through these views.

**Affected views and risk:**

| View | anon SELECT | authenticated SELECT | Data exposed |
|---|---|---|---|
| `vendor_performance_summary` | **Yes** | **Yes** | ALL vendors' earnings, booking counts, unique customer counts — financial data |
| `event_guest_stats` | **Yes** | **Yes** | ALL events' guest counts (total, RSVP breakdowns, VIP counts) — bypasses event ownership |
| `platform_stats` | **Yes** | **Yes** | Platform-wide financial metrics (total_revenue, total_gmv, booking counts) |
| `public_vendor_profiles` | **Yes** | **Yes** | id, full_name, avatar_url for approved vendors — intentionally public |

**Impact assessment by view:**

`vendor_performance_summary` — **HIGH RISK**  
Any anonymous visitor can query this view and receive every vendor's `total_earnings`, `completed_bookings`, `pending_bookings`, and `unique_customers`. The underlying `bookings` and `vendors` tables have RLS, but the view bypasses it. 13 vendor records currently exposed.

`event_guest_stats` — **HIGH RISK**  
Any anonymous visitor can query this view and receive guest aggregate statistics for every event (total_guests, accepted/declined/tentative/pending RSVPs, VIP count, plus-one confirmations). The underlying `guests` table has RLS, but the view bypasses it.  
Note: `app/api/guests/route.ts` correctly scopes its query to a specific `event_id` after validating event ownership — the application code is safe. The vector is a direct PostgREST RPC/REST call bypassing the API layer.

`platform_stats` — **MEDIUM RISK**  
Exposes platform-wide aggregate financial metrics. Already intentionally accessible to authenticated users; the anon access and SECURITY DEFINER nature are not materially worse than the existing `platform_settings` public read policy.

`public_vendor_profiles` — **LOW RISK / INTENTIONAL**  
Intentionally public. Limited to id, full_name, avatar_url for approved vendors only. However, the SECURITY DEFINER flag means the view bypasses the `profiles` table's RLS — this is why it was created this way (the 027 migration scoped this intentionally, but the reloptions flag was not set).

**Application code notes:**  
Neither `vendor_performance_summary` nor `platform_stats` nor `event_guest_stats` (outside the guests route's scoped query) is called by current application routes in a way that would expose cross-user data. The risk is **direct PostgREST access by anonymous visitors**.

**Recommended remediation (Phase 70D.5E):**
```sql
-- For each view: recreate with security_invoker = true
-- This makes underlying table RLS enforced as the querying user's identity
ALTER VIEW vendor_performance_summary SET (security_invoker = true);
ALTER VIEW event_guest_stats SET (security_invoker = true);
ALTER VIEW platform_stats SET (security_invoker = true);
ALTER VIEW public_vendor_profiles SET (security_invoker = true);
```
Note: After setting `security_invoker = true` on `public_vendor_profiles`, anon queries will still return approved vendor display info because the profiles table has the 027 policy scoped to approved vendor user_ids.

---

## 5. Remaining Pre-Existing Findings (Explained)

### function_search_path_mutable (17 findings) — Not addressed in 70D.5D

These are regular `SECURITY INVOKER` functions (not SECURITY DEFINER). The Supabase advisor flags all functions without an explicit `SET search_path`. These are utility/trigger functions:

`update_updated_at_column`, `update_vendor_warnings_updated_at`, `update_subscription_plans_updated_at`, `set_bank_details_updated_at`, `set_pilot_vendor_updated_at`, `set_pilot_bug_updated_at`, `update_ledger_updated_at`, `update_concierge_updated_at`, `update_vendor_leads_updated_at`, `sync_vendor_lifecycle_state`, `generate_vendor_slug`, `update_vcn_updated_at`, `update_manual_contacts_updated_at`, `update_mcn_updated_at`, `protect_connect_account_id`, `update_connect_onboarding_updated_at`, `prevent_governance_modification`

**Risk assessment:** These are SECURITY INVOKER — they run as the calling user, not the function owner. A mutable search_path in SECURITY INVOKER context cannot be used to impersonate the function owner. The risk is significantly lower than SECURITY DEFINER without search_path. Addressable in a future cleanup migration.

### authenticated_security_definer_function_executable / anon_security_definer_function_executable (12 each) — Expected

Advisors flag SECURITY DEFINER functions that are callable by authenticated or anon roles. This includes `notify_user`, `increment_vendor_profile_views`, and the demo/trigger functions. **Option B (REVOKE execute) was explicitly not approved for Phase 70D.5D.** These findings will persist until Option B is implemented in a future phase.

### rls_policy_always_true (5 findings) — Pre-existing

The `USING (true)` policies from `platform_settings` and other intentional public-read tables. Pre-existing. Documented in Phase 70D.5C as EXP-001. Not in scope for Phase 70D.5D.

---

## 6. Regression Verification

### 6.1 Production Health Check

**Endpoint:** `GET https://www.elbold.com/api/health`  
**Status:** 200 OK

```json
{
  "status": "ok",
  "timestamp": "2026-06-24T04:53:53.631Z",
  "uptime": 2,
  "checks": {
    "database":    { "status": "ok", "latencyMs": 964 },
    "auth":        { "status": "ok", "latencyMs": 381 },
    "storage":     { "status": "ok", "latencyMs": 248 },
    "environment": { "status": "ok" }
  }
}
```

### 6.2 Payment Flow — No Regression

**stripe_events write path:** `app/api/payments/webhook/route.ts` and `connect-webhook/route.ts` both use `createAdminClient()` (service role). The `USING (false)` policy added by migration 061 does not affect service role. Service role can still INSERT to `stripe_events`.

**Verified via service role query:** `stripe_events` contains **4 records** — reads via service role succeed. Writes from webhook handlers are unaffected.

**financial_events write path:** `lib/finance/ledger.ts:appendLedgerEvent()` called with the `createAdminClient()` supabase client. Service role bypasses RLS. The policy change in migration 062 does not affect inserts.

**financial_events null-ledger records:** **6 records** exist with `ledger_id IS NULL` (RECONCILIATION_RUN, WEBHOOK_RECEIVED, WEBHOOK_REJECTED events). These remain intact in the DB. They are now inaccessible to authenticated users — which is the intended outcome.

### 6.3 Governance — No Regression

| Check | Result |
|---|---|
| `governance_decisions` row count | 0 (no decisions logged — expected, no admin actions taken post-deployment) |
| `admin_roles` active rows | 0 (no roles granted — Phase 70D.6 not started) |
| `governance_decisions` service role read | ✓ accessible |
| Immutability trigger | Unchanged — `prevent_governance_modification()` not modified by any migration |

### 6.4 Vendor and Customer Flows — No Regression

No application code was changed in Phase 70D.5D. All changes are database-only (DDL: RLS policies and function definitions). There are no TypeScript changes, no Vercel deployment, and no changes to any API route behaviour.

| Flow | Risk of regression | Evidence |
|---|---|---|
| Vendor profile views (`increment_vendor_profile_views`) | None — body identical, search_path added | Track-view route uses `createAdminClient()` ✓ |
| Booking notifications (`notify_user`) | None — body identical, search_path added | All notification call sites unchanged ✓ |
| Review submission (`check_review_allowed`) | None — trigger body identical | Logic for `status = 'completed'` check preserved ✓ |
| Contract creation (`auto_create_contract`) | None — trigger body identical, `OLD.status IS NULL OR` condition preserved verbatim | ✓ |
| Checklist seeding (`seed_checklist_from_plan`) | None — 036 version reproduced verbatim with v_item variable | ✓ |
| Payout creation (`auto_create_payout`) | None — trigger body identical | ✓ |
| Quote expiry (`expire_old_quotes`) | None — body identical | ✓ |
| Quote conversion (`mark_quote_converted`) | None — body identical | ✓ |
| Vendor bank details (`vendor_bank_details`) | None — migration 063 does not touch this table | ✓ |

### 6.5 Stripe Connect — Not Modified

- `STRIPE_CONNECT_ENABLED` — not touched
- `bookings.customer_id`, `bookings.event_id`, `financial_ledger.customer_id` — not touched
- No checkout or webhook behaviour changed

---

## 7. Data Protection Proofs — Post-Remediation

### Customer Data

| Data type | Table | Protection status |
|---|---|---|
| Email history | `email_log` | ✅ **FIXED** — `USING(false)`, service role only |
| Profile | `profiles` | ✅ Protected (migration 027, unchanged) |
| Bookings | `bookings` | ✅ Protected (`customer_id = auth.uid()`) |
| Financial ledger | `financial_ledger` | ✅ Protected (`customer_id = auth.uid()`) |
| Financial events | `financial_events` | ✅ **FIXED** — customer reads own via `fin_events_customer_select` |
| Guest lists | `guests` | ✅ RLS enabled; view `event_guest_stats` SECURITY DEFINER issue noted (NEW-001) |

### Vendor Data

| Data type | Table | Protection status |
|---|---|---|
| Financial ledger | `financial_ledger` | ✅ Protected (vendor_id join via vendors) |
| Financial events | `financial_events` | ✅ **FIXED** — vendor reads own only, no null-ledger leak |
| Bank details | `vendor_bank_details` | ✅ RLS in place; plaintext storage (P2, future phase) |
| Performance data | `vendor_performance_summary` | 🔴 **NEW-001** — view bypasses RLS; anon can read all vendors' financials |
| Connect onboarding | `vendor_connect_onboarding` | ✅ Protected (vendor_id = auth.uid()) |
| Payouts | `vendor_payouts` | ✅ Protected (vendor_id join via vendors) |

### Payment Data

| Data type | Table | Protection status |
|---|---|---|
| Stripe event log | `stripe_events` | ✅ **FIXED** — `USING(false)`, service role only |
| Financial ledger | `financial_ledger` | ✅ Protected (own rows only) |
| Null-ledger system events | `financial_events` | ✅ **FIXED** — now service role only |
| Reconciliation runs | `reconciliation_runs` | ✅ RLS + no policy = deny-by-default |

### Governance Data

| Data type | Table | Protection status |
|---|---|---|
| Governance decisions | `governance_decisions` | ✅ Protected (admin_roles gated + immutability trigger, unchanged) |
| Admin role assignments | `admin_roles` | ✅ Authenticated read of active rows (intentional, unchanged) |
| Audit logs | `audit_logs` | ✅ `USING(false)` service role only (unchanged) |

---

## 8. Phase Gate Assessment

| Condition | Status |
|---|---|
| `email_log` protected | ✅ |
| `stripe_events` protected | ✅ |
| `financial_events` leak removed | ✅ |
| SECURITY DEFINER search_path resolved | ✅ All 12 functions hardened |
| No regression in payments | ✅ |
| No regression in governance | ✅ |
| No regression in vendor/customer flows | ✅ |
| New findings requiring Phase 70D.5E | **Yes — NEW-001 (4 security_definer views)** |

---

## 9. Phase 70D.5E — Required

The Security Advisor re-run discovered 4 views without `security_invoker = true`. These were not identified in Phase 70D.5C because they arise from PostgreSQL default view semantics, not from explicit `SECURITY DEFINER` clauses in migration files.

**Required action before Phase 70D.6 begins:**

Decision required: whether Phase 70D.5E must be completed before Phase 70D.6 (role assignment), or whether it can run in parallel. The `vendor_performance_summary` finding (`anon` SELECT, full vendor financial data) is the highest risk of the four — it may warrant Phase 70D.6 remaining paused until 70D.5E is complete.

**Scope of Phase 70D.5E:**
```sql
-- Migration 064: Set security_invoker = true on all four views
ALTER VIEW vendor_performance_summary SET (security_invoker = true);
ALTER VIEW event_guest_stats SET (security_invoker = true);
ALTER VIEW platform_stats SET (security_invoker = true);
ALTER VIEW public_vendor_profiles SET (security_invoker = true);
```

**Risk:** Medium. Setting `security_invoker = true` changes how the view queries the underlying tables. For `public_vendor_profiles` and `platform_stats`, the existing GRANTs to anon/authenticated must still work after the change — the underlying table policies must permit anon/authenticated access to the data the view intends to show.

---

## 10. Role Assignment Gate

**Phase 70D.6 remains paused.**

Phase 70D.6 (role assignment for Ts, Lz, ML) should not begin until:
- [ ] Phase 70D.5E (security_definer_view fix) is reviewed and a gate decision is made
- [ ] Founder (AY) confirms the new finding (vendor_performance_summary anon exposure) is acceptable or remediated

No roles have been granted. No `admin_roles` records have been inserted. `admin_roles` active row count: **0**.
