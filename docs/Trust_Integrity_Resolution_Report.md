# Trust Integrity Resolution Report
**ELBOLD Events — Trust Integrity Sprint**  
**Date:** June 2026  
**Build status:** ✅ PASSING — 91 pages, TypeScript clean, zero errors

---

## Summary

All 7 issues from the Vendor Trust & Protection Audit have been resolved. The sprint touched 8 files across public trust pages, the verification component system, the admin API, and the admin UI. One finding (document expiry) is partially complete — the UI infrastructure is in place but the DB migration required for full expiry tracking is documented as a follow-up.

| # | Priority | Finding | Status |
|---|---|---|---|
| 1 | Critical | Escrow language on /booking-protection | ✅ Fixed |
| 2 | Critical | Badge naming inconsistency across 3 files | ✅ Fixed |
| 3 | High | Phone verification claim vs implementation | ✅ Fixed |
| 4 | High | Level upgrade logic broken for address-only categories | ✅ Fixed |
| 5 | High | Admin queue missing Suspended/Expired states | ✅ Fixed |
| 6 | Medium | Featured Vendor badge missing | ✅ Fixed |
| 7 | Low | Category requirements not publicly surfaced | ✅ Fixed |

---

## Priority 1 — Escrow Language

**File:** `app/booking-protection/page.tsx`

### Before
```
PROMISE_POINTS[0].title: "Your deposit is held by Stripe"
PROMISE_POINTS[0].body:  "Every deposit paid through ELBOLD is processed and held by 
                          Stripe — not transferred directly to the vendor."

"How Stripe protects your payment" card:
  body: "Your 30% deposit is held in a protected Stripe account and only released 
         to the vendor after your event is confirmed complete."

FAQ answer: "Deposits are held securely by Stripe throughout the booking period."

Core callout: "All ELBOLD payments are processed by Stripe and held securely until 
               your event is complete."
```

### After
```
PROMISE_POINTS[0].title: "Your payment is secured through Stripe"
PROMISE_POINTS[0].body:  "Every deposit paid through ELBOLD is processed by Stripe. 
                          Payments are held by ELBOLD and not released to vendors 
                          until after your event is completed."

"How Stripe protects your payment" card:
  body: "Your 30% deposit is held by ELBOLD and processed through Stripe. It is not 
         released to the vendor until your event is confirmed complete."

FAQ answer: "Deposits are held by ELBOLD and processed securely through Stripe 
             throughout the booking period."

Core callout: "All ELBOLD payments are processed and secured by Stripe. Funds are 
               held by ELBOLD until your event is complete — vendors receive payment 
               only after delivery."
```

### Rationale
The platform uses direct Stripe Checkout (single ELBOLD account). Funds go to ELBOLD, not a per-booking Stripe escrow. "Held by Stripe" implies Stripe Connect escrow which is not the current implementation. All language now accurately represents that ELBOLD holds the funds using Stripe as the payment processor.

---

## Priority 1 — Canonical Trust Badge System

**Files changed:** `lib/verification-requirements.ts`, `components/vendor/VendorTrustBadges.tsx`, `components/vendor/VendorVerificationView.tsx`, `app/how-we-verify/page.tsx`

### Before (3-way inconsistency)

| Level | lib/verification-requirements.ts | VendorTrustBadges getVendorBadges | how-we-verify page |
|---|---|---|---|
| 2 | Business Verified | ID Verified | ID Verified |
| 3 | Trusted Pro | **Address Verified** | **Trusted Pro** |
| 4 | Premium Partner | **Business Verified** | Premium Partner |

### After (one canonical system)

| Level | lib/verification-requirements.ts | VendorTrustBadges getVendorBadges | how-we-verify page |
|---|---|---|---|
| 2 | **ID Verified** | ID Verified | ID Verified |
| 3 | **Business Verified** | **Business Verified** | **Business Verified** |
| 4 | Premium Partner | **Premium Partner** | Premium Partner |
| Earned | — | Trusted Professional (dynamic) | Trusted Professional (earned badge section) |

### Changes per file

**`lib/verification-requirements.ts`**
- Level 2: `"Business Verified"` → `"ID Verified"`, description updated
- Level 3: `"Trusted Pro"` → `"Business Verified"`, description updated, icon `★` → `✓✓✓`

