# PHASE 70B — IMPLEMENTATION REPORT

**Date:** 2026-06-23  
**Status:** COMPLETE — Awaiting deployment approval  
**Build:** ✅ PASS — 0 TypeScript errors, 111 pages compiled  
**Migrations applied:** ❌ NOT YET — Await approval before applying  
**Deployed:** ❌ NOT YET — Await approval before deploying

---

## SCOPE COMPLIANCE

All approved scope delivered. All exclusions respected.

| Approved scope | Status |
|---|---|
| Stripe Connect columns on vendors | ✅ Migration 055 |
| vendor_connect_onboarding table | ✅ Migration 056 |
| financial_ledger Connect tracking columns + commission_rate | ✅ Migration 057 |
| financial_events constraint expansion (16 → 22 values) | ✅ Migration 058 |
| lifecycle_state values: connect_pending, payout_ready | ✅ Migration 059 |
| Connect webhook endpoint foundation | ✅ `/api/payments/connect-webhook` |
| Kill switch default OFF | ✅ `STRIPE_CONNECT_ENABLED !== 'true'` gate |

| Excluded scope | Verified absent |
|---|---|
| Automated payouts | ✅ No Stripe transfer calls anywhere |
| Stripe transfers | ✅ No `stripe.transfers.create` anywhere |
| Customer payments routed to connected accounts | ✅ Checkout route unchanged |
| Existing checkout behaviour altered | ✅ Confirmed unchanged |
| Existing webhook behaviour altered | ✅ Confirmed unchanged |
| `STRIPE_CONNECT_ENABLED` defaulting to true | ✅ Defaults false (env var absent = false) |
| `bookings.customer_id` touched | ✅ Not touched |
| `bookings.event_id` touched | ✅ Not touched |
| `financial_ledger.customer_id` touched | ✅ Not touched |

---

## MIGRATIONS

### Migration 055 — `vendors`: Stripe Connect columns + write protection

**File:** `supabase/migrations/055_vendor_stripe_connect.sql`  
**Status:** Written, NOT applied

**Changes:**
- `stripe_connect_account_id TEXT UNIQUE` — nullable, indexed for webhook lookups
- `stripe_connect_status TEXT CHECK (IN ('pending','restricted','active','disabled'))` — nullable
- `stripe_connect_details_submitted BOOLEAN NOT NULL DEFAULT FALSE` — backfills existing rows with FALSE
- `stripe_connect_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE` — backfills existing rows with FALSE
- `stripe_connect_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE` — backfills existing rows with FALSE
- `stripe_connect_onboarded_at TIMESTAMPTZ` — nullable
- `idx_vendors_connect_account_id` partial index on non-null values
- `protect_connect_account_id()` trigger: blocks `authenticated` role from modifying `stripe_connect_account_id` once set

**Destructive changes:** None. All additive. All existing rows unaffected.

---

### Migration 056 — `vendor_connect_onboarding`: new table

**File:** `supabase/migrations/056_vendor_connect_onboarding.sql`  
**Status:** Written, NOT applied

**Changes:**
- New table `vendor_connect_onboarding` (12 columns)
- RLS enabled: vendor read-own only (`connect_onboarding_vendor_select`)
- No write access for `authenticated` role — all writes via service role only
- `update_connect_onboarding_updated_at()` trigger
- `NOTIFY pgrst, 'reload schema'`

**Destructive changes:** None. New table only.

---

### Migration 057 — `financial_ledger`: commission_rate + Connect columns

**File:** `supabase/migrations/057_financial_ledger_connect.sql`  
**Status:** Written, NOT applied

**Changes:**
- `commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.1000` — backfills all existing rows with 0.1000 (correct)
- `stripe_transfer_id TEXT` — nullable, for Phase 70G
- `stripe_application_fee_id TEXT` — nullable, for Phase 70G
- `connect_account_id TEXT` — nullable, denormalized acct_xxx
- `payout_scheduled_at TIMESTAMPTZ` — nullable
- `payout_completed_at TIMESTAMPTZ` — nullable
- Two partial indexes

