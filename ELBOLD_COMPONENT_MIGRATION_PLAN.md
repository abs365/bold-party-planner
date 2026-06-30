# ELBOLD — COMPONENT MIGRATION PLAN
## Phase 70E.2A | Design Debt → Component Replacements
**Date:** 2026-06-30  
**Status:** Plan only — no implementation  
**Input:** ELBOLD_DESIGN_DEBT_REGISTER.md (32 items), ELBOLD_ENTERPRISE_COMPONENT_LIBRARY.md (30 components)  
**Principle:** Fix design debt by building reusable components, not by patching pages individually.

---

## MIGRATION PHILOSOPHY

Every design debt item represents a place where the same UI decision was made differently. The wrong fix is to patch each page in isolation. The right fix is to build the canonical component once and then migrate all usages to it.

**Migration sequence:**
1. Build the component (to spec in Component Library)
2. Replace the worst-offending instance first (validates the component in production context)
3. Migrate remaining instances in batches
4. Delete all replaced inline implementations
5. Enforce via lint rule or TypeScript (no old patterns remain)

**Do not ship partial migrations.** If a component is built but not all pages are migrated, the debt re-emerges. Each sprint below should be completed end-to-end before Phase 70E.3 begins.

---

## SPRINT 1 — P0 BLOCKERS
**Objective:** Fix the four commercial blockers that are directly reducing revenue and trust.  
**Scope:** Build 4 components, migrate 5 files, zero new dependencies.  
**Target:** Complete before any P1 work begins.

---

### Sprint 1.1 — FilterTabs (Interactive Booking Filter)
**Design Debt:** DD-008  
**Component:** FC-03 FilterTabs  
**Priority:** P0

**What's broken:**
Vendor bookings page status filter pills are decorative `div` elements. Vendors cannot filter their booking pipeline by status. Core workflow failure.

**Migration:**

**Step 1 — Build `components/ui/FilterTabs.tsx`**
- `searchParams`-based — each tab is a `<Link href="?status={value}">` 
- Active state from `activeValue` prop (derived from `searchParams.status`)
- Renders `role="tablist"` container, `role="tab"` links with `aria-selected`
- No client JavaScript required

**Step 2 — Migrate `app/vendor/bookings/page.tsx`**
- Replace `div` filter pills with `<FilterTabs>` component
- Update page to accept `searchParams: { status?: string }` prop
- Filter booking list server-side: `allBookings.filter(b => !status || b.status === status)`
- Build tab config from STATUS_OPTIONS with counts

**Step 3 — Verify `app/vendor/quotes/page.tsx`**
- Leads page may have the same pattern — check and migrate if present

**Files to migrate:**
```
components/ui/FilterTabs.tsx          CREATE
app/vendor/bookings/page.tsx          MODIFY (tabs + filter logic)
app/vendor/quotes/page.tsx            VERIFY + MODIFY if needed
```

**Validation:** Navigate to `/vendor/bookings?status=pending` — only pending bookings shown. Click each tab — URL updates and list filters correctly. No JavaScript required for filter to function.

**Effort:** M (2-3 hours)

---

### Sprint 1.2 — NotificationIndicator (Conditional Dot)
**Design Debt:** DD-009  
**Component:** D-05 NotificationIndicator  
**Priority:** P0

**What's broken:**
Notification bell in DashboardLayout top bar always shows gold dot. No condition. Trains every user to ignore notifications — real ones included.

**Migration:**

**Step 1 — Build `components/ui/NotificationIndicator.tsx`**
- Props: `count: number`
- Returns `null` when `count === 0`
- Returns dot div when `count > 0`
- Exports `InlineSpinner` sub-component for button loading states

**Step 2 — Modify `components/layout/DashboardLayout.tsx`**
- Add `unreadCount?: number` to `DashboardLayoutProps`
- Replace hardcoded dot div with `<NotificationIndicator count={unreadCount ?? 0} />`
- Update bell `aria-label` to include count when > 0

**Step 3 — Wire `unreadCount` into each page that uses DashboardLayout**
- Short-term: pass `unreadCount={0}` (no dot shown, no false urgency) until notification data is plumbed
- Each page already fetches its own data — add a parallel notification count query to pages that warrant it (vendor dashboard, customer dashboard)
- Example for vendor dashboard: `const { count: unreadCount } = await db.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).eq("read", false)`

**Files to modify:**
```
components/ui/NotificationIndicator.tsx    CREATE
components/layout/DashboardLayout.tsx      MODIFY (unreadCount prop, replace dot)
app/vendor/dashboard/page.tsx             MODIFY (pass unreadCount)
app/dashboard/page.tsx                    MODIFY (pass unreadCount)
```

**Validation:** Load any authenticated page. No gold dot on bell. Load vendor dashboard where messages are unread. Gold dot appears. Count matches actual unread messages.

**Effort:** M (2-3 hours)

---

