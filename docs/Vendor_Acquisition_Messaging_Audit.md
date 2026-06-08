# Vendor Acquisition Messaging Audit

**Date:** 2026-06-08  
**Sprint:** Marketplace Review Round 2 — Priority 4  
**Status:** COMPLETE — confirmed issues fixed; no "guaranteed bookings" or "instant leads" found

---

## Context

The goal of vendor acquisition messaging is to recruit 20 real, verified Founding Vendors. Overpromising creates two risks: (1) vendors feel misled when early enquiry volume is low, causing churn; (2) regulatory exposure if messaging is deemed misleading advertising (CAP Code). The standard applied here is: promises must be achievable at soft launch with zero or minimal existing customers.

---

## Phrases Checked (Not Found)

The following phrases from the brief were searched across the entire codebase and were **not found**:

- "Guaranteed bookings" — NOT PRESENT
- "Instant leads" — NOT PRESENT
- "Customers waiting now" — NOT PRESENT
- "Start receiving enquiries within days" — NOT PRESENT (only "from day one" variant found)

---

## Overpromising Instances Found and Fixed

### 1. `app/founding-vendors/page.tsx` — line 481

**Old wording:**
> Everything you need to start receiving enquiries from day one, with placement advantages that stay with you permanently.

**Problem:** "from day one" implies customers are already waiting on the platform. At launch, ELBOLD has no established customer base. This cannot be guaranteed.

**New wording:**
> Everything you need to be visible to early customers when ELBOLD launches, with placement advantages that stay with you permanently.

---

### 2. `components/vendor/VendorQuotesView.tsx` — line 365

**Old wording:**
> Profiles with more photos receive 3x more enquiries

**Problem:** This is an invented statistic. No data exists to support "3x." Presenting made-up metrics as fact is a CAP Code violation risk.

**New wording:**
> Profiles with more photos attract significantly more enquiries

---

## Instances Reviewed — Acceptable (No Change)

| File | Line | Phrase | Assessment |
|------|------|--------|------------|
| `app/founding-vendors/page.tsx` | 87 | "Start receiving enquiries" (step label) | Process description, not a promise |
| `app/founding-vendors/page.tsx` | 41 | "Verified vendors with complete profiles typically receive more enquiries than incomplete listings" | Qualified claim ("typically") — acceptable |
| `app/founding-vendors/page.tsx` | 83 | "Better profiles receive more enquiries" (step description) | General truism — acceptable |
| `app/founding-vendors/page.tsx` | 697 | "Start receiving booking enquiries." (CTA headline) | Aspirational CTA, not a factual promise — acceptable |
| `components/vendor/VendorApplyForm.tsx` | 160, 242 | "Go live and start receiving enquiries from customers" | Step description — acceptable |
| `components/vendor/VendorOnboardingProgress.tsx` | 57 | "start receiving leads" | In-platform completion prompt — acceptable |
| `(auth)/signup/page.tsx` | 299 | "start receiving enquiries" | Post-signup prompt — acceptable |
| `app/founding-vendors/page.tsx` | metadata | "Reach customers actively searching for event professionals" | Aspirational but not a guarantee — acceptable |

---

## Founding Vendor Page — Overall Assessment

The founding-vendors page uses careful language throughout ("20 founding spaces," "manual review," "typically"). The strongest remaining promise is "permanent top-of-page placement" — this is deliverable and clearly scoped to within the ELBOLD platform. No further changes required.

---

## Recommendations

1. **Do not add volume claims** (e.g., "over 500 customers searching weekly") until real data exists to support them.
2. **Do not add case study results** (e.g., "Vendor X received 12 enquiries in their first month") until the platform has completed bookings with willing participants.
3. **Use "when ELBOLD launches" language** for any timeline-dependent promises. Avoid "now," "immediately," or "from day one."
4. **Review again** at 20-vendor milestone — add social proof from real vendors, replacing aspirational copy with testimonials.
