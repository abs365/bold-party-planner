# Brand Simplification Audit
**Version:** 1.0 | **Date:** 2026-06-09 | **Phase:** 7
**Brand Standard:** Clean "ELBOLD" wordmark. No crown. No badge. No icon. No EB monogram. Direction: Uber / Airbnb / Stripe / Notion.

---

## Verdict: PARTIAL — 6 production pages still use old brand

The wordmark was updated in a previous sprint for the Navbar, Footer, and browser favicon. However 5 auth pages and the dashboard sidebar still reference the old crown + EB monogram mark.

---

## 1. Brand Asset Inventory

All SVG files in `public/brand/` and `app/icon.svg` — audited by reading file contents.

### NEW Brand (compliant with standard)

| File | Contents | Compliant |
|------|----------|-----------|
| `public/brand/elbold-logo-final.svg` | Clean "Elbold" text, navy #0B1F4D, system sans-serif 700 | ✓ YES |
| `public/brand/elbold-logo-white.svg` | Same wordmark, rgba(255,255,255,0.92) | ✓ YES |
| `public/brand/elbold-favicon.svg` | "E" lettermark on navy square, no crown, no EB | ✓ YES |
| `app/icon.svg` | Same "E" lettermark — Next.js auto-detected favicon | ✓ YES |

### OLD Brand (non-compliant — contains crown / EB monogram)

| File | Contents | Used In Production |
|------|----------|--------------------|
| `public/brand/elbold-mark.svg` | Navy background + gold circle frame + **crown rays** + **EB monogram** | YES — 5 pages |
| `public/brand/elbold-wordmark.svg` | Crown rays + **EB monogram** + "ELBOLD" serif text | NO (not referenced in active components) |
| `public/brand/elbold-wordmark-white.svg` | Crown rays + **EB monogram** + "ELBOLD" serif text (dark version) | YES — DashboardLayout |
| `public/brand/elbold-monogram.svg` | 16-ray starburst + **EB monogram** in gold | Admin-only `/brand` page |
| `public/brand/elbold-social-icon.svg` | 512×512 starburst + **EB monogram** | Admin-only `/brand` page |
| `public/brand/elbold-email-header.svg` | Contains starburst mark (not confirmed clean) | Admin-only `/brand` page |
| `public/brand/elbold-concept-a.svg` | Concept file: open ring + crown rays + EB serif | Admin-only `/brand` page |
| `public/brand/elbold-concept-b.svg` | Concept file: starburst + EB monogram | Admin-only `/brand` page |
| `public/brand/elbold-concept-c.svg` | Concept file: diamond monogram + ELBOLD wordmark | Admin-only `/brand` page |

---

## 2. Production Pages Using Old Brand

**Evidence from grep across all `.tsx` / `.ts` / `.jsx` / `.js` files:**

### `public/brand/elbold-mark.svg` — active in production

```
app/(auth)/signup/page.tsx:84    <img src="/brand/elbold-mark.svg" width="64" height="64" />
app/(auth)/signup/page.tsx:149   <img src="/brand/elbold-mark.svg" width="80" height="80" />
app/(auth)/signup/page.tsx:178   <img src="/brand/elbold-mark.svg" width="52" height="52" />
app/(auth)/forgot-password/page.tsx:17  <img src="/brand/elbold-mark.svg" width="56" />
app/(auth)/forgot-password/page.tsx:53  <img src="/brand/elbold-mark.svg" width="80" />
app/(auth)/forgot-password/page.tsx:71  <img src="/brand/elbold-mark.svg" width="52" />
app/(auth)/reset-password/page.tsx:24   <img src="/brand/elbold-mark.svg" width="80" />
app/(auth)/reset-password/page.tsx:42   <img src="/brand/elbold-mark.svg" width="52" />
app/(auth)/login/page.tsx:48     <img src="/brand/elbold-mark.svg" width="80" />
app/(auth)/login/page.tsx:100    <img src="/brand/elbold-mark.svg" width="52" />
app/onboarding/page.tsx:37       <img src="/brand/elbold-mark.svg" width="56" />
```

