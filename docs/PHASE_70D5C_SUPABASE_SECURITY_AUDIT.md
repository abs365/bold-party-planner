# Phase 70D.5C — Supabase Security Advisor Audit

**Date:** 2026-06-23  
**Project:** bold-party-production (ELBOLD)  
**Audit type:** Code-evidence audit of all 60 migration files  
**Scope:** rls_disabled_in_public, security definer views, security definer functions, exposed tables, public schema objects, and special focus items A–J  
**Constraint:** Audit only. No fixes. No deployments. No role assignments.

---

## Scope Note: master-growth-os

The master-growth-os Supabase project is **not represented in this repository**. No migration files exist for it here. That project must be audited directly via the Supabase Dashboard → Security Advisor tab. It is out of scope for this code-evidence audit.

---

## Severity Classification

| Severity | Definition |
|---|---|
| **CRITICAL** | No access control. Authenticated or anon users can read data they must not. |
| **HIGH** | Misconfiguration that creates a meaningful attack vector or data exposure risk. |
| **MEDIUM** | Security Advisor will flag it; impact is limited or mitigated by other controls. |
| **LOW** | Ambiguous or theoretical risk. Secure in practice but lacks explicit defence. |
| **INFO** | Intentional design. Documented. No remediation required. |

---

## Part 1 — RLS Disabled in Public Schema

### Finding RLS-001: `email_log` — No Row Level Security

**Severity: CRITICAL**

**Migration:** `002_phase2.sql` line 29  
**RLS status:** Table created without `ENABLE ROW LEVEL SECURITY`. No subsequent migration adds it (confirmed by full grep of all 60 migrations — zero matches for `email_log` in any RLS context).

