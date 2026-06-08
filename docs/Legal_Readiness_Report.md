# Legal Readiness Report

**Date:** 2026-06-08  
**Entity:** ELBOLD Ltd (trading as ELBOLD Events)  
**Status:** Pre-incorporation — placeholders applied to all legal templates

This report lists every location in the live codebase where company-identifying information appears. It is the definitive reference for what to update once the Certificate of Incorporation is received.

---

## Company Identity — Current State

| Field | Current Value | Source |
|-------|--------------|--------|
| Legal company name | `ELBOLD Ltd` | Used in 5 source files (confirmed correct) |
| Trading name | `ELBOLD Events` | Used in marketing, site titles, email sender |
| Company number | `[COMPANY_NUMBER]` | Pending — not yet incorporated |
| Incorporation date | `[INCORPORATION_DATE]` | Pending |
| Registered office | `[REGISTERED_OFFICE]` | Pending |
| ICO registration | `[ICO_REGISTRATION_NUMBER]` | Pending |
| VAT number | `[VAT_NUMBER]` | Pending — determine if required |

---

## Legal Documents — Status

### Privacy Policy
**File:** `app/privacy/page.tsx`  
**URL:** `/privacy`  
**Last updated:** June 2026

| Section | Content | Status |
|---------|---------|--------|
| Who We Are (s.1) | `ELBOLD Ltd (trading as ELBOLD Events), company number [COMPANY_NUMBER], registered in England and Wales (incorporated [INCORPORATION_DATE]), operates the event planning marketplace at elbold.com. Registered office: [REGISTERED_OFFICE].` | PLACEHOLDER — populate on incorporation |
| Data controller identity | Correctly identifies ELBOLD Ltd as data controller | READY |
| Third-party processors | Supabase, Stripe, Resend, OpenAI, Vercel listed | READY |
| Data subject rights | UK GDPR rights listed; contact privacy@elbold.com | READY |
| ICO complaint right | Listed in s.11 — ICO registration number not included | ADD ICO NUMBER post-registration |

**Corrections applied this sprint:**
- Removed "ELBOLD Event Planner Ltd" (stale draft name) → replaced with `ELBOLD Ltd (trading as ELBOLD Events)`
- Removed misleading subtitle reference "at ELBOLD Event Planner"
- `lastUpdated` updated to June 2026

---

### Terms of Service
**File:** `app/terms/page.tsx`  
**URL:** `/terms`  
**Last updated:** June 2026

| Section | Content | Status |
|---------|---------|--------|
| Platform operator (s.1) | `ELBOLD Ltd (trading as ELBOLD Events), company number [COMPANY_NUMBER], registered in England and Wales, registered office: [REGISTERED_OFFICE].` | PLACEHOLDER — populate on incorporation |
| Governing law (s.12) | England and Wales | READY |
| Liability cap (s.9) | Maximum liability = fees paid in preceding 12 months | READY |
| Commission rate (s.5) | 10% — confirm this matches Stripe configuration | CONFIRM |
| VAT statement (s.6) | "Inclusive of VAT where applicable" — needs updating once VAT status confirmed | UPDATE when VAT status known |

---

### Vendor Terms
**File:** `app/vendor-terms/page.tsx`  
**URL:** `/vendor-terms`  
**Last updated:** June 2026

| Section | Content | Status |
|---------|---------|--------|
| Platform operator (s.1) | `ELBOLD Ltd (trading as ELBOLD Events), company number [COMPANY_NUMBER], registered in England and Wales, registered office: [REGISTERED_OFFICE].` | PLACEHOLDER — populate on incorporation |
| Commission (s.3) | 10% platform commission, 90% payout within 7 working days | READY |
| Subscription pricing (s.3) | Pro £29/month, Featured £79/month | CONFIRM these are current prices |
| Insurance requirement (s.7) | Public liability insurance required | READY |

---

## Footer — Legal Attribution

**File:** `components/layout/Footer.tsx:132`  
**Rendered on:** Every page

```
© {year} ELBOLD Ltd. All rights reserved. Registered in England and Wales.
```

