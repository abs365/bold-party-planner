# ELBOLD — ENTERPRISE COMPONENT LIBRARY
## Phase 70E.2A | Component Specifications
**Date:** 2026-06-30  
**Status:** Specification only — no implementation  
**Input:** ELBOLD_ENTERPRISE_EXPERIENCE_AUDIT.md, ELBOLD_DESIGN_DEBT_REGISTER.md  
**Output:** Foundation for all Phase 70E.2 and 70E.3 implementation  

---

## HOW TO READ THIS DOCUMENT

Each component entry defines what to build, not how to build it. Every component is designed to replace one or more inconsistent implementations currently scattered across the codebase. Implementation follows the Migration Plan (`ELBOLD_COMPONENT_MIGRATION_PLAN.md`).

**Component path convention:**  
`components/ui/[ComponentName].tsx` — Design system primitives  
`components/layout/[ComponentName].tsx` — Shell / structural components  
`components/domain/[ComponentName].tsx` — Domain-specific composed components  

**Theme contract:**  
- Dark (authenticated): body `#0a0a0f`, surface `#0d0d18`, brand panel `#0D1B3E`  
- Light (public marketing): body `#ffffff`, hero `#0D1B3E`  
- All components must declare which theme they support: `dark` | `light` | `both`

---

## PART 1 — FOUNDATION

---

### F-01 — Color Tokens
**Resolves:** DD-001, DD-002, DD-003  
**Path:** `app/globals.css` (extend existing)

**Purpose:** Single source of truth for every color used across the platform. All component files reference tokens — never hardcoded hex values.

**Token specification:**

```css
/* Background hierarchy */
--color-bg-base:       #0a0a0f;  /* Main content area, top bar */
--color-bg-surface:    #0d0d18;  /* Sidebar, elevated surfaces */
--color-bg-brand:      #0D1B3E;  /* Hero panels, auth left panel */
--color-bg-footer:     #091529;  /* Footer (distinct from brand) */
--color-bg-card:       rgba(255,255,255,0.04);  /* Dark cards */
--color-bg-card-hover: rgba(255,255,255,0.06);  /* Dark card hover */

/* Brand colors */
--color-brand-500:    #0B1F4D;   /* Primary brand navy */
--color-brand-400:    #1a3a6b;   /* Lighter brand nav active */
--color-gold-400:     #D4AF37;   /* Gold accent — single source */

/* Text hierarchy */
--color-text-primary:   rgba(255,255,255,0.92);  /* Headings */
--color-text-secondary: rgba(148,163,184,1);     /* text-slate-400 */
--color-text-muted:     rgba(100,116,139,1);     /* text-slate-500 */

/* Borders */
--color-border-subtle:  rgba(255,255,255,0.06);  /* border-white/6 */
--color-border-muted:   rgba(255,255,255,0.10);  /* border-white/10 */

/* Semantic status */
--color-status-success:  #4ade80;  /* text-green-400 */
--color-status-warning:  #facc15;  /* text-yellow-400 */
--color-status-error:    #f87171;  /* text-red-400 */
--color-status-info:     #60a5fa;  /* text-blue-400 */
```

**Tailwind extension (tailwind.config.ts):**
```ts
colors: {
  brand:  { 400: '#1a3a6b', 500: '#0B1F4D' },
  gold:   { 400: '#D4AF37' },
  bg:     { base: '#0a0a0f', surface: '#0d0d18', brand: '#0D1B3E' }
}
```

**Accessibility:** All foreground/background combinations must meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text). `--color-text-secondary` on `--color-bg-base` must be verified.

---

### F-02 — Typography Scale
**Path:** `app/globals.css`

**Purpose:** Consistent type sizing and weight across all surfaces.

| Token | Tailwind | Usage |
|---|---|---|
| Page heading | `text-2xl font-bold text-white` | `<h1>` in DashboardLayout pages |
| Section heading | `text-lg font-semibold text-white` | `<h2>` in page sections |
| Card heading | `text-base font-semibold text-white` | Card titles |
| Body | `text-sm text-slate-400` | Descriptive text |
| Label | `text-xs font-medium text-slate-500` | Nav group labels, field labels |
| Caption | `text-xs text-slate-500` | Timestamps, secondary metadata |

**Rule:** No `text-gray-*` classes in authenticated pages. Authenticated surfaces use `text-slate-*` only. `text-gray-*` is reserved for light-theme admin cards and public pages.

---

## PART 2 — NAVIGATION & SHELL

---

### N-01 — DashboardShell
**Resolves:** DD-001, DD-009, DD-019, DD-020, DD-021, DD-029, DD-030  
**Path:** `components/layout/DashboardLayout.tsx` (refactor in place)  
**Theme:** Dark  
**Existing implementation:** `DashboardLayout.tsx` — refactor, do not replace

**Purpose:** The authenticated application shell. Wraps all vendor OS, customer dashboard, and admin pages. Provides: sidebar navigation, top bar with breadcrumb and actions, mobile overlay sidebar, mobile bottom nav.

**Variants:**
| Variant | Sidebar content | Mobile nav | Used by |
|---|---|---|---|
| `vendor` | VENDOR_NAV_GROUPS (grouped, 16 items in 5 groups) | VendorMobileNav | All `/vendor/*` pages |
| `customer` | CUSTOMER_NAV (10 items, flat) | CustomerMobileNav | All `/dashboard/*` pages |
| `admin` | ADMIN_NAV_GROUPS (6 grouped sections, role-filtered) | None | All `/admin/*` pages |

**States:**
- `sidebar-open` (mobile): overlay visible, focus trapped
- `sidebar-closed` (mobile): overlay hidden
- `notifications-unread`: bell dot visible only when `unreadCount > 0`
- `notifications-zero`: bell dot hidden

