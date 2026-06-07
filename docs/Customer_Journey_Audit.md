# Customer Journey Audit — ELBOLD Events

**Version:** 1.0  
**Date:** June 2026  
**Auditor:** Founder / platform review based on codebase analysis  
**Scope:** New customer from first discovery to completed booking and payment

---

## Journey A — New Customer End-to-End

### Stage 1 — Discovery

**Entry points audited:**
- Google Search → Landing page
- Direct URL → `/`
- Social media link → `/`
- Word of mouth → `/`

**What the customer sees on homepage (`app/page.tsx`):**
- Hero: "Every Celebration Deserves Extraordinary Professionals."
- Quick-start occasion pills: Wedding, Birthday, Corporate, Anniversary, Cultural Events, Baby Shower
- Occasion editorial cards (6) → pre-filtered browse pages
- Trust bar: individually reviewed · Stripe-secured · verified reviews only
- Featured vendor strip
- ELBOLD Promise section (verified vendor count, 20+ categories, 100% reviewed, 90% satisfaction)
- Vendor benefits section
- Final CTA

**Friction identified:**
- ✅ No friction. Homepage is clear, visual, emotive.
- ⚠️ The ELBOLD Promise stat "90%" — currently a static placeholder. If it stays, it should reflect real review data eventually.
- ⚠️ Featured vendor section shows real vendors from DB — if no vendors exist yet, the section is empty. No fallback messaging for empty state.

**Trust signals above fold:**
- ✅ Trust bar visible immediately below nav
- ✅ ELBOLD Promise explains verification

---

### Stage 2 — Browse (`/browse`)

**Navigation path:** Homepage CTA or occasion pill → `/browse?event=wedding` (filtered) or `/browse` (discovery)

**Discovery mode (no filters):**
- Category photo cards shown (6 editorial cards)
- Trust strip: "Individually reviewed · Stripe-secured · Verified reviews only"
- Featured vendors dark strip

**Filtered mode:**
- Vendor cards rendered with category, city, rating, review count, verified badge, starting price
- Sidebar filters: category, location, budget, rating, verified only, event type

**Friction identified:**
- ✅ Filter UI is clear and functional
- ⚠️ If no vendors match filters, the empty state is plain text — consider a more helpful "no vendors in this area yet" message with a CTA to be notified
- ⚠️ Vendor cards show `verified` badge but not the verification *level* (ID verified vs Business Verified) — customers may not understand the difference
- ⚠️ "Starting from £X" — if vendor has no packages, no price is shown. Should show "Price on request" explicitly

**Emails at this stage:** None (browsing is anonymous)

---

### Stage 3 — Vendor Profile (`/vendors/[id]`)

**What the customer sees:**
- Hero: business name, category, city, verified badge, rating stars + review count
- Gallery: cover photo + media grid
- Packages: name, price, includes list, book button
- About: bio, description, verification level explanation
- Reviews: with star rating and comment (verified purchase badge)
- Similar vendors section

**Friction identified:**
- ✅ Verified badge is prominent
- ✅ Review authenticity is communicated ("from verified bookings only")
- ⚠️ No "response time" indicator on profile — vendor's `response_rate` field exists in DB but is not surfaced to customer
- ⚠️ If vendor has zero reviews, the reviews section is empty — no social proof. Consider showing a "Be the first to review" CTA
- ⚠️ The "Get a Quote" button requires signup — customer hits a wall if not logged in. The auth redirect is correct but there is no pre-login preview of the quote form
- ⚠️ Packages section: if vendor has no packages defined, the section is absent. "Get a Quote" button should still be visible with copy like "Custom pricing — request a quote"
- ⚠️ Vendor availability calendar is linked (`/api/vendor/availability`) but not prominently shown on the profile — customers cannot see if their date is available without contacting

**Emails at this stage:** None (viewing is anonymous)

---

### Stage 4 — Quote Request

**Pre-condition:** Customer must be signed in  
**Path:** `/vendors/[id]` → "Get a Quote" → auth wall → `/dashboard/bookings/new` or direct quote form

**Quote form collects:**
- Event type
- Event date
- Location
- Guest count
- Budget (optional)
- Requirements (free text)

