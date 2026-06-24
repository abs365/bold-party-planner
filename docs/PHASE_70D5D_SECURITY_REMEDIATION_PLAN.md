# Phase 70D.5D — Security Remediation Plan

**Date:** 2026-06-24  
**Based on:** Phase 70D.5C Supabase Security Advisor Audit  
**Status:** PLAN ONLY — no implementation, no deployment, no role assignments  
**Phase 70D.6:** Remains paused until this plan is approved and executed

---

## 1. Executive Summary

The Phase 70D.5C audit identified 3 tiers of security findings requiring remediation. This plan specifies the exact SQL, route impact, risk classification, and deployment sequence for each.

| Priority | Finding | Classification | Migration |
|---|---|---|---|
| P0 | `email_log` — no RLS | **Hotfix** | 061 |
| P0 | `stripe_events` — no RLS | **Hotfix** | 061 |
| P1a | `financial_events` — `ledger_id IS NULL` policy leak | **Low Risk** | 062 |
| P1b | SECURITY DEFINER functions — missing `SET search_path` | **Low Risk** | 063 |
| P2 | `vendor_bank_details` — plaintext bank details | **High Risk** | Future phase |

**Total migrations required: 3 (061, 062, 063)**  
**P2 requires design decision before a migration can be planned.**

---

## 2. Remediation Matrix

| Finding | Table / Object | Current State | After Fix | Route Impact |
|---|---|---|---|---|
| RLS-001 | `email_log` | No RLS — any authenticated read | Service role only | None |
| RLS-002 | `stripe_events` | No RLS — any authenticated read | Service role only | None |
| EXP-002 | `financial_events` | Vendors can read all null-ledger events | Vendor reads own, customer reads own, system events service-role only | None |
| SDF-002 | `notify_user` | SECURITY DEFINER, no search_path, publicly callable | SECURITY DEFINER + SET search_path | None (behavior unchanged) |
| SDF-002 | `increment_vendor_profile_views` | SECURITY DEFINER, no search_path, publicly callable | SECURITY DEFINER + SET search_path | None (behavior unchanged) |
| SDF-001 | 6 trigger-only functions | SECURITY DEFINER, no search_path | SECURITY DEFINER + SET search_path | None (trigger behavior unchanged) |
| BANK-001 | `vendor_bank_details` | sort_code + account_number plaintext | Encrypted (design TBD) | `app/api/vendor/bank-details/route.ts` |

---

## 3. Migration 061 — P0 RLS Fixes

### Classification: HOTFIX

**Reason:** Purely additive. No existing policies dropped. No data changed. No application routes read these tables through the user client — both tables are written exclusively via service role. The only effect is that direct authenticated queries (via PostgREST) are now denied. No legitimate use case requires authenticated reads on either table.

### 3.1 Route Impact Analysis

**`email_log`**
- Full grep of `app/**/*.ts` and `lib/**/*.ts`: zero matches for `email_log`
- The platform sends emails via Resend API (`lib/resend/verification-emails.ts`) — no DB write to `email_log` exists in current application code
- The table was created in migration 002 and is likely empty or populated only by legacy code that no longer runs
- **Route impact: None**

**`stripe_events`**
- `app/api/payments/webhook/route.ts` line 29: `const supabase = await createAdminClient()` — service role ✓
- `app/api/payments/connect-webhook/route.ts` line 43: confirmed admin client usage
- Both write paths use `createAdminClient()` which bypasses RLS entirely
- No application route reads from `stripe_events`
- **Route impact: None**

### 3.2 Exact SQL — Migration 061

```sql
-- ── Migration 061: P0 RLS Fixes — email_log + stripe_events ─────────────────
-- Phase 70D.5D — Security Remediation
-- Applied: [DATE]
-- Risk: HOTFIX / Low — additive only, no existing policies affected
-- Route impact: None

-- ── email_log ─────────────────────────────────────────────────────────────────
-- Created in 002_phase2.sql without RLS.
-- Contains: recipient_email, template, subject, status, error.
-- Written by: legacy code (not current application routes).
-- All reads must be service-role only.

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_log_service_only" ON email_log;
CREATE POLICY "email_log_service_only" ON email_log
  FOR ALL
  USING (false); -- No direct client access; all reads/writes via service_role only

-- ── stripe_events ─────────────────────────────────────────────────────────────
-- Created in 002_phase2.sql without RLS. IF NOT EXISTS in 025.
-- Contains: Stripe event ID, event type, processed_at.
-- Written by: webhook/route.ts and connect-webhook/route.ts via createAdminClient().
-- All reads must be service-role only.

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stripe_events_service_only" ON stripe_events;
CREATE POLICY "stripe_events_service_only" ON stripe_events
  FOR ALL
  USING (false); -- No direct client access; webhook handlers use service_role

NOTIFY pgrst, 'reload schema';
```

