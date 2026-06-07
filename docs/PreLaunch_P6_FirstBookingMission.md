# Pre-Launch Priority 6 — First Booking Mission

**Date:** 2026-06-07
**Sprint:** ELBOLD Pre-Launch Operations
**Objective:** Complete a full Quote, Booking, and Payment cycle using real accounts. Capture evidence at every step.

---

## Prerequisite Checklist

All of these must be true before running this test.

- [ ] At least 1 approved vendor with 1+ packages and 3+ photos
- [ ] A customer test account separate from the vendor and admin accounts
- [ ] Stripe LIVE keys confirmed in Vercel (sk_live_* prefix, not test keys)
- [ ] Stripe webhook registered at: https://www.elbold.com/api/payments/webhook
  - Events: checkout.session.completed, payment_intent.payment_failed, invoice.paid, invoice.payment_failed
- [ ] RESEND_API_KEY active and verified domain (noreply@elbold.com)

If any of these are not confirmed, do not proceed. Stripe test cards will not work in production with live keys.

---

## Accounts Needed

**Vendor account:** an approved vendor with at least 1 package that has a price set.

**Customer account:** a separate real account (not the same email as admin or vendor).

If you do not have a separate customer account, create one at /signup with a different email address.

---

## Part 1 — Quote

### Step 1.1 — Create an Event (as customer)

Log in as the customer account.

Navigate to /dashboard/create-event.

Create a real event:
- Event name: "Test Event — First Booking"
- Event type: the category that matches your approved vendor
- Event date: a real future date
- Location: the vendor's city or nearby
- Guest count: realistic number

Save the event.

**Evidence:** Screenshot of the created event in /dashboard/events.

---

### Step 1.2 — Find the Vendor (as customer)

Navigate to /browse and filter by the vendor's category.

Locate the approved vendor's profile.

Open their profile page at /vendors/[vendor-id].

**Evidence:** Screenshot of the vendor profile page showing their packages.

---

### Step 1.3 — Request a Quote (as customer)

On the vendor profile, click "Request a Quote" or "Request Free Quote".

Fill in the quote form:
- Select the event created in Step 1.1
- Choose a package
- Add a note: "This is a test quote for our first booking mission."

Submit the quote request.

**Evidence:** Screenshot of the quote submission confirmation.

---

### Step 1.4 — Verify Quote Created (admin)

Log in as admin. Navigate to /admin/quotes.

Confirm the quote appears in the pipeline with status "pending".

Run in Supabase SQL Editor:

```sql
SELECT id, status, customer_id, vendor_id, created_at
FROM quotes
ORDER BY created_at DESC
LIMIT 3;
```

**Evidence:** Screenshot of quote in admin panel.

---

### Step 1.5 — Verify Vendor Notification

Log in as the vendor account. Check for an in-app notification.

Navigate to /vendor/quotes. Confirm the quote request appears.

Check the vendor's email inbox for the quote notification email.

**Evidence:** Screenshot of the quote in the vendor leads view.

---

## Part 2 — Booking

### Step 2.1 — Vendor Responds to Quote

As the vendor, open the quote in /vendor/quotes.

Click "Respond" and fill in a quote response:
- Title: "DJ Set for your event"
- Price: a real price (can be a test amount like £200)
- Deposit: 25% (or any amount)
- Description: "Full 4-hour DJ set including setup and teardown."
- Message: "Available for your date — happy to discuss further."

Submit the response.

**Evidence:** Screenshot of the submitted vendor response.

---

### Step 2.2 — Customer Views Response and Accepts

Log in as the customer account.

Navigate to /dashboard/quotes. Open the quote that has received a response.

Review the vendor's response.

Click "Accept" to confirm the booking.

**Evidence:** Screenshot of the acceptance confirmation.

---

### Step 2.3 — Verify Booking Created

As admin or customer, navigate to /dashboard/bookings or /admin/bookings.

Confirm a booking record was created with:
- Status: pending_payment
- Payment status: not paid

Run in Supabase SQL Editor:

```sql
SELECT id, status, payment_status, vendor_id, created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 3;
```

**Evidence:** Screenshot of booking in bookings list.

---

### Step 2.4 — Verify Customer Received Booking Email

Check the customer email inbox for a booking confirmation / payment prompt email.

Subject should be something like "Your booking is confirmed — next step is to pay your deposit" or similar (from sendBookingAwaitingPayment).

**Evidence:** Screenshot of the email received.

---

## Part 3 — Payment

### Step 3.1 — Customer Pays Deposit

Log in as the customer.

