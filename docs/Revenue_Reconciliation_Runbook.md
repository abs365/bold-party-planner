# ELBOLD Revenue Reconciliation Runbook

**Author:** Revenue Integrity Audit  
**Date:** 2026-06-06  
**Status:** Operational runbook — execute manually until cron automation is built  
**Audience:** Founder, admin, finance operator

---

## Overview

This runbook defines how to verify that ELBOLD's financial records are internally consistent and match Stripe's records. It must be run:

- **Weekly** during the pilot phase
- **Daily** once GMV exceeds £1,000/month
- **Immediately** after any production incident (failed webhook, manual database edit, Stripe dispute)

All queries run in Supabase Dashboard → SQL Editor.

---

## Step 1 — Stripe Dashboard Baseline

Before running any SQL, record the Stripe Dashboard figures as your source of truth.

Navigate to: Stripe Dashboard → Payments → Reports → Summary

Record:
```
[ ] Date range: [today's date]
[ ] Gross volume: £_______________
[ ] Refunds: £_______________
[ ] Net volume: £_______________
[ ] Disputes (chargebacks): _______________
[ ] Active subscriptions: _______________
[ ] MRR (from Stripe Billing): £_______________
```

Keep this page open. Every ELBOLD figure must reconcile against these.

---

## Step 2 — ELBOLD Payment Reconciliation

### Query 2A — Total GMV from payments table
```sql
SELECT
  COUNT(*)           AS payment_count,
  SUM(amount)        AS gross_gmv,
  MIN(created_at)    AS first_payment,
  MAX(created_at)    AS last_payment
FROM payments
WHERE status = 'succeeded'
  AND type IN ('deposit', 'full');
```

**Expected:** `gross_gmv` should match Stripe gross volume (minus subscription payments).  
**Action if mismatched by more than £0.01:** Check for payments where the webhook was delivered but the payment record was not created. Run Query 2B.

### Query 2B — Deposits vs full payments breakdown
```sql
SELECT
  type,
  COUNT(*)    AS count,
  SUM(amount) AS total
FROM payments
WHERE status = 'succeeded'
GROUP BY type
ORDER BY type;
```

Record each row. Verify `deposit` + `full` totals equal Query 2A gross_gmv. `refund` total should equal Stripe refunds figure.

### Query 2C — Commission reconciliation
```sql
SELECT
  ROUND(SUM(p.amount) * 0.10, 2)                                           AS expected_commission_10pct,
  ROUND((SELECT SUM(commission_amount)
         FROM bookings
         WHERE payment_status IN ('deposit_paid','fully_paid')), 2)         AS actual_commission_from_bookings,
  ABS(ROUND(SUM(p.amount) * 0.10, 2)
      - ROUND((SELECT SUM(commission_amount)
               FROM bookings
               WHERE payment_status IN ('deposit_paid','fully_paid')), 2))  AS drift_gbp
FROM payments
WHERE status = 'succeeded'
  AND type IN ('deposit', 'full');
```

**Expected:** `drift_gbp` = 0.00  
**Action if drift > £0.01:** A booking's commission_amount was set incorrectly. Run Query 2D to identify the affected booking.

### Query 2D — Find commission drift (run only if 2C shows drift)
```sql
SELECT
  b.id,
  b.total_amount,
  ROUND(b.total_amount * 0.10, 2)  AS expected_commission,
  b.commission_amount               AS actual_commission,
  ABS(ROUND(b.total_amount * 0.10, 2) - b.commission_amount) AS drift
FROM bookings b
WHERE b.payment_status IN ('deposit_paid', 'fully_paid')
  AND ABS(ROUND(b.total_amount * 0.10, 2) - b.commission_amount) > 0.01
ORDER BY drift DESC;
```

---

## Step 3 — Booking Integrity Checks

### Query 3A — Confirmed bookings without payment (must be 0)
```sql
SELECT b.id, b.status, b.payment_status, b.total_amount, b.created_at
FROM bookings b
LEFT JOIN payments p
  ON p.booking_id = b.id AND p.status = 'succeeded' AND p.type IN ('deposit','full')
WHERE b.payment_status IN ('deposit_paid', 'fully_paid')
  AND p.id IS NULL;
```

