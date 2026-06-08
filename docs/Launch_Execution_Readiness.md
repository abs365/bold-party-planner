# Launch Execution Readiness — Priority 4

**Date:** 2026-06-08  
**Scope:** Vendor onboarding, activation, acquisition, first booking flow, first review flow  
**Instruction:** No new features. Identify gaps in execution, not in engineering.

---

## Vendor Onboarding Flow

### Journey: Apply → Pending → Approved → Profile Complete → Go Live

| Step | Route / Component | Status | Notes |
|------|------------------|--------|-------|
| 1. Vendor discovers ELBOLD | `/founding-vendors` | READY | Messaging corrected this sprint |
| 2. Vendor applies | `/vendor/apply` → `VendorApplyForm` | READY | Redirects existing applicants correctly |
| 3. Application in review | `/vendor/onboarding` (status = pending) | READY | Shows lifecycle timeline with 4 stages |
| 4. Admin reviews and approves | `/admin/vendors` | READY | Approve/reject with notification email |
| 5. Vendor completes profile | `/vendor/onboarding` (status = approved) → `VendorOnboardingWizard` | READY | Completion score tracked via `computeVendorCompletion` |
| 6. Vendor uploads media | `/vendor/media` → `VendorMediaManager` | READY | |
| 7. Vendor adds packages | `/vendor/services` | READY | |
| 8. Vendor verifies identity | `/vendor/verification` | READY | Document upload + admin review queue |
| 9. Vendor goes live | `/vendors/{id}` | READY | Visible in browse once status = approved |

**Gap identified:** No automated "your profile is incomplete" reminder email. Vendors who complete application but stall at profile setup receive no nudge. The onboarding progress bar shows in-product, but there is no outbound email. **Not a blocker for soft launch** — can be handled with direct WhatsApp/email contact for first 20 vendors.

---

## Vendor Activation Flow

### From approved → active on the marketplace

| Step | Where it happens | Status |
|------|-----------------|--------|
| Admin approves application | `/admin/vendors` → PATCH vendor status | READY |
| Approval email sent to vendor | `sendVendorApproved()` in `lib/resend` | READY |
| Vendor sees onboarding wizard | `/vendor/onboarding` | READY |
| Profile completion tracked | `computeVendorCompletion()` | READY |
| Vendor activation funnel | `/admin/vendor-activation` | READY |
| Vendor listed in browse | `/browse`, `/categories/{cat}` | READY — only status=approved shown |

**Execution note:** For the first 20 Founding Vendors, do not rely on automation alone. Call or WhatsApp each vendor after approval to confirm they have completed their profile. Human activation converts better than automated nudges at this scale.

---

## Vendor Acquisition Flow

### From outreach → application

| Step | Where it happens | Status |
|------|-----------------|--------|
| Outreach email sent | `/admin/vendor-outreach` or manual | READY |
| Outreach tracked in CRM | `/admin/vendor-acquisition` | READY |
| Vendor receives email | `lib/resend/vendor-outreach.ts` | READY |
| Vendor visits founding-vendors page | `/founding-vendors` | READY |
| Vendor applies | `/vendor/apply` | READY |
| Application appears in admin | `/admin/vendors?status=pending` | READY |
| Admin notified | Via pending vendor badge on founder dashboard | READY |

**Execution note:** The primary acquisition channels are Instagram DM, WhatsApp, and direct email. The pipeline CRM at `/admin/vendor-acquisition` tracks status. Prioritise categories and cities with highest customer search demand. London (photographer, DJ, decorator) should be filled first.

---

## First Booking Flow

### Journey: Quote request → Deposit paid → Event completed

The founder dashboard at `/admin/founder` tracks this as a 7-step mission:

| Step | Trigger | Status |
|------|---------|--------|
| 1. Customer requests quote | Customer submits quote form on vendor profile | READY |
| 2. Vendor responds to quote | Vendor replies via `/vendor/quotes` | READY |
| 3. Customer accepts → booking created | Customer accepts quote → booking created | READY |
| 4. Booking confirmed | Vendor accepts booking request | READY |
| 5. Deposit paid | Customer pays via Stripe checkout | READY — live key in Vercel |
| 6. Booking completed | Admin/system marks booking as completed | READY |
| 7. Review submitted | Customer submits review at `/dashboard/bookings/{id}?review=1` | READY |

**Gap identified:** Step 5 (deposit payment) has not been end-to-end tested in production. Local dev uses an invalid `mk_` key. The live Stripe key is in Vercel. **Must test one live payment before public launch.** Use a real card, book a real vendor for a real (or test) event, and confirm the deposit reaches the Stripe dashboard.

**Gap identified:** No automated payment reminder to customers who have an accepted booking but have not paid the deposit. The booking enters "accepted" state, and unless the customer returns to pay, it sits unpaid indefinitely. **Not a blocker for first 5 bookings** — founder can follow up manually. Consider adding a 24-hour reminder email post-acceptance before scaling.

---

## First Review Flow

### Journey: Event completed → Review submitted → Visible on vendor profile

| Step | Where it happens | Status |
|------|-----------------|--------|
| 1. Booking marked completed | Admin or system marks status=completed | READY |
| 2. Review request sent | Cron `/api/cron/reminders` triggers review_request notification | READY |
| 3. Customer receives in-app notification | Link to `/dashboard/bookings/{id}?review=1` | READY |
| 4. Customer submits review | `CustomerBookingDetail.tsx` → POST `/api/reviews` | READY |
| 5. Review appears on vendor profile | `VendorProfileView` → reviews section | READY |
| 6. Vendor can respond | From `/vendor/reviews` | READY |

**Gap:** No outbound email for review request — only in-app notification. Customer must be logged in and visit the dashboard to see the request. **For first 5 reviews:** follow up personally via email or WhatsApp asking the customer to leave a review. Paste the direct link: `https://www.elbold.com/dashboard/bookings/{id}?review=1`.

---

## Launch Execution Readiness — Summary

| Flow | Engineering Ready | Execution Ready | Gaps |
|------|------------------|----------------|------|
| Vendor onboarding | YES | YES | No automated incomplete-profile email (handle manually at first) |
| Vendor activation | YES | YES | Human follow-up recommended for first 20 |
| Vendor acquisition | YES | YES | Pipeline CRM in place |
| First booking | YES | CONDITIONAL | Live Stripe payment must be tested in production before public launch |
| First review | YES | YES | No review-request email (use direct link for first reviews) |

---

## Immediate Actions Required Before Soft Launch

1. **Approve and activate at least 3 vendors** with complete profiles, photos, packages, and pricing
2. **Test one live Stripe payment** in production (deposit, any amount)
3. **Confirm all support email addresses** (support@, disputes@, urgent@) are monitored in real time
4. **Confirm Stripe payout bank account** is ELBOLD Ltd business account
5. **Brief the first customers** — invite-only soft launch, no public marketing yet

---

## Actions Not Required Before Soft Launch

- ICO registration (required before public launch, not soft launch with limited users)
- Review request email automation (manual follow-up sufficient for first 5 reviews)
- Profile completion reminder emails (direct contact sufficient for first 20 vendors)
- Google Business Profile (useful but not blocking)
