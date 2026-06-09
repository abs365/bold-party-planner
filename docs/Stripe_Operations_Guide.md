# Stripe Operations Guide

**Date:** 2026-06-09
**Sprint:** ELBOLD Trust, Governance & Operational Readiness
**Phase:** 9
**Audience:** Non-technical founders

---

## What Is Stripe and Why Does ELBOLD Use It?

Stripe is the payment infrastructure that powers all money movement on ELBOLD. It handles:
- Charging customers' credit and debit cards
- Holding deposits securely
- Processing refunds when bookings are cancelled
- Paying out vendors (via ELBOLD admin, manually for now)

ELBOLD uses Stripe because it is trusted by millions of businesses worldwide, is regulated as a payment institution, and carries out fraud detection automatically. Customer payment details are never stored on ELBOLD's servers — they go directly to Stripe.

---

## How Money Flows on ELBOLD

### Step 1 — Customer Accepts a Quote

A customer browses vendors, requests quotes, and accepts one. No money moves at this point.

### Step 2 — Deposit Payment

The customer is prompted to pay a deposit (currently 50% of the quoted price). They enter their card details on a Stripe-hosted checkout page.

ELBOLD receives the full deposit amount from the customer. For example, if the total booking is £500, the customer pays £250 deposit.

### Step 3 — Stripe Confirms Payment

Stripe charges the card, confirms success, and sends ELBOLD a "webhook" notification (an automatic signal that the payment went through). ELBOLD's system then updates the booking to "Confirmed" and sends confirmation emails to both the customer and vendor.

### Step 4 — ELBOLD Holds the Money

The £250 deposit sits in ELBOLD's Stripe account. It is not paid out to the vendor yet.

### Step 5 — Event Happens

The vendor provides the service at the event.

### Step 6 — Payout to Vendor

ELBOLD's admin manually reviews the completed booking and processes a bank transfer to the vendor. The vendor receives 90% of the deposit (£225 of the £250). ELBOLD retains 10% (£25) as platform commission.

*Note: Automatic payouts via Stripe Connect are planned for Phase 2, once the platform reaches 20 vendors. For now, payouts are manual.*

---

## Commission Structure

| Booking Value | ELBOLD Commission (10%) | Vendor Receives (90%) |
|---|---|---|
| £100 | £10 | £90 |
| £250 | £25 | £225 |
| £500 | £50 | £450 |
| £1,000 | £100 | £900 |
| £2,000 | £200 | £1,800 |

Commission is calculated on the deposit paid, not the full booking value.

---

## Stripe Fees

Stripe charges ELBOLD (not the customer) for processing each payment:
- Standard UK card: 1.5% + 20p per transaction
- Premium/international cards: up to 3.25% + 20p

**Example:** Customer pays £250 deposit on a standard UK card.
- Stripe fee: 1.5% × £250 + £0.20 = £3.75 + £0.20 = **£3.95**
- ELBOLD receives: £250.00 - £3.95 = **£246.05**
- ELBOLD commission (10% of original): £25.00
- Vendor receives: £221.05 (£250 - Stripe fee - ELBOLD commission)

*For simplicity, ELBOLD's commission is calculated on the gross booking value and paid out after Stripe fees.*

---

## Refund Flow

If a booking is cancelled, ELBOLD issues a refund to the customer through Stripe.

### What Happens

1. Admin or vendor cancels the booking
2. ELBOLD's system calls Stripe's refund API
3. Stripe returns the money to the customer's original payment method
4. The customer sees the refund in 5–10 business days

### Refund Fees

**Stripe does not return its processing fee on refunds.** This means a refund costs ELBOLD the original Stripe processing fee.

**Example:** £250 payment → refunded.
- Customer gets back: £250.00 (full deposit)
- Stripe fee lost: £3.95 (not returned by Stripe)
- Cost to ELBOLD: £3.95

This is why partial refund or no-refund policies for late cancellations are commercially important.

### ELBOLD Cancellation Policy

| Cancellation Timing | Refund |
|---|---|
| More than 7 days before event | Full refund |
| 3–7 days before event | 50% refund |
| Less than 3 days before event | No refund |