### Sprint 1.3 — StatusPage (Payment Page Fix)
**Design Debt:** DD-010, DD-031  
**Component:** FB-04 StatusPage  
**Priority:** P0

**What's broken:**
- `/payment/cancel`: No Navbar, no Footer, dark body bg inherited, "Try Again" goes to full bookings list not specific booking
- `/payment/success`: No Navbar, no Footer, white bg (inconsistent)
- Two pages in the same flow have incompatible visual themes

**Migration:**

**Step 1 — Build `components/ui/StatusPage.tsx`**
- White background (`bg-white`) for both variants — post-payment is public context
- Includes minimal header: Elbold wordmark only (not full DashboardLayout)
- Success variant: green CheckCircle2, "Payment Successful" heading, booking summary slot, CTAs
- Cancel variant: amber XCircle, "Payment Cancelled" heading, reassurance text, specific booking CTA

**Step 2 — Rewrite `app/payment/success/page.tsx`**
- Wrap existing content in `<StatusPage variant="success">`
- Keep Suspense boundary for booking summary

**Step 3 — Rewrite `app/payment/cancel/page.tsx`**
- Read `booking_id` from search params (same pattern as success page)
- CTA "Try Again" → `/dashboard/bookings/{booking_id}` (not `/dashboard/bookings`)
- If no `booking_id`: "Try Again" → `/dashboard/bookings`
- Wrap in `<StatusPage variant="cancel">`

**Files to modify:**
```
components/ui/StatusPage.tsx              CREATE
app/payment/success/page.tsx             MODIFY (wrap in StatusPage)
app/payment/cancel/page.tsx              MODIFY (wrap in StatusPage + fix CTA)
```

**Validation:** Complete a Stripe test checkout. Success page: white bg, ELBOLD wordmark, booking summary. Cancel payment. Cancel page: same white bg, same wordmark, "Try Again" routes to the specific booking (not the list).

**Effort:** M (2-4 hours)

---

### Sprint 1.4 — StatGrid (Homepage Grid Gap)
**Design Debt:** DD-028  
**Component:** L-02 StatGrid  
**Priority:** P0

**What's broken:**
Homepage stats section uses a 4-column grid but only renders 3 stats when vendor count < 30. Visual gap on the homepage.

**Migration:**

**Step 1 — Build `components/ui/StatGrid.tsx`**
- Accepts `stats: StatItem[]`
- Dynamically sets `grid-cols-n` based on `stats.length` (2→2-col, 3→3-col, 4→2-col or 4-col)
- Never renders an incomplete grid

**Step 2 — Migrate `app/page.tsx` stats section**
- Replace hardcoded 4-col grid with `<StatGrid stats={activeStats} />`
- `activeStats` is already conditionally built (vendorCount >= 30 check) — this logic stays in the page
- StatGrid receives the already-filtered array and auto-sizes the grid

**Files to modify:**
```
components/ui/StatGrid.tsx     CREATE
app/page.tsx                   MODIFY (replace inline stats grid)
```

**Validation:** With vendor count < 30: stats section shows 3-column grid, no visual gap. With vendor count ≥ 30: stats section shows 4-column grid with vendor count stat.

**Effort:** S (1-2 hours)

---

### Sprint 1 Completion Criteria
- [ ] Vendor bookings page filters correctly via URL params
- [ ] No notification dot on bell for zero-unread state
- [ ] Payment success and cancel pages share same visual theme (white, with wordmark)
- [ ] Payment cancel "Try Again" routes to specific booking
- [ ] Homepage stat grid never shows an asymmetric layout
- [ ] All Sprint 1 DD items marked as resolved in ELBOLD_DESIGN_DEBT_REGISTER.md

**Sprint 1 DD items resolved:** DD-008, DD-009, DD-010, DD-028, DD-031 (partial)

---

## SPRINT 2 — P1 ENTERPRISE CONSISTENCY
**Objective:** Standardise the most visible inconsistencies across the platform. Every page should look and feel like it belongs to the same product.  
**Scope:** Build 10 components, migrate ~20+ file instances.  
**Target:** Complete before Phase 70E.3 begins.

---

### Sprint 2.1 — Color Token Implementation
**Design Debt:** DD-001, DD-002, DD-003  
**Component:** F-01 Color Tokens  

**Migration:**

**Step 1 — Extend `app/globals.css`**
- Add all tokens from Component Library F-01 spec
- Add Tailwind `colors` extension in `tailwind.config.ts` for `brand`, `gold`, `bg` keys

**Step 2 — Replace inline hex values in `DashboardLayout.tsx`**
- `bg-[#0a0a0f]` → `bg-bg-base` (or keep as-is if Tailwind config adds this key)
- `bg-[#0d0d18]` → `bg-bg-surface`
- `style={{ color: "rgba(255,255,255,0.92)" }}` → `className="text-white/90"` (DD-029)
- `bg-[#D4AF37]` → `bg-gold-400` (notification dot — already moved to NotificationIndicator)