**What happens after submission (`POST /api/quotes`):**
- Quote row created with status `pending`
- Vendor receives in-app notification: "Quote Request Received"
- Vendor receives email: `sendQuoteRequestToVendor` — ✅ confirmed wired

**Friction identified:**
- ✅ Notification and email confirmed wired
- ⚠️ Customer receives NO email confirmation that their quote was sent. They only see an in-app success state. A "Quote submitted — you'll hear back within 48 hours" email would reduce anxiety
- ⚠️ No estimated response time shown after submission. Vendor SLA is not communicated at point of request
- ⚠️ Customer cannot see quote status in real-time — they must navigate to `/dashboard/quotes` to check. Push notification would help
- ⚠️ If the vendor declines, customer receives an in-app notification but the email for vendor decline (`vendor_decline` action) fires `notify_user` only — no email is sent to the customer

**Missing email:** "Your quote has been submitted to [Vendor Name]" — fire immediately on POST /api/quotes

---

### Stage 5 — Receive Quote Response

**Trigger:** Vendor submits quote response (action: `respond`)

**What customer receives:**
- In-app notification: "Quote Response Received — Review your quotes."
- Email: `sendQuoteResponseToCustomer` ✅ wired in quotes/[id]/route.ts

**Customer view at `/dashboard/quotes/[id]`:**
- Vendor quote: price, deposit amount, description, services included, validity date
- Accept / Reject buttons
- Shortlist option
- Quote comparison at `/dashboard/quotes/compare`

**Friction identified:**
- ✅ Email confirmed wired
- ✅ Deposit amount shown clearly before acceptance
- ⚠️ Quote expiry date (`valid_until`) is shown but not highlighted — customer may not realise the quote expires
- ⚠️ No explanation of what "accepting" means — that it creates a binding booking requiring deposit payment. Consider a modal or confirmation step: "Accepting this quote creates a booking and requires a deposit payment of £X to confirm your date."
- ⚠️ Quote comparison (`/dashboard/quotes/compare`) is available but not prominently linked from the individual quote view

---

### Stage 6 — Accept Quote → Booking Created

**Trigger:** Customer clicks Accept (action: `accept`)

**What happens:**
- Booking created: `status: pending_payment`, `payment_status: pending`
- Quote marked: `status: converted`
- Other quotes for same event automatically rejected
- Vendor in-app notification: "Quote Accepted — Awaiting Payment"
- Customer in-app notification: "Booking Created — Pay Deposit to Confirm"
- Vendor email: `sendQuoteAcceptedToVendor` ✅ wired
- Customer email: `sendBookingAwaitingPayment` ✅ wired (deposit amount, booking link)

**Friction identified:**
- ✅ Customer email confirmed wired with deposit amount and booking link
- ✅ Vendor notified correctly
- ⚠️ The booking is in `pending_payment` state — if the customer does not pay the deposit, the booking is never confirmed and the vendor's date is not officially blocked. Vendor may provisionally block the date manually. A time-limited hold (e.g. 48h) should be communicated.
- ⚠️ No countdown timer shown to customer on the booking page — "Pay within 48 hours to secure your date" would improve conversion

---

### Stage 7 — Deposit Payment (`/dashboard/bookings/[id]`)

**Payment path:** Booking page → "Pay Deposit" button → Stripe Checkout → webhook → confirmation

**Stripe flow:**
- `POST /api/payments/checkout` creates Stripe Checkout session with metadata: `booking_id`, `customer_id`, `payment_type`, `amount`
- Customer redirected to Stripe-hosted checkout
- On success, webhook `checkout.session.completed` fires

**Webhook processing:**
- Booking updated: `status: confirmed`, `payment_status: deposit_paid`
- Payment record inserted
- Invoice marked paid
- Ledger entry created (non-fatal)
- Idempotency: Stripe event ID inserted into `stripe_events` with unique constraint — duplicate webhooks handled correctly
- Customer email: `sendPaymentReceived` ✅ wired
- Vendor email: `sendVendorPaymentNotification` ✅ wired
- Customer in-app: "Payment Confirmed ✅"
- Vendor in-app: "Payment Received"

