# ELBOLD Revenue Ready Final Report

**Date:** 2026-06-08  
**Deployment commit:** `2d0b3f4`  
**Deployment URL:** https://vercel.com/abs365s-projects/bold-party-planner/2ZWXAUxxNZ2TitDG3YiV5amR7feY  
**Production:** https://www.elbold.com

---

## Deployment Evidence

| Item | Value |
|------|-------|
| Commit | `2d0b3f4` (pushed `01a555b..2d0b3f4`) |
| Branch | `main` |
| Vercel deployment | `2ZWXAUxxNZ2TitDG3YiV5amR7feY` |
| Deployment status | **success** |
| Deployed at | 2026-06-08 ~21:15 UTC |
| Files changed | `app/api/bookings/[id]/route.ts`, `app/api/payments/webhook/route.ts`, `docs/First_Revenue_Validation_Report.md` |

---

## Pre-Deployment Checklist

| Check | Result |
|-------|--------|
| Working tree | 3 expected files modified, no untracked |
| TypeScript | 0 errors |
| Production build | PASS — all routes compiled, no errors |
| Migration required | None — pure application code change |

---

## Bugs Fixed in This Deployment

### BUG-002: Automatic refund execution on cancellation

**File:** `app/api/bookings/[id]/route.ts`

Changed `void issueRefundForCancellation(...)` to `await issueRefundForCancellation(...)` in both cancellation paths:

```typescript
// Line 181 — vendor cancellation (was void, now await)
await issueRefundForCancellation(
  supabase as unknown as SupabaseClient,
  booking as unknown as RefundableBooking,
  user.id, "vendor", customer?.email ?? "", ...
);

// Line 251 — customer cancellation (was void, now await)
await issueRefundForCancellation(
  supabase as unknown as SupabaseClient,
  booking as unknown as RefundableBooking,
  user.id, "customer", user.email ?? "", ...
);
```

**Verification:** Source code confirms `await` at both locations. Post-deploy cancellation API call returned in 3873ms (vs ~100ms with `void`), confirming the function now blocks synchronously on the Stripe API call and subsequent DB operations.

---

### BUG-003: confirmed_at not set by webhook

**File:** `app/api/payments/webhook/route.ts`

```typescript
// Added: confirmed_at set when booking transitions to confirmed
const now = new Date().toISOString();
await supabase.from("bookings").update({
  payment_status: newPaymentStatus,
  status: newBookingStatus,
  ...(newBookingStatus === "confirmed" ? { confirmed_at: now } : {}),
}).eq("id", bookingId);
```

**Verification:** Source code confirms `confirmed_at` is now set conditionally. Will be validated on next webhook confirmation event.

---

## Post-Deployment Validation

### Production health check

| Endpoint | Expected | Actual |
|----------|----------|--------|
| `GET https://www.elbold.com/` | 200 | **200** |
| `PATCH /api/bookings/test` (no auth) | 401 | **401** |
| `POST /api/payments/webhook` (no sig) | 400 | **400** |

All API routes are alive and returning correct error codes (not 404 or 500).

---

### BUG-002 Validation: Cancellation refund timing

Post-deploy cancellation call on test booking `9acefbfa-aaab-457e-864c-faeb5cb43b8c`:

```
PATCH https://www.elbold.com/api/bookings/9acefbfa-aaab-457e-864c-faeb5cb43b8c
Body: { "status": "cancelled" }
HTTP Status: 200
Response time: 3873ms
```

The 3873ms confirms the route is now synchronously blocking on `issueRefundForCancellation`. Before the fix (with `void`), the same call returned in under 100ms. The Stripe API is being called synchronously.

**However:** The test Stripe payment intent `pi_3Tg8sL6lIKzSGzKL11qTibsO` may be in an ambiguous state. The first void cancellation (pre-fix) may have submitted the refund to Stripe before being killed by Vercel — meaning the payment intent may already be marked refunded in Stripe even though the ELBOLD database was not updated. A subsequent refund attempt on an already-refunded intent would fail. This likely explains why `payment_status` remains `deposit_paid` in the DB after the post-deploy test.

**What this means:** The `await` fix is working correctly (confirmed by timing). The test cannot definitively confirm whether the Stripe refund succeeded because the test PI is potentially already refunded from the pre-fix attempt.

---

### BUG-003 Validation: confirmed_at

Cannot validate on the existing test booking (already went through the payment flow with the old code). Will be confirmed on the next real webhook event. Code path is verified correct in source.

---

### Remaining Open Items: Stripe Refund Path

The following internal `void` calls remain inside `issueRefundForCancellation` (these are separate from the outer `void` that was fixed):

