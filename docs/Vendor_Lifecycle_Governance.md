# Vendor Lifecycle Governance

**Date:** 2026-06-09
**Sprint:** ELBOLD Trust, Governance & Operational Readiness
**Phase:** 3

---

## Objective

Ensure vendors gain platform access in a controlled, governed sequence. No vendor should receive marketplace activity (enquiries, bookings) before the founder has explicitly reviewed and approved their application, and no vendor should go live before identity and profile quality has been confirmed.

---

## Lifecycle States

```
APPLIED
   |
   v
UNDER_REVIEW
   |
   v
APPROVED
   |
   v
PROFILE_SETUP
   |
   v
VERIFIED
   |
   v
LIVE
```

**Terminal states (off the main path):**
- REJECTED — application not meeting standards
- SUSPENDED — account suspended after approval

---

## State Definitions and Permissions

### APPLIED
**Trigger:** Vendor submits application form (POST /api/vendor/apply)
**DB values:** `status = 'pending'`, `lifecycle_state = 'applied'`

| Can Access | Cannot Access |
|---|---|
| Application status page (/vendor/onboarding) | Create packages |
| Messages (direct) | Receive enquiries |
| Support (/support) | Access marketplace features |
| Profile edit (bio, photos) | Accept bookings |

---

### UNDER_REVIEW
**Trigger:** Admin opens application in the review queue
**DB values:** `status = 'pending'`, `lifecycle_state = 'under_review'`

Same permissions as APPLIED. This state allows the admin to mark that a review is in progress without yet reaching a decision.

**Admin action:** PATCH /api/admin/vendors `{ vendor_id, lifecycle_state: "under_review" }`

---

### APPROVED
**Trigger:** Admin clicks Approve in /admin/vendors
**DB values:** `status = 'approved'`, `lifecycle_state = 'approved'`
**DB trigger:** `trg_sync_vendor_lifecycle` automatically sets lifecycle_state when status is set to 'approved'

| Can | Cannot |
|---|---|
| Build profile (bio, photos, packages) | Receive enquiries from customers |
| Upload portfolio photos | Receive bookings |
| Create service packages | Appear in marketplace search results |

---

### PROFILE_SETUP
**Trigger:** Admin confirms vendor has completed bio + packages + media
**DB values:** `status = 'approved'`, `lifecycle_state = 'profile_setup'`

**Admin action:** PATCH /api/admin/vendors `{ vendor_id, lifecycle_state: "profile_setup" }`

Shown in admin UI with "Profile Setup" button on approved vendor cards.

---

### VERIFIED
**Trigger:** Admin completes identity document review
**DB values:** `status = 'approved'`, `lifecycle_state = 'verified'`

| Can | Cannot |
|---|---|
| All of PROFILE_SETUP | Receive bookings |
| Profile visible in admin preview | Public enquiries |

**Admin action:** PATCH /api/admin/vendors `{ vendor_id, lifecycle_state: "verified" }`

Shown in admin UI with "Verify Docs" button on profile_setup vendor cards.

---

### LIVE
**Trigger:** Admin explicitly publishes the vendor to the marketplace
**DB values:** `status = 'approved'`, `lifecycle_state = 'live'`

| Can |
|---|
| Receive quote requests from customers |
| Receive and respond to bookings |
| Appear in marketplace search, browse, and featured sections |
| Receive enquiries |

**Admin action:** PATCH /api/admin/vendors `{ vendor_id, lifecycle_state: "live" }`

Shown in admin UI with "Go Live" button on verified vendor cards.

---

### REJECTED
**Trigger:** Admin rejects application
**DB values:** `status = 'rejected'`, `lifecycle_state = 'rejected'`
**DB trigger:** auto-set when `status` is set to 'rejected'

Vendor shown rejection message at /vendor/onboarding. Can reapply.

---

### SUSPENDED
**Trigger:** Admin suspends account
**DB values:** `status = 'suspended'`, `lifecycle_state = 'suspended'`
**DB trigger:** auto-set when `status` is set to 'suspended'

All marketplace access removed. Vendor shown suspension message.

---

## Implementation Summary

### Database

Migration `046_trust_governance_sprint.sql`:
- Added `lifecycle_state TEXT NOT NULL DEFAULT 'applied'` column to `vendors`
- CHECK constraint: `(applied, under_review, approved, profile_setup, verified, live, rejected, suspended)`
- `trg_sync_vendor_lifecycle` trigger syncs lifecycle_state when status changes
- Existing rows backfilled based on current status

### API Layer

**`app/api/admin/vendors/route.ts` (PATCH)**
- Accepts optional `lifecycle_state` field
- Admin can advance lifecycle independently of status transitions

**`app/api/vendor/packages/route.ts` (POST)**
- Checks `vendor.status === 'approved'` before allowing package creation
- Returns 403 with clear message if vendor is not yet approved

### Admin UI

**`components/admin/AdminVendorTable.tsx`**
- Stats bar shows all 4 status counts (Approved, Pending, Rejected, Suspended)
- Integrity check alert fires when Total != sum of statuses
- Approved vendor cards show contextual lifecycle advancement buttons:
  - approved → "Profile Setup" button
  - profile_setup → "Verify Docs" button
  - verified → "Go Live" button
  - live → "Live" indicator

---

## Enforcement Points

| Action | Guard | File |
|---|---|---|
| Create package | `vendor.status === 'approved'` | `app/api/vendor/packages/route.ts` |
| Request quote from vendor | `vendor.status === 'approved'` | `app/api/quotes/route.ts` (pre-existing) |
| Vendor media upload | No guard yet — see Recommendation 1 | |
| Vendor profile edit | No guard yet — see Recommendation 1 | |

---

## Recommendations

1. **Extend guards to media upload:** `app/api/uploads/route.ts` should also check vendor is approved before accepting uploads. Currently any pending vendor can upload photos (low risk but inconsistent with governance model).

2. **Automate profile_setup transition:** When a vendor reaches the completion threshold (bio 50+ chars, 3+ photos, 1+ package), automatically advance lifecycle_state to 'profile_setup' to reduce admin manual work.

3. **Customer-facing: only show LIVE vendors in search/browse:** The browse page currently shows `status='approved'` vendors. This should be updated to `lifecycle_state='live'` once sufficient vendors have been promoted.

---

## Success Criteria

- [x] `lifecycle_state` column added to vendors table
- [x] Trigger syncs lifecycle on status changes
- [x] Package creation blocked for non-approved vendors
- [x] Admin UI shows lifecycle advancement controls
- [ ] Apply migration 046 in Supabase Dashboard
- [ ] Advance all current approved vendors to appropriate lifecycle state
- [ ] Test: pending vendor cannot POST to /api/vendor/packages (should return 403)
- [ ] Test: approved vendor CAN POST to /api/vendor/packages
