# P0-02 Vendor End-to-End Journey Audit

**Date:** 2026-06-07  
**Method:** Code trace through every route and API in the vendor journey  
**Verdict:** Journey has 3 launch-blocking gaps and 4 friction points

---

## Journey Map

| Stage | Route | Status | Verdict |
|---|---|---|---|
| 1. Registration | `/signup` or `/vendor/apply` | Works | OK |
| 2. Profile | `/vendor/onboarding` | Works | OK |
| 3. Packages | `/vendor/services` | Works | OK |
| 4. Photos | `/vendor/media` | Works | OK |
| 5. Availability | `/vendor/availability` | Works | OK |
| 6. Verification | `/vendor/verification` | **Operational** | ✅ FIXED (Sprint 2 retest) |
| 7. Application review | `/vendor/onboarding` (pending state) | Works | OK |
| 8. Approval | Admin action at `/admin/vendors` | Works | OK |
| 9. Visibility | `/browse`, `/vendors/[id]` | Works after approval | OK |
| 10. Lead receipt | `/vendor/quotes` | Works | OK |

---

## Stage-by-Stage Analysis

### Stage 1 — Registration

**Route:** `/signup` → email confirm → `/api/auth/callback` → `/vendor/apply`

**Status:** Functional but with a known redirect issue.

- Auth callback at `/api/auth/callback` correctly routes vendors to `/vendor/apply` if `user_metadata.role === "vendor"`
- If the user signed up via `/signup` (generic), they land at `/dashboard` with a prompt to choose their role
- The `/onboarding` page handles missing-role users

**Gap (non-blocking):** A vendor who signs up at `/signup` instead of `/founding-vendors` → `/vendor/apply` has to manually navigate to `/vendor/apply`. No automatic redirect from generic signup to vendor flow.

---

### Stage 2 — Profile

**Route:** `/vendor/onboarding`

**Status:** Functional. `VendorOnboardingProgress` shows Level 1 checklist completion. `VendorOnboardingWizard` allows editing bio, city, phone.

---

### Stage 3 — Packages

**Route:** `/vendor/services`

**Status:** Functional. `VendorServicesManager` allows creating packages with price, description, duration.

**Gap:** No minimum package requirement enforced before a vendor can submit for approval. A vendor with 0 packages can be reviewed and approved. Once approved, customers visit their profile and see no packages to quote from.

---

### Stage 4 — Photos

**Route:** `/vendor/media`

**Status:** Functional. `VendorMediaManager` allows uploading to `vendor-images` bucket (confirmed created, migration 037 applied).

---

### Stage 5 — Availability

**Route:** `/vendor/availability`

**Status:** Functional. Calendar shows blocked dates. Vendor can set unavailable dates.

---

### Stage 6 — Verification

**Route:** `/vendor/verification`

**Status:** OPERATIONAL — confirmed via production retest (Sprint 2). See `Verification_Fix_Report.md`.

All 4 RLS policies confirmed applied. Authenticated INSERTs to `vendor_verifications` and `verification_activity_log` both succeed. `verification-documents` storage bucket exists.

**Note:** The `/vendor/verification` route guard redirects users with `role = "admin"`. Admin accounts cannot access this page by design. Test with a vendor-role account (e.g. `balletman20@yahoo.com`).

---

### Stage 7 — Application Review

**Route:** `/vendor/onboarding` (pending state)

**Status:** Functional. Vendors in `status = "pending"` see a 5-stage lifecycle timeline:
1. Application Received
2. Review In Progress (active)
3. Verification
4. Profile Published
5. Active Vendor

This is clear and well-designed.

---

### Stage 8 — Approval

**Route:** Admin `/admin/vendors`

**Status:** Functional. Admin can approve/reject with one click.

**Gap:** No enforcement of minimum criteria before approval. Admin can approve a vendor with:
- 0 packages
- 0 photos
- Verification level 0

A warning is now shown for vendors with 0 packages (fix applied in this sprint).

---

### Stage 9 — Visibility

**Routes:** `/browse`, `/vendors/[id]`, `/categories/[category]`

**Status:** Functional once `status = "approved"`. Approved vendors appear in search, browse, and category pages.

---

### Stage 10 — Lead Receipt

**Routes:** `/vendor/quotes`, `/vendor/dashboard`

**Status:** Functional. Customers can send quote requests. Vendors see them in their quotes view with accept/decline actions.

---

## Launch Blockers (must fix before inviting vendors)

### ~~BLOCKER 1 — Verification System (P0-01)~~ RESOLVED
Migration 039d is applied. RLS policies confirmed operational via production retest. Not a launch blocker.

### BLOCKER 1 — Zero Packages (formerly BLOCKER 2)
**A vendor with 0 packages is invisible to customers who want to compare service options.** Customers can still send a general quote request but have no package pricing to reference. Vendors should have at least 1 package before going live.

**Recommendation:** Add packages as a required checklist item before admin approval. The admin warning added in this sprint is a first step. Consider enforcing it.

### BLOCKER 2 — Verification Required for Visibility (formerly BLOCKER 3)
Currently, vendors can be approved with verification_level = 0. This is intentional (founder can approve manually without doc verification). But customers see NO trust badge for unverified vendors. This reduces conversion.

**Recommendation:** Require at least Level 1 verification (email + profile complete) before approval. Level 2 (document submission) can follow post-approval.

---

## Friction Points (non-blocking but impactful)

| ID | Issue | Location | Fix |
|---|---|---|---|
| F-01 | No progress indicator showing how close vendor is to going live | Dashboard | Add completion % widget |
| F-02 | Vendor doesn't know why they're not visible after approval | Dashboard | Add "your profile is now live" email post-approval |
| F-03 | No prompt to add packages before verification | Onboarding | Add packages CTA on Level 1 checklist |
| F-04 | No guidance that verification is required to rank higher | Verification page | Add ranking benefit copy |

---

## Success Criteria Check

| Criterion | Status |
|---|---|
| Register | ✅ Working |
| Upload documents | ✅ Working (backend confirmed operational) |
| Complete verification | ✅ Working (RLS policies applied, Sprint 2 retest passed) |
| Submit application | ✅ Working (part of registration) |
| Get approved | ✅ Working (admin action) |
| Become visible | ✅ Working (after approval) |
| Receive leads | ✅ Working (after approval, needs packages) |

**Verdict:** The journey is 7/7 working end-to-end. The verification system was confirmed operational via production retest. No backend blockers remain in the vendor journey.
