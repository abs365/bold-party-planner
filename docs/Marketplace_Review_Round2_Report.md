# Marketplace Review Round 2 — Launch Readiness Report

**Date:** 2026-06-08  
**Reviewer:** Independent codebase review (no new features built)  
**Scope:** Trust, legal, payment wording, routing, and launch-readiness only

---

## Executive Summary

| Area | Verdict |
|------|---------|
| Vendor Recruitment (recruiting Founding Vendors) | **GO** |
| Soft Launch (invite-only customers, limited publicity) | **GO WITH CAUTION** |
| Public Customer Launch (full marketing, unrestricted) | **NO GO** |

---

## Priority 2 — Vendor Profile Routing: FIXED

**Root cause identified and corrected.**

The `generateMetadata()` function in `app/vendors/[id]/page.tsx` was selecting a column named `description` from the `vendors` table. This column does not exist (the correct column is `bio`). PostgREST returns HTTP 400 for unknown column selections, causing `vendor` to be null, which triggered the `{ title: "Vendor Not Found" }` fallback — affecting the browser tab title and SEO metadata for **every** vendor profile, regardless of whether the vendor existed.

**Fixes applied:**
- `app/vendors/[id]/page.tsx:35` — `.select()` changed from `description` to `bio`
- `app/vendors/[id]/page.tsx:44` — `vendor.description` reference changed to `vendor.bio`
- `app/vendors/[id]/page.tsx:128` — JSON-LD `description` field changed to `vendor.bio`
- `app/vendors/[id]/page.tsx:135` — JSON-LD `priceRange` changed from `vendor.starting_price` to `vendor.min_price`
- `app/vendors/[id]/page.tsx:144` — JSON-LD `sameAs` changed from `vendor.website` to `vendor.website_url`

The main page render was unaffected (used `select("*")`), and `notFound()` is correctly called (line 95) when a vendor is not found or not approved. Card links across all browse, category, location, and admin pages all correctly use `/vendors/${vendor.id}`.

**Status: No visible vendor should lead to "Vendor Not Found" title after this fix.**

---

## Priority 3 — Payment Messaging: FIXED

18 instances of inaccurate "Stripe holds your deposit" language corrected across the platform. One critical factual error removed from the Our Commitments page, which had claimed "ELBOLD cannot access or redirect your deposit payment" — this was false under the direct charge model.

Full details in: `docs/Payment_Messaging_Audit.md`

---

## Priority 4 — Vendor Acquisition Messaging: FIXED

No "guaranteed bookings," "instant leads," or "customers waiting now" language found. Two instances corrected: "from day one" language (founding-vendors page) and a fabricated "3x more enquiries" statistic (VendorQuotesView).

Full details in: `docs/Vendor_Acquisition_Messaging_Audit.md`

---

## Priority 1 — Company Registration: OPEN LAUNCH GATE

Full details in: `docs/Company_Registration_Launch_Gate.md`

6 live files reference "ELBOLD Ltd" and/or "Registered in England and Wales." The Companies House registration is pending. Wording is not being removed (founder instructed to wait for incorporation this week).

**Critical additional finding:** The Privacy Policy (`app/privacy/page.tsx`) uses the company name "ELBOLD Event Planner Ltd" which differs from "ELBOLD Ltd" used everywhere else. This is a material inconsistency that must be resolved as soon as the exact registered company name is confirmed.

---

## Verdict Reasoning

### Vendor Recruitment — GO

The founding-vendors application flow is functional, well-written, and no longer contains overpromising claims. The verification system is in place. Vendors who apply will see accurate information about what they are signing up for.

**Conditions:**
- Company registration wording does not need to be resolved before recruiting vendors (it is acceptable for a pre-incorporation brand to say "ELBOLD Ltd" in context of an impending incorporation)
- Apply company registration fallback wording if incorporation is unexpectedly delayed beyond 2 weeks

**Blockers:** None

---

### Soft Launch — GO WITH CAUTION

A soft launch (invite-only customers, limited URLs, no public marketing) can proceed when at least 3–5 verified vendors are live in active categories.

**Proceed when:**
1. At least 3 approved, verified vendors have complete profiles (photos, packages, bio)
2. Company registration is confirmed OR fallback wording has been applied to footer and emails
3. Stripe live key is confirmed active in Vercel environment (local dev has an invalid `mk_` key — production has the real key per Vercel Dashboard)

