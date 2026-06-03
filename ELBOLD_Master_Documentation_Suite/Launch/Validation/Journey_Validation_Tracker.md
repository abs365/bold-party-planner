# Journey Validation Tracker — ELBOLD Beta

**Document:** Journey_Validation_Tracker  
**Phase:** 28B — Real User Validation  
**Updated:** 2026-06-03

---

> Each row must be proven with a real human tester — not simulated, not mocked.
> Mark: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL / ⬜ NOT YET RUN
> Record tester ID, date, and any notes for each step.

---

## Customer Journey Validation

**Target:** Minimum 2 customer testers must complete all 9 steps.

| Step | Action | Route | Expected result | T1 result | T1 date | T2 result | T2 date | Notes |
|---|---|---|---|---|---|---|---|---|
| CJ-1 | Signup — fill name, email, password | `/signup` | Form submits, "Check Your Email" shown | | | | | |
| CJ-2 | Email verification — click link | Email inbox | Email received < 90s; link opens | | | | | |
| CJ-3 | Login — post-confirmation | Auto or `/login` | Session created, redirected to `/dashboard` | | | | | |
| CJ-4 | Dashboard access — first view | `/dashboard` | Dashboard loads, no errors, empty states shown | | | | | |
| CJ-5 | Create event — complete wizard | `/dashboard/create-event` | Event saved, Smart Planner returns suggestions | | | | | |
| CJ-6 | Request quote — from vendor profile | `/vendors/[id]` → `/dashboard/quotes/new` | Quote stored in DB; vendor notified by email | | | | | |
| CJ-7 | Save vendor | `/vendors/[id]` → save button | Vendor appears in `/dashboard/saved` | | | | | |
| CJ-8 | Booking — accept a quote | `/dashboard/quotes/[id]` → Accept | Booking created; Stripe checkout opens | | | | | |
| CJ-9 | Review — leave review after booking | Vendor profile | Review stored; visible on vendor public profile | | | | | |

**Customer Journey PASS criteria:** Steps CJ-1 through CJ-7 must all be PASS. CJ-8 and CJ-9 are target milestones.

**Customer Journey Status:** ⬜ NOT YET RUN

---

## Vendor Journey Validation

**Target:** Minimum 2 vendor testers must complete all 9 steps.

| Step | Action | Route | Expected result | V1 result | V1 date | V2 result | V2 date | Notes |
|---|---|---|---|---|---|---|---|---|
| VJ-1 | Signup as vendor | `/signup` → Join as Vendor | Form submits, "Check Your Email" shown | | | | | |
| VJ-2 | Email verification — click link | Email inbox | Email received < 90s; link opens | | | | | |
| VJ-3 | Vendor application — 3-step form | `/vendor/apply` | Form submits; vendors row inserted (pending) | | | | | |
| VJ-4 | Approval — admin approves | `/admin/vendors` (admin) | Vendor receives approval email | | | | | |
| VJ-5 | Dashboard access | `/vendor/dashboard` | Dashboard loads; onboarding visible | | | | | |
| VJ-6 | Lead received | `/vendor/quotes` | Quote request notification and email received | | | | | |
| VJ-7 | Quote submitted | `/vendor/quotes` → respond | Customer receives quote response email | | | | | |
| VJ-8 | Booking confirmed | `/vendor/bookings` | Booking appears; customer notified | | | | | |
| VJ-9 | Payment received | `/vendor/payouts` | Payout tracked (manual during pilot) | | | | | |

**Vendor Journey PASS criteria:** Steps VJ-1 through VJ-7 must all be PASS. VJ-8 and VJ-9 are target milestones.

**Vendor Journey Status:** ⬜ NOT YET RUN

---

## Admin Journey Validation

**Target:** Founder self-validates all 9 steps.

| Step | Action | Route | Expected result | Result | Date | Notes |
|---|---|---|---|---|---|---|
| AJ-1 | Login as admin | `/login` | Redirected to `/admin` | | | |
| AJ-2 | View customers | `/admin/customers` | Customer list loads with test accounts | | | |
| AJ-3 | View vendors | `/admin/vendors` | Vendor list loads with pending applications | | | |
| AJ-4 | View applications | `/admin/vendors` → Pending tab | Pending vendor applications visible | | | |
| AJ-5 | Approve vendor | `/admin/vendors` → Approve | Status changes; approval email sent | | | |
| AJ-6 | View quotes | `/admin/quotes` | Quote pipeline loads with test RFQs | | | |
| AJ-7 | View bookings | `/admin/bookings` | Bookings visible with correct status | | | |
| AJ-8 | View payments | `/admin/bookings` / Stripe dashboard | Payment amounts and status correct | | | |
| AJ-9 | View analytics | `/admin/analytics` `/vendor/analytics` | Metrics loading, no errors | | | |

**Admin Journey PASS criteria:** All 9 steps must be PASS.

**Admin Journey Status:** ⬜ NOT YET RUN

---

## Validation Summary

| Journey | Steps total | PASS | FAIL | PARTIAL | NOT RUN | Status |
|---|---|---|---|---|---|---|
| Customer | 9 | 0 | 0 | 0 | 9 | ⬜ |
| Vendor | 9 | 0 | 0 | 0 | 9 | ⬜ |
| Admin | 9 | 0 | 0 | 0 | 9 | ⬜ |
| **Total** | **27** | **0** | **0** | **0** | **27** | ⬜ |

---

## Validation Sign-Off

All three journeys must reach PASS status before proceeding to 20-tester expansion.

| Journey | Date passed | Signed by |
|---|---|---|
| Customer | | |
| Vendor | | |
| Admin | | |
| **All three** | | |
