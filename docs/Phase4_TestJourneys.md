# ELBOLD Phase 4 — Live Test Journey Guides

**Date:** 2026-06-07  
**Purpose:** Step-by-step instructions for running Missions 3, 4, and 5 with real accounts.

Use two browser sessions: one logged in as a customer, one logged in as a vendor (or use incognito for one).

---

## MISSION 3 — First Live Quote

**Pre-conditions:**
- At least 1 approved vendor with 1+ service package
- A customer account (can be a personal email different from vendor/admin)

### Steps

**Customer Session**

1. Go to `/browse` → find the approved vendor → click their card
2. On the vendor profile page, click **"Request a Quote"** button
3. Fill in the quote form:
   - Event type: select something appropriate (e.g. Birthday Party)
   - Event date: pick a date 4+ weeks out
   - Budget: set a realistic figure (e.g. £300–£800)
   - Guest count: any number
   - Requirements: write a short note about what you need
4. Submit. You should see a confirmation screen.

**What to verify (customer side):**
- [ ] Confirmation screen appears with a summary of the request
- [ ] Customer receives confirmation email (`sendQuoteSubmittedToCustomer`)
- [ ] Quote appears in customer's dashboard/messages

**Vendor Session**

5. Open the vendor's dashboard at `/vendor/dashboard`
6. Check: notification badge should appear (bell icon)
7. Go to `/vendor/quotes`
8. Find the new quote request — status should be "pending"
9. Check vendor email inbox: `sendQuoteRequestToVendor` should have arrived

**What to verify (vendor side):**
- [ ] In-app notification received
- [ ] Email received with event details, budget, expiry date
- [ ] Quote shows in `/vendor/quotes` with correct details

**Vendor responds:**

10. Click the quote → click "Respond" / "Send Quote"
11. Fill in: price, deposit amount, message, any terms
12. Submit the response

**What to verify after response:**
- [ ] Quote status changes to "responded"
- [ ] Customer receives email notification (`sendQuoteResponseToCustomer`)
- [ ] Customer can see the vendor's price and message in their dashboard

**Capture:**
- Response time: record the gap between step 4 and step 11
- Screenshot: vendor quote inbox before/after response
- Screenshot: customer quote view with vendor price

---

## MISSION 4 — First Live Booking

**Pre-conditions:** Complete Mission 3 first. You need a quote in "responded" status.

### Steps

**Customer Session**

1. Go to the quote view (dashboard or notification link)
2. Review the vendor's quoted price and deposit requirement
3. Click **"Accept Quote"** / **"Book This Vendor"**
4. You should see a booking confirmation screen

**What to verify:**
- [ ] Booking record created in Supabase (`bookings` table)
- [ ] Booking status = `pending_payment` or `confirmed`
- [ ] Vendor receives notification and email (`sendQuoteAcceptedToVendor`)
- [ ] Customer receives email (`sendBookingAwaitingPayment`)
- [ ] New booking appears in vendor's `/vendor/bookings`
- [ ] New booking appears in customer's `/dashboard` or `/customer/bookings`

**Admin verification:**
5. Go to `/admin/bookings` — confirm the booking record is visible
6. Note the booking ID and status in the database

**Capture:**
- Screenshot: booking created confirmation
- Screenshot: booking in vendor dashboard
- Screenshot: email received by vendor
- Booking ID for Mission 5

---

## MISSION 5 — First Live Payment

**Pre-conditions:** Complete Mission 4. You need a booking in `pending_payment` status.

⚠️ **Use Stripe test mode first.** Confirm `STRIPE_SECRET_KEY` starts with `sk_test_` before running. Only switch to live keys after a successful test run.

**Stripe test cards:**
- Success: `4242 4242 4242 4242` — any future date — any CVV
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Steps

**Customer Session**

1. On the booking page (or email link), click **"Pay Deposit"** / **"Confirm Booking"**
2. You are redirected to Stripe Checkout
3. Enter test card `4242 4242 4242 4242` with any future expiry and any CVV
4. Complete the payment

**What to verify (payment flow):**
- [ ] Stripe Checkout loads correctly with the right amount (30% deposit)
- [ ] Currency is GBP
- [ ] Booking name and vendor name appear in the Stripe checkout description
- [ ] Payment completes and redirects to `/payment/success?session_id=...&booking_id=...`
- [ ] Success page shows correct booking summary

**What to verify (webhook processing):**
5. Go to `/admin/bookings` — booking `payment_status` should be `deposit_paid`
6. Booking `status` should be `confirmed`
7. Check `payments` table in Supabase — payment record should exist with:
   - `amount` = deposit amount
   - `commission_amount` = 10% of total
   - `status` = `succeeded`
   - `stripe_payment_intent_id` populated
8. Check customer email: `sendPaymentReceived` should have arrived
9. Check vendor email: `sendVendorPaymentNotification` should have arrived

**What to verify (Stripe Dashboard):**
10. Log into Stripe Dashboard → Payments → confirm the payment appears
11. Note the Payment Intent ID — it should match the record in Supabase

**Test the decline path (optional):**
12. Create a second test booking and attempt payment with `4000 0000 0000 0002`
13. Verify: error message shown on checkout, booking remains `pending_payment`, email sent

**Capture:**
- Screenshot: Stripe Checkout page with correct amount
- Screenshot: `/payment/success` page
- Screenshot: Booking in admin panel showing `confirmed` + `deposit_paid`
- Screenshot: Payment in Stripe Dashboard
- Screenshot: Payment received email (customer)
- Screenshot: Payment notification email (vendor)

---

## Evidence Log Template

Fill this in after completing each mission:

| Mission | Date | Completed By | Evidence Location | Notes |
|---|---|---|---|---|
| Mission 3 — Quote | | | | Response time: __ mins |
| Mission 4 — Booking | | | | Booking ID: __ |
| Mission 5 — Payment | | | | Payment Intent: __ |

---

## Common Issues

**Quote form not showing:** Vendor has no packages → go to `/vendor/services` and create one first.

**Email not received:** Check spam. Verify `RESEND_API_KEY` is set in Vercel env vars. Check Resend dashboard for delivery status.

**Stripe redirect fails:** Check `NEXT_PUBLIC_APP_URL` env var is correct — this is used to build success/cancel URLs.

**Webhook not firing locally:** Use `stripe listen --forward-to localhost:3000/api/payments/webhook` with the Stripe CLI. On Vercel, webhooks fire automatically.

**Payment amount wrong:** Deposit = 30% of booking total. Total comes from the quote `total_amount`. Check that the quote response has a valid price.