**Props:**
```ts
interface DashboardShellProps {
  children: React.ReactNode;
  user: Profile;
  adminRole?: AdminRole;
  unreadCount?: number;    // NEW — drives notification dot
}
```

**Accessibility requirements:**
- Mobile menu toggle: `aria-expanded={sidebarOpen}` + `aria-controls="mobile-sidebar"` + `aria-label="Open navigation"`
- Mobile sidebar: `id="mobile-sidebar"` + focus trap when open
- Nav links: `aria-current="page"` on active item
- Notification bell: `aria-label="Notifications"` + `aria-live="polite"` on dot (or `aria-label="Notifications, N unread"`)

**Responsive behaviour:**
- `< lg`: sidebar hidden. Hamburger in top bar opens overlay sidebar. MobileBottomNav at bottom.
- `≥ lg`: sidebar always visible. Top bar shows breadcrumb. No bottom nav.

**Breadcrumb (enhanced):**
- Current: `"Portal > [Role]"` — static
- Target: `"Portal > [Role] > [Current Page Label]"` — dynamic from active nav item
- Derive current page label by matching `pathname` against the nav items array

**Vendor sidebar grouping (DD-019):**
```
Group: Operations      → Dashboard, Bookings, Leads, Messages
Group: Customers       → Customers, Contacts
Group: Profile         → My Profile, Services, Media, Reviews, Availability
Group: Business        → Analytics, Payouts, Subscription
Group: Account         → Verification, Feedback
```

**Current duplicate implementations:** None — single component. Refactor in place.  
**Migration priority:** Sprint 2 (multiple P1 fixes unlocked)

---

### N-02 — SidebarNavGroup
**Path:** `components/layout/SidebarNavGroup.tsx`  
**Theme:** Dark  
**Existing implementation:** Inline in `DashboardLayout.tsx` — extract

**Purpose:** A labelled group of nav links within the sidebar. Used by admin and (after DD-019 fix) vendor sidebar.

**Variants:** `grouped` (with label) | `flat` (no label, customer nav)

**States:** Each link: `default` | `active` | `hover`

**Accessibility requirements:** Nav landmark element (`<nav>`). Group label as `aria-label` on the nav or as a `<h3>` visually hidden but screen-reader visible.

---

### N-03 — MobileBottomNav
**Resolves:** DD-018, DD-007 (vendor "Browse" tab fix)  
**Path:** `components/layout/MobileBottomNav.tsx` (refactor in place)  
**Theme:** Dark

**Purpose:** 5-tab primary navigation for mobile users. Role-aware. Hidden for admin.

**Variants:**

**Customer tabs (unchanged):**
| Tab | Route | Icon |
|---|---|---|
| Home | `/dashboard` | LayoutDashboard |
| Events | `/dashboard/events` | Calendar |
| Plan | `/dashboard/create-event` | Sparkles (gradient, primary) |
| Saved | `/dashboard/saved` | Heart |
| Messages | `/dashboard/messages` | MessageSquare |

**Vendor tabs (revised — DD-018 fix):**
| Tab | Route | Icon | Change |
|---|---|---|---|
| Home | `/vendor/dashboard` | LayoutDashboard | — |
| Bookings | `/vendor/bookings` | ShoppingBag | — |
| Leads | `/vendor/quotes` | Inbox | — |
| Contacts | `/vendor/contacts` | BookUser | **Replaces Browse** |
| Analytics | `/vendor/analytics` | TrendingUp | — |

**States:** `default` | `active` (brand color, label visible) | `none` (admin — returns null)

**Accessibility requirements:**
- `role="navigation"` + `aria-label="Mobile navigation"`
- `aria-current="page"` on active tab
- Safe area inset bottom: `pb-[env(safe-area-inset-bottom)]`

**Responsive behaviour:** Rendered only below `lg` breakpoint. `pb-20` added to page main content to prevent overlap.

---

### N-04 — PublicNavbar
**Path:** `components/layout/Navbar.tsx` (refactor in place)  
**Theme:** Both (light / dark mode via `lightBg` prop)  
**Existing:** Already implemented — resolve inconsistencies only

**Purpose:** Navigation for public-facing pages. Two visual modes.

**Variants:**
- `dark` (`lightBg=false`): Dark background. CTAs: "Sign In" + "Begin Planning"
- `light` (`lightBg=true`): White/transparent background. CTA: "Sign In" only

**Design debt to fix:** The primary CTA in light mode is "Sign In" while dark mode shows "Begin Planning". Both should show "Begin Planning" as the primary CTA for unauthenticated users. "Sign In" should be secondary in both modes.

**States:** `default` | `mobile-open` | `auth-user` (shows profile dropdown instead of CTAs)

**Accessibility requirements:**
- Mobile toggle: `aria-expanded` + `aria-controls`
- Profile dropdown: `role="menu"` + `role="menuitem"` on items + keyboard navigation
- Skip-to-content link (first element in DOM, visible on focus)

**Responsive behaviour:**
- `< md`: mobile hamburger, full-screen dropdown menu
- `≥ md`: inline nav links + CTAs

---

## PART 3 — LAYOUT PRIMITIVES

---

### L-01 — PageHeader
**Path:** `components/ui/PageHeader.tsx`  
**Theme:** Dark  
**Existing implementations:** Inline in every page — no shared component

**Purpose:** Consistent heading block at the top of every authenticated page. Establishes page identity before content.

**Variants:**
- `default`: Title + optional subtitle
- `with-action`: Title + subtitle + right-aligned action button
- `with-badge`: Title + status badge + optional subtitle

**Props:**
```ts
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}
```

**Standard visual output:**
```
[Icon?] Page Title                    [Action Button]
        Subtitle text in slate-400
```

