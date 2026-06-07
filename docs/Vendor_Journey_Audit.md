# Vendor Journey Audit — ELBOLD Events

**Version:** 1.0  
**Date:** June 2026  
**Auditor:** Founder / platform review based on codebase analysis  
**Scope:** New vendor from discovery to first successful payout

---

## Journey B — New Vendor End-to-End

### Stage 1 — Discovery

**Entry points:**
- Google Search → `/founding-vendors` or `/vendor/apply`
- Social media / outreach → `/founding-vendors`
- Direct referral → `/vendor/apply`

**What the vendor sees on `/founding-vendors`:**
- Hero: "Get discovered by customers planning events near you."
- Urgency: 20 founding places, permanent top placement
- "Why now" section: before/after founding window comparison
- Comparison table: ELBOLD vs social media vs directories
- 6 benefit cards: free listing, badge, priority placement, feature access, Stripe payments, permanent status
- What ELBOLD expects: 5 standards with link to /vendor-standards
- 4-step process: Apply → Verify → Complete → Enquiries
- Final CTA: Apply Free + Read Our Standards

**Friction identified:**
- ✅ Value proposition is clear and differentiated
- ✅ Comparison table addresses the "why not just use Instagram" objection
- ✅ Vendor standards linked — no surprise expectations
- ⚠️ "20 places" counter is static — doesn't decrement as vendors join. Consider a live count.
- ⚠️ No FAQ section — common questions (Do I need insurance? What categories do you accept? How long does approval take?) are answered in /vendor-standards but not surfaced here

---

### Stage 2 — Registration

**Path:** `/vendor/apply` → requires authentication → `/signup` if not logged in

**Signup flow (`/signup`):**
- Email + password
- Email verification via Supabase magic link
- On confirmation: profile row created, role set to `customer` by default

**Friction identified:**
- ✅ Standard auth flow is clear
- ⚠️ After email verification, vendor is redirected to homepage — not to the application form they came from. The lost context break is a significant drop point. Fix: preserve the intended destination (`/vendor/apply`) in auth callback.
- ⚠️ If vendor arrives at `/vendor/apply` already authenticated as a `customer` user, they see the application form — correct. But if they are already a vendor (re-visiting), the UX is unclear.

---

### Stage 3 — Application (`/vendor/apply`)

**Form collects:**
- Business name
- Category (dropdown from VENDOR_CATEGORIES)
- City / service area
- Description / bio
- Contact details
- Website (optional)
- Social links (optional)

**POST `/api/vendor/apply` processing:**
- Vendor row created: `status: pending`, `verification_level: 0`
- Profile role updated to `vendor`
- Admin email notification: `sendAdminNewVendorApplication` ✅
- Vendor confirmation email: `sendVendorApplicationReceived` ✅
- Redirect: vendor to `/vendor/onboarding` (or dashboard)

**Friction identified:**
- ✅ Both admin and vendor emails confirmed wired
- ✅ Clear status: application is "under review"
- ⚠️ Application form has no progress indicator — long forms feel unpredictable. "Step 1 of 2" style helps.
- ⚠️ No portfolio upload at application stage — vendor cannot show work until approved, which delays quality assessment
- ⚠️ No estimated review time stated on the success page. The promise is "24–48 hours" (in marketing) but it's not shown post-application.
- ⚠️ Application fields: "City / service area" is a free text field — inconsistent city names make location analytics unreliable. Consider a structured dropdown or county selector.

---

### Stage 4 — Admin Review → Approval (`/admin/vendors`)

**Admin process:**
- Admin views pending vendors in `/admin/vendors`
- Can approve or reject with a reason
- `PATCH /api/admin/vendors` endpoint

**On approval:**
- Vendor status → `approved`
- Vendor email: `sendVendorApproved` ✅ (with onboarding next steps)
- Admin audit log created

**On rejection:**
- Vendor email: `sendVendorRejected` ✅ (with reason)