### 3.3 Rollback

```sql
-- Drop RLS from email_log (reverts to no RLS)
DROP POLICY IF EXISTS "email_log_service_only" ON email_log;
ALTER TABLE email_log DISABLE ROW LEVEL SECURITY;

-- Drop RLS from stripe_events (reverts to no RLS)
DROP POLICY IF EXISTS "stripe_events_service_only" ON stripe_events;
ALTER TABLE stripe_events DISABLE ROW LEVEL SECURITY;
```

---

## 4. Migration 062 — P1a Financial Events Policy Fix

### Classification: LOW RISK

**Reason:** Drops and recreates one existing RLS policy on `financial_events`. The replacement removes the `ledger_id IS NULL` branch (which granted all authenticated users access to system-level events). Also adds a previously-missing customer SELECT policy. The function body of all callers is unchanged. All writes to `financial_events` go via `createAdminClient()` (service role) — INSERT is not affected by this change.

### 4.1 Current State

**Existing policy (migration 040):**
```sql
CREATE POLICY "fin_events_vendor_select" ON financial_events FOR SELECT
  USING (
    ledger_id IS NULL                          -- ← PROBLEM: any authenticated user
    OR ledger_id IN (
      SELECT id FROM financial_ledger
      WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );
```

**Gap:** No customer-facing SELECT policy exists. Customers currently cannot read their own `financial_events` via authenticated client.

### 4.2 Route Impact Analysis

**`appendLedgerEvent()` in `lib/finance/ledger.ts`:**
- Writes via the `supabase` client passed from the webhook route, which is `createAdminClient()`
- Service role bypasses RLS — no impact on writes

**Admin reconciliation route (`app/api/admin/reconciliation/route.ts`):**
- Uses `createAdminClient()` via the cron secret path
- Service role bypasses RLS — no impact

**No application route reads `financial_events` via authenticated client.** The table is insert-only from the application layer; reads are done exclusively via service role (admin tools). The policy changes affect only direct PostgREST queries.

**Route impact: None**

### 4.3 Exact SQL — Migration 062

```sql
-- ── Migration 062: P1a — financial_events policy fix ─────────────────────────
-- Phase 70D.5D — Security Remediation
-- Applied: [DATE]
-- Risk: Low — drops and recreates one SELECT policy; adds one customer policy
-- Route impact: None (all writes and reads in app code use service role)

-- Remove the policy that allows all authenticated users to read
-- system-level events (RECONCILIATION_RUN, WEBHOOK_REJECTED, WEBHOOK_RECEIVED)
-- via the ledger_id IS NULL branch.

DROP POLICY IF EXISTS "fin_events_vendor_select" ON financial_events;

-- Vendors can read events for their own ledger entries only.
-- System events (ledger_id IS NULL) are no longer accessible to authenticated users.
CREATE POLICY "fin_events_vendor_select" ON financial_events FOR SELECT
  USING (
    ledger_id IN (
      SELECT id FROM financial_ledger
      WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );

-- Customers can read events for their own ledger entries.
-- (Previously missing — customers had no SELECT policy at all.)
CREATE POLICY "fin_events_customer_select" ON financial_events FOR SELECT
  USING (
    ledger_id IN (
      SELECT id FROM financial_ledger
      WHERE customer_id = auth.uid()
    )
  );

-- System events (ledger_id IS NULL) remain accessible to service role only.
-- No policy covers them for authenticated — deny-by-default.

NOTIFY pgrst, 'reload schema';
```

### 4.4 Verification Queries

After applying, run via Supabase SQL Editor (authenticated as a test vendor):
```sql
-- Should return 0 rows (system events now denied)
SELECT COUNT(*) FROM financial_events WHERE ledger_id IS NULL;

-- Should return only the vendor's own events
SELECT COUNT(*) FROM financial_events;
```

### 4.5 Rollback

```sql
-- Restore original policy (re-introduces the ledger_id IS NULL gap)
DROP POLICY IF EXISTS "fin_events_vendor_select" ON financial_events;
DROP POLICY IF EXISTS "fin_events_customer_select" ON financial_events;

CREATE POLICY "fin_events_vendor_select" ON financial_events FOR SELECT
  USING (
    ledger_id IS NULL
    OR ledger_id IN (
      SELECT id FROM financial_ledger
      WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );
```

