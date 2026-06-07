# Stripe Connect Migration Plan
**ELBOLD Events — Technical Architecture Document**
**Version 1.0 | June 2026 | Status: PLANNING (Do Not Execute)**

---

## Executive Summary

ELBOLD currently processes all payments through a single Stripe account, then distributes vendor earnings manually. This creates regulatory exposure (ELBOLD holds client money under UK PSR 2017), operational burden (manual payout reconciliation), and trust gaps (vendors cannot verify when they will be paid).

Stripe Connect — specifically the **Destination Charges** model — eliminates all three problems at once. This document defines the full technical migration path, engineering effort, migration risks, and a trigger-based timeline.

**Recommendation:** Do not migrate immediately. Execute when monthly GMV consistently exceeds £10,000 or vendor count exceeds 20 active vendors, whichever comes first.

---

## 1. Architecture Decision: Connect Model

### Option A — Destination Charges (Recommended)

```
Customer → ELBOLD Stripe account
  ├─ ELBOLD retains 10% (application_fee_amount)
  └─ 90% routed to vendor connected account (destination)
```

- Customer sees "ELBOLD Events" on their bank statement
- ELBOLD controls the full customer experience
- Vendor funds arrive in their Stripe connected account automatically
- Dispute handling stays with ELBOLD
- Stripe fee: £2/month per connected account + standard per-transaction fees

### Option B — Separate Charges and Transfers (Not Recommended for current scale)

```
Customer → ELBOLD Stripe account (full charge)
ELBOLD manually transfers 90% → vendor connected account
```

- More flexible but requires two API calls per payment
- Transfer can fail independently of the charge
- More complex reconciliation

### Option C — Direct Charges on Connected Account (Not Suitable)

```
Customer → Vendor Stripe account (direct)
ELBOLD receives platform_fee
```

- Vendor manages disputes, refunds, chargebacks
- ELBOLD has less control over customer experience
- Not appropriate for a marketplace where ELBOLD owns trust

**Decision: Option A (Destination Charges).**

---

## 2. Database Schema Changes

### 2a. New columns on `vendors` table

```sql
ALTER TABLE vendors
  ADD COLUMN stripe_account_id        TEXT UNIQUE,
  ADD COLUMN stripe_account_status    TEXT NOT NULL DEFAULT 'not_connected'
    CHECK (stripe_account_status IN ('not_connected', 'pending', 'active', 'restricted', 'rejected')),
  ADD COLUMN stripe_charges_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN stripe_payouts_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN stripe_onboarding_url    TEXT,
  ADD COLUMN stripe_onboarding_expiry TIMESTAMPTZ,
  ADD COLUMN stripe_connected_at      TIMESTAMPTZ;
```

### 2b. New columns on `payments` table

```sql
ALTER TABLE payments
  ADD COLUMN stripe_transfer_id       TEXT,
  ADD COLUMN stripe_application_fee_id TEXT,
  ADD COLUMN connect_destination      TEXT; -- vendor stripe_account_id
```

### 2c. New columns on `vendor_payouts` table

```sql
ALTER TABLE vendor_payouts
  ADD COLUMN stripe_transfer_id       TEXT UNIQUE,
  ADD COLUMN stripe_transfer_status   TEXT,
  ADD COLUMN connect_model            TEXT DEFAULT 'manual'
    CHECK (connect_model IN ('manual', 'destination_charge', 'transfer'));
```

### 2d. New migration file: `041_stripe_connect.sql`

Run after vendor onboarding is complete for all active vendors.

---

## 3. Vendor Onboarding Flow (Connect)

### 3a. New page: `/vendor/connect`

1. Vendor clicks "Connect Bank Account via Stripe"
2. POST `/api/vendor/stripe-connect/create-account` → creates Stripe Express account
3. Store `stripe_account_id` on vendor row
4. Redirect to `stripe.accountLinks.create({ type: 'account_onboarding' })` URL
5. Stripe redirects back to `/vendor/connect/return?status=success` or `/vendor/connect/return?status=refresh`
6. On return: call `/api/vendor/stripe-connect/refresh-status` → updates `stripe_charges_enabled`, `stripe_payouts_enabled`

### 3b. New API routes

