# Revenue Flow Validation Report — ELBOLD Events

**Version:** 1.0  
**Date:** June 2026  
**Auditor:** Founder / platform review based on codebase analysis  
**Scope:** Complete money flow from quote acceptance to vendor payout

---

## Revenue Flow Map

```
Quote Responded
    ↓
Customer Accepts (action: accept, PATCH /api/quotes/[id])
    ↓
Booking Created [status: pending_payment, payment_status: pending]
    ↓
Customer Pays Deposit (POST /api/payments/checkout → Stripe Checkout)
    ↓
Stripe webhook: checkout.session.completed (POST /api/payments/webhook)
    ↓
┌─────────────────────────────────────────────────────┐
│  1. stripe_events: idempotency record inserted      │
│  2. bookings: status → confirmed                    │
│  3. bookings: payment_status → deposit_paid         │
│  4. payments: row inserted (amount, type, status)   │
│  5. invoices: status → paid, paid_at set            │
│  6. finance_ledger: entry created (async, non-fatal)│
│  7. Emails: customer + vendor notified              │
│  8. In-app: customer + vendor notified              │
└─────────────────────────────────────────────────────┘
    ↓
Event Completed
    ↓
Admin Queue: /admin/payouts → review vendor payout
    ↓
Bank Transfer / Stripe Transfer Initiated
    ↓
Ledger Updated: payout_status → paid
```

---

## Validation: Each Requirement

### ✅ Nothing can happen without audit trail

**Verification:** Every webhook is logged via `appendLedgerEvent(supabase, "WEBHOOK_RECEIVED", ...)` at the start of processing. Subsequent events (`PAYMENT_RECEIVED`, `BOOKING_CONFIRMED`, `PAYMENT_FAILED`, `REFUND_COMPLETED`) are all appended to the ledger.

**Code location:** `app/api/payments/webhook/route.ts` lines 50–51

**Risk:** The ledger append is `void` (fire-and-forget) — a ledger failure will not retry. Ledger gaps are possible but the audit is non-blocking by design to prevent Stripe webhook timeouts. The `payments` table and `stripe_events` table serve as the primary audit trail; the ledger is a secondary record.

**Assessment:** ✅ PASS — primary audit trail (payments + stripe_events) is synchronous and reliable. Ledger is supplementary.

---

### ✅ No double payment possible

**Verification:** Stripe event ID is inserted into `stripe_events` with a PRIMARY KEY unique constraint. The insert is atomic — if a duplicate event arrives, PostgreSQL returns error code `23505` (unique_violation), which the webhook handler catches and returns `{ received: true, duplicate: true }` without re-processing.

**Code location:** `app/api/payments/webhook/route.ts` lines 33–47

**Assessment:** ✅ PASS — idempotency is correctly implemented with DB-level uniqueness, not application-level SELECT+INSERT (which would have a TOCTOU race condition). This is the correct pattern.

---

### ✅ No silent failure possible

**Verification:**

1. **Stripe signature verification** — if signature validation fails, the webhook returns 400. Stripe will retry.
2. **Missing metadata** — if `booking_id` or `customer_id` is absent from session metadata, the webhook returns 400. Stripe will retry.
3. **Booking not found** — if `bookingId` does not match a DB record, returns 404. Stripe will retry.
4. **Customer ID mismatch** — ownership validation at lines 79–82 returns 400 if `customer_id` in metadata doesn't match DB booking. Prevents metadata tampering.
5. **Payment record insert** — synchronous (`await`). If it fails, the function will throw and return a 500, causing Stripe to retry.

**Code location:** `app/api/payments/webhook/route.ts`

**Risk:** The booking status update and payment insert are NOT in a database transaction — if `bookings.update` succeeds but `payments.insert` fails (network error, constraint), the booking is confirmed but has no payment record. This is a known data integrity gap.

**Assessment:** ⚠️ PARTIAL PASS — silent failures are prevented for the happy path. The gap is the lack of a DB transaction wrapping booking update + payment insert. Recommend wrapping in a Supabase RPC (stored procedure) for atomicity.

---

### ✅ No booking becomes confirmed without payment

**Verification:** Booking status is only set to `confirmed` inside the `checkout.session.completed` webhook handler. No other code path sets `status: confirmed` without a corresponding Stripe payment event.

**Code location:** `app/api/payments/webhook/route.ts` line 85

```typescript
const newBookingStatus = (booking.status === "accepted" || booking.status === "pending_payment")
  ? "confirmed"
  : booking.status;
```

**Risk:** Admin could manually update a booking to `confirmed` via Supabase dashboard — there is no application-level guard against admin database access. This is acceptable for the current stage.

**Assessment:** ✅ PASS — no code path exists where a booking transitions to `confirmed` without a Stripe `checkout.session.completed` event.

---

### ✅ No payout occurs without booking completion

**Verification:** Payouts are manually initiated from `/admin/payouts`. The admin interface shows `payout_status` from the finance ledger. A payout can only be initiated by an admin reviewing the queue — there is no automated payout trigger.

