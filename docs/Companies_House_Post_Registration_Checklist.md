# Companies House Post-Registration Checklist

**Entity:** ELBOLD Ltd (trading as ELBOLD Events)  
**Status:** PENDING INCORPORATION  
**Owner:** Founder  
**Last updated:** 2026-06-08

Complete every item the day the Certificate of Incorporation arrives. Do not wait.

---

## Part A — Information to Record from the Certificate

When the Certificate of Incorporation is received, record these values here and in every file listed in Part B.

| Field | Value |
|-------|-------|
| **Company Number** | `[COMPANY_NUMBER]` |
| **Exact Registered Company Name** | `ELBOLD Ltd` *(confirm on certificate)* |
| **Incorporation Date** | `[INCORPORATION_DATE]` |
| **Registered Office Address** | `[REGISTERED_OFFICE]` |

---

## Part B — Immediate Code Updates (target: same day as incorporation)

### B1 — Privacy Policy
- [ ] **File:** `app/privacy/page.tsx`
  - Replace `[COMPANY_NUMBER]` with actual company number
  - Replace `[INCORPORATION_DATE]` with actual date
  - Replace `[REGISTERED_OFFICE]` with actual registered office address
  - Confirm `lastUpdated` value is current

### B2 — Terms of Service
- [ ] **File:** `app/terms/page.tsx`
  - Replace `[COMPANY_NUMBER]` with actual company number
  - Replace `[REGISTERED_OFFICE]` with actual registered office address
  - Confirm `lastUpdated` value is current

### B3 — Vendor Terms
- [ ] **File:** `app/vendor-terms/page.tsx`
  - Replace `[COMPANY_NUMBER]` with actual company number
  - Replace `[REGISTERED_OFFICE]` with actual registered office address
  - Confirm `lastUpdated` value is current

### B4 — Footer
- [ ] **File:** `components/layout/Footer.tsx:132`
  - Current: `© {year} ELBOLD Ltd. All rights reserved. Registered in England and Wales.`
  - Update to: `© {year} ELBOLD Ltd. Company No. [COMPANY_NUMBER]. Registered in England and Wales.`

### B5 — Email Footer (all transactional emails)
- [ ] **File:** `lib/resend/index.ts:71`
  - Current: `© ${year} ELBOLD Ltd · Registered in England and Wales`
  - Update to: `© ${year} ELBOLD Ltd · Company No. [COMPANY_NUMBER] · Registered in England and Wales`

### B6 — Vendor Outreach Emails
- [ ] **File:** `lib/resend/vendor-outreach.ts:61`
  - Same update as B5

### B7 — Verification Emails
- [ ] **File:** `lib/resend/verification-emails.ts:65`
  - Current: `© ${year} ELBOLD Ltd. All rights reserved.`
  - Update to: `© ${year} ELBOLD Ltd (Company No. [COMPANY_NUMBER]). All rights reserved.`

### B8 — Concierge API Email
- [ ] **File:** `app/api/concierge/route.ts:95`
  - Current: `ELBOLD Ltd, Registered in England and Wales`
  - Update to: `ELBOLD Ltd (Company No. [COMPANY_NUMBER]), Registered in England and Wales`

---

## Part C — Director and Officer Information

- [ ] Confirm director name(s) as they appear on the Companies House register
- [ ] Confirm whether a company secretary has been appointed
- [ ] Note: Director names do not need to appear on the website unless legally required for your business type
- [ ] Check if the registered office is a home address — if so, use a service address for any public-facing documents

---

## Part D — VAT Registration

- [ ] Determine if VAT registration is required:
  - Mandatory if taxable turnover exceeds £90,000 in a 12-month period
  - Optional voluntary registration if below threshold (allows VAT reclaim)
- [ ] If VAT registered:
  - Record VAT number: `[VAT_NUMBER]`
  - Update Terms of Service section 6 ("All prices on the Platform are in British Pounds (GBP) and are inclusive of VAT where applicable") to clarify current VAT status
  - Add VAT number to invoices and receipts issued to customers
  - Add VAT number to Footer if required for your business type