`elbold-mark.svg` contents (verified by reading file):
```svg
<rect width="64" height="64" rx="10" fill="#0D1B3E"/>
<circle cx="32" cy="36" r="18" stroke="#C9A84C" stroke-width="1.4"/>
<!-- Crown / light rays above -->
<line ... stroke="#C9A84C" />  ← CROWN
<text>EB</text>                 ← EB MONOGRAM
```

### `public/brand/elbold-wordmark-white.svg` — active in DashboardLayout

```
components/layout/DashboardLayout.tsx:165
  <img src="/brand/elbold-wordmark-white.svg" width="110" height="24" />
```

`elbold-wordmark-white.svg` contents (verified by reading file):
```svg
<!-- Crown rays -->
<line x1="22" y1="5" x2="22" y2="12" stroke="#D4AF37" />   ← CROWN
<text x="22" y="31">EB</text>                                ← EB MONOGRAM
<text x="58" y="30">ELBOLD</text>
```

---

## 3. Compliant Components (no action needed)

| Component | Asset Used | Compliant |
|-----------|-----------|-----------|
| `components/layout/Navbar.tsx` | `elbold-logo-final.svg` (light) / `elbold-logo-white.svg` (dark) | ✓ |
| `components/layout/Footer.tsx` | `elbold-logo-white.svg` | ✓ |
| Browser favicon | `app/icon.svg` (E lettermark) | ✓ |
| `public/brand/elbold-favicon.svg` | E lettermark | ✓ |

---

## 4. Required Changes

The brand constraint — **NO crown, NO badge, NO EB monogram** — is violated in 6 locations.

### Change A — Replace `elbold-mark.svg` with compliant version

**Files affected (5 pages):**
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/(auth)/forgot-password/page.tsx`
- `app/(auth)/reset-password/page.tsx`
- `app/onboarding/page.tsx`

**Option 1 (recommended):** Replace the `src` in all 11 image tags from `elbold-mark.svg` to `elbold-favicon.svg` (the clean "E" lettermark on navy). The favicon is 64×64 and works at all the sizes used (52px, 56px, 64px, 80px).

**Option 2:** Overwrite `public/brand/elbold-mark.svg` with the clean E lettermark content from `elbold-favicon.svg`. This changes the file in place so all references automatically pick up the new version.

### Change B — Replace `elbold-wordmark-white.svg` in DashboardLayout

**File affected:**
- `components/layout/DashboardLayout.tsx:165`

**Fix:** Change `elbold-wordmark-white.svg` to `elbold-logo-white.svg` (already exists, compliant).

```tsx
// Before
<img src="/brand/elbold-wordmark-white.svg" width="110" height="24" alt="ELBOLD" />

// After
<img src="/brand/elbold-logo-white.svg" width="110" height="24" alt="ELBOLD" />
```

---

## 5. Admin-Only Files (No Action Required)

These files are referenced only in `app/brand/page.tsx`, which is an admin-only preview page not accessible to the public. They do not appear in any customer-facing or vendor-facing routes.

- `elbold-monogram.svg` — admin brand page only
- `elbold-social-icon.svg` — admin brand page only
- `elbold-email-header.svg` — admin brand page only
- `elbold-concept-a/b/c.svg` — admin brand page only

These files should be retained as reference material but can be archived if desired.

---

## 6. Summary

| Area | Status |
|------|--------|
| Navbar | COMPLIANT ✓ |
| Footer | COMPLIANT ✓ |
| Browser favicon (`app/icon.svg`) | COMPLIANT ✓ |
| Login page | NON-COMPLIANT — uses crown+EB mark |
| Signup page | NON-COMPLIANT — uses crown+EB mark |
| Forgot password page | NON-COMPLIANT — uses crown+EB mark |
| Reset password page | NON-COMPLIANT — uses crown+EB mark |
| Onboarding page | NON-COMPLIANT — uses crown+EB mark |
| Dashboard sidebar (DashboardLayout) | NON-COMPLIANT — uses crown+EB wordmark |

**Fix effort:** 2 changes:
1. Update `public/brand/elbold-mark.svg` — overwrite with E lettermark (~2 min)
2. Update `DashboardLayout.tsx` line 165 — change one filename (~1 min)

Both fixes can be applied without any visual regression to the Navbar or Footer.