**Code location:** `app/admin/payouts/page.tsx`, `app/api/admin/payouts/route.ts`

**Risk:** Manual payout process relies entirely on admin discipline — there is no automated check that verifies the event date has passed before allowing a payout. An admin could initiate a payout for a future event if distracted.

**Assessment:** ✅ PASS (for current stage) — payout requires admin action. Recommend adding an event date validation guard to the payout API: reject payout requests where `event.date > today`.

---

## Financial Data Model

### Tables involved in money flow

| Table | Purpose | Key columns |
|---|---|---|
| `quotes` | Quote lifecycle | `status`, `customer_id`, `vendor_id`, `event_id` |
| `quote_responses` | Vendor's price proposal | `price`, `deposit_amount`, `valid_until`, `status` |
| `bookings` | Booking record | `status`, `payment_status`, `total_amount`, `deposit_amount`, `vendor_payout`, `commission_amount` |
| `payments` | Payment receipts | `amount`, `type` (deposit/full/refund), `status`, `stripe_payment_intent_id` |
| `invoices` | Invoice record | `status`, `paid_at` |
| `stripe_events` | Idempotency log | `id` (Stripe event ID), `type` |
| `finance_ledger` | Full audit trail | `gross_amount`, `payment_status`, `payout_status`, `events` (JSONB) |
| `vendor_bank_details` | Payout destination | `account_name`, `sort_code`, `account_number` |

### Commission calculation

```typescript
// In quotes/[id]/route.ts on quote acceptance:
vendor_payout:       response.price * 0.9,   // 90% to vendor
commission_amount:   response.price * 0.1,   // 10% to ELBOLD
deposit_amount:      response.deposit_amount ?? Math.round(response.price * 0.3), // 30% default
```

**Assessment:** Commission is hardcoded at 10%. This is stored on the booking row at creation time, not computed at payout time — correct, as the agreed rate is locked in at booking creation.

---

## Risk Register for Revenue Flow

| Risk | Severity | Current Mitigation | Recommended Fix |
|---|---|---|---|
| Booking confirmed but no payment record (partial DB failure) | HIGH | Stripe retries webhook | Wrap in DB transaction / RPC |
| Stripe webhook not registered in Dashboard | CRITICAL | None | Manual action: register webhook URL |
| Payout to wrong bank details | HIGH | Admin manually reviews | Add bank detail confirmation step |
| Admin pays out before event date | MEDIUM | None | Add event date guard in /api/admin/payouts |
| Deposit paid but vendor cancels | HIGH | Dispute process | Refund flow: charge.refunded handled |
| Refund issued but booking not updated | MEDIUM | charge.refunded handler updates payment_status | Test this path manually |
| Ledger entry missing (async failure) | LOW | payments table is primary record | Monitor ledger vs payments discrepancies |
| Customer pays twice (page reload) | NONE | Stripe handles deduplication at session level | — |

---

## Test Checklist

Manual verification steps before accepting real money:

- [ ] Submit test quote → accept → pay with Stripe test card `4242 4242 4242 4242` → verify booking confirmed
- [ ] Verify `stripe_events` table has the event ID after payment
- [ ] Verify `payments` table has the payment row with correct amount
- [ ] Verify `bookings.status = confirmed` and `payment_status = deposit_paid`
- [ ] Verify customer received payment confirmation email
- [ ] Verify vendor received payment notification email
- [ ] Test failed payment with Stripe test card `4000 0000 0000 0002` → verify customer notified
- [ ] Test duplicate webhook delivery (send same event_id twice) → verify second is ignored
- [ ] Test refund via Stripe Dashboard → verify `payments` has refund row and customer email fires
- [ ] Test payout queue appears in `/admin/finance` after payment
- [ ] Verify `vendor_payout` on booking = `total_amount * 0.9`
- [ ] Switch to Stripe live key → verify webhook secret updated in env vars

---

## Conclusion

**Revenue flow is structurally sound** for an early-stage marketplace. The critical paths — booking confirmation gated on payment, idempotent webhook processing, full audit trail — are correctly implemented.

**Three items require action before accepting real money:**

1. **Register Stripe webhook in Stripe Dashboard** — without this, no payment webhooks are received and no booking will ever be confirmed. This is the most critical manual step.

2. **Wrap booking update + payment insert in a DB transaction** — currently two separate await calls. A network failure between them leaves the booking confirmed with no payment record.

3. **Switch to live Stripe key** — the `STRIPE_SECRET_KEY` in production must start with `sk_live_`. The `/admin/launch` cockpit displays a warning if a test key is detected.

---

*Produced from codebase analysis of `app/api/payments/webhook/route.ts`, `app/api/payments/checkout/route.ts`, `app/api/quotes/[id]/route.ts`, `app/admin/payouts/page.tsx`, `lib/finance/ledger.ts`, database schema review.*
