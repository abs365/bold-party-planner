# Pre-Launch Priority 3 — Verification Audit Action List

**Date:** 2026-06-07
**Sprint:** ELBOLD Pre-Launch Operations
**Objective:** Review all approved vendors for verification gaps. Generate a specific action for every vendor who is missing evidence.

---

## How to Run This Audit

1. Log in as admin
2. Navigate to: /admin/verification-audit
3. The page shows every approved vendor sorted by gap count (most gaps first)
4. Work through vendors from top to bottom — most urgent first
5. Record actions taken in the table below

---

## What Each Gap Means

### No phone number
The vendor has not provided a phone number anywhere on their profile. This prevents phone verification and reduces customer confidence. Customer-facing impact: no phone number visible on profile.

Action: email the vendor and ask them to add their phone number via /vendor/profile.

### Phone not verified
The vendor has a phone number on record but it has not been confirmed as theirs.

Action: use the admin vendor manager to toggle phone_verified once you have confirmed verbally or via SMS that the number is correct.

### Email not confirmed (Level 0)
The vendor registered but never confirmed their email address. This should not happen in practice because Supabase requires email confirmation to access the platform — but check it if this flag appears.

Action: ask the vendor to check their confirmation email or resend it via Supabase Auth dashboard.

### ID not verified (Level below 2)
No government-issued photo ID has been submitted and reviewed. The ID Verified badge is not shown to customers (by design). However, customers will see an unverified profile in search results and convert at lower rates.

Action: send the verification reminder email via /api/admin/outreach (emailType: "verification"). Ask them to upload documents at /vendor/verification. Review submission within 24 hours via /admin/verifications.

### Address not verified (Level below 3)
No proof of address has been submitted. Less critical than ID at launch, but worth chasing once ID is confirmed.

Action: after ID is complete, ask the vendor to also submit proof of address for full Address Verified status.

---

## Gap Severity

Not all gaps are equal. Here is the priority order for chasing:

1. No packages — blocks all quote requests (chase immediately, this is a business blocker)
2. ID not verified — lowest trust badge level visible to customers
3. No phone number — second biggest trust gap
4. Phone not verified — minor (number exists but unconfirmed)
5. Address not verified — low priority at launch, good to have

---

## Vendor Action Table

Fill this from /admin/verification-audit. List every approved vendor and their specific gaps.

| Vendor Name | Phone Gap | Email Gap | ID Gap | Address Gap | Gaps Total | Action | Date Chased | Resolved |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |

---

## Sending the Verification Reminder Email

Use the outreach API to send the verification reminder to vendors with Level 0 or Level 1 verification.

POST to /api/admin/outreach:

```json
{
  "vendorId": "vendor-uuid-here",
  "emailType": "verification"
}
```

The email includes:
- Specific list of missing verifications
- Link to /vendor/verification
- Explanation of why verification matters to customers

---

## Target Outcome

Before opening to real customers, every approved vendor should be at:
- Verification Level 2 (ID Verified) — minimum
- Phone number provided and phone_verified = true
- Email confirmed (Level 1+) — handled by Supabase automatically

The target is not Level 4 (Business Verified) at launch. Level 2 is sufficient for the Founding Vendor cohort to appear trustworthy to first customers.

---

## What to Do After the Audit

Update docs/Phase4_LaunchReadinessReport.md Section 3 (Verification) with:
- Count of fully verified vendors
- Count of partially verified vendors
- Count of vendors needing verification
- Specific outstanding gaps that have not yet been resolved
- Whether any trust badges are displaying without supporting evidence (should be zero)
