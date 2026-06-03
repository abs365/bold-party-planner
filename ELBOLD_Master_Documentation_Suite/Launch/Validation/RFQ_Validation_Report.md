# RFQ / Quote Flow — Technical Validation Report

**Document:** RFQ_Validation_Report  
**Phase:** 28C  
**Updated:** 2026-06-03  
**Status:** ⬜ AWAITING LIVE VALIDATION

---

## Purpose

This report documents every technical component involved in the RFQ (Request for Quote) flow, provides the expected behaviour at each step, and records the live validation results when run with real testers.

---

## Flow Overview

```
Customer → Create RFQ → [System stores] → Vendor notified
→ Vendor responds → Customer notified
→ Customer accepts → Booking created → Payment triggered
→ Admin can see entire flow
```

---

## Step-by-Step Technical Breakdown

### Step 1 — Customer Creates a Quote Request

**Trigger:** Customer clicks "Request Quote" on `/vendors/[id]` and submits form at `/dashboard/quotes/new`

**API route:** `POST /api/quotes`  
**File:** `app/api/quotes/route.ts`

**Data written to database:**

| Table | Columns written | Notes |
|---|---|---|
| `quotes` | `customer_id`, `vendor_id`, `event_id`, `status`, `city`, `notes`, `category`, `budget_min`, `budget_max`, `guest_count`, `lead_score`, `created_at` | `status = 'pending'`; `lead_score` calculated by `scoreLead()` |
| `quote_events` | `quote_id`, `actor_id`, `action`, `created_at` | Audit trail: `quote.created` |
| `analytics_events` | `event`, `user_id`, `properties` | `quote.created` event tracked |

**Email triggered:** `sendQuoteRequestToVendor()` — vendor receives "New quote request" email  
**File:** `lib/resend/index.ts`

**Dashboard updated:**
- Customer: `/dashboard/quotes` — new quote appears with status "Awaiting Response"
- Vendor: `/vendor/quotes` — new lead appears, sorted by lead_score

**Validation check:**

| Check | Expected | Result | Date |
|---|---|---|---|
| `quotes` row created in DB | `status = 'pending'`, correct vendor_id and customer_id | | |
| `lead_score` calculated | Value between 0–100 | | |
| `quote_events` audit entry | `action = 'quote.created'` | | |
| Vendor email received | Within 90 seconds of submission | | |
| Quote visible in `/vendor/quotes` | Shows in vendor lead list | | |
| Quote visible in `/dashboard/quotes` | Shows with "Awaiting Response" status | | |

---

### Step 2 — Vendor Views the Lead

**Trigger:** Vendor opens quote in `/vendor/quotes`

**API route:** `PATCH /api/quotes/[id]` with `action: "view"`  
**File:** `app/api/quotes/[id]/route.ts`

**Data written:**

| Table | Columns written |
|---|---|
| `quotes` | `viewed_at = now()`, `status = 'viewed'` |
| `quote_events` | `action = 'quote.viewed'` |

**Dashboard updated:** Customer quote shows "Viewed" timestamp (not surfaced to customer in current UI — internal tracking only)

---

### Step 3 — Vendor Submits Quote Response

**Trigger:** Vendor fills response form and submits in `/vendor/quotes`

**API route:** `PATCH /api/quotes/[id]` with `action: "respond"`

**Data written:**

| Table | Columns written | Notes |
|---|---|---|
| `quotes` | `status = 'responded'`, `responded_at = now()` | |
| `quote_responses` | `quote_id`, `vendor_id`, `title`, `price`, `deposit_amount`, `description`, `services`, `message`, `terms`, `duration_hours`, `valid_until` | Full response record |
| `quote_events` | `action = 'quote.responded'` | Audit |
| `analytics_events` | `quote.responded` | Tracking |

**Email triggered:** `sendQuoteResponseToCustomer()` — customer receives "New response from [Vendor]"  
**File:** `lib/resend/index.ts`

**Dashboard updated:**
- Customer: `/dashboard/quotes/[id]` — "New Response!" banner, response details visible
- Customer: can now see price, deposit, inclusions, terms

**Validation check:**

| Check | Expected | Result | Date |
|---|---|---|---|
| `quote_responses` row created | All response fields stored | | |
| `quotes.status` updated | `responded` | | |
| `quotes.responded_at` set | Timestamp present | | |
| Customer email received | Within 90 seconds | | |
| Response visible in `/dashboard/quotes/[id]` | Price, inclusions, terms shown | | |

