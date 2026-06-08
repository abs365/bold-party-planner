# Pre-Launch Priority 2 — Vendor Cohort Review

**Date:** 2026-06-07
**Sprint:** ELBOLD Pre-Launch Operations
**Objective:** Review all pending vendors, produce a recommendation table, and approve the first 5 high-quality vendors.

---

## How to Run This Review

1. Log in as admin
2. Navigate to: /admin/cohort
3. The page shows all pending vendors sorted by readiness score, with priority vendors (Mastaly, Baptist, Tinms) pinned to the top
4. For each vendor, review the readiness score, verification status, packages, and photos
5. Open the vendor's public profile in a new tab to see what a customer would see
6. Record your decision in the table below

---

## Approval Criteria

### Approve (green)
Readiness score 50%+ AND at least 1 package AND at least 1 photo.

This vendor can receive quote requests and has enough information to convert customer interest.

### Approve with Caution (amber)
Readiness score 35%+ AND at least 1 package, but photos are sparse or bio is thin.

Approve and send a profile completion reminder immediately. Flag for 7-day follow-up.

### Needs Work (orange)
Has a package OR readiness 20%+, but missing key elements.

Do not approve yet. Send targeted outreach identifying the specific gap. Review again in 7 days.

### Decline (red)
No packages, no photos, no meaningful bio. Readiness below 20%.

Decline the current application with a clear explanation and an invitation to reapply when the profile is complete.

---

## Recommendation Table

Fill this table from /admin/cohort after reviewing each vendor.

| Vendor Name | Category | Readiness | Verification | Packages | Photos | Recommendation | Action Taken |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |

---

## What to Do After Approving a Vendor

### 1. Send the Founding Vendor Welcome email

The API endpoint for this is at /api/admin/outreach.

Send a POST request with:

```json
{
  "vendorId": "vendor-uuid-here",
  "emailType": "welcome"
}
```

Or do this from the admin panel if you have the outreach UI wired.

Alternatively, email the vendor directly from blue2gtv@gmail.com with:

Subject: You're live on ELBOLD — welcome to the Founding Vendor Programme

Body: personalised version of the welcome content in lib/resend/vendor-outreach.ts

### 2. Flag as Founding Vendor in the database

Run in Supabase SQL Editor:

```sql
UPDATE vendors
SET is_founding_vendor = true
WHERE business_name = 'Vendor Name Here';
```

Confirm verification_level >= 1 before running this. The Founding Vendor badge only displays with email confirmed (L1+).

### 3. Send a verification reminder (if not yet ID verified)

If the vendor is approved but at verification_level 0 or 1, send the verification reminder immediately.

POST to /api/admin/outreach with emailType = "verification".

### 4. Record the approval in the Vendor Pipeline spreadsheet in Google Drive

Update: ELBOLD Vendor Pipeline — change status from Prospect/Interested/Registered to Approved.

### 5. Follow up in 48 hours

If the vendor has not completed their profile 48 hours after approval, send the profile completion reminder.

---

## Cohort Target

Goal: 5 approved vendors before opening to real customers. 10 approved vendors before any marketing spend.

| Metric | Target | Current |
|---|---|---|
| Approved vendors | 5 (minimum) / 10 (target) | __ |
| Approved with ID verified (L2+) | At least 3 of the 5 | __ |
| Approved with 3+ photos | All approved | __ |
| Approved with 1+ packages | All approved | __ |
| Approved with 50+ char bio | At least 4 of 5 | __ |

---

## Priority Vendor Notes

The cohort page pins these vendors to the top of the queue because they were identified as early contacts:

**Mastaly** — Review first. Confirmed to have at least 3 packages (most complete in the pipeline).

**Baptist** — Review second. Check package and photo status before approving.

**Tinms** — Review third. Verify bio length and phone verification before approving.

If any of these vendors are ready, approve them before moving on to other pending applications.

---

## After the Review

Update docs/Phase4_LaunchReadinessReport.md Section 2 (Vendors) with:
- Total approved count
- Whether priority vendors are approved
- Average readiness score across approved vendors
- Gap summary for any approved vendors who need follow-up
