# ELBOLD — COMPONENT MIGRATION PLAN v2
## Phase 70E.2B Revised | Post-Inventory Audit
**Date:** 2026-06-30  
**Status:** SUPERSEDES `ELBOLD_COMPONENT_MIGRATION_PLAN.md`  
**Auditor role:** Chief Product Officer / Enterprise Solutions Architect

---

## REVISION RATIONALE

The original Migration Plan (v1) was written without a full codebase inventory. Post-inventory audit found:

| v1 Assumption | Reality | Impact on Plan |
|---|---|---|
| `LoadingState` needs to be built | Already exists in `StateComponents.tsx` | Sprint 2.10 deleted |
| `EmptyState` needs to be built | Already exists in `StateComponents.tsx` | Sprint 2.10 deleted |
| `Badge` component needs to be built | Already exists with `StatusBadge` in `Badge.tsx` | Sprint 2.7 revised |
| `PendingVendorBanner` needs rebuild as Alert | Already exists, higher quality than planned | Sprint 2.8 deleted |
| `input-dark` CSS class needed | `.input-field` already does this | Sprint 2.4 revised |
| Button classes undefined | `btn-primary/secondary/danger/secondary-light` all defined in globals.css | Sprint 3.1 revised |
| Two gold values = debt | Both are intentional tokens (gold-400, gold-500) | DD-002 clarified |

**Net result:** 30% less work than originally planned. Foundation sprint gets simpler; Sprint 2 focuses on P0 gaps.

---

## SPRINT OVERVIEW

| Sprint | Theme | Key output | DD items addressed |
|---|---|---|---|
| **Sprint 0** | Foundation (Tokens + Barrel) | Extended @theme block + `components/ui/index.ts` | DD-001, DD-031 |
| **Sprint 1** | P0 Fixes — Commercial Blockers | FilterTabs, NotificationIndicator, StatGrid, StatusPage | DD-008, DD-009, DD-028, DD-010 |
| **Sprint 2** | Core Component Standardisation | Alert, Modal, fix duplicates, icon pass, CheckCircle2 sweep | DD-005, DD-012, DD-014, DD-016, DD-017, DD-019 through DD-025 |
| **Sprint 3** | Vendor Dashboard Sprint | All vendor OS component fixes | DD-002, DD-003, DD-006, DD-007, DD-013, DD-018, DD-026, DD-027 |
| **Sprint 4** | Page Migration Sprint | Homepage (independent), customer dashboard, admin screens | DD-004, DD-011, DD-015, DD-029 through DD-032 |

**Homepage (DD-032):** Treated as an independent marketing sprint outside the four numbered sprints. Contains an entirely different colour system (light, white, dark hero) and should not be migrated alongside the authenticated app.

**Vendor Dashboard:** Receives its own Sprint 3 to ensure the primary revenue-generating persona gets focused attention.

---

## SPRINT 0 — FOUNDATION
**Goal:** Extend the token system; create barrel exports; validate CSS classes that may be undefined.  
**Block length:** 1 day  
**No pages change. No user-visible changes.**

---

### S0.1 — Extend `@theme` block with semantic background tokens
**File:** `app/globals.css`  
**DD items:** DD-001 (partially), DD-031 (semantic naming)

Add to the `@theme` block:
```css
/* Semantic layout tokens — use these instead of hardcoded hex in components */
--color-bg-base:    #0a0a0f;   /* Body / main content area */
--color-bg-surface: #0d0d18;   /* Sidebar / elevated surfaces */
--color-bg-brand:   #0D1B3E;   /* Hero panels / auth left panels */
--color-bg-footer:  #091529;   /* Footer (intentionally darker) */
```

**Rationale:** Multiple components use `style={{ background: "#0a0a0f" }}` because there is no class for the base dark background. After this sprint, they can use `bg-bg-base` (Tailwind v4 arbitrary value → semantic).

---

### S0.2 — Verify undefined button classes
**File:** `app/globals.css`  
**Action:** Pre-implementation check only

Run grep for `btn-luxury`, `btn-luxury-dark`, `btn-social` across all `.tsx` files.

