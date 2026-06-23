# PHASE 70A — STRIPE CONNECT ARCHITECTURE REVIEW

**Date:** 2026-06-23  
**Status:** Architecture review only. No implementation approved.  
**Scope:** Design the Stripe Connect integration for ELBOLD without modifying any existing payment flow, database, or deployment.

---

## EXECUTIVE SUMMARY

ELBOLD currently collects customer payments centrally and records a 90/10 financial split in the ledger. Vendor payouts are manual. This document designs the transition to automated vendor payouts via Stripe Connect.

**Recommended account type: Express**  
**Primary impact surface:** `vendors`, `financial_ledger`, `payments`, checkout route, webhook handler  
**Protected invariants:** `bookings.customer_id NOT NULL`, `bookings.event_id NOT NULL`, `financial_ledger.customer_id NOT NULL`  
**Rollout model:** Feature-flagged, additive, backward-compatible

---

## SECTION 1 — CURRENT ARCHITECTURE AUDIT

### 1.1 Payment Architecture

```
Customer
  │
  ▼
POST /api/payments/checkout
  │  Creates Stripe Checkout Session (mode: payment)
  │  Stores session ID on bookings.stripe_checkout_session_id
  │  Returns checkout URL
  │
  ▼
Stripe Checkout Page
  │  Customer enters card details
  │  Payment processed by Stripe
  │
  ▼
POST /api/payments/webhook
  │  stripe.webhooks.constructEvent() — signature verified
  │  INSERT stripe_events (idempotency lock, PK unique constraint)
  │
  ├─ checkout.session.completed ──────────────────────────────────
  │    UPDATE bookings SET status=confirmed, payment_status=deposit_paid
  │    INSERT payments (type, amount, status=succeeded, stripe IDs)
  │    UPDATE invoices SET status=paid
  │    void ─► createLedgerEntry() ─► INSERT financial_ledger
  │    void ─► appendLedgerEvent() ─► INSERT financial_events
  │    RPC notify_user (customer + vendor)
  │    void ─► sendPaymentReceived (Resend)
  │    void ─► sendVendorPaymentNotification (Resend)
  │
  ├─ payment_intent.payment_failed ──────────────────────────────
  │    UPDATE payments SET status=failed
  │    void ─► updateLedgerPaymentStatus()
  │
  └─ charge.refunded ────────────────────────────────────────────
       UPDATE bookings SET payment_status=refunded
       INSERT payments (type=refund)
       void ─► updateLedgerPaymentStatus()
```

**Key constraint:** The checkout session is created without `application_fee_amount` or `transfer_data`. ELBOLD receives the full payment. The 90/10 split exists only in the `financial_ledger` table — it is a bookkeeping record, not an enforced Stripe routing instruction.

### 1.2 Financial Ledger Architecture

```
financial_ledger (Migration 040)
  id                        UUID PK
  booking_id                UUID → bookings (SET NULL on delete)
  customer_id               UUID NOT NULL → profiles
  vendor_id                 UUID NOT NULL → vendors
  stripe_payment_intent_id  TEXT
  stripe_checkout_session_id TEXT
  stripe_charge_id          TEXT
  gross_amount              DECIMAL(12,2)
  platform_commission_amount DECIMAL(12,2)   ← 10% of gross
  vendor_amount             DECIMAL(12,2)    ← 90% of gross
  refund_amount             DECIMAL(12,2)
  chargeback_amount         DECIMAL(12,2)
  currency                  TEXT (gbp)
  payment_status            TEXT (pending/paid/refunded/partially_refunded/chargeback/failed)
  payout_status             TEXT (not_due/scheduled/paid/failed)
  created_at / updated_at

financial_events (Migration 040) — append-only audit
  id, ledger_id, event_type, metadata, created_at
  [Note: table is named financial_events in migration, not financial_ledger_events]

reconciliation_runs (Migration 040)
  GMV totals, commission totals, discrepancy detection
```

**Critical gap:** `payout_status` cycles through `not_due → scheduled → paid/failed` but there is no mechanism to actually *perform* the payout. The state transitions are tracked but the transfer never happens automatically.

**Commission rate:** Hardcoded to `0.10` in `lib/finance/ledger.ts` (`commissionRate?: number, defaults to 0.10`). Not stored in database — one place to change.

### 1.3 Vendor Model

```
vendors
  id, user_id → profiles
  status:          pending | approved | rejected | suspended
  lifecycle_state: applied | under_review | approved | profile_setup |
                   verified | live | rejected | suspended
  subscription_plan: free | pro | featured | premium | elite
  verification_level: 0–4

vendor_bank_details (Migration 032) — MANUAL PAYOUT ONLY
  vendor_id (UNIQUE), account_name, sort_code, account_number
  [UK bank account for manual BACS transfer — not connected to Stripe]

vendor_verifications
  type: identity | business | insurance | portfolio | government_id |
        food_hygiene | sia_license | operator_license |
        business_registration | proof_of_address |
        bank_verification | portfolio_authenticity
  [bank_verification already anticipated but not wired to Stripe]

vendor_subscriptions
  stripe_customer_id      ← Stripe Customer ID (for subscription billing)
  stripe_subscription_id  ← Stripe Subscription ID
  [These are for SUBSCRIPTION payments, not marketplace payouts]
```

