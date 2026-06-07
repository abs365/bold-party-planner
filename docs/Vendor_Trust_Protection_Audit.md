# Vendor Trust & Protection Audit
**ELBOLD Events — Pre-Scale Vendor Trust Review**  
**Date:** June 2026  
**Scope:** Verification flows, trust badge hierarchy, booking protection language, vendor eligibility, admin queue

---

## Executive Summary

The verification and trust infrastructure is **substantially complete** for a controlled pilot. The document submission flow, admin review queue, email notifications, audit logging, and public trust pages are all working. However, **four issues require resolution before onboarding large numbers of vendors**, two of which are critical:

| # | Severity | Finding | Files |
|---|---|---|---|
| 1 | CRITICAL | Escrow language on /booking-protection does not match actual payment implementation | booking-protection/page.tsx |
| 2 | CRITICAL | Badge naming is inconsistent across three separate files | VendorTrustBadges.tsx, verification-requirements.ts, how-we-verify/page.tsx |
| 3 | HIGH | Phone verification is claimed publicly but not technically enforced | how-we-verify/page.tsx, VendorVerificationView.tsx |
| 4 | HIGH | Admin queue missing Suspended and Expired states | admin/verifications/page.tsx |
| 5 | MEDIUM | Level 1 "Verified" label visible to vendors but no customer badge — label risks misuse | VendorVerificationView.tsx |
| 6 | MEDIUM | "ELBOLD Approved" and "Featured Vendor" badges defined in brief but absent from badge system | VendorTrustBadges.tsx |
| 7 | LOW | Category-specific document requirements are internal-only; not surfaced on profiles | lib/verification-requirements.ts |

---

## 1. Verification Flow Audit

### 1.1 ID Verification
**Status: WORKING**

Flow:
1. Vendor visits `/vendor/verification` → submits `government_id` document (passport, driving licence, national ID)
2. Document uploaded via `/api/verification/upload` → stored in Supabase storage
3. Submission created via `POST /api/vendor/verification`
4. Admin sees document in `/admin/verifications` (pending queue)
5. Admin clicks Approve → `PATCH /api/admin/verifications { action: "approve" }`
6. API: sets `vendor_verifications.status = "approved"`, checks all approved docs → upgrades `vendors.verification_level`
7. Emails sent: `sendVerificationApproved` + `sendLevelUpgraded` (if level changed)
8. `verification_activity_log` entry written
9. Audit log written via `createAuditLog`

**Level upgrade logic** (`app/api/admin/verifications/route.ts:118–135`):
- `hasIdentity = government_id approved OR identity approved` → sets `verified = true`
- `hasBusiness = business_registration OR insurance OR food_hygiene OR sia_license OR operator_license approved` → combined with hasIdentity → level becomes 2
- Without hasBusiness, identity alone → level becomes 1

**Finding:** The level upgrade logic does not account for `proof_of_address`. A photographer who submits government_id + portfolio_authenticity + proof_of_address (their full required set) reaches Level 2. But a DJ who only submits government_id + proof_of_address also reaches Level 2 through `hasIdentity`. The `hasBusiness` check requires at least one "business" document type — DJs and decorators (who only require government_id + proof_of_address) never trigger `hasBusiness`, so they stay at Level 1 even with all their required docs approved. **Level upgrade logic needs to check "all category-required docs approved" rather than the current hardcoded document-type list.**

### 1.2 Address Verification
**Status: PARTIAL — document type exists, level logic broken**

`proof_of_address` is a valid `DocumentType`. It is required by most categories (dj, photographer, decorator, etc.). But once approved, it does not trigger the `hasBusiness` flag in the upgrade logic — because the upgrade only counts `business_registration`, `insurance`, `food_hygiene`, `sia_license`, `operator_license`. Proof of address is therefore collected but does not advance the vendor to Level 2.

For DJs and decorators whose only required docs are `government_id + proof_of_address`, the correct behaviour should be: all required docs approved → Level 2. The current code only reaches Level 2 if a "business" document type is included.

**Fix required:** Replace the `hasBusiness` check with a check against `getRequirementsForCategory(vendor.category)` — all required documents approved → Level 2.

### 1.3 Phone Verification
**Status: MISMATCH — claimed but not enforced**

**What the public page says** (`app/how-we-verify/page.tsx:28–32`):
> "Phone Verification: A valid UK phone number is required. We verify the number belongs to the applying business — not a disposable or VoIP number."

