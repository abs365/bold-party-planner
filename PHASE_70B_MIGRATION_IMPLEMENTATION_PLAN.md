# PHASE 70B — MIGRATION & IMPLEMENTATION PLAN

**Date:** 2026-06-23  
**Status:** AWAITING APPROVAL — No code written. No deployment. No migrations applied.  
**Approved scope:** Connect account creation, onboarding links, status tracking, data model, governance, kill switch.  
**Excluded scope:** Automated payouts, Stripe transfers, fund disbursement, scheduled payout jobs.

---

## PRE-IMPLEMENTATION CHECKLIST

Before any migration is applied or any code is written, the following must be true:

- [ ] Stripe Connect application submitted and approved in Stripe Dashboard (platform account)
- [ ] `STRIPE_CONNECT_ENABLED=false` set in Vercel production environment (kill switch starts OFF)
- [ ] `STRIPE_CONNECT_WEBHOOK_SECRET` value ready from Stripe Dashboard (Connect webhook endpoint configured in test mode first)
- [ ] Phase 70A architecture review confirmed accepted (done — this document)
- [ ] This implementation plan approved (pending)

---

## CURRENT STATE BASELINE (CONFIRMED FROM LIVE DB)

### `vendors` table — 55 columns, relevant constraints

```
vendors_lifecycle_state_check:
  CHECK (lifecycle_state IN (
    'applied','under_review','approved','profile_setup',
    'verified','live','rejected','suspended'
  ))
  DEFAULT: 'applied'

vendors_status_check:
  CHECK (status IN ('pending','approved','rejected','suspended'))

vendors_public_read policy (RLS):
  SELECT USING ((status = 'approved') OR (auth.uid() = user_id))
  [Any authenticated user can read ALL columns of any approved vendor]

vendors_own_write policy (RLS):
  ALL USING (auth.uid() = user_id)
  [Vendors can UPDATE any column on their own row via PostgREST]
```

### `financial_ledger` table — 17 columns

```
Confirmed columns: id, booking_id, customer_id, vendor_id,
  stripe_payment_intent_id, stripe_checkout_session_id, stripe_charge_id,
  gross_amount, platform_commission_amount, vendor_amount, refund_amount,
  chargeback_amount, currency, payment_status, payout_status,
  created_at, updated_at

RLS: ledger_vendor_select, ledger_customer_select (SELECT only)
```

### `financial_events` table — event_type CHECK constraint

```
CHECK (event_type IN (
  'PAYMENT_RECEIVED','BOOKING_CONFIRMED','REFUND_REQUESTED','REFUND_COMPLETED',
  'PAYOUT_CREATED','PAYOUT_SCHEDULED','PAYOUT_COMPLETED','PAYOUT_FAILED',
  'CHARGEBACK_RECEIVED','CHARGEBACK_RESOLVED','PAYMENT_FAILED',
  'WEBHOOK_RECEIVED','WEBHOOK_REJECTED','RECONCILIATION_RUN',
  'LEDGER_CREATED','LEDGER_UPDATED'
))

Table name: financial_events (NOT financial_ledger_events — that table does not exist)
```

---

## SECURITY ANALYSIS (PRE-MIGRATION)

### Finding 1 — `vendors_public_read` exposes all columns

The existing `vendors_public_read` RLS policy grants SELECT on ALL columns to any authenticated user for approved vendors. New `stripe_connect_*` columns added to `vendors` will be immediately readable by any logged-in customer or competing vendor.

**Affected columns by sensitivity:**

| Column | Sensitivity | Exposure risk |
|--------|-------------|--------------|
| `stripe_connect_status` | Low | Acceptable — operational trust signal |
| `stripe_connect_charges_enabled` | Low | Acceptable — boolean flag |
| `stripe_connect_payouts_enabled` | Low | Acceptable — boolean flag |
| `stripe_connect_details_submitted` | Low | Acceptable — boolean flag |
| `stripe_connect_onboarded_at` | Low | Acceptable — timestamp |
| `stripe_connect_account_id` | Medium | `acct_xxx` is not a payment credential, but is vendor financial identity data |

**Resolution for Phase 70B:** Do NOT store `stripe_connect_requirements` (KYC requirement detail JSONB) on the `vendors` table. Store it only in `vendor_connect_onboarding`, which has strict service-role-only write access. This is a deliberate deviation from the 70A architecture review draft and eliminates the highest-sensitivity field from the public read surface.

`stripe_connect_account_id` will be readable by authenticated users on approved vendor rows. This is acceptable — it is a Stripe identifier, not an API credential. No payment action can be initiated with only an `acct_xxx` value.

### Finding 2 — `vendors_own_write` allows vendor to UPDATE `stripe_connect_account_id`

The `vendors_own_write` policy (`ALL USING auth.uid() = user_id`) means a vendor can call the PostgREST API directly and UPDATE their own `stripe_connect_account_id` to point to a different account. This is a security hole: a vendor could re-point their account ID to a collaborator's Stripe account and misdirect payouts.

**Resolution for Phase 70B:** Migration 055 includes a `BEFORE UPDATE` trigger (`protect_connect_account_id`) that raises an exception if an authenticated user (not service role) attempts to change `stripe_connect_account_id` after it has been set. Initial writes (from NULL) are permitted — only changes after a value is assigned are blocked.

### Finding 3 — `financial_events` table name

The table is `financial_events`, not `financial_ledger_events`. The `appendLedgerEvent()` function in `lib/finance/ledger.ts` correctly references `financial_events`. The verify script used the wrong name (Phase 69F.3 finding). No action required — documenting to prevent future confusion.