**Anatomy:**
- Heading: `text-2xl font-bold text-white`
- Subtitle: `text-sm text-slate-400 mt-1`
- Container: `flex items-start justify-between mb-6`

**Current duplicate implementations:**
```
app/vendor/bookings/page.tsx     → inline h1 + p
app/vendor/quotes/page.tsx       → inline h1 + p
app/vendor/analytics/page.tsx    → inline h1 + p
app/dashboard/page.tsx           → inline welcome + stats
app/admin/team/page.tsx          → inline h1 + icon
app/admin/*/page.tsx             → each has own pattern
```

**Pages that should use it:** All authenticated pages with a page-level title  
**Migration priority:** Sprint 3 (cosmetic but high coverage)

---

### L-02 — StatGrid
**Resolves:** DD-028 (homepage stat grid gap)  
**Path:** `components/ui/StatGrid.tsx`  
**Theme:** Both

**Purpose:** A responsive grid of stat items. Handles 2, 3, or 4 items gracefully without visual gaps. Used on homepage and vendor dashboard.

**Variants:**
- `compact` (homepage): Large numbers, labels beneath
- `dashboard` (vendor/customer): Icon + number + label + delta

**Props:**
```ts
interface StatGridProps {
  stats: { label: string; value: string | number; delta?: string; icon?: React.ElementType }[];
  variant?: 'compact' | 'dashboard';
}
```

**Responsive grid logic:**
- 2 items: `grid-cols-2`
- 3 items: `grid-cols-3`
- 4 items: `grid-cols-2 sm:grid-cols-4`
- Never renders an asymmetric grid. The grid-cols-n is derived dynamically from `stats.length`.

**Homepage usage fix:** Remove hardcoded `grid-cols-4` from homepage stats section. Replace with `StatGrid` which auto-selects `grid-cols-3` when vendor count stat is suppressed.

**Current duplicate implementations:**
```
app/page.tsx           → hardcoded 4-col grid
app/vendor/dashboard/  → VendorDashboard component (stats section)
app/dashboard/page.tsx → Customer stats section
```

**Migration priority:** Sprint 1 (P0 fix for homepage)

---

### L-03 — SectionLayout
**Path:** `components/ui/SectionLayout.tsx`  
**Theme:** Both

**Purpose:** Consistent section padding and max-width constraint for both public and authenticated pages. Eliminates per-page decisions about `max-w-*` and `px-*` values.

**Variants:**
- `content` (authenticated): `max-w-5xl mx-auto` — vendor OS, customer dashboard
- `admin` (admin): `max-w-4xl mx-auto px-4 py-8`
- `public-wide` (homepage sections): `max-w-7xl mx-auto px-6`
- `public-narrow` (auth pages, checkout): `max-w-md mx-auto`

**Current state:** Every page file individually sets its own `max-w-*` with varying values (`max-w-4xl`, `max-w-5xl`, `max-w-6xl`, `max-w-7xl`). No consistent rule.

**Migration priority:** Sprint 3 (low impact per file but high coverage)

---

### L-04 — HeroSection
**Path:** `components/ui/HeroSection.tsx`  
**Theme:** Light (public pages only)

**Purpose:** Dark navy hero panel for public marketing pages. Consistent overlay, text treatment, CTA positioning.

**Variants:**
- `full` (homepage): Full-viewport hero with gradient overlay and dual CTAs
- `page-header` (about, how-it-works, founding-vendors): Compact dark header with page title, shorter height

**States:** None (static)

**Anatomy (page-header variant):**
- Background: `#0D1B3E` or gradient over image
- Heading: `text-4xl font-bold text-white`
- Subtext: `text-slate-300 text-lg`
- Breadcrumb: `text-slate-400 text-sm` above heading (optional)

**Current duplicate implementations:**
```
app/about/page.tsx              → custom hero section inline
app/founding-vendors/page.tsx   → custom hero section inline  
app/how-it-works/page.tsx       → custom hero section inline
```

**Migration priority:** Sprint 3

---

## PART 4 — DATA DISPLAY

---

### D-01 — Card
**Resolves:** DD-013 (border radius inconsistency), DD-020 (admin page light cards)  
**Path:** `components/ui/Card.tsx`  
**Theme:** Both

**Purpose:** The primary content container across authenticated pages. Replaces all ad-hoc `div` elements with `bg-white/4 border border-white/6 rounded-xl` applied inconsistently.

**Variants:**
| Variant | Background | Border | Radius | Text | Used in |
|---|---|---|---|---|---|
| `dark` | `bg-white/4` | `border-white/6` | `rounded-xl` | `text-white` | All authenticated pages |
| `dark-hover` | `bg-white/4 hover:bg-white/6` | `border-white/6` | `rounded-xl` | `text-white` | Clickable cards |
| `admin` | `bg-white/4` | `border-white/6` | `rounded-xl` | `text-white` | Admin pages (replaces `bg-white border-gray-200`) |
| `light` | `bg-white` | `border-gray-200` | `rounded-xl` | `text-gray-900` | Public pages only |

**Note on admin cards:** `app/admin/team/page.tsx` currently uses `bg-white border border-gray-200 rounded-lg` (light theme) inside the dark DashboardLayout. This must be converted to `dark` variant (DD-020).

**Props:**
```ts
interface CardProps {
  children: React.ReactNode;
  variant?: 'dark' | 'dark-hover' | 'admin' | 'light';
  padding?: 'sm' | 'md' | 'lg';  // p-4, p-6, p-8
  className?: string;
}
```

**States:** `default` | `hover` (dark-hover variant) | `disabled` (opacity-50)

**Accessibility requirements:** If card is clickable, wrap in `<Link>` or add `role="button"` + keyboard handler. Never use `onClick` on a `div` without a role.

**Responsive behaviour:** Full width by default. Width constrained by parent layout.