**Known risks:**
- Company registration wording claiming "Registered in England and Wales" is live but registration is pending — this is the primary legal risk for soft launch
- Payment flow has not been end-to-end tested in production (Stripe key validated in Vercel but no live booking test documented)

**Blockers:** Company registration fallback wording if not incorporated before soft launch date

---

### Public Customer Launch — NO GO

**Blocked on two independent issues:**

**1. Vendor supply (business blocker)**
Goal is 20 verified Founding Vendors. Zero or minimal vendors means customers searching the platform find nothing. Launching publicly with sparse inventory creates a negative first impression that is very difficult to recover from.

**2. Company registration (legal blocker)**
"Registered in England and Wales" on a website implies active Companies House registration. Making this claim publicly before incorporation is confirmed exposes the business to potential misrepresentation risk. The Privacy Policy also lists a different company name ("ELBOLD Event Planner Ltd") which would need to be reconciled with the registered name.

**GO conditions for public launch:**
- [ ] 15+ approved, verified vendors live across core categories
- [ ] Companies House Certificate of Incorporation received
- [ ] All 6 registration wording files updated with exact company name and company number
- [ ] Privacy Policy updated with registered company name and company number
- [ ] "ELBOLD Event Planner Ltd" vs "ELBOLD Ltd" inconsistency resolved
- [ ] At least one live booking successfully processed end-to-end in production
- [ ] Customer support email and dispute email addresses verified and monitored

---

## Issues Resolved This Sprint

| Issue | Severity | Status |
|-------|----------|--------|
| Vendor profiles showing "Vendor Not Found" in page title | HIGH | FIXED |
| "Stripe holds your deposit" inaccurate across 18 locations | HIGH | FIXED |
| Our Commitments claiming "ELBOLD cannot access your deposit" | CRITICAL | FIXED |
| "from day one" overpromise on founding-vendors page | MEDIUM | FIXED |
| Fabricated "3x more enquiries" statistic | MEDIUM | FIXED |
| JSON-LD using wrong vendor column names (bio, min_price, website_url) | LOW | FIXED |

## Issues Remaining (Open)

| Issue | Severity | Action Owner |
|-------|----------|-------------|
| Company registration wording — 6 files | HIGH | Founder — post-incorporation |
| "ELBOLD Event Planner Ltd" vs "ELBOLD Ltd" in Privacy Policy | HIGH | Founder — confirm registered name |
| Vendor supply: 20 Founding Vendors not yet reached | BUSINESS BLOCKER | Founder — vendor acquisition |
| Production payment flow not end-to-end tested | MEDIUM | Founder — test with real booking |
| Admin pilot readiness page internal wording ("Deposit held by Stripe") | LOW | Developer — convenience update |

---

## Files Changed This Sprint

```
app/vendors/[id]/page.tsx           — metadata + JSON-LD column name fixes (Priority 2)
app/our-commitments/page.tsx        — commitment C-02 rewritten (Priority 3)
components/ui/BookingPromise.tsx    — deposit wording corrected (Priority 3)
app/why-elbold/page.tsx             — 3 payment wording instances corrected (Priority 3)
app/about/page.tsx                  — 2 payment wording instances corrected (Priority 3)
app/page.tsx                        — 2 payment wording instances corrected (Priority 3)
app/how-it-works/page.tsx           — 1 payment wording instance corrected (Priority 3)
app/browse/page.tsx                 — 1 payment wording instance corrected (Priority 3)
app/support/page.tsx                — 1 payment wording instance corrected (Priority 3)
app/payment/success/page.tsx        — 1 payment wording instance corrected (Priority 3)
app/trust/page.tsx                  — 1 description corrected (Priority 3)
components/vendor/VendorProfileView.tsx  — 1 trust signal corrected (Priority 3)
lib/resend/index.ts                 — 1 email wording corrected (Priority 3)
lib/guides.ts                       — 2 guide wording instances corrected (Priority 3)
app/founding-vendors/page.tsx       — "from day one" softened (Priority 4)
components/vendor/VendorQuotesView.tsx   — "3x more enquiries" stat removed (Priority 4)
```

**No new features built. No design changes. No database migrations.**