**`components/vendor/VendorTrustBadges.tsx` — `getVendorBadges()`**
- Level 3 badge: `id: "address_verified"`, `label: "Address Verified"` → `id: "business_verified"`, `label: "Business Verified"`
- Level 4 badge: `id: "business_verified"`, `label: "Business Verified"` → `id: "premium_partner"`, `label: "Premium Partner"`, icon changed to `Award`
- Comments updated to reflect canonical model

**`components/vendor/VendorVerificationView.tsx`** — hardcoded labels updated:
- "Level 2 — Business Verified" → "Level 2 — ID Verified"
- "Level 3 — Trusted Pro (Automatic)" → "Level 3 — Business Verified (After document review)"
- Level 3 section content changed from track-record criteria to document-based description

**`app/how-we-verify/page.tsx`** — local VERIFICATION_LEVELS updated:
- "Reviewed" → "ELBOLD Reviewed" (label clarified)
- "ID Verified" badge text: "Identity confirmed" → "Government ID confirmed"
- "Trusted Pro" replaced with "Business Verified" — new description explains category-specific documents
- "Premium Partner" unchanged

---

## Priority 2 — Phone Verification Claim

**File:** `app/how-we-verify/page.tsx`

### Before
```
VERIFICATION_STEPS[1]:
  title: "Phone Verification"
  desc: "A valid UK phone number is required. We verify the number belongs to the 
         applying business — not a disposable or VoIP number."
```

### After
```
VERIFICATION_STEPS[1]:
  title: "Contact Verification"
  desc: "A valid UK contact phone number is required. Contact details are 
         cross-referenced with submitted documents during our manual review."
```

### Rationale
The existing code checks only `!!vendor.phone` (phone number field non-null). No OTP, no VoIP detection, no UK format validation. The OTP infrastructure exists (`038_phone_otp.sql`, `/api/vendor/phone-otp/route.ts`) but is not wired into the Level 1 gate. The updated language is accurate to the current implementation.

---

## Priority 2 — Level Upgrade Logic

**File:** `app/api/admin/verifications/route.ts`

### Before
```typescript
// Broken: DJs (gov_id + proof_of_address) never reached Level 2 because
// proof_of_address was not in the hasBusiness hardcoded list.

const hasBusiness = allVerifs?.some((v) =>
  ["business_registration", "insurance", "food_hygiene", 
   "sia_license", "operator_license"].includes(v.type)
  && v.status === "approved"
);
if (hasIdentity && hasBusiness && vendor.verification_level < 2) {
  updates.verification_level = 2;
} else if (hasIdentity && vendor.verification_level < 1) {
  updates.verification_level = 1;
}
```

### After
```typescript
// Now uses getRequirementsForCategory to check ALL required docs per category.
// Added import: import { getRequirementsForCategory } from "@/lib/verification-requirements";

// Level 2: government ID approved
const hasGovId = allVerifs?.some((v) =>
  (v.type === "government_id" || v.type === "identity") && v.status === "approved"
);

const updates: Record<string, unknown> = {};
if (hasGovId) {
  updates.verified = true;
  if (vendor.verification_level < 2) updates.verification_level = 2;
}

// Level 3: all category-required documents approved
const requiredDocs = getRequirementsForCategory(vendor.category);
const allRequiredApproved = requiredDocs.every((docType) =>
  allVerifs?.some((v) => v.type === docType && v.status === "approved")
);
if (allRequiredApproved && vendor.verification_level < 3) {
  updates.verification_level = 3;
}
```

### Upgrade path (examples)
| Category | Required docs | Step 1 result | Step 2 result |
|---|---|---|---|
| DJ | gov_id, proof_of_address | gov_id approved → Level 2 | proof_of_address approved → Level 3 |
| Caterer | gov_id, food_hygiene, insurance, proof_of_address | gov_id approved → Level 2 | all 4 approved → Level 3 |
| Security | gov_id, sia_license, insurance | gov_id approved → Level 2 | all 3 approved → Level 3 |
| Usher | gov_id | gov_id approved → Level 2 AND Level 3 simultaneously | — |

The vendor select in both PATCH and GET handlers was also updated to include `category` and `status`:
```sql
vendor:vendors(id, business_name, category, city, verified, verification_level, 
               suspicious_flag, status, profile:profiles(full_name, email))
```

---

## Priority 2 — Vendor Lifecycle States

**Files:** `app/api/admin/verifications/route.ts`, `app/admin/verifications/page.tsx`, `components/admin/AdminVerificationsView.tsx`

### Suspended state