**Key observation:** `vendor_subscriptions.stripe_customer_id` is used for ELBOLD subscription revenue (vendor pays ELBOLD for their plan). This is entirely separate from the marketplace payout architecture. Do not confuse the two Stripe flows.

### 1.4 Subscription Model

Two separate Stripe flows exist (or will exist) in ELBOLD:

| Flow | Purpose | Stripe Object | Current State |
|------|---------|---------------|---------------|
| **Marketplace payment** | Customer pays for booking | Checkout Session + Payment Intent | Live |
| **Vendor subscription** | Vendor pays ELBOLD for plan | Subscription + Invoice | Live |
| **Vendor payout** (future) | ELBOLD pays vendor their 90% | Transfer to Connect account | Not implemented |

All three must coexist. Stripe Connect does not affect flows 1 or 2 — only adds flow 3.

### 1.5 Governance Model

```
proxy.ts — two-tier access:
  OS routes (pending + approved): /vendor/dashboard, /profile, etc.
  Marketplace routes (approved only): /vendor/bookings, /quotes, etc.

API gates:
  /api/vendor/profile:   pending + approved allowed
  /api/vendor/packages:  pending + approved allowed
  /api/vendor/subscription: pending BLOCKED (403)
  /api/vendor/matching:  approved ONLY

lifecycle_state transitions:
  applied → under_review → approved → profile_setup → verified → live
  (any) → rejected | suspended
```

Stripe Connect onboarding will need a new gate: **vendors cannot receive payouts until Connect account is active**, regardless of `lifecycle_state`. This is additive — it does not change existing gates.

---

## SECTION 2 — STRIPE CONNECT ACCOUNT TYPE COMPARISON

### A. Standard Accounts

Vendors create their own Stripe account and connect to ELBOLD via OAuth.

| Aspect | Detail |
|--------|--------|
| **Onboarding** | Vendor redirected to Stripe, creates their own account |
| **KYC** | Stripe handles (vendor responsible for their account) |
| **Payout control** | Vendor controls their own payout schedule |
| **ELBOLD control** | `application_fee_amount` collected per charge |
| **Vendor dashboard** | Full Stripe Dashboard (vendor sees everything) |
| **Implementation** | OAuth flow, account linking |
| **UK suitability** | Yes, but high vendor friction |

**Verdict for ELBOLD:** Inappropriate. Requires vendors to already have or create a Stripe account. High drop-off in onboarding. ELBOLD cannot delay or pause payouts. No control over vendor Stripe configuration.

---

### B. Express Accounts ← RECOMMENDED

ELBOLD creates a managed sub-account for each vendor via Stripe's hosted Express onboarding.