- **If found:** Add definitions to globals.css that map to existing classes (e.g., `.btn-luxury { @apply btn-primary; }`)
- **If not found:** Close the investigation — no action needed

---

### S0.3 — Create barrel exports
**File:** `components/ui/index.ts` (NEW FILE)  
**DD items:** DD-031 (standardisation)

Create a single export file:
```typescript
// State & Feedback
export { LoadingState, EmptyState, ErrorState } from './StateComponents'
export { LoadingSpinner, PageLoader } from './LoadingSpinner'
export { SkeletonCard, SkeletonVendorCard, SkeletonRow, SkeletonText, SkeletonStats } from './SkeletonLoader'
export { ErrorBoundary } from './ErrorBoundary'

// Data Display
export { Badge, StatusBadge } from './Badge'
export { StarRating } from './StarRating'
export { MediaGallery } from './MediaGallery'
export { ShowcaseGrid } from './ShowcaseGrid'

// Trust
export { TrustBadges, PlatformGuaranteeBanner, MarketplaceStatsBar, BookingProtectionCard, ResponseTimePill, CompletedJobsPill } from './TrustBadges'
export { BookingPromise } from './BookingPromise'

// Utilities
export { CopyButton } from './CopyButton'
export { LegalPage } from './LegalPage'
```

**Note:** After creating this file, do NOT immediately refactor all imports — leave existing deep-path imports in place. Only use the barrel for new code written in later sprints. Gradual migration avoids churn.

---

### S0.4 — Remove duplicate SkeletonCard
**File:** `components/ui/LoadingSpinner.tsx`  
**Action:** MERGE (delete the duplicate)

Delete the `SkeletonCard` export from `LoadingSpinner.tsx`. Any file importing `SkeletonCard` from `LoadingSpinner` must be updated to import from `SkeletonLoader` instead.

```bash
# Find files importing SkeletonCard from LoadingSpinner
grep -r "from.*LoadingSpinner" components/ app/ --include="*.tsx"
```

Update those imports before deleting.

---

### S0.5 — Remove duplicate ErrorState from ErrorBoundary
**File:** `components/ui/ErrorBoundary.tsx`  
**Action:** MERGE (import from StateComponents)

Replace the inline `ErrorState` function in `ErrorBoundary.tsx` with an import from `StateComponents.tsx`. The class `ErrorBoundary` render fallback should use the shared `ErrorState` component.

---

## SPRINT 1 — P0 COMMERCIAL BLOCKERS
**Goal:** Fix the 4 open P0 issues that directly harm commercial conversion.  
**Block length:** 2–3 days  
**Prerequisites:** Sprint 0 complete

---

### S1.1 — FilterTabs component
**File (new):** `components/ui/FilterTabs.tsx`  
**DD items:** DD-008 (non-interactive filter tabs on /vendor/bookings)  
**Pattern source:** Extract from `components/admin/AdminVendorTable.tsx` (already working correctly)

**Spec:**
```typescript
interface FilterTabsProps {
  tabs: Array<{
    key: string
    label: string
    count?: number       // optional badge count
  }>
  activeKey: string      // from useSearchParams().get('status') ?? 'all'
  paramKey?: string      // default: 'status'
  className?: string
}
```

- URL-based: clicking a tab calls `router.push()` with updated `searchParams`
- `useTransition` for non-blocking navigation
- ARIA: `role="tablist"` on container, `role="tab"` on each button, `aria-selected` on active tab
- Active tab: `text-gold-400 border-b-2 border-gold-400`
- Inactive tab: `text-white/60 hover:text-white`

**Apply to:**
1. `/app/vendor/bookings/page.tsx` — replaces non-interactive status divs (DD-008)
2. All other vendor-facing tab filters

---

### S1.2 — NotificationIndicator component
**File (new):** `components/ui/NotificationIndicator.tsx`  
**DD items:** DD-009 (unconditional notification dot)

**Spec:**
```typescript
interface NotificationIndicatorProps {
  count: number     // 0 = no dot rendered at all
  className?: string
}
// Renders: <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold-400" aria-label={`${count} unread notifications`} />
// Returns null when count === 0
```