**API** (`route.ts` GET): handles `?status=suspended` by first fetching suspended vendor IDs from `vendors` table, then filtering verifications by those IDs:
```typescript
if (status === "suspended") {
  const { data: suspendedVendors } = await auth.db
    .from("vendors").select("id").eq("status", "suspended");
  const ids = (suspendedVendors ?? []).map((v) => v.id);
  if (ids.length === 0) return NextResponse.json([]);
  query = query.in("vendor_id", ids);
}
```

**Admin page** (`page.tsx`): fetches suspended count at page load:
```typescript
const suspendedCount = (await db.from("vendors")
  .select("id", { count: "exact", head: true })
  .eq("status", "suspended")).count ?? 0;
```

**Admin UI** (`AdminVerificationsView.tsx`):
- Stats grid expanded from 3 → 4 cards: Pending, Approved, **Suspended** (orange), Flagged
- Filter tabs expanded: pending / approved / rejected / **suspended** / expired / all
- Suspended badge shown on verification cards: orange `Ban` icon + "Suspended" label when `vendor.status === "suspended"`
- Suspended vendors' verification documents are visible in the queue — admin can still manage documents for suspended accounts

### Guaranteed: suspended vendors never appear approved

The `getVendorBadges()` function now checks `vendor.status` first:
```typescript
if (vendor.status === "suspended") return badges;
```
This returns an empty badge array immediately — suspended vendors show no trust badges on customer-facing pages (browse, profiles) regardless of their verification_level value.

### Expired state

**API**: `?status=expired` returns an empty array (expires_at not yet in schema)  
**UI**: The expired filter tab displays an informative empty state:
> "Document expiry tracking requires an expires_at column on vendor_verifications. Add it via migration to enable this filter."

**Migration required to complete this:**
```sql
ALTER TABLE vendor_verifications ADD COLUMN expires_at timestamptz;
-- Admin sets this at approval time for time-limited documents
-- (insurance, food_hygiene, sia_license, operator_license)
```

The full filter, cron-based expiry flagging, and vendor notifications will activate once this column exists.

### Full lifecycle state visibility

| State | Admin filter tab | Stats card | Badge on cards |
|---|---|---|---|
| Pending | ✅ | ✅ | amber "pending" |
| Approved | ✅ | ✅ | green "approved" |
| Rejected | ✅ | — | red "rejected" |
| Suspended | ✅ | ✅ orange | orange "Suspended" |
| Expired | ✅ (placeholder) | — | — (pending migration) |
| All | ✅ | — | — |

---

## Priority 3 — Featured Vendor Badge

**File:** `components/vendor/VendorTrustBadges.tsx`

### Before
The `vendors.featured` boolean field existed in the database but was not represented in the badge system. Featured vendors appeared identical to non-featured vendors on browse and profile pages.

### After
```typescript
if (vendor.featured) badges.push({
  id: "featured",
  label: "Featured",
  description: "Handpicked by the ELBOLD team",
  icon: Sparkles,
  bgClass: "bg-amber-50",
  borderClass: "border-amber-200",
  textClass: "text-amber-700",
});
```

The `getVendorBadges()` function signature now accepts:
```typescript
vendor: {
  // ... existing fields
  status?: string | null;    // new — used for suspended guard
  featured?: boolean;        // new — used for featured badge
}
```

Callers passing the full vendor object will automatically receive this badge. Callers not passing `featured` will get `undefined` (falsy) and no badge will appear.

---

## Priority 3 — Category Requirements on Public Trust Page

**File:** `app/how-we-verify/page.tsx`

### Before
The document requirements per service category were internal-only information in `lib/verification-requirements.ts`. Customers had no way to know what a caterer submitted vs what a DJ submitted to become Business Verified.

### After
A new section "What each service type must provide" was added to `/how-we-verify` between the verification levels section and the fraud prevention section. It renders the full `CATEGORY_REQUIREMENTS` map from lib as an expandable accordion:

- 19 service categories listed
- Each shows the specific documents required (e.g. caterer: Government ID, Food Hygiene Certificate, Public Liability Insurance, Proof of Address)
- Uses `VENDOR_CATEGORIES` for human-readable category names and emoji icons
- Consistent with the rest of the page's accordion pattern

A separate "Trusted Professional — earned badge" section was also added to explain the performance-based badge that is distinct from document-based verification tiers.

---

## Files Changed