**Destructive changes:** None. All additive. `commission_rate NOT NULL DEFAULT 0.1000` fills existing 3 production rows atomically.

---

### Migration 058 — `financial_events`: extend event_type constraint

**File:** `supabase/migrations/058_financial_events_connect_types.sql`  
**Status:** Written, NOT applied

**Changes:**
- Drops `financial_events_event_type_check` constraint
- Recreates with 22 values (16 existing + 6 new Connect types)

**New values:** `CONNECT_ACCOUNT_CREATED`, `CONNECT_ACCOUNT_UPDATED`, `CONNECT_ACCOUNT_ACTIVATED`, `CONNECT_ACCOUNT_RESTRICTED`, `CONNECT_ACCOUNT_DISABLED`, `REQUIREMENT_UPDATED`

**Destructive changes:** None. All existing rows have values from the old 16-value set, which is a strict subset of the new 22-value set.

---

### Migration 059 — `vendors.lifecycle_state`: add Connect states

**File:** `supabase/migrations/059_vendor_lifecycle_connect_states.sql`  
**Status:** Written, NOT applied

**Changes:**
- Drops `vendors_lifecycle_state_check` constraint
- Recreates with 10 values (8 existing + `connect_pending` + `payout_ready`)

**Destructive changes:** None. All existing vendor rows have values from the original 8-value set.

---

## CODE CHANGES

### `lib/stripe.ts` — `assertConnectWebhookSecret()` added

Added one exported function alongside the existing `assertStripeKey()` and `assertWebhookSecret()`. Returns `STRIPE_CONNECT_WEBHOOK_SECRET` or throws if not set.

**Existing functions:** Unchanged.

---

### `lib/finance/ledger.ts` — Connect event types + commission_rate

**FinancialEventType union:** Extended from 16 to 22 values. Added:
```
'CONNECT_ACCOUNT_CREATED' | 'CONNECT_ACCOUNT_UPDATED' | 'CONNECT_ACCOUNT_ACTIVATED'
'CONNECT_ACCOUNT_RESTRICTED' | 'CONNECT_ACCOUNT_DISABLED' | 'REQUIREMENT_UPDATED'
```

**`createLedgerEntry()` INSERT:** Added `commission_rate: rate` field. The `rate` variable was already computed on line 47 (`params.commissionRate ?? 0.10`). One-line addition.

**All other functions:** Unchanged. `createLedgerEntry`, `updateLedgerPaymentStatus`, `appendLedgerEvent`, `updateLedgerPayoutStatus` signatures unchanged.

---

### `app/api/vendor/connect/onboard/route.ts` — new

**Method:** POST  
**Kill switch:** Returns 503 if `STRIPE_CONNECT_ENABLED !== 'true'`  
**Rate limit:** 5 per hour per user (`connect:onboard:{user_id}`)  
**Auth gate:** Authenticated vendor with `status = 'approved'`

**Logic:**
1. Kill switch → 503
2. Auth → 401
3. Rate limit → 429
4. Fetch vendor — must exist (`status = 'approved'`), else 403
5. If `stripe_connect_status = 'active'` → 409
6. If no existing `stripe_connect_account_id`: create Express account via `stripe.accounts.create`, UPDATE vendors (account_id, status='pending', lifecycle_state='connect_pending')
7. INSERT `vendor_connect_onboarding` (status='created')
8. `stripe.accountLinks.create` (type='account_onboarding')
9. UPDATE onboarding row (url, expires_at, status='link_generated')
10. Fire-and-forget: `appendLedgerEvent(CONNECT_ACCOUNT_CREATED)` if new account
11. Return `{ url, accountId, expiresAt }`

**Idempotent:** Vendors with an existing account get a new link without creating a second Stripe account.

---

### `app/api/vendor/connect/status/route.ts` — new

**Method:** GET  
**Kill switch:** Returns 503 if disabled

**Logic:** Fetches vendor Connect columns + latest `vendor_connect_onboarding` row. Suppresses `onboardingUrl` if expired (`onboarding_url_expires_at ≤ NOW()`). Returns combined status object.