**Status:** Correct company name. Missing company number.  
**Action post-incorporation:** Add `Company No. [COMPANY_NUMBER]` before "Registered in England and Wales."

---

## Email Templates — Legal Attribution

All email footers use `ELBOLD Ltd`. All are missing the company number.

| File | Line | Current footer | Action |
|------|------|----------------|--------|
| `lib/resend/index.ts` | 71 | `© ${year} ELBOLD Ltd · Registered in England and Wales` | Add company number |
| `lib/resend/vendor-outreach.ts` | 61 | `© ${year} ELBOLD Ltd · Registered in England and Wales` | Add company number |
| `lib/resend/verification-emails.ts` | 65 | `© ${year} ELBOLD Ltd. All rights reserved.` | Add company number |
| `app/api/concierge/route.ts` | 95 | `ELBOLD Ltd, Registered in England and Wales` | Add company number |

---

## Structured Data (JSON-LD)

**File:** `app/vendors/[id]/page.tsx:124`

The vendor profile JSON-LD does not include ELBOLD company information — only vendor-specific LocalBusiness data. No legal entity attribution is required here. No action needed.

---

## Pages Without Company-Identifying Information

The following pages refer to "ELBOLD" or "ELBOLD Events" as a brand without making legal entity claims. No updates required after incorporation.

| Page | Route | Notes |
|------|-------|-------|
| Homepage | `/` | Brand only |
| About | `/about` | Brand only |
| How It Works | `/how-it-works` | Brand only |
| Why ELBOLD | `/why-elbold` | Brand only |
| Browse | `/browse` | Brand only |
| Founding Vendors | `/founding-vendors` | Brand only |
| Trust | `/trust` | Brand only |
| Booking Protection | `/booking-protection` | Brand only |
| Support | `/support` | Brand only |

---

## Outstanding Legal Items (Not Code-Related)

| Item | Status | Priority |
|------|--------|----------|
| ICO registration (UK GDPR controller) | Not registered | HIGH — required before public launch |
| VAT registration decision | Undecided | MEDIUM — determine when approaching threshold |
| Accountant appointment | Unknown | HIGH — required for statutory filings |
| Director service address (if home address is registered office) | Unknown | HIGH — affects privacy |
| Written contracts with vendors (beyond terms of service) | Not in scope | LOW |

---

## Placeholder Search

To find all placeholders remaining in legal templates after incorporation, search:

```
grep -r "\[COMPANY_NUMBER\]\|\[REGISTERED_OFFICE\]\|\[INCORPORATION_DATE\]\|\[ICO_REGISTRATION_NUMBER\]\|\[VAT_NUMBER\]" app/
```

PowerShell equivalent:
```powershell
Select-String -Path "app\**\*.tsx" -Pattern "\[COMPANY_NUMBER\]|\[REGISTERED_OFFICE\]|\[INCORPORATION_DATE\]" -Recurse
```

Expected hits after incorporation: **zero**

---

## Summary — Actions by Priority

| Priority | Action | File | Trigger |
|----------|--------|------|---------|
| 1 | Update Privacy Policy with company number, date, office | `app/privacy/page.tsx` | Incorporation |
| 1 | Update Terms with company number and office | `app/terms/page.tsx` | Incorporation |
| 1 | Update Vendor Terms with company number and office | `app/vendor-terms/page.tsx` | Incorporation |
| 1 | Add company number to Footer | `components/layout/Footer.tsx` | Incorporation |
| 1 | Add company number to all email footers (4 files) | `lib/resend/*`, `app/api/concierge/route.ts` | Incorporation |
| 1 | Update Stripe business details | Stripe Dashboard | Incorporation |
| 2 | Register with ICO | ico.org.uk | Before public launch |
| 2 | Add ICO number to Privacy Policy | `app/privacy/page.tsx` | After ICO registration |
| 3 | Determine VAT status and update Terms | `app/terms/page.tsx` | When threshold approached |
| 3 | Create Google Business Profile | Google Business | Before public launch |
| 3 | Confirm Resend sender identity matches "ELBOLD Events" | Resend dashboard | Before public launch |
