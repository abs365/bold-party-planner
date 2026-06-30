# ELBOLD — EXISTING COMPONENT INVENTORY
## Phase 70E.2B | Pre-Implementation Audit
**Date:** 2026-06-30  
**Auditor role:** Chief Product Officer / Enterprise Solutions Architect  
**Scope:** Every file under `/components/` and design primitives in `app/globals.css`  
**Method:** Direct codebase inspection of 100 component files

---

## CRITICAL PRE-IMPLEMENTATION FINDINGS

**Five components were planned for creation from scratch that already exist and are production-quality:**

| Planned Component | Already Exists At | Action |
|---|---|---|
| LoadingState | `components/ui/StateComponents.tsx` | Keep + minor update |
| EmptyState | `components/ui/StateComponents.tsx` | Keep + minor update |
| ErrorState | `components/ui/StateComponents.tsx` | Keep + minor update |
| Badge + StatusBadge | `components/ui/Badge.tsx` | Keep + extend |
| SkeletonLoaders (5 variants) | `components/ui/SkeletonLoader.tsx` | Keep + consolidate |

**Three CSS patterns were planned for creation that already exist:**

| Planned | Already Exists | Action |
|---|---|---|
| `input-dark` class | `.input-field` in `globals.css` | Alias or rename — do not duplicate |
| Dark button variants | `btn-primary`, `btn-secondary`, `btn-danger` in `globals.css` | Build React wrapper only — CSS already correct |
| Light button variant | `btn-secondary-light` in `globals.css` | Build React wrapper only |

**Two design-system decisions in `globals.css @theme` that were misread as debt:**