**Step 3 — Replace inline hex values in auth pages**
- `style={{ background: "#0D1B3E" }}` → `bg-bg-brand` or `bg-[var(--color-bg-brand)]`

**Step 4 — Purge `#C9A84C` alternate gold** (if found on audit)
- Replace all occurrences with `var(--color-gold-400)` / `bg-gold-400`

**Files to modify:**
```
app/globals.css                    MODIFY (add tokens)
tailwind.config.ts                 MODIFY (add color extensions)
components/layout/DashboardLayout.tsx   MODIFY (inline styles → tokens)
app/(auth)/login/page.tsx          MODIFY (inline bg style → token)
app/(auth)/signup/page.tsx         MODIFY (inline bg style → token)
```

**Effort:** M (3-4 hours)

---

### Sprint 2.2 — Emoji Removal & Language Cleanup
**Design Debt:** DD-004  
**No new component required**  

**Migration:**

**`app/dashboard/page.tsx`**
- Remove `👋` from welcome heading
- Replace: `Welcome back, {name} 👋` → `Welcome back, {name}`

**Audit entire codebase for other emoji usage:**
```bash
grep -r "👋\|🎉\|✨\|🚀\|💪\|🎯" app/ components/ --include="*.tsx" --include="*.ts"
```
Remove any found — enterprise platform language policy (Phase 4A.0, Constitution Section 4).

**Files to modify:**
```
app/dashboard/page.tsx    MODIFY (remove emoji)
[others found by grep]    MODIFY
```

**Effort:** S (30 minutes)

---

### Sprint 2.3 — TrustSignalIcon (Icon Standardisation)
**Design Debt:** DD-005  
**Component:** D-07 TrustSignalIcon  

**Migration:**

**Step 1 — Build `components/ui/TrustSignalIcon.tsx`**
- Wraps lucide icons: CheckCircle (default), Shield, BadgeCheck, Star
- Exports as the canonical trust signal component

**Step 2 — Audit and replace all `CheckCircle2` imports**
```bash
grep -r "CheckCircle2" app/ components/ --include="*.tsx"
```
Replace each `CheckCircle2` import with `CheckCircle` and verify visual output unchanged.

**Step 3 — Replace login page `&#x2605;` star entities**
- `app/(auth)/login/page.tsx` trust pills: replace HTML entity star with `<TrustSignalIcon variant="check" />`

**Step 4 — Replace any remaining `<Star />` used as trust signals** (not ratings)
- Check founding-vendors page BENEFITS array rendering

**Files to modify:**
```
components/ui/TrustSignalIcon.tsx         CREATE
app/(auth)/login/page.tsx                 MODIFY (★ → TrustSignalIcon)
app/founding-vendors/page.tsx             MODIFY (CheckCircle2 → CheckCircle)
app/dashboard/page.tsx                    MODIFY (CheckCircle2 → CheckCircle)
[others found by grep]                    MODIFY
```

**Effort:** M (2-3 hours)

---

### Sprint 2.4 — Input Standardisation
**Design Debt:** DD-016  
**Component:** FC-02 Input  

**Migration:**

**Step 1 — Add `input-dark` to `app/globals.css`**
```css
.input-dark {
  @apply bg-white/8 border border-white/8 rounded-lg px-4 py-3 
         text-white placeholder-slate-500 focus:outline-none 
         focus:ring-1 focus:ring-brand-400/50 focus:border-brand-400/50 
         transition-colors w-full;
}
```

**Step 2 — Audit all inline dark input styles**
```bash
grep -r "bg-white/8 border border-white/8" app/ components/ --include="*.tsx"
grep -r "placeholder-slate-500" app/ components/ --include="*.tsx"
```
Replace all inline patterns with `className="input-dark"`.

**Step 3 — Build `components/ui/Input.tsx`** (optional but preferred)
- Wraps `<input>` with label, error state, hint text
- Defaults to correct `input-dark` or `input-light` class based on `variant` prop

**Files to modify:**
```
app/globals.css              MODIFY (add input-dark)
components/ui/Input.tsx      CREATE (optional)
[forms found by grep]        MODIFY (inline → input-dark class)
```

**Effort:** M (2-3 hours)

---

### Sprint 2.5 — Vendor Sidebar: Groups and Label Fix
**Design Debt:** DD-019 (16 items no groups), DD-006 (label inconsistency), DD-007 (Inspiration Feed link)  
**Component:** N-01 DashboardShell (vendor variant), N-02 SidebarNavGroup  

**Migration:**

**Step 1 — Restructure `VENDOR_NAV` in `DashboardLayout.tsx`**

Current: Flat array of 16 `NavItem[]`