**Current duplicate implementations:**
```
Every authenticated page → inline div with bg-white/4 border-white/6 rounded-xl
app/admin/team/page.tsx → bg-white border-gray-200 rounded-lg (wrong theme)
app/dashboard/page.tsx  → bg-white/4 border-white/6 rounded-2xl (wrong radius)
```

**Migration priority:** Sprint 2

---

### D-02 — StatCard
**Path:** `components/ui/StatCard.tsx`  
**Theme:** Dark  
**Existing implementations:** Vendor dashboard, customer dashboard — each inline

**Purpose:** A KPI display card showing a metric with optional icon, delta, and trend. Used in both vendor and customer dashboard grids.

**Variants:**
- `default`: Number + label + optional delta
- `with-icon`: Icon on left + number + label
- `trend-up`: Green delta indicator
- `trend-down`: Red delta indicator
- `neutral`: No delta

**Props:**
```ts
interface StatCardProps {
  label: string;
  value: string | number;
  delta?: { value: string; direction: 'up' | 'down' | 'neutral' };
  icon?: React.ElementType;
  iconColor?: string;
}
```

**Migration priority:** Sprint 3

---

### D-03 — DataTable
**Path:** `components/ui/DataTable.tsx`  
**Theme:** Both

**Purpose:** Consistent table pattern across the platform. Handles: column headers, row data, empty state, loading state, pagination. Used in bookings, reviews, payouts, admin lists.

**Variants:**
- `dark` (authenticated): `bg-white/4` header, `divide-white/6` rows
- `light` (admin team page, public): `bg-gray-50` header, `divide-gray-100` rows

**States:** `loading` | `empty` | `populated` | `error`

**Anatomy:**
- Container: `Card` (variant matching context)
- Header row: Slightly elevated background, `text-xs font-semibold uppercase tracking-wide text-slate-500`
- Data rows: `divide-y divide-white/6`, `text-sm text-white`
- Empty state: `EmptyState` component (see F-02)
- Loading state: `TableSkeleton` component (skeleton rows)

**Accessibility requirements:**
- `<table>` element (not `div` grid) for tabular data
- `<th scope="col">` for headers
- `<th scope="row">` for row headers
- `aria-sort` on sortable columns

**Current duplicate implementations:**
```
app/admin/team/page.tsx           → div-based list
app/vendor/payouts/page.tsx       → inline table (unknown pattern)
components/vendor/VendorSubscriptionView.tsx → custom comparison table
```

**Migration priority:** Sprint 3

---

### D-04 — Badge
**Path:** `components/ui/Badge.tsx`  
**Theme:** Both

**Purpose:** Status labels, role labels, and category tags across the platform.

**Variants (semantic):**
| Variant | Color | Use case |
|---|---|---|
| `success` | `bg-green-500/15 text-green-400 border-green-500/20` | Active, approved, confirmed |
| `warning` | `bg-yellow-500/15 text-yellow-400 border-yellow-500/20` | Pending, awaiting, review |
| `error` | `bg-red-500/15 text-red-400 border-red-500/20` | Rejected, failed, cancelled |
| `info` | `bg-blue-500/15 text-blue-400 border-blue-500/20` | Info, draft, new |
| `neutral` | `bg-white/6 text-slate-400 border-white/10` | Neutral, archived, inactive |
| `brand` | `bg-brand-500/15 text-brand-400 border-brand-500/20` | Featured, premium |
| `gold` | `bg-gold-400/15 text-gold-400 border-gold-400/20` | Founding vendor, top performer |

**Variants (role — for admin team page):**
| Role | Colors |
|---|---|
| `founder` | `bg-purple-500/15 text-purple-400` |
| `global_admin` | `bg-blue-500/15 text-blue-400` |
| `ops_admin` | `bg-green-500/15 text-green-400` |
| `reviewer` | `bg-white/6 text-slate-400` |

**Props:**
```ts
interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'brand' | 'gold';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}
```

**Current duplicate implementations:**
```
app/admin/team/page.tsx → ROLE_COLOURS object (light theme bg-blue-100 text-blue-800)
app/vendor/bookings/page.tsx → custom status pills  
Multiple booking/review pages → inline status spans
```

**Migration priority:** Sprint 2

---

### D-05 — NotificationIndicator
**Resolves:** DD-009 (hardcoded notification dot)  
**Path:** `components/ui/NotificationIndicator.tsx`  
**Theme:** Dark

**Purpose:** A small indicator dot shown on the notification bell icon when there are unread notifications. Must be conditional — never rendered when unread count is zero.

**Variants:**
- `dot` (default): Gold 6px dot, no count
- `count` (future): Numeric count badge when > 9 items

**Props:**
```ts
interface NotificationIndicatorProps {
  count: number;        // 0 = hidden
  variant?: 'dot' | 'count';
  color?: string;       // defaults to var(--color-gold-400)
}
```

**States:**
- `count === 0`: Returns `null` — renders nothing
- `count > 0`: Renders dot (or count badge)
- `count > 9`: Renders "9+" in count variant

**Usage in DashboardShell:**
```tsx
<NotificationIndicator count={unreadCount ?? 0} />
```

**Accessibility requirements:**
- When count > 0: `aria-label` on parent bell: `"Notifications, {count} unread"`
- When count === 0: `aria-label="Notifications"`
- Do not use `aria-hidden` on the dot — the count is meaningful

**Current implementation (broken):**
```tsx
// DashboardLayout.tsx line 350 — unconditional dot
<div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
```

**Migration priority:** Sprint 1 (P0)

---

### D-06 — Timeline
**Path:** `components/ui/Timeline.tsx`  
**Theme:** Dark

**Purpose:** Multi-stage progress display. Used on vendor onboarding pending state (5 stages) and potentially vendor verification level progress.