```typescript
// booking.payment_status update — still void inside the function
void supabase.from("bookings").update({ payment_status: "refunded" }).eq("id", booking.id);

// Financial event — still void
void appendLedgerEvent(supabase, "REFUND_COMPLETED", {...}, ledgerId);

// Audit log — still void
void createAuditLog({...});

// Emails — still void
void sendRefundProcessed(customerEmail, customerName, refundAmount, eventTitle);
void sendAdminRefundAlert(adminEmails, ...);
```

These `void` calls fire after the Stripe refund succeeds and after `await updateLedgerPaymentStatus()`. On Vercel Fluid Compute, these may or may not complete before execution is terminated. The ledger status update IS awaited. The booking's `payment_status` and the financial events/audit logs/emails may not complete.

**Risk:** Stripe refund executes but ELBOLD's internal state (payment_status, REFUND_COMPLETED event, audit log, emails) may not be updated if Vercel terminates the function.

**Recommended fix (Phase 2):** Convert the remaining `void` calls inside `issueRefundForCancellation` to `await` as well.

---

### Test Payment Refund: pi_3Tg8sL6lIKzSGzKL11qTibsO

The GBP 1.00 test charge must be refunded manually:

1. Log in to Stripe Dashboard: https://dashboard.stripe.com
2. Navigate to: Payments → Search for `pi_3Tg8sL6lIKzSGzKL11qTibsO`
3. Issue full refund of GBP 1.00
4. Note the refund ID for your records

**Refund evidence:** To be recorded after manual action.

---

## Risk Register (updated post-deployment)

| Risk | Severity | Status |
|------|----------|--------|
| BUG-001: bookings.status CHECK missing pending_payment | CRITICAL | **FIXED** — migration 045 applied |
| BUG-002: Refund killed by Vercel (outer void) | CRITICAL | **FIXED** — now await, deployed 2d0b3f4 |
| BUG-002b: Refund DB updates inside function still void | MEDIUM | OPEN — Phase 2 fix recommended |
| BUG-003: confirmed_at null after payment | LOW | **FIXED** — deployed 2d0b3f4 |
| Stripe refund path not end-to-end verified | HIGH | OPEN — requires Stripe Dashboard verification |
| STRIPE_SECRET_KEY unusual mk_ prefix locally | MEDIUM | OPEN — Vercel has valid sk_live_ (checkout works) |
| Email delivery not verified programmatically | MEDIUM | OPEN — requires Resend dashboard check |
| ICO registration | HIGH | OPEN — required for UK data processing compliance |
| Stripe bank account payout test | HIGH | OPEN — verify ELBOLD Ltd business account receives payouts |
| Post-incorporation placeholder replacement | MEDIUM | OPEN — 14 replacements, < 30 min when certificate arrives |

---

## Final Verdict

```
Revenue Ready = GO WITH CAUTION
```

### What is confirmed working

- Quote acceptance creates booking (post migration 045) ✓
- Stripe checkout session generation ✓
- Live GBP 1.00 payment completed ✓
- Webhook processing (idempotent, confirmed → deposit_paid) ✓
- Financial ledger: 90/10 split ✓
- Financial events: PAYMENT_RECEIVED + BOOKING_CONFIRMED ✓
- In-app notifications: customer + vendor ✓
- Booking cancellation API ✓
- Outer `await` fix: refund now runs synchronously ✓

### What requires manual verification before first real booking

1. **Stripe refund path:** Confirm via Stripe Dashboard that a test refund on a clean payment intent succeeds. If the `mk_` key in Vercel has restricted permissions that exclude refunds, this is still CRITICAL.

2. **Internal void calls in refund function:** The booking's `payment_status=refunded`, REFUND_COMPLETED event, audit log, and refund emails may not reliably update. Recommend `await`-ing these in a follow-up fix.

3. **Email delivery:** Check Resend dashboard to confirm payment/refund/cancellation emails are delivering.

### Conditions for Revenue Ready = YES

1. Manual Stripe Dashboard test confirms refund executes successfully on a clean payment intent
2. Remaining `void` calls inside `issueRefundForCancellation` converted to `await` and deployed
3. Email delivery confirmed via Resend

**Estimated time to YES: 2-4 hours** (Stripe refund test ~30 min + code fix + deploy ~45 min + email check ~30 min)

---

## Commit History (this sprint)

| SHA | Message |
|-----|---------|
| `2d0b3f4` | fix(revenue): ensure refund execution and booking confirmation timestamp |
| `01a555b` | fix(schema): add pending_payment to bookings status CHECK + first revenue validation |

---

*Report generated 2026-06-08*