**Friction identified:**
- ✅ Both approval and rejection emails wired
- ✅ Audit log on all admin actions
- ⚠️ Vendor has no way to check application status between submission and approval/rejection. A status page at `/vendor/application-status` would reduce support emails.
- ⚠️ Admin rejection reason is sent in email but the vendor cannot appeal via the platform — they must email manually. Consider a "Request reconsideration" option.
- ⚠️ If vendor was rejected, their account still exists as a `vendor` profile type with a rejected application. Re-application flow is unclear.

---

### Stage 5 — Onboarding (`/vendor/onboarding`)

**Post-approval vendor tasks:**
- Add profile photo / logo
- Upload portfolio images via `/api/uploads` → stored in `vendor_media`
- Set service packages (`/vendor/services`)
- Set availability (`/vendor/availability`)
- Complete verification (`/vendor/verification`)

**Verification levels:**
- Level 1: Basic (phone verified) — via OTP `/api/vendor/phone-otp`
- Level 2: ID Verified — document upload → admin review → `PATCH /api/admin/verifications`
- Level 3: Trusted Professional — additional checks
- Level 4: Business Verified — Companies House or insurance check

**Friction identified:**
- ✅ Verification system is well-structured with clear levels
- ✅ Documents uploaded via `/api/verification/document`
- ⚠️ Onboarding page exists but there is no visible progress checklist showing what is complete vs incomplete — vendors may not know what "complete profile" means
- ⚠️ Packages (`/vendor/services`) must be created manually — no template or suggested packages for the category. A "Start with a template" option would help first-time vendors.
- ⚠️ Availability calendar (`/vendor/availability`) is present but not clearly linked from onboarding — a vendor with no availability set may miss enquiries
- ⚠️ No prompt to share their profile URL once live — vendors would benefit from "Share your profile" after onboarding

---

### Stage 6 — Live on Platform → Dashboard (`/vendor/dashboard`)

**Vendor dashboard shows:**
- Unread quote requests
- Recent bookings
- Revenue summary
- Profile completion score (if implemented)
- Subscription status

**Friction identified:**
- ✅ Dashboard gives overview of activity
- ⚠️ If vendor has zero quote requests, the dashboard is empty — no guidance on "what to do next to get your first enquiry"
- ⚠️ Profile quality score is referenced in marketing but may not be shown clearly on the vendor dashboard
- ⚠️ Vendors cannot see their search ranking or how many times their profile has been viewed (analytics exist at `/vendor/analytics` but may not be prominent enough)

---

### Stage 7 — Quote Received

**Trigger:** Customer requests quote  
**Vendor notification path:**
- In-app notification: "Quote Request Received" → `/vendor/quotes`
- Email: `sendQuoteRequestToVendor` ✅

**Vendor quote submission (`/vendor/quotes`):**
- View customer requirements, event details, date
- Submit quote: price, deposit amount, description, services, validity date
- Or decline

**On vendor response:**
- Customer notified (email + in-app) ✅
- Quote status → `responded`

**Friction identified:**
- ✅ Email + in-app notification both confirmed
- ✅ Quote form is detailed enough for a proper proposal
- ⚠️ Vendor has no context on the customer beyond the event details — name, profile photo, or prior booking history would help vendors assess fit
- ⚠️ No suggested pricing tool — vendor must decide price with no market context. A "Similar vendors charge £X–£Y" hint would reduce underpricing
- ⚠️ Vendor can see that customer has submitted multiple quotes to other vendors (via event_id linkage) — but this context is not surfaced. Knowing "3 vendors also quoted this customer" is useful.

---

### Stage 8 — Booking Received

**Trigger:** Customer accepts vendor's quote  
**Vendor notification:**
- In-app: "Quote Accepted — Awaiting Payment"
- Email: `sendQuoteAcceptedToVendor` ✅

**After customer pays deposit:**
- Booking status → `confirmed`
- Vendor in-app: "Payment Received"
- Vendor email: `sendVendorPaymentNotification` ✅

**Vendor booking view (`/vendor/bookings/[id]`):**
- Customer name and event details
- Payment status (deposit paid / full payment pending)
- Total amount, deposit, vendor payout (after commission)
- Booking notes / customer requirements
- Messaging thread access

