# Registration Completion Audit

**Date:** 2026-06-08  
**Entity:** ELBOLD Ltd (trading as ELBOLD Events)  
**Purpose:** Confirm every legal reference is correctly named and all placeholders are in position before incorporation completes.

---

## Audit Result: READY FOR INCORPORATION

All legal documents have been updated. All company-identifying locations carry the correct legal name and placeholder fields. No conflicting company names remain in the live codebase.

---

## Legal Documents

### Privacy Policy — `app/privacy/page.tsx` → `/privacy`

| Check | Status | Detail |
|-------|--------|--------|
| Company name | PASS | "ELBOLD Ltd (trading as ELBOLD Events)" |
| [COMPANY_NUMBER] | IN PLACE | Section 1 "Who We Are" |
| [INCORPORATION_DATE] | IN PLACE | Section 1 "Who We Are" |
| [REGISTERED_OFFICE] | IN PLACE | Section 1 "Who We Are" |
| No conflicting names | PASS | "ELBOLD Event Planner Ltd" removed |
| lastUpdated | PASS | June 2026 |
| Data controller identification | PASS | Present in section 1 |
| ICO complaint right | PASS | Section 11 — ICO number to be added post-registration |

**Full operator line (live now):**
> ELBOLD Ltd (trading as ELBOLD Events), company number [COMPANY_NUMBER], registered in England and Wales (incorporated [INCORPORATION_DATE]), operates the event planning marketplace at elbold.com. Registered office: [REGISTERED_OFFICE].

---

### Terms of Service — `app/terms/page.tsx` → `/terms`

| Check | Status | Detail |
|-------|--------|--------|
| Company name | PASS | "ELBOLD Ltd (trading as ELBOLD Events)" |
| [COMPANY_NUMBER] | IN PLACE | Section 1 |
| [REGISTERED_OFFICE] | IN PLACE | Section 1 |
| No conflicting names | PASS | Only "ELBOLD" brand used elsewhere |
| lastUpdated | PASS | June 2026 |
| Governing law | PASS | England and Wales (section 12) |

**Full operator line (live now):**
> The Platform is operated by ELBOLD Ltd (trading as ELBOLD Events), company number [COMPANY_NUMBER], registered in England and Wales, registered office: [REGISTERED_OFFICE].

---

### Vendor Terms — `app/vendor-terms/page.tsx` → `/vendor-terms`

| Check | Status | Detail |
|-------|--------|--------|
| Company name | PASS | "ELBOLD Ltd (trading as ELBOLD Events)" |
| [COMPANY_NUMBER] | IN PLACE | Section 1 |
| [REGISTERED_OFFICE] | IN PLACE | Section 1 |
| No conflicting names | PASS | Only "ELBOLD" brand used elsewhere |
| lastUpdated | PASS | June 2026 |

---

### Refund Policy — `app/refunds/page.tsx` → `/refunds`

| Check | Status | Detail |
|-------|--------|--------|
| Company name | PASS | "ELBOLD Ltd (trading as ELBOLD Events)" |
| [COMPANY_NUMBER] | IN PLACE | Section 1 "Overview" |
| [REGISTERED_OFFICE] | IN PLACE | Section 1 "Overview" |
| No conflicting names | PASS | Only "ELBOLD" brand used elsewhere |
| lastUpdated | PASS | June 2026 |
| Payment accuracy | PASS | "Deposits are held securely by ELBOLD" |

---

### Booking Protection — `app/booking-protection/page.tsx` → `/booking-protection`

| Check | Status | Detail |
|-------|--------|--------|
| Company name | N/A | This is a trust/feature page, not a legal contract. No entity identification required. |
| No conflicting names | PASS | Uses "ELBOLD" brand only |
| Payment accuracy | PASS | "Payments are held by ELBOLD and not released to vendors until after your event is completed." (line 23) |
| No legal entity attribution needed | PASS | Policy links to Refund Policy and Terms which carry full entity identification |

---

## Footer — `components/layout/Footer.tsx` → Rendered on every page

| Check | Status | Detail |
|-------|--------|--------|
| Company name | PASS | "ELBOLD Ltd (trading as ELBOLD Events)" |
| [COMPANY_NUMBER] | IN PLACE | `Company No. [COMPANY_NUMBER]` |
| Full line (live now) | — | `© {year} ELBOLD Ltd (trading as ELBOLD Events). Company No. [COMPANY_NUMBER]. Registered in England and Wales.` |

---

## Email Templates

All four email template files now carry "ELBOLD Ltd (trading as ELBOLD Events)" with the [COMPANY_NUMBER] placeholder.

| File | Status | Full Footer Line |
|------|--------|-----------------|
| `lib/resend/index.ts` | PASS | `© ${year} ELBOLD Ltd (trading as ELBOLD Events) · Company No. [COMPANY_NUMBER] · Registered in England and Wales` |
| `lib/resend/vendor-outreach.ts` | PASS | Same as above |
| `lib/resend/verification-emails.ts` | PASS | `© ${year} ELBOLD Ltd (trading as ELBOLD Events) · Company No. [COMPANY_NUMBER]. All rights reserved.` |
| `app/api/concierge/route.ts` | PASS | `ELBOLD Ltd (trading as ELBOLD Events) · Company No. [COMPANY_NUMBER] · Registered in England and Wales` |

---

## Trust Pages — `app/trust/page.tsx` → `/trust`

| Check | Status | Detail |
|-------|--------|--------|
| Company name | N/A | Brand/trust page, no legal entity identification required |
| No conflicting names | PASS | Uses "ELBOLD" brand only |
| Booking protection link | PASS | Previously corrected to remove "Stripe holds" language |

---

## Conflicting Company Names — Final Sweep

Searching for "ELBOLD Event Planner" across all source files:

| Result | Count |
|--------|-------|
| Source files (`.tsx`, `.ts`) | **0** |
| Documentation files (`.md`) | 8 (in archived audit docs — harmless) |

**"ELBOLD Event Planner Ltd" has been fully removed from all live source files.**

---

## Placeholder Inventory

All placeholders currently in live source files:

| Placeholder | Locations | Count |
|-------------|-----------|-------|
| `[COMPANY_NUMBER]` | Footer, resend/index, resend/vendor-outreach, resend/verification-emails, concierge/route, privacy/page, terms/page, vendor-terms/page, refunds/page | **9** |
| `[INCORPORATION_DATE]` | privacy/page | **1** |
| `[REGISTERED_OFFICE]` | privacy/page, terms/page, vendor-terms/page, refunds/page | **4** |

**Total placeholder replacements required at incorporation: 14**  
**Estimated time: 5 minutes if done via find-and-replace**

---

## Post-Audit Status

| Area | Status |
|------|--------|
| Company name — legal documents | CLEAN |
| Company name — footer | CLEAN |
| Company name — email templates | CLEAN |
| Conflicting names | NONE REMAINING |
| Placeholder positions | ALL IN PLACE |
| Payment messaging accuracy | CLEAN (corrected in previous sprint) |
| Vendor acquisition messaging | CLEAN (corrected in previous sprint) |
| Vendor profile routing | FIXED (corrected in previous sprint) |

**ELBOLD is legally ready for incorporation. On the day the Certificate arrives, execute `Post_Incorporation_Execution_Checklist.md`.**
