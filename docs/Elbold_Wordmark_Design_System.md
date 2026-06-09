# Elbold Wordmark Design System
**Version:** 1.0 | **Date:** 2026-06-09 | **Status:** ACTIVE

---

## 1. Brand Direction

Elbold is a marketplace for UK event professionals. The brand direction is: **clean, confident, trustworthy**. Inspiration: Stripe, Uber, Airbnb, Notion. No decorative marks. No iconography. No monogram. No crown. No badge. No starburst. The brand communicates through typography alone.

---

## 2. What Was Removed

| Element | Previous Logo | Reason for Removal |
|---------|--------------|-------------------|
| Starburst (8+8 rays) | Present in all files | Decorative noise, scales poorly, reads as "event/party" rather than "marketplace" |
| Navy disc | Present | Marks the logo as icon-led; conflicts with pure wordmark direction |
| Italic EB monogram in gold | Present | Monogram = dated; confuses brand identity at small sizes |
| "EVENTS" subtitle | Present | Limits the brand; Elbold may expand beyond events |
| Thin gold rule | Present | Decorative filler; removed with the subtitle |
| Dual-colour letterform | Georgia serif + gold fill | Serif introduces formality misaligned with modern marketplace |

---

## 3. New Brand Files

### 3.1 Primary Wordmark (Light Backgrounds)
**File:** `public/brand/elbold-logo-final.svg`
**Use:** Navbar on white/light, onboarding flows, email headers, light UI surfaces

| Property | Value |
|----------|-------|
| Typeface | System sans-serif stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif` |
| Weight | 700 (Bold) |
| Size (viewBox) | 27px in 140×36 viewBox |
| Colour | `#0B1F4D` (Elbold navy) |
| Background | Transparent |
| Case | Initial cap: "Elbold" (not "ELBOLD") |

### 3.2 Primary Wordmark (Dark Backgrounds)
**File:** `public/brand/elbold-logo-white.svg`
**Use:** Navbar on navy, dark hero sections, dark email sections, Footer

| Property | Value |
|----------|-------|
| Typeface | Same system sans-serif stack |
| Weight | 700 (Bold) |
| Colour | `rgba(255,255,255,0.92)` — slightly softened white for optical refinement |
| Background | Transparent |

### 3.3 Favicon / App Icon
**File:** `app/icon.svg` + `public/brand/elbold-favicon.svg`
**Use:** Browser tab, PWA icon, social previews, 16×16 → 512×512 contexts

| Property | Value |
|----------|-------|
| Canvas | 64×64 viewBox, `rx="10"` rounded square |
| Background | `#0B1F4D` (Elbold navy) |
| Lettermark | "E", weight 700, size 40px, centred (x=32, y=47) |
| Colour | `rgba(255,255,255,0.93)` |

---

## 4. Typography Recommendation

For all UI text, pair with **Inter** (already loaded via `app/layout.tsx`). The wordmark uses the system stack rather than Inter because SVG `<text>` elements do not inherit page fonts — the system stack ensures the wordmark renders identically across all browsers and email clients without font embedding.

**When to use which:**

| Context | Font |
|---------|------|
| All UI (headings, body, labels) | Inter (already configured) |
| Wordmark SVG | System stack (sans-serif fallback) |
| Email HTML text | Arial / Helvetica |

---

## 5. Spacing & Clear Space

The wordmark must have a clear space equal to the height of the "E" letterform on all four sides. Do not place other elements inside this clear space.

In practice, the existing Navbar already provides this through its `px-4 md:px-8` container padding.

---

## 6. Usage Rules

| Rule | Detail |
|------|--------|
| Light bg → dark logo | Use `elbold-logo-final.svg` (navy text) |
| Dark bg → white logo | Use `elbold-logo-white.svg` (white text) |
| Never stretch | Maintain `w-auto` with fixed height — never set both width and height to fixed px |
| Never rotate | Horizontal wordmark only |
| Never recolour | Navy on light, white on dark — no other colour variants |
| Never add effects | No drop shadow, no glow, no gradient fill on the wordmark text |
| Favicon = "E" lettermark | Do not use the full wordmark at favicon size |

---

## 7. Navbar Implementation

The Navbar already uses the correct pattern:

```jsx
<img
  src={lightBg ? "/brand/elbold-logo-final.svg" : "/brand/elbold-logo-white.svg"}
  width="140"
  height="28"
  alt="Elbold"
  className="h-7 w-auto"
/>
```

**No code change required.** The SVG files have been replaced in place with the new wordmarks. The `width="140" height="28"` render dimensions and the `h-7 w-auto` class are unchanged.

**Alt text:** Change any remaining `alt="ELBOLD"` to `alt="Elbold"` to match the new brand casing.

---

## 8. Footer Implementation

Footer uses `<img src="/brand/elbold-logo-white.svg" width="120" height="24">` — no change required to the component. The SVG file has been replaced.

---

## 9. Files Changed

| File | Change |
|------|--------|
| `public/brand/elbold-logo-final.svg` | Replaced: starburst+monogram → clean "Elbold" wordmark, navy |
| `public/brand/elbold-logo-white.svg` | Replaced: starburst+monogram → clean "Elbold" wordmark, white |
| `public/brand/elbold-favicon.svg` | Replaced: starburst icon → "E" lettermark on navy square |
| `app/icon.svg` | Replaced: starburst icon → "E" lettermark on navy square |

**Files not changed** (awaiting Phase 2 of brand work, if required):
- `public/brand/elbold-mark.svg`
- `public/brand/elbold-mark-navy.svg`
- `public/brand/elbold-wordmark.svg`
- `public/brand/elbold-wordmark-white.svg`
- `public/brand/elbold-concept-a/b/c.svg`
- `public/brand/elbold-monogram.svg`
- `public/brand/elbold-social-icon.svg`
- `public/brand/elbold-email-header.svg`

---

## 10. What the New Wordmark Is Not

This is not a final brand identity system. It is a brand **simplification** — removing everything that contradicts the clean, modern marketplace direction, and establishing a single consistent wordmark in all primary contexts. A full typographic brand identity (custom type treatment, spacing rules, brand book) would be a separate engagement.

The current approach is correct for: launch, investor presentations, vendor recruitment, soft launch.

---

**Status:** DEPLOYED — SVG files replaced in production codebase.