---

## 5. Migration 063 — P1b SECURITY DEFINER search_path Hardening

### Classification: LOW RISK

**Reason:** `CREATE OR REPLACE FUNCTION` with `SET search_path = public` added. Function bodies are **identical** to the current live versions — no logic is changed. The only modification is the addition of the `SET search_path` clause. The risk is limited to transcription error in the function body; for that reason the exact current function bodies (read from source migrations) are reproduced verbatim below.

### 5.1 Function Inventory and Risk Ranking

| Function | Type | search_path missing | Callable by | Specific risk |
|---|---|---|---|---|
| `notify_user()` | Regular function | Yes | Any authenticated user via RPC | Notification injection — HIGH priority |
| `increment_vendor_profile_views()` | Regular function | Yes | Any authenticated user via RPC | Profile view count manipulation, analytics pollution |
| `seed_checklist_from_plan()` | Trigger | Yes | Trigger only | Schema injection (trigger context, lower risk) |
| `auto_create_payout()` | Trigger | Yes | Trigger only | Schema injection (trigger context) |
| `check_review_allowed()` | Trigger | Yes | Trigger only | Schema injection (trigger context) |
| `auto_create_contract()` | Trigger | Yes | Trigger only | Schema injection (trigger context) |
| `mark_quote_converted()` | Trigger | Yes | Trigger only | Schema injection (trigger context) |
| `expire_old_quotes()` | Void function | Yes | Cron / admin only | Schema injection |

**Already hardened (do NOT re-create in 063):**
- `handle_new_user()` — 020 has `SET search_path = public, auth` ✓
- `update_vendor_rating()` — 054 has `SET search_path = public` ✓

### 5.2 Why notify_user Is the Highest Priority

`notify_user()` is called via `supabase.rpc("notify_user", {...})` from the following routes using the **user-scoped client** (not admin client):

| Route | Client used | Called for |
|---|---|---|
| `app/api/bookings/[id]/route.ts:266` | `supabase` (user) | Booking status notification |
| `app/api/reviews/route.ts:106` | `supabase` (user) | Review submitted notification |
| `app/api/quotes/route.ts:151,160` | `supabase` (user) | Quote sent/received notification |
| `app/api/quotes/[id]/route.ts:112,149,260,268` | `supabase` (user) | Quote state change notifications |

These routes call `notify_user` via the authenticated Supabase client. PostgREST also exposes this function as a public RPC endpoint, meaning **any authenticated user can call `notify_user` directly via PostgREST** with an arbitrary `p_user_id`, injecting notifications into any user's feed.

`SET search_path = public` hardens the function against schema-path manipulation; the notification injection vector requires a separate `REVOKE` (see Section 5.3).

### 5.3 Additional Hardening: REVOKE Public Execute on notify_user

Beyond `SET search_path`, `notify_user` should have its public EXECUTE permission revoked. Currently it is callable by any authenticated user. The correct callers are:
- Booking, review, quote, reminder, webhook routes — all trusted server-side code that validates context before calling

Revoking public execute forces callers to use the service role, removing the direct PostgREST RPC vector entirely.

**Same applies to `increment_vendor_profile_views`.** The `track-view` route already uses `createAdminClient()`. Revoking public execute means the only way to call it is via the app's server-side API — the correct design.

### 5.4 Route Impact of REVOKE

After revoking public execute on `notify_user`:
- Routes that call `notify_user` via `supabase.rpc(...)` (user client) will receive a 403 from PostgREST
- These calls must be changed to use `adminDb.rpc(...)` instead

**Routes requiring update if REVOKE is applied:**

| File | Line | Current client | Action required |
|---|---|---|---|
| `app/api/bookings/[id]/route.ts` | 266 | `supabase` | Switch to `adminDb.rpc(...)` |
| `app/api/reviews/route.ts` | 106 | `supabase` | Switch to `adminDb.rpc(...)` |
| `app/api/cron/reminders/route.ts` | 35,65,88,149 | `supabase` | Switch to `adminDb.rpc(...)` |
| `app/api/quotes/route.ts` | 151,160 | `supabase` | Switch to `adminDb.rpc(...)` |
| `app/api/quotes/[id]/route.ts` | 112,149,260,268 | `supabase` | Switch to `adminDb.rpc(...)` |
| `app/api/payments/webhook/route.ts` | 141,150,223,262,407,502 | `supabase` (admin inside webhook) | Already admin ✓ |
| `app/api/admin/payouts/route.ts` | 90 | `auth.db` (admin) | Already admin ✓ |
| `app/api/payments/connect-webhook/route.ts` | 153 | `admin` | Already admin ✓ |