**Expected:** 0 rows  
**Action if any rows:** A booking was manually marked as paid or the webhook failed to create the payment record. Investigate each booking_id in Stripe Dashboard to confirm payment status.

### Query 3B — Orphaned payments (must be 0)
```sql
SELECT p.id, p.booking_id, p.amount, p.status, p.created_at
FROM payments p
LEFT JOIN bookings b ON b.id = p.booking_id
WHERE p.status = 'succeeded'
  AND b.id IS NULL;
```

**Expected:** 0 rows  
**Action if any rows:** A booking was deleted after payment. Do not delete bookings once payment has been taken — archive them instead.

### Query 3C — Bookings with mismatched vendor_payout
```sql
SELECT
  id,
  total_amount,
  vendor_payout,
  ROUND(total_amount * 0.90, 2) AS expected_payout,
  ABS(vendor_payout - ROUND(total_amount * 0.90, 2)) AS drift
FROM bookings
WHERE payment_status IN ('deposit_paid', 'fully_paid')
  AND ABS(vendor_payout - ROUND(total_amount * 0.90, 2)) > 0.01;
```

**Expected:** 0 rows (vendor_payout should always be 90% of total_amount)  
**Note:** If vendor negotiated a custom split, rows will appear here. Verify intentionality.

---

## Step 4 — Idempotency Integrity

### Query 4A — Duplicate Stripe event processing (must be 0)
```sql
SELECT id, COUNT(*) AS occurrences
FROM stripe_events
GROUP BY id
HAVING COUNT(*) > 1;
```

**Expected:** 0 rows  
**Action if any rows:** The atomic idempotency fix (F-02) may not be working. Investigate immediately — duplicate processing could have created duplicate payment records, double notifications, or double payout rows.

### Query 4B — Duplicate payment records for same booking
```sql
SELECT booking_id, type, COUNT(*) AS count
FROM payments
WHERE status = 'succeeded'
  AND type IN ('deposit', 'full')
GROUP BY booking_id, type
HAVING COUNT(*) > 1;
```

**Expected:** 0 rows  
**Action if any rows:** A webhook was processed twice. Identify the Stripe event ID from the payment records and check the stripe_events table.

---

## Step 5 — Vendor Payout Reconciliation

### Query 5A — Outstanding payout liability
```sql
SELECT
  COUNT(*)    AS pending_payout_count,
  SUM(amount) AS pending_payout_total
FROM vendor_payouts
WHERE status = 'pending';
```

This is money ELBOLD currently holds that belongs to vendors. This figure should match your Stripe balance minus ELBOLD's own commission. Record it as your outstanding vendor liability.

### Query 5B — Payout history by vendor
```sql
SELECT
  v.business_name,
  SUM(vp.amount)          AS total_payout_amount,
  COUNT(vp.id)            AS payout_count,
  MAX(vp.paid_at)         AS last_paid_at,
  SUM(CASE WHEN vp.status = 'pending'    THEN vp.amount ELSE 0 END) AS pending,
  SUM(CASE WHEN vp.status = 'paid'       THEN vp.amount ELSE 0 END) AS paid,
  SUM(CASE WHEN vp.status = 'failed'     THEN vp.amount ELSE 0 END) AS failed
FROM vendor_payouts vp
JOIN vendors v ON v.id = vp.vendor_id
GROUP BY v.id, v.business_name
ORDER BY pending DESC;
```

Any `pending` amount over £0 is money owed to a vendor. Review and process promptly.

### Query 5C — Overdue payouts (pending for more than 7 days)
```sql
SELECT
  vp.id,
  v.business_name,
  vp.amount,
  vp.created_at,
  NOW() - vp.created_at AS age
FROM vendor_payouts vp
JOIN vendors v ON v.id = vp.vendor_id
WHERE vp.status = 'pending'
  AND vp.created_at < NOW() - INTERVAL '7 days'
ORDER BY vp.created_at ASC;
```