Navigate to /dashboard/bookings and open the new booking.

Click "Pay Deposit". This should open the Stripe Checkout page.

**IMPORTANT:** On live Stripe, use a REAL payment card. Use a low-value deposit (e.g. £50) to minimise real spend.

Alternatively, if you want to test without spending real money: confirm that Stripe Checkout loads correctly and the amount is correct, then do not complete the payment. Record as "checkout loaded, payment deferred."

If you complete the real payment:
- Enter real card details
- Complete the 3D Secure step if required
- Wait for redirect back to the success page

**Evidence:** Screenshot of Stripe Checkout page showing correct booking amount and vendor name.

---

### Step 3.2 — Verify Payment Recorded

After completing payment (or if deferring: after step 3.1):

Run in Supabase SQL Editor:

```sql
SELECT id, booking_id, amount, status, stripe_payment_intent_id, created_at
FROM payments
ORDER BY created_at DESC
LIMIT 3;
```

Confirm:
- payment record exists
- amount matches the deposit amount
- stripe_payment_intent_id is populated

**Evidence:** Screenshot of query result or admin payments view.

---

### Step 3.3 — Verify Booking Status Updated

```sql
SELECT id, status, payment_status
FROM bookings
WHERE id = 'booking-id-from-step-2.3';
```

Expected:
- status: confirmed
- payment_status: deposit_paid

**Evidence:** Screenshot of query result.

---

### Step 3.4 — Verify Stripe Dashboard

Log in to Stripe Dashboard at dashboard.stripe.com.

Navigate to Payments. Confirm the payment appears with the correct amount and status.

**Evidence:** Screenshot of payment in Stripe Dashboard.

---

### Step 3.5 — Verify Vendor Notification

Log in as vendor. Check for in-app notification about the booking payment.

Check the vendor email inbox for a payment received notification.

**Evidence:** Screenshot of notification or email.

---

## Evidence Summary Table

Complete this after running all steps.

| Step | Action | Result | Evidence Captured |
|---|---|---|---|
| 1.1 | Create customer event | PASS / FAIL | Y/N |
| 1.2 | Find vendor profile | PASS / FAIL | Y/N |
| 1.3 | Submit quote request | PASS / FAIL | Y/N |
| 1.4 | Quote visible in admin | PASS / FAIL | Y/N |
| 1.5 | Vendor notified of quote | PASS / FAIL | Y/N |
| 2.1 | Vendor responds to quote | PASS / FAIL | Y/N |
| 2.2 | Customer accepts quote | PASS / FAIL | Y/N |
| 2.3 | Booking record created | PASS / FAIL | Y/N |
| 2.4 | Customer receives booking email | PASS / FAIL | Y/N |
| 3.1 | Stripe Checkout loads | PASS / FAIL | Y/N |
| 3.2 | Payment record in DB | PASS / FAIL / DEFERRED | Y/N |
| 3.3 | Booking status = confirmed | PASS / FAIL / DEFERRED | Y/N |
| 3.4 | Payment in Stripe Dashboard | PASS / FAIL / DEFERRED | Y/N |
| 3.5 | Vendor notified of payment | PASS / FAIL / DEFERRED | Y/N |

**Overall result:** COMPLETE / PARTIAL (quote+booking only) / BLOCKED

**Stripe Payment Intent ID (if paid):** _______________

**Amount paid:** £___

---

## Known Failure Points

**Pay Deposit button does not appear:** The booking must have status = 'pending_payment'. Check the booking record. If status is 'confirmed' already without payment, the webhook fired early or data is incorrect.

**Stripe Checkout shows error:** Check that STRIPE_SECRET_KEY in Vercel is a live key (sk_live_*). Test keys (sk_test_*) will not work if Stripe is in live mode. Check assertStripeKey() logs in Vercel Function Logs.

**Webhook not processing:** Go to Stripe Dashboard / Developers / Webhooks. Confirm the endpoint https://www.elbold.com/api/payments/webhook is registered and the signing secret matches STRIPE_WEBHOOK_SECRET in Vercel.

**Customer email not received:** Check Resend dashboard. Confirm noreply@elbold.com is verified with DKIM/SPF.

---

## After Completing the Mission

Update docs/Phase4_LaunchReadinessReport.md Sections 4, 5, and 6 with real results from this test.

If the full payment cycle (Part 3) was completed with a real payment, record the Stripe Payment Intent ID as proof and note the date.

This is the single most important milestone in the entire pre-launch sprint. A completed quote, booking, and payment proves the marketplace works end-to-end for real users with real money.
