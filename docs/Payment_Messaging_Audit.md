# Payment Messaging Audit

**Date:** 2026-06-08  
**Sprint:** Marketplace Review Round 2 — Priority 3  
**Status:** COMPLETE — all instances corrected

---

## Context

ELBOLD uses **direct charges** (not Stripe Connect). When a customer pays a deposit:
- The payment is **processed by Stripe** (the payment processor)
- The funds land in **ELBOLD's Stripe account** (not a neutral escrow)
- ELBOLD controls when the vendor is paid out
- Stripe does not independently hold the money as an escrow agent

The phrase **"Stripe holds your deposit"** implies Stripe is an escrow holder. This is inaccurate and potentially misleading — especially on the Our Commitments page which went further and claimed "ELBOLD cannot access or redirect your deposit payment," which is factually false.

**Approved wording (from founder brief):**
> "Payments are processed securely through Stripe. Customer deposits are managed by ELBOLD according to the Booking Protection and Refund Policy."

---

## Files Corrected

### Critical — Factually incorrect statements

| File | Line | Old Wording | New Wording | Severity |
|------|------|-------------|-------------|----------|
| `app/our-commitments/page.tsx` | 31 | "processed and held by Stripe, not by ELBOLD and not by the vendor. ELBOLD cannot access or redirect your deposit payment." | "processed securely through Stripe and managed by ELBOLD according to the Booking Protection and Refund Policy." | CRITICAL |
| `app/our-commitments/page.tsx` | 30 | "Your deposit is held by Stripe until after your event." | "Your deposit is secured until after your event." | HIGH |

### High visibility — Customer-facing UI

| File | Line | Old Wording | New Wording |
|------|------|-------------|-------------|
| `components/ui/BookingPromise.tsx` | 51 | "30% deposit held by Stripe, not released until your event" | "30% deposit processed through Stripe, managed by ELBOLD until your event" |
| `components/vendor/VendorProfileView.tsx` | 636 | "Deposit held by Stripe until event" | "Deposit secured through Stripe, managed by ELBOLD" |
| `app/payment/success/page.tsx` | 104 | "Deposit held securely by Stripe" | "Deposit secured through Stripe, managed by ELBOLD" |

### Marketing pages

| File | Line | Old Wording | New Wording |
|------|------|-------------|-------------|
| `app/page.tsx` (homepage) | 299 | "Money held safely by Stripe" | "Payments secured through Stripe" |
| `app/page.tsx` (homepage) | 580 | "held by Stripe and only released" | "processed securely through Stripe and managed by ELBOLD. It is only released" |
| `app/why-elbold/page.tsx` | 32 | "Stripe holds your deposit until the event is complete" | "Your deposit is processed through Stripe and managed by ELBOLD until the event is complete" |
| `app/why-elbold/page.tsx` | 47 | "Payment held by Stripe, not the vendor." | "Payment processed through Stripe, managed by ELBOLD, not the vendor." |
| `app/why-elbold/page.tsx` | 68 | "Your deposit is held securely and only released after your event is completed." | "Your deposit is processed securely through Stripe and managed by ELBOLD until after your event is completed." |
| `app/about/page.tsx` | 134 | "payments held by Stripe until events complete" | "deposits processed through Stripe and managed by ELBOLD until events complete" |
| `app/about/page.tsx` | 298 | "Deposits held by Stripe until after your event" | "Deposits secured until after your event" (desc updated to explain managed by ELBOLD) |
| `app/how-it-works/page.tsx` | 209 | "Your deposit is held by Stripe until your event." | "Your deposit is processed through Stripe and managed by ELBOLD until your event." |
| `app/browse/page.tsx` | 242 | "held by Stripe and only released" | "processed securely through Stripe and managed by ELBOLD until after your event" |
| `app/support/page.tsx` | 63 | "held securely by Stripe" | "processed securely through Stripe and managed by ELBOLD" |
| `app/trust/page.tsx` | 61 | "How Stripe holds your deposit, when it releases" | "How your deposit is protected, when it is released to vendors" |

### Email templates

| File | Line | Old Wording | New Wording |
|------|------|-------------|-------------|
| `lib/resend/index.ts` | 353 | "held securely by Stripe and only released to the vendor after your event is completed" | "processed securely through Stripe and managed by ELBOLD. It is only released to the vendor after your event is completed." |
| `lib/guides.ts` | 96 | "held securely by Stripe and only released after your event" | "processed securely through Stripe and managed by ELBOLD and only released after your event" |
| `lib/guides.ts` | 102 | "held securely by Stripe until after your event" | "processed securely through Stripe and managed by ELBOLD until after your event" |

---

## Files Already Accurate (No Change Required)

| File | Wording | Why Already Correct |
|------|---------|---------------------|
| `app/booking-protection/page.tsx:23` | "Payments are held by ELBOLD and not released to vendors until after your event is completed." | Correctly attributes holding to ELBOLD |
| `app/booking-protection/page.tsx:63` | "Deposits are held by ELBOLD and processed securely through Stripe throughout the booking period." | Correct |
| `app/booking-protection/page.tsx:189` | "Your 30% deposit is held by ELBOLD and processed through Stripe." | Correct |
| `app/vendor-faq/page.tsx:55` | "ELBOLD holds the payment until the booking is marked as completed" | Correct |
| `app/help/page.tsx:21` | "ELBOLD holds the payment in trust until your event is completed" | Correct |

---

## Outstanding (Not Modified — Internal Admin)

| File | Line | Note |
|------|------|------|
| `app/admin/pilot/readiness/page.tsx:30` | "Deposit held by Stripe; vendor receives payout within 7 working days post-event" | Internal admin page only — not customer-facing. Update at convenience. |

---

## Residual Risk

The booking-protection page is now the most accurate description of payment handling on the site. It explicitly states ELBOLD holds the deposit. The phrase "Stripe-secured" (on categories page and founding vendors badge) is acceptable — "secured by/through Stripe" refers to the payment processor used, not an escrow claim.

**Total instances corrected:** 18  
**Total instances already accurate:** 5  
**Outstanding (internal only):** 1