**What the code does** (`app/vendor/verification/page.tsx:55–62`):
```typescript
phoneAdded: !!(profile?.phone || vendor.phone),
```
Level 1 requires `phoneAdded === true`. The check is a null/undefined check only — any string (including "07000000000" typed freely) satisfies it. There is no OTP, no UK format validation, no VoIP detection.

**Infrastructure exists but is not wired in:**
- `supabase/migrations/038_phone_otp.sql` exists (not yet applied)
- `app/api/vendor/phone-otp/route.ts` exists
- `components/vendor/PhoneVerifyModal.tsx` exists

The OTP system was built but not connected to the verification level gate. Until it is:
1. Remove the claim "We verify the number belongs to the applying business" from `/how-we-verify`
2. Replace with: "A contact phone number is required. Full phone verification (OTP) will be available shortly."

### 1.4 Approval Workflow
**Status: WORKING**

Admin actions available:
- **Approve** — sets status to "approved", upgrades vendor level, sends approval email
- **Reject** — sets status to "rejected", stores rejection_reason, sends rejection email
- **Request Resubmission** — sets status to "rejected" with resubmission_allowed = true, sends resubmission email
- **Flag / Unflag** — marks vendor suspicious_flag + suspicious_reason on vendors table
- **Set Level manually** — admin can override verification_level to 0–4 at any time

All actions write to `verification_activity_log` and `audit_logs`. Emails are sent via `lib/resend/verification-emails.ts` (fire-and-forget, non-blocking).

---

## 2. Trust Badge Hierarchy Audit

### 2.1 Current System — Three Inconsistent Definitions

The badge system is defined in three separate places with three different level meanings:

**File 1: `lib/verification-requirements.ts`** (vendor-facing dashboard)
| Level | Label | Description |
|---|---|---|
| 0 | Unverified | No action taken |
| 1 | Verified | Email, phone, profile complete |
| 2 | Business Verified | Identity and business documents reviewed |
| 3 | Trusted Pro | Proven track record (automatic) |
| 4 | Premium Partner | Invite-only elite |

**File 2: `components/vendor/VendorTrustBadges.tsx`** (customer-facing profile badges)
| Level | Badge shown to customers | Criteria |
|---|---|---|
| 0 | None | |
| 1 | None (intentional — email only, no docs) | |
| 2 | ID Verified (green) | Government ID approved |
| 3 | Address Verified (blue) | Same check as level 2 |
| 4 | Business Verified (blue) | Same check as level 3 |
| Earned | Trusted Professional (amber) | 5+ jobs, 4.5★, 80%+ response |

**File 3: `app/how-we-verify/page.tsx`** (public customer page)
| Label | Badge text | Represents |
|---|---|---|
| Reviewed | Manual review by our team | Baseline for all vendors |
| ID Verified | Identity confirmed | Government ID provided |
| Trusted Pro | Established track record | Performance-based |
| Premium Partner | Highest verification tier | Invite only |

**CRITICAL INCONSISTENCY:**  
Level 3 is called "Address Verified" in VendorTrustBadges.tsx but "Trusted Pro" in both verification-requirements.ts and how-we-verify page. A vendor with Level 3 would show a blue "Address Verified" badge to customers (VendorTrustBadges.tsx:61) but their dashboard calls them "Trusted Pro" and the public page says Level 3 means a performance track record. These represent completely different meanings.

### 2.2 Required Badge Definition

Canonical definition (resolving the inconsistency):

| Badge ID | Customer Label | DB Level | Requirements | Shown To |
|---|---|---|---|---|
| `email_verified` | — | Level 1 | Email confirmed, phone added, profile complete | Vendor dashboard only — no customer badge |
| `id_verified` | ID Verified | Level 2 | Government ID approved by ELBOLD team | Customers on profile + browse |
| `business_verified` | Business Verified | Level 2+ | All category-required documents approved | Customers on profile + browse |
| `trusted_pro` | Trusted Professional | Computed | Level 2+, 5+ jobs, 4.5★, 80%+ response rate | Customers on profile + browse |
| `premium_partner` | Premium Partner | Level 4 | Invite-only, admin-set | Customers on profile + browse |
| `top_rated` | Top Rated | Earned | Rating ≥ 4.8, 10+ reviews | Customers on profile |
| `fast_responder` | Fast Responder | Earned | Response rate ≥ 80% | Customers on profile |

