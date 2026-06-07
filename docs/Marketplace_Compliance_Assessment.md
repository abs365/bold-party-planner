# ELBOLD Marketplace Compliance Assessment

**Author:** Revenue Integrity Audit  
**Date:** 2026-06-06  
**Status:** Research document — not legal advice  
**Audience:** Founder (decision-maker), any appointed legal counsel  
**Note:** This document is based on publicly available UK regulatory guidance. It does not constitute legal advice. Obtain a formal written opinion from an FCA-authorised payment services solicitor before operating at scale.

---

## Executive Summary

| Question | Answer |
|---|---|
| Is ELBOLD currently holding customer money? | **Yes** — customer payments land in ELBOLD's Stripe account |
| Is ELBOLD currently holding vendor money? | **Yes** — until manually transferred, vendor shares sit in ELBOLD's account |
| Does ELBOLD need FCA authorisation (current model at scale)? | **Likely yes** — legal opinion required to confirm |
| Does Stripe Connect materially reduce compliance risk? | **Yes** — eliminates the payment intermediary role |
| At what scale should ELBOLD migrate? | **Before 20+ active vendors or £10,000 GMV** |

---

## Section 1 — Is ELBOLD Holding Customer Money?

### Current fact pattern

When a customer pays a £500 deposit:
1. Stripe receives £500 from the customer's card
2. Stripe settles £500 (minus processing fees) to ELBOLD's Stripe balance
3. ELBOLD records a payment row and notifies the vendor
4. The £500 (minus ELBOLD's 10% commission) sits in ELBOLD's Stripe account
5. At some point, an admin manually bank-transfers £450 to the vendor

**Answer: Yes.** From step 2 to step 5, the £450 that belongs to the vendor is held in ELBOLD's Stripe account. ELBOLD is commingling the vendor's money with its own funds.

### The legal significance

The UK Payment Services Regulations 2017 (PSR 2017, implementing PSD2) define **money remittance** as a service where funds are received from a payer and transmitted to a payee, without creating payment accounts. ELBOLD's current flow fits this definition.

If ELBOLD is caught by PSR 2017, it must be:
- Authorised as a **Payment Institution (PI)** or **Electronic Money Institution (EMI)**, or
- Registered as a **Small Payment Institution (SPI)** (if transaction volumes are below the threshold), or
- Relying on an applicable **exemption**

---

## Section 2 — Applicable Exemptions

### 2A — Commercial Agent Exemption

**Regulation 3(1) of PSR 2017** exempts from the definition of payment services where an agent acts on behalf of **either** the payer **or** the payee (not both).

**Application to ELBOLD:**

ELBOLD could argue it acts as the vendor's commercial agent — receiving payment on the vendor's behalf. This is the exemption used historically by platforms like Airbnb and Uber.

However, the FCA has significantly narrowed its interpretation of this exemption since 2018:
- The FCA's view (CP19/3 and PS19/4) is that platforms acting for **both** buyers and sellers simultaneously cannot rely on this exemption
- ELBOLD acts for both — it presents vendor services to customers AND collects payment on the vendor's behalf

**Conclusion:** The commercial agent exemption is **unlikely to apply** to ELBOLD without legal restructuring. Do not rely on this exemption without a written solicitor's opinion.

### 2B — Limited Network Exemption

Applies where a payment instrument can only be used within a specific limited network of service providers. This applies to closed-loop gift cards and similar instruments.

**Application to ELBOLD:** Does not apply. ELBOLD's payment instrument (Stripe card payment) is a general-purpose payment method. The limited network exemption cannot be claimed.

### 2C — Small Payment Institution Registration (SPI)

If ELBOLD's total monthly payment transaction value is below **€3 million**, it may register as a Small Payment Institution rather than applying for full PI authorisation.

**Application to ELBOLD:** At pilot scale (5–20 vendors), monthly GMV is almost certainly below €3 million. However:
- SPI registration still requires FCA notification
- SPI status does not exempt from safeguarding requirements
- SPI status has a simpler registration process than full PI authorisation
- SPI status is temporary — once you exceed the threshold, you must upgrade

**This is the most relevant exemption for ELBOLD's current scale.**

---

## Section 3 — Competitor Model Analysis

| Platform | Payment model | FCA status | Notes |
|---|---|---|---|
| **Bark.com** | Lead generation only — no payment handling | Not applicable | Customers pay vendors directly |
| **Add To Event** | Lead generation + quotes — no payment | Not applicable | Customers contact vendors off-platform |
| **Hitched/Bridebook** | Directory + advertising | Not applicable | Vendors pay for listings; no customer payments |
| **Poptop** | Full booking + payment | FCA regulated (or Stripe Connect) | Accepts customer deposits, pays vendors |
| **Airbnb** | Full payment intermediary | Not FCA regulated (registered in Ireland as EMI) | Uses Stripe Connect and Irish EMI licence |
| **Uber** | Full payment intermediary | FCA authorised as EMI | Long regulatory process, circa 2014 |
| **ELBOLD (current)** | Full payment intermediary | **Not registered** | Pilot-scale risk accepted |

The key insight from this analysis: **the only platforms that accept customer payments and pay vendors without FCA authorisation are either below-threshold SPIs, or have migrated to Stripe Connect**.

---

## Section 4 — Stripe Connect as a Compliance Solution

### Why Stripe Connect changes the compliance picture

With Stripe Connect (destination charges):

```
Customer → Stripe → Vendor's Connected Stripe Account (automatic, immediate)
                  → ELBOLD's Platform Account (application fee = 10%)
```

Under this model:
- ELBOLD **never holds vendor money** — funds route directly to the vendor's Stripe account
- ELBOLD only receives its own commission (the application fee)
- Stripe is the FCA-authorised Payment Institution handling the payment service
- ELBOLD's role becomes a **commercial platform** rather than a payment intermediary

**The commercial agent argument becomes much cleaner with Connect:** ELBOLD is simply charging a platform fee for providing the marketplace. The payment service itself is provided by Stripe.

### Does Connect eliminate all regulatory exposure?

Not entirely. ELBOLD still needs to:
1. Comply with anti-money laundering (AML) regulations — Know Your Vendor obligations
2. Ensure vendors are legitimate businesses (Stripe handles KYC for connected accounts)
3. Maintain terms of service that describe the commission structure
4. File appropriate tax returns for commission income

However, the **Payment Services Regulations 2017 exposure is materially reduced** because ELBOLD is no longer in the business of receiving and transmitting funds on behalf of others.

---

## Section 5 — Required Actions (Ordered by Priority)

### Immediate (before GMV exceeds £5,000)

1. **Engage a payment services solicitor** for a formal written opinion on whether ELBOLD's current model requires SPI registration or PI authorisation. Estimated cost: £500–£2,000.

2. **Check the FCA register** for ELBOLD or any related entity:  
   https://register.fca.org.uk/  
   Confirm no existing registration or application is pending.

3. **Implement strong KYC for vendors** — even without FCA authorisation, anti-money laundering regulations require you to have reasonable confidence that vendors are legitimate. Document the vendor approval process.

### Before 20 vendors / £10,000 GMV

4. **Begin Stripe Connect migration planning.** A 2–3 week engineering effort eliminates the compliance exposure structurally.

5. **Consider SPI registration** as an interim measure if the solicitor's opinion confirms it is required. SPI registration is faster than full PI authorisation and appropriate for ELBOLD's scale.

### Before 50 vendors / £50,000 GMV

6. **Complete Stripe Connect migration.** At this scale, operating as an unlicensed payment intermediary is a material business risk, not just a theoretical one.

7. **Implement formal AML procedures** — customer due diligence for high-value bookings (typically £10,000+), suspicious transaction monitoring, record-keeping obligations.

---

## Section 6 — Safeguarding Requirements

If ELBOLD is classified as a regulated payment institution (under any pathway), it must **safeguard** customer funds. This means customer money cannot be commingled with ELBOLD's operating funds — it must be held in a designated safeguarding account.

**Current position:** ELBOLD's Stripe account is not a safeguarding account. Customer payments and ELBOLD's operating income are not separated.

**Stripe Connect solution:** Vendor funds never enter ELBOLD's account, so there is no commingling and no safeguarding obligation for vendor money. ELBOLD only receives its own commission.

---

## Section 7 — Final Assessment

ELBOLD as currently architected is a **payment intermediary under UK law**. At pilot scale with careful operations, the risk of FCA enforcement action is low. However, this risk is not zero, and it grows linearly with transaction volume and vendor count.

The correct engineering solution — Stripe Connect — also happens to be the correct regulatory solution. This is not a coincidence: Stripe Connect was designed explicitly to solve this problem for marketplace platforms.

**The founder's instinct to plan the Stripe Connect migration before significant scale is correct.**

The recommended path:

| Phase | Action | Trigger |
|---|---|---|
| Now | Obtain solicitor's opinion; document vendor KYC process | Immediate |
| Pilot | Run current model carefully; test with real transactions | 0–20 vendors |
| Pre-scale | Complete Stripe Connect migration | Before 20 vendors / £10,000 GMV |
| Growth | Operate as a compliant marketplace platform | 20+ vendors |

---

_End of Marketplace Compliance Assessment_