**Wire to DashboardLayout:**
- On each page that renders `DashboardLayout`, pass `unreadCount` from a server-side query to `GET /api/notifications?count_only=true`
- DashboardLayout accepts `unreadCount: number` prop and passes to `NotificationIndicator`

**Note:** A full real-time count requires server-side per-request fetch or RSC streaming. Start with a server-fetched initial count and refresh on notification page visit.

---

### S1.3 — StatGrid component
**File (new):** `components/ui/StatGrid.tsx`  
**DD items:** DD-028 (homepage stat grid gap: `gap-2 md:gap-4` instead of `gap-6`)

**Spec:**
```typescript
interface StatGridProps {
  stats: Array<{
    value: string
    label: string
    color?: 'gold' | 'white' | 'muted'
  }>
  columns?: 2 | 3 | 4    // default: 4
  gap?: 'sm' | 'md' | 'lg'  // default: 'lg' (gap-6)
}
```

**Note:** This component is primarily needed to fix DD-028 on the homepage. The homepage will be migrated independently (Homepage Sprint). This component spec exists so the homepage migration can reference it.

---

### S1.4 — StatusPage shell
**File (new):** `components/ui/StatusPage.tsx`  
**DD items:** DD-010 (payment page uses light/mixed theme; lacks enterprise shell)

**Spec:**
```typescript
interface StatusPageProps {
  theme: 'dark' | 'light'     // default: 'dark'
  icon: React.ReactNode        // Lucide icon
  iconVariant: 'success' | 'warning' | 'error' | 'info'
  title: string
  description: string
  children?: React.ReactNode   // for additional CTAs or details
}
```

- Dark theme: matches authenticated dashboard dark background (`bg-[#0a0a0f]`, or `bg-bg-base` after S0.1)
- Light theme: white background (for public post-booking confirmation pages)
- Icon container uses variant-appropriate colors (success=emerald, warning=amber, error=red, info=blue)

**Apply to:**
1. `/app/payment/*/page.tsx` — booking payment confirmation/failure pages (DD-010)

---

## SPRINT 2 — CORE COMPONENT STANDARDISATION
**Goal:** Fix cross-cutting issues affecting the whole codebase: icon naming, inline styles, missing shared components.  
**Block length:** 3–4 days  
**Prerequisites:** Sprint 1 complete

---

### S2.1 — Global CheckCircle2 → CheckCircle sweep
**DD items:** DD-005

Find all usages of `CheckCircle2` from lucide-react and replace with `CheckCircle`.

```bash
grep -r "CheckCircle2" components/ app/ --include="*.tsx" -l
```

Files expected to contain this (from audit):
- `components/ui/TrustBadges.tsx`
- `components/ui/StateComponents.tsx` (verify — may already use CheckCircle)
- `components/vendor/PendingVendorBanner.tsx`
- `components/vendor/FoundingVendorBanner.tsx`
- `components/vendor/ProfileStrengthWidget.tsx`
- `components/vendor/VendorActivationChecklist.tsx`
- `components/vendor/VendorGovernanceWidget.tsx`
- `components/vendor/VendorTrustBadges.tsx`
- `components/vendor/VendorMarketplace.tsx`
- `components/vendor/VendorProfileView.tsx`
- `components/vendor/VendorProfileEditor.tsx`

**Note:** `CheckCircle2` and `CheckCircle` are visually identical in Lucide v3+. This is a naming-standard fix, not a visual change.

---

### S2.2 — Alert component
**File (new):** `components/ui/Alert.tsx`  
**DD items:** DD-015 (inline alert blocks)

**Spec:**
```typescript
interface AlertProps {
  variant: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  dismissible?: boolean    // shows X button, manages own visibility
  className?: string
}
```

- Icons: `Info`, `CheckCircle`, `AlertTriangle`, `XCircle` from lucide
- Colors: info=blue/white, success=emerald, warning=amber, error=red — consistent with `ErrorState` color choices
- `dismissible` alerts should use `useState` for show/hide (self-contained, no parent management)

**NOT a replacement for:**
- `PendingVendorBanner` (too detailed for a simple Alert)
- `FoundingVendorBanner` (dismissible with persistence, needs localStorage)
- `EmptyState` / `ErrorState` (full-page feedback states, not inline alerts)