**Variants:**
- `vertical` (default): Stages stacked vertically with connecting line
- `horizontal` (future): Stages in a row for milestone displays

**Props:**
```ts
interface TimelineProps {
  stages: {
    id: string;
    label: string;
    description?: string;
    status: 'completed' | 'active' | 'pending';
  }[];
}
```

**States per stage:**
- `completed`: Filled circle (green CheckCircle), solid connecting line
- `active`: Pulsing circle (brand color), current context label
- `pending`: Empty circle (muted), dashed connecting line

**Accessibility requirements:** `role="list"` on stage container. Each stage: `role="listitem"`. Active stage: `aria-current="step"`.

**Current implementation:** Inline in `app/vendor/onboarding/page.tsx` — extract

**Migration priority:** Sprint 3

---

### D-07 — TrustSignalIcon
**Resolves:** DD-005 (three competing trust iconography patterns)  
**Path:** `components/ui/TrustSignalIcon.tsx`  
**Theme:** Both

**Purpose:** Single canonical component for rendering trust signals (verified, confirmed, approved, secure). Replaces all uses of `CheckCircle`, `CheckCircle2`, `&#x2605;`, and `Shield` for this semantic purpose.

**Variants:**
- `check` (default): `<CheckCircle />` — positive feature confirmed
- `shield`: `<Shield />` — security and protection context
- `badge`: `<BadgeCheck />` — platform-verified status
- `star`: `<Star />` — ratings only (not trust signals)

**Props:**
```ts
interface TrustSignalIconProps {
  variant?: 'check' | 'shield' | 'badge' | 'star';
  size?: number;
  className?: string;
}
```

**Import standardisation:** All files must import `CheckCircle` (not `CheckCircle2`) from `lucide-react`. `CheckCircle2` import to be purged.

**Contexts where this applies:**
- Subscription feature comparison (after P0.1 fix — already CheckCircle)
- Founding vendor benefits list (CheckCircle2 → CheckCircle)
- Login trust pills (★ HTML entity → TrustSignalIcon variant="check")
- Vendor verification status

**Migration priority:** Sprint 2

---

## PART 5 — FORM CONTROLS

---

### FC-01 — Button
**Resolves:** DD-012 (button class fragmentation)  
**Path:** `components/ui/Button.tsx`  
**Theme:** Both

**Purpose:** The single button component for all interactive actions across the platform. Replaces `btn-primary`, `btn-luxury`, `btn-luxury-dark`, `btn-secondary-light`, and any other `btn-*` classes.

**Variants:**

| Variant | Class/Style | Use case |
|---|---|---|
| `primary` | Brand gradient fill, white text | Primary CTA — "Begin Planning", "Save", "Submit" |
| `secondary` | Ghost outline, white/dark border | Secondary action — "Cancel", "Go Back" |
| `destructive` | Red fill | Delete, revoke, irreversible actions |
| `ghost` | No border, hover bg-white/5 | Sidebar items, nav items, quiet actions |
| `social` | White fill, border, dark text | OAuth buttons (Google, etc.) |

**Sizes:** `sm` | `md` (default) | `lg`

**States:** `default` | `hover` | `active` | `disabled` (opacity-50, cursor-not-allowed) | `loading` (spinner + label, disabled)

**Props:**
```ts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'social';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ElementType;
  iconPosition?: 'left' | 'right';
}
```

**Accessibility requirements:**
- Must never be `disabled` and invisible simultaneously
- Loading state: `aria-busy="true"` + spinner has `aria-hidden="true"` + button text remains for screen readers (use `sr-only` span if hiding visual label)
- Minimum touch target: 44×44px

**Responsive behaviour:** Full-width on mobile for primary CTAs (`w-full sm:w-auto`)

**CSS class resolution (existing → new):**
| Old class | New component |
|---|---|
| `btn-primary` | `<Button variant="primary">` |
| `btn-luxury` | `<Button variant="primary">` |
| `btn-luxury-dark` | `<Button variant="primary">` |
| `btn-secondary-light` | `<Button variant="secondary">` |
| `btn-social` | `<Button variant="social">` |

**Migration priority:** Sprint 3 (medium effort, high file coverage)

---

### FC-02 — Input
**Resolves:** DD-016 (form input style inconsistency)  
**Path:** `components/ui/Input.tsx`  
**Theme:** Both

**Purpose:** Single input component for text, email, password, and tel fields. Replaces both `input-light` CSS class and inline dark input styling.

**Variants:**
- `dark`: For authenticated forms and dark-background pages
- `light`: For public pages and auth page white panels

**CSS classes to define in globals.css:**
```css
.input-dark {
  @apply bg-white/8 border border-white/8 rounded-lg px-4 py-3 
         text-white placeholder-slate-500 focus:outline-none 
         focus:ring-1 focus:ring-brand-400 focus:border-brand-400 
         transition-colors w-full;
}
.input-light {
  /* Already defined — verify and document */
}
```

**States:** `default` | `focus` | `error` | `disabled` | `read-only`

**Props:**
```ts
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'dark' | 'light';
  error?: string;
  label?: string;
  hint?: string;
}
```

**Accessibility requirements:**
- Always have associated `<label>` or `aria-label`
- Error state: `aria-invalid="true"` + `aria-describedby` pointing to error message element
- Password fields: `autocomplete="current-password"` or `"new-password"` as appropriate

**Migration priority:** Sprint 2

---

### FC-03 — FilterTabs
**Resolves:** DD-008 (non-interactive booking filter tabs)  
**Path:** `components/ui/FilterTabs.tsx`  
**Theme:** Dark

**Purpose:** A tab strip for filtering a list by status or category. Currently rendered as decorative `div` elements on the vendor bookings page — must become interactive.

**Variants:**
- `status` (default): Filter by booking/lead/review status with count badges
- `category`: Filter by category with optional icons