**Friction identified:**
- ✅ Full audit trail: Stripe event → payment row → ledger → booking status → emails + notifications
- ✅ Idempotency correctly implemented with unique constraint (not SELECT+INSERT race)
- ✅ Ownership validation: `customer_id` in metadata checked against booking DB record
- ⚠️ Payment failure scenario: if `payment_intent.payment_failed`, customer receives in-app notification and email. But if customer closes the Stripe tab without paying (and no failure event fires), no notification is sent — the booking sits in `pending_payment` silently. A cron job checking for 48h-old pending_payment bookings would help.
- ⚠️ After Stripe success redirect, the customer lands on `/payment/success`. This page should clearly show the booking reference, vendor name, and next steps. If the webhook fires before the redirect page loads, the booking will be confirmed; if the webhook is delayed, the page may still show pending. Ensure success page refreshes booking status.

---

### Stage 8 — Booking Confirmation

**Customer experience post-payment:**
- Booking status: `confirmed`
- Customer dashboard: `/dashboard/bookings/[id]` shows confirmed status with vendor contact
- Vendor dashboard: `/vendor/bookings/[id]` shows confirmed with customer contact

**Pre-event reminders:** Cron job `/api/cron/reminders` fires reminder emails before event date

**Post-event flow:**
- Customer asked to leave a review (review request email expected from cron/reminders)
- Review submitted via `/api/reviews`
- Review only visible after admin moderation ✅

**Friction identified:**
- ✅ Booking detail page shows all key information
- ⚠️ No "add to calendar" option — event date is stored but not exportable as .ics
- ⚠️ No messaging thread visible on booking detail page — customers must navigate to `/dashboard/messages` separately
- ⚠️ Review request timing: cron-based — verify `CRON_SECRET` is set and cron is registered in Vercel dashboard

---

## Summary of Friction Points by Severity

### 🔴 HIGH — Fix Before First Real User
| Issue | Location | Fix |
|---|---|---|
| No confirmation email after quote submission | POST /api/quotes | Add sendQuoteSubmittedToCustomer |
| Customer not emailed when vendor declines | PATCH /api/quotes/[id] vendor_decline | Add sendVendorDeclinedToCustomer |
| No time-limited hold communicated to customer post-acceptance | Booking creation | Add 48h message to sendBookingAwaitingPayment |

### 🟡 MEDIUM — Fix Before Launch
| Issue | Location | Fix |
|---|---|---|
| No accept-quote confirmation modal | /dashboard/quotes/[id] | Add "This creates a confirmed booking requiring £X deposit" modal |
| Quote expiry not highlighted | Quote view | Add amber warning if valid_until < 48h |
| Empty vendor section on homepage | app/page.tsx | Add "More vendors joining soon" message |
| Missing "Price on request" on profileless vendors | /vendors/[id] | Fallback text if no packages |

### 🟢 LOW — Post-Launch
| Issue | Location | Fix |
|---|---|---|
| Response time not shown on vendor profile | /vendors/[id] | Surface response_rate from DB |
| No calendar export | Booking detail | Add .ics download |
| Stuck payment cron | /api/cron/reminders | Add 48h pending_payment check |

---

## Emails — Complete Map

| Trigger | To | Template |
|---|---|---|
| Quote requested | Vendor | sendQuoteRequestToVendor |
| Quote responded | Customer | sendQuoteResponseToCustomer |
| Quote accepted | Vendor | sendQuoteAcceptedToVendor |
| Booking created (awaiting payment) | Customer | sendBookingAwaitingPayment |
| Payment succeeded | Customer | sendPaymentReceived |
| Payment succeeded | Vendor | sendVendorPaymentNotification |
| Payment failed | Customer | sendBookingPaymentFailed |
| Refund processed | Customer | sendRefundProcessed |
| **MISSING** | Customer | Quote submitted confirmation |
| **MISSING** | Customer | Vendor declined notification |

---

*Produced from codebase analysis of `app/page.tsx`, `app/browse/page.tsx`, `app/vendors/[id]/page.tsx`, `app/api/quotes/route.ts`, `app/api/quotes/[id]/route.ts`, `app/api/payments/checkout/route.ts`, `app/api/payments/webhook/route.ts`, `lib/resend/index.ts`.*