Replace with `VENDOR_NAV_GROUPS: NavGroup[]`:
```ts
const VENDOR_NAV_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { href: "/vendor/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
      { href: "/vendor/bookings",   label: "Bookings",   icon: ShoppingBag },
      { href: "/vendor/quotes",     label: "Leads",      icon: Inbox },
      { href: "/vendor/messages",   label: "Messages",   icon: MessageSquare },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/vendor/customers",  label: "Customers",  icon: Users },
      { href: "/vendor/contacts",   label: "Contacts",   icon: BookUser },
    ],
  },
  {
    label: "Profile",
    items: [
      { href: "/vendor/profile",       label: "My Profile", icon: User },
      { href: "/vendor/services",      label: "Services",   icon: Settings },
      { href: "/vendor/media",         label: "Media",      icon: FileText },
      { href: "/vendor/reviews",       label: "Reviews",    icon: Star },
      { href: "/vendor/availability",  label: "Availability", icon: CalendarCheck },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/vendor/analytics",     label: "Analytics",  icon: TrendingUp },
      { href: "/vendor/payouts",       label: "Payouts",    icon: Wallet },
      { href: "/vendor/subscription",  label: "Subscription", icon: BadgeCheck },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/vendor/verification",  label: "Verification", icon: Shield },
      { href: "/vendor/feedback",      label: "Feedback",     icon: ThumbsUp },
    ],
  },
];
```

**Step 2 — Update DashboardLayout vendor branch**
- `resolvedUser.role === "vendor"` → use `navGroups={VENDOR_NAV_GROUPS}` (same prop used by admin)
- Remove flat `VENDOR_NAV` array (replaced by groups)

**Step 3 — Remove Inspiration Feed from sidebar bottom**
- `DashboardLayout.tsx` sidebar bottom section — remove the "Inspiration Feed" → `/inspire` link
- Keep: Notifications, Sign Out

**Step 4 — Rename nav labels (DD-006)**
All renamed in the new VENDOR_NAV_GROUPS above:
- "Services & Packages" → "Services"
- "Photos & Videos" → "Media"
- "Revenue & Payouts" → "Payouts"
- "Share Feedback" → "Feedback"
- "Get Verified" → "Verification"

**Files to modify:**
```
components/layout/DashboardLayout.tsx    MODIFY (VENDOR_NAV → VENDOR_NAV_GROUPS, remove Inspiration Feed)
```

**Effort:** M (2-3 hours)

---

### Sprint 2.6 — MobileBottomNav Vendor Fix
**Design Debt:** DD-018 (Browse tab wrong destination)  
**Component:** N-03 MobileBottomNav  

**Migration:**

**`components/layout/MobileBottomNav.tsx`**

Replace vendor tabs:
```ts
// OLD
{ href: "/browse", label: "Browse", icon: Store }

// NEW  
{ href: "/vendor/contacts", label: "Contacts", icon: BookUser }
```

**Validation:** On mobile (< lg), vendor bottom nav shows: Dashboard / Bookings / Leads / Contacts / Analytics. No "Browse" tab. Tapping "Contacts" opens vendor CRM.

**Files to modify:**
```
components/layout/MobileBottomNav.tsx    MODIFY (replace Browse tab)
```

**Effort:** S (15 minutes)

---

### Sprint 2.7 — Badge Component
**Design Debt:** Supports DD-013, DD-020  
**Component:** D-04 Badge  

**Migration:**

**Step 1 — Build `components/ui/Badge.tsx`** per Component Library spec

**Step 2 — Migrate `app/admin/team/page.tsx` role colors**
```ts
// OLD (light theme)
const ROLE_COLOURS: Record<string, string> = {
  founder:      "bg-purple-100 text-purple-800",
  global_admin: "bg-blue-100 text-blue-800",
  ...
}

// NEW (dark theme via Badge component)
<Badge variant="founder">Founder Admin</Badge>
<Badge variant="global_admin">Global Admin</Badge>
```

**Step 3 — Migrate booking status pills**
Vendor bookings: replace inline status spans with `<Badge variant={statusVariant}>` 

**Step 4 — Migrate admin vendor list status indicators**
Any `approved` / `pending` / `rejected` status text → `<Badge variant="success|warning|error">`

**Files to modify:**
```
components/ui/Badge.tsx              CREATE
app/admin/team/page.tsx              MODIFY (ROLE_COLOURS → Badge)
app/vendor/bookings/page.tsx         MODIFY (status pills → Badge)
[others found by grep]               MODIFY
```

**Effort:** M (2-3 hours)

---

### Sprint 2.8 — Alert Component (including PendingVendorBanner)
**Design Debt:** Supports DD-020, consistency across vendor pages  
**Component:** FB-01 Alert  

**Migration:**

**Step 1 — Build `components/ui/Alert.tsx`** per Component Library spec

**Step 2 — Rebuild `components/domain/PendingVendorBanner.tsx`**
```tsx
// Thin wrapper around Alert
export function PendingVendorBanner() {
  return (
    <Alert variant="info" title="Application Under Review">
      Your vendor profile is being reviewed. Expect a decision within 2 working days.
      {" "}<Link href="/vendor/onboarding" className="underline">Track status →</Link>
    </Alert>
  );
}
```