**Routes requiring update if REVOKE applied to `increment_vendor_profile_views`:**
- `app/api/vendor/track-view/route.ts` — already uses `createAdminClient()` ✓ — no change required

> **Decision required:** The REVOKE is the correct long-term hardening but adds route changes to what would otherwise be a migration-only operation. **Option A:** Migrate 063 with `SET search_path` only (classification: Low Risk, no route changes). **Option B:** Migrate 063 with `SET search_path` + REVOKE + route updates (classification: Medium Risk, 8 route changes required). This plan documents both; implementation choice is yours.

### 5.5 Exact SQL — Migration 063 (Option A: search_path only)

```sql
-- ── Migration 063: P1b — SECURITY DEFINER search_path hardening ──────────────
-- Phase 70D.5D — Security Remediation
-- Applied: [DATE]
-- Risk: Low — function bodies identical to current live versions
-- Route impact: None (Option A — search_path only, no REVOKE)
-- Note: Option B (+ REVOKE + route changes) requires separate migration

-- ── 1. notify_user ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_user(
  p_user_id UUID,
  p_title   TEXT,
  p_message TEXT,
  p_type    TEXT,
  p_link    TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link);
END;
$$;

-- ── 2. increment_vendor_profile_views ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_vendor_profile_views(p_vendor_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vendors SET profile_views = COALESCE(profile_views, 0) + 1 WHERE id = p_vendor_id;
  INSERT INTO vendor_analytics (vendor_id, event_type) VALUES (p_vendor_id, 'profile_view');
END;
$$;

-- ── 3. seed_checklist_from_plan (from 036 — canonical version) ────────────────
CREATE OR REPLACE FUNCTION seed_checklist_from_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cat    JSONB;
  v_item TEXT;
BEGIN
  IF NEW.ai_plan IS NOT NULL AND NEW.ai_plan->'checklist' IS NOT NULL THEN
    FOR cat IN SELECT * FROM jsonb_array_elements(NEW.ai_plan->'checklist') LOOP
      FOR v_item IN SELECT * FROM jsonb_array_elements_text(cat->'items') LOOP
        INSERT INTO checklist_progress (event_id, category, item, completed)
        VALUES (NEW.id, cat->>'category', v_item, FALSE)
        ON CONFLICT (event_id, category, item) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 4. auto_create_payout (from 002) ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_create_payout()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status = 'fully_paid' AND OLD.payment_status != 'fully_paid' THEN
    INSERT INTO vendor_payouts (vendor_id, booking_id, amount, status)
    VALUES (NEW.vendor_id, NEW.id, NEW.vendor_payout, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 5. check_review_allowed (from 002) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION check_review_allowed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE id = NEW.booking_id
      AND customer_id = NEW.customer_id
      AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Reviews can only be submitted after the booking is completed';
  END IF;
  RETURN NEW;
END;
$$;

-- ── 6. auto_create_contract (from 003) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_create_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO contracts (
      booking_id, customer_id, vendor_id, terms, cancellation_policy, refund_policy
    )
    VALUES (
      NEW.id,
      NEW.customer_id,
      NEW.vendor_id,
      'This booking agreement is between the customer and the vendor listed above. The vendor agrees to provide the services described in the selected package on the agreed event date. The customer agrees to make payment as per the agreed schedule: 30% deposit to confirm, 70% balance due 7 days before the event.',
      'Cancellations made 14 or more days before the event: 100% deposit refund. Cancellations 7-13 days before the event: 50% deposit refund. Cancellations fewer than 7 days before the event: deposit is non-refundable. Cancellations on the day: full invoice amount may be charged.',
      'Refunds are processed within 5-10 business days after approval. Platform commission (10%) is non-refundable in all cases. Refund requests must be submitted within 48 hours of the event. Disputes must be raised through the platform dispute system.'
    )
    ON CONFLICT (booking_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 7. mark_quote_converted (from 003) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION mark_quote_converted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.converted_booking_id IS NOT NULL THEN
    UPDATE quotes SET status = 'converted' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 8. expire_old_quotes (from 003) ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION expire_old_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE quotes
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$;

NOTIFY pgrst, 'reload schema';
```

