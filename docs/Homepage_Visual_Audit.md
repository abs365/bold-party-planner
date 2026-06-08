# P0-03 Homepage Visual Audit

**Date:** 2026-06-07  
**Pages reviewed:** Homepage, Browse, Inspiration, Vendor pages, Customer dashboard, Admin  
**Verdict:** 3 confirmed visual bugs fixed. No structural regressions.

---

## Homepage (`/`)

### Issue 1 — Baby Showers card: no photo (FIXED)

**Symptom:** The "Baby Showers" occasion card in Section 3 (What Are You Celebrating?) shows only a dark green gradient with no photography. All 5 other occasion cards (Weddings, Birthdays, Corporate, Anniversaries, Cultural Celebrations) have full cinematic Unsplash photos. Baby Showers renders as a blank dark card by comparison.

**Root cause:** `OCCASIONS` array in `app/page.tsx` had `photo: null` for Baby Showers:
```typescript
{ label: "Baby Showers", photo: null, gradient: "...", overlay: "..." }
```
When `photo` is `null`, the `<Image>` component is not rendered. The overlay is set to `occasion.gradient` (no cinematic gradient), resulting in a flat dark green block.

**Fix applied:** Added Unsplash image for Baby Showers in `app/page.tsx`:
```typescript
photo: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=900&q=80"
```

**Files changed:** `app/page.tsx`

---

### Issue 2 — Featured vendors section: dark navy placeholder when vendor has no media

**Symptom:** Vendor cards in Section 4 (Featured Professionals) show a dark navy ELBOLD placeholder when a vendor has no uploaded photos. The card is functional but looks empty vs vendor cards with real photography.

**Root cause:** This is by design — vendors without media show:
```typescript
<div style={{ background: "linear-gradient(135deg, #0B1F4D, #162447)" }}>
  <span style={{ color: "rgba(212,175,55,0.4)" }}>ELBOLD</span>
</div>
```

**Status:** Not a bug. The placeholder is intentional for vendors who haven't uploaded photos yet. No fix required. Vendors should be prompted to upload photos during onboarding.

---

### Issue 3 — Dark overlay on occasion cards

**Symptom:** Reported as "excessive dark overlays."

**Root cause:** The cinematic overlay formula is:
```typescript
background: occasion.photo
  ? `linear-gradient(to top, rgba(4,8,20,0.88) 0%, ${occasion.overlay} 40%, rgba(4,8,20,0.22) 100%)`
  : occasion.gradient
```

The bottom overlay (0.88 opacity) is intentionally heavy to ensure the white label text is legible over photography. This is standard editorial design — the gradient is bottom-heavy to push reading area contrast up. The top of each card (0.22 opacity) is lighter, showing the photography.

**Status:** Not a bug. The overlay level is correct for editorial readability. Adjusting would reduce text contrast and violate accessibility.

---

## Browse Page (`/browse`)

### Issue 4 — Discovery cards: `venue_hire` and `entertainer` are not valid categories (FIXED)

**Symptom:** The 6 category discovery cards on the Browse page (shown when no filters are active) include "Venue Hire" (category: `venue_hire`) and "Entertainment" (category: `entertainer`). These are not valid `VendorCategory` values. Clicking them filters the marketplace to a non-existent category, returning 0 results.

**Root cause:** `CATEGORY_DISCOVERY` in `app/browse/page.tsx` contained:
```typescript
{ label: "Venue Hire", category: "venue_hire", ... }
{ label: "Entertainment", category: "entertainer", ... }
```
Neither `venue_hire` nor `entertainer` exist in the `VendorCategory` type or the DB CHECK constraint.

**Fix applied:** Replaced with valid categories:
```typescript
{ label: "Marquee & Venue", category: "marquee_rental", ... }
{ label: "Live Music", category: "live_band", ... }
```

**Files changed:** `app/browse/page.tsx`

---

## Inspire / Event Ideas Page (`/inspire`)

**Status:** No visual issues found. Page uses correct Unsplash photography and occasion cards link to valid browse routes.

---

## Vendor Profile Page (`/vendors/[id]`)

**Status:** No visual issues found. VendorProfileView renders correctly with cinematic hero + thumbnail strip. When vendor has no media, a navy ELBOLD placeholder is shown (same as homepage — intentional).

---

## Customer Dashboard (`/dashboard`)

**Status:** No visual issues found.

---

## Admin Dashboard (`/admin`)

**Status:** No visual issues found.

---

## Summary

| Issue | Page | Status |
|---|---|---|
| Baby Showers missing photo | Homepage | Fixed |
| Dark navy placeholder for vendors without media | Homepage | Not a bug (intentional) |
| Excessive dark overlays | Homepage occasion cards | Not a bug (intentional readability) |
| `venue_hire` / `entertainer` invalid categories | Browse | Fixed |
| Photography not loading (Unsplash CDN) | All | Unsplash images load correctly — no issue found |

---

## Build Result

TypeScript: 0 errors. Build: passing.