**Response:**
```json
{
  "status": "pending" | "active" | "restricted" | "disabled" | null,
  "chargesEnabled": false,
  "payoutsEnabled": false,
  "detailsSubmitted": false,
  "onboardedAt": null,
  "latestOnboarding": { "status": "...", "onboardingUrl": null, "urlExpired": true, "requirements": {} } | null
}
```

---

### `app/api/vendor/connect/refresh/route.ts` — new

**Method:** POST  
**Kill switch:** Returns 503 if disabled  
**Auth gate:** Authenticated vendor with existing `stripe_connect_account_id`

**Logic:** Calls `stripe.accountLinks.create` to regenerate an expired link. Updates latest `vendor_connect_onboarding` row. Returns `{ url, expiresAt }`.

**Guards:** 400 if no account exists. 409 if already active.

---

### `app/api/vendor/connect/dashboard/route.ts` — new

**Method:** POST  
**Kill switch:** Returns 503 if disabled  
**Auth gate:** Authenticated vendor with `stripe_connect_status = 'active'`

**Logic:** Calls `stripe.accounts.createLoginLink`. Returns `{ url }`. Login links are single-use and expire in 60 seconds — client must redirect immediately.

---

### `app/api/payments/connect-webhook/route.ts` — new

**Method:** POST  
**Runtime:** `nodejs` (required for raw body reading)  
**Kill switch:** NOT gated — must always process to prevent Stripe retry exhaustion. Logs warning if disabled.

**Signature verification:** `stripe.webhooks.constructEvent(body, sig, assertConnectWebhookSecret())`  
**Idempotency:** INSERT into `stripe_events` — same mechanism as platform webhook. 23505 = duplicate, return early.  
**All DB writes:** via `createAdminClient()` (service role, bypasses RLS)

**`account.updated` handler:**
1. Fetch vendor by `stripe_connect_account_id`
2. Derive `newStatus` ('pending' / 'restricted' / 'active' / 'disabled') from Stripe account fields
3. Compute `isNewlyActive` (charges_enabled AND payouts_enabled, where vendor was not previously active)
4. UPDATE vendors (all stripe_connect_* columns; if `isNewlyActive`: set `lifecycle_state = 'payout_ready'` + `stripe_connect_onboarded_at`)
5. UPDATE latest `vendor_connect_onboarding` row (requirements snapshot; if `isNewlyActive`: status = 'completed')
6. Fire-and-forget: `appendLedgerEvent` (ACTIVATED / RESTRICTED / DISABLED / UPDATED as appropriate)
7. If `isNewlyActive`: `notify_user` via RPC

---

## EXISTING ROUTES — CHANGE VERIFICATION

| Route | Changed? | Evidence |
|-------|----------|---------|
| `POST /api/payments/checkout` | No | File not touched |
| `POST /api/payments/webhook` | No | File not touched |
| `GET /api/vendor/profile` | No | File not touched |
| `PATCH /api/vendor/profile` | No | File not touched |
| `POST /api/vendor/packages` | No | File not touched |
| `GET /api/vendor/matching` | No | File not touched |
| `POST /api/quotes` | No | File not touched |
| All booking routes | No | Not touched |
| `proxy.ts` | No | Not touched |

---

## MIGRATION DESTRUCTIVE CHANGE REVIEW

| Migration | Additive? | Risk |
|-----------|-----------|------|
| 055 | ✅ Yes — nullable columns + trigger | Low — existing rows gain NULL/FALSE defaults |
| 056 | ✅ Yes — new table | Low — no FK impact on existing tables |
| 057 | ✅ Yes — nullable columns + `commission_rate NOT NULL DEFAULT 0.1000` | Low — 3 existing rows backfilled with 0.1000 (correct) |
| 058 | ✅ Yes — constraint expanded (superset of old values) | Low — no existing row violates new constraint |
| 059 | ✅ Yes — constraint expanded (superset of old values) | Low — no existing row violates new constraint |

**Conclusion: All 5 migrations are purely additive. No existing data is modified, removed, or invalidated.**