| Aspect | Detail |
|--------|--------|
| **Onboarding** | Stripe-hosted form, ELBOLD branded, vendor enters bank + ID |
| **KYC** | Stripe handles identity verification (not ELBOLD's legal liability) |
| **Payout control** | ELBOLD sets payout schedule; can delay, pause, adjust |
| **ELBOLD control** | `application_fee_amount` OR `transfer_data.destination` |
| **Vendor dashboard** | Stripe Express Dashboard (payouts, bank details, tax info) |
| **Implementation** | Account creation API + account link generation |
| **UK suitability** | Yes — UK bank accounts (sort codes), BACS, DAC7 support |

**Verdict for ELBOLD:** Correct choice. See Section 3.

---

### C. Custom Accounts

ELBOLD builds all onboarding, KYC, and payout UI from scratch.

| Aspect | Detail |
|--------|--------|
| **Onboarding** | Fully custom — ELBOLD must build every screen |
| **KYC** | ELBOLD responsible (AML, sanctions screening, identity checks) |
| **Payout control** | Maximum control |
| **ELBOLD control** | Full — but full legal liability |
| **Vendor dashboard** | ELBOLD must build — Stripe Express dashboard unavailable |
| **Implementation** | Extremely complex — months of compliance work |
| **UK suitability** | High FCA/MLR burden on ELBOLD |

**Verdict for ELBOLD:** Inappropriate at this stage. Custom accounts require ELBOLD to act as a payment institution, accept responsibility for KYC/AML/sanctions, and build vendor-facing financial tooling from scratch. The compliance overhead would dwarf the technical implementation.

---

## SECTION 3 — RECOMMENDATION: EXPRESS ACCOUNTS

### Why Express for ELBOLD specifically

**1. Stripe handles UK compliance.** Stripe is FCA-authorised in the UK. With Express accounts, Stripe performs KYC, AML screening, and identity verification on ELBOLD's behalf. ELBOLD is not liable for vendor identity failures. This is the correct legal posture for an early-stage marketplace.

**2. ELBOLD controls the onboarding UX.** Unlike Standard (which sends vendors to Stripe's generic account creation), Express provides a hosted form that ELBOLD initiates programmatically. The vendor experience is `→ elbold.com/vendor/payouts/setup → Stripe Express form → return to elbold.com`. Stripe branding is secondary; ELBOLD is the primary context.

**3. Payout schedule control.** ELBOLD can set the payout interval for all Express accounts (T+7, T+14, etc.). This protects against disputes — holding vendor funds for 7 days post-event gives time to handle chargebacks before releasing vendor payment.

**4. Automatic application fee routing.** When a checkout session includes `application_fee_amount`, Stripe routes the platform commission to ELBOLD's account automatically, then transfers the remainder to the vendor's Express account. No manual reconciliation.

**5. Vendor Express Dashboard.** Vendors access a Stripe-hosted dashboard to view their payouts, update bank details, and download tax documents. ELBOLD does not build this. Vendor support burden for payout queries is reduced.

**6. DAC7 compliance.** The UK's DAC7 regulations (Digital Platform Reporting — effective 2024) require marketplaces to report vendor earnings to HMRC. Stripe handles DAC7 reporting for Express accounts connected to ELBOLD.

**7. Proportionate complexity.** Express is significantly simpler to implement than Custom and gives ELBOLD all necessary controls. The trade-off of some UI flexibility for compliance coverage is correct for a marketplace at this stage.

---

## SECTION 4 — VENDOR JOURNEY (FUTURE STATE)

```
VENDOR APPLY
  │  POST /api/vendor/apply
  │  vendors.status = 'pending'
  │  vendors.lifecycle_state = 'applied'
  │
  ▼
ADMIN APPROVAL
  │  Admin reviews application
  │  PATCH /api/admin/vendors/{id}/approve
  │  vendors.status = 'approved'
  │  vendors.lifecycle_state = 'approved'
  │
  ▼  [CURRENT: vendor is now fully operational]
  │  [FUTURE: payout setup becomes available, but not required to receive quotes]
  │
  ▼
STRIPE CONNECT PROMPT  [NEW]
  │  /vendor/dashboard shows payout setup banner
  │  "Set up payouts to receive earnings automatically"
  │  Until Connect is active: payout_status stays 'not_due' on all bookings
  │
  ▼
CONNECT ONBOARDING  [NEW]
  │  Vendor clicks "Set up payouts"
  │  POST /api/vendor/connect/onboard
  │    ├─ stripe.accounts.create({ type: 'express', country: 'GB', ... })
  │    ├─ vendors.stripe_connect_account_id = 'acct_xxx'
  │    ├─ vendors.stripe_connect_status = 'pending'
  │    └─ INSERT vendor_connect_onboarding (status: 'created')
  │
  ▼
STRIPE EXPRESS FORM  [STRIPE-HOSTED]
  │  stripe.accountLinks.create({ type: 'account_onboarding' })
  │  Vendor fills in:
  │    - Business details (sole trader / company)
  │    - Personal identity (name, DOB, address)
  │    - Government ID (Stripe handles verification)
  │    - UK bank account (sort code + account number)
  │  KYC performed by Stripe
  │
  ▼
ACCOUNT ACTIVATED  [NEW WEBHOOK: account.updated]
  │  stripe_connect_payouts_enabled = true
  │  stripe_connect_charges_enabled = true
  │  vendors.stripe_connect_status = 'active'
  │  vendors.lifecycle_state can advance to 'payout_ready'  [new state]
  │  INSERT financial_events (CONNECT_ACCOUNT_ACTIVATED)
  │
  ▼
ELIGIBLE FOR AUTOMATED PAYOUTS  [NEW]
  │  All future bookings: checkout session includes
  │    application_fee_amount = platform_commission * 100 (pence)
  │    transfer_data.destination = vendors.stripe_connect_account_id
  │  On payment:
  │    Stripe routes platform_commission to ELBOLD
  │    Stripe routes vendor_amount to vendor's Express account
  │    financial_ledger.stripe_transfer_id recorded
  │    financial_ledger.payout_status = 'scheduled'
  │
  ▼
VENDOR BANK PAYOUT  [AUTOMATIC]
  │  Per payout schedule (e.g. T+7 from event date)
  │  Stripe sends BACS transfer to vendor's bank account
  │  payout.paid webhook received
  │  financial_ledger.payout_status = 'paid'
  │  financial_ledger.payout_completed_at = NOW()
  │  INSERT financial_events (PAYOUT_COMPLETED)
  │  notify_user (vendor): "Your payout of £X has been sent"

PAYOUT FAILURE  [NEW WEBHOOK: payout.failed]
  │  financial_ledger.payout_status = 'failed'
  │  INSERT financial_events (PAYOUT_FAILED)
  │  notify_user (vendor): "Payout failed — please update bank details"
  │  ELBOLD admin alerted
```

### States: `stripe_connect_status` on `vendors`

| Value | Meaning |
|-------|---------|
| `null` | Connect not initiated |
| `pending` | Account created, onboarding link issued, form not complete |
| `restricted` | Stripe has questions — additional requirements needed |
| `active` | Fully onboarded — payouts enabled, charges enabled |
| `disabled` | Stripe or ELBOLD has disabled the account |

### New `lifecycle_state` value

Add `payout_ready` to the existing lifecycle_state check constraint:

```
applied → under_review → approved → profile_setup → verified → live → payout_ready
```

`payout_ready` = verified identity, Stripe Connect active, eligible for automated payout. This state is optional — vendors can trade and take bookings without it. It unlocks automated transfer routing only.

---

## SECTION 5 — DATA MODEL REVIEW

### 5.1 New Fields Required: `vendors` table

```sql
-- All additive, no existing column changes
ALTER TABLE vendors
  ADD COLUMN stripe_connect_account_id TEXT UNIQUE,     -- 'acct_xxx'
  ADD COLUMN stripe_connect_status TEXT                 -- null | pending | restricted | active | disabled
    CHECK (stripe_connect_status IN ('pending','restricted','active','disabled')),
  ADD COLUMN stripe_connect_details_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN stripe_connect_charges_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN stripe_connect_payouts_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN stripe_connect_onboarded_at      TIMESTAMPTZ,
  ADD COLUMN stripe_connect_requirements      JSONB;    -- currently_due, past_due, pending_verification
```

**Risk:** Low. All additive. Nullable by default. No existing constraint touched.

### 5.2 New Table Required: `vendor_connect_onboarding`

```sql
CREATE TABLE vendor_connect_onboarding (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id         UUID        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  stripe_account_id TEXT        NOT NULL,                -- acct_xxx (mirrors vendors.stripe_connect_account_id)
  onboarding_url    TEXT,                                -- Stripe AccountLink URL (expires in 5 min)
  onboarding_url_expires_at TIMESTAMPTZ,
  refresh_url       TEXT NOT NULL,                       -- where Stripe sends vendor if link expired
  return_url        TEXT NOT NULL,                       -- where Stripe sends vendor on completion
  status            TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created','link_generated','submitted','completed','failed')),
  requirements      JSONB,                               -- snapshot of account.requirements at each update
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Tracks each onboarding attempt. A vendor may start, abandon, and restart. Each restart generates a new AccountLink. The table gives ELBOLD admin visibility into where vendors are in the process.

**Risk:** Low. New table, no existing table modified.

### 5.3 New Fields Required: `financial_ledger`

```sql
ALTER TABLE financial_ledger
  ADD COLUMN stripe_transfer_id       TEXT,   -- 'tr_xxx' — the Connect transfer to vendor account
  ADD COLUMN stripe_application_fee_id TEXT,  -- 'fee_xxx' — the platform fee object
  ADD COLUMN connect_account_id       TEXT,   -- denormalized acct_xxx for reconciliation
  ADD COLUMN payout_scheduled_at      TIMESTAMPTZ,
  ADD COLUMN payout_completed_at      TIMESTAMPTZ;
```

**Risk:** Low. All nullable additions. No constraint changes. Existing rows remain valid.

### 5.4 `financial_events` — New Event Types

Extend the `CHECK` constraint on `event_type`:

```sql
-- Add to existing enum (current values preserved):
'CONNECT_ACCOUNT_CREATED',
'CONNECT_ACCOUNT_ACTIVATED',
'CONNECT_ACCOUNT_RESTRICTED',
'CONNECT_ACCOUNT_DISABLED',
'TRANSFER_CREATED',
'TRANSFER_REVERSED',
'PAYOUT_COMPLETED',
'PAYOUT_FAILED',
'REQUIREMENT_UPDATED'
```

**Risk:** Low. The `CHECK` constraint on `financial_events.event_type` is additive — existing values remain valid. Migration must be applied before new event types are written.

### 5.5 `lifecycle_state` — New Value

Extend the `CHECK` constraint on `vendors.lifecycle_state`:

```sql
-- Add 'payout_ready' to existing set
CHECK (lifecycle_state IN (
  'applied', 'under_review', 'approved', 'profile_setup',
  'verified', 'live', 'payout_ready',        -- NEW
  'rejected', 'suspended'
))
```

**Risk:** Low. Additive. Existing rows unaffected. Trigger `sync_vendor_lifecycle_state` does not reference `payout_ready` — needs no change unless auto-transition is desired.

### 5.6 Existing Tables — Impact Summary

| Table | Impact | Risk |
|-------|--------|------|
| `vendors` | New columns (stripe_connect_*) | Low |
| `financial_ledger` | New columns (transfer_id, fee_id, etc.) | Low |
| `financial_events` | New event type values in CHECK | Low |
| `bookings` | **No changes** | None |
| `payments` | No changes — Stripe IDs already captured | None |
| `vendor_bank_details` | Preserved as legacy/fallback — no changes | None |
| `vendor_subscriptions` | No changes — separate Stripe flow | None |
| `stripe_events` | No changes — idempotency table | None |

### 5.7 Protected Constraints — Confirmed Intact

| Constraint | Protection | Change Required |
|------------|-----------|-----------------|
| `bookings.customer_id NOT NULL` | Customer cannot be stripped from booking | None |
| `bookings.event_id NOT NULL` | Event cannot be stripped from booking | None |
| `financial_ledger.customer_id NOT NULL` | Ledger entry always tied to a customer | None |
| `financial_ledger.vendor_id NOT NULL` | Ledger entry always tied to a vendor | None |

No nullable recommendation is made for any of these columns.

---

## SECTION 6 — CHECKOUT FLOW CHANGES (FUTURE STATE)

### Current checkout session creation

```typescript
// Current (lib/stripe.ts + /api/payments/checkout/route.ts)
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [...],
  metadata: { booking_id, customer_id, payment_type, amount },
  payment_intent_data: { metadata: {...} },
  success_url, cancel_url,
  customer_email,
});
// ELBOLD receives full payment. No routing to vendor.
```

### Future checkout session creation (Connect-enabled)

```typescript
// Future — conditional on vendor having active Connect account
const isConnectActive = vendor.stripe_connect_status === 'active'
  && vendor.stripe_connect_payouts_enabled
  && vendor.stripe_connect_account_id;

