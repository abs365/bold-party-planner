# ELBOLD Revenue Flow Architecture Report

**Author:** Revenue Integrity Audit  
**Date:** 2026-06-06  
**Status:** Phase 1 Complete — Evidence-based findings from live code review  
**Scope:** Every stage of money movement through ELBOLD, from customer intent to admin reporting

---

## Executive Summary

ELBOLD currently operates as a **payment intermediary**. Customer funds flow into ELBOLD's Stripe account; vendors are paid manually by bank transfer. This is operationally functional for a small pilot but carries measurable compliance exposure at scale.

Five critical findings were identified and fixed in the Revenue Integrity Sprint (June 2026). Six medium-term issues remain open. One finding (Stripe key validation) requires manual founder action in the Stripe Dashboard.

**Overall verdict: GO WITH CAUTION for a 5–20 vendor pilot. Stripe Connect migration required before 50+ vendors or £10,000 GMV.**

---

## Section 1 — Revenue Flow Map

### Flow 1: Customer Booking (Primary Revenue Path)

```
Customer Intent
    │
    ▼
POST /api/quotes
  · Rate limited (20/hr, 100/day per user)
  · Zod schema validation
  · Vendor must be status='approved'
  · Prevents self-quoting
  · Prevents duplicate quotes (same vendor + event)
  · AI lead scoring
  · Audit log created
  · Vendor notified (in-app + email)
    │
    ▼
PATCH /api/quotes/[id] action="respond"
  · Vendor submits price + deposit amount
  · Deposit defaults to 30% of total price
  · Quote status: pending → responded
  · Customer notified (in-app + email)
    │
    ▼
PATCH /api/quotes/[id] action="accept"
  · Customer accepts vendor's price
  · event_id guard: rejects if quote not linked to an event [F-01 FIXED]
  · Creates booking with:
      customer_id, vendor_id, event_id (NOT NULL — FK enforced)
      total_amount, deposit_amount, vendor_payout (90%), commission_amount (10%)
      status='confirmed', payment_status='pending'
  · Rejects all other open quotes for same event
  · Vendor notified (in-app + email)
    │
    ▼
POST /api/payments/checkout
  · Rate limited (10 checkout attempts/hr per user)
  · Validates booking belongs to customer
  · Validates booking status is 'accepted' or 'confirmed'
  · assertStripeKey() validates key format [F-03 FIXED]
  · Stripe Checkout Session created (mode: payment)
  · checkout.session.metadata: booking_id, customer_id, payment_type, amount, vendor_payout
  · payment_intent_data.metadata: booking_id, customer_id, payment_type, amount [F-08 FIXED]
  · success_url + cancel_url with booking_id
  · stripe_checkout_session_id saved to booking row
    │
    ▼
Stripe Hosted Checkout
  · Customer enters card details (3DS if required)
  · Stripe processes payment
  · Redirects to success_url or cancel_url
    │
    ▼
POST /api/payments/webhook ← Stripe delivers event
  · HMAC signature verification via constructEvent()
  · Atomic idempotency: INSERT into stripe_events (PK=event_id) [F-02 FIXED]
  · PostgreSQL 23505 = duplicate → return 200 immediately
  │
  ├─ checkout.session.completed:
  │    · Reads metadata from session
  │    · Customer ownership verification (customer_id matches booking.customer_id)
  │    · Updates booking: payment_status=deposit_paid, status=confirmed
  │    · Creates payment record (type='deposit', status='succeeded')
  │    · Updates invoice if exists (ALWAYS a no-op — invoices never seeded) [F-05 OPEN]
  │    · Notifies customer in-app ("Payment Confirmed")
  │    · Notifies vendor in-app ("Payment Received")
  │    · Emails customer (sendPaymentReceived)
  │    · Emails vendor (sendVendorPaymentNotification)
  │
  ├─ payment_intent.payment_failed:
  │    · Updates payments row to status='failed'
  │    · Reads metadata.booking_id + customer_id [F-08 FIXED]
  │    · Notifies customer in-app ("Payment Failed")
  │    · Emails customer (sendBookingPaymentFailed) with retry link
  │    · Notifies vendor in-app ("Customer Payment Failed")
  │
  └─ charge.refunded:
       · Updates booking: payment_status='refunded'
       · Creates refund payment record
       · NO customer email [F-16 OPEN]
    │
    ▼
Vendor Payout (MANUAL — no Stripe Connect)
  · auto_create_payout() trigger fires on payment_status = 'fully_paid'
  · Creates vendor_payouts row (amount = booking.vendor_payout, status='pending')
  · Admin manually transfers via bank
  · No automated reconciliation or transfer confirmation
    │
    ▼
Admin Reporting
  · /admin page: commission sums from bookings table
  · /admin/subscriptions: MRR via planMRRContribution() [F-06 FIXED]
  · /admin/monetization: full plan distribution + billing events
  · /admin/payouts: vendor_payouts table
```