*Policy is set in `/our-commitments` and `/cancellation-policy` pages.*

---

## Vendor Payout Flow

Currently manual. Process:

1. Go to `/admin/payouts`
2. Review the "Due" payout queue
3. Transfer the vendor's share via bank transfer (BACS/Faster Payments)
4. Mark as paid in ELBOLD admin with a reference number
5. Vendor receives email confirmation

**Target:** Pay out within 3 working days of event completion.

### Future: Stripe Connect

When ELBOLD processes £10,000 GMV or reaches 20+ vendors, we will migrate to Stripe Connect. This allows:
- Automatic payouts directly to vendor bank accounts
- Instant vendor onboarding (no ELBOLD admin needed)
- Regulatory compliance (Stripe handles KYC/AML for each vendor)

---

## Platform Revenue

### How ELBOLD Earns

ELBOLD earns 10% of every booking deposit paid.

| Metric | Value |
|---|---|
| Commission rate | 10% |
| Minimum booking (example) | £50 → £5 to ELBOLD |
| Average booking (est.) | £300 → £30 to ELBOLD |
| 10 bookings/month × £30 avg | £300/month platform revenue |
| 100 bookings/month × £30 avg | £3,000/month platform revenue |

### Subscription Revenue

Vendors can subscribe to Pro (£29/month), Premium (£79/month), or Elite (£149/month) for enhanced visibility. This is recurring monthly revenue independent of booking activity.

| 10 Pro subscribers | £290/month |
|---|---|
| 5 Premium subscribers | £395/month |
| 2 Elite subscribers | £298/month |
| **10 + 5 + 2 = 17 paying vendors** | **£983/month MRR** |

---

## What to Watch in Stripe Dashboard

### Daily
- Check for failed payments: Dashboard > Payments > filter by Failed
- Check webhook health: Dashboard > Developers > Webhooks > select endpoint > check recent deliveries

### Weekly
- Review payout queue: check for payouts due beyond 3 working days
- Compare Stripe payments to ELBOLD financial_ledger (run reconciliation query)

### Monthly
- Download revenue report from Stripe Dashboard > Reports
- Compare to ELBOLD admin finance dashboard

---

## Key Stripe Settings Checklist

| Setting | Status | Where to Check |
|---|---|---|
| Live mode active (not test mode) | Must be confirmed | Stripe Dashboard top-right corner — should say "Live" not "Test" |
| Webhook endpoint registered | Must exist | Stripe Dashboard > Developers > Webhooks |
| Webhook endpoint URL | `https://www.elbold.com/api/payments/webhook` | As above |
| Webhook events enabled | `checkout.session.completed`, `payment_intent.payment_failed`, `invoice.paid`, `invoice.payment_failed` | As above |
| Stripe API key in Vercel | `sk_live_*` prefix | Vercel Dashboard > Project > Settings > Environment Variables |

---

## Emergency Contacts

| Situation | Action |
|---|---|
| Customer charged but booking not confirmed | Check webhook in Stripe → redeliver if failed; check Supabase `stripe_events` table for the `checkout.session.completed` event |
| Refund not appearing for customer | Check Stripe Dashboard > Payments > find payment > check Refunds tab |
| Payment processing failing for all customers | Check Stripe status page: https://status.stripe.com |
| Suspicious charge or fraud alert | Log in to Stripe Dashboard > Radar > review flagged payments |

---

## Glossary

| Term | Meaning |
|---|---|
| Deposit | Amount paid by customer upfront to secure a booking (currently 50%) |
| Balance | Remaining amount paid directly to vendor at the event (outside ELBOLD) |
| GMV | Gross Merchandise Value — total money paid through the platform |
| Commission | ELBOLD's 10% cut of each deposit |
| MRR | Monthly Recurring Revenue — from vendor subscriptions |
| Webhook | Automatic notification Stripe sends to ELBOLD when a payment event occurs |
| Stripe Connect | Stripe's product for platforms that facilitate payments between third parties |
| Payout | Transfer from ELBOLD's Stripe balance to a vendor's bank account |
| Refund | Return of customer's payment, processed through Stripe |