**Table schema:**
```sql
CREATE TABLE email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,   -- ← PII: email addresses of customers and vendors
  template TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Exposure:** Any authenticated user (customer, vendor, or attacker with a valid session) can execute `SELECT * FROM email_log` and retrieve:
- All recipient email addresses ever sent to
- Template names (reveals platform automation structure)
- Subject lines (reveals content of booking confirmations, payment receipts, etc.)
- Error messages on failed sends (may contain internal system info)

**Mitigations in place:** None. The default privileges grant (`009_schema_grants_fix.sql`) grants SELECT to anon on future tables, but email_log was created in 002 — before the default privileges statement. Anon access is not confirmed, but authenticated access is unrestricted.

**Recommendation:** `ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;` with a service-role-only policy `USING (false)`.

---

### Finding RLS-002: `stripe_events` — No Row Level Security

**Severity: CRITICAL**

**Migration:** `002_phase2.sql` line 5; recreated as `IF NOT EXISTS` in `025_gdpr_and_production.sql` line 49  
**RLS status:** Neither migration enables RLS. No subsequent migration adds it (confirmed by full grep — zero matches).

**Table schema:**
```sql
CREATE TABLE stripe_events (
  id TEXT PRIMARY KEY,    -- Stripe event ID (evt_...)
  type TEXT NOT NULL,     -- Stripe event type (e.g. payment_intent.succeeded)
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Exposure:** Any authenticated user can read the full deduplication log of all Stripe events processed by the platform. This reveals:
- Which Stripe event types have fired (payment flow structure)
- Temporal patterns of payment activity
- The Stripe event ID format (useful for enumeration attempts)

**Impact rating:** Medium-high. The table contains no amounts or customer PII, but it exposes platform operational detail to all authenticated users and is a confirmed Security Advisor `rls_disabled_in_public` finding.

**Recommendation:** `ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;` with a service-role-only policy `USING (false)`.

---

## Part 2 — Security Definer Views

### Finding VIEW-001: No SECURITY DEFINER views found

**Severity: INFO**

All views in the codebase use the default `SECURITY INVOKER` mode (PostgreSQL default when `SECURITY DEFINER` is not specified):

| View | Migration | Security mode | Granted to |
|---|---|---|---|
| `platform_stats` | 046 (recreated) | SECURITY INVOKER | authenticated |
| `public_vendor_profiles` | 027 | SECURITY INVOKER | anon |

Neither view is a Security Advisor concern for SECURITY DEFINER. `platform_stats` is SECURITY INVOKER and grants access to authenticated only — queries run as the calling user, which means RLS on underlying tables is respected.

**Note:** `public_vendor_profiles` intentionally grants SELECT to anon. See Part 5, Finding PUB-002.

---

## Part 3 — Security Definer Functions

### Finding SDF-001: Trigger functions without SET search_path

**Severity: HIGH**

The following SECURITY DEFINER functions are missing an explicit `SET search_path` clause. Without it, the function inherits the search_path of the caller, which opens a path for schema injection: a malicious caller could prepend a schema containing objects that shadow `public` tables.

| Function | Migration | Callable by | search_path set? |
|---|---|---|---|
| `update_vendor_rating()` | 001 | Trigger only | No |
| `notify_user()` | 001 | Trigger only | No |
| `seed_checklist_from_plan()` | 002 | Trigger only | No |
| `auto_create_payout()` | 002 | Trigger only | No |
| `check_review_allowed()` | 002 | Trigger only | No |
| `auto_create_contract()` | 003 | Trigger only | No |
| `mark_quote_converted()` | 003 | Trigger only | No |
| `expire_old_quotes()` | 003 | Trigger only | No |
| `increment_vendor_profile_views()` | 004 | **PUBLIC** | No |
| `fix_checklist_trigger` (rebuild) | 036 | Trigger only | No |
| `update_vendor_rating` (restored) | 054 | Trigger only | No |
| Various demo cleanup functions | 015, 017, 018 | Restricted/trigger | No |

**Exception — correctly fixed:**

| Function | Migration | search_path set? |
|---|---|---|
| `handle_new_user()` | 020 (restored) | **Yes** — `SET search_path = public, auth` |

Migration 020 explicitly documents why `search_path` was missing in 017 and the bug it caused. This is the correct pattern.

**Highest risk — `increment_vendor_profile_views()`:**  
This function is SECURITY DEFINER and is callable by any authenticated user via RPC (not restricted to trigger-only). It runs as the function owner (postgres/supabase), and without `SET search_path = public`, a user who can temporarily control their own search_path could potentially shadow the `vendor_profile_views` write target.

**Recommendation:** Add `SET search_path = public` to all SECURITY DEFINER functions. Priority: `increment_vendor_profile_views` first (public-callable). Trigger-only functions are lower risk but should be fixed for defence-in-depth.

---

### Finding SDF-002: `increment_vendor_profile_views` is publicly callable

**Severity: HIGH**

Unlike all other SECURITY DEFINER functions which are invoked only by database triggers, `increment_vendor_profile_views()` (migration 004, line 197) is exposed as a callable RPC endpoint via PostgREST and has no authentication requirement checked within the function itself.

Any authenticated user can call this function arbitrarily, incrementing view counts for any vendor_id. Combined with the missing `SET search_path`, this is the highest-risk SECURITY DEFINER function in the codebase.

---

## Part 4 — Exposed Tables

### Finding EXP-001: `platform_settings` — Public read policy

**Severity: MEDIUM**

**Migration:** `007_phase7.sql`

```sql
CREATE POLICY "public_read_settings" ON platform_settings
  FOR SELECT USING (true);
```

**Exposure:** All rows in `platform_settings` are readable by anon and authenticated users. This includes:
- `commission_rate` — the platform's take rate (currently visible to all visitors)
- Other platform configuration keys

**Mitigations:** This is likely intentional (commission rate is displayed to vendors during onboarding). However, it will flag in Security Advisor as a permissive policy and may expose config keys not intended for public visibility.

**Recommendation:** Audit the specific keys in `platform_settings`. If all keys are safe for public disclosure, document the intent. If any keys are sensitive (e.g., internal thresholds, feature flag overrides), scope the policy to authenticated or add a `is_public` column.

---

### Finding EXP-002: `financial_events` — Authenticated read for null-ledger events

**Severity: HIGH**

**Migration:** `040_financial_ledger.sql`

The `financial_events` RLS policy for SELECT contains:
```sql
USING (
  ledger_id IS NULL   -- ← system-level events readable by all authenticated
  OR EXISTS (
    SELECT 1 FROM financial_ledger fl
    WHERE fl.id = financial_events.ledger_id
      AND (fl.vendor_id = auth.uid() OR fl.customer_id = auth.uid())
  )
)
```

**Exposure:** Any authenticated user can read all `financial_events` rows where `ledger_id IS NULL`. These include:
- `RECONCILIATION_RUN` events
- `WEBHOOK_REJECTED` events  
- `WEBHOOK_RECEIVED` events

These system-level events may expose information about platform financial operations, reconciliation timing, and Stripe webhook delivery failures to any logged-in customer or vendor.

**Recommendation:** Remove the `ledger_id IS NULL` branch from the authenticated policy. System-level events should be service-role-only. If reconciliation run history needs admin visibility, create a separate admin-only policy using the service role path.

---

## Part 5 — Public Schema Objects

### Finding PUB-001: DEFAULT PRIVILEGES grants anon SELECT on all future tables

**Severity: MEDIUM**

**Migration:** `009_schema_grants_fix.sql` line 50

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
```

**Effect:** Every table created after migration 009 automatically grants SELECT to the `anon` role. This is a Security Advisor `anon_access` flag.

**Mitigations:** Row Level Security (when enabled) still enforces row-level access control. A table with RLS enabled and a `USING (false)` policy or no permissive policy at all is deny-by-default even with anon SELECT granted at the table level. The grant only bypasses RLS if RLS is disabled — which is the reason RLS-001 and RLS-002 above are CRITICAL.

**Direct consequence of PUB-001 + RLS-001/RLS-002:** `email_log` and `stripe_events` (created before 009) may or may not have the anon grant, but any table created after 009 without RLS is fully readable by anonymous visitors.

---

### Finding PUB-002: `public_vendor_profiles` VIEW grants anon SELECT

**Severity: INFO — Intentional**

**Migration:** `027_profiles_privacy.sql`

```sql
CREATE VIEW public_vendor_profiles AS
  SELECT id, full_name, avatar_url
  FROM profiles
  WHERE id IN (
    SELECT user_id FROM vendors WHERE status = 'approved'
  );

GRANT SELECT ON public_vendor_profiles TO anon;
```

This was created as a deliberate fix to the `profiles_public_read USING (true)` vulnerability present in migration 001. The view limits anon access to exactly three columns (id, full_name, avatar_url) for approved vendors only. No PII beyond display name and avatar is exposed.

**Status: Correctly designed. No remediation required.**

---

## Part 6 — Special Focus Items (A–J)

### A. rls_disabled_in_public

**Status: 2 confirmed findings**

| Table | Severity | Finding |
|---|---|---|
| `email_log` | CRITICAL | RLS-001 — no RLS, PII exposure |
| `stripe_events` | CRITICAL | RLS-002 — no RLS, event metadata exposure |

All other tables created across migrations 001–060 have `ENABLE ROW LEVEL SECURITY` applied (verified by full grep of all 60 migration files).

---

### B. Security Definer Views

**Status: None found. INFO.**

Both views (`platform_stats`, `public_vendor_profiles`) are SECURITY INVOKER. Not a Security Advisor concern.

---

### C. Security Definer Functions

**Status: 12 functions flagged. 1 correctly fixed (handle_new_user). Highest risk: increment_vendor_profile_views.**

See Part 3 (SDF-001, SDF-002) for full inventory and risk ranking.

---

### D. Exposed Tables

**Status: 3 findings**

| Table | Issue |
|---|---|
| `email_log` | No RLS — fully exposed to authenticated users |
| `stripe_events` | No RLS — fully exposed to authenticated users |
| `platform_settings` | Public read policy — commission_rate and config visible to anon |

---

### E. Public Schema Objects

**Status: DEFAULT PRIVILEGES flag (PUB-001). Intentional view grant (PUB-002).**

The default privileges statement in 009 is a persistent Security Advisor flag. All subsequently created tables require RLS to remain protected. The tables with no RLS (email_log, stripe_events) predate migration 009, so the causal relationship is reversed — but the risk is the same.

---

### F. admin_roles

**Status: Protected with expected design trade-off. No critical finding.**

**Migration:** `060_admin_roles_and_governance_decisions.sql`

| Control | Status |
|---|---|
| RLS enabled | ✓ |
| Authenticated SELECT | Active rows only (`WHERE revoked_at IS NULL`) |
| Authenticated INSERT | No policy — service role only |
| Authenticated UPDATE | No policy — service role only |
| Authenticated DELETE | No policy — service role only |
| Founder stored here | No — Founder is ADMIN_EMAILS env var only |

**Trade-off:** Any authenticated user can query `admin_roles` and discover who holds admin roles. The migration comment documents this as intentional: `"Any authenticated user can see active role assignments (admin reads use service role anyway)"`.

**Risk assessment:** Low. Role assignments are not PII. The table reveals user_id values (not emails), and the granted_by user_id. Any customer who inspects this table learns that certain UUIDs have admin roles — they cannot determine which UUID corresponds to which person without a separate profiles lookup, which is itself restricted by migration 027's privacy changes.

**Recommendation:** Document the intentional design in a comment on the policy. Acceptable as-is.

---

### G. governance_decisions

**Status: Strongly protected. No finding.**

**Migration:** `060_admin_roles_and_governance_decisions.sql`

| Control | Status |
|---|---|
| RLS enabled | ✓ |
| Authenticated SELECT | Only users with active `admin_roles` entry |
| Authenticated INSERT | No policy — service role only |
| Authenticated UPDATE | Blocked by trigger (`prevent_governance_modification`) for ALL callers |
| Authenticated DELETE | Blocked by trigger for ALL callers |
| Trigger bypass | Requires `SET session_replication_role = replica` — Supabase Dashboard access only |

**Proof of protection:**
- A customer or vendor with no admin_roles entry cannot read any governance decisions.
- An admin reading records uses the service role client (`createAdminClient()`), which bypasses RLS — the authenticated policy is belt-and-suspenders.
- The immutability trigger fires for ALL callers including service role. No admin API endpoint can delete or modify a governance decision.

**Status: No remediation required.**

---

### H. vendor_connect_onboarding

**Status: Protected. One informational note.**

**Migration:** `056_vendor_connect_onboarding.sql`

| Control | Status |
|---|---|
| RLS enabled | ✓ |
| Vendor SELECT | Own records only (`vendor_id = auth.uid()`) |
| Authenticated INSERT | No policy — service role only |
| Authenticated UPDATE | No policy — service role only |
| anon access | None |

**Sensitive fields:**
- `requirements` JSONB — Stripe requirements snapshot (verification fields required, field errors, etc.)
- `onboarding_url` — time-limited Stripe AccountLink URL (expires, but sensitive while valid)
- `stripe_account_id` — Stripe Connect account identifier

**Protection:** Vendors can only read their own onboarding record. No cross-vendor read is possible. Anon access is blocked.

**Informational note:** `onboarding_url` is a time-limited link. If a vendor's session is compromised, an attacker could use the unexpired AccountLink URL to access Stripe's onboarding flow. This is inherent to the Stripe AccountLink design, not a Supabase RLS issue.

**Status: No remediation required.**

---

### I. financial_ledger

**Status: Core table protected. financial_events has a gap (Finding EXP-002).**

**Migration:** `040_financial_ledger.sql`

#### financial_ledger (core table)

| Control | Status |
|---|---|
| RLS enabled | ✓ |
| Vendor SELECT | Own ledger entries only (`vendor_id = auth.uid()`) |
| Customer SELECT | Own ledger entries only (`customer_id = auth.uid()`) |
| Cross-read | Not possible — no policy covers it |
| Anon access | None |
| Service role | Full access (reconciliation, admin review) |

**Proof:** A customer cannot read a vendor's financial_ledger entry. A vendor cannot read another vendor's entries. A customer cannot read another customer's entries. Only the service role (admin APIs, reconciliation cron) can read across all rows.

#### financial_events (child table) — GAP

| Control | Status |
|---|---|
| RLS enabled | ✓ |
| Ledger-linked events | Vendor/customer can read own (via ledger_id join) |
| System events (ledger_id IS NULL) | **Any authenticated user can read** — Finding EXP-002 |

**Financial data protection verdict:** The core `financial_ledger` table is correctly protected. The gap is in `financial_events` for system-level (ledger-unlinked) events only. No financial amounts, customer IDs, or vendor IDs are exposed via this gap — only event-type metadata for reconciliation and webhook events.

---

### J. payments

**Status: Mixed. Core payment tables protected. Bank details in plaintext.**

#### vendor_payouts

| Control | Status |
|---|---|
| RLS enabled | ✓ (migration 002 — not shown in snippet but confirmed by grep of ENABLE ROW LEVEL SECURITY across all migrations) |
| Vendor SELECT | Own payouts only |
| Customer SELECT | Not granted |
| Admin access | Service role |

#### stripe_events

**See Finding RLS-002.** No RLS. Any authenticated user can read all Stripe event deduplication records.

#### vendor_bank_details

| Control | Status |
|---|---|
| RLS enabled | ✓ (migration 032) |
| Vendor SELECT | Own record only |
| admin read | Service role |

**CRITICAL data handling concern:**

```
sort_code TEXT     -- stored in PLAINTEXT
account_number TEXT -- stored in PLAINTEXT
```

Bank details are stored without column-level encryption. The Supabase database is encrypted at rest (AES-256), which provides protection against physical media theft. However:
- Any Supabase service role holder can read plaintext bank details
- A compromised `createAdminClient()` call path would expose raw account numbers
- This will not appear as a Supabase Security Advisor finding (it's an application design decision), but it is a PCI-adjacent risk

**Recommendation for future phase:** Evaluate column-level encryption (Supabase Vault or application-layer encryption) for `sort_code` and `account_number`. This is not a Supabase RLS finding — it is an architecture concern.

---

## Part 7 — Comprehensive Findings Register

| ID | Table / Object | Severity | Category | Finding |
|---|---|---|---|---|
| RLS-001 | `email_log` | **CRITICAL** | rls_disabled_in_public | No RLS. All authenticated users can read all email logs (PII). |
| RLS-002 | `stripe_events` | **CRITICAL** | rls_disabled_in_public | No RLS. All authenticated users can read all Stripe event records. |
| EXP-002 | `financial_events` | **HIGH** | Exposed policy gap | `ledger_id IS NULL` clause exposes system-level financial events to all authenticated users. |
| SDF-001 | 11 functions | **HIGH** | security definer | SECURITY DEFINER functions without `SET search_path`. Trigger-only except SDF-002. |
| SDF-002 | `increment_vendor_profile_views` | **HIGH** | security definer | Publicly callable SECURITY DEFINER function without `SET search_path`. |
| BANK-001 | `vendor_bank_details` | **HIGH** | Data handling | sort_code and account_number stored in plaintext. No column-level encryption. |
| PUB-001 | Default privileges | **MEDIUM** | public schema | `ALTER DEFAULT PRIVILEGES … GRANT SELECT ON TABLES TO anon` flags in Security Advisor. Mitigated by RLS on all post-009 tables. |
| EXP-001 | `platform_settings` | **MEDIUM** | Exposed policy | Public read policy exposes commission_rate and all config keys to anon. |
| VIEW-001 | Views | **INFO** | security definer views | No SECURITY DEFINER views. Both views are SECURITY INVOKER. |
| ADM-001 | `admin_roles` | **INFO** | admin_roles | Authenticated read of active rows is intentional. UUIDs only, no email exposed. |
| GOV-001 | `governance_decisions` | **INFO** | governance | Strongly protected. Immutability trigger. Admin-only read. |
| VCO-001 | `vendor_connect_onboarding` | **INFO** | vendor | Vendor-own-only read. Onboarding URL expiry is Stripe design. |
| FIN-001 | `financial_ledger` | **INFO** | financial | Core table fully protected. Vendor and customer read own records only. |
| PAY-001 | `vendor_payouts` | **INFO** | payments | RLS protected. Vendor reads own only. |
| PUB-002 | `public_vendor_profiles` | **INFO** | public schema | Intentionally limited view (id, full_name, avatar_url) for approved vendors. Correct. |
| RCN-001 | `reconciliation_runs` | **INFO** | access | RLS enabled, no authenticated policy = deny-by-default. Secure. |

---

## Part 8 — Data Protection Proofs

### Customer Data

| Data type | Table | Protection |
|---|---|---|
| Customer profile | `profiles` | 027 removed USING(true). Scoped by interaction network. |
| Customer bookings | `bookings` | RLS — customer_id = auth.uid() |
| Customer financial ledger | `financial_ledger` | RLS — customer_id = auth.uid() |
| Customer email addresses | `email_log` | **NO PROTECTION — RLS-001** |
| Customer payment methods | Stripe-side only | Not stored in Supabase DB |

### Vendor Data

| Data type | Table | Protection |
|---|---|---|
| Vendor profile (public) | `public_vendor_profiles` view | Limited to id/full_name/avatar — intentional |
| Vendor profile (private) | `profiles` | 027 scoped by interaction network |
| Vendor bank details | `vendor_bank_details` | RLS — vendor_id = auth.uid(). Plaintext storage. |
| Vendor Connect onboarding | `vendor_connect_onboarding` | RLS — vendor_id = auth.uid() |
| Vendor payouts | `vendor_payouts` | RLS — vendor_id = auth.uid() |
| Vendor financial ledger | `financial_ledger` | RLS — vendor_id = auth.uid() |

### Financial Data

| Data type | Table | Protection |
|---|---|---|
| Financial ledger entries | `financial_ledger` | RLS — own rows only |
| Ledger-linked events | `financial_events` | RLS — via ledger ownership |
| System-level events | `financial_events` | **PARTIAL GAP — EXP-002** |
| Reconciliation runs | `reconciliation_runs` | RLS + no policy = deny-by-default |

### Governance Data

| Data type | Table | Protection |
|---|---|---|
| Governance decisions | `governance_decisions` | RLS — admin_roles required + immutability trigger |
| Admin role assignments | `admin_roles` | RLS — active rows visible to authenticated (intentional) |
| Audit logs | `audit_logs` | RLS — USING(false) — service role only |

---

## Part 9 — Action Priority List

The following prioritised action list is for a future fix phase. **No fixes are implemented in this phase.**

| Priority | Finding | Action required |
|---|---|---|
| P0 | RLS-001 | `ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;` + service-role-only policy |
| P0 | RLS-002 | `ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;` + service-role-only policy |
| P1 | EXP-002 | Remove `ledger_id IS NULL` branch from `financial_events` SELECT policy |
| P1 | SDF-002 | Add `SET search_path = public` to `increment_vendor_profile_views` |
| P2 | SDF-001 | Add `SET search_path = public` to all 11 remaining SECURITY DEFINER trigger functions |
| P2 | BANK-001 | Evaluate Supabase Vault for sort_code / account_number encryption |
| P3 | EXP-001 | Audit `platform_settings` keys — scope public policy or add `is_public` column |
| P3 | PUB-001 | Document DEFAULT PRIVILEGES rationale or scope future table grants explicitly |

---

## Audit Sign-off

**Conducted by:** Claude Code (Phase 70D.5C)  
**Evidence basis:** All 60 migration files read and grep-verified  
**Code changes made:** None  
**Deployments performed:** None  
**Roles assigned:** None  

**Critical findings requiring immediate attention before Phase 70D.6:**  
- RLS-001 (`email_log`) and RLS-002 (`stripe_events`) are confirmed `rls_disabled_in_public` Security Advisor findings with no mitigating controls.

**Phase 70D.6 gate:** This audit does not block Phase 70D.6 (role assignment). Role assignment does not depend on fixing these findings. However, RLS-001 and RLS-002 should be scheduled as P0 items for an immediate follow-on migration.