**Badges requested in sprint brief, currently missing:**

| Badge | Status |
|---|---|
| Identity Verified | Present (as "ID Verified" at Level 2) — label mismatch only |
| Address Verified | Present as Level 3 label in VendorTrustBadges.tsx but concept is wrong — should be Level 2 sub-requirement |
| Phone Verified | Not a standalone badge — phone is Level 1 prerequisite only |
| Document Verified | Not named — equivalent to "Business Verified" (Level 2) |
| ELBOLD Approved | **MISSING** — no badge for vendor.status === "approved" |
| Featured Vendor | **MISSING** — vendors.featured boolean exists but no badge in getVendorBadges |
| Top Rated | Present (rating ≥ 4.8, reviewCount ≥ 10) |

### 2.3 Required Fix — Normalise to Single Source of Truth

The three definitions need to collapse to one. Recommended canonical model:

```
Level 0 = Unverified (no customer badge)
Level 1 = ELBOLD Reviewed (manual review completed, no docs — no badge shown to customers)
Level 2 = ID Verified (government ID approved)
Level 3 = Business Verified (all category-required docs approved)
Level 4 = Premium Partner (invite-only admin-set)
Earned  = Trusted Professional (computed from track record at Level 2+)
```

This aligns with how customers interpret the badges and removes the "Address Verified" / "Trusted Pro" confusion at Level 3.

---

## 3. Booking Protection Transparency Audit

### 3.1 What the Page Claims
**`/booking-protection` page — PROMISE_POINTS:**
> "Your deposit is held by Stripe: Every deposit paid through ELBOLD is processed and **held by Stripe** — not transferred directly to the vendor."

> "Deposit held until completion: Your 30% deposit is **held in a protected Stripe account** and only released to the vendor after your event is completed."

### 3.2 What Actually Happens

The platform uses **direct charges** (a single Stripe key, not Stripe Connect). This means:
- Customer pays → money goes to **ELBOLD's Stripe account**
- ELBOLD manually pays vendors from its own account after events
- There is no separate escrow account per booking
- There is no Stripe mechanism preventing ELBOLD from transferring the money before the event