---

### S2.3 — ConfirmationDialog + Modal
**File (new):** `components/ui/Modal.tsx`  
**DD items:** DD-020 (approval/rejection modals inline in AdminVendorTable)

**Modal spec:**
```typescript
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  size?: 'sm' | 'md' | 'lg'    // default: 'md'
  children: React.ReactNode
}
```

**ConfirmationDialog spec:**
```typescript
interface ConfirmationDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmLabel?: string          // default: 'Confirm'
  cancelLabel?: string           // default: 'Cancel'
  variant?: 'danger' | 'primary' // default: 'primary'
  loading?: boolean              // disable confirm button during async
}
```

- Focus trap inside modal when open
- `Escape` key closes
- Click outside (`<dialog>` backdrop) closes
- `aria-modal="true"`, `role="dialog"`, `aria-labelledby` on title
- Body scroll locked when open

**Apply to:**
1. `AdminVendorTable.tsx` — extract rejection modal and approval modal into this component

---

### S2.4 — Fix StateComponents: remove emoji prop
**File:** `components/ui/StateComponents.tsx`  
**DD items:** DD-014 (emoji usage policy)

Remove the `emoji?: string` prop from `EmptyState`. Any callers using the emoji prop must be updated to pass a Lucide `icon` prop instead.

```bash
grep -r "emoji=" components/ app/ --include="*.tsx"
```

Update each caller. Replace emoji with the appropriate Lucide icon:
- 📅 → `Calendar`
- 📝 → `FileText`
- 💼 → `Briefcase`
- 🎉 → `PartyPopper` (or `Sparkles`)
- 📬 → `Mail`
- ⭐ → `Star`

---

### S2.5 — Extend Badge with role variants
**File:** `components/ui/Badge.tsx`  
**DD items:** DD-013 (admin team page uses plain text for role display)

Add role variants to `BadgeProps`:
```typescript
// Add to variant union:
'founder' | 'global_admin' | 'ops_admin' | 'reviewer'
```

Color mapping:
- founder: `bg-gold-400/15 text-gold-400 border-gold-400/30`
- global_admin: `bg-brand-500/20 text-blue-300 border-brand-500/40`
- ops_admin: `bg-purple-500/15 text-purple-300 border-purple-500/30`
- reviewer: `bg-white/8 text-white/60 border-white/15`

Also fix `gold` variant to use token colors:
- From: `bg-amber-500/20 text-amber-400`
- To: `bg-gold-400/15 text-gold-400`

---

### S2.6 — Vendor sidebar navigation grouping
**File:** `components/layout/DashboardLayout.tsx`  
**DD items:** DD-019 (16 flat items), DD-021 (breadcrumb), DD-022 (focus trap), DD-023 (ARIA), DD-029 (inline styles)

This is the largest single fix in Sprint 2.

**Vendor nav structure after fix:**
```
OVERVIEW
  ├── Dashboard (/)
  └── Analytics (/analytics)

CLIENT PIPELINE
  ├── Quotes (/quotes)
  ├── Bookings (/bookings)
  └── Reviews (/reviews)

PROFILE & PRESENCE
  ├── Edit Profile (/profile)
  ├── Services (/services)
  └── Availability (/availability)

BUSINESS
  ├── Contacts (/contacts)
  ├── Financials (/financials)
  └── Subscription (/subscription)

TOOLS
  ├── Message Centre (/messages)
  └── Verifications (/verification)
```

**DashboardLayout breadcrumb fix:**
- From: `Portal > Vendor`
- To: `Portal > Vendor Dashboard > [current page name]`

**ARIA fixes on mobile sidebar toggle:**
- `aria-expanded={sidebarOpen}`
- `aria-controls="sidebar-nav"`
- `id="sidebar-nav"` on the sidebar element

**Inline style fix:**
- `style={{ color: "rgba(255,255,255,0.92)" }}` on wordmark → `className="text-white/90"`

---

### S2.7 — Input usage audit
**DD items:** DD-016

Run grep and update any file using raw Tailwind for form inputs to use `.input-field` (dark) or `.input-light` (light) instead.

