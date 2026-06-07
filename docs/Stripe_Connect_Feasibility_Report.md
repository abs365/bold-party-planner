# Stripe Connect Feasibility Report

**Author:** Revenue Integrity Audit  
**Date:** 2026-06-06  
**Status:** Assessment — Not yet implemented  
**Scope:** Full evaluation of replacing ELBOLD's direct-charge model with Stripe Connect

---

## Executive Summary

ELBOLD currently operates as a **direct payment intermediary**: customer money flows into ELBOLD's Stripe account, and vendors are paid via manual bank transfer. This model is operable at pilot scale (5–20 vendors) but creates measurable compliance exposure, operational fragility, and trust risk at scale.

**Recommendation: Plan Stripe Connect migration before exceeding 20 active vendors, 50 transactions, or £10,000 cumulative GMV. Run a constrained direct-model pilot now and migrate before significant scale.**

---

## Section 1 — Current Architecture

```
Customer (£500 deposit)
    │
    ▼ Stripe Checkout → ELBOLD Stripe Account
                              │
                              ├─ ELBOLD retains: £50 (10% commission)
                              │
                              └─ Vendor owes: £450 (90% payout)
                                    │
                                    ▼ Manual bank transfer (no automation)
                                  Vendor Bank Account
```

**Problems with this model:**
1. ELBOLD holds vendor money (£450) in its Stripe account after every payment
2. Manual transfer is error-prone and creates outstanding liability
3. ELBOLD is legally a payment intermediary — FCA Payment Services Regulations 2017 may apply
4. If ELBOLD Stripe account is frozen or disputed, vendor money is frozen
5. No automated proof of payout; vendor must trust ELBOLD

---

## Section 2 — Stripe Connect Architecture

### Option A: Destination Charges (Recommended)

```
Customer (£500 deposit)
    │
    ▼ Stripe Checkout
    │
    ├─ ELBOLD application_fee_amount: £50 → ELBOLD Stripe Account
    │
    └─ £450 → Vendor's Connected Stripe Account (automatic)
              │
              └─ Stripe auto-pays out to vendor bank on their payout schedule
```

**Mechanics:**
- Customer pays once: a single Stripe Checkout session
- ELBOLD sets `application_fee_amount = total * 0.10` on the PaymentIntent
- Stripe routes the commission to ELBOLD automatically
- Stripe routes the vendor share to the vendor's connected account automatically
- ELBOLD never holds vendor money at any point
- Vendor receives a Stripe dashboard showing all their payments

### Option B: Separate Charges and Transfers

```
Customer (£500 deposit)
    │
    ▼ Stripe Charge → ELBOLD Account (full £500)
                            │
                            └─ stripe.transfers.create(£450 → vendor)
```

**Not recommended** — still passes funds through ELBOLD, creating a holding period.

### Option C: Payment Intents with on_behalf_of

Similar to Option A but with the vendor as the settlement entity from the start. Useful if vendors want the payment to appear on their statement as "from [Customer] to [Vendor]". Slightly more complex implementation.

---

## Section 3 — Scenario Analysis

### 3A — Customer Protection Scenarios

**Scenario: Vendor disappears before the event**

Current model:
- ELBOLD holds the deposit in its Stripe account
- If ELBOLD processes a refund, the money comes from ELBOLD's Stripe balance
- Risk: if ELBOLD's Stripe balance is low, refund may be delayed or fail