**Friction identified:**
- ✅ All notifications confirmed wired
- ✅ Payout amount (total - 10% commission) shown on booking
- ⚠️ The vendor cannot cancel a confirmed booking via the platform — they must contact support. A "Request cancellation" with reason flow would be better.
- ⚠️ No contract/agreement visible on the booking — the vendor agreed to ELBOLD's vendor terms at signup, but there is no in-booking terms reference
- ⚠️ Vendor cannot mark the event as "completed" from their side — completion is driven by booking date passing or admin action

---

### Stage 9 — Event Completed → Payout

**Payout flow:**
- Vendor submits bank details via `/api/vendor/bank-details` → stored in `vendor_bank_details`
- Admin initiates payout from `/admin/payouts`
- Payout queue reviewed in `/admin/finance`
- Manual Stripe transfer or bank transfer executed by admin
- Ledger updated

**Friction identified:**
- ✅ Bank details collection system exists
- ✅ Ledger tracks payout status (not_due → scheduled → paid)
- ⚠️ Payout is manual — admin-initiated. There is no automated trigger. This is correct for early-stage but must be replaced with automated Stripe payouts or Stripe Connect before scaling.
- ⚠️ Vendor cannot see payout status from their dashboard — `/vendor/payouts` shows history but may not show "Your payout for booking X is scheduled for Y date"
- ⚠️ No vendor-facing payout timeline — the SLA (e.g. "payouts processed within 7 days of event completion") is not communicated on the platform
- ⚠️ Stripe Connect migration required for scale — currently using manual bank transfers. See `docs/Stripe_Connect_Migration_Plan.md`.

---

## Summary of Friction Points by Severity

### 🔴 HIGH — Fix Before First Real Vendor
| Issue | Location | Fix |
|---|---|---|
| Auth callback drops vendor back to homepage | /signup → callback | Preserve redirect to /vendor/apply |
| No application status page | Between apply and approval | Add /vendor/application-status |
| No onboarding progress checklist | /vendor/onboarding | Add completion checklist with steps |
| No payout ETA communicated to vendor | /vendor/payouts | Add payout SLA messaging |

### 🟡 MEDIUM — Fix Before Launch
| Issue | Location | Fix |
|---|---|---|
| City field is free text | /vendor/apply | Add county/region selector |
| No template packages by category | /vendor/services | Add suggested package templates |
| No "share your profile" after onboarding | /vendor/onboarding | Add "Profile live — share it" CTA |
| Vendor cannot cancel booking via platform | /vendor/bookings/[id] | Add "Request cancellation" form |
| Quote response: no market pricing context | /vendor/quotes | Add median price hint for category |

### 🟢 LOW — Post-Launch
| Issue | Location | Fix |
|---|---|---|
| No vendor-facing profile view count | /vendor/analytics | Surface impression count |
| No suggested pricing tool | /vendor/quotes | Show category pricing benchmarks |
| Payout automation | /admin/payouts | Plan Stripe Connect migration |

---

## Emails — Complete Vendor Map

| Trigger | To | Template |
|---|---|---|
| Application submitted | Vendor | sendVendorApplicationReceived |
| Application submitted | Admin | sendAdminNewVendorApplication |
| Application approved | Vendor | sendVendorApproved |
| Application rejected | Vendor | sendVendorRejected |
| Quote request received | Vendor | sendQuoteRequestToVendor |
| Quote accepted by customer | Vendor | sendQuoteAcceptedToVendor |
| Quote rejected by customer | Vendor | sendQuoteRejectedToVendor |
| Payment received | Vendor | sendVendorPaymentNotification |
| Subscription payment failed | Vendor | sendSubscriptionPaymentFailed |
| **MISSING** | Vendor | Payout processed confirmation |
| **MISSING** | Vendor | Post-event review request |

---

*Produced from codebase analysis of `app/founding-vendors/page.tsx`, `app/vendor/apply/page.tsx`, `app/vendor/onboarding/page.tsx`, `app/vendor/dashboard/page.tsx`, `app/vendor/quotes/page.tsx`, `app/vendor/bookings/[id]/page.tsx`, `app/vendor/payouts/page.tsx`, `app/api/vendor/apply/route.ts`, `app/api/admin/vendors/route.ts`, `app/api/quotes/[id]/route.ts`, `lib/resend/index.ts`.*