**Step 3 — Migrate admin team page founder note**
```tsx
// OLD
<div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex gap-3">
  <AlertCircle className="h-5 w-5 text-purple-600" />
  ...
</div>

// NEW
<Alert variant="brand" title="Founder Admin access">
  ...
</Alert>
```

Note: Admin team page also needs dark card conversion (see Sprint 2.9).

**Files to modify:**
```
components/ui/Alert.tsx                    CREATE
components/domain/PendingVendorBanner.tsx  MODIFY (→ Alert wrapper)
app/admin/team/page.tsx                    MODIFY (inline alert → Alert component)
```

**Effort:** M (2-3 hours)

---

### Sprint 2.9 — Admin Team Page Dark Theme
**Design Debt:** DD-020  
**No new component required** (uses Card and Badge from 2.7/2.8)  

**Migration:**

**`app/admin/team/page.tsx`** — convert all light-theme elements to dark-theme:

| Old | New |
|---|---|
| `bg-white border border-gray-200 rounded-lg divide-y divide-gray-100` | `bg-white/4 border border-white/6 rounded-xl divide-y divide-white/6` |
| `text-gray-900` | `text-white` |
| `text-gray-500` | `text-slate-400` |
| `text-gray-400` | `text-slate-500` |
| `text-gray-700` | `text-slate-300` |
| `bg-purple-100 text-purple-800` (etc.) | `<Badge variant="founder">` etc. |
| `bg-purple-50 border-purple-200` | `<Alert variant="brand">` |

**Files to modify:**
```
app/admin/team/page.tsx    MODIFY (full dark theme conversion)
```

**Effort:** M (1-2 hours)

---

### Sprint 2.10 — EmptyState & LoadingState Components
**Design Debt:** DD-014, DD-015  
**Components:** FB-02 LoadingState, FB-03 EmptyState  

**Migration:**

**Step 1 — Build `components/ui/LoadingState.tsx`** including `InlineSpinner`

**Step 2 — Build `components/ui/EmptyState.tsx`**

**Step 3 — Migrate most critical empty state gaps:**
- `app/vendor/bookings/page.tsx`: Replace plain text empty state with `EmptyState`
- `app/dashboard/page.tsx`: Add `EmptyState` for first-time customers (zero events, zero bookings)
- Admin list pages: Add `EmptyState` with appropriate messages

**Step 4 — Migrate loading state patterns:**
- Login page Suspense fallback → `<LoadingState variant="page" />`
- Replace all custom spinner divs

**Files to modify:**
```
components/ui/LoadingState.tsx      CREATE
components/ui/EmptyState.tsx        CREATE
app/vendor/bookings/page.tsx        MODIFY (empty state)
app/dashboard/page.tsx              MODIFY (empty state for first-use)
app/(auth)/login/page.tsx           MODIFY (Suspense fallback)
[others found by grep]              MODIFY
```

**Effort:** M (2-4 hours)

---

### Sprint 2.11 — Footer Social Links & Concierge Metadata
**Design Debt:** DD-011, DD-025, DD-032  

**Migration A — Footer social icons:**
`components/layout/Footer.tsx` — social icon `div` elements:
- If no real social URLs exist yet: remove the social icons section entirely
- If social URLs are available: replace `div` elements with `<a href="..." target="_blank" rel="noopener noreferrer" aria-label="ELBOLD on Instagram">` etc.

**Migration B — Concierge server metadata:**
Convert `app/concierge/page.tsx` from `"use client"` page to server wrapper:
```tsx
// app/concierge/page.tsx (server component)
import { ConciergeForm } from "@/components/ConciergeForm";
export const metadata: Metadata = { title: "Planning Concierge — ELBOLD", description: "..." };
export default function ConciergePage() {
  return <ConciergeForm />;
}

// components/ConciergeForm.tsx (client component)
"use client";
// [all existing state/form logic moved here]
```

**Files to modify:**
```
components/layout/Footer.tsx      MODIFY (social icons)
app/concierge/page.tsx            MODIFY (server wrapper + export metadata)
components/ConciergeForm.tsx      CREATE (extract client logic)
```

**Effort:** S-M (2 hours total)

---

### Sprint 2 Completion Criteria
- [ ] No `bg-[#0a0a0f]` inline hex values in components (tokens only)
- [ ] No `#C9A84C` anywhere in codebase
- [ ] No emoji in any page heading or system text
- [ ] All `CheckCircle2` imports removed, replaced with `CheckCircle`
- [ ] All trust signal icons from Lucide (no HTML entities)
- [ ] Vendor sidebar has 5 named groups, 16 items visible, no Inspiration Feed
- [ ] Vendor mobile nav: Contacts tab replaces Browse tab
- [ ] Badge component used for all status, role, and category labels
- [ ] Alert component wraps all inline alert banners
- [ ] Admin team page uses dark theme cards and Badge for roles
- [ ] EmptyState component used for all empty list/grid scenarios
- [ ] No unconditional loading text "Loading..." in Suspense fallbacks
- [ ] Footer social icons: either real links or removed
- [ ] Concierge page has server-rendered metadata