---

## BUILD VERIFICATION

```
npm run build → ✅ PASS
TypeScript: 0 errors
Pages compiled: 111
New routes visible:
  ƒ /api/payments/connect-webhook
  ƒ /api/vendor/connect/dashboard
  ƒ /api/vendor/connect/onboard
  ƒ /api/vendor/connect/refresh
  ƒ /api/vendor/connect/status
```

---

## CURRENT PAYMENT PATH — UNCHANGED

The Phase 69F.3 validated payment flow is bitwise identical:

1. `POST /api/payments/checkout` — unchanged — no `application_fee_amount`, no `transfer_data`
2. `POST /api/payments/webhook` — unchanged — handles `checkout.session.completed`, creates `financial_ledger` row with `commission_rate: 0.10` (new field, same computed value)
3. Financial split: 10% platform / 90% vendor — unchanged
4. `stripe_connect_*` fields on any new `financial_ledger` row: all NULL (Connect columns only populated when vendor is active and payouts are executed in Phase 70G)

---

## ENVIRONMENT VARIABLES REQUIRED

| Variable | State | Action required |
|----------|-------|----------------|
| `STRIPE_CONNECT_ENABLED` | Must be set in Vercel | Add to production env as `false` before deployment |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | Not yet available | Set when Stripe Connect webhook is configured in Dashboard |

**Deployment gate:** `STRIPE_CONNECT_ENABLED=false` must be set in Vercel production **before** deploying this code. If the variable is absent, the kill switch still fires (absent ≠ 'true').

---

## DEPLOYMENT STEPS (DO NOT EXECUTE UNTIL APPROVED)

```
1. Add STRIPE_CONNECT_ENABLED=false to Vercel production environment
2. Apply migrations (in order):
   npx supabase db query --linked --file supabase/migrations/055_vendor_stripe_connect.sql
   npx supabase db query --linked --file supabase/migrations/056_vendor_connect_onboarding.sql
   npx supabase db query --linked --file supabase/migrations/057_financial_ledger_connect.sql
   npx supabase db query --linked --file supabase/migrations/058_financial_events_connect_types.sql
   npx supabase db query --linked --file supabase/migrations/059_vendor_lifecycle_connect_states.sql
3. Verify migrations (see verification SQL in PHASE_70B_MIGRATION_IMPLEMENTATION_PLAN.md)
4. Deploy code to Vercel (git push → auto-deploy or manual trigger)
5. Verify all 5 new routes return 503 (STRIPE_CONNECT_ENABLED=false, kill switch active)
6. Stripe Connect remains disabled until:
   a. Stripe Connect application approved in Stripe Dashboard
   b. Connect webhook endpoint configured + STRIPE_CONNECT_WEBHOOK_SECRET set
   c. STRIPE_CONNECT_ENABLED=true set in Vercel
```

---

## PHASE 70B DELIVERABLE SUMMARY

| Deliverable | Status |
|-------------|--------|
| Migration 055 — vendors Connect columns | ✅ Written |
| Migration 056 — vendor_connect_onboarding table | ✅ Written |
| Migration 057 — financial_ledger commission_rate + Connect | ✅ Written |
| Migration 058 — financial_events 22 event types | ✅ Written |
| Migration 059 — lifecycle_state 10 values | ✅ Written |
| `lib/stripe.ts` — assertConnectWebhookSecret() | ✅ Written |
| `lib/finance/ledger.ts` — Connect types + commission_rate | ✅ Written |
| `POST /api/vendor/connect/onboard` | ✅ Written |
| `GET /api/vendor/connect/status` | ✅ Written |
| `POST /api/vendor/connect/refresh` | ✅ Written |
| `POST /api/vendor/connect/dashboard` | ✅ Written |
| `POST /api/payments/connect-webhook` | ✅ Written |
| `npm run build` | ✅ PASS |
| Migrations reviewed — all additive | ✅ Confirmed |
| Current payment path unchanged | ✅ Confirmed |
| No deployment executed | ✅ Confirmed |