---

## MIGRATION PLAN

Five migrations applied in sequence via:
```
npx supabase db query --linked --file supabase/migrations/0XX_name.sql
```

Each migration must be verified before the next is applied.

---

### Migration 055 — `vendors`: Stripe Connect columns + write protection

**File:** `supabase/migrations/055_vendor_stripe_connect.sql`

**Purpose:** Add 6 Connect tracking columns to `vendors`. Add trigger to prevent authenticated users from modifying `stripe_connect_account_id` after it has been set.

**Exact SQL:**

```sql
-- Migration 055: Stripe Connect columns on vendors
-- All columns nullable — existing rows are unaffected.
-- stripe_connect_requirements is intentionally excluded (stored in vendor_connect_onboarding only).

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_connect_status      TEXT
    CHECK (stripe_connect_status IN ('pending','restricted','active','disabled')),
  ADD COLUMN IF NOT EXISTS stripe_connect_details_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarded_at      TIMESTAMPTZ;

-- Index for webhook lookups: account.updated → find vendor by acct_xxx
CREATE INDEX IF NOT EXISTS idx_vendors_connect_account_id
  ON vendors(stripe_connect_account_id)
  WHERE stripe_connect_account_id IS NOT NULL;

-- Trigger: prevent authenticated users from changing stripe_connect_account_id once set.
-- Service role bypasses RLS and this trigger is SECURITY INVOKER — BUT we use auth.role()
-- which returns 'service_role' for admin client calls, 'authenticated' for user sessions.
CREATE OR REPLACE FUNCTION protect_connect_account_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only block if the value is actually changing AND was already set
  IF OLD.stripe_connect_account_id IS NOT NULL
    AND OLD.stripe_connect_account_id IS DISTINCT FROM NEW.stripe_connect_account_id
    AND auth.role() = 'authenticated' THEN
    RAISE EXCEPTION
      'stripe_connect_account_id cannot be modified by authenticated users after it is set. '
      'This field is managed by the ELBOLD payments system.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_connect_account_id ON vendors;
CREATE TRIGGER trg_protect_connect_account_id
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION protect_connect_account_id();
```

**Verification query (run after apply):**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'vendors' AND table_schema = 'public'
  AND column_name LIKE 'stripe_connect%'
ORDER BY ordinal_position;
-- Expected: 6 rows
```

**Risk:** Low. All additive. All nullable (except booleans with FALSE default — these fill existing rows with FALSE automatically). UNIQUE on nullable column allows multiple NULLs.

**Rollback SQL:**
```sql
DROP TRIGGER IF EXISTS trg_protect_connect_account_id ON vendors;
DROP FUNCTION IF EXISTS protect_connect_account_id();
ALTER TABLE vendors
  DROP COLUMN IF EXISTS stripe_connect_account_id,
  DROP COLUMN IF EXISTS stripe_connect_status,
  DROP COLUMN IF EXISTS stripe_connect_details_submitted,
  DROP COLUMN IF EXISTS stripe_connect_charges_enabled,
  DROP COLUMN IF EXISTS stripe_connect_payouts_enabled,
  DROP COLUMN IF EXISTS stripe_connect_onboarded_at;
```

---

### Migration 056 — `vendor_connect_onboarding`: new table

**File:** `supabase/migrations/056_vendor_connect_onboarding.sql`

**Purpose:** Track every Connect onboarding attempt. Store the Stripe Account requirements JSONB here (not on `vendors`) due to sensitivity. Strict RLS: vendor read-own, service-role write-only.

**Exact SQL:**

```sql
-- Migration 056: vendor_connect_onboarding
-- One row per onboarding attempt. A vendor may abandon and restart; each gets a new row.
-- The most recent row for a vendor_id represents the current onboarding state.