**Sprint 2 DD items resolved:** DD-001 (partial), DD-002, DD-004, DD-005, DD-006, DD-007, DD-011, DD-014, DD-015, DD-016, DD-018, DD-019, DD-020, DD-025, DD-032

---

## SPRINT 3 — P2 SYSTEM IMPROVEMENTS
**Objective:** Elevate the platform from "consistent" to "polished". Build the remaining UI primitives and migrate higher-coverage patterns.  
**Scope:** 10 components, 30+ file migrations  
**Target:** After Sprint 2 — no timeline constraint

---

### Sprint 3.1 — Button System
**Design Debt:** DD-012  
**Component:** FC-01 Button  

**Migration:**

**Step 1 — Audit `app/globals.css` for all `btn-*` class definitions**
Document every class, its visual output, and where it's used in the codebase.

**Step 2 — Build `components/ui/Button.tsx`**
Accept `variant: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'social'`

**Step 3 — Map old classes to new component**
```
btn-primary      → <Button variant="primary">
btn-luxury       → <Button variant="primary">
btn-luxury-dark  → <Button variant="primary">
btn-secondary-light → <Button variant="secondary">
btn-social       → <Button variant="social">
```

**Step 4 — Remove old `btn-*` class definitions from `globals.css`** after all usages migrated

**Effort:** L (4-6 hours — many files)

---

### Sprint 3.2 — Card System
**Design Debt:** DD-013  
**Component:** D-01 Card  

**Migration:**

**Scope:** Replace all inline card `div` patterns across all authenticated pages.

**Grep targets:**
```bash
grep -r "bg-white/4 border border-white/6" app/ components/ --include="*.tsx"
grep -r "bg-white/4 border border-white/6 rounded-2xl" app/ components/ --include="*.tsx"
grep -r "rounded-2xl" app/ components/ --include="*.tsx"  # find wrong radius usages
```

**Migration:**
Replace each found `div` with `<Card variant="dark" padding="md">` (or equivalent).
Replace all `rounded-2xl` card instances with `rounded-xl` (the standard card radius).

**Effort:** L (4-6 hours — many files)

---

### Sprint 3.3 — PageHeader Component
**Design Debt:** Pattern standardisation across all pages  
**Component:** L-01 PageHeader  

**Migration:**

**Grep target:**
```bash
grep -r "text-2xl font-bold text-white" app/ --include="*.tsx"
```

For each `<h1 className="text-2xl font-bold text-white">` found:
- If it has a subtitle `<p className="text-slate-400 text-sm mt-1">`: replace with `<PageHeader title="..." subtitle="..." />`
- If it has action buttons: `<PageHeader title="..." action={<Button>...</Button>} />`

**Effort:** M (3-4 hours)

---

### Sprint 3.4 — Breadcrumb Enhancement
**Design Debt:** DD-021  
**Component:** N-01 DashboardShell (breadcrumb section)  

**Migration:**

In `DashboardLayout.tsx` top bar breadcrumb:
```tsx
// OLD
<div className="hidden lg:flex items-center gap-2 text-sm text-slate-500">
  <span>Portal</span>
  <ChevronRight size={13} />
  <span className="text-slate-300 capitalize">{resolvedUser.role}</span>
</div>

// NEW — add current page label
function useCurrentPageLabel(pathname: string, nav: NavItem[], navGroups?: NavGroup[]): string {
  const allItems = navGroups ? navGroups.flatMap(g => g.items) : nav;
  return allItems.find(item => item.href === pathname)?.label ?? "";
}

// In DashboardShell JSX:
const pageLabel = useCurrentPageLabel(pathname, nav, navGroups);
<div className="hidden lg:flex items-center gap-2 text-sm text-slate-500">
  <span>Portal</span>
  <ChevronRight size={13} />
  <span className="text-slate-300 capitalize">{resolvedUser.role}</span>
  {pageLabel && <>
    <ChevronRight size={13} />
    <span className="text-white">{pageLabel}</span>
  </>}
</div>
```

**Effort:** S (1 hour)

---

### Sprint 3.5 — ARIA Accessibility Fixes
**Design Debt:** DD-022, DD-023, DD-024  

**Migration A — Mobile menu ARIA (`DashboardLayout.tsx`):**
```tsx
<button
  aria-expanded={sidebarOpen}
  aria-controls="mobile-sidebar"
  aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
  ...
>
```
```tsx
<aside id="mobile-sidebar" ...>
```
Add focus trap: on open, move focus to first nav link inside sidebar. On close, return focus to hamburger button.