The claim "held by Stripe — not transferred directly to the vendor" is technically true (vendor doesn't receive it directly) but implies Stripe is holding it in trust, which it is not. ELBOLD holds it in its own Stripe account.

This is documented in `docs/Stripe_Connect_Feasibility_Report.md` (recommendation: migrate to Stripe Connect before 20 vendors / £10,000 GMV).

### 3.3 Required Language Corrections

| Current text | Problem | Replacement |
|---|---|---|
| "held by Stripe" | Implies Stripe escrow; actually ELBOLD's account | "processed by Stripe and held by ELBOLD pending event completion" |
| "held in a protected Stripe account" | No dedicated per-booking account | "processed securely through Stripe and held by ELBOLD until your event is complete" |
| "Vendors receive payment only after your event is completed" | Accurate in intent but no automated enforcement | Retain — add "as a matter of policy" |

### 3.4 What IS Accurate and Should Stay

- **Stripe PCI-DSS compliance** — accurate, Stripe handles card data
- **No direct vendor bank transfers** — accurate, customers never pay vendors directly
- **Refund policy table** — specific and accurate if policy is enforced
- **Dispute process (48h window, 5 business days)** — accurate, email contacts are real
- **No-show protection** — accurate as a policy statement
- **Customer / Vendor responsibilities** — well-written, accurate

### 3.5 The 30% Deposit Claim
The page states "A 30% deposit is required to confirm a booking." The Stripe checkout flow charges the full agreed booking amount (or deposit amount) depending on the quote acceptance — this needs to be verified against the actual checkout logic in `app/api/payments/checkout/route.ts` to confirm the 30% is enforced at the payment level, not just stated in the copy.

---

## 4. Vendor Eligibility Standards

### 4.1 Existing Public Documentation
Three pages already explain eligibility:

| Page | Content |
|---|---|
| `/how-we-verify` | 6 verification steps, timeline (1–5 days), fraud measures, review integrity, what verification does/doesn't guarantee |
| `/vendor-standards` | 6 approval criteria, 6 ongoing standards, 4-stage warning system (Guidance → Warning → Suspension → Removal) |
| `/our-commitments` | 6 vendor review commitments, limitations honestly stated |

### 4.2 Category-Specific Document Requirements
The specific documents required per category (`lib/verification-requirements.ts:39–60`) are not publicly surfaced. Vendors only discover requirements when they reach the verification step. Recommendation: add a "Document requirements by category" expandable section to `/how-we-verify` or `/vendor-standards`.

Current requirements by category:

| Category | Required Documents |
|---|---|
| DJ | Government ID, Proof of Address |
| Photographer / Videographer | Government ID, Proof of Address, Portfolio Authenticity Declaration |
| Decorator / Balloon Decorator | Government ID, Proof of Address |
| Caterer / Cake Maker | Government ID, Food Hygiene Certificate, Insurance, Proof of Address |
| MC | Government ID, Proof of Address |
| Security | Government ID, SIA Licence, Insurance |
| Makeup Artist | Government ID, Proof of Address |
| Lighting / Stage | Government ID, Insurance, Proof of Address |
| Furniture / Marquee Rental | Government ID, Insurance, Proof of Address |
| Live Band | Government ID, Proof of Address |
| Luxury Services | Government ID, Insurance, Business Registration |
| Transport | Government ID, Operator Licence, Insurance |
| Cleaner | Government ID, Insurance |
| Event Staff | Government ID |
| Other / Usher / Event Staff | Government ID |

### 4.3 Eligibility Checklist (what vendors must provide)

The following is the canonical eligibility checklist for Level 2 verification:

**All vendors:**
1. Email address confirmed
2. Valid phone number (UK format)
3. Business bio (20+ characters)
4. Service area / city set
5. At least 1 service package with pricing
6. At least 3 portfolio photos/videos
7. Government-issued ID (passport, driving licence, or national ID)
8. Proof of address (utility bill, bank statement, or council tax letter — issued within 3 months)

**Additional by category** (see table above)

**Why verification exists:**
- Prevents fraudulent listings from unqualifiable individuals
- Ensures customers can reasonably expect what is advertised
- Creates accountability — verified vendors are identifiable if disputes arise
- Builds platform trust that justifies ELBOLD's commission

**How approval decisions are made:**
- Documents reviewed within 1–5 business days
- Identity checked: name on ID matches business registration / application
- Document validity: not expired, issued by recognised authority
- Portfolio reviewed for authenticity and quality threshold
- Any inconsistency triggers rejection with reason and resubmission option
- Approval is at ELBOLD's sole discretion — we reserve the right to reject any application

---

## 5. Admin Verification Queue Audit

### 5.1 Currently Visible States
| State | In queue? | In stats? | Notes |
|---|---|---|---|
| Pending | Yes (default view) | Yes | Sorted oldest first |
| Approved | Yes (filter tab) | Yes (count) | |
| Rejected | Yes (filter tab) | No (not in stats) | |
| Flagged | Partial (flagged badge on cards) | Yes (count from vendors.suspicious_flag) | Not a separate filter tab |
| **Suspended** | **NO** | **NO** | Not tracked in verification system |
| **Expired** | **NO** | **NO** | No expiry date on documents |

### 5.2 Missing: Suspended State
The sprint brief requires Suspended to be visible and actionable. The governance system (`admin/governance`) handles vendor_warnings and vendor suspension, but this is separate from the verification queue. A suspended vendor's documents still show as "approved" in the verification queue — no link between `vendor_warnings` / `vendors.status = 'suspended'` and the verification view.

**Required:** The verification queue should show a "Suspended" badge next to flagged vendors whose account status is suspended. Filter the `vendors.status` field alongside `verification_level` and `suspicious_flag`.

### 5.3 Missing: Expired State
Documents have no expiry field. Insurance certificates, food hygiene certificates, and operator licences all have real-world expiry dates. A caterer who submitted a valid food hygiene certificate 3 years ago may be operating with an expired certificate.

**Required:**
- Add `expires_at` column to `vendor_verifications` table
- Admin sets expiry date at time of approval for time-limited documents
- Cron job flags documents approaching expiry (30-day notice) and past expiry
- Expired documents revert the vendor to Level 1 until resubmitted

### 5.4 Admin Queue — What Works Well
- Approve / Reject / Request Resubmission all work with emails
- Manual level-set (0–4) available per vendor
- Flag / Unflag with reason works
- Activity log written for every action
- Document viewing (signed URL from Supabase storage) works
- Search by vendor name and email works
- Filter by pending / approved / rejected / all works

### 5.5 Stats Panel Gap
Stats show: Pending, Approved, Flagged. Missing:
- Rejected count (total historical rejections)
- Vendors at each level (how many at L1, L2, L3, L4)
- Expired documents count (once expiry is implemented)

---

## 6. Deployment & Production Verification Status

**Live deployment confirmed:** commit `021342f` deployed to https://www.elbold.com as of this audit.

**Verification-related pages confirmed in production build:**
- `/vendor/verification` — vendor verification centre
- `/admin/verifications` — admin review queue
- `/how-we-verify` — public customer page
- `/booking-protection` — public protection page
- `/vendor-standards` — vendor standards
- `/our-commitments` — platform commitments
- `/trust` — trust hub

**API routes confirmed building:**
- `GET/PATCH/POST /api/admin/verifications`
- `POST /api/vendor/verification`
- `POST /api/verification/upload`
- `GET /api/verification/document`

---

## 7. Priority Fix List

### Priority 1 — CRITICAL: Fix escrow language on /booking-protection
**Files:** `app/booking-protection/page.tsx` (lines 21–24, 192–195)  
**Action:** Replace "held by Stripe" / "held in a protected Stripe account" with accurate language reflecting that ELBOLD holds the funds in its own Stripe account pending event completion.

### Priority 2 — CRITICAL: Normalise badge naming across three files
**Files:** `components/vendor/VendorTrustBadges.tsx`, `lib/verification-requirements.ts`, `app/how-we-verify/page.tsx`  
**Action:** Align to canonical model: Level 1 = ELBOLD Reviewed (no customer badge), Level 2 = ID Verified, Level 3 = Business Verified, Level 4 = Premium Partner.

### Priority 3 — HIGH: Fix phone verification claim
**File:** `app/how-we-verify/page.tsx` (line 28–32)  
**Action:** Change "We verify the number belongs to the applying business" to "A contact phone number is required. OTP verification launching shortly."

### Priority 4 — HIGH: Fix level upgrade logic for categories without business documents
**File:** `app/api/admin/verifications/route.ts` (lines 118–135)  
**Action:** Replace `hasBusiness` check with `allCategoryRequiredDocsApproved` using `getRequirementsForCategory(vendor.category)`.

### Priority 5 — HIGH: Add Suspended state visibility to admin verification queue
**Files:** `app/admin/verifications/page.tsx`, `components/admin/AdminVerificationsView.tsx`  
**Action:** Fetch `vendor.status` alongside verifications; show suspended badge; add filter tab.

### Priority 6 — MEDIUM: Add document expiry tracking
**Files:** New migration needed, `app/api/admin/verifications/route.ts`, `app/api/cron/verification-check/route.ts`  
**Action:** Add `expires_at` to `vendor_verifications`; admin sets on approval; cron flags expired.

### Priority 7 — MEDIUM: Add ELBOLD Approved and Featured Vendor badges
**File:** `components/vendor/VendorTrustBadges.tsx`  
**Action:** Add `elbold_approved` badge when `vendor.status === "approved"` and `featured_vendor` badge when `vendor.featured === true`.

---

## 8. What Is Working Well (Do Not Break)

- Complete document upload → storage → admin review flow
- Activity log and audit trail on every action
- Email notifications: approved / rejected / resubmission / level upgrade
- Resubmission workflow (rejection_reason shown to vendor, resubmit button appears)
- Level progress UI in vendor dashboard (overview / documents / history tabs)
- Category-specific required document list (lib/verification-requirements.ts)
- Admin flag/unflag with reason
- Manual level override for edge cases
- Booking protection page overall structure (refund table, dispute process, responsibilities)
- Customer-facing trust pages (/trust, /how-we-verify, /vendor-standards, /our-commitments)

---

*Audit produced from full codebase review of: `lib/verification-requirements.ts`, `components/vendor/VendorTrustBadges.tsx`, `components/vendor/VendorVerificationView.tsx`, `components/admin/AdminVerificationsView.tsx`, `app/api/admin/verifications/route.ts`, `app/admin/verifications/page.tsx`, `app/vendor/verification/page.tsx`, `app/booking-protection/page.tsx`, `app/how-we-verify/page.tsx`, `lib/vendor/completion.ts`.*
