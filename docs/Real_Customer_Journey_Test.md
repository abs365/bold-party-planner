# Real Customer Journey Test Plan
**Version:** 1.0 | **Date:** 2026-06-09 | **Type:** Manual Execution Required

> **NOTE:** This is a structured test plan. Full execution requires a real browser, real email address, at least one approved and live vendor on the platform, and a Stripe test card. Stages 1–5 (browse and enquiry) can be tested without a live vendor. Stage 6+ (booking and payment) requires a live vendor with Stripe configured.

---

## Pre-Conditions

| Requirement | Check |
|-------------|-------|
| At least one vendor with status = 'approved' and sufficient profile data | SQL: `SELECT COUNT(*) FROM vendors WHERE status = 'approved'` |
| Stripe live mode webhook configured and receiving | Stripe Dashboard → Webhooks |
| Production URL accessible: https://www.elbold.com | Manual |
| Test email account (customer, different from vendor test account) | Manual |

---

## Stage 1: Homepage Discovery

**Action:** Open https://www.elbold.com in an incognito browser window.

**Expected:**
- Homepage loads with Elbold wordmark (new clean wordmark — no starburst)
- Hero section renders with category/location search
- Featured vendors section visible (if any vendors are live/approved)
- No JavaScript console errors

**PASS criteria:** Homepage renders completely. No 500 errors.

---

## Stage 2: Category Browse

**Action:**
1. Select a category from the homepage search (or navigate to /vendors)
2. Enter a city (e.g. "London")
3. Click search / browse

**Expected:**
- Results page shows matching vendors
- Each vendor card shows business name, category, city, rating (if any), starting price (if set)
- Filter and sort controls visible

**SQL verification:**
```sql
SELECT COUNT(*) FROM vendors WHERE status = 'approved' AND city ILIKE '%london%';
```

**PASS criteria:** Displayed count matches DB count.

---

## Stage 3: Vendor Profile View

**Action:** Click through to a vendor's profile page.

**Expected:**
- Full profile loads: business name, bio, category, city
- Portfolio links or photos visible
- Starting price visible (if set)
- "Request a Quote" or contact CTA visible

**PASS criteria:** Profile page renders without error. No missing data sections that break layout.

---

## Stage 4: Customer Authentication

**Action:**
1. Click "Request a Quote" or enquiry CTA
2. If not logged in, redirect to /login or /signup
3. Create customer account with test email
4. Verify email
5. Return to vendor profile

**Expected:**
- After auth, customer is redirected back to the vendor profile or enquiry flow
- Profile role is "customer" (not "vendor")

**SQL verification:**
```sql
SELECT id, role FROM profiles WHERE email = 'your-test-customer-email@example.com';
```

**Expected:** `role: 'customer'`

**PASS criteria:** Customer account created and role is correctly set to "customer".

---

## Stage 5: Enquiry / Quote Request

**Action:** Complete and submit the enquiry form for the vendor.

**Expected:**
- Enquiry submitted successfully
- Customer receives confirmation email
- Vendor receives notification
- Enquiry appears in vendor dashboard

**SQL verification:**
```sql
SELECT * FROM enquiries WHERE customer_id = (
  SELECT id FROM profiles WHERE email = 'your-test-customer-email@example.com'
)
ORDER BY created_at DESC LIMIT 1;
```

**PASS criteria:** Enquiry row created. Status: pending/open.

---

## Stage 6: Booking Flow (Requires Live Vendor)

> **Prerequisite:** A vendor must have accepted the enquiry and provided a quote.

**Action:** Customer accepts the quote and proceeds to payment.

**Expected:**
- Stripe Payment Intent created
- Checkout page renders with correct amount
- Platform fee (10%) visible or total amount stated

**PASS criteria:** Payment form renders. Stripe PI created in correct amount.

---

## Stage 7: Payment Processing

**Action:** Enter Stripe test card details and complete payment.

> In production (live mode), use a real card. In test mode, use `4242 4242 4242 4242`.

**Expected:**
- Payment succeeds
- Booking status updates to "confirmed" or "paid"
- Customer receives booking confirmation email
- Vendor receives booking notification
- Stripe webhook fires `payment_intent.succeeded`

**SQL verification:**
```sql
SELECT id, status, total_amount, platform_fee, vendor_fee, stripe_payment_intent_id
FROM bookings
WHERE customer_id = (
  SELECT id FROM profiles WHERE email = 'your-test-customer-email@example.com'
)
ORDER BY created_at DESC LIMIT 1;
```

**Expected:**
```
status: 'confirmed' or 'paid'
platform_fee: total_amount * 0.10
vendor_fee: total_amount * 0.90
stripe_payment_intent_id: 'pi_...'
```

**PASS criteria:** Booking confirmed. Fee split correct (10/90). Payment intent ID populated.

---

## Stage 8: Cancellation and Refund (Requires Completed Booking)

> **Pre-condition:** Booking is in a refundable state. Note BUG-002 below before executing.

> **⚠ BUG-002 WARNING:** The `issueRefundForCancellation` function contains void calls that do not await database updates. Until BUG-002 is fixed, refund processing may succeed in Stripe but silently fail to update the booking status in the database. **DO NOT test cancellation/refund in production until BUG-002 is fixed.**

**Action (after BUG-002 fix):**
1. Customer or admin initiates cancellation
2. Confirm refund amount and policy
3. Confirm the refund is processed

**SQL verification (after refund):**
```sql
SELECT id, status, refund_amount, refunded_at
FROM bookings
WHERE stripe_payment_intent_id = 'pi_...';
```

**Expected:** `status: 'refunded'`, `refund_amount` populated, `refunded_at` not null.

**PASS criteria:** Booking status updated. Refund recorded in DB.

---

## Stage 9: Review (Post-Event)

**Action:** After the event date, customer submits a review.

**Expected:**
- Review form accessible from booking or vendor profile
- Review stored and appears on vendor profile
- Vendor star rating updates

**PASS criteria:** Review submitted. Vendor average rating updated.

---

## Stage 10: Cleanup

After the test, remove test data to keep production clean.

```sql
-- Remove test enquiries and bookings (if in test mode)
DELETE FROM bookings WHERE customer_id = (
  SELECT id FROM profiles WHERE email = 'your-test-customer-email@example.com'
);
DELETE FROM enquiries WHERE customer_id = (
  SELECT id FROM profiles WHERE email = 'your-test-customer-email@example.com'
);
-- Remove auth user via Supabase Dashboard → Auth → Users
```

---

## Test Summary

| Stage | Description | Can Test Now | Blocker |
|-------|-------------|--------------|---------|
| 1 | Homepage discovery | YES | None |
| 2 | Category browse | YES | Requires ≥1 approved vendor |
| 3 | Vendor profile view | YES | Requires ≥1 approved vendor |
| 4 | Customer auth | YES | None |
| 5 | Enquiry submission | YES | Requires ≥1 approved vendor |
| 6 | Booking flow | CONDITIONAL | Requires vendor with live Stripe |
| 7 | Payment processing | CONDITIONAL | Requires live Stripe mode |
| 8 | Cancellation / refund | **NO — BUG-002** | Fix BUG-002 first |
| 9 | Review | CONDITIONAL | Requires completed booking |
| 10 | Cleanup | YES | None |

---

## Known Blockers

| Blocker | Impact |
|---------|--------|
| BUG-002: void calls in `issueRefundForCancellation` | Blocks stage 8 — do not test refund in production |
| Resend domain unverified | Emails may arrive in spam — does not block booking flow |
| No live vendors with Stripe configured | Blocks stages 6–9 |