**Migration B — Mobile bottom nav `aria-current`:**
```tsx
// MobileBottomNav.tsx — each Link:
<Link
  aria-current={pathname === item.href ? "page" : undefined}
  ...
>
```

**Effort:** M (2-3 hours)

---

### Sprint 3.6 — Auth Pattern Unification
**Design Debt:** DD-017  

**Migration:**

Convert `app/(auth)/signup/page.tsx` from `fetch()` to Server Action pattern (matching login).

1. Create `lib/auth/signupAction.ts` — server action that handles signup
2. Update signup form to use `useActionState(signupAction, null)` 
3. Remove direct fetch to `/api/auth/signup` from the form
4. Verify `/api/auth/signup` route is still needed for external clients (if not, deprecate it)

**Effort:** L (3-5 hours — auth flows need careful testing)

---

### Sprint 3.7 — Unsplash Image Migration
**Design Debt:** DD-026  

**Migration:**

Move all Unsplash URLs to Supabase Storage or `/public` directory:

1. Download category images for `CATEGORY_DISCOVERY` array (browse page)
2. Download fallback images for `SIMILAR_VENDOR_FALLBACK` array (vendor profile)
3. Upload to Supabase Storage bucket `public-assets` or `/public/images/`
4. Replace Unsplash URLs with relative paths

**Effort:** M (2-3 hours including asset management)

---

### Sprint 3.8 — Subscription Data Architecture
**Design Debt:** DD-027  

**Migration:**

Remove `FALLBACK_PLANS` from `VendorSubscriptionView.tsx`.

**Replace with:** Skeleton loading state when DB returns no plan data:
```tsx
if (!plans || plans.length === 0) {
  return <LoadingState variant="skeleton-card" rows={4} />;
}
```

If a fallback is deemed necessary for resilience, move it to a server-side constant in `lib/subscriptions/plans.ts` and add a test that verifies fallback prices match DB values.

**Effort:** M (2-3 hours)

---

### Sprint 3.9 — DataTable and Modal Components
**Design Debt:** Pattern gaps in admin pages  
**Components:** D-03 DataTable, FB-05 Modal, FB-06 ConfirmationDialog  

**Priority within Sprint 3:** After the higher-priority items above. These are enablers for future feature development rather than fixes for existing debt.

**Migration:**
Build components per spec. Apply to first natural usage point (admin team page, booking cancellation flows). Do not migrate all usages upfront — adopt as pages are touched.

**Effort:** L (6-8 hours for both)

---

### Sprint 3.10 — Section Layout & HeroSection Standardisation
**Design Debt:** DD-003 (inline styles), pattern standardisation  
**Components:** L-03 SectionLayout, L-04 HeroSection  

**Migration:**
Replace per-page `max-w-*` + `px-*` + `py-*` combinations with `<SectionLayout variant="*">` wrapper. Apply HeroSection to all public pages with hero panels (About, How It Works, Founding Vendors).

**Effort:** M (3-4 hours)

---

### Sprint 3 Completion Criteria
- [ ] Button: All `btn-*` classes removed from codebase, `<Button>` component used everywhere
- [ ] Card: All inline card `div` patterns replaced, no `rounded-2xl` cards in authenticated UI
- [ ] PageHeader: All page h1 headings use `<PageHeader>` component
- [ ] Breadcrumb: Top bar shows current page label on all authenticated pages
- [ ] Mobile hamburger has `aria-expanded` and `aria-controls`
- [ ] MobileBottomNav links have `aria-current="page"` on active tab
- [ ] Mobile sidebar has focus trap when open
- [ ] Signup uses Server Action pattern (matching login)
- [ ] No Unsplash URLs in JSX files
- [ ] No `FALLBACK_PLANS` in VendorSubscriptionView
- [ ] DataTable component created and used on admin team page
- [ ] Modal and ConfirmationDialog components available

**Sprint 3 DD items resolved:** DD-003 (complete), DD-012, DD-013, DD-017, DD-021, DD-022, DD-023, DD-024, DD-026, DD-027

---

## UNAUDITED COMPONENTS — Phase 70E.2 Scope

These components were identified in the audit as primary vendor OS delegates that were not read during the experience audit. They must be audited and migrated to use the new component library during Phase 70E.2 implementation.

| Component | Used by | Risk | When to audit |
|---|---|---|---|
| `VendorProfileEditor` | `/vendor/profile` | HIGH — public-facing profile. May have inline styles, inconsistent patterns | Sprint 2 audit, Sprint 3 migration |
| `VendorServicesManager` | `/vendor/services` | HIGH — packages drive conversion, likely has inline card patterns | Sprint 2 audit |
| `VendorMediaManager` | `/vendor/media` | HIGH — image upload UX, likely has custom patterns | Sprint 2 audit |
| `VendorProfileView` | `/vendors/[id]` (public) | HIGH — customer-facing, conversion surface | Sprint 2 audit |
| `VendorMarketplace` | `/browse` | HIGH — browse/filter UX is primary acquisition surface | Sprint 2 audit |
| `VendorAnalyticsDashboard` | `/vendor/analytics` | MEDIUM | Sprint 3 audit |
| `SmartTipsWidget` | `/dashboard` | LOW | Sprint 3 |
| `SmartConcierge` | All customer pages | LOW | Sprint 3 |