### Flow 2: Vendor Subscription (Secondary Revenue Path)

```
POST /api/vendor/subscription
  · assertStripeKey() [F-04 FIXED]
  · Creates Stripe subscription (mode: subscription)
  · subscription.metadata: vendor_id, plan, billing_cycle
    │
    ▼
POST /api/payments/webhook
  · customer.subscription.created:
      Upserts vendor_subscriptions row
      Sets vendor.subscription_plan + vendor.featured flag
      Logs billing event
  · customer.subscription.updated:
      Same upsert path
  · customer.subscription.deleted:
      Resets to free, removes featured, notifies vendor
  · invoice.paid:
      Sets status='active', resets failed_payment_count, restores featured
      Logs billing event with amount
  · invoice.payment_failed:
      Sets status='past_due', increments failed_payment_count
      Removes featured slot immediately (not after retry window)
      Emails vendor (sendSubscriptionPaymentFailed)
```

### Flow 3: Refund (Stripe Dashboard initiated)

```
Admin → Stripe Dashboard → Issue refund
    │
    ▼ Stripe sends charge.refunded
POST /api/payments/webhook
  · Updates booking.payment_status = 'refunded'
  · Creates payment record (type='refund')
  · NO customer email [F-16 OPEN]
  · NO vendor notification
  · NO invoice update
```

---

## Section 2 — Failure Points by Stage

### Stage: Quote Creation
| Risk | Severity | Status |
|---|---|---|
| Spam quote flooding | Medium | MITIGATED — dual rate limit (20/hr, 100/day) |
| Quote to self | Low | MITIGATED — vendor.user_id === user.id check |
| Duplicate quotes | Low | MITIGATED — DB query check per event+vendor |

### Stage: Quote Acceptance → Booking Creation
| Risk | Severity | Status |
|---|---|---|
| Booking without event | Critical | FIXED (F-01) — 400 guard before INSERT |
| No quote response exists | Medium | MITIGATED — explicit check for quote_responses row |
| Commission calculation wrong | Low | MITIGATED — hardcoded 10% in code |
| Booking with wrong vendor_payout | Low | MONITORED — set at acceptance time |

### Stage: Stripe Checkout
| Risk | Severity | Status |
|---|---|---|
| Non-live key in production | Critical | FIXED (F-03) — assertStripeKey() validates prefix |
| Key not going through assertStripeKey() | High | FIXED (F-04) — all 3 routes now use assertStripeKey() |
| Checkout with unaccepted booking | Medium | MITIGATED — status check in checkout route |
| Amount manipulation | Medium | MITIGATED — amount taken from DB booking, not request body |
| Rate limit bypass | Low | MITIGATED — 10/hr per user |

### Stage: Stripe Webhook
| Risk | Severity | Status |
|---|---|---|
| Duplicate event processing (TOCTOU race) | Critical | FIXED (F-02) — atomic INSERT, 23505 catch |
| Signature bypass | Critical | MITIGATED — constructEvent() validates HMAC |
| Missing STRIPE_WEBHOOK_SECRET | Critical | MITIGATED — assertWebhookSecret() throws if missing |
| Customer_id metadata mismatch (fraud) | High | MITIGATED — ownership verification before booking update |
| Silent payment failure | High | FIXED (F-08) — customer + vendor notified, email sent |
| No Sentry error reporting | Medium | OPEN (F-07) |
| Missing webhook events (charge.dispute.created) | Medium | OPEN (F-10) |
| No reconciliation cron for missed webhooks | Medium | OPEN (F-11) |
| Invoice table never updated | Low | OPEN (F-05) |

### Stage: Vendor Payout
| Risk | Severity | Status |
|---|---|---|
| Manual transfer with no confirmation | Critical | STRUCTURAL — requires Stripe Connect to fix |
| No payout receipt to vendor | High | OPEN — vendor never emailed when paid |
| Payout for deposit (not full payment) | Medium | BY DESIGN — trigger fires on fully_paid only |
| Payout amount wrong if commission changes | Low | LOW RISK — commission_amount set at booking acceptance |
| Bank details stored in DB (security risk) | Medium | OPEN — vendor_bank_details table exists |

### Stage: Admin Reporting
| Risk | Severity | Status |
|---|---|---|
| MRR calculation wrong | High | FIXED (F-06) — planMRRContribution() reduce |
| Revenue figure ignores deposits | Medium | MONITORED — commission sums from bookings |
| No daily reconciliation job | High | OPEN (F-11) |

---

## Section 3 — Fraud Risk Assessment

### Customer-side fraud vectors