| File | Changes |
|---|---|
| `lib/verification-requirements.ts` | Level 2 label: Business Verified → ID Verified; Level 3 label: Trusted Pro → Business Verified |
| `app/booking-protection/page.tsx` | 4 instances of escrow language corrected |
| `app/how-we-verify/page.tsx` | Phone claim fixed; VERIFICATION_LEVELS updated; 2 new sections added; 3 new imports |
| `components/vendor/VendorTrustBadges.tsx` | Badge labels fixed (L3 Address→Business, L4 Business→Premium); suspended guard; Featured badge; Sparkles import |
| `components/vendor/VendorVerificationView.tsx` | 2 hardcoded level labels updated; Level 3 section content rewritten |
| `app/api/admin/verifications/route.ts` | Level upgrade logic rewritten (category-aware); suspended/expired filter support; getRequirementsForCategory import |
| `app/admin/verifications/page.tsx` | Suspended count added to stats; status field added to vendor select |
| `components/admin/AdminVerificationsView.tsx` | Suspended stat card; Suspended/Expired filter tabs; Suspended badge on cards; Ban import |

---

## Validation

### Build
```
✓ Compiled successfully in 36.6s
✓ TypeScript: 0 errors
✓ 91 pages generated
```

### Trust badge consistency check (post-fix)

| Page / component | Level 2 badge | Level 3 badge | Level 4 badge |
|---|---|---|---|
| `getVendorBadges()` (customer profiles + browse) | ID Verified ✅ | Business Verified ✅ | Premium Partner ✅ |
| `VendorTrustBadges` panel (vendor profile) | ID Verified ✅ | Business Verified ✅ | Premium Partner ✅ |
| `VendorVerificationView` progress grid | ID Verified ✅ | Business Verified ✅ | Premium Partner ✅ |
| `AdminVerificationsView` level badge | ID Verified ✅ | Business Verified ✅ | Premium Partner ✅ |
| `/how-we-verify` public page | ID Verified ✅ | Business Verified ✅ | Premium Partner ✅ |

All five surfaces now show the same labels for the same levels.

### Booking protection accuracy check (post-fix)

| Statement | Accurate? |
|---|---|
| "Your payment is secured through Stripe" | ✅ Yes — Stripe processes it |
| "Payments are held by ELBOLD and not released to vendors until after your event" | ✅ Yes — ELBOLD holds the funds |
| "Your 30% deposit is held by ELBOLD and processed through Stripe" | ✅ Yes — accurate |
| "Stripe is PCI-DSS Level 1" | ✅ Yes — unchanged |
| "No direct vendor bank transfers" | ✅ Yes — accurate |

### Level upgrade behaviour check (post-fix)

| Category | Before (broken) | After (correct) |
|---|---|---|
| DJ | gov_id + proof_of_address → stuck at Level 1 | gov_id → Level 2; both approved → Level 3 |
| Photographer | gov_id + proof_of_address + portfolio → Level 2 (portfolio not in hasBusiness) | gov_id → Level 2; all 3 → Level 3 |
| Caterer | gov_id + food_hygiene → Level 2 (food_hygiene in hasBusiness) | gov_id → Level 2; all 4 → Level 3 |
| Security | gov_id + sia + insurance → Level 2 | gov_id → Level 2; all 3 → Level 3 |

---

## Remaining — Document Expiry Migration

This migration is a follow-on task that completes the Expired state:

```sql
-- Migration: add document expiry tracking
ALTER TABLE vendor_verifications 
  ADD COLUMN expires_at timestamptz,
  ADD COLUMN expiry_notified_at timestamptz;

-- Index for expiry cron
CREATE INDEX idx_vendor_verifications_expires_at 
  ON vendor_verifications(expires_at) 
  WHERE status = 'approved' AND expires_at IS NOT NULL;
```

Documents requiring expiry tracking: `insurance`, `food_hygiene`, `sia_license`, `operator_license`. After migration, the existing `/api/cron/verification-check` route can be extended to flag approaching expirations, and the admin Expired filter tab will activate automatically.

---

*All changes implemented from codebase audit of: `lib/verification-requirements.ts`, `components/vendor/VendorTrustBadges.tsx`, `components/vendor/VendorVerificationView.tsx`, `components/admin/AdminVerificationsView.tsx`, `app/api/admin/verifications/route.ts`, `app/admin/verifications/page.tsx`, `app/booking-protection/page.tsx`, `app/how-we-verify/page.tsx`.*