```bash
grep -rn "className=\".*border.*focus:ring\|className=\".*bg-gray-[0-9]" components/vendor/ components/customer/ --include="*.tsx"
```

Goal: all form inputs across the platform use one of the two defined input classes. No new class creation needed.

---

### S2.8 — MobileBottomNav vendor tab fix
**File:** `components/layout/MobileBottomNav.tsx`  
**DD items:** DD-018, DD-024

- Change vendor "Browse" tab from `/browse` to `/vendor/contacts`
- Change label from "Browse" to "Contacts"
- Add `aria-current="page"` to the active tab link

---

## SPRINT 3 — VENDOR DASHBOARD SPRINT
**Goal:** Fix all outstanding design debt in the vendor-facing product.  
**Block length:** 3 days  
**Prerequisites:** Sprint 2 complete

---

### S3.1 — VendorQuotesView → StatusBadge
**File:** `components/vendor/VendorQuotesView.tsx`  
**DD items:** DD-013 (badge inconsistency)

Replace `STATUS_COLORS` record and its inline `<span className={STATUS_COLORS[quote.status]}>` pattern with `<StatusBadge status={quote.status} />`. 

`StatusBadge` already handles all quote statuses. Remove `STATUS_COLORS` entirely.

---

### S3.2 — FoundingVendorBanner token fix
**File:** `components/vendor/FoundingVendorBanner.tsx`  
**DD items:** DD-002, DD-003

Replace inline styles with token classes:
```tsx
// Before
style={{ background: "linear-gradient(135deg, #0d1b3e 0%, #162447 100%)" }}
style={{ color: "#C9A84C" }}
border-[#C9A84C]/30

// After
className="gradient-brand"
className="text-gold-500"
border-gold-500/30
```

---

### S3.3 — PendingVendorBanner fixes
**File:** `components/vendor/PendingVendorBanner.tsx`  
**DD items:** DD-005, DD-017

- `CheckCircle2` → `CheckCircle` (covered in S2.1 sweep, but verify)
- `rounded-2xl` → `rounded-xl`
- `XCircle` for "not yet active" items → `Circle` (neutral placeholder, not failure)

**DO NOT simplify to a basic Alert wrapper.** The two-column "what you can do / what activates after approval" layout is a high-quality UX pattern worth preserving.

---

### S3.4 — VendorMarketplace Unsplash URL migration
**DD items:** DD-026

1. Download the 21 category fallback images from their Unsplash URLs and save to `/public/images/categories/`
2. Update `CATEGORY_FALLBACK` in `VendorMarketplace.tsx` to use `/images/categories/[category].jpg`

**Name mapping (use kebab-case):**
```
"Photography" → /images/categories/photography.jpg
"Catering" → /images/categories/catering.jpg
"Music & Entertainment" → /images/categories/music-entertainment.jpg
[... all 21 categories]
```

---

### S3.5 — VendorProfileEditor sticky header fix
**File:** `components/vendor/VendorProfileEditor.tsx`  
**DD items:** DD-003

- Replace `style={{ background: "#0a0a0f" }}` on sticky header with `className="bg-[#0a0a0f]"` (Tailwind arbitrary) or `className="bg-bg-base"` if S0.1 token is complete

---

### S3.6 — DashboardLayout nav label fixes
**File:** `components/layout/DashboardLayout.tsx`  
**DD items:** DD-006, DD-007

- "Get Verified" → "Verification"
- "Inspiration Feed" → REMOVE ENTIRELY (no page currently backs this item)
- Other label corrections per DD-006 audit items

---

### S3.7 — VendorSubscriptionView pricing fix
**File:** `components/vendor/VendorSubscriptionView.tsx`  
**DD items:** DD-027

- Remove `FALLBACK_PLANS` hardcoded pricing object
- Plans must come from Stripe (`stripeProducts` fetched at build time or request time)
- If Stripe fetch fails, show `EmptyState` with "Pricing unavailable — contact support"

---

### S3.8 — ProfileStrengthWidget + VendorActivationChecklist inline color fix
**Files:** `components/vendor/ProfileStrengthWidget.tsx`, `VendorActivationChecklist.tsx`  
**DD items:** DD-003, DD-005