| Item | Reality |
|---|---|
| Two gold values (#D4AF37 and #C9A84C) | BOTH are intentional tokens: `--color-gold-400: #D4AF37` (primary gold) and `--color-gold-500: #C9A84C` (muted gold). DD-002 is a usage debt (hardcoded hex instead of token references) not a duplicate-value problem. |
| `--color-brand-400: #D4AF37` | Brand-400 IS gold — intentional. The brand scale crosses into gold at position 400 as the accent highlight. Not a conflict. |

---

## INVENTORY FORMAT

Each entry uses:
- **Location:** File path
- **Exports:** Named exports in the file
- **Quality:** 1-5 (1=poor, 5=excellent)
- **Enterprise Ready:** Yes / Partial / No
- **Action:** Keep / Extend / Merge / Replace / Delete / Fix
- **DD items resolved by fixing:** Reference to Design Debt Register

---

## SECTION 1 — UI PRIMITIVES (`components/ui/`)

---

### UI-01 — Badge + StatusBadge
**Location:** `components/ui/Badge.tsx`  
**Exports:** `Badge`, `StatusBadge`  
**Quality:** 4/5  
**Enterprise Ready:** Yes  
**Action:** EXTEND

**What exists:**
- `Badge`: variant system (default/success/warning/danger/info/gold), `cn()` composition, uses `.badge` CSS class from globals
- `StatusBadge`: Maps 14 booking/vendor statuses to Badge variants automatically. Handles unknown statuses gracefully.
- Uses `"use client"` (unnecessary — no client state or events — but harmless)

**What's missing vs spec:**
- Missing `role` variants (founder/global_admin/ops_admin/reviewer) for admin team page — add to BadgeProps variant union
- "danger" naming is correct for destructive context; the migration plan used "error" — adopt "danger" (existing name wins)
- "gold" variant maps to amber colors (`bg-amber-500/20 text-amber-400`) not `bg-gold-400/15 text-gold-400` — minor visual discrepancy from brand token

**Pages using it:**
```
components/admin/AdminVendorTable.tsx → StatusBadge (correct pattern)
components/vendor/VendorProfileView.tsx → Badge directly
components/ui/TrustBadges.tsx → Badge (via import)
```

**Changes needed:**
- Add `role` variant for admin team page
- Fix `gold` variant to use `text-gold-400` token instead of amber
- Remove `"use client"` directive (no client features needed)

---

### UI-02 — LoadingState + EmptyState + ErrorState
**Location:** `components/ui/StateComponents.tsx`  
**Exports:** `LoadingState`, `EmptyState`, `ErrorState`  
**Quality:** 4/5  
**Enterprise Ready:** Partial  
**Action:** EXTEND

**What exists:**
- `LoadingState`: Spinner + message. Uses `text-brand-400` (correct token). Has `data-testid`. Dark theme.
- `EmptyState`: Icon slot + emoji slot + title + description + action slot. Responsive width.
- `ErrorState`: Red icon + title + message + retry button.

**What to fix:**
- `EmptyState.emoji` prop allows emoji text directly — violates enterprise language policy (Phase 4A.0). Remove the `emoji` prop entirely. All icons must be Lucide components.
- `EmptyState` container uses `w-14 h-14 rounded-2xl` — wrong radius token (`rounded-2xl` vs standard `rounded-xl`)
- `EmptyState.action` accepts `React.ReactNode` — good, but callers should be guided to use `<Link className="btn-primary">` or `<button className="btn-primary">`

**Pages using it:**
- Low current adoption — most pages have inline empty states. This is the fix target.

---

### UI-03 — LoadingSpinner + PageLoader + SkeletonCard (variant A)
**Location:** `components/ui/LoadingSpinner.tsx`  
**Exports:** `LoadingSpinner`, `PageLoader`, `SkeletonCard`  
**Quality:** 3/5  
**Enterprise Ready:** Partial  
**Action:** MERGE (consolidate SkeletonCard with SkeletonLoader.tsx)

**What exists:**
- `LoadingSpinner`: CSS border-spin pattern (alternative to Lucide Loader2). Size variants: sm/md/lg. Looks different from Loader2.
- `PageLoader`: Full-page centered spinner. Uses `LoadingSpinner`.
- `SkeletonCard`: Single card skeleton. DUPLICATES same export in `SkeletonLoader.tsx`.

**Conflict:** `LoadingSpinner` uses CSS border animation; `LoadingState` in StateComponents uses Lucide `Loader2`. Two different visual spinners for the same purpose.

**Resolution:** 
- Keep `PageLoader` (good pattern for auth boundary)
- Delete `SkeletonCard` from this file (keep in SkeletonLoader.tsx)
- Choose ONE spinner approach: Loader2 is more consistent with all other loading states across the codebase. Deprecate `LoadingSpinner` in favour of `Loader2` from lucide.

---

### UI-04 — Skeleton Components
**Location:** `components/ui/SkeletonLoader.tsx`  
**Exports:** `SkeletonCard`, `SkeletonVendorCard`, `SkeletonRow`, `SkeletonText`, `SkeletonStats`  
**Quality:** 5/5  
**Enterprise Ready:** Yes  
**Action:** KEEP

**What exists:**
- 5 skeleton variants, all with `animate-pulse`
- Correct dark theme cards (`bg-white/4 border border-white/6 rounded-xl`)
- `SkeletonStats` correctly uses `grid-cols-2 lg:grid-cols-4` — good pattern

**Current adoption:** Low (most pages don't use skeletons yet). This is a Suspense migration target.

---

### UI-05 — StarRating
**Location:** `components/ui/StarRating.tsx`  
**Exports:** `StarRating`  
**Quality:** 5/5  
**Enterprise Ready:** Yes  
**Action:** KEEP

**What exists:**
- Interactive mode (`onChange` prop)
- Correct amber star colors
- `cn()` composition

**Note:** Missing `aria-label` for screen readers. Add: `aria-label={`Rating: ${rating} out of ${maxStars}`}` on the container `div`.

---

### UI-06 — TrustBadges (large file)
**Location:** `components/ui/TrustBadges.tsx`  
**Exports:** `TrustBadges`, `VendorTrustBadge`, `PlatformGuaranteeBanner`, `MarketplaceStatsBar`, `BookingProtectionCard`, `ResponseTimePill`, `CompletedJobsPill`, `VendorPaymentTrust`, `RefundPolicyCard`  
**Quality:** 4/5  
**Enterprise Ready:** Partial  
**Action:** FIX + KEEP

**What exists:** A comprehensive trust display library covering platform trust (TrustBadges), vendor trust badges (VendorTrustBadge), booking protection (BookingProtectionCard + PlatformGuaranteeBanner), response time indicators, completed jobs estimation, vendor payment transparency, and refund policy.

**Issues:**
- Imports `CheckCircle2` — must change to `CheckCircle` (DD-005)
- `MarketplaceStatsBar` uses hardcoded defaults (`vendorCount = 500, eventsPlanned = 2400`) that don't match actual platform data
- `BookingProtectionCard` uses `bg-white` + `border-emerald-200` (light theme) — correct for public-facing usage in quote/booking flow but creates visual inconsistency if used in dark authenticated context

---

### UI-07 — BookingPromise
**Location:** `components/ui/BookingPromise.tsx`  
**Exports:** `BookingPromise`  
**Quality:** 4/5  
**Enterprise Ready:** Yes  
**Action:** FIX + KEEP

**What exists:**
- Two variants: "quote" (what happens next) and "booking" (payment protection)
- Light theme cards (`bg-gray-50 border-gray-100`, `bg-emerald-50 border-emerald-100`)
- Used in the public vendor profile — light context is correct

**Issues:**
- Inline `style={{ background: "#0B1F4D", color: "#D4AF37" }}` on numbered steps (DD-003) → replace with `className="gradient-brand text-gold-400"`
- References `/booking-protection` and `/refunds` — verify these routes exist

---

### UI-08 — ErrorBoundary
**Location:** `components/ui/ErrorBoundary.tsx`  
**Exports:** `ErrorBoundary` (class), `ErrorState` (function)  
**Quality:** 5/5  
**Enterprise Ready:** Yes  
**Action:** KEEP + MERGE ErrorState

**What exists:**
- `ErrorBoundary`: React class component with Sentry integration. Only correct pattern for catching render errors.
- `ErrorState`: DUPLICATE of `ErrorState` in `StateComponents.tsx` — slightly different visual (amber icon vs red icon). 

**Resolution:** Delete `ErrorState` from `ErrorBoundary.tsx`. Import it from `StateComponents.tsx` instead. The class `ErrorBoundary` component itself should use the shared `ErrorState` as its fallback.

---

### UI-09 — MediaGallery
**Location:** `components/ui/MediaGallery.tsx`  
**Exports:** `MediaGallery`  
**Quality:** 5/5  
**Enterprise Ready:** Yes  
**Action:** KEEP

**What exists:**
- Masonry grid layout
- Lightbox with keyboard navigation (Arrow keys + Escape)
- Video thumbnail support with play overlay
- Cover badge option

**Note:** `VendorProfileView.tsx` implements its own lightbox (inline, not using MediaGallery). Opportunity to consolidate in Phase 70E.3 but not a blocker.

---

### UI-10 — ShowcaseGrid
**Location:** `components/ui/ShowcaseGrid.tsx`  
**Exports:** `ShowcaseGrid`, `ShowcaseItem`  
**Quality:** 4/5  
**Enterprise Ready:** Partial  
**Action:** KEEP

**What exists:**
- Category filter tabs (CLIENT STATE — `useState` not `searchParams`)
- Masonry grid with save functionality
- Correct pattern for this specific use case (showcase page where filter is part of the gallery experience, not a navigation filter)

**Note:** Client-state filter tabs here are appropriate for the showcase context (instant filtering of loaded images). This is different from booking status tabs which must be server-rendered. Not debt.

---

### UI-11 — LegalPage
**Location:** `components/ui/LegalPage.tsx`  
**Not read**  
**Action:** KEEP (utility)

---

### UI-12 — CopyButton
**Location:** `components/ui/CopyButton.tsx`  
**Not read**  
**Action:** KEEP (utility)

---

### UI-13 — TrendingVendors
**Location:** `components/ui/TrendingVendors.tsx`  
**Not read**  
**Action:** KEEP (domain component, not a design primitive)

---

## SECTION 2 — CSS DESIGN SYSTEM (`app/globals.css`)

---

### CSS-01 — Color Token System
**Location:** `app/globals.css` → `@theme` block  
**Action:** EXTEND (add missing semantic tokens)

**What already exists:**
```css
/* Brand navy spectrum */
--color-brand-400: #D4AF37;   /* Gold accent (intentional position in brand scale) */
--color-brand-500: #0B1F4D;   /* Primary deep navy */
/* ...brand-50 through brand-900 */

/* Gold system */
--color-gold-400: #D4AF37;   /* Primary gold */
--color-gold-500: #C9A84C;   /* Muted/deeper gold (FoundingVendorBanner) */
--color-gold-600: #b8932a;   /* Darker gold */

/* ELBOLD luxury palette */
--color-elbold-navy:       #0B1F4D;
--color-elbold-navy-deep:  #07152E;
--color-elbold-navy-mid:   #162447;
--color-elbold-gold:       #D4AF37;
--color-elbold-gold-light: #E8C96A;
--color-elbold-gold-muted: rgba(212, 175, 55, 0.65);
```

**What's missing (needs adding):**
```css
/* Semantic background tokens (referenced in DD-001) */
--color-bg-base:    #0a0a0f;  /* Body/main content */
--color-bg-surface: #0d0d18;  /* Sidebar/elevated */
--color-bg-brand:   #0D1B3E;  /* Hero panels / auth left panel */
--color-bg-footer:  #091529;  /* Footer (distinct by design) */
```

**Note:** `--color-elbold-navy-mid: #162447` is VERY close to `#0D1B3E` (bg-brand). The distinction between these needs clarification in the design spec — they may be intended as the same or serve different roles.

---

### CSS-02 — Button Classes
**Location:** `app/globals.css` → `@layer utilities`  
**Action:** KEEP all + BUILD React wrapper component only

**What exists and is well-defined:**
| Class | Visual | Use case |
|---|---|---|
| `.btn-primary` | `#0B1F4D` bg, `#D4AF37` text, hover `#162447` | Primary action on dark surfaces |
| `.btn-secondary` | `rgba(255,255,255,0.06)` bg, ghost border | Secondary on dark |
| `.btn-danger` | Red ghost | Destructive actions |
| `.btn-secondary-light` | White bg, gray border | Buttons on light/white surfaces |

**What does NOT exist (mentioned in audit but absent from globals.css):**
| Class | Status |
|---|---|
| `.btn-luxury` | NOT DEFINED — if referenced anywhere, silently unstyled |
| `.btn-luxury-dark` | NOT DEFINED — verify references |
| `.btn-social` | NOT DEFINED — verify references |

**Action for undefined classes:** Grep the codebase for these class names. If found, either add them to globals.css or replace usages with existing classes.

---

### CSS-03 — Input Classes
**Location:** `app/globals.css` → `@layer utilities`  
**Action:** RENAME REFERENCE — do not duplicate

**What exists:**
- `.input-field`: DARK input. `rgba(255,255,255,0.05)` bg, `rgba(255,255,255,0.12)` border. Focus ring: `#D4AF37`. Error state: red. This IS the "input-dark" class we planned to create.
- `.input-light`: WHITE input. `#ffffff` bg, `#e5e7eb` border.

**Action:** The migration plan's "Sprint 2.4 — add input-dark class" should be revised to: "Audit all inline dark input styles and replace with `.input-field`". DO NOT create a duplicate `input-dark` class.

---

### CSS-04 — Utility Classes
**Location:** `app/globals.css`

| Class | Purpose | Status |
|---|---|---|
| `.gradient-brand` | Navy gradient bg | Keep |
| `.gradient-brand-text` | Gold gradient text | Keep |
| `.card-hover` | Box shadow on hover | Keep |
| `.badge` | Base badge display | Keep |
| `.input-field` | Dark form inputs | Keep (DO NOT DUPLICATE as input-dark) |
| `.input-light` | Light form inputs | Keep |
| `.form-error` | Error text below input | Keep |
| `.form-hint` | Helper text below input | Keep |

---

## SECTION 3 — LAYOUT COMPONENTS (`components/layout/`)

---

### LAY-01 — DashboardLayout
**Location:** `components/layout/DashboardLayout.tsx`  
**Quality:** 3/5 (functional but several documented issues)  
**Enterprise Ready:** Partial  
**Action:** REFACTOR IN PLACE  
**DD Items:** DD-006, DD-007, DD-009, DD-019, DD-020 (via admin team page), DD-021, DD-022, DD-023, DD-029, DD-030

**Reviewed:** Yes (full read in previous sessions)

**What's good:**
- Role-based nav filtering works correctly
- `filterByRole()` with ROLE_WEIGHT comparison
- Admin nav groups pattern (grouped sections with labels)
- Responsive mobile overlay sidebar

**What needs fixing:**
- Vendor sidebar: 16 flat items → 5 groups (per DD-019 specification)
- Sidebar bottom: "Inspiration Feed" → remove (DD-007)
- Nav labels: "Get Verified" → "Verification", etc. (DD-006)
- Notification dot: unconditional → `count > 0` conditional (DD-009)
- Breadcrumb: "Portal > Role" → "Portal > Role > Page" (DD-021)
- Mobile toggle: no `aria-expanded` (DD-023)
- Mobile sidebar: no focus trap (DD-022)
- Wordmark style: `style={{ color: "rgba(255,255,255,0.92)" }}` → `className="text-white/90"` (DD-029)
- Mobile sidebar width: `w-68` (non-standard) → verify in tailwind.config or change to `w-64` (DD-030)

---

### LAY-02 — MobileBottomNav
**Location:** `components/layout/MobileBottomNav.tsx`  
**Quality:** 4/5  
**Enterprise Ready:** Partial  
**Action:** FIX  
**DD Items:** DD-018, DD-024

**What needs fixing:**
- Vendor "Browse" tab (`/browse`) → "Contacts" tab (`/vendor/contacts`) (DD-018)
- `aria-current="page"` on active tab (DD-024)

---

### LAY-03 — Navbar
**Location:** `components/layout/Navbar.tsx`  
**Quality:** 3/5  
**Enterprise Ready:** Partial  
**Action:** FIX

**What needs fixing:**
- Light theme CTA: "Sign In" only → add "Begin Planning" as primary CTA on light theme too
- Mobile toggle: missing `aria-expanded` + `aria-controls`

---

### LAY-04 — Footer
**Location:** `components/layout/Footer.tsx`  
**Quality:** 3/5  
**Enterprise Ready:** Partial  
**Action:** FIX  
**DD Items:** DD-011, DD-025

**What needs fixing:**
- Social icons (IG, X, FB): `div` elements with `aria-hidden` → real `<a>` links or remove

---

## SECTION 4 — NOTIFICATION SYSTEM

---

### NOT-01 — NotificationCentre
**Location:** `components/NotificationCentre.tsx`  
**Quality:** 5/5  
**Enterprise Ready:** Yes  
**Action:** KEEP + WIRE UNREAD COUNT TO DASHBOARDLAYOUT

**What exists:**
- Full notifications list with polling every 30s (`usePolling`)
- Refresh on focus (`useRefreshOnFocus`)
- Mark single or all as read
- Unread count computed internally from state
- Type-specific icons and colors (booking/payment/review/reminder/system)
- ARIA-accessible (read state communicated visually + `border-l-2` highlight)

**Critical integration gap:** NotificationCentre computes `unreadCount` locally but DashboardLayout never reads it. The notification bell always shows a dot because there's no connection between NotificationCentre's unread state and DashboardLayout's top bar.

**Solution:** The notifications page (`/dashboard/notifications`) fetches the initial list server-side and passes it to `NotificationCentre`. That component tracks the unread state. BUT the DashboardLayout top bar is rendered separately and has no access to that state.

**Best approach for Sprint 2:** 
- Add a simple API call in DashboardLayout to `GET /api/notifications?count_only=true` server-side
- Pass `unreadCount` as a server-fetched prop to DashboardLayout 
- Don't over-engineer — just fetch the count from each page's server component that wraps DashboardLayout

---

## SECTION 5 — VENDOR COMPONENTS (`components/vendor/`)

---

### VEN-01 — PendingVendorBanner
**Location:** `components/vendor/PendingVendorBanner.tsx`  
**Quality:** 4/5  
**Enterprise Ready:** Partial  
**Action:** FIX + KEEP

**What exists:**
- Two-column layout: what you can do now vs what activates after approval
- Well-structured, enterprise-appropriate tone
- No emoji
- Amber color scheme (correct for "pending" state)

**What needs fixing:**
- Uses `CheckCircle2` (DD-005) → `CheckCircle`
- Uses `rounded-2xl` → `rounded-xl`
- `XCircle` used for "not yet active" features — consider `Circle` or `MinusCircle` (XCircle implies error/failure, not "pending")

---

### VEN-02 — FoundingVendorBanner
**Location:** `components/vendor/FoundingVendorBanner.tsx`  
**Quality:** 3/5  
**Enterprise Ready:** Partial  
**Action:** FIX + KEEP  
**DD Items:** DD-002 (hardcoded gold-500 instead of token)

**What exists:**
- Dismissible via localStorage
- Correct gold styling for founding vendor identity
- Good CTA to `/founding-vendors`

**What needs fixing:**
- `#C9A84C` inline → `var(--color-gold-500)` or `text-gold-500` (DD-002 resolution)
- `style={{ background: "linear-gradient(...)" }}` → `className="gradient-brand"` (DD-003)
- `style={{ color: "#C9A84C" }}` → `className="text-gold-500"` (DD-003)
- `border-[#C9A84C]/30` → `border-gold-500/30`

---

### VEN-03 — SourceBadge + ContactTypeBadge
**Location:** `components/vendor/SourceBadge.tsx`  
**Quality:** 5/5  
**Enterprise Ready:** Yes  
**Action:** KEEP

Excellent implementation. Source-specific colors for 8 contact origins + marketplace. Clean, well-typed. No issues.

---

### VEN-04 — ProfileStrengthWidget
**Location:** `components/vendor/ProfileStrengthWidget.tsx`  
**Quality:** 5/5  
**Enterprise Ready:** Partial  
**Action:** FIX + KEEP

**What exists:**
- Two sizes: compact + full
- Progress bar with color-coded tiers
- Action links for incomplete items
- Uses `CompletionResult` type from `lib/vendor/completion`

**What needs fixing:**
- `CheckCircle2` → `CheckCircle` (DD-005)
- Hardcoded `from-[#0B1F4D] to-[#D4AF37]` in progress bar → `from-brand-500 to-gold-400` (DD-003)

---

### VEN-05 — VendorActivationChecklist
**Location:** `components/vendor/VendorActivationChecklist.tsx`  
**Quality:** 5/5  
**Enterprise Ready:** Partial  
**Action:** FIX + KEEP

**What exists:**
- 6 weighted tasks (sum to 100%)
- Progress bar with 3-tier color coding
- Live links to each incomplete task

**What needs fixing:**
- `CheckCircle2` → `CheckCircle` (DD-005)
- `from-brand-500 to-[#D4AF37]` → `from-brand-500 to-gold-400` (DD-003)

---

### VEN-06 — VendorGovernanceWidget
**Location:** `components/vendor/VendorGovernanceWidget.tsx`  
**Quality:** 5/5  
**Enterprise Ready:** Yes  
**Action:** FIX + KEEP

**What exists:**
- Lifecycle state display (lifecycle state meta from `lib/vendor/governance`)
- Health score progress bar with 5-tier color coding
- Warning system (`ComputedWarning` with severity)
- Capability flags (what the vendor can and cannot do)

**What needs fixing:**
- `CheckCircle2` → `CheckCircle` (DD-005)
- `badgeClass` strings in meta objects use `border` utility classes — verify they're consistent with Badge component

---

### VEN-07 — VendorTrustBadges
**Location:** `components/vendor/VendorTrustBadges.tsx`  
**Quality:** 4/5  
**Enterprise Ready:** Yes  
**Action:** FIX + KEEP

**What exists:**
- `getVendorBadges()`: Dynamic badge computation based on verification level, performance, experience
- Verification level hierarchy: Level 1 (Profile Complete, no badge shown), Level 2 (ID Verified), Level 3 (Business Verified), Level 4 (Premium Partner)
- "Trusted Professional" badge: computed from track record (≥5 jobs, ≥4.5 rating, ≥80% response rate)
- Founding Vendor badge

**What needs fixing:**
- `CheckCircle2` → `CheckCircle` (DD-005)
- Light theme badge colors (`bg-emerald-50 text-emerald-700`) — these are used on the PUBLIC profile page (light context, white background) so this is correct for that context. Do not change.
- `VendorBadgesRow` export not visible in first 80 lines — note for migration plan

---

### VEN-08 — VendorMarketplace
**Location:** `components/vendor/VendorMarketplace.tsx`  
**Quality:** 5/5  
**Enterprise Ready:** Partial  
**Action:** FIX + KEEP  
**DD Items:** DD-026 (Unsplash URLs)

**What exists:**
- Client-side filter with 8 dimensions (search, category, city, sort, budget, rating, verified only, event type)
- Smart Picks section (top 4 by score)
- Load-more pagination
- Uses `calculateVendorScore()` for ranking
- `CATEGORY_FALLBACK` with Unsplash URLs for all 21 vendor categories

**What needs fixing:**
- `CATEGORY_FALLBACK` Unsplash URLs (DD-026) — move to `/public/images/categories/` static assets
- Uses `CheckCircle2` (DD-005) → `CheckCircle`

**Note:** Client-state filtering here is correct — the marketplace passes all vendors from the server and filters client-side for instant response. This is intentional architecture, not a debt item.

---

### VEN-09 — VendorProfileView
**Location:** `components/vendor/VendorProfileView.tsx`  
**Quality:** 5/5  
**Enterprise Ready:** Yes  
**Action:** FIX + KEEP

**What exists:**
- Full public vendor profile
- Image gallery with lightbox (inline, duplicates MediaGallery — see note)
- Package selection with booking flow
- Quote request flow
- Save vendor functionality
- Review display with star ratings
- Booking protection card
- Social feed section

**Uses (correctly):** `Badge`, `StarRating`, `BookingProtectionCard`, `CompletedJobsPill`, `ResponseTimePill`, `VendorTrustBadges`

**What needs fixing:**
- `CheckCircle2` → `CheckCircle` (DD-005)
- Inline lightbox duplicates `MediaGallery` — Phase 70E.3 opportunity to consolidate (not urgent)
- `bg-white` base — correct for public profile page (light theme context)

---

### VEN-10 — VendorProfileEditor
**Location:** `components/vendor/VendorProfileEditor.tsx`  
**Quality:** 4/5  
**Enterprise Ready:** Partial  
**Action:** FIX + KEEP

**What exists:**
- Sticky save header (well-done UX pattern)
- `btn-primary` used correctly on save button
- URL normalisation (adds https:// if missing)
- Event types multi-select toggle
- `toast.success/error` for feedback

**What needs fixing:**
- Sticky header uses inline `style={{ background: "#0a0a0f" }}` (DD-003) → should reference `bg-bg-base` or `className="bg-[#0a0a0f]"` as interim
- Form inputs likely use `.input-field` class (correct) — verify in remaining 100+ lines not read

---

### VEN-11 — VendorServicesManager
**Location:** `components/vendor/VendorServicesManager.tsx`  
**Quality:** 4/5  
**Enterprise Ready:** Partial  
**Action:** KEEP

**What exists:**
- Create/edit/delete service packages
- Inline form with show/hide toggle
- Creates packages via Supabase client directly (`createClient()`)
- `is_popular` flag

**Not read:** Lines 80+ (save logic, package display cards). Quality assessment based on first 80 lines.

---

### VEN-12 — VendorMediaManager
**Location:** `components/vendor/VendorMediaManager.tsx`  
**Quality:** 5/5  
**Enterprise Ready:** Yes  
**Action:** KEEP

**What exists:**
- Drag-and-drop with `react-dropzone`
- Sequential file upload with per-file progress tracking
- Video size limit (50MB)
- Maximum 20 files guard
- Caption editing
- Upload queue with status tracking (uploading/done/failed)
- Error handling per file (not just for the batch)

This is the highest-quality vendor OS component. Do not touch.

---

### VEN-13 — VendorQuotesView
**Location:** `components/vendor/VendorQuotesView.tsx`  
**Quality:** 3/5  
**Enterprise Ready:** Partial  
**Action:** FIX + KEEP

**What exists:**
- Lead scoring integration (`scoreLead()` from `lib/ai/scoring`)
- Quote response form (price, deposit, services, terms, valid-until, decline with reason)
- Custom `STATUS_COLORS` object with inline class strings

**What needs fixing:**
- `STATUS_COLORS` inline color strings duplicate what `StatusBadge` does automatically — replace with `<StatusBadge status={quote.status} />`
- Form uses inline input styling (verify whether `.input-field` or raw Tailwind)

---

### VEN-14 — VendorReviewsView
**Location:** `components/vendor/VendorReviewsView.tsx`  
**Quality:** 4/5  
**Enterprise Ready:** Yes  
**Action:** KEEP

**What exists:**
- Rating summary with bar chart breakdown
- Star rating histogram
- Vendor response form (inline edit pattern)
- Uses `StarRating` component correctly

**Note:** Inline heading pattern `text-2xl font-bold text-white` — candidate for `PageHeader` component in Sprint 4.

---

### VEN-15 — VendorSubscriptionView
**Location:** `components/vendor/VendorSubscriptionView.tsx`  
**Quality:** 3/5  
**Enterprise Ready:** Partial  
**Action:** FIX (P0.1 fix already applied)  
**DD Items:** DD-027

**What needs fixing (remaining):**
- `FALLBACK_PLANS` hardcoded pricing (DD-027)
- Plan naming doesn't match commercial strategy

---

### VEN-16 — VendorBookingDetail
**Location:** `components/vendor/VendorBookingDetail.tsx`  
**Not read in detail**  
**Action:** KEEP + audit in Sprint 4

---

### VEN-17 — BankDetailsForm
**Location:** `components/vendor/BankDetailsForm.tsx`  
**Not read**  
**Action:** KEEP (financial form, high sensitivity)

---

### VEN-18 — ContactListView + CreateContactForm + ContactDetailClient + ManualContactNotes + CustomerNotesWidget
**Location:** `components/vendor/Contact*.tsx`, `ManualContactNotes.tsx`, `CustomerNotesWidget.tsx`  
**Not read in detail**  
**Action:** KEEP (CRM components — key retention feature)

---

### VEN-19 — VendorOnboardingProgress + VendorOnboardingWizard
**Location:** `components/vendor/VendorOnboardingProgress.tsx`, `VendorOnboardingWizard.tsx`  
**Not read**  
**Action:** KEEP

---

### VEN-20 — VendorVerificationView
**Location:** `components/vendor/VendorVerificationView.tsx`  
**Not read**  
**Action:** KEEP

---

### VEN-21 — VendorApplyForm
**Location:** `components/vendor/VendorApplyForm.tsx`  
**Not read**  
**Action:** KEEP

---

### VEN-22 — VendorSharePanel + VendorTrustPanel + PhoneVerifyModal + ProfileViewTracker + CustomerListView
**Location:** Various vendor components  
**Not read**  
**Action:** KEEP (domain-specific, no known debt)

---

## SECTION 6 — ADMIN COMPONENTS (`components/admin/`)

---

### ADM-01 — AdminVendorTable
**Location:** `components/admin/AdminVendorTable.tsx`  
**Quality:** 5/5  
**Enterprise Ready:** Yes  
**Action:** KEEP + USE AS FILTERTABS REFERENCE

**What exists:**
- Status filter tabs using `router.push()` with `useTransition` — THIS is the correct FilterTabs pattern
- Inline rejection modal (template-based reasons)
- Inline approval modal with quality checks
- Bulk selection with checkbox
- `StatusBadge` used correctly
- `computeVendorReadinessScore()` displayed inline

**Key finding:** AdminVendorTable already implements the correct URL-based filter tab pattern. The `FilterTabs` component we plan to build should be extracted from this pattern, not designed from scratch.

**Inline modals:** Rejection and approval modals are inline in this component. These should be extracted to a shared `ConfirmationDialog` + `Modal` component pair in Sprint 3.

---

### ADM-02 — AdminBookingsView, AdminQuotesView, AdminReviewsView
**Not read in detail**  
**Action:** KEEP + audit for FilterTabs migration in Sprint 4

---

### ADM-03 — AdminDisputesView, AdminModerationView, AdminVerificationsView
**Not read**  
**Action:** KEEP

---

### ADM-04 — AdminGovernanceDashboard, AdminMonetizationDashboard, AdminAnalytics
**Not read**  
**Action:** KEEP (high-complexity admin views)

---

### ADM-05 — AdminSupportView, AdminPayoutsView, AdminPayoutsQueue, AdminCustomerTable
**Not read**  
**Action:** KEEP

---

### ADM-06 — PilotCRM, PilotDashboard
**Location:** `components/admin/`  
**Action:** KEEP (pilot infrastructure)

---

## SECTION 7 — CUSTOMER COMPONENTS (`components/customer/`)

---

### CUS-01 — CustomerBookingDetail, CustomerEventsView, CustomerEventHub, CustomerPaymentsView, CustomerQuotesView, QuoteDetailView, QuoteComparisonView, EventDetailView, CreateEventWizard, BookingRequestForm
**Not read in detail**  
**Action:** KEEP + audit in Sprint 4 (customer dashboard sprint)

---

## SECTION 8 — SMART COMPONENTS (`components/smart/`)

---

### SMT-01 — SmartConcierge
**Location:** `components/smart/SmartConcierge.tsx`  
**Quality:** 5/5  
**Enterprise Ready:** Yes  
**Action:** KEEP

**What exists:**
- Floating chat widget (open/minimised/closed)
- Persistent chat history via DB
- 30-second polling for updates
- Suggestion chips
- Unread state tracking

**Note:** Uses first-person "I am" language — review against enterprise language policy. "I am" is acceptable for the AI concierge specifically (it's describing the AI persona, not ELBOLD the platform).

---

### SMT-02 — SmartTipsWidget, SmartRecommendationsPanel
**Not read**  
**Action:** KEEP

---

## SECTION 9 — MESSAGING (`components/messaging/`)

---

### MSG-01 — MessagingView, MessageThread
**Not read**  
**Action:** KEEP (real-time messaging)

---

## SECTION 10 — OTHER COMPONENTS

---

### OTH-01 — CookieConsent + CookieConsentClient
**Action:** KEEP (legal requirement)

---

### OTH-02 — PhoneEditForm (`components/account/`)
**Action:** KEEP

---

### OTH-03 — SignOutButton (`components/auth/`)
**Action:** KEEP

---

### OTH-04 — PWA Components (`components/pwa/`)
**Exports:** `FeedbackForm`, `InstallPrompt`, `PushNotificationToggle`, `ServiceWorkerRegistration`  
**Action:** KEEP

---

### OTH-05 — GuestListView (`components/guests/`)
**Action:** KEEP

---

### OTH-06 — InvitationBuilder + PublicInvitationPage (`components/invitations/`)
**Action:** KEEP

---

### OTH-07 — Pilot Components (`components/pilot/`)
**Exports:** `AdminTestForm`, `BugsView`, `CustomerTestForm`, `LaunchReadinessDashboard`, `SubmissionsView`, `VendorTestForm`  
**Action:** KEEP

---

### OTH-08 — VendorSocialFeed (`components/ui/social/`)
**Action:** KEEP

---

## SUMMARY: ACTION CLASSIFICATION

### KEEP (no changes)
| Component | Location |
|---|---|
| StarRating | `components/ui/StarRating.tsx` |
| SkeletonLoader (5 variants) | `components/ui/SkeletonLoader.tsx` |
| MediaGallery | `components/ui/MediaGallery.tsx` |
| ShowcaseGrid | `components/ui/ShowcaseGrid.tsx` |
| ErrorBoundary (class only) | `components/ui/ErrorBoundary.tsx` |
| NotificationCentre | `components/NotificationCentre.tsx` |
| BookingPromise | `components/ui/BookingPromise.tsx` |
| SourceBadge + ContactTypeBadge | `components/vendor/SourceBadge.tsx` |
| VendorActivationChecklist | (after CheckCircle2 fix) |
| VendorGovernanceWidget | (after CheckCircle2 fix) |
| VendorMediaManager | `components/vendor/VendorMediaManager.tsx` |
| AdminVendorTable | `components/admin/AdminVendorTable.tsx` |
| SmartConcierge | `components/smart/SmartConcierge.tsx` |
| All customer components | `components/customer/` |
| All messaging components | `components/messaging/` |
| All pilot components | `components/pilot/` |

### EXTEND (add variants/props, no rebuild)
| Component | What to add |
|---|---|
| Badge + StatusBadge | Role variants (founder/global_admin/ops_admin/reviewer) |
| LoadingState / EmptyState / ErrorState | Remove emoji prop; add href variant to action |
| TrustBadges | Fix CheckCircle2 → CheckCircle |
| VendorTrustBadges | Fix CheckCircle2 → CheckCircle |
| StarRating | Add aria-label |

### FIX (targeted corrections, no rebuild)
| Component | Primary fix |
|---|---|
| DashboardLayout | Vendor nav groups, notification dot, breadcrumb, ARIA |
| MobileBottomNav | Vendor Browse → Contacts tab; aria-current |
| Navbar | Light-theme CTA; mobile ARIA |
| Footer | Social icon links or removal |
| FoundingVendorBanner | `#C9A84C` → `text-gold-500` token |
| PendingVendorBanner | CheckCircle2 → CheckCircle; rounded-2xl → rounded-xl |
| ProfileStrengthWidget | CheckCircle2 → CheckCircle |
| VendorProfileEditor | Inline sticky header bg → class |
| VendorQuotesView | STATUS_COLORS → StatusBadge |
| VendorMarketplace | Unsplash URLs → local assets; CheckCircle2 fix |

### MERGE (consolidate duplicates)
| From | Into | What |
|---|---|---|
| `LoadingSpinner.tsx` SkeletonCard | `SkeletonLoader.tsx` SkeletonCard | Delete duplicate |
| `ErrorBoundary.tsx` ErrorState | `StateComponents.tsx` ErrorState | Use shared import |
| `LoadingSpinner` CSS spin | `Loader2` from lucide | Deprecate CSS spinner |

### BUILD (net-new components — nothing currently fills this role)
| Component | Reason |
|---|---|
| `FilterTabs` | No interactive URL-based tab component (extract pattern from AdminVendorTable) |
| `NotificationIndicator` | Conditional dot wrapper — not a component anywhere |
| `StatusPage` | No shared payment page shell |
| `StatGrid` | No dynamic grid component |
| `Alert` | Informational banners all inline — no shared component |
| `Modal` / `ConfirmationDialog` | Modals inline in AdminVendorTable, no shared component |
| Barrel exports (`components/ui/index.ts`) | No index file — every import is a deep path |

### DELETE
| Component | Reason |
|---|---|
| `SkeletonCard` in `LoadingSpinner.tsx` | Duplicate of `SkeletonLoader.tsx` export |
| `ErrorState` in `ErrorBoundary.tsx` | Duplicate of `StateComponents.tsx` export |
| `btn-luxury` reference (if found by grep) | Undefined class — either define or remove |
| `btn-luxury-dark` reference (if found by grep) | Undefined class — either define or remove |

---

## UNDEFINED CLASS VERIFICATION REQUIRED

Before Sprint 2 begins, grep these class names:
```bash
grep -r "btn-luxury\|btn-luxury-dark\|btn-social" app/ components/ --include="*.tsx" --include="*.ts"
```

If found: add definitions to globals.css or replace with `btn-primary`/`btn-secondary`.  
If not found: the previous audit's mention was a false positive — no action needed.
