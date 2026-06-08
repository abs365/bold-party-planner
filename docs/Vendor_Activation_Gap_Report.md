# P0-05 Vendor Activation Gap Report

**Date:** 2026-06-07  
**Subject:** Ballet vendor approved with 0 packages and 0 bookings  
**Verdict:** Approval criteria are too weak. Packages must be required before approval.

---

## Current State of the Ballet Vendor

| Metric | Value |
|---|---|
| Status | approved |
| Packages | 0 |
| Bookings | 0 |
| Quotes received | 0 (assumed) |
| Verification level | Unknown (likely 0 or 1) |

The vendor is approved and visible on the marketplace, but:
1. Has no service packages — customers cannot request a quote tied to a specific service or price
2. Has 0 bookings — they have never received or converted a lead
3. Cannot receive meaningful leads without packages defined

---

## What Prevents an Approved Vendor from Becoming Active

An "active" vendor is one who has received at least one quote request and can respond to it.

The 8-stage activation model (from `/admin/vendor-activation`) requires:
1. Application submitted
2. Verification completed (`verification_level >= 2`)
3. Approved (`status = "approved"`)
4. Profile completed (bio + phone + city)
5. **Media uploaded (at least 1 photo)**
6. **Services added (at least 1 package)**
7. First quote received
8. First booking received

The Ballet vendor is at Stage 3 but missing Stages 4-6. They cannot progress to Stage 7 (first quote) in any meaningful way because:
- **Without packages:** Customers see an empty pricing section on the vendor profile. There is nothing to quote from. Customers leave.
- **Without photos:** The vendor card shows a dark navy placeholder. Customers are unlikely to click through.
- **Without a complete profile:** The vendor appears unprofessional and does not inspire trust.

---

## Root Cause: Approval Criteria Are Insufficient

The current admin approval flow (`/admin/vendors`) allows approving any vendor in "pending" status regardless of their profile completeness. There is no checklist enforced before the Approve button becomes active.

Before this sprint, the Approve button had no guard:
```typescript
<button onClick={() => updateVendor(vendorId, { status: "approved" }, "Approval")}>
  Approve
</button>
```

---

## Fix Applied in This Sprint

Added a confirmation dialog when admin tries to approve a vendor with 0 packages:

```typescript
onClick={() => {
  const pkgCount = packages?.length ?? 0;
  if (pkgCount === 0) {
    if (!window.confirm(
      `${vendorName} has 0 service packages. Customers cannot request a quote without packages. Approve anyway?`
    )) return;
  }
  void updateVendor(vendorId, { status: "approved" }, "Approval");
}}
```

Additionally, pending vendors with 0 packages now show an amber warning in the admin table:
```
⚠ no packages
```

This is a warning, not a hard block. The founder retains the ability to approve without packages (useful for founding vendors who are still setting up).

---

## Recommended Actions

### Immediate (this week)
1. **Contact the Ballet vendor.** Ask them to add at least 1 service package and 3 photos before they start receiving leads. The `/vendor/services` and `/vendor/media` pages are functional — they just need to use them.
2. **Apply migration 039d** so the verification system works. Ballet vendor (and all vendors) should complete document verification to reach Level 2.

### Before Approving New Vendors
For all future vendor approvals, verify the following before clicking Approve:
- [ ] Bio is 50+ characters (visible in vendor table)
- [ ] At least 1 service package created (shown in vendor table with ⚠ warning)
- [ ] At least 3 photos uploaded (visible in vendor table — media thumbnail shown)
- [ ] City/service area set
- [ ] Phone number added

### Structural Recommendation: Require Packages Before Approval
**Verdict: Yes, packages should be mandatory before approval.**

Reasoning:
- A vendor with no packages cannot receive a structured quote request
- Customers who visit an empty profile bounce immediately
- The platform's promise is "trusted professionals" — an empty profile does not build trust
- The activation checklist already includes packages as Stage 6 — enforce it earlier

**Proposed rule:** An admin can only approve a vendor who has at least 1 active package. The current warning approach is a step in the right direction; it should be escalated to a hard block in the next sprint.

---

## Approval Criteria Comparison

| Criterion | Currently Enforced? | Recommended |
|---|---|---|
| Application submitted | Yes (implicit) | Yes |
| Email confirmed | No | Yes |
| Phone added | No | Yes |
| Bio 50+ chars | No | Yes |
| City set | No | Yes |
| At least 1 package | No (warning only) | **Hard block** |
| At least 1 photo | No | Recommended |
| Verification Level 1 | No | Yes (auto-checked) |

---

## What "Vendor Active" Means

A vendor is only truly active when they have received and responded to a quote request within 30 days of approval. By that definition, the Ballet vendor is not active despite being approved.

The admin should monitor the `/admin/vendor-activation` page weekly to identify approved vendors who are stalling at activation stages and reach out to them directly.

---

## Activation Outreach Template for Ballet Vendor

> Hi [name],
>
> Welcome to ELBOLD! Your application has been approved and your profile is live.
>
> To start receiving enquiries from customers, there are two quick steps:
>
> 1. Add your services and pricing at https://www.elbold.com/vendor/services
> 2. Upload 3-5 photos of your work at https://www.elbold.com/vendor/media
>
> Once those are in place, customers searching in your area can find and enquire with you directly.
>
> The ELBOLD team