---

## DD RESOLUTION TRACKING

Full mapping of all 32 Design Debt items to migration sprints:

| DD | Description | Sprint | Component |
|---|---|---|---|
| DD-001 | Five competing dark backgrounds | S2 | F-01 Color Tokens |
| DD-002 | Two competing gold values | S2 | F-01 Color Tokens |
| DD-003 | Inline color styles | S3 | F-01 Color Tokens + SectionLayout |
| DD-004 | Emoji in heading | S2 | None — direct fix |
| DD-005 | Trust signal icon inconsistency | S2 | D-07 TrustSignalIcon |
| DD-006 | Vendor sidebar label inconsistency | S2 | N-01 DashboardShell |
| DD-007 | Inspiration Feed in vendor sidebar | S2 | N-01 DashboardShell |
| DD-008 | Non-interactive booking filter tabs | **S1** | FC-03 FilterTabs |
| DD-009 | Hardcoded notification dot | **S1** | D-05 NotificationIndicator |
| DD-010 | Payment page theme inconsistency | **S1** | FB-04 StatusPage |
| DD-011 | Placeholder social links | S2 | None — direct fix |
| DD-012 | Button class fragmentation | S3 | FC-01 Button |
| DD-013 | Card border radius inconsistency | S3 | D-01 Card |
| DD-014 | Loading state inconsistency | S2 | FB-02 LoadingState |
| DD-015 | Empty state inconsistency | S2 | FB-03 EmptyState |
| DD-016 | Form input style inconsistency | S2 | FC-02 Input |
| DD-017 | Auth submission pattern split | S3 | Pattern |
| DD-018 | Vendor mobile nav Browse tab | S2 | N-03 MobileBottomNav |
| DD-019 | Vendor sidebar depth | S2 | N-01 DashboardShell |
| DD-020 | Admin team page light cards | S2 | D-01 Card + D-04 Badge |
| DD-021 | Breadcrumb no current page | S3 | N-01 DashboardShell |
| DD-022 | Mobile sidebar no focus trap | S3 | N-01 DashboardShell |
| DD-023 | Mobile menu ARIA gaps | S3 | N-01 DashboardShell |
| DD-024 | Mobile bottom nav aria-current | S3 | N-03 MobileBottomNav |
| DD-025 | Footer social accessibility | S2 | None — direct fix |
| DD-026 | Unsplash URLs hardcoded | S3 | Asset migration |
| DD-027 | Subscription fallback data | S3 | Pattern |
| DD-028 | Homepage grid gap | **S1** | L-02 StatGrid |
| DD-029 | Sidebar wordmark inline style | S2 | F-01 Color Tokens |
| DD-030 | Non-standard sidebar width | S2 | N-01 DashboardShell |
| DD-031 | Two incompatible visual themes | S1+S2 | FB-04 StatusPage + docs |
| DD-032 | Concierge no server metadata | S2 | PP-02 MetadataWrapper |

---

## TOTAL EFFORT ESTIMATE

| Sprint | Items | Effort | New Components |
|---|---|---|---|
| Sprint 1 (P0) | 5 DD items | 8-12 hours | 4 |
| Sprint 2 (P1) | 16 DD items | 24-32 hours | 9 |
| Sprint 3 (P2) | 11 DD items | 24-36 hours | 8 |
| **Total** | **32 DD items** | **56-80 hours** | **21** |

Sprint 1 can be completed in 2-3 focused sessions. It directly unblocks 4 commercial issues.  
Sprint 2 is a full phase of work (~1 week). End result: consistent enterprise visual language.  
Sprint 3 is the polish layer (~1 week). End result: a defensible design system.

---

## ENFORCEMENT STRATEGY

After each sprint, prevent regression with:

**Sprint 1 enforcement:**
- Add TypeScript test or lint rule: no `<div className="...rounded-full...">` rendering as a filter tab without an `href` or `onClick`
- PR checklist: "Does this page use FilterTabs for status filtering?"

**Sprint 2 enforcement:**
- ESLint rule: no direct emoji characters in `.tsx` files (`no-unicode-emoji` rule or custom)
- PR checklist: "Are new status labels using `<Badge>`?"
- PR checklist: "Are new empty states using `<EmptyState>`?"

**Sprint 3 enforcement:**
- PR checklist: "Are inline button classes using `<Button variant="">` instead of `btn-*`?"
- CSS purge: after Button migration, delete `btn-luxury`, `btn-luxury-dark` from `globals.css`

---

*This plan supersedes any page-by-page fix approach.*  
*Build the component once. Migrate all usages. Delete the debt.*  
*Track progress against the DD Resolution table above.*