const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [...],
  metadata: { booking_id, customer_id, payment_type, amount },
  payment_intent_data: {
    metadata: { booking_id, customer_id, payment_type, amount },
    // Only when Connect is active:
    ...(isConnectActive ? {
      application_fee_amount: Math.round(commissionAmount * 100), // pence
      transfer_data: {
        destination: vendor.stripe_connect_account_id, // 'acct_xxx'
      },
    } : {}),
  },
  success_url, cancel_url,
  customer_email,
});
```

**Key design decision:** The Connect routing is conditional per-booking based on the vendor's Connect status at the time of checkout. This allows:
- Vendors without Connect: payment collected by ELBOLD, manual payout (current behaviour preserved)
- Vendors with Connect: automatic routing

This means the platform continues working for all vendors during the Connect rollout period.

### Webhook changes for Connect payments

When `transfer_data.destination` is set, the `checkout.session.completed` event includes:
- `session.payment_intent` — the Payment Intent ID
- The PaymentIntent will have `transfer_data.destination` set

On `checkout.session.completed`, additionally:
```typescript
// New: capture Connect transfer details if present
if (session.payment_intent) {
  const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string);
  if (pi.transfer_data?.destination) {
    // Update ledger with transfer info
    await supabase.from('financial_ledger').update({
      stripe_transfer_id: pi.latest_charge, // charge triggers transfer
      connect_account_id: pi.transfer_data.destination,
      payout_status: 'scheduled',
      payout_scheduled_at: new Date().toISOString(),
    }).eq('booking_id', bookingId);
  }
}
```

**New webhook events to handle:**

```
account.updated
  → When vendor completes onboarding or Stripe updates requirements
  → UPDATE vendors SET stripe_connect_status, charges_enabled, payouts_enabled, requirements
  → If newly active: INSERT financial_events (CONNECT_ACCOUNT_ACTIVATED)