**Interaction model:** `searchParams`-based (server component pattern):
- Each tab is a `<Link href="?status=pending">` not a `div`
- Active tab derived from `searchParams.status` in the page
- No client-side JavaScript required
- URL is bookmarkable and shareable

**Props:**
```ts
interface FilterTabsProps {
  tabs: {
    value: string;
    label: string;
    count?: number;
    href: string;   // Full URL with query param pre-built by parent
  }[];
  activeValue: string;
}
```

**States (per tab):**
- `default`: `bg-white/6 border border-white/10 text-slate-400`
- `active`: `bg-brand-500/15 border-brand-500/30 text-brand-400`
- `hover`: `bg-white/8 text-slate-300`

**Accessibility requirements:**
- `role="tablist"` on container
- Each tab: `role="tab"` + `aria-selected={active}`
- Active tab: `aria-selected="true"`

**Responsive behaviour:** `flex-wrap` to handle many tabs on mobile. Scroll horizontally on overflow (preferred to wrapping for status tabs).

**Current (broken) implementation:**
```tsx
// app/vendor/bookings/page.tsx — decorative div tabs
<div className="flex-wrap gap-2">
  {STATUS_OPTIONS.map(s => (
    <div key={s} className="...rounded-full">
      <span>{s}</span>
      <span>{count}</span>
    </div>
  ))}
</div>
```

**Migration priority:** Sprint 1 (P0 fix)

---

### FC-04 — SearchInput
**Path:** `components/ui/SearchInput.tsx`  
**Theme:** Both

**Purpose:** A search input with magnifier icon, clear button, and optional debounce. Used in vendor browse/marketplace, admin vendor list, contacts CRM.

**Variants:**
- `inline` (default): Full-width within a form or filter bar
- `navbar` (future): Compact version in the top bar

**Props:**
```ts
interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  variant?: 'dark' | 'light';
}
```

**States:** `empty` | `focused` | `with-value` (shows clear button) | `loading` (spinner in place of magnifier)

**Migration priority:** Sprint 3

---

### FC-05 — Dropdown / Select
**Path:** `components/ui/Dropdown.tsx`  
**Theme:** Both

**Purpose:** A styled `<select>` replacement for dropdowns used across filter bars, form fields, and sorting controls.

**Variants:**
- `native` (default): Styled `<select>` — accessible, zero JS
- `custom` (future): Custom dropdown with animation — only when native cannot meet design requirements

**Props:**
```ts
interface DropdownProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: 'dark' | 'light';
}
```

**States:** `default` | `open` | `disabled`

**Accessibility requirements:** For native: inherits browser accessibility. For custom: `role="combobox"` + `aria-expanded` + `aria-controls` pointing to listbox.

**Migration priority:** Sprint 3

---

## PART 6 — FEEDBACK & STATUS

---

### FB-01 — Alert
**Path:** `components/ui/Alert.tsx`  
**Theme:** Both

**Purpose:** Contextual inline alert banners for informational messages, warnings, and errors. Not to be confused with modals or toasts.

**Variants:**
| Variant | Icon | Color | Use case |
|---|---|---|---|
| `info` | `Info` | Blue | Informational context, onboarding tips |
| `success` | `CheckCircle` | Green | Completed action confirmation (non-modal) |
| `warning` | `AlertTriangle` | Amber | Caution — incomplete profile, pending action |
| `error` | `AlertCircle` | Red | Error messages, validation failures |
| `brand` | `Shield` | Purple | Admin notices, constitutional alerts (e.g., founder note) |

**Props:**
```ts
interface AlertProps {
  variant: 'info' | 'success' | 'warning' | 'error' | 'brand';
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
}
```

**Current implementations (inconsistent):**
```
app/admin/team/page.tsx  → purple-50 bg-purple-50 border-purple-200 (light theme)
app/vendor/bookings/page.tsx → PendingVendorBanner component (custom)
Multiple pages → inline amber/red divs
```

**Migration priority:** Sprint 2 (unify PendingVendorBanner first — it appears on many vendor pages)

---

### FB-02 — LoadingState
**Resolves:** DD-014 (loading state inconsistency)  
**Path:** `components/ui/LoadingState.tsx`  
**Theme:** Dark

**Purpose:** Consistent page-level and section-level loading states. Replaces all custom spinner implementations.

**Variants:**
- `page` (default): Centered spinner + optional text, full section height
- `inline`: Small spinner for button/action context
- `skeleton-table`: Skeleton rows for table content
- `skeleton-card`: Skeleton card for card grid loading
- `skeleton-text`: Skeleton text lines for content loading

**Props:**
```ts
interface LoadingStateProps {
  variant?: 'page' | 'inline' | 'skeleton-table' | 'skeleton-card' | 'skeleton-text';
  message?: string;
  rows?: number;  // For skeleton variants
}
```

**The InlineSpinner sub-component:**
```tsx
// Used inside Button component for loading state
export function InlineSpinner({ size = 16 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin" aria-hidden="true" />;
}
```

**Accessibility requirements:**
- Page spinner: `role="status"` + `aria-label="Loading"` 
- Skeleton content: `aria-hidden="true"` (decorative, no content value)
- `aria-busy="true"` on the container being populated

**Current implementations:**
```
Login page Suspense → custom inline loader
Multiple forms → inline Loader2 with varying classes
Some Suspense fallbacks → plain text "Loading..."
```

**Migration priority:** Sprint 2

---

### FB-03 — EmptyState
**Resolves:** DD-015 (empty state inconsistency)  
**Path:** `components/ui/EmptyState.tsx`  
**Theme:** Dark

**Purpose:** Consistent empty states when lists, grids, or data sections have no content. Must always include a next action to drive user forward.