### 5.6 Rollback

`CREATE OR REPLACE FUNCTION` is non-destructive — the previous definition is overwritten. To rollback, re-apply the function definitions **without** `SET search_path`. These are the original definitions from their respective migrations and can be restored by re-running the original migration SQL for each function.

---

## 6. P2 — vendor_bank_details Encryption (Design Decision Required)

### Classification: HIGH RISK

**Current state:** `sort_code` and `account_number` are stored as plaintext `TEXT` columns in `vendor_bank_details`. Row Level Security is correctly in place (vendor-only read/write via `bank_details_vendor_own` policy). The plaintext risk is exposure if the Supabase database or service role key is compromised.

**Read/write routes:**
- `GET /api/vendor/bank-details` — reads plaintext, returns to vendor
- `POST /api/vendor/bank-details` — writes plaintext after validation
- Admin manual payout process — reads bank details via service role (Supabase dashboard or admin tool)

### 6.1 Design Options

**Option A — Supabase Vault (pgsodium)**

Store the sort_code and account_number as Vault secrets; keep only the secret UUIDs in `vendor_bank_details`.

- Pros: Encryption is database-managed; key rotation possible; transparent to application on read via `vault.decrypted_secrets` view
- Cons: Supabase-specific; Vault requires additional setup; reading decrypted values requires a view join; migration complexity is high
- Schema change: Replace `sort_code TEXT, account_number TEXT` with `sort_code_secret_id UUID, account_number_secret_id UUID`
- Data migration: Existing rows must be encrypted and IDs backfilled

**Option B — Application-layer encryption (AES-256-GCM)**

Encrypt before DB write; decrypt after DB read in the API layer using a `BANK_ENCRYPTION_KEY` environment variable.

- Pros: No schema change (encrypted values stored in same TEXT columns); no Supabase dependency; testable without DB access; key management via env vars / secrets manager
- Cons: Decryption depends on application runtime; if key is in same env as service role key, a total env compromise yields both; no DB-side query on encrypted values
- Route changes: `app/api/vendor/bank-details/route.ts` must encrypt on POST, decrypt on GET
- Data migration: A one-time migration script encrypts existing rows

**Option C — Mask at rest, verify only at payout**

Do not encrypt stored values; instead, mask the sort_code and account_number in the API response (`XX-XX-56`, `XXXX5678`). Store full values in DB with existing RLS. Expose full values only to the admin payout process via service role.

- Pros: No schema change; no data migration; masked display reduces incidental exposure
- Cons: Does not address the root risk (plaintext at rest); a DB breach still exposes full values

### 6.2 Recommended Path

**Recommendation: Option B (application-layer AES-256-GCM encryption).**

Rationale:
- No schema change means no data migration risk to existing RLS policies
- Portable and auditable — encryption logic is visible in application code, not a database black box
- `BANK_ENCRYPTION_KEY` is already a pattern compatible with the platform's existing `STRIPE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` secret management model

**This recommendation requires explicit approval before a migration or code change is planned.** The implementation would span:
1. New migration 064: No schema change — add a comment column `encrypted_at TIMESTAMPTZ` to track which rows have been migrated
2. New code: `lib/crypto/bank.ts` — encrypt/decrypt helpers using Node.js `crypto.subtle` or `crypto.createCipheriv`
3. Route change: `app/api/vendor/bank-details/route.ts` — encrypt on POST, decrypt on GET
4. Data migration script: one-time script to encrypt existing rows (run before deploying route changes)
5. Build verification and rollback plan

**This is not scoped for Phase 70D.5D. It is a separate phase.**

---

## 7. Data Protection Proofs

### Customer Data

| Data type | Table | Post-remediation protection |
|---|---|---|
| Email address | `email_log` | **Fixed by 061** — service role only |
| Profile data | `profiles` | Protected by 027 — no change required |
| Booking records | `bookings` | customer_id = auth.uid() — no change required |
| Financial ledger | `financial_ledger` | customer_id = auth.uid() — no change required |
| Financial events | `financial_events` | **Fixed by 062** — customer reads own via ledger join |
| Payment methods | Stripe only | Not stored in Supabase |

### Vendor Data

