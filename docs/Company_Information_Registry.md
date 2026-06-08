# Company Information Registry

**Entity:** ELBOLD Ltd (trading as ELBOLD Events)  
**Purpose:** Single source of truth for all company-identifying information  
**Status:** PENDING — populate on incorporation  
**Last updated:** 2026-06-08

---

## Legal Identity

| Field | Value |
|-------|-------|
| **Legal Company Name** | ELBOLD Ltd |
| **Trading Name** | ELBOLD Events |
| **Company Type** | Private Limited Company |
| **Company Number** | `[COMPANY_NUMBER]` |
| **Incorporation Date** | `[INCORPORATION_DATE]` |
| **Jurisdiction** | England and Wales |

---

## Registered Office

| Field | Value |
|-------|-------|
| **Registered Office Address** | `[REGISTERED_OFFICE_LINE_1]` |
| | `[REGISTERED_OFFICE_LINE_2]` |
| | `[REGISTERED_OFFICE_POSTCODE]` |
| **Country** | England |

> Note: If the registered office is a residential address, consider using a registered office service to protect founder privacy. The registered office is publicly searchable on Companies House.

---

## Directors

| Name | Role | Appointed | Service Address |
|------|------|-----------|-----------------|
| `[DIRECTOR_NAME]` | Director | `[INCORPORATION_DATE]` | `[SERVICE_ADDRESS]` |

> Note: A service address (distinct from home address) can be used for director records on Companies House.

---

## Taxation

| Field | Value |
|-------|-------|
| **Corporation Tax Reference** | `[CT_REFERENCE]` — auto-assigned by HMRC |
| **VAT Registration** | Not currently required / `[VAT_NUMBER]` |
| **VAT Threshold** | £90,000 taxable turnover in a rolling 12-month period |
| **Accounting Year End** | `[YEAR_END_DATE]` |
| **First Accounts Due** | `[FIRST_ACCOUNTS_DATE]` (21 months from incorporation for new companies) |
| **First Confirmation Statement Due** | `[FIRST_CONFIRMATION_DATE]` (within 14 days of first incorporation anniversary) |

---

## Data Protection

| Field | Value |
|-------|-------|
| **ICO Registration** | `[ICO_REGISTRATION_NUMBER]` |
| **Data Protection Officer** | Not required (small business) — queries to privacy@elbold.com |
| **UK GDPR Role** | Data Controller |
| **Registration Renewal** | Annual — auto-reminder from ICO |

---

## Operational Accounts

| Platform | Account | Status |
|----------|---------|--------|
| **Stripe** | Business account under ELBOLD Ltd | Confirm legal name matches |
| **Resend** | Sender domain: elbold.com | Confirm DKIM/SPF/DMARC active |
| **Supabase** | Project: bold-party-planner | Running |
| **Vercel** | Deployment: www.elbold.com | Running |
| **GitHub** | Repository: abs365/bold-party-planner | Running |
| **Google Business** | Not yet created | Create at incorporation |

---

## Contact Addresses (Monitored)

| Address | Purpose | Monitored |
|---------|---------|-----------|
| support@elbold.com | Customer support | Confirm |
| disputes@elbold.com | Dispute resolution | Confirm |
| privacy@elbold.com | Data protection enquiries | Confirm |
| vendor-support@elbold.com | Vendor support | Confirm |
| quality@elbold.com | Vendor quality reports | Confirm |
| urgent@elbold.com | No-show emergencies | Confirm |

---

## Accountant / Professional Advisers

| Role | Name / Firm | Contact |
|------|-------------|---------|
| **Accountant** | `[ACCOUNTANT_NAME]` | `[ACCOUNTANT_CONTACT]` |
| **Registered Office Provider** | `[PROVIDER]` if using service | `[PROVIDER_CONTACT]` |

---

## How to Use This Registry

1. When the Certificate of Incorporation arrives, populate all `[PLACEHOLDER]` fields above.
2. Use the values here as the single source of truth when updating code files.
3. Do not update code files from memory — copy values directly from this document.
4. Update this document whenever company information changes (new director, new address, VAT registration, ICO renewal).
5. Keep a printed copy with the Certificate of Incorporation.

---

## Verification Links

- Companies House search: https://find-and-update.company-information.service.gov.uk/
- ICO registration: https://ico.org.uk/registration
- HMRC Corporation Tax: https://www.gov.uk/register-for-corporation-tax
- VAT registration: https://www.gov.uk/register-for-vat