Any row here is an overdue payout. A vendor is waiting for money. Process immediately.

---

## Step 6 — Subscription Revenue Reconciliation

### Query 6A — MRR by plan
```sql
SELECT
  plan,
  COUNT(*)  AS subscriber_count,
  CASE plan
    WHEN 'pro'      THEN COUNT(*) * 29
    WHEN 'premium'  THEN COUNT(*) * 79
    WHEN 'featured' THEN COUNT(*) * 79
    WHEN 'elite'    THEN COUNT(*) * 149
    ELSE 0
  END       AS plan_mrr_gbp
FROM vendor_subscriptions
WHERE status = 'active'
GROUP BY plan
ORDER BY plan_mrr_gbp DESC;
```

Sum of `plan_mrr_gbp` = ELBOLD's total MRR. Compare this to Stripe Billing MRR.

### Query 6B — Past-due subscriptions (revenue at risk)
```sql
SELECT
  vs.plan,
  vs.failed_payment_count,
  vs.current_period_end,
  v.business_name
FROM vendor_subscriptions vs
JOIN vendors v ON v.id = vs.vendor_id
WHERE vs.status = 'past_due'
ORDER BY vs.failed_payment_count DESC;
```

Past-due subscriptions represent MRR that may be lost. Follow up with vendors or wait for Stripe's smart retry to recover.

---

## Step 7 — Failed Payment Review

### Query 7A — Failed payments in last 30 days
```sql
SELECT
  p.id,
  p.booking_id,
  p.amount,
  p.stripe_payment_intent_id,
  p.created_at
FROM payments
WHERE status = 'failed'
  AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

For each row, verify in Stripe Dashboard whether the customer subsequently paid successfully. If a booking shows `payment_status = 'deposit_paid'` but also has a `status = 'failed'` payment record, the customer retried successfully — this is expected.

---

## Step 8 — Reconciliation Sign-Off

Complete this checklist after running all queries:

```
RECONCILIATION REPORT — [DATE]
================================

[ ] 2A: Gross GMV from payments matches Stripe gross volume     Drift: £_______
[ ] 2C: Commission (10%) matches bookings.commission_amount     Drift: £_______
[ ] 3A: Confirmed bookings without payment record               Count: _______
[ ] 3B: Orphaned payments                                       Count: _______
[ ] 4A: Duplicate Stripe event processing                       Count: _______
[ ] 4B: Duplicate payment records per booking                   Count: _______
[ ] 5A: Pending vendor payouts outstanding                      Total: £_______
[ ] 5C: Payouts overdue > 7 days                                Count: _______
[ ] 6A: MRR matches Stripe Billing                              Drift: £_______
[ ] 6B: Past-due subscriptions                                  Count: _______

RECONCILIATION STATUS: [ ] CLEAN  [ ] DRIFT DETECTED  [ ] INVESTIGATION REQUIRED

Reviewed by: ___________________________  Date: _______________
```

---

## Escalation Protocol

### If drift is detected in Query 2C (commission mismatch)
1. Run Query 2D to identify the affected booking(s)
2. Verify the commission_amount in the DB matches the intended rate
3. If error was in the code: update commission_amount via admin SQL (document the correction)
4. If error was in Stripe: verify the payment amount against the Stripe Payment Dashboard
5. Record the correction and cause in ELBOLD's audit log

### If Query 3A returns any rows (confirmed booking without payment)
1. Pull the booking_id(s)
2. Check in Stripe Dashboard: was a payment actually taken?
3. If Stripe shows succeeded: the webhook failed to process — manually run the webhook handler logic and create the payment record
4. If Stripe shows no payment: the booking was incorrectly marked as paid — update payment_status back to 'pending' and investigate how it was set

### If Query 4A returns any rows (duplicate Stripe event IDs)
This should never happen after the F-02 fix. If it does:
1. Note the Stripe event ID
2. Check which handler ran twice (look at payment record timestamps)
3. Remove the duplicate payment record after verifying it was processed twice
4. Investigate why the idempotency fix failed — may indicate a DB transaction isolation issue

---

_End of Revenue Reconciliation Runbook_
