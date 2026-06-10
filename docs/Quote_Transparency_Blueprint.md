# Quote Transparency Blueprint
**Version:** 1.0 | **Date:** 2026-06-09 | **Phase:** 5
**Type:** Design specification only. No code changes.
**Constraint:** This document describes the intended design. Do NOT implement until explicitly instructed.

---

## Problem Statement

**Current state (verified from code, 2026-06-09):**

The platform has a quote request and quote response flow. Customers submit quote requests; vendors respond with a quoted price. The quote is accepted or declined. Then a booking is created.

**Gap:** There is no defined breakdown between the vendor's quoted price and the platform's fee. When a customer accepts a quote, the total price they are shown in the booking/payment step may not make clear:
- How much goes to the vendor
- How much is the ELBOLD platform fee
- What the customer's total charge is (including any Stripe fees passed through)

This creates a trust gap. A customer who pays £500 and later discovers the vendor received £430 (platform fee: £70) will feel misled if that split was not disclosed upfront.

**Evidence:**

The `platform_stats` view shows `total_gmv: 0` — no completed booking GMV has been accumulated. The current quote flow is in use (4 pending quotes in the live database) but no end-to-end completed booking with full price transparency has been validated.

---

## Design: Transparent Quote Line Items

### Principle

Every accepted quote and payment screen must show three line items:
1. Vendor service price (what the vendor charges)
2. ELBOLD platform fee (what ELBOLD retains)
3. Total charge to customer (sum)

These must be visible **before** the customer confirms payment.

---

## Data Model (design only)

The `quotes` table should store:

```sql
-- Existing columns (assumed)
id              uuid
customer_id     uuid
vendor_id       uuid
service_id      uuid
status          text -- pending | quoted | accepted | declined | booked
event_date      date
message         text

-- Columns to add for price transparency
vendor_price    numeric(10,2)  -- vendor's quoted service price
platform_fee    numeric(10,2)  -- ELBOLD platform fee
platform_fee_pct numeric(5,2) -- fee percentage captured at quote time
total_price     numeric(10,2)  -- vendor_price + platform_fee (customer pays this)
currency        text           -- 'gbp' (default)
```

**Invariant:** `total_price = vendor_price + platform_fee` must be enforced by a database CHECK constraint.

**Fee capture rationale:** Store `platform_fee_pct` at quote time (not just reference a current rate). Platform fee percentage may change over time; the quoted fee must be locked to the rate in effect when the quote was created.

---

## Fee Schedule

**Current default fee:** Not defined in code (gap). The blueprint assumes:

| Booking value | Platform fee |
|--------------|-------------|
| Any | 15% of vendor_price |

The fee schedule must be defined as an environment variable or a database table (not a code constant). This allows adjustment without a deployment.

**Recommended approach:** `platform_fee_rate` config in a `platform_config` table (single row):
```sql
CREATE TABLE platform_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);
INSERT INTO platform_config (key, value) VALUES ('platform_fee_rate', '0.15');
```

The quote API reads `platform_fee_rate` from `platform_config`, calculates `platform_fee = vendor_price * platform_fee_rate`, and stores all three values.

---

## Quote Response Flow (redesigned)

**Step 1: Vendor submits quote price**

Vendor enters their desired price for the service. The UI immediately shows the split:
```
Your price:         £400.00
ELBOLD fee (15%):   £60.00
Customer pays:      £460.00
```

This removes vendor ambiguity about what the customer will see.

**Step 2: Customer views accepted quote**

Customer sees:
```
Service: Wedding Photography (Ballet)
Event date: 2026-08-15

Service price:        £400.00
Platform fee:         £60.00
─────────────────────────────
Total to pay:         £460.00
```

The word "Platform fee" should link to a tooltip or page explaining what ELBOLD's fee covers. The vendor name and service price are always shown separately from the platform fee.

**Step 3: Payment screen**

Stripe payment intent is created for `total_price = £460.00`. The `transfer_data.destination` routes `£400.00` to the vendor's connected Stripe account. ELBOLD retains `£60.00`.

---

## Stripe Connect Payout Architecture

For transparent pricing to work at the payment level, ELBOLD must use Stripe Connect (not standard charges):

**Stripe Standard Charges (current assumed state):** Full amount goes to ELBOLD. ELBOLD manually pays vendors. Vendor trust issue: vendor has no direct relationship with Stripe.

**Stripe Connect (recommended for this design):** Customer pays `£460`. Stripe routes `£400` to vendor's connected account. ELBOLD receives `£60`. Vendor can see their payout in their own Stripe dashboard.

**This document does not specify which Stripe mode ELBOLD currently uses.** That determination requires reading the Stripe payment intent creation code (`app/api/payments/`). If Stripe Connect is not yet implemented, the transparent pricing display is still implementable — but payout routing will remain manual until Connect is configured.

---

## Display Requirements

**Quote confirmation email to customer** must include all three line items.

**Vendor quote notification email** must show vendor_price and the customer's total separately.

**Admin dashboard** must show, per booking:
- vendor_price (what vendor earns)
- platform_fee (ELBOLD revenue)
- total_price (customer charge)

This is required for accurate revenue reporting. Currently `total_revenue: £0.50` cannot be attributed correctly (platform fee portion vs vendor portion) without this split.

---

## What This Is NOT

This blueprint does NOT specify:
- Implementation timeline
- Which sprint this belongs to
- Which engineer owns it
- API endpoint specifications (those belong in a technical spec)

This blueprint is a design input for the engineering backlog.

---

## Dependencies Before Implementation

| Dependency | Status | Owner |
|-----------|--------|-------|
| Platform fee rate defined | NOT SET | Business decision required |
| Stripe Connect vs standard charges clarified | UNVERIFIED | Engineering + Business |
| `quotes` table schema confirmed | Assumed from code | Database admin |
| Vendor payout flow designed | NOT DESIGNED | Engineering |

---

## Summary

| Design Element | Completeness |
|---------------|-------------|
| Problem statement | DEFINED |
| Line item model (3-way split) | DEFINED |
| Data model additions | DEFINED |
| Fee schedule | PENDING (business decision on rate) |
| Stripe Connect requirement | IDENTIFIED (architecture decision pending) |
| Email template requirements | DEFINED |
| Admin reporting requirements | DEFINED |
| Implementation spec | NOT WRITTEN (out of scope for this blueprint) |