CREATE TABLE IF NOT EXISTS vendor_connect_onboarding (
  id                        UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id                 UUID        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  stripe_account_id         TEXT        NOT NULL,   -- mirrors vendors.stripe_connect_account_id
  onboarding_url            TEXT,                   -- Stripe AccountLink URL, expires in 5 minutes
  onboarding_url_expires_at TIMESTAMPTZ,
  refresh_url               TEXT        NOT NULL,   -- ELBOLD URL for expired link recovery
  return_url                TEXT        NOT NULL,   -- ELBOLD URL after onboarding completion
  status                    TEXT        NOT NULL DEFAULT 'created'
    CHECK (status IN ('created','link_generated','submitted','completed','failed')),
  requirements              JSONB,                  -- Stripe account.requirements snapshot (sensitive)
  failure_reason            TEXT,                   -- populated if status = 'failed'
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connect_onboarding_vendor_id
  ON vendor_connect_onboarding(vendor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_connect_onboarding_stripe_account
  ON vendor_connect_onboarding(stripe_account_id);

CREATE INDEX IF NOT EXISTS idx_connect_onboarding_status
  ON vendor_connect_onboarding(status)
  WHERE status NOT IN ('completed','failed');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_connect_onboarding_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_connect_onboarding_updated_at
  BEFORE UPDATE ON vendor_connect_onboarding
  FOR EACH ROW EXECUTE FUNCTION update_connect_onboarding_updated_at();

-- RLS
ALTER TABLE vendor_connect_onboarding ENABLE ROW LEVEL SECURITY;

-- Vendor reads own onboarding records only
CREATE POLICY "connect_onboarding_vendor_select"
  ON vendor_connect_onboarding FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- No INSERT/UPDATE/DELETE policy for authenticated role.
-- All writes go through createAdminClient() (service role), which bypasses RLS.

-- Grants
GRANT SELECT ON vendor_connect_onboarding TO authenticated;
GRANT ALL    ON vendor_connect_onboarding TO service_role;

NOTIFY pgrst, 'reload schema';
```

**Verification query:**
```sql
SELECT table_name, row_security
FROM information_schema.tables
WHERE table_name = 'vendor_connect_onboarding' AND table_schema = 'public';
-- Expected: 1 row, row_security = 'YES'

SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'vendor_connect_onboarding' AND schemaname = 'public';
-- Expected: 1 row (connect_onboarding_vendor_select, SELECT)
```

**Risk:** Low. New table, no FK impact on existing tables beyond `vendors(id) ON DELETE CASCADE`.

**Rollback SQL:**
```sql
DROP TABLE IF EXISTS vendor_connect_onboarding;
DROP FUNCTION IF EXISTS update_connect_onboarding_updated_at();
```

---

### Migration 057 — `financial_ledger`: commission rate + Connect columns

**File:** `supabase/migrations/057_financial_ledger_connect.sql`

**Purpose:** Add `commission_rate` (stores the rate used at booking time — no longer hardcoded only in application code) and 5 Connect-related columns. `commission_rate` fills existing rows with `0.1000` automatically.

**Exact SQL:**

```sql
-- Migration 057: financial_ledger — commission_rate + Connect columns
--
-- commission_rate: stores the rate used when this ledger entry was created.
--   DEFAULT 0.1000 backfills all 3 existing production rows correctly.
--   All future createLedgerEntry() calls write this field explicitly.
--
-- Connect columns (nullable): populated only when vendor has active Connect account.
--   These are informational during Phase 70B. Payout execution (Phase 70G) will write them.

ALTER TABLE financial_ledger
  ADD COLUMN IF NOT EXISTS commission_rate           DECIMAL(5,4) NOT NULL DEFAULT 0.1000,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id        TEXT,   -- 'tr_xxx' — Phase 70G
  ADD COLUMN IF NOT EXISTS stripe_application_fee_id TEXT,   -- 'fee_xxx' — Phase 70G
  ADD COLUMN IF NOT EXISTS connect_account_id        TEXT,   -- denormalized acct_xxx
  ADD COLUMN IF NOT EXISTS payout_scheduled_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_completed_at       TIMESTAMPTZ;

-- Index for payout reconciliation queries
CREATE INDEX IF NOT EXISTS idx_ledger_connect_account
  ON financial_ledger(connect_account_id)
  WHERE connect_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ledger_commission_rate
  ON financial_ledger(commission_rate);
```

**Verification query:**
```sql
-- Confirm commission_rate backfilled correctly on existing rows
SELECT id, gross_amount, platform_commission_amount, commission_rate
FROM financial_ledger
ORDER BY created_at;
-- All rows: commission_rate = 0.1000
-- Verify: platform_commission_amount = ROUND(gross_amount * 0.10, 2) ✓
```

**Risk:** Low. `commission_rate NOT NULL DEFAULT 0.1000` — Postgres fills all existing rows atomically. No table rewrite needed on the 3-row table.

**Rollback SQL:**
```sql
ALTER TABLE financial_ledger
  DROP COLUMN IF EXISTS commission_rate,
  DROP COLUMN IF EXISTS stripe_transfer_id,
  DROP COLUMN IF EXISTS stripe_application_fee_id,
  DROP COLUMN IF EXISTS connect_account_id,
  DROP COLUMN IF EXISTS payout_scheduled_at,
  DROP COLUMN IF EXISTS payout_completed_at;
```

---

### Migration 058 — `financial_events`: extend event_type constraint

**File:** `supabase/migrations/058_financial_events_connect_types.sql`

**Purpose:** Add Connect-specific event types to the `financial_events` CHECK constraint. All existing values preserved.

**Current constraint (confirmed from live DB):**
```
'PAYMENT_RECEIVED','BOOKING_CONFIRMED','REFUND_REQUESTED','REFUND_COMPLETED',
'PAYOUT_CREATED','PAYOUT_SCHEDULED','PAYOUT_COMPLETED','PAYOUT_FAILED',
'CHARGEBACK_RECEIVED','CHARGEBACK_RESOLVED','PAYMENT_FAILED',
'WEBHOOK_RECEIVED','WEBHOOK_REJECTED','RECONCILIATION_RUN',
'LEDGER_CREATED','LEDGER_UPDATED'
```

**New values added in Phase 70B (6):**
```
'CONNECT_ACCOUNT_CREATED'   — vendor's Express account created via API
'CONNECT_ACCOUNT_UPDATED'   — account.updated webhook received
'CONNECT_ACCOUNT_ACTIVATED' — charges_enabled AND payouts_enabled both became true
'CONNECT_ACCOUNT_RESTRICTED'— requirements became past_due or disabled_reason set
'CONNECT_ACCOUNT_DISABLED'  — account disabled by Stripe or ELBOLD
'REQUIREMENT_UPDATED'       — Stripe updated requirements without status change
```

**Note:** `TRANSFER_CREATED`, `TRANSFER_REVERSED`, `PAYOUT_COMPLETED`, `PAYOUT_FAILED` are NOT added here. `PAYOUT_COMPLETED` and `PAYOUT_FAILED` already exist in the constraint. `TRANSFER_CREATED` and `TRANSFER_REVERSED` are added in Phase 70G (payout execution).

**Exact SQL:**

```sql
-- Migration 058: financial_events — add Connect event types
-- Drop and recreate constraint with all existing + new values.
-- This is the only way to modify a CHECK constraint in PostgreSQL.

ALTER TABLE financial_events
  DROP CONSTRAINT IF EXISTS financial_events_event_type_check;

ALTER TABLE financial_events
  ADD CONSTRAINT financial_events_event_type_check
  CHECK (event_type IN (
    -- existing (Phase 040)
    'PAYMENT_RECEIVED',
    'BOOKING_CONFIRMED',
    'REFUND_REQUESTED',
    'REFUND_COMPLETED',
    'PAYOUT_CREATED',
    'PAYOUT_SCHEDULED',
    'PAYOUT_COMPLETED',
    'PAYOUT_FAILED',
    'CHARGEBACK_RECEIVED',
    'CHARGEBACK_RESOLVED',
    'PAYMENT_FAILED',
    'WEBHOOK_RECEIVED',
    'WEBHOOK_REJECTED',
    'RECONCILIATION_RUN',
    'LEDGER_CREATED',
    'LEDGER_UPDATED',
    -- Phase 70B (Connect account lifecycle)
    'CONNECT_ACCOUNT_CREATED',
    'CONNECT_ACCOUNT_UPDATED',
    'CONNECT_ACCOUNT_ACTIVATED',
    'CONNECT_ACCOUNT_RESTRICTED',
    'CONNECT_ACCOUNT_DISABLED',
    'REQUIREMENT_UPDATED'
  ));
```

**Verification query:**
```sql
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.financial_events'::regclass
  AND conname = 'financial_events_event_type_check';
-- Confirm all 22 values present
```

**Risk:** Low. Existing rows are all valid (they have values from the old set, which is a subset of the new set). Constraint DROP+ADD is atomic in the same transaction. No data change.

**Rollback SQL:**
```sql
-- Only safe if no rows with Phase 70B event types exist
-- Check first: SELECT COUNT(*) FROM financial_events WHERE event_type IN ('CONNECT_ACCOUNT_CREATED','CONNECT_ACCOUNT_UPDATED','CONNECT_ACCOUNT_ACTIVATED','CONNECT_ACCOUNT_RESTRICTED','CONNECT_ACCOUNT_DISABLED','REQUIREMENT_UPDATED');
ALTER TABLE financial_events
  DROP CONSTRAINT IF EXISTS financial_events_event_type_check;

ALTER TABLE financial_events
  ADD CONSTRAINT financial_events_event_type_check
  CHECK (event_type IN (
    'PAYMENT_RECEIVED','BOOKING_CONFIRMED','REFUND_REQUESTED','REFUND_COMPLETED',
    'PAYOUT_CREATED','PAYOUT_SCHEDULED','PAYOUT_COMPLETED','PAYOUT_FAILED',
    'CHARGEBACK_RECEIVED','CHARGEBACK_RESOLVED','PAYMENT_FAILED',
    'WEBHOOK_RECEIVED','WEBHOOK_REJECTED','RECONCILIATION_RUN',
    'LEDGER_CREATED','LEDGER_UPDATED'
  ));
```

---

### Migration 059 — `vendors.lifecycle_state`: add Connect states

**File:** `supabase/migrations/059_vendor_lifecycle_connect_states.sql`

**Purpose:** Add `connect_pending` and `payout_ready` to the `lifecycle_state` CHECK constraint. The existing trigger `sync_vendor_lifecycle_state` does not reference these values and requires no modification.

**Current constraint (confirmed from live DB):**
```
'applied','under_review','approved','profile_setup',
'verified','live','rejected','suspended'
```

**New values:**

| Value | Meaning | Set by |
|-------|---------|--------|
| `connect_pending` | Vendor has started Connect onboarding, not yet complete | `POST /api/vendor/connect/onboard` |
| `payout_ready` | Connect account active — payouts enabled | `account.updated` webhook handler |

**Trigger compatibility:** `sync_vendor_lifecycle_state` fires on `BEFORE UPDATE OF status`. It handles `rejected`, `suspended`, and re-instatement transitions. It does not reference `connect_pending` or `payout_ready`. If a vendor with `lifecycle_state = 'payout_ready'` is suspended, the trigger correctly sets `lifecycle_state = 'suspended'`. If later re-instated to approved, `lifecycle_state` resets to `'approved'` — the vendor must re-verify Connect. This is correct security behaviour.

**Exact SQL:**

```sql
-- Migration 059: vendors.lifecycle_state — add Connect states

ALTER TABLE vendors
  DROP CONSTRAINT IF EXISTS vendors_lifecycle_state_check;

ALTER TABLE vendors
  ADD CONSTRAINT vendors_lifecycle_state_check
  CHECK (lifecycle_state IN (
    -- existing
    'applied',
    'under_review',
    'approved',
    'profile_setup',
    'verified',
    'live',
    'rejected',
    'suspended',
    -- Phase 70B
    'connect_pending',   -- Connect onboarding initiated, not complete
    'payout_ready'       -- Connect active, payouts enabled
  ));
```

**Verification query:**
```sql
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.vendors'::regclass
  AND conname = 'vendors_lifecycle_state_check';
-- Confirm 10 values including connect_pending and payout_ready
```

**Risk:** Low. All existing rows have values from the original 8-value set, which is a subset of the new 10-value set.

**Rollback SQL:**
```sql
-- Only safe if no rows have 'connect_pending' or 'payout_ready'
-- Check first: SELECT COUNT(*) FROM vendors WHERE lifecycle_state IN ('connect_pending','payout_ready');
ALTER TABLE vendors
  DROP CONSTRAINT IF EXISTS vendors_lifecycle_state_check;

ALTER TABLE vendors
  ADD CONSTRAINT vendors_lifecycle_state_check
  CHECK (lifecycle_state IN (
    'applied','under_review','approved','profile_setup',
    'verified','live','rejected','suspended'
  ));
```

---

## CODE CHANGES

### Overview

7 code changes. All new files or additive changes to existing files. No existing behaviour is modified. The kill switch (`STRIPE_CONNECT_ENABLED`) gates all new routes.

---

### Change 1 — `lib/stripe.ts`: `assertConnectWebhookSecret()`

**File:** `lib/stripe.ts` (extend, do not rewrite)

**What changes:** Add one exported function alongside the existing `assertStripeKey()` and `assertWebhookSecret()`.

```typescript
// New function — added to existing lib/stripe.ts
export function assertConnectWebhookSecret(): string {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_CONNECT_WEBHOOK_SECRET environment variable is not set.");
  }
  return secret;
}
```

**Why separate from `assertWebhookSecret()`:** The Connect webhook endpoint in Stripe Dashboard has its own signing secret, independent of the platform webhook secret. Using the wrong secret would cause all Connect webhook signature verifications to fail.

---

### Change 2 — `lib/finance/ledger.ts`: store `commission_rate`

**File:** `lib/finance/ledger.ts` (modify `createLedgerEntry` only)

**What changes:** The `commission_rate` field is now written to the `financial_ledger` row. The parameter already exists (`commissionRate?: number, defaults to 0.10`). The INSERT statement gains one field.

**Existing `CreateLedgerEntryParams` interface:** No change needed — `commissionRate` is already a field.

**INSERT change (ledger.ts line ~51):**
```typescript
// Before:
const { data, error } = await supabase.from("financial_ledger").insert({
  booking_id:                 params.bookingId,
  customer_id:                params.customerId,
  vendor_id:                  params.vendorId,
  stripe_payment_intent_id:   params.stripePaymentIntentId ?? null,
  stripe_checkout_session_id: params.stripeCheckoutSessionId ?? null,
  gross_amount:               params.grossAmount,
  platform_commission_amount: commission,
  vendor_amount:              vendor,
  currency:                   params.currency ?? "gbp",
  payment_status:             params.paymentStatus ?? "paid",
  payout_status:              params.payoutStatus ?? "not_due",
}).select("id").single();

// After (one line added):
const { data, error } = await supabase.from("financial_ledger").insert({
  booking_id:                 params.bookingId,
  customer_id:                params.customerId,
  vendor_id:                  params.vendorId,
  stripe_payment_intent_id:   params.stripePaymentIntentId ?? null,
  stripe_checkout_session_id: params.stripeCheckoutSessionId ?? null,
  gross_amount:               params.grossAmount,
  platform_commission_amount: commission,
  vendor_amount:              vendor,
  commission_rate:            rate,          // ← new: stores rate used
  currency:                   params.currency ?? "gbp",
  payment_status:             params.paymentStatus ?? "paid",
  payout_status:              params.payoutStatus ?? "not_due",
}).select("id").single();
```

**Risk:** Low. `rate` is already computed on line ~47 (`const rate = params.commissionRate ?? 0.10`). Adding it to the INSERT is a one-line change. Migration 057 must be applied before this code is deployed.

---

### Change 3 — `app/api/vendor/connect/onboard/route.ts` (new file)

**Purpose:** Create a Stripe Express account for the vendor and generate the first onboarding link.

**Kill switch:** Returns 503 if `STRIPE_CONNECT_ENABLED !== 'true'`.

**Auth gate:** Requires authenticated vendor with `status = 'approved'`. Pending vendors cannot initiate Connect (they have no approved marketplace presence to receive payouts for).

**Idempotent:** If the vendor already has `stripe_connect_account_id` set, returns the existing account ID rather than creating a second account. Generates a new onboarding link in all cases (links expire in 5 minutes).

**Logic summary:**
```
1. Kill switch check → 503 if disabled
2. Auth: createClient() → getUser() → profile check (role = 'vendor')
3. Fetch vendor record via user_id — must be status='approved'
4. If vendor.stripe_connect_account_id already set → skip account creation
5. Else: stripe.accounts.create({ type:'express', country:'GB', capabilities:{ card_payments:{requested:true}, transfers:{requested:true} }, email: vendor.user.email, business_type: 'individual', metadata: { vendor_id, elbold_env: VERCEL_ENV } })
6. createAdminClient() → UPDATE vendors SET stripe_connect_account_id, stripe_connect_status='pending', lifecycle_state='connect_pending'
7. INSERT vendor_connect_onboarding (status:'created', stripe_account_id, refresh_url, return_url)
8. stripe.accountLinks.create({ account: acct_xxx, refresh_url, return_url, type:'account_onboarding' })
9. UPDATE vendor_connect_onboarding SET onboarding_url, onboarding_url_expires_at=NOW()+5min, status='link_generated'
10. INSERT financial_events (CONNECT_ACCOUNT_CREATED, metadata: { vendor_id, stripe_account_id })
11. Return { url: accountLink.url, accountId: acct_xxx, expiresAt }
```

**Response:**
```json
{ "url": "https://connect.stripe.com/...", "accountId": "acct_xxx", "expiresAt": "ISO timestamp" }
```

**Error cases:**
- 503: Connect disabled (kill switch)
- 401: Unauthenticated
- 403: Not a vendor, or vendor status ≠ 'approved'
- 409: Vendor already has a completed Connect account (`stripe_connect_status = 'active'`)
- 500: Stripe API failure

---

### Change 4 — `app/api/vendor/connect/status/route.ts` (new file)

**Purpose:** Return the vendor's current Connect onboarding status.

**Logic summary:**
```
1. Kill switch check → 503
2. Auth check → vendor only
3. Fetch vendor: stripe_connect_account_id, stripe_connect_status, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_details_submitted, stripe_connect_onboarded_at
4. Fetch latest vendor_connect_onboarding row for this vendor
5. Return combined status
```

**Response:**
```json
{
  "status": "pending" | "active" | "restricted" | "disabled" | null,
  "chargesEnabled": false,
  "payoutsEnabled": false,
  "detailsSubmitted": false,
  "onboardedAt": null,
  "latestOnboarding": {
    "status": "link_generated",
    "onboardingUrl": "https://...",
    "onboardingUrlExpiresAt": "ISO timestamp",
    "requirements": { ... }
  } | null
}
```

**Note:** `onboardingUrl` is only returned if `onboarding_url_expires_at > NOW()`. If expired, the client must call `/refresh` to get a new link.

---

### Change 5 — `app/api/vendor/connect/refresh/route.ts` (new file)

**Purpose:** Generate a new onboarding link when the existing one has expired. Called when the vendor returns to the setup page and the link has expired.

**Logic summary:**
```
1. Kill switch check → 503
2. Auth + vendor check
3. Vendor must have stripe_connect_account_id (cannot refresh non-existent account)
4. If stripe_connect_status = 'active' → return 409 (already complete, no refresh needed)
5. stripe.accountLinks.create({ account, refresh_url, return_url, type:'account_onboarding' })
6. UPDATE vendor_connect_onboarding (latest row) SET onboarding_url, onboarding_url_expires_at, status='link_generated'
7. Return { url, expiresAt }
```

---

### Change 6 — `app/api/vendor/connect/dashboard/route.ts` (new file)

**Purpose:** Generate a Stripe Express Dashboard login link. Vendors click this to view their payouts, update bank details, and download tax documents from Stripe's hosted dashboard.

**Logic summary:**
```
1. Kill switch check → 503
2. Auth + vendor check
3. stripe_connect_status must be 'active' (cannot access dashboard if not onboarded)
4. stripe.accounts.createLoginLink(vendor.stripe_connect_account_id)
5. Return { url } (link expires in 60 seconds — vendor must use immediately)
```

**Note:** Login links are single-use and expire in 60 seconds. The client must redirect the vendor immediately; do not cache or store the URL.

---

### Change 7 — `app/api/payments/connect-webhook/route.ts` (new file)

**Purpose:** Handle Stripe Connect webhook events (events fired on connected Express accounts). Separate from the existing platform webhook.

**Configuration in Stripe Dashboard:** A separate webhook endpoint (Connect webhook, not platform webhook) is registered at `https://www.elbold.com/api/payments/connect-webhook`. This uses `STRIPE_CONNECT_WEBHOOK_SECRET`, not `STRIPE_WEBHOOK_SECRET`.

**Events handled in Phase 70B:**
- `account.updated` — sync Connect status to `vendors` table

**Events NOT handled in Phase 70B (returned as `{ received: true }` without processing):**
- `transfer.created` — Phase 70G
- `payout.paid` — Phase 70G
- `payout.failed` — Phase 70G

**`account.updated` logic:**

```
1. constructEvent using STRIPE_CONNECT_WEBHOOK_SECRET
2. event.account = the connected acct_xxx
3. INSERT stripe_events (id: event.id, type: event.type, processed_at: NOW())
   → If 23505 (duplicate), return { received:true, duplicate:true }
4. On account.updated:
   a. account = event.data.object as Stripe.Account
   b. Derive stripe_connect_status:
      - !account.details_submitted                              → 'pending'
      - account.requirements?.disabled_reason                  → 'disabled'
      - account.payouts_enabled && account.charges_enabled      → 'active'
      - else                                                    → 'restricted'
   c. isNewlyActive = account.payouts_enabled && account.charges_enabled
   d. createAdminClient() → UPDATE vendors SET
        stripe_connect_status          = derived status
        stripe_connect_details_submitted = account.details_submitted
        stripe_connect_charges_enabled   = account.charges_enabled
        stripe_connect_payouts_enabled   = account.payouts_enabled
        stripe_connect_onboarded_at      = NOW() if isNewlyActive and was not already active
        lifecycle_state                  = 'payout_ready' if isNewlyActive
      WHERE stripe_connect_account_id = event.account
   e. UPDATE vendor_connect_onboarding (latest row for this vendor) SET
        requirements = account.requirements (JSONB snapshot)
        status = 'completed' if isNewlyActive, else keep current
   f. INSERT financial_events:
        event_type = 'CONNECT_ACCOUNT_ACTIVATED' if isNewlyActive
        event_type = 'CONNECT_ACCOUNT_RESTRICTED' if status = 'restricted'
        event_type = 'CONNECT_ACCOUNT_DISABLED'   if status = 'disabled'
        event_type = 'CONNECT_ACCOUNT_UPDATED'    otherwise
        metadata = { vendor_id, stripe_account_id: event.account, charges_enabled, payouts_enabled }
   g. If isNewlyActive: notify_user (vendor) "Your payout account is ready"
5. Return { received: true }
```

**Key design decisions:**
- Uses `createAdminClient()` (service role) for all DB writes — bypasses RLS
- Idempotency via `stripe_events` INSERT (same mechanism as platform webhook)
- Non-fatal pattern: DB errors are logged but webhook always returns 200 to Stripe to prevent retry loops for non-transient failures

---

## ENVIRONMENT VARIABLES

### New variables required

| Variable | Value | Purpose |
|----------|-------|---------|
| `STRIPE_CONNECT_ENABLED` | `false` (start) | Kill switch — master gate for all Connect endpoints |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | `whsec_...` (from Stripe) | Signing secret for Connect webhook endpoint |

### Setting process

1. Before Phase 70B deployment: Add `STRIPE_CONNECT_ENABLED=false` to Vercel production environment
2. After code deployment + migration verification: Keep `false` until Stripe Connect application is approved in Dashboard
3. After Stripe Connect application approval + Connect webhook configured: Set `STRIPE_CONNECT_WEBHOOK_SECRET`
4. When ready to enable onboarding for first vendors: Set `STRIPE_CONNECT_ENABLED=true`

---

## KILL SWITCH SPECIFICATION

### Mechanism

Environment variable `STRIPE_CONNECT_ENABLED` checked at route entry in all 5 Connect API routes:

```typescript
// At top of each route handler:
if (process.env.STRIPE_CONNECT_ENABLED !== 'true') {
  return NextResponse.json(
    { error: 'Vendor payout setup is not yet available. Check back soon.' },
    { status: 503 }
  );
}
```

### What kill switch controls

| Affected | Effect when OFF |
|----------|----------------|
| `POST /api/vendor/connect/onboard` | Returns 503 |
| `GET /api/vendor/connect/status` | Returns 503 |
| `POST /api/vendor/connect/refresh` | Returns 503 |
| `POST /api/vendor/connect/dashboard` | Returns 503 |
| `POST /api/payments/connect-webhook` | **NOT gated** — webhook must always accept events to prevent Stripe retries. Processes normally but logs a warning if `STRIPE_CONNECT_ENABLED !== 'true'`. |

### What kill switch does NOT affect

- Existing `/api/payments/checkout` — unchanged
- Existing `/api/payments/webhook` — unchanged
- Existing booking, quote, payment flows — unchanged
- `vendor_connect_onboarding` data already in DB — preserved
- `vendors.stripe_connect_*` columns already set — preserved

### Activation

```
STRIPE_CONNECT_ENABLED=true   → All Connect API routes activate
STRIPE_CONNECT_ENABLED=false  → All Connect API routes return 503
```

Change is effective immediately on next request (Next.js reads env at request time in App Router). No deployment required to toggle.

---

## COMPLETE IMPACT ASSESSMENT

### Existing routes — no change

| Route | Impact |
|-------|--------|
| `POST /api/payments/checkout` | None. No `application_fee_amount` or `transfer_data` in Phase 70B. |
| `POST /api/payments/webhook` | None. `account.updated` handled by the new `/connect-webhook` endpoint. |
| `GET /api/vendor/profile` | None. New `stripe_connect_*` columns not included in profile responses (API selects explicit columns). |
| `PATCH /api/vendor/profile` | None. New columns not in the allowed-fields list. Trigger prevents `stripe_connect_account_id` modification. |
| `POST /api/vendor/packages` | None. |
| `GET /api/vendor/matching` | None. Marketplace browsing unaffected. |
| `POST /api/quotes` | None. |
| All booking routes | None. |
| `proxy.ts` | None. No new lifecycle_state gates added in Phase 70B. |

### `lib/finance/ledger.ts` — minimal change

`createLedgerEntry()` gains one additional INSERT field (`commission_rate`). All callers (only the platform webhook at `app/api/payments/webhook/route.ts`) work unchanged — the new field uses the existing computed `rate` variable. Backward-compatible: Migration 057 must be applied before code deployment.

### `vendors` table — additive

6 new nullable columns. All existing queries that do `SELECT *` gain these columns in their results. No existing column changed. Type-safe TypeScript code using explicit column selection (all ELBOLD API routes) is unaffected — new columns simply don't appear in results until explicitly selected.

### `financial_ledger` table — additive

6 new columns. `commission_rate NOT NULL DEFAULT 0.1000` backfills 3 existing rows. All existing ledger queries work unchanged. The `updated_at` trigger continues working (only fires on UPDATE, not affected by new columns).

### `financial_events` table — constraint only

No row data changed. CHECK constraint extended. All existing rows remain valid (their values are in the old set, which is a subset of the new set).

---

## MIGRATION APPLICATION ORDER AND VERIFICATION

```
Apply 055 → verify vendors has 6 new columns
Apply 056 → verify vendor_connect_onboarding table exists + RLS correct
Apply 057 → verify financial_ledger has 6 new columns + commission_rate = 0.1000
Apply 058 → verify financial_events constraint has 22 values
Apply 059 → verify vendors.lifecycle_state constraint has 10 values
```

**Full verification SQL (run after all 5 migrations):**
```sql
-- 1. vendors columns
SELECT column_name FROM information_schema.columns
WHERE table_name='vendors' AND column_name LIKE 'stripe_connect%';
-- Expected: 6 rows

-- 2. trigger exists
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'trg_protect_connect_account_id';
-- Expected: 1 row

-- 3. onboarding table + RLS
SELECT COUNT(*) FROM vendor_connect_onboarding; -- 0 rows
SELECT policyname FROM pg_policies WHERE tablename='vendor_connect_onboarding';
-- Expected: 1 row (connect_onboarding_vendor_select)

-- 4. financial_ledger commission_rate
SELECT commission_rate FROM financial_ledger LIMIT 3;
-- Expected: all 0.1000

-- 5. financial_events constraint value count
SELECT pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid='public.financial_events'::regclass AND conname='financial_events_event_type_check';
-- Expected: 22 values

-- 6. lifecycle_state constraint value count
SELECT pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid='public.vendors'::regclass AND conname='vendors_lifecycle_state_check';
-- Expected: 10 values

-- 7. Existing production data untouched
SELECT id, status, lifecycle_state, stripe_connect_account_id FROM vendors LIMIT 5;
-- All stripe_connect_account_id: NULL (existing vendors unaffected)
```

---

## ROLLBACK PLAN

### Full rollback order (reverse of apply order)

```
1. Set STRIPE_CONNECT_ENABLED=false (instant, no deploy)
2. Deploy code rollback (remove 7 new/modified files)
3. Apply migration rollbacks in reverse: 059 → 058 → 057 → 056 → 055
```

### Per-migration rollback safety conditions

| Migration | Safe to rollback if... | Risk if rows exist with new values |
|-----------|----------------------|-----------------------------------|
| 059 (lifecycle_state) | No rows with `connect_pending` or `payout_ready` | CHECK constraint violation prevents rollback |
| 058 (event_type) | No rows with 6 new event types | CHECK constraint violation prevents rollback |
| 057 (ledger columns) | Always safe (nullable columns) | None |
| 056 (onboarding table) | Always safe (DROP TABLE) | Onboarding data lost — acceptable as rollback cost |
| 055 (vendors columns) | Always safe (DROP COLUMN) | stripe_connect_account_id lost — Stripe accounts would need to be re-linked |

### Code rollback — 7 files

| Action | File |
|--------|------|
| Remove | `app/api/vendor/connect/onboard/route.ts` |
| Remove | `app/api/vendor/connect/status/route.ts` |
| Remove | `app/api/vendor/connect/refresh/route.ts` |
| Remove | `app/api/vendor/connect/dashboard/route.ts` |
| Remove | `app/api/payments/connect-webhook/route.ts` |
| Revert | `lib/stripe.ts` (remove `assertConnectWebhookSecret`) |
| Revert | `lib/finance/ledger.ts` (remove `commission_rate` from INSERT) |

**Note:** `lib/finance/ledger.ts` revert must be deployed before Migration 057 is rolled back — otherwise `commission_rate` column no longer exists but code still references it.

---

## SECURITY REVIEW SUMMARY

| Area | Status | Notes |
|------|--------|-------|
| `stripe_connect_account_id` public read | Accepted | `acct_xxx` is not a credential. No payment can be initiated with it alone. |
| `stripe_connect_requirements` public read | Mitigated | Stored ONLY in `vendor_connect_onboarding` (service-role write, vendor-own read). Not on `vendors`. |
| Vendor tampering with own `stripe_connect_account_id` | Mitigated | `trg_protect_connect_account_id` trigger blocks authenticated-role changes after initial set. |
| Onboarding URL exposure | Contained | RLS: vendor reads own rows only. Short-lived (5 min TTL). Never returned after expiry. |
| Connect webhook signature | Enforced | Separate `STRIPE_CONNECT_WEBHOOK_SECRET` + `stripe.webhooks.constructEvent()`. |
| Service role usage | Appropriate | All Connect DB writes via `createAdminClient()`. No Connect writes available to user sessions. |
| Kill switch | Implemented | `STRIPE_CONNECT_ENABLED` env var. Starts `false`. All routes gated. |
| Stripe Connect application | External dependency | Must be approved by Stripe before live mode onboarding is possible. |
| Data minimisation | Adequate | Sensitive `requirements` JSONB isolated to `vendor_connect_onboarding`. |

---

## PHASE 70B DELIVERABLE SUMMARY

**5 migrations** (applied sequentially after approval):
- 055: vendors — 6 Connect columns + write-protection trigger
- 056: vendor_connect_onboarding — new table, strict RLS
- 057: financial_ledger — commission_rate + 5 Connect columns
- 058: financial_events — 6 new event type values
- 059: vendors.lifecycle_state — 2 new values

**7 code changes** (deployed together, after migrations):
- `lib/stripe.ts` — `assertConnectWebhookSecret()`
- `lib/finance/ledger.ts` — store `commission_rate` in INSERT
- `/api/vendor/connect/onboard` — new route
- `/api/vendor/connect/status` — new route
- `/api/vendor/connect/refresh` — new route
- `/api/vendor/connect/dashboard` — new route
- `/api/payments/connect-webhook` — new route (handles `account.updated`)

**2 environment variables**:
- `STRIPE_CONNECT_ENABLED=false` (kill switch, starts off)
- `STRIPE_CONNECT_WEBHOOK_SECRET` (set when Stripe Connect webhook configured)

**0 existing routes modified**  
**0 existing payment flows changed**  
**0 automated payouts, transfers, or disbursements**

---

*Phase 70B implementation plan complete. Awaiting approval before any code is written or migration is applied.*
