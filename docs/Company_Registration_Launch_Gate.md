# Company Registration Launch Gate

**Status:** LAUNCH GATE — Do not proceed to public launch without resolving  
**Date:** 2026-06-08  
**Incorporator:** ELBOLD Ltd (expected with Companies House this week)

---

## Summary

ELBOLD Ltd is referenced as a registered company in 6 live files. The Companies House registration is pending as of this date. Until the Certificate of Incorporation is received, the current wording claiming company registration is premature. This document tracks every location, the required post-incorporation update, and the approved fallback wording if launch occurs before incorporation completes.

---

## Registered Wording Locations

### 1. `components/layout/Footer.tsx` — line 132
**Current wording (live on every page):**
```
© {year} ELBOLD Ltd. All rights reserved. Registered in England and Wales.
```
**Risk:** HIGH — visible on every page, footer is crawled by search engines  
**Post-incorporation update:** Replace with exact registered name, company number, and registered address (if legally required):
```
© {year} ELBOLD Ltd. Company No. XXXXXXXX. Registered in England and Wales.
```
**Fallback if launch before incorporation:**
```
© {year} ELBOLD Events. All Rights Reserved.
```

---

### 2. `lib/resend/index.ts` — line 71
**Current wording (in all customer/vendor transactional emails):**
```
© ${year} ELBOLD Ltd · Registered in England and Wales
```
**Risk:** HIGH — appears in every email sent to customers and vendors  
**Post-incorporation update:** Add company number:
```
© ${year} ELBOLD Ltd · Company No. XXXXXXXX · Registered in England and Wales
```
**Fallback if launch before incorporation:**
```
© ${year} ELBOLD Events. All Rights Reserved.
```

---

### 3. `lib/resend/vendor-outreach.ts` — line 61
**Current wording (in vendor acquisition outreach emails):**
```
© ${year} ELBOLD Ltd · Registered in England and Wales
```
**Risk:** MEDIUM — outreach emails, not customer-facing transactions  
**Post-incorporation update:** Same as resend/index.ts  
**Fallback if launch before incorporation:**
```
© ${year} ELBOLD Events. All Rights Reserved.
```

---

### 4. `lib/resend/verification-emails.ts` — line 65
**Current wording (in vendor verification emails):**
```
© ${year} ELBOLD Ltd. All rights reserved.
```
**Risk:** LOW — no "Registered in England and Wales" claim, just uses Ltd  
**Post-incorporation update:** Add company number  
**Fallback if launch before incorporation:**
```
© ${year} ELBOLD Events. All Rights Reserved.
```

---

### 5. `app/api/concierge/route.ts` — line 95
**Current wording (in concierge service emails):**
```
ELBOLD Ltd, Registered in England and Wales
```
**Risk:** MEDIUM — appears in concierge email body  
**Post-incorporation update:** Add company number  
**Fallback if launch before incorporation:**
```
ELBOLD Events
```

---

### 6. `app/privacy/page.tsx` — line 19
**Current wording (Privacy Policy page):**
```
"ELBOLD Event Planner Ltd ('ELBOLD', 'we', 'us', 'our') operates the event planning marketplace at elbold.com. We are registered in England and Wales."
```
**Risk:** HIGH — Privacy Policy is legally significant; it also uses a different company name ("ELBOLD Event Planner Ltd") from the registered name being incorporated ("ELBOLD Ltd"). This is a material inconsistency.  
**Post-incorporation update:** Align company name to exact registered name (confirm whether it is "ELBOLD Ltd" or "ELBOLD Event Planner Ltd"), add company number and registered address:
```
ELBOLD Ltd (Company No. XXXXXXXX, registered in England and Wales) ('ELBOLD', 'we', 'us', 'our') operates the event planning marketplace at elbold.com.
```
**Fallback if launch before incorporation:**
```
ELBOLD Events ('ELBOLD', 'we', 'us', 'our') operates the event planning marketplace at elbold.com.
```

---

## Company Name Inconsistency — URGENT

**Two different company names appear in the live codebase:**
- `ELBOLD Ltd` — used in Footer, resend emails, concierge
- `ELBOLD Event Planner Ltd` — used in Privacy Policy

**Action required:** Confirm exact name being registered with Companies House before incorporation completes. Update Privacy Policy to match the exact registered name the moment the Certificate of Incorporation is received.

---

## Action Plan — Post-Incorporation

When the Certificate of Incorporation is received from Companies House:

1. Confirm exact registered company name and company number
2. Update all 6 files above with:
   - Correct company name
   - Company number
   - "Registered in England and Wales" (already present in most files)
3. Update Privacy Policy (highest legal priority) with full registered address if required
4. Redeploy to production — do not leave registration wording without a company number live

**Estimated time to deploy post-incorporation:** 30 minutes

---

## Fallback Procedure — If Launch Before Incorporation

If the public launch date arrives before the Certificate of Incorporation is received, apply the following changes:

**Files to update:**
- `components/layout/Footer.tsx:132` → `© {year} ELBOLD Events. All Rights Reserved.`
- `lib/resend/index.ts:71` → `© ${year} ELBOLD Events. All Rights Reserved.`
- `lib/resend/vendor-outreach.ts:61` → `© ${year} ELBOLD Events. All Rights Reserved.`
- `lib/resend/verification-emails.ts:65` → `© ${year} ELBOLD Events. All Rights Reserved.`
- `app/api/concierge/route.ts:95` → `ELBOLD Events`
- `app/privacy/page.tsx:19` → `ELBOLD Events ('ELBOLD', 'we', 'us', 'our') operates the event planning marketplace at elbold.com. ELBOLD Events is a UK-based event marketplace brand.`

**Note:** Avoid "Registered in England and Wales" and "Ltd" suffix until Companies House confirms registration.

---

## Status Checklist

- [ ] Certificate of Incorporation received from Companies House
- [ ] Exact registered company name confirmed
- [ ] Company number added to all 6 files
- [ ] Privacy Policy updated with registered company details
- [ ] "ELBOLD Event Planner Ltd" vs "ELBOLD Ltd" inconsistency resolved
- [ ] Production deployment confirmed