- `CheckCircle2` → `CheckCircle` (S2.1 sweep handles this)
- `from-[#D4AF37]` → `from-gold-400`
- `from-brand-500 to-[#D4AF37]` → `from-brand-500 to-gold-400`

---

### S3.9 — StarRating accessibility
**File:** `components/ui/StarRating.tsx`  
**DD items:** DD-017 (ARIA)

Add `aria-label` to the star rating container:
```tsx
<div 
  className={cn("flex items-center gap-0.5", className)}
  aria-label={`Rating: ${rating} out of ${maxStars} stars`}
  role={onChange ? "radiogroup" : undefined}
>
```

---

## SPRINT 4 — PAGE MIGRATION SPRINT

**Scope:** Route-level pages that need DashboardShell or PageHeader component adoption.  
**Block length:** 4–5 days  
**Prerequisites:** Sprint 3 complete  
**Homepage is NOT in this sprint — see Homepage Sprint below.**

---

### S4.1 — PageHeader component + adoption
**File (new):** `components/ui/PageHeader.tsx`

Many pages define `text-2xl font-bold text-white` headings with action buttons inline. This is the right moment to extract a shared `PageHeader`.

**Spec:**
```typescript
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode    // right-aligned buttons
  breadcrumb?: Array<{ label: string; href?: string }>
  className?: string
}
```

**Apply to:**
- `/app/vendor/*/page.tsx` — all vendor dashboard pages
- `/app/admin/*/page.tsx` — all admin pages
- Customer dashboard pages

---

### S4.2 — FilterTabs adoption in remaining pages
**DD items:** DD-008

Using the `FilterTabs` component built in Sprint 1:

Apply to every page with tab-style navigation that is NOT already using `router.push()`:
- `/app/vendor/bookings/page.tsx` (the primary DD-008 case)
- `/app/vendor/quotes/page.tsx` (if present)
- `/app/admin/*/page.tsx` that use client-side status arrays
- Customer booking status tabs (if present)

---

### S4.3 — Admin dark theme
**DD items:** DD-020

All admin pages already use DashboardLayout which enforces the dark theme. But audit admin components for any with `bg-white` or `bg-gray-50` surfaces (these should be `bg-white/4 border border-white/6` for cards in dark context).

---

### S4.4 — Payment pages StatusPage migration
**DD items:** DD-010

Replace the payment success/failure pages with `StatusPage` component (built in Sprint 1):
- `/app/payment/[bookingId]/success/page.tsx`
- `/app/payment/[bookingId]/failed/page.tsx`
- Any other payment outcome pages

These currently use inconsistent theming. StatusPage ensures they match the authenticated dark experience.

---

### S4.5 — Footer social links
**File:** `components/layout/Footer.tsx`  
**DD items:** DD-011, DD-025

- Replace placeholder `div` social icon containers with `<a href="..." target="_blank" rel="noopener noreferrer">`
- Add Instagram, X (formerly Twitter), and Facebook URLs from platform settings
- If URLs are not yet confirmed, hide the icons entirely rather than show non-functional placeholders

---

### S4.6 — Remove remaining inline style declarations
**DD items:** DD-003

Sweep remaining files for `style={{` patterns:
- `components/ui/BookingPromise.tsx` — inline navy bg on numbered step circles
- Any files discovered after S3.x fixes

Target: zero `style={{` in component files after this sprint. All inline color values replaced with token references.

---

## HOMEPAGE SPRINT — INDEPENDENT MARKETING EXPERIENCE
**Goal:** Homepage is a separate visual system (light theme, dark hero) and must be treated as a standalone migration.  
**Block length:** 2 days  
**No dependencies on numbered sprints (can run in parallel with Sprint 2–3)**

---

### HP.1 — Stat grid gap fix
**DD items:** DD-028

Find the 4-stat grid in the homepage hero section. Change `gap-2 md:gap-4` → `gap-6`. Optionally adopt `StatGrid` component from Sprint 1.

---

### HP.2 — Consistent CTA strategy
**DD items:** DD-032

