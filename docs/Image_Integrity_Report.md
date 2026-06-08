# P0-04 Image Integrity Report

**Date:** 2026-06-07  
**Scope:** All category cards, occasion cards, and photography across the platform  
**Verdict:** 2 issues fixed. All other images confirmed correct.

---

## Occasion Cards (Homepage — Section 3)

| Occasion | Photo Source | Status |
|---|---|---|
| Weddings | Unsplash `photo-1519741497674` | OK |
| Birthdays | Unsplash `photo-1530103862676` | OK |
| Corporate | Unsplash `photo-1511795409834` | OK |
| **Baby Showers** | **null (missing)** | **FIXED** |
| Anniversaries | Unsplash `photo-1516589091380` | OK |
| Cultural Celebrations | Unsplash `photo-1492684223066` | OK |

**Fix:** Added `https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4` for Baby Showers in `app/page.tsx`. This is a real photo of baby shower decorations with a pastel/cream colour palette that blends with the green gradient.

---

## Category Discovery Cards (Browse Page)

| Category Card | Category Value | Vendors Found? | Status |
|---|---|---|---|
| Photographers | `photographer` | Yes (valid) | OK |
| DJs & Music | `dj` | Yes (valid) | OK |
| Decorators | `decorator` | Yes (valid) | OK |
| Catering | `caterer` | Yes (valid) | OK |
| **Venue Hire** | `venue_hire` | **No (invalid category)** | **FIXED** |
| **Entertainment** | `entertainer` | **No (invalid category)** | **FIXED** |

**Fix:** Replaced invalid categories in `app/browse/page.tsx`:
- `venue_hire` → `marquee_rental` ("Marquee & Venue")
- `entertainer` → `live_band` ("Live Music")

Both replacement categories exist in the VendorCategory type and the DB CHECK constraint.

---

## Storage Bucket Analysis

### `vendor-images` bucket
- **Created by:** Migration 037
- **Public:** Yes
- **RLS:** INSERT authenticated, SELECT public, DELETE own
- **Status:** Applied, functional

### `vendor-videos` bucket
- **Created by:** Migration 037
- **Public:** Yes
- **RLS:** INSERT authenticated, SELECT public, DELETE own
- **Status:** Applied, functional

### `verification-documents` bucket
- **Created by:** Migration 014
- **Public:** No (private)
- **Access:** Admin-only uploads (via service role). Signed URLs for vendors to view their own documents.
- **Status:** Applied (migration 014 confirmed applied in Migrations 001-037). Functional for uploads once migration 039d is applied.

---

## Fallback Behaviour Analysis

### Vendor cards without media
All vendor card components (`app/page.tsx`, `app/browse/page.tsx`, `app/vendors/[id]/page.tsx`) have correct fallbacks when `coverMedia` is null:

```typescript
// app/page.tsx — Featured vendors
<div style={{ background: "linear-gradient(135deg, #0B1F4D, #162447)" }}>
  <span style={{ color: "rgba(212,175,55,0.4)" }}>ELBOLD</span>
</div>
```

The fallback is branded (navy/gold) and shows the ELBOLD wordmark. It does not crash or show a broken image icon.

### Occasion cards without photo
Fixed in this sprint. Was: flat dark gradient. Now: Unsplash photo with cinematic overlay.

### Category pages (`/categories/[category]`)
Uses the same fallback (no media = navy gradient with category icon). No broken images.

---

## Next.js Image Configuration

The `next.config.ts` includes Unsplash in `images.remotePatterns`:

```typescript
// Confirmed: Unsplash images are allowed by Next.js image optimizer
remotePatterns: [
  { protocol: "https", hostname: "images.unsplash.com" },
  ...
]
```

All Unsplash URLs in the codebase use the correct domain `images.unsplash.com` with `auto=format&fit=crop` parameters. No broken remote patterns found.

---

## Supabase Storage URLs

Vendor media URLs stored in the database are public Supabase storage URLs (e.g., `https://*.supabase.co/storage/v1/object/public/vendor-images/...`). These render correctly as long as:
1. The `vendor-images` bucket is public (confirmed)
2. The file was uploaded successfully

No corrupted or missing URLs found in the codebase logic.

---

## Summary

| Finding | Severity | Fix Status |
|---|---|---|
| Baby Showers occasion card: missing photo | P0 (visual) | Fixed |
| Browse page: `venue_hire` category shows 0 results | P0 (functional) | Fixed |
| Browse page: `entertainer` category shows 0 results | P0 (functional) | Fixed |
| Verification documents storage: upload blocked by RLS | P0 (functional) | Needs DB migration 039d |
| All other Unsplash images | None | No issues |
| Vendor card fallback (no media) | Cosmetic | No fix needed (branded placeholder) |

---

## Build Result

TypeScript: 0 errors. Build: passing.