---

### Step 4 — Customer Compares (Optional — 2+ responses)

**Trigger:** Customer has received 2+ responses for same event

**Route:** `/dashboard/quotes/compare?event_id=[id]`  
**File:** `app/dashboard/quotes/compare/page.tsx`

**Behaviour:**
- Side-by-side vendor cards with price, trust signals, inclusions
- "Lowest price" badge on cheapest response
- "Accept" CTA per vendor card

---

### Step 5 — Customer Accepts Quote

**Trigger:** Customer clicks "Accept" on quote in `/dashboard/quotes/[id]`

**API route:** `PATCH /api/quotes/[id]` with `action: "accept"`

**Data written:**

| Table | Columns written | Notes |
|---|---|---|
| `quotes` | `status = 'accepted'`, `accepted_at = now()` | This quote |
| `quotes` (others) | `status = 'rejected'` | All other open quotes for same event auto-rejected |
| `bookings` | `customer_id`, `vendor_id`, `event_id`, `quote_id`, `package_id`, `amount`, `deposit_amount`, `status = 'confirmed'` | New booking created |
| `quote_events` | `action = 'quote.accepted'` | Audit |
| `analytics_events` | `quote.accepted`, `booking.confirmed` | Tracking |

**Email triggered:**
- `sendQuoteAcceptedToVendor()` — vendor receives "Booking confirmed" email
- Customer: Stripe checkout session created for deposit

**Dashboard updated:**
- Customer: booking appears in `/dashboard/bookings`
- Vendor: booking appears in `/vendor/bookings`

**Validation check:**

| Check | Expected | Result | Date |
|---|---|---|---|
| Accepted quote `status = 'accepted'` | Confirmed in DB | | |
| Other quotes auto-rejected | `status = 'rejected'` for all siblings | | |
| `bookings` row created | Correct customer_id, vendor_id, amount | | |
| Vendor receives "Booking confirmed" email | Within 90 seconds | | |
| Booking visible in `/dashboard/bookings` | Status: Confirmed | | |
| Booking visible in `/vendor/bookings` | Status: Confirmed | | |

---

### Step 6 — Payment (Deposit)

**Trigger:** Customer proceeds to Stripe checkout after accepting quote

**API route:** `POST /api/payments/checkout`  
**File:** `app/api/payments/checkout/route.ts`

**Data written:**

| Table | Columns written |
|---|---|
| `bookings` | `status = 'deposit_paid'`, `stripe_payment_intent_id` |
| `stripe_events` | Full Stripe webhook event logged |

**Stripe webhook:** `app/api/payments/webhook/route.ts` — handles `payment_intent.succeeded`

**Email triggered:** Booking confirmation email (if not already sent at accept step)

**Validation check:**

| Check | Expected | Result | Date |
|---|---|---|---|
| Stripe checkout session opens | Correct amount, vendor name | | |
| Payment completes (test card 4242 4242...) | Redirect to `/payment/success` | | |
| `bookings.status = 'deposit_paid'` | Updated in DB | | |
| Stripe webhook received and processed | No webhook errors in Vercel logs | | |

---

### Step 7 — Admin Visibility

**Admin can see the complete flow at:**

| View | Route | What is shown |
|---|---|---|
| Quote pipeline | `/admin/quotes` | All quotes, statuses, lead scores |
| Bookings | `/admin/bookings` | All bookings, amounts, statuses |
| Customer activity | `/admin/customers` | Customer event and booking counts |
| Vendor activity | `/admin/vendors` | Vendor quote response rate |
| Revenue | `/admin/analytics` | MRR, booking revenue |

**Validation check:**

| Check | Expected | Result | Date |
|---|---|---|---|
| Test RFQ appears in `/admin/quotes` | Status = accepted | | |
| Test booking appears in `/admin/bookings` | Amount and status correct | | |
| Test customer visible in `/admin/customers` | Event and booking count updated | | |

---

## RFQ Validation Summary

| Step | Description | Status |
|---|---|---|
| 1 | Customer creates RFQ | ⬜ |
| 2 | Vendor views lead | ⬜ |
| 3 | Vendor responds | ⬜ |
| 4 | Customer compares (optional) | ⬜ |
| 5 | Customer accepts | ⬜ |
| 6 | Payment | ⬜ |
| 7 | Admin visibility | ⬜ |

**Overall RFQ Flow Status:** ⬜ AWAITING LIVE VALIDATION

**Signed off:** `_______________`  **Date:** `_______________`