**Variants:**
- `default`: Icon + title + description + optional CTA button
- `search-empty`: "No results" with clear/reset search option
- `permission-denied`: Lock icon, "You don't have access to this"

**Props:**
```ts
interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  variant?: 'default' | 'search-empty' | 'permission-denied';
}
```

**Standard anatomy:**
```
[Icon — large, muted]
Title text
Description text
[Action Button — optional]
```

**Current implementations (inconsistent):**
```
app/vendor/bookings/page.tsx → minimal text only
Admin pages → varying patterns
Customer dashboard → no empty state for first-time users (gap — P2.10)
```

**Migration priority:** Sprint 2

---

### FB-04 — StatusPage
**Resolves:** DD-010 (payment page theme inconsistency), DD-031  
**Path:** `components/ui/StatusPage.tsx`  
**Theme:** Light (post-payment context)

**Purpose:** Full-page status display for transactional outcomes. Used by `/payment/success` and `/payment/cancel`. Establishes a consistent shell for both — fixing the theme inconsistency between the two pages.

**Variants:**
- `success`: CheckCircle icon (green), positive heading, summary, CTAs
- `cancel`: XCircle icon (amber, not red — cancellation is recoverable), neutral heading, recovery CTAs
- `error`: AlertCircle icon (red), error heading, support CTA

**Props:**
```ts
interface StatusPageProps {
  variant: 'success' | 'cancel' | 'error';
  title: string;
  description: string;
  summary?: React.ReactNode;  // Booking summary card, etc.
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}
```

**Shared anatomy (both variants):**
- Outer: White background + Navbar + Footer (consistency with the rest of the public experience)
- Content: `max-w-md mx-auto pt-16 pb-24 text-center`
- Icon: Large (48px), semantic color
- Title: `text-2xl font-bold text-gray-900`
- Description: `text-slate-600`
- CTAs: Primary `<Button variant="primary">` + optional secondary `<Button variant="secondary">`

**Payment cancel specific requirements (P0 fix):**
- Primary action: "Try Again" → routes to the specific booking page via `booking_id` query param
- Secondary action: "View All Bookings" → `/dashboard/bookings`
- Add reassurance: "Your booking request is still saved — no need to start again."

**Current implementations:**
```
app/payment/success/page.tsx → White bg, no Navbar/Footer, custom layout
app/payment/cancel/page.tsx  → Dark bg (inherited), no Navbar/Footer, minimal layout
```

Both must be rebuilt using this component.

**Migration priority:** Sprint 1 (P0 fix)

---

### FB-05 — Modal
**Path:** `components/ui/Modal.tsx`  
**Theme:** Dark

**Purpose:** Overlay dialog for confirmations, detail views, and multi-step forms. Must trap focus and restore focus on close.

**Variants:**
- `confirm` (default): Title + body + Cancel + Confirm buttons
- `alert` (non-dismissible): Title + body + single action (for critical notices)
- `form`: Title + form content + footer with actions
- `drawer-like` (future): Slides from bottom on mobile

**Props:**
```ts
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  variant?: 'confirm' | 'alert' | 'form';
  size?: 'sm' | 'md' | 'lg';
}
```

**States:** `closed` (unmounted) | `open` | `loading` (action in progress, buttons disabled)

**Accessibility requirements:**
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing to title
- Focus trap when open
- Escape key closes (except `alert` variant)
- Return focus to trigger element on close
- Backdrop click closes `confirm` and `form` variants

**Migration priority:** Sprint 3

---

### FB-06 — ConfirmationDialog
**Path:** `components/ui/ConfirmationDialog.tsx`  
**Theme:** Dark  
**Built on:** `Modal` (confirm variant)

**Purpose:** Standardised destructive confirmation. "Are you sure you want to delete X?" pattern.

**Props:**
```ts
interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;      // Default: "Confirm"
  confirmVariant?: 'destructive' | 'primary';
  loading?: boolean;
}
```

**Current state:** No shared component. Each destructive action implements its own inline confirmation.

**Migration priority:** Sprint 3

---

### FB-07 — Drawer
**Path:** `components/ui/Drawer.tsx`  
**Theme:** Dark

**Purpose:** Side panel for detail views, settings panels, and form sidebars that don't require a full page navigation.

**Variants:**
- `right` (default): Slides in from right, 480px wide on desktop
- `bottom` (mobile): Slides up from bottom on mobile screens

**States:** `closed` | `open` | `loading`

**Accessibility requirements:** Same as Modal — `role="dialog"`, focus trap, Escape key closes.

**Migration priority:** Sprint 3

---

### FB-08 — ToastNotification
**Path:** `components/ui/Toast.tsx`  
**Theme:** Dark

**Purpose:** Transient notification for action feedback. "Profile saved." "Role granted." Currently using `react-hot-toast` or a similar library — standardise the visual style.

**Variants:**
- `success`: Green border left, CheckCircle icon
- `error`: Red border left, AlertCircle icon
- `warning`: Amber border left, AlertTriangle icon
- `info`: Blue border left, Info icon

**Standard:** Keep using `react-hot-toast` but define a custom renderer using these variants so the toast visual matches the platform design system rather than the default toast styling.

**Migration priority:** Sprint 3

---

## PART 7 — DOMAIN COMPONENTS

---

### DC-01 — VendorCard
**Path:** `components/domain/VendorCard.tsx`  
**Theme:** Both (light context in marketplace, dark in vendor OS)

**Purpose:** The primary card representing a vendor in the marketplace browse view, similar vendor suggestions, and admin vendor lists.

**Variants:**
- `marketplace` (light bg context): Image, name, category, city, rating, price from, verified badge
- `admin-list` (dark context): Name, status badge, score, last active, action buttons
- `similar` (public profile page): Compact — image, name, category, city

**States:** `default` | `hover` | `loading` (skeleton) | `featured` (gold border)