Stripe Connect model:
- The deposit lives in the vendor's connected Stripe account
- A refund reverses the charge and claws back from the vendor's connected account
- If vendor's balance is insufficient, ELBOLD's platform account covers it (per Stripe's liability model)
- Result: cleaner refund path, same economic exposure for ELBOLD, better auditable trail

**Scenario: Vendor cancels the booking**

Current model:
- Admin manually issues Stripe refund from dashboard
- Manual bank transfer payout must be clawed back (impossible once sent)
- No automated refund trigger

Stripe Connect model:
- `stripe.refunds.create({ charge: chargeId })` is called from code
- Stripe automatically reverses the vendor's share via clawback from their connected account
- ELBOLD's commission can optionally be returned or retained (configurable)
- Full automation possible

**Scenario: Customer requests a refund**

Current model:
- If vendor has already been paid manually, the money is gone
- ELBOLD must chase vendor for the refund via bank transfer
- Operational nightmare at scale

Stripe Connect model:
- `stripe.refunds.create({ charge: chargeId, refund_application_fee: true, reverse_transfer: true })`
- Stripe automatically pulls money from vendor's connected account
- No manual chasing required

**Scenario: Chargeback (customer disputes with bank)**

Current model:
- Chargeback debits ELBOLD's Stripe account (the full amount + £15 dispute fee)
- If vendor has been paid manually, ELBOLD absorbs the loss entirely
- ELBOLD must pursue vendor via contract or legal action

Stripe Connect model:
- With `reverse_transfer: true`, Stripe can claw back the vendor's share on chargeback
- ELBOLD still absorbs the chargeback fee (£15)
- Vendor's connected account is debited for their share
- Significantly reduces ELBOLD's chargeback exposure

**Scenario: Customer requests refund after event**

Both models: this is a policy decision, not a technical one. ELBOLD's refund policy must be communicated at checkout. Stripe can enforce time-based refund restrictions.

---

### 3B — Vendor Protection Scenarios

**Scenario: Customer disputes a legitimate payment**

Current model:
- Dispute debits ELBOLD's account
- ELBOLD decides whether to fight the dispute
- Vendor has no visibility into the dispute process

Stripe Connect model:
- Dispute appears in vendor's connected Stripe dashboard
- Vendor can submit evidence directly through Stripe (or via ELBOLD's platform)
- ELBOLD can configure whether the platform or the vendor bears dispute liability
- Vendor has full transaction history in their own Stripe account

**Scenario: Customer cancels after vendor has prepared**

Both models: this is a contractual/policy issue. Stripe Connect doesn't change who gets the money when a cancellation policy allows partial retention.

**Scenario: Fraudulent booking (bot or stolen card)**

Current model:
- ELBOLD Stripe account absorbs the fraud
- Vendor may have prepared for a fake event

Stripe Connect model:
- Same exposure — the charge goes through before fraud is detected
- However, Stripe Radar (fraud detection) is available at the platform level with Connect

---

### 3C — ELBOLD Protection Scenarios

**Scenario: Large payment volume arrives (e.g., £50,000 wedding)**

Current model:
- £50,000 lands in ELBOLD's Stripe account
- ELBOLD holds £45,000 of vendor money
- Stripe may flag the account for enhanced verification or hold funds
- If Stripe places a hold, vendor payment is delayed

Stripe Connect model:
- £45,000 routes directly to vendor's connected account
- £5,000 (10%) routes to ELBOLD's platform account
- ELBOLD never holds more than its own commission
- No Stripe hold risk for vendor funds

**Scenario: Vendor requests payout immediately**

Current model:
- Admin must manually process the bank transfer
- No SLA, no automation, vendor trust depends on operational reliability

Stripe Connect model:
- Vendor funds are already in their connected Stripe account
- Stripe's standard payout schedule (T+2 for UK banks) applies automatically
- ELBOLD has no action to take

**Scenario: FCA investigates ELBOLD**

Current model:
- ELBOLD holds client money → likely caught by Payment Services Regulations 2017
- Without authorisation as a Payment Institution, ELBOLD may be operating illegally at scale

Stripe Connect model:
- ELBOLD never holds client money (only its own commission)
- Stripe is the authorised Payment Institution
- ELBOLD acts as a "platform" — a commercial agent of the payer
- Significantly reduced FCA exposure (see Marketplace Compliance Assessment)

**Scenario: Stripe requests compliance review**

Current model:
- Stripe may request business verification, explanation of fund flows, or impose enhanced due diligence
- Operating as an unlicensed payment intermediary at scale is a risk factor

Stripe Connect model:
- Stripe explicitly supports marketplace platforms with Connect
- ELBOLD's role is well-defined as a platform collecting application fees
- Standard Stripe platform compliance applies

---

## Section 4 — Implementation Scope

### Onboarding vendors with Stripe Connect

Each vendor must complete Stripe's KYC (Know Your Customer) onboarding. This is done via Stripe's hosted onboarding flow:

```typescript
// Create a connected account for the vendor
const account = await stripe.accounts.create({
  type: "express",          // Stripe-hosted onboarding
  country: "GB",
  capabilities: {
    card_payments: { requested: true },
    transfers:     { requested: true },
  },
});

// Save account.id to vendors.stripe_connect_account_id

// Generate onboarding link
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: `${appUrl}/vendor/connect/refresh`,
  return_url:  `${appUrl}/vendor/connect/return`,
  type: "account_onboarding",
});

// Redirect vendor to accountLink.url
```

Express accounts (recommended for ELBOLD):
- Stripe hosts the entire onboarding experience (no custom KYC UI needed)
- Vendor provides: name, email, bank account, UK business registration (if applicable)
- Takes 5–10 minutes for vendor
- ELBOLD has no liability for KYC compliance — that is Stripe's responsibility

### Payment flow change

```typescript
// Current: direct charge to ELBOLD
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  // ... no Connect
});

// Connect: destination charge with application fee
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  payment_intent_data: {
    application_fee_amount: Math.round(amount * 100 * 0.10),  // 10% commission in pence
    transfer_data: {
      destination: vendor.stripe_connect_account_id,           // vendor's connected account
    },
    metadata: { booking_id, customer_id, payment_type, amount },
  },
  // ... rest of session config
});
```

### Database changes required

```sql
-- Add Stripe Connect account ID to vendors
ALTER TABLE vendors ADD COLUMN stripe_connect_account_id TEXT;
ALTER TABLE vendors ADD COLUMN stripe_connect_onboarded BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN stripe_connect_charges_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN stripe_connect_payouts_enabled BOOLEAN DEFAULT FALSE;

-- vendor_payouts table becomes redundant (payouts are automatic)
-- Keep the table for audit history but stop creating new rows
```

### Webhook changes required

New webhook events to handle with Connect:
- `account.updated` — vendor's onboarding status changed
- `account.application.deauthorized` — vendor disconnected their Stripe account
- `transfer.created` — funds transferred to vendor (for audit log)
- `transfer.failed` — transfer to vendor failed

### Admin changes

- Remove manual "mark as paid" payout flow
- Add vendor Connect onboarding status dashboard
- Add `stripe_connect_account_id` to vendor admin view

---

## Section 5 — Cost Analysis

### Stripe fees (current model)

| Transaction | Fee |
|---|---|
| Card payment processing | 1.5% + 20p (Stripe standard UK) |
| No transfer fee | — |

### Stripe fees (Connect model)

| Transaction | Fee |
|---|---|
| Card payment processing | 1.5% + 20p (shared between platform and connected account) |
| Payout transfer to connected account | Free for standard payouts |
| Express account monthly fee | £2/month per active connected account |

**Cost impact:** At 20 active vendors = £40/month in Connect account fees. At 100 vendors = £200/month. This is the only additional cost.

---

## Section 6 — Migration Complexity

| Dimension | Rating | Notes |
|---|---|---|
| API code changes | Medium | ~100 lines in checkout route + webhook handler |
| Database migration | Low | One ALTER TABLE, no data migration |
| Vendor onboarding flow | Medium | New UI screens for Connect onboarding |
| Operational change | High | Manual payout process eliminated entirely |
| Testing required | High | Full payment flow must be re-tested end-to-end |
| Timeline estimate | 2–3 weeks | Including vendor onboarding UI and testing |

---

## Section 7 — Recommendation

**For the 5–20 vendor pilot (current stage):**
Run the existing direct-charge model with the Phase 1 fixes in place. Monitor carefully. Do not onboard vendors beyond 20 or exceed £10,000 cumulative GMV without the Connect migration complete.

**Before significant scale:**
Implement Stripe Connect (Express, destination charges, Option A). This is the correct long-term architecture for ELBOLD as a UK marketplace.

**Non-negotiable trigger points for migration:**
- Any vendor receiving more than £1,000 in a single payment
- Cumulative GMV exceeding £10,000
- More than 20 active vendors on the platform
- Any legal or FCA enquiry about fund flows
- Any chargeback where ELBOLD absorbs a vendor's payment

---

_End of Stripe Connect Feasibility Report_