transfer.created
  → When Stripe creates transfer to vendor's Express account
  → UPDATE financial_ledger SET stripe_transfer_id, payout_status='scheduled'

payout.paid  (fires on vendor's connected account — requires Connect webhook endpoint)
  → When vendor's bank payout completes
  → UPDATE financial_ledger SET payout_status='paid', payout_completed_at
  → INSERT financial_events (PAYOUT_COMPLETED)
  → notify_user (vendor)

payout.failed
  → UPDATE financial_ledger SET payout_status='failed'
  → INSERT financial_events (PAYOUT_FAILED)
  → notify_user (vendor) + admin alert
```

**Note:** `payout.paid` and `payout.failed` fire on the **connected account**, not the ELBOLD platform account. The Stripe webhook endpoint must be configured with `connect: true` to receive events from connected accounts. This requires a separate webhook listener or extending the existing one.

---

## SECTION 7 — MIGRATION RISK ASSESSMENT

### Low Risk

| Change | Why Low Risk |
|--------|-------------|
| Add `stripe_connect_*` columns to `vendors` | Nullable. No existing logic reads these columns. No constraint change. |
| Create `vendor_connect_onboarding` table | New table. Zero FK impact on existing tables. |
| Add columns to `financial_ledger` | Nullable. Existing rows remain valid. Existing reads unaffected. |
| Extend `financial_events.event_type` CHECK | Additive. Old values still valid. |
| Extend `vendors.lifecycle_state` CHECK | Additive. Old values still valid. Trigger unaffected. |
| New API routes (`/api/vendor/connect/*`) | Additive. No existing routes modified. |
| New webhook events (`account.updated`, etc.) | Additive. Existing event handlers unchanged. |

### Medium Risk

| Change | Why Medium Risk | Mitigation |
|--------|----------------|------------|
| Conditional `application_fee_amount` in checkout | Changes Stripe payment object structure for Connect-enabled vendors. Wrong amount = revenue error. | Gate strictly on `stripe_connect_status === 'active'`. Integration test required. |
| Connect webhook endpoint (`connect: true`) | All connected account events route through this endpoint. Must handle gracefully for unknown accounts. | Idempotency via `stripe_events` table. Return 200 for unknown events. |
| `payout_status` state machine | Adding `scheduled → paid/failed` transitions via webhooks. Race conditions possible if Stripe sends events out of order. | Idempotency check. Use `UPDATE ... WHERE payout_status != 'paid'` to prevent regression. |
| Commission rate in checkout session | `application_fee_amount` calculated from `commissionRate` (hardcoded 0.10). If rate changes, both ledger AND Stripe fee must be in sync. | Store `commission_rate` on `financial_ledger` row so reconciliation can verify. |

### High Risk

| Change | Why High Risk | Mitigation |
|--------|--------------|------------|
| Stripe Connect configuration in Dashboard | Must enable Connect in Stripe live-mode Dashboard. Connect settings (payout schedule, platform controls, KYC requirements) are account-level changes. Misconfiguration affects all vendors. | Configure in test mode first. Document every Dashboard setting explicitly before live mode. |
| Payout delay configuration | ELBOLD must set minimum payout delay via Stripe Dashboard (Platform settings → Payout schedule). Too short = vendor paid before chargeback window. Too long = vendor dissatisfied. | Recommended: 7-day delay minimum. Set at platform level, not per-account. |
| Existing vendor migration to Connect | Vendors with existing `vendor_bank_details` (manual bank records) need a migration path. Their existing bookings/payouts are not in Stripe. | Do not migrate historical bookings. Only new bookings after Connect activation route via Stripe. Existing `vendor_bank_details` remains for reference. |
| Live-mode Express onboarding | KYC rejection or account restriction by Stripe is out of ELBOLD's control. A vendor may be rejected by Stripe even if ELBOLD approved them. | Design onboarding to handle `requirements.disabled_reason`. Notify vendor. Keep manual payout path open as fallback. |

---

## SECTION 8 — COMPLIANCE REVIEW

### UK Marketplace Obligations

| Regulation | Requirement | How Stripe Connect Addresses It |
|------------|-------------|--------------------------------|
| **Money Laundering Regulations 2017 (MLR)** | Customer Due Diligence (CDD) on vendors — verify identity before processing payments | Stripe performs KYC on Express account creation. ELBOLD is not the regulated entity for KYC. |
| **Payment Services Regulations 2017 (PSR)** | ELBOLD as payment initiator must ensure funds reach the correct recipient | Stripe Connect routing provides a verifiable audit trail. `transfer_data.destination` is cryptographically linked to the verified vendor. |
| **DAC7 / UK Digital Platform Reporting** | Platforms must report vendor earnings to HMRC from Jan 2024 | Stripe handles DAC7 reporting for Express accounts. ELBOLD must register as a reporting platform and enable Stripe's DAC7 module. |
| **GDPR / UK GDPR** | Financial data is personal data. Retention limits apply. | `financial_ledger` already has RLS. Stripe stores identity data for Express accounts — ELBOLD does not hold raw KYC documents. |
| **Pensions Act / IR35** | Some event vendors are sole traders. Platform must not create employment relationship. | Stripe Connect Express does not create employment. Platform terms should confirm vendor independence. |

### Stripe Connect Requirements

| Requirement | ELBOLD Impact |
|-------------|--------------|
| Stripe Connect application approval | Must submit Connect application to Stripe (business details, use case, payout schedule) before going live |
| Platform agreement | Accept Stripe Connect Platform Agreement |
| Payout controls | Must configure platform-level payout schedule (recommended: manual or T+7) |
| `account.updated` handling | Must process `requirements.currently_due` — if vendor has outstanding requirements, charges must be paused |
| Reserve capability | Optional: platform can hold a percentage of vendor funds in reserve for chargeback coverage |

### KYC/Identity Verification

With Express accounts, Stripe performs the following verifications on vendors:
- Personal identity (name, DOB, last 4 of National Insurance number for UK)
- Address verification
- Government ID (passport or driving licence — optional depending on risk tier)
- Bank account verification (micro-deposit or immediate verification via Open Banking)

ELBOLD's existing `vendor_verifications` table (identity, business, proof_of_address types) duplicates some of this. Design decision:

- Keep ELBOLD's application-layer verification for **marketplace trust** (portfolio authenticity, insurance, SIA license)
- Delegate **financial identity verification** to Stripe
- Do not attempt to synchronise the two systems — they serve different purposes

### Payout Controls

Recommended platform-level payout configuration:

| Setting | Recommended Value | Rationale |
|---------|------------------|-----------|
| Default payout schedule | Manual (ELBOLD triggers payouts) | Maximum control during initial rollout |
| Minimum payout delay | 7 days post-charge | Covers Stripe's 7-day chargeback window |
| Reserve | 0% initially | Revisit after chargeback data available |
| Countries | UK only (GB) | Current market scope |
| Currencies | GBP only | Current payment currency |

After rollout stabilises, switch to automatic T+7 weekly payout schedule.

---

## SECTION 9 — NEW API SURFACE

### Routes to create (new — no existing routes modified)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/vendor/connect/onboard` | POST | Create Express account + generate onboarding link |
| `/api/vendor/connect/status` | GET | Return vendor's Connect account status and requirements |
| `/api/vendor/connect/refresh` | POST | Generate new onboarding link if prior link expired |
| `/api/vendor/connect/dashboard` | POST | Generate Stripe Express Dashboard login link |

### Webhook additions (extend existing handler)

| Event | Source | Purpose |
|-------|--------|---------|
| `account.updated` | Platform + Connect | Sync `stripe_connect_status`, requirements |
| `transfer.created` | Connect | Record `stripe_transfer_id` on ledger |
| `payout.paid` | Connect accounts | Mark `payout_status = 'paid'` |
| `payout.failed` | Connect accounts | Mark `payout_status = 'failed'`, alert |

**Important:** Connect account events require the webhook listener to be configured with `connect: true` in Stripe Dashboard, and the handler must check `event.account` to identify which vendor's account the event belongs to.

---

## SECTION 10 — ROLLOUT STRATEGY

### Phase Structure

```
Phase 70A  Architecture review (current document)
Phase 70B  Database migrations (additive only, no behavior change)
           ─ vendors: stripe_connect_* columns
           ─ Create vendor_connect_onboarding table
           ─ financial_ledger: transfer/fee columns
           ─ financial_events: new event type values
           ─ lifecycle_state: payout_ready value
Phase 70C  Connect account creation API
           ─ POST /api/vendor/connect/onboard
           ─ GET /api/vendor/connect/status
           ─ POST /api/vendor/connect/refresh
           ─ POST /api/vendor/connect/dashboard
           ─ Test in Stripe test mode only
Phase 70D  account.updated webhook handler
           ─ Extend existing webhook route
           ─ Handle requirements, status sync
           ─ Test with Stripe CLI event forwarding
Phase 70E  Vendor payout setup UI
           ─ /vendor/payouts page: status, setup CTA
           ─ Onboarding return/refresh URL handling
Phase 70F  Conditional payment routing
           ─ application_fee_amount + transfer_data in checkout
           ─ Feature-flagged: STRIPE_CONNECT_ROUTING_ENABLED
           ─ Test in Stripe test mode with test Connect accounts
Phase 70G  Payout webhook handlers
           ─ transfer.created, payout.paid, payout.failed
           ─ Ledger updates, notifications
Phase 70H  Stripe Dashboard + KYC review
           ─ Submit Connect application to Stripe
           ─ Configure payout schedule
           ─ Go-live sign-off
Phase 70I  Live mode rollout
           ─ Feature flag ON for new vendor approvals
           ─ Existing vendors: opt-in via /vendor/payouts
```

### Feature Flag Design

```
STRIPE_CONNECT_ENABLED=true          // Master gate: Connect APIs available
STRIPE_CONNECT_ROUTING_ENABLED=true  // Payment routing active (Phase 70F+)
```

When `STRIPE_CONNECT_ROUTING_ENABLED=false`:
- Connect onboarding available (vendors can set up accounts)
- Checkout route does NOT include `application_fee_amount`/`transfer_data`
- Financial ledger records split but payout is manual
- Current production behaviour exactly preserved

---

## SECTION 11 — ROLLBACK STRATEGY

### Per-phase rollback

| Phase | Rollback Action |
|-------|----------------|
| 70B (migrations) | New columns are nullable. No rollback needed — columns are ignored by existing code. |
| 70C (Connect API) | Delete new routes. `stripe_connect_account_id` columns remain but unused. |
| 70D (webhook) | Remove new event handlers from webhook route. Unrecognised event types return 200 silently. |
| 70F (routing) | Set `STRIPE_CONNECT_ROUTING_ENABLED=false`. Checkout immediately reverts to current behaviour. No DB change needed. |

### Rollback invariants

1. `vendor_bank_details` is never deleted — manual payout path remains as permanent fallback.
2. The existing webhook handler always works for non-Connect payments — conditional routing cannot break standard payments.
3. Feature flag `STRIPE_CONNECT_ROUTING_ENABLED=false` is the instant kill switch for all routing logic.
4. No existing booking, financial ledger entry, or payment record is modified by Connect rollout.

### Stripe-level rollback

If Stripe Connect must be deactivated:
- Set `STRIPE_CONNECT_ROUTING_ENABLED=false` immediately
- New checkouts revert to standard (ELBOLD receives full payment)
- In-flight transfers: contact Stripe to reverse if required
- Ledger entries with `payout_status = 'scheduled'` must be reviewed manually

---

## SECTION 12 — ARCHITECTURE DIAGRAMS

### Current State

```
┌─────────────────────────────────────────────────────────────┐
│                         ELBOLD                              │
│                                                             │
│  Customer ──► Checkout ──► Stripe (receives £100)           │
│                              │                              │
│                              ▼                              │
│                         Webhook fires                       │
│                              │                              │
│                              ▼                              │
│                    financial_ledger                         │
│                    gross: £100                              │
│                    platform: £10  ─► ELBOLD account         │
│                    vendor:   £90  ─► [MANUAL PAYOUT ONLY]   │
│                                       ↓                     │
│                              vendor_bank_details            │
│                              (sort_code, account_number)    │
│                              Payout: manual bank transfer   │
└─────────────────────────────────────────────────────────────┘
```

### Future State (Stripe Connect)

```
┌─────────────────────────────────────────────────────────────┐
│                         ELBOLD                              │
│                                                             │
│  Customer ──► Checkout ──► Stripe                          │
│                (application_fee: £10) │                    │
│                (transfer to acct_xxx) │                    │
│                              │                              │
│                    ┌─────────┴─────────┐                   │
│                    ▼                   ▼                    │
│               ELBOLD account    Vendor Express Account      │
│               receives £10      receives £90                │
│                    │                   │                    │
│                    ▼                   ▼                    │
│              platform_stats     BACS payout (T+7)           │
│              revenue tracking   → vendor's bank account     │
│                                                             │
│  Webhook flow:                                              │
│    checkout.session.completed                               │
│      → bookings: confirmed                                  │
│      → payments: deposit record                             │
│      → financial_ledger: stripe_transfer_id recorded        │
│                           payout_status: scheduled          │
│    payout.paid                                              │
│      → financial_ledger: payout_status: paid                │
│                           payout_completed_at: timestamp    │
│      → notify_user: "Your £90 payout has been sent"         │
└─────────────────────────────────────────────────────────────┘
```

### Vendor Stripe Account Topology

```
ELBOLD Stripe Platform Account (sk_live_...)
  │
  ├── Vendor A Express Account (acct_abc123)
  │     bank: NatWest sort_code 60-00-01, acc 12345678
  │     payouts_enabled: true
  │
  ├── Vendor B Express Account (acct_def456)
  │     bank: Barclays sort_code 20-00-00, acc 87654321
  │     payouts_enabled: true
  │
  ├── Vendor C Express Account (acct_ghi789)
  │     status: restricted (requirements pending)
  │     payouts_enabled: false → MANUAL PAYOUT FALLBACK
  │
  └── Vendor D (no Connect account)
        vendor_bank_details: sort_code 30-00-02
        payouts_enabled: false → MANUAL PAYOUT FALLBACK
```

---

## SECTION 13 — OPEN QUESTIONS (FOR DESIGN SIGN-OFF)

Before Phase 70B implementation begins, the following decisions should be confirmed:

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Is Connect onboarding mandatory for new approved vendors? | A) Optional (can still take bookings) B) Required (blocked until setup) | **A — Optional.** Revenue risk if mandatory blocks vendors. |
| 2 | What is the payout delay? | A) Immediate (T+0) B) T+7 C) T+14 D) Event date + 7 | **D — Event date + 7.** Chargeback window aligned to event. |
| 3 | Commission rate stored where? | A) Hardcoded (current) B) Per-vendor in DB C) Per-platform in DB | **C — Per-platform.** Store on `financial_ledger` row at booking time. |
| 4 | Existing vendor migration path? | A) Force re-onboard to Connect B) Keep manual forever C) Opt-in migration | **C — Opt-in.** No forced migration. Legacy manual path preserved. |
| 5 | Payout trigger mechanism? | A) Automatic schedule via Stripe B) Manual via admin API C) Automatic on event completion date + delay | **A — Automatic.** Configure at platform level in Stripe Dashboard. Reduces operational load. |
| 6 | Reserve percentage? | A) 0% B) 5% C) 10% | **A — 0% initially.** Revisit after 3 months of live data. |

---

## SUMMARY

| Section | Decision |
|---------|----------|
| Account type | **Express** — Stripe handles KYC, ELBOLD controls schedule |
| New tables | `vendor_connect_onboarding` |
| Modified tables | `vendors` (+7 columns), `financial_ledger` (+5 columns) |
| Extended constraints | `financial_events.event_type`, `vendors.lifecycle_state` |
| Protected columns | `bookings.customer_id`, `bookings.event_id`, `financial_ledger.customer_id` — zero changes |
| Rollback mechanism | `STRIPE_CONNECT_ROUTING_ENABLED=false` env flag — instant revert |
| Backward compatibility | All changes additive. Manual payout path (`vendor_bank_details`) preserved permanently as fallback |
| Phase 70B readiness | Ready to implement migrations. No open blockers. |

---

*Phase 70A complete. No code has been written. No deployment has occurred. No existing payment flow has been modified.*

*Phase 70B (database migrations) requires explicit approval before proceeding.*