**Accessibility requirements:** Entire card is a link (`<Link>` wrapper or `as-child`). Image has `alt` = vendor name + category. Rating: `aria-label="Rating: 4.8 out of 5"`.

**Migration priority:** Sprint 3

---

### DC-02 — BookingCard
**Path:** `components/domain/BookingCard.tsx`  
**Theme:** Dark

**Purpose:** A booking summary card used in vendor bookings list, customer bookings list, and admin bookings list.

**Variants:**
- `vendor-list`: Customer name, event date, package, status badge, actions
- `customer-list`: Vendor name, event date, package, status badge, payment status
- `admin-list`: Both parties, financial summary, status, dispute flag

**States:** `pending` | `confirmed` | `completed` | `cancelled` | `disputed`

**Accessibility requirements:** Status communicated via text + color (not color alone). Status badge: `aria-label="Status: Confirmed"`.

**Migration priority:** Sprint 3

---

### DC-03 — ReviewCard
**Path:** `components/domain/ReviewCard.tsx`  
**Theme:** Both

**Purpose:** A review display card used on vendor public profiles, admin review moderation, and vendor analytics.

**Variants:**
- `public`: Rating stars, author name (anonymised/initials), date, content, booking-verified badge
- `admin`: Full detail + moderation actions + reporter flag
- `compact`: Stars + date + excerpt only (for sidebar widgets)

**Accessibility requirements:** Star rating: `role="img"` + `aria-label="4 out of 5 stars"`.

**Migration priority:** Sprint 3

---

### DC-04 — MarketplaceSearchCard
**Path:** `components/domain/MarketplaceSearchCard.tsx`  
**Theme:** Light (marketplace is a public/light context)

**Purpose:** The search result card in the `/browse` marketplace. Distinct from `VendorCard` (marketplace variant) in that it shows more filter-relevant data (availability, distance, response time).

**States:** `default` | `hover` | `featured` (brand highlight) | `loading` (skeleton)

**Migration priority:** Sprint 3

---

### DC-05 — PendingVendorBanner
**Path:** `components/domain/PendingVendorBanner.tsx`  
**Theme:** Dark  
**Existing implementation:** Already extracted as a component — verify consistency with new Alert component

**Purpose:** An informational banner shown to vendors whose applications are still under review. Appears on most vendor OS pages while `vendor.status === 'pending'`.

**Standard:** Rebuild as a thin wrapper around `Alert` variant="info":
```tsx
export function PendingVendorBanner() {
  return (
    <Alert variant="info" title="Application Under Review">
      Your vendor application is being reviewed. You'll be notified within 2 working days.
      <Link href="/vendor/onboarding">Check status →</Link>
    </Alert>
  );
}
```

**Migration priority:** Sprint 2

---

## PART 8 — PUBLIC PAGE COMPONENTS

---

### PP-01 — PublicPageShell
**Path:** `components/layout/PublicPageShell.tsx`  
**Theme:** Light  
**Existing:** Implicit — `<Navbar /> + {children} + <Footer />` repeated on every public page

**Purpose:** The standard shell for all public marketing pages. Wraps Navbar + Footer around content. Makes the theme contract explicit.

**Props:**
```ts
interface PublicPageShellProps {
  children: React.ReactNode;
  navbarTheme?: 'dark' | 'light';  // defaults to 'dark'
}
```

**Pages that should use it:**
- `/` (homepage)
- `/browse`
- `/founding-vendors`
- `/about`
- `/how-it-works`
- `/concierge`
- `/vendors/[id]` (public profile)
- `/payment/success` (through StatusPage)
- `/payment/cancel` (through StatusPage)

**Migration priority:** Sprint 3

---

### PP-02 — MetadataWrapper (Concierge fix)
**Resolves:** DD-032  
**Path:** Pattern, not a component

**Purpose:** Server component wrapper for client-heavy pages to preserve server-side metadata generation.

**Pattern:**
```tsx
// app/concierge/page.tsx
export const metadata: Metadata = { title: "...", description: "..." };
export default function ConciergePage() {
  return <ConciergeForm />;   // ConciergeForm is "use client"
}
```

**Apply to:** `/concierge` (confirmed gap). Audit all other `"use client"` page files for the same issue.

**Migration priority:** Sprint 2

---

## PART 9 — COMPONENT IMPLEMENTATION STANDARDS

These rules apply to every component in the library.

### Implementation rules

1. **Props over className spread.** Components accept structured props for variants, not arbitrary className overrides. Escape hatch: `className?: string` allowed for layout-level overrides (margin, position) but not for visual variant changes.

2. **Dark/light contract.** Each component declares its theme support. A component declared as `dark` must never use `text-gray-900` or `bg-white` internally. A component declared as `both` must have explicit `dark` and `light` branches.

3. **No inline style attributes** with color values. All colors via Tailwind class or CSS variable.

4. **No hardcoded icon choices outside TrustSignalIcon.** Domain components that need icons accept `icon?: React.ElementType` prop.

5. **Accessibility first.** Every interactive component has ARIA roles, keyboard navigation, and focus management specified before implementation begins.

6. **Server-compatible by default.** Components are React Server Components unless they explicitly need client interactivity (`useState`, `useEffect`, event handlers). Use `"use client"` directive sparingly — only on the leaf components that need it.

7. **`cn()` for conditional classes.** Use the existing `cn()` utility (from `@/lib/utils`) for all conditional class composition. No string concatenation.

8. **Single import source.** All components exported from `@/components/ui/index.ts` (barrel file). Domain components from `@/components/domain/index.ts`. No direct deep-path imports in page files.

---

*This component library becomes the implementation contract for Phase 70E.2 and 70E.3.*  
*No component should be built without a corresponding entry here.*  
*Extend this document as new components are identified during implementation.*