```
POST /api/vendor/stripe-connect/create-account
  - Creates Stripe Express account
  - Stores stripe_account_id on vendor

GET  /api/vendor/stripe-connect/account-link
  - Returns a fresh onboarding URL (account links expire after 5 minutes)

POST /api/vendor/stripe-connect/refresh-status
  - Retrieves account from Stripe API
  - Updates stripe_charges_enabled, stripe_payouts_enabled, stripe_account_status

GET  /api/vendor/stripe-connect/dashboard-link
  - Returns a Stripe Express dashboard URL for the vendor
  - Vendors can view their own payouts from Stripe's dashboard
```

### 3c. Status display in vendor dashboard

Show a Connect banner if `stripe_account_status !== 'active'`:
- "Not connected" → prompt to connect
- "Pending" → "Stripe is reviewing your account (usually 1–2 business days)"
- "Restricted" → "Action required: complete your Stripe verification"

---

## 4. Payment Processing Changes

### 4a. Destination Charge at checkout

**File: `app/api/payments/checkout/route.ts`**

Current code (simplified):
```typescript
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [...],
  // No Connect parameters
});
```

New code:
```typescript
// Fetch vendor's connected account ID
const { data: vendor } = await db
  .from("vendors")
  .select("stripe_account_id, stripe_charges_enabled")
  .eq("id", vendorId)
  .single();

if (!vendor?.stripe_account_id || !vendor.stripe_charges_enabled) {
  // Fall back to manual payout model until vendor is connected
  // OR reject if Connect is required
}

const applicationFeeAmount = Math.round(totalAmount * 0.10 * 100); // in pence

const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [...],
  payment_intent_data: {
    application_fee_amount: applicationFeeAmount,
    transfer_data: {
      destination: vendor.stripe_account_id,
    },
  },
});
```

### 4b. No manual payout trigger

With destination charges, the 90% transfer to the vendor happens automatically at the time of payment. The `auto_create_payout()` trigger and manual payout processing in `/admin/payouts` is only needed for pre-migration bookings.

### 4c. Refund handling

```typescript
// Refund via connected account — Stripe handles fee reversal
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
  amount: refundAmountPence,
  reverse_transfer: true,      // Pulls funds back from vendor account
  refund_application_fee: isFullRefund, // Returns ELBOLD's fee for full refunds
});
```

### 4d. Webhook additions

New webhook events to handle:
- `account.updated` — vendor Connect account status changed (charges/payouts enabled/disabled)
- `transfer.created` — record Stripe transfer ID on vendor_payouts
- `transfer.failed` — mark payout as failed, alert admin

---

## 5. Webhook Changes

### 5a. New handler: `account.updated`

```typescript
case "account.updated": {
  const account = event.data.object as Stripe.Account;
  await db.from("vendors").update({
    stripe_charges_enabled: account.charges_enabled,
    stripe_payouts_enabled: account.payouts_enabled,
    stripe_account_status:  account.charges_enabled ? "active" : "restricted",
  }).eq("stripe_account_id", account.id);
  break;
}
```

### 5b. New handler: `transfer.created`

```typescript
case "transfer.created": {
  const transfer = event.data.object as Stripe.Transfer;
  await db.from("vendor_payouts").update({
    stripe_transfer_id:     transfer.id,
    stripe_transfer_status: "created",
    connect_model:          "destination_charge",
  }).eq("booking_id", transfer.metadata.booking_id ?? null);
  break;
}
```

---

## 6. Admin Dashboard Changes

### 6a. `/admin/vendors` — Add Connect status column

Show `stripe_account_status` badge per vendor. Flag any vendor with `status = 'restricted'` as requiring action.

### 6b. `/admin/payouts` — Two modes

| Mode | Description |
|------|-------------|
| Manual (legacy) | Pre-migration bookings, vendors not yet connected |
| Connect (automated) | Post-migration; payouts confirmed via Stripe transfer IDs |

### 6c. Finance Dashboard — Stripe balance update

With destination charges, ELBOLD's Stripe balance only reflects the 10% commission retained. The `stripeBalance.available` on the Finance Dashboard will show ELBOLD's retained revenue, not gross GMV. Comment the code to make this clear post-migration.

---

## 7. Migration Execution Plan

### Phase 0 — Preparation (2–4 weeks before migration)