**Scenario A: Metadata tampering in checkout**
Customer modifies `booking_id` in the request to `/api/payments/checkout`. 
Status: **MITIGATED** — the route fetches the booking using `.eq("customer_id", user.id)`, so a tampered booking_id that belongs to another customer returns 404. The customer cannot pay for another customer's booking.

**Scenario B: Webhook metadata spoofing**
Attacker tries to send a fake webhook with a real booking_id in metadata.
Status: **MITIGATED** — `stripe.webhooks.constructEvent()` verifies the HMAC signature using the webhook secret. A request without a valid signature returns 400 before any metadata is read.

**Scenario C: Customer_id mismatch after payment**
Attacker chains a legitimate payment to a different booking.
Status: **MITIGATED** — the webhook validates `booking.customer_id === meta.customer_id` before any status update.

**Scenario D: Replay attack (same webhook delivered twice)**
Stripe may deliver the same event multiple times under network failure.
Status: **FIXED (F-02)** — atomic INSERT on stripe_events.id (PK) guarantees exactly-once processing.

### Vendor-side fraud vectors

**Scenario E: Vendor creates fake booking to trigger payout**
Vendor cannot create bookings. Bookings are created only when a customer accepts a vendor's quote. The quote acceptance validates `isCustomer` (quote.customer_id === user.id).

**Scenario F: Vendor manipulates payout amount**
The `vendor_payout` field is set at booking creation time (90% of quote price). Vendor cannot modify this. The `auto_create_payout()` trigger reads `NEW.vendor_payout` directly from the bookings row.

---

## Section 4 — Open Findings (Not Fixed)

| ID | Finding | Severity | Fix estimate |
|---|---|---|---|
| F-05 | Invoices table never populated — invoice is always empty | Low | 2h — create invoice at booking acceptance |
| F-07 | No Sentry error reporting in webhook | Medium | 1h — add Sentry.captureException() |
| F-09 | "Free" plan API downgrade doesn't cancel Stripe subscription | Medium | 2h — call stripe.subscriptions.cancel() on downgrade |
| F-10 | Missing webhook events (charge.dispute.created, invoice.payment_action_required) | Medium | 2h — add handlers |
| F-11 | No reconciliation cron for missed webhooks | High | 4h — daily cron comparing payments vs stripe data |
| F-13 | No indexes on bookings.customer_id, bookings.vendor_id | Low | 30m — add indexes in migration |
| F-14 | No rate limit on /api/subscriptions/portal | Low | 30m — add rateLimit() |
| F-16 | No customer email on refund | Medium | 1h — add sendRefundConfirmation() |

---

## Section 5 — Data Integrity Verification Queries

Run these in Supabase SQL Editor to verify integrity at any time:

```sql
-- 1. Confirmed bookings with no payment record (should be 0)
SELECT b.id, b.status, b.payment_status
FROM bookings b
LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'succeeded'
WHERE b.payment_status IN ('deposit_paid', 'fully_paid')
  AND p.id IS NULL;

-- 2. Orphaned payments (no corresponding booking)
SELECT p.id, p.booking_id, p.amount, p.status
FROM payments p
LEFT JOIN bookings b ON b.id = p.booking_id
WHERE p.status = 'succeeded' AND b.id IS NULL;

-- 3. Idempotency check (duplicate stripe events should be 0)
SELECT id, COUNT(*) FROM stripe_events GROUP BY id HAVING COUNT(*) > 1;

-- 4. Commission reconciliation
SELECT
  ROUND(SUM(p.amount) * 0.1, 2) AS expected_commission,
  ROUND((SELECT SUM(commission_amount) FROM bookings WHERE payment_status IN ('deposit_paid','fully_paid')), 2) AS actual_commission,
  ABS(ROUND(SUM(p.amount) * 0.1, 2) - ROUND((SELECT SUM(commission_amount) FROM bookings WHERE payment_status IN ('deposit_paid','fully_paid')), 2)) AS drift_gbp
FROM payments
WHERE status = 'succeeded' AND type IN ('deposit', 'full');

-- 5. Pending payout liability (money owed to vendors)
SELECT SUM(amount) AS outstanding_vendor_liability, COUNT(*) AS payout_count
FROM vendor_payouts
WHERE status = 'pending';
```

---

## Section 6 — Reconciliation Status Summary

| Metric | Source | Frequency | Current status |
|---|---|---|---|
| GMV | payments table | Real-time | Accurate |
| Commission revenue | bookings.commission_amount | Real-time | Accurate (10% of total_amount) |
| MRR | planMRRContribution() reduce | Real-time | Fixed (F-06) |
| Vendor payouts outstanding | vendor_payouts table | Real-time | Manual process only |
| Webhook event coverage | stripe_events table | Per-delivery | No cron to catch missed events |
| Invoice records | invoices table | Never | Always 0 — not populated |

---

_End of Revenue Flow Architecture Report_
