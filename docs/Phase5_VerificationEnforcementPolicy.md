# Phase 5 — Vendor Verification Enforcement Policy

**Date:** 2026-06-07
**Status:** Active policy
**Applies to:** All vendors on the ELBOLD marketplace

---

## Purpose

This policy exists because trust badges are meaningful only if they are earned. A badge that appears without supporting evidence does not protect customers. It misleads them. This policy defines what verification is required before specific platform privileges are granted, and what happens when those requirements are not met.

---

## Verification Levels

ELBOLD uses a four-level verification system. Each level represents a progressively stronger check.

**Level 0: Unverified**
The vendor has registered but submitted no verification documents. No trust badge is displayed to customers. The vendor's profile is visible but carries no verification signal.

**Level 1: Email Confirmed**
The vendor's email address has been confirmed. This happens automatically on registration. No customer-facing badge is displayed at this level because no documents have been checked. Customers do not see "Email Confirmed" as a trust signal.

**Level 2: ID Verified**
The vendor has submitted a government-issued photo ID and it has been reviewed and approved by the ELBOLD team. The "ID Verified" badge is displayed on the vendor's profile and in all search results.

**Level 3: Address Verified**
The vendor has submitted proof of address and it has been approved. The "Address Verified" badge is displayed. This level also confirms Level 2.

**Level 4: Business Verified**
The vendor has submitted company registration documents or professional accreditation and these have been approved. The "Business Verified" badge is displayed. This is the highest standard verification level.

---

## Badge Grant Rules

The following rules are enforced by the platform. They are not discretionary.

### Founding Vendor Badge

**Requirement:** Vendor must have verification_level >= 1 AND be manually flagged as is_founding_vendor by an admin.

**Rationale:** The Founding Vendor badge signals that a vendor was part of ELBOLD's original cohort. Granting it to an unconfirmed account creates a misrepresentation risk. Email confirmation is a minimum credibility check.

**Enforcement:** The is_founding_vendor flag is admin-controlled. Admins should only set this flag after confirming the vendor's email is confirmed. The badge will not appear unless this condition is met in the code.

### Featured Placement

**Requirement:** Vendor must have status = "approved" AND verification_level >= 1 AND at least one active service package.

**Rationale:** Featured placement puts a vendor in front of every homepage visitor. A vendor with no verification and no packages cannot deliver a booking. Featuring them wastes customer attention and risks a bad first impression.

**Enforcement:** The featured flag can be set by admin. Admins should review the vendor profile before setting this flag. A quality check should confirm: profile photo uploaded, 3+ portfolio images, 1+ package, bio written.

### ID Verified Badge (customer-visible)

**Requirement:** verification_level >= 2 (government ID reviewed and approved).

**Rationale:** The ID Verified label tells customers that ELBOLD has checked this person's identity. This is a material claim. It must only appear when a real document has been reviewed.

**Enforcement:** The badge is rendered automatically from verification_level in the codebase. No code change is needed. The responsibility is on the admin reviewing verification submissions to set the correct level only after the document has been inspected.

### Address Verified Badge

**Requirement:** verification_level >= 3.

**Enforcement:** Same as above.

### Business Verified and Premium Partner Badges

**Requirement:** verification_level >= 4, set manually after review of company documents.

**Enforcement:** This level is admin-set and should only be applied after reviewing registered company documentation such as a Companies House number or professional certification.

---

## Approval Without Verification

The approval standards checklist (Phase 3B) requires phone number, phone verified, 1+ package, 3+ photos, and a 50-character bio before the standard approval flow.

These minimum standards ensure a vendor is capable of receiving and completing a booking before they go live on the marketplace.

**Approving a vendor who does not meet these standards is possible through the admin override, but it carries risk.** A vendor without packages cannot receive quote requests. A vendor without photos will receive significantly fewer enquiries. An unverified vendor will convert at a lower rate.

If you approve a vendor before they meet the standard checklist, document the reason in admin notes and follow up with that vendor directly to complete their profile.

---

## Verification Review Process

When a vendor submits documents for verification:

1. The submission appears in the admin verification queue at /admin/verifications.
2. An admin reviews the document for authenticity: is it real, is it legible, is it current, does the name match the business registration.
3. If approved: set the verification_level to the appropriate number. The vendor is automatically notified and the badge appears on their profile.
4. If rejected: record a specific reason. The vendor is notified with guidance on what to resubmit.
5. If unclear: request resubmission with a better photo. Do not reject purely on image quality if the document appears genuine.

Target review time: within 24 hours of submission on business days.

---

## Revoking Verification

Verification can be revoked if a vendor is found to have submitted fraudulent documents, if their account is suspended, or if their legal name or business status changes materially.

To revoke: reduce the verification_level to the appropriate level. The relevant badge is automatically removed. The vendor is notified.

---

## Enforcement Summary

| Privilege | Minimum Requirement | Admin Action Required |
|---|---|---|
| Founding Vendor badge | Level 1 + is_founding_vendor flag | Yes |
| Featured placement | Level 1 + package + photos | Yes, with quality check |
| ID Verified badge | Level 2 | No (automatic from level) |
| Address Verified badge | Level 3 | No (automatic from level) |
| Business Verified badge | Level 4 | Yes, with document review |
| Marketplace approval | Phone + package + photos + bio | Yes, via approval queue |

---

## Non-Negotiable Rules

No vendor displays a verification badge without the corresponding document having been reviewed.

No vendor receives Founding Vendor status without being manually confirmed by an admin.

No vendor appears in Featured placement without a complete, photo-rich profile.

These rules protect customers. They also protect every legitimate vendor on the platform, because the credibility of any one badge depends on every badge being earned.