- [ ] Apply `041_stripe_connect.sql` migration to production Supabase
- [ ] Deploy vendor Connect onboarding flow (`/vendor/connect`) behind a feature flag
- [ ] Set `STRIPE_CONNECT_ENABLED=false` env var (payments fall back to manual model)
- [ ] Add `transfer_data` parameter to checkout creation but guard behind env var
- [ ] Enable `account.updated` webhook in Stripe dashboard

### Phase 1 — Vendor Onboarding Sprint (4–8 weeks)

- [ ] Email all active vendors with Connect onboarding link
- [ ] Monitor `stripe_account_status` in admin dashboard
- [ ] Target: 80%+ of active vendors fully onboarded before cutover
- [ ] Support vendors who have difficulty completing Stripe identity verification

### Phase 2 — Soft Launch (1 week)

- [ ] Set `STRIPE_CONNECT_ENABLED=true` for NEW bookings only
- [ ] Legacy bookings continue with manual payout model
- [ ] Monitor: webhook latency, transfer success rate, vendor account status errors
- [ ] Reconcile first 10 Connect payments manually to verify correctness

### Phase 3 — Full Migration

- [ ] All new bookings use destination charges
- [ ] Archive manual payout workflow (keep accessible for legacy bookings)
- [ ] Update `financial_ledger` to record `stripe_transfer_id` and `connect_model`
- [ ] Final reconciliation run to confirm no orphaned balances

---

## 8. Engineering Effort Estimate

| Area | Files Changed | Estimate |
|------|--------------|----------|
| DB migration (041) | 1 new file | 2h |
| Vendor Connect onboarding UI | 2 new pages, 3 API routes | 1.5 days |
| Checkout route update | `app/api/payments/checkout/route.ts` | 4h |
| Webhook additions | `app/api/payments/webhook/route.ts` | 4h |
| Admin dashboard updates | `/admin/payouts`, `/admin/vendors` | 6h |
| Finance dashboard comments | `app/admin/finance/page.tsx` | 1h |
| Ledger updates | `lib/finance/ledger.ts` | 2h |
| Testing (manual + staging) | — | 1 day |
| **Total estimate** | | **~4–5 engineering days** |

---

## 9. Migration Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Vendor fails Stripe identity verification | High | Maintain manual payout fallback; work with vendor on alternate documentation |
| Transfer fails after payment succeeds | High | `transfer.failed` webhook + admin alert; manual transfer as fallback |
| Stripe account becomes restricted post-migration | Medium | `account.updated` webhook updates status; flag in admin dashboard |
| Partial migration — some vendors connected, some not | Medium | Dual-mode checkout logic; Connect status check before creating charge |
| Customer dispute on Connect charge | Medium | ELBOLD still controls dispute resolution; `reverse_transfer: true` on refunds |
| Stripe Express account fees | Low | £2/month per connected account; 10 vendors = £20/month; acceptable |
| Vendor withdraws Connect authorisation | Low | Stripe notifies via `account.updated`; revert that vendor to manual model |

---

## 10. Pre-Migration Checklist

Before setting `STRIPE_CONNECT_ENABLED=true`:

- [ ] All active vendors have `stripe_account_status = 'active'`
- [ ] `041_stripe_connect.sql` migration applied and verified
- [ ] `account.updated`, `transfer.created`, `transfer.failed` webhooks registered in Stripe
- [ ] Checkout route tested in staging with a real Stripe Express test account
- [ ] Refund flow tested with `reverse_transfer: true`
- [ ] Finance Dashboard updated to note ELBOLD balance = commission only (not gross GMV)
- [ ] Legal: terms of service updated to reflect automated vendor payouts
- [ ] CRON_SECRET and STRIPE_WEBHOOK_SECRET confirmed in production env vars
- [ ] Reconciliation run performed 24 hours before cutover (baseline)
- [ ] Reconciliation run performed 24 hours after cutover (verify no drift)

---

## 11. Rollback Plan

If critical issues emerge post-cutover:

1. Set `STRIPE_CONNECT_ENABLED=false` env var — immediately reverts new bookings to manual model
2. Existing Connect payments continue processing normally (cannot be reversed)
3. Run reconciliation immediately after rollback to identify any in-flight transfers
4. Contact Stripe support if transfers are stuck or accounts are suspended

---

*Document owner: ELBOLD Founder*
*Next review: At 20 active vendors or £10,000 monthly GMV, whichever comes first*
*Related: `docs/Stripe_Connect_Feasibility_Report.md`, `docs/Revenue_Reconciliation_Runbook.md`*