The homepage must have a single clear primary CTA. Audit the current homepage:
- Confirm "Begin Planning" is the primary CTA (leads to `/create-event`)
- Secondary CTA: "Browse Vendors" leads to `/browse`
- Both CTAs must use `btn-primary` (with white/gold colours appropriate for the light hero)

**Note:** On the light hero, `btn-primary` (navy bg, gold text) works correctly as-is. No new button class needed.

---

### HP.3 — Navbar light-theme CTA
**File:** `components/layout/Navbar.tsx`  
**DD items:** DD-032

On the public navbar:
- Add "Begin Planning" as a primary CTA button alongside "Sign In"
- "Sign In" becomes a secondary CTA (`btn-secondary-light`)

---

### HP.4 — Image quality review
**DD items:** DD-015 (mixed image quality in homepage sections)

Review all images in the homepage showcase or trust sections:
- Replace any Unsplash references with owned assets
- Ensure all images have correct `alt` attributes
- Ensure `next/image` is used with `priority` on above-the-fold images

---

## DESIGN DEBT REGISTER CORRECTIONS

The following DD items require corrections to `ELBOLD_DESIGN_DEBT_REGISTER.md`:

| DD # | Current (Incorrect) | Correction |
|---|---|---|
| DD-002 | "Two competing gold values — gold-400: #D4AF37 and gold-500: #C9A84C" | Revise to: "Two gold tokens exist INTENTIONALLY: gold-400 (#D4AF37) is primary gold; gold-500 (#C9A84C) is muted/deeper gold for FoundingVendorBanner. Debt is USAGE of hardcoded hex instead of referencing these tokens." |
| DD-012 | "Button fragmentation — btn-luxury, btn-luxury-dark undefined" | Revise to: "btn-primary, btn-secondary, btn-danger, btn-secondary-light are ALL correctly defined in globals.css. The only gap is the absence of React wrapper components around these CSS classes." |
| DD-016 | "No input-dark class defined" | Revise to: ".input-field IS the dark input class — comprehensive, with focus/error/placeholder states. The issue is inconsistent adoption. Do NOT create input-dark — use input-field." |

---

## FULL DD ITEM → SPRINT MAPPING

| DD # | Title | Sprint | Task |
|---|---|---|---|
| DD-001 | No semantic bg tokens | Sprint 0 | S0.1 |
| DD-002 | Gold token usage (not duplication) | Sprint 3 | S3.2 (FoundingVendorBanner) |
| DD-003 | Inline hex styles | Sprint 2–3 | S2.1 + S3.2 + S3.5 + S3.8 + S4.6 |
| DD-004 | Non-Lucide icons | Sprint 4 | S4.3 sweep |
| DD-005 | CheckCircle2 naming | Sprint 2 | S2.1 |
| DD-006 | Nav label inconsistencies | Sprint 3 | S3.6 |
| DD-007 | Inspiration Feed ghost link | Sprint 3 | S3.6 |
| DD-008 | Non-interactive filter tabs | Sprint 1 | S1.1 |
| DD-009 | Unconditional notification dot | Sprint 1 | S1.2 |
| DD-010 | Payment page mixed theme | Sprint 1 | S1.4 |
| DD-011 | Footer non-functional social links | Sprint 4 | S4.5 |
| DD-012 | Button React wrapper | Sprint 2 | S2.3 |
| DD-013 | Badge inconsistency (VendorQuotes) | Sprint 3 | S3.1 |
| DD-014 | Emoji in empty states | Sprint 2 | S2.4 |
| DD-015 | Inline alert blocks | Sprint 2 | S2.2 |
| DD-016 | Input adoption (not class creation) | Sprint 2 | S2.7 |
| DD-017 | Missing ARIA | Sprint 2 + S3.9 | S2.6 + S3.9 |
| DD-018 | Vendor Browse tab mismatch | Sprint 2 | S2.8 |
| DD-019 | Flat vendor nav (16 items) | Sprint 2 | S2.6 |
| DD-020 | Inline admin modals | Sprint 2 | S2.3 |
| DD-021 | Breadcrumb depth | Sprint 2 | S2.6 |
| DD-022 | Mobile sidebar focus trap | Sprint 2 | S2.6 |
| DD-023 | Mobile toggle ARIA | Sprint 2 | S2.6 |
| DD-024 | MobileBottomNav aria-current | Sprint 2 | S2.8 |
| DD-025 | Social link ARIA | Sprint 4 | S4.5 |
| DD-026 | Unsplash vendor category images | Sprint 3 | S3.4 |
| DD-027 | Hardcoded subscription pricing | Sprint 3 | S3.7 |
| DD-028 | Homepage stat grid gap | Homepage Sprint | HP.1 |
| DD-029 | DashboardLayout inline styles | Sprint 2 | S2.6 |
| DD-030 | Non-standard sidebar width | Sprint 2 | S2.6 |
| DD-031 | Dual theme systems (no semantic tokens) | Sprint 0 | S0.1 + S0.3 |
| DD-032 | Homepage CTA inconsistency | Homepage Sprint | HP.2 + HP.3 |