- [ ] If not yet VAT registered: no immediate action required

---

## Part E — ICO Registration (UK GDPR)

- [ ] Confirm whether ICO registration is required:
  - Required if you process personal data as a data controller (ELBOLD almost certainly qualifies)
  - Annual fee: £40–£60 for small businesses / charities; £60 for others
- [ ] Register at: ico.org.uk/registration
- [ ] Record ICO Registration Number: `[ICO_REGISTRATION_NUMBER]`
- [ ] Update Privacy Policy section 11 to add: `ICO Registration Number: [ICO_REGISTRATION_NUMBER]`
- [ ] File: `app/privacy/page.tsx` — section 11 "Contact and Complaints"

---

## Part F — Business Bank Account

- [ ] Open a business bank account in the name of ELBOLD Ltd (personal accounts are unsuitable for limited companies)
- [ ] Update Stripe payout bank account details to the ELBOLD Ltd business account
- [ ] Confirm payout currency: GBP
- [ ] Ensure payroll / director salary arrangements are confirmed with your accountant

---

## Part G — Stripe Business Details

- [ ] Log in to Stripe Dashboard → Settings → Business
- [ ] Confirm legal business name matches: `ELBOLD Ltd`
- [ ] Confirm business type: `Private limited company`
- [ ] Add company number: `[COMPANY_NUMBER]`
- [ ] Confirm registered business address matches Companies House record
- [ ] Confirm VAT status is set correctly (once determined)
- [ ] Confirm payout bank account is the ELBOLD Ltd business account (not personal)

---

## Part H — Resend Sender Identity

- [ ] Log in to Resend dashboard
- [ ] Confirm sender name is: `ELBOLD Events` (or `ELBOLD` — not "ELBOLD Event Planner")
- [ ] Confirm reply-to addresses are monitored:
  - `support@elbold.com`
  - `privacy@elbold.com`
  - `disputes@elbold.com`
  - `vendor-support@elbold.com`
  - `quality@elbold.com`
- [ ] Confirm domain verification for `elbold.com` is active (DKIM, SPF, DMARC)

---

## Part I — Google Business Profile

- [ ] Create or claim Google Business Profile at business.google.com
- [ ] Business name: `ELBOLD Events` (trading name)
- [ ] Category: `Event Planning Service` or `Online Marketplace`
- [ ] Website: `www.elbold.com`
- [ ] Phone: confirm monitored number
- [ ] Service area: UK (or London, Kent, Essex if region-specific)
- [ ] Add description aligned with current marketing copy (no "Stripe holds" language)
- [ ] Do not list a home address — use service area only if registered office is private

---

## Part J — Accounting and Filing Obligations

- [ ] Appoint an accountant familiar with limited company requirements
- [ ] Confirm accounting year end date (usually incorporation date anniversary or 31 March)
- [ ] Note first annual accounts deadline: 21 months from incorporation date for new companies
- [ ] Note first Confirmation Statement deadline: within 14 days of incorporation anniversary
- [ ] Note Corporation Tax registration: HMRC automatically notifies — confirm CT reference received
- [ ] Note: director salary and dividends must be structured correctly for tax purposes

---

## Completion Sign-Off

| Item | Completed | Date | Notes |
|------|-----------|------|-------|
| Certificate of Incorporation received | | | |
| Company number recorded | | | |
| Privacy Policy updated and deployed | | | |
| Terms of Service updated and deployed | | | |
| Vendor Terms updated and deployed | | | |
| Footer updated with company number | | | |
| Email templates updated | | | |
| Stripe business details confirmed | | | |
| Resend sender confirmed | | | |
| ICO registration completed | | | |
| Google Business Profile live | | | |
| Business bank account opened | | | |
| Accountant appointed | | | |
