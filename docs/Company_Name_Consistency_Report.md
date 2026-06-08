# Company Name Consistency Report

**Date:** 2026-06-08  
**Status:** AWAITING FOUNDER CONFIRMATION — do not change any code until confirmed  
**Triggered by:** Inconsistency identified in Company_Registration_Launch_Gate.md

---

## Issue

Two different company names exist in the live codebase. Only one can be the legal registered name. The correct name must be confirmed before the Certificate of Incorporation is received so that all files are updated atomically once it arrives.

---

## The Two Names Found

| Name | Count in source code | Files |
|------|---------------------|-------|
| **ELBOLD Ltd** | 5 instances | Footer, 3 email templates, concierge API |
| **ELBOLD Event Planner Ltd** | 2 instances | Privacy Policy only |

---

## Evidence That the Intended Name Is: ELBOLD Ltd

### 1. Volume (5:1)
"ELBOLD Ltd" is used in 5 separate source files. "ELBOLD Event Planner Ltd" appears in exactly one file, and only in that file's "Who We Are" section.

### 2. The Footer
`components/layout/Footer.tsx:132` — rendered on every page of the site — reads:
```
© {year} ELBOLD Ltd. All rights reserved. Registered in England and Wales.
```
The footer is the most publicly visible legal attribution on a website. If "ELBOLD Event Planner Ltd" were the intended name, the footer would use it.

### 3. All email footers use "ELBOLD Ltd"
Three separate email template files — transactional emails, verification emails, vendor outreach — all carry the footer:
```
© {year} ELBOLD Ltd · Registered in England and Wales
```
These are sent to customers and vendors. If the registered name were "ELBOLD Event Planner Ltd," this would expose every outgoing email to a mismatch.

### 4. Prior internal documentation
`docs/Founder_Identity_Review.md` (line 148) states:
```
Current (assumed): "ELBOLD Ltd." or similar
```
This confirms that at the time that document was prepared, "ELBOLD Ltd" was understood to be the company name.

### 5. "ELBOLD Event Planner Ltd" is only in the Privacy Policy
Privacy Policies are frequently copied from templates and edited. The longer name "ELBOLD Event Planner Ltd" has the hallmarks of an earlier draft name — descriptive, slightly generic — that was superseded by the shorter "ELBOLD Ltd" as the brand crystallised.

---

## Conclusion (Provisional — Requires Founder Confirmation)

**The intended registered company name is: ELBOLD Ltd**

"ELBOLD Event Planner Ltd" in the Privacy Policy is a stale draft artifact. It should be corrected to "ELBOLD Ltd" at the same time all other post-incorporation updates are applied.

**The founder must confirm this before the Certificate of Incorporation is filed.** If "ELBOLD Event Planner Ltd" is actually the name being submitted to Companies House, then the 5 instances of "ELBOLD Ltd" in the footer and email templates are the errors, not the Privacy Policy.

---

## All Files — Current State

### Correct name: "ELBOLD Ltd" (keep, update with company number post-incorporation)

| File | Line | Current wording |
|------|------|-----------------|
| `components/layout/Footer.tsx` | 132 | `© {year} ELBOLD Ltd. All rights reserved. Registered in England and Wales.` |
| `lib/resend/index.ts` | 71 | `© ${year} ELBOLD Ltd · Registered in England and Wales` |
| `lib/resend/vendor-outreach.ts` | 61 | `© ${year} ELBOLD Ltd · Registered in England and Wales` |
| `lib/resend/verification-emails.ts` | 65 | `© ${year} ELBOLD Ltd. All rights reserved.` |
| `app/api/concierge/route.ts` | 95 | `ELBOLD Ltd, Registered in England and Wales` |

### Incorrect name: "ELBOLD Event Planner Ltd" (fix post-incorporation)

| File | Line | Current wording | Required correction |
|------|------|-----------------|---------------------|
| `app/privacy/page.tsx` | 13 | `subtitle="How we collect, use, and protect your personal data at ELBOLD Event Planner."` | Change to `at ELBOLD.` or `at ELBOLD Events.` |
| `app/privacy/page.tsx` | 19 | `"ELBOLD Event Planner Ltd ('ELBOLD', 'we', 'us', 'our') operates..."` | Change to `"ELBOLD Ltd (Company No. XXXXXXXX, registered in England and Wales) ('ELBOLD', 'we', 'us', 'our') operates..."` |

### No company name specified (acceptable — no action required)

| File | Current wording | Note |
|------|-----------------|------|
| `app/terms/page.tsx` | Refers to "ELBOLD" throughout, no "Ltd" suffix | Terms use brand name only — acceptable |
| `app/vendor-terms/page.tsx` | Refers to "ELBOLD" throughout, no "Ltd" suffix | Terms use brand name only — acceptable |

---

## Third Variant Noted: "ELBOLD Events"

The brand name "ELBOLD Events" (without "Ltd") appears in multiple marketing contexts — page titles, SEO descriptions, email sender names. This is the **trading name / brand name**, not the legal company name. It does not need to match the Companies House registration and does not need to be changed.

The distinction:
- **Legal name:** ELBOLD Ltd (registered with Companies House — pending)
- **Trading name / brand:** ELBOLD Events (used in marketing, site titles, SEO)

Both can coexist. The Privacy Policy and footer use the legal name; marketing copy uses the brand name. This is standard UK practice.

---

## Post-Incorporation Action Plan

When the Certificate of Incorporation arrives:

### Step 1 — Confirm these three things from the certificate
```
Registered company name: ___________________________
Company number:          ___________________________
Registered office:       ___________________________
```

### Step 2 — Update Privacy Policy (highest legal priority)
**File:** `app/privacy/page.tsx`

Change line 13:
```
subtitle="How we collect, use, and protect your personal data at ELBOLD Event Planner."
```
→
```
subtitle="How we collect, use, and protect your personal data."
```

Change line 19:
```
"ELBOLD Event Planner Ltd ('ELBOLD', 'we', 'us', 'our') operates the event planning marketplace at elbold.com. We are registered in England and Wales.",
```
→
```
"ELBOLD Ltd (Company No. [NUMBER], registered in England and Wales) ('ELBOLD', 'we', 'us', 'our') operates the event planning marketplace at elbold.com.",
```

### Step 3 — Add company number to footer and emails

**File:** `components/layout/Footer.tsx:132`
```
© {year} ELBOLD Ltd. Company No. [NUMBER]. Registered in England and Wales.
```

**File:** `lib/resend/index.ts:71`
```
© ${year} ELBOLD Ltd · Company No. [NUMBER] · Registered in England and Wales
```

**File:** `lib/resend/vendor-outreach.ts:61`  
```
© ${year} ELBOLD Ltd · Company No. [NUMBER] · Registered in England and Wales
```

**File:** `lib/resend/verification-emails.ts:65`
```
© ${year} ELBOLD Ltd (Company No. [NUMBER]). All rights reserved.
```

**File:** `app/api/concierge/route.ts:95`
```
ELBOLD Ltd (Company No. [NUMBER]), Registered in England and Wales
```

### Step 4 — Deploy and verify

Estimated development time: 20 minutes. Deploy immediately after the Certificate is received — do not delay.

---

## Founder Confirmation Required

Before proceeding with any updates, confirm:

- [ ] **The name being registered with Companies House is: ELBOLD Ltd** *(yes / no — if no, state the correct name)*
- [ ] "ELBOLD Event Planner Ltd" in the Privacy Policy is a draft artifact to be corrected *(yes / no)*
- [ ] The registered office address to be included in the Privacy Policy *(if required by UK GDPR — typically yes for controllers)*