---

## COMPONENTS THAT ARE FINAL — DO NOT MODIFY

The following components are complete and should not be changed in this migration:

| Component | File | Reason |
|---|---|---|
| SkeletonLoader (5 variants) | `components/ui/SkeletonLoader.tsx` | Complete, well-implemented |
| StarRating | `components/ui/StarRating.tsx` | Complete (add ARIA only) |
| MediaGallery | `components/ui/MediaGallery.tsx` | Complete, used correctly |
| SourceBadge | `components/vendor/SourceBadge.tsx` | Complete, no issues |
| VendorMediaManager | `components/vendor/VendorMediaManager.tsx` | Complete, most advanced component |
| NotificationCentre | `components/NotificationCentre.tsx` | Complete (wire up unreadCount only) |
| SmartConcierge | `components/smart/SmartConcierge.tsx` | Complete |
| All messaging components | `components/messaging/` | Complete |
| All PWA components | `components/pwa/` | Complete |
| VendorGovernanceWidget | `components/vendor/VendorGovernanceWidget.tsx` | Complete after CheckCircle2 fix |
| VendorActivationChecklist | `components/vendor/VendorActivationChecklist.tsx` | Complete after CheckCircle2 fix |

---

## COMPONENTS EXPLICITLY NOT TO REBUILD

| Component | Why it was originally targeted | Why it should NOT be rebuilt |
|---|---|---|
| `PendingVendorBanner` | "Rebuild as Alert wrapper" | Two-column structure provides more actionable context than a simple Alert. Rebuilding would degrade UX. |
| `LoadingState` | "Build new" | Already exists in StateComponents.tsx. HIGH quality. |
| `EmptyState` | "Build new" | Already exists in StateComponents.tsx. HIGH quality. |
| `Badge` | "Build new" | Already exists with 14 status mappings. HIGH quality. |
| `LoadingSpinner` (CSS spin) | "Deprecate" | Still used by PageLoader. Deprecate gradually, not immediately. |

---

## SUCCESS CRITERIA

**Sprint 0:** `components/ui/index.ts` exists; `@theme` has bg-base/bg-surface tokens; no duplicate SkeletonCard or ErrorState.

**Sprint 1:** `/vendor/bookings` filter tabs change page URL when clicked. Notification dot only shows when `unreadCount > 0`. Payment confirmation pages use consistent dark theme.

**Sprint 2:** Zero `CheckCircle2` references across codebase. All empty states use Lucide icons (no emoji). Modal/ConfirmationDialog used in AdminVendorTable. Vendor sidebar has 5 named groups instead of 16 flat items.

**Sprint 3:** Zero `STATUS_COLORS` inline records. Zero `#C9A84C` hardcoded hex values. `CATEGORY_FALLBACK` in VendorMarketplace references local `/public/images/` assets.

**Sprint 4:** All dashboard pages use `PageHeader`. Payment outcome pages use `StatusPage`. Footer social links are real or absent.

**Homepage Sprint:** Stat grid uses `gap-6`. Primary CTA "Begin Planning" is prominent. "Sign In" is secondary.

**Overall:** Platform audit score (from `ELBOLD_ENTERPRISE_EXPERIENCE_AUDIT.md`) advances from 63/100 toward 80/100. P0 count: 0 open (currently 4).