| Data type | Table | Post-remediation protection |
|---|---|---|
| Public profile | `public_vendor_profiles` view | Intentionally limited — no change required |
| Private profile | `profiles` | Protected by 027 — no change required |
| Bank details | `vendor_bank_details` | RLS correct; plaintext concern addressed in P2 future phase |
| Connect onboarding | `vendor_connect_onboarding` | vendor_id = auth.uid() — no change required |
| Payout records | `vendor_payouts` | vendor_id = auth.uid() — no change required |
| Financial ledger | `financial_ledger` | vendor_id join via vendors — no change required |
| Financial events | `financial_events` | **Fixed by 062** — vendor reads own via ledger join |

### Payment Data

| Data type | Table | Post-remediation protection |
|---|---|---|
| Stripe event log | `stripe_events` | **Fixed by 061** — service role only |
| Financial ledger | `financial_ledger` | Own rows only — no change required |
| Reconciliation runs | `reconciliation_runs` | RLS + no policy = deny-by-default — no change required |
| System financial events | `financial_events` (null-ledger) | **Fixed by 062** — service role only |

### Governance Data

| Data type | Table | Post-remediation protection |
|---|---|---|
| Governance decisions | `governance_decisions` | admin_roles gated + immutability trigger — no change required |
| Admin role assignments | `admin_roles` | Authenticated read of active rows is by design — no change required |
| Audit logs | `audit_logs` | USING(false) — service role only — no change required |

---

## 8. Deployment Strategy

### Recommended Sequence

```
061 → 062 → 063
```

Each migration is independent and can be rolled back individually. Deploy 061 first as the hotfix. Allow a short verification window between each. Do not batch all three.

### Per-Migration Deployment Checklist

**Migration 061 (Hotfix — deploy first):**
- [ ] Apply via Supabase Dashboard SQL Editor
- [ ] Verify: unauthenticated or authenticated query of `email_log` returns 0 rows / error
- [ ] Verify: unauthenticated or authenticated query of `stripe_events` returns 0 rows / error
- [ ] Verify: webhook handler can still write to `stripe_events` (POST a test webhook)

**Migration 062 (Low risk — deploy second):**
- [ ] Apply via Supabase Dashboard SQL Editor
- [ ] Verify: vendor authenticated query of `financial_events WHERE ledger_id IS NULL` returns 0 rows
- [ ] Verify: vendor authenticated query of `financial_events` returns only own events
- [ ] Verify: `appendLedgerEvent()` can still write (send a test webhook or use the cron endpoint)

**Migration 063 (Low risk — deploy third):**
- [ ] Apply via Supabase Dashboard SQL Editor
- [ ] Verify: `notify_user` function updated — check `information_schema.routines` for search_path
- [ ] Verify: bookings notification flow works end-to-end
- [ ] Verify: vendor profile view tracking works end-to-end

### Build Impact

Migrations 061, 062, and 063 are **database-only changes**. No TypeScript changes are required.

- No `npm run build` required before applying
- No Vercel deployment required before applying
- After applying, no Vercel deployment is required (no application code changes)

---

## 9. Out of Scope for This Plan

The following items from the 70D.5C audit are **not addressed in this plan** and require separate decisions:

| Item | Reason |
|---|---|
| `platform_settings` public read policy (EXP-001) | Likely intentional (commission rate displayed during onboarding). Requires product decision on which keys are safe to expose. |
| DEFAULT PRIVILEGES anon SELECT (PUB-001) | Security Advisor flag but correctly mitigated by RLS. Removing it could break the intentional `public_vendor_profiles` and browsing functionality. |
| Demo functions (015, 017, 018) | Low priority. Review in a separate cleanup phase. |
| `reconciliation_runs` no explicit policy | RLS + no policy = deny-by-default. Secure as-is. Add explicit admin policy when admin reconciliation UI is built. |
| master-growth-os project | Separate Supabase project — not in this repository. Must be audited and remediated via Supabase Dashboard directly. |
| P2 vendor_bank_details encryption | Requires design decision and separate phase. See Section 6. |

---

## 10. Sign-off Requirements

Before implementation begins, the following approvals are required:

- [ ] **P0 (Migration 061):** Approve deployment as hotfix
- [ ] **P1a (Migration 062):** Approve policy change on financial_events
- [ ] **P1b Option A or B (Migration 063):** Approve search_path only OR approve search_path + REVOKE + route changes
- [ ] **P2 design choice:** Approve Option A (Vault), B (application-layer AES), or C (masking only)
- [ ] **Phase 70D.6 gate:** Phase 70D.6 (role assignment) may proceed after 061 and 062 are deployed and verified. 063 and P2 do not block Phase 70D.6.
