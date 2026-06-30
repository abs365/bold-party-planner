# ELBOLD — DESIGN DEBT REGISTER
## Phase 70E.1 | All Inconsistent and Duplicated Design Patterns
**Audit date:** 2026-06-30  
**Source:** Phase 70E.1 Enterprise Experience Audit  
**Scope:** Every inconsistent or duplicated design pattern found in codebase inspection  
**Usage:** This register is the input for Phase 70E.2 Design Resolution sprints

---

## HOW TO USE THIS REGISTER

Each entry has:
- **DD-NNN** — Debt ID. Reference in PRs and commit messages.
- **Pattern** — The inconsistency or duplication that exists
- **Occurrences** — Where it appears in the codebase
- **Standard** — What the correct single pattern should be
- **Effort** — S (< 1hr), M (1-4hr), L (4-8hr), XL (> 1 day)
- **Phase** — When to resolve: 70E.2 (now), 70E.3 (next sprint), 70F (backlog)

---

## CATEGORY 1 — COLOR TOKENS

### DD-001 — Five Competing Dark Background Colors
**Pattern:** Five distinct near-navy/near-black dark colors used across different surfaces, with no documented relationship between them.

| Color Value | Where Used |
|---|---|
| `#0a0a0f` | Main body bg, top bar bg, page content area (`DashboardLayout.tsx` line 302) |
| `#0d0d18` | Desktop sidebar bg, mobile sidebar bg (`DashboardLayout.tsx` lines 304, 312) |
| `#0D1B3E` | Auth page left panel, hero sections (inline `style={{ background: "#0D1B3E" }}`) |
| `#091529` | Footer background (not directly inspected but observed as distinct) |
| `#0B1F4D` | CSS variable `--color-brand-500` in `globals.css` |

**These are five different dark shades applied by feel, not by token.**

**Standard:** Define exactly three semantic dark tokens:
- `--color-bg-base`: Primary content area bg (currently `#0a0a0f`)
- `--color-bg-surface`: Elevated surface (sidebar, card) (currently `#0d0d18`)
- `--color-bg-brand`: Brand navy for hero panels (currently `#0D1B3E`, closest to `--color-brand-500`)
- Replace all hardcoded hex values in JSX with `bg-[var(--color-bg-base)]` etc.
- Audit `#091529` footer — likely should be `--color-bg-brand` or a new `--color-bg-deep` token.

**Effort:** M | **Phase:** 70E.2

---

### DD-002 — Two Competing Gold Color Values
**Pattern:** Gold accent color defined in CSS as `#D4AF37` but alternative shade `#C9A84C` appears in some components.

| Color Value | Where Used |
|---|---|
| `#D4AF37` | `--color-gold-400` CSS variable, DashboardLayout notification dot, Navbar active state |
| `bg-[#D4AF37]` | Notification dot inline Tailwind (`DashboardLayout.tsx` line 350) |
| `text-[#D4AF37]` | Various heading accents (public pages) |

**Standard:** `--color-gold-400: #D4AF37` is already defined in `globals.css` as the canonical gold. Purge all `#C9A84C` usages. Use `var(--color-gold-400)` or the Tailwind `text-gold-400` alias in all cases. Remove inline Tailwind arbitrary values (`bg-[#D4AF37]` → `bg-gold-400`).

**Effort:** S | **Phase:** 70E.2

---

### DD-003 — Inline Color Styles in JSX (Pervasive)
**Pattern:** Color values defined directly in JSX `style` attributes rather than through CSS variables or Tailwind classes. This creates maintenance overhead when design tokens change — every change requires a codebase grep rather than a single CSS variable update.

**Known occurrences:**
- `style={{ color: "rgba(255,255,255,0.92)" }}` — sidebar wordmark (`DashboardLayout.tsx` line 189)
- `style={{ background: "#0D1B3E" }}` — auth page left panel
- Various `style={{ color: "rgba(...)" }}` on hero text in public pages
- Various `style={{ background: "linear-gradient(...)" }}` on CTA buttons

**Standard:** All color values must reference either:
1. A Tailwind class (e.g., `text-white/90`, `bg-[#0D1B3E]` as a stop-gap)
2. A CSS variable (preferred): `style={{ color: "var(--color-text-primary)" }}`

Never use raw RGBA or hex strings in `style={}`. Convert in Phase 70E.2 as components are touched.

**Effort:** L | **Phase:** 70E.3 (convert as components are edited)

---

## CATEGORY 2 — TYPOGRAPHY & LANGUAGE

### DD-004 — Emoji in Server-Rendered Headings
**Pattern:** `👋` emoji in the customer dashboard welcome heading.

**Occurrence:** `app/dashboard/page.tsx` — `Welcome back, {name} 👋`

**Impact:**
1. Violates enterprise language policy (Phase 4A.0, ELBOLD Constitution Section 4)
2. `aria-label` not set on the heading — screen reader announces literal emoji description ("waving hand sign")
3. Inconsistent with vendor dashboard which uses clean text headings

**Standard:** Remove emoji. Replace with clean heading: `Welcome back, {name}` — consistent with vendor OS pattern.

**Effort:** S | **Phase:** 70E.2

---

### DD-005 — Trust Signal Iconography — Three Competing Patterns
**Pattern:** Trust signals (verified, secure, approved, confirmed) use three different visual representations across the platform.

| Pattern | Where Used |
|---|---|
| `<CheckCircle>` (lucide-react) | `VendorSubscriptionView.tsx` (post P0.1 fix), `founding-vendors/page.tsx` |
| `<CheckCircle2>` (lucide-react) | `dashboard/page.tsx`, various customer pages |
| `&#x2605;` (HTML star entity) | `login/page.tsx` left panel trust pills |
| `<Shield>` (lucide-react) | Verification badges, security trust signals |
| `<BadgeCheck>` (lucide-react) | Admin nav items for verification |

**Note:** `CheckCircle` and `CheckCircle2` are different Lucide icons (different SVG paths). Using both creates visual inconsistency even if the semantic intent is the same.

**Standard:**
- Positive feature/benefit confirmed: `<CheckCircle size={16} className="text-green-400" />` — consistent, single import
- Security/verification badge: `<Shield size={16} />` — appropriate for security context
- Star ratings only: actual star icon (`<Star />`)
- HTML character entities (`&#x2605;`): **never** — replace with Lucide component
- Remove all `CheckCircle2` imports — standardise on `CheckCircle`

**Effort:** M | **Phase:** 70E.2

---

### DD-006 — Vendor Sidebar Navigation Label Inconsistency
**Pattern:** Vendor sidebar uses a mix of noun labels (page names) and action labels (imperative verbs). All labels should follow the same grammatical pattern.

| Type | Labels |
|---|---|
| Nouns (correct) | Dashboard, Bookings, Leads, Customers, Contacts, Messages, Reviews, Analytics, Subscription |
| Verb phrases (inconsistent) | "Services & Packages", "Photos & Videos", "Revenue & Payouts", "Share Feedback", **"Get Verified"** |

**Standard:** All sidebar labels should be nouns — the page title communicates the action:
- "Services & Packages" → "Services"
- "Photos & Videos" → "Media"
- "Revenue & Payouts" → "Payouts"
- "Share Feedback" → "Feedback"
- "Get Verified" → "Verification"

This aligns vendor sidebar convention with admin sidebar convention (all admin items are nouns).

**Effort:** S | **Phase:** 70E.2

---

### DD-007 — Vendor Sidebar Bottom: Customer-Facing Link
**Pattern:** Vendor sidebar bottom section (below main nav) includes "Inspiration Feed" → `/inspire`. This is a customer-facing discovery feature that has no relevance to a vendor's operating workflow.

**Occurrence:** `DashboardLayout.tsx` line 241-248

**Impact:** Vendor clicks "Inspiration Feed" and arrives at a customer-oriented content page. Context violation. Undermines the vendor's sense of operating within a professional business platform.

**Standard:** Remove "Inspiration Feed" from vendor bottom nav. Replace if needed with a link to Help Centre or "Refer a Vendor" (when that feature exists). The bottom utilities section should be role-appropriate.

**Effort:** S | **Phase:** 70E.2

---

## CATEGORY 3 — COMPONENT PATTERNS

### DD-008 — Non-Interactive Filter Tabs (Booking Status)
**Pattern:** Status filter pills rendered as `div` elements with visual tab styling but no interaction capability. The pattern creates false affordance — the UI looks filterable but is not.

**Occurrence:** `app/vendor/bookings/page.tsx` — status pills in the header area

**Code:**
```tsx
<div key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/6 border border-white/10">
  <span className="capitalize">{s}</span>
  <span className="badge bg-white/10 text-slate-300 text-xs">{count}</span>
</div>
```

**Standard:** Convert to interactive filter. Options:
1. `searchParams`-based filtering (server-rendered, no client JS) — convert divs to `Link` with `?status=pending` etc.
2. Client-side state filter in a `"use client"` component — `useState` for active status, `filter()` on booking list.

Option 1 is preferred for consistency with the server component architecture pattern in this codebase.

**Effort:** M | **Phase:** 70E.2 (P0 fix)

---

### DD-009 — Hardcoded Notification Indicator (Always Visible)
**Pattern:** Notification bell in `DashboardLayout` top bar always renders a gold dot regardless of actual notification count.

**Occurrence:** `DashboardLayout.tsx` line 348-352

**Code:**
```tsx
<Link href="/dashboard/notifications" className="relative p-2 rounded-lg hover:bg-white/5">
  <Bell size={17} className="text-slate-400" />
  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
</Link>
```

The dot `<div>` has no condition. It renders unconditionally for every user on every page.

**Standard:** The dot must be conditional. `DashboardLayout` already receives `user` prop. Add `unreadCount?: number` prop. Render dot only when `unreadCount > 0`. If passing unread count from server pages is too expensive, at minimum remove the unconditional dot until real notification data is plumbed through.

Short-term fix: `{unreadCount > 0 && <div className="absolute ..." />}` with `unreadCount` defaulting to 0.

**Effort:** M | **Phase:** 70E.2 (P0 fix)

---

### DD-010 — Payment Page Theme Inconsistency
**Pattern:** Two pages in the same payment flow use incompatible visual themes.

| Page | Background | Navbar/Footer | Result |
|---|---|---|---|
| `/payment/success` | `bg-white` | None | White, minimal, isolated |
| `/payment/cancel` | Inherited `#0a0a0f` dark body | None | Dark, unbranded, stranded |

**Standard:** Both post-payment pages should be consistent:
- Either both use the full site Navbar/Footer shell (preferred — brand continuity)
- Or both use the same minimal shell with the Elbold wordmark only
- Both should share the same background treatment

The cancel page specifically needs a guided recovery path. The "Try Again" CTA should route to the specific booking, not the full bookings list.

**Effort:** M | **Phase:** 70E.2 (P0 fix)

---

### DD-011 — Placeholder Social Media Links in Footer
**Pattern:** Footer renders three social media icons (Instagram, X/Twitter, Facebook) as non-interactive `div` elements with `aria-hidden="true"`.

**Occurrence:** `components/layout/Footer.tsx`

**Impact:**
1. Keyboard users: cannot navigate to social links (they don't exist as `<a>` elements)
2. Screen readers: `aria-hidden` hides them — invisible to assistive technology
3. Visual users: look like real links but are dead

**Standard:** Either:
1. Replace with real `<a href="..." target="_blank" rel="noopener noreferrer" aria-label="ELBOLD on Instagram">` when accounts exist
2. Remove entirely until accounts are established

No placeholder links. Dead UI elements that look interactive are an accessibility violation and a trust signal failure.

**Effort:** S | **Phase:** 70E.2

---

### DD-012 — Button Class Fragmentation
**Pattern:** Multiple button class names used across the platform with no consistent mapping.

**Observed class names:**
| Class | Where Seen | In CSS? |
|---|---|---|
| `btn-primary` | `DashboardLayout.tsx` ("Plan Event"), various pages | Defined in `globals.css` |
| `btn-luxury` | Various public pages | Appears in globals |
| `btn-luxury-dark` | Auth pages (login, signup submit buttons) | Requires verification |
| `btn-secondary-light` | Public pages | Requires verification |
| `btn-social` | Auth pages (OAuth buttons) | Requires verification |

**Standard:** Audit `globals.css` and document every `btn-*` class definition. Remove any that are duplicates of existing classes. Maximum 4 button variants:
- `btn-primary` — primary action (brand gradient)
- `btn-secondary` — secondary action (ghost/outline)
- `btn-destructive` — destructive action (red)
- `btn-social` — third-party auth (if distinct styling genuinely needed)

Remove `btn-luxury`, `btn-luxury-dark`, `btn-secondary-light` unless each genuinely serves a distinct visual need not covered by the above four.

**Effort:** M | **Phase:** 70E.3

---

### DD-013 — Card Border Radius Inconsistency
**Pattern:** Dashboard content cards use inconsistent border-radius values.

| Radius | Where Used |
|---|---|
| `rounded-xl` (12px) | Most vendor OS cards, `bg-white/4 border border-white/6 rounded-xl` |
| `rounded-2xl` (16px) | Some customer dashboard cards |
| `rounded-lg` (8px) | Admin page cards (`bg-white border border-gray-200 rounded-lg`) |
| `rounded-full` | Filter pills, avatar, notification dot |

**Standard:** One radius for each surface type:
- Content card: `rounded-xl`
- Input/form element: `rounded-lg`
- Badge/pill: `rounded-full`
- Modal/dialog: `rounded-2xl`

Purge `rounded-2xl` from content card usage. Admin cards should match the global card radius (they currently use white-background pattern which may be intentional for admin context — document this decision if kept).

**Effort:** M | **Phase:** 70E.3

---

### DD-014 — Loading State Inconsistency
**Pattern:** Multiple loading state patterns across the platform with no shared loading component.

| Pattern | Where Used |
|---|---|
| `<Loader2 className="animate-spin" />` | Most server action forms |
| `"Loading..."` text | Suspense fallbacks |
| `<div className="text-gray-300 flex items-center gap-2">` with spinner | Login Suspense boundary |
| Skeleton loaders | Not observed — absent |

**Standard:** Define one `<LoadingState />` component for page-level loading and one `<InlineSpinner />` for button/action loading. Use these exclusively. Remove custom inline loading states.

**Effort:** M | **Phase:** 70E.3

---

### DD-015 — Empty State Inconsistency
**Pattern:** Empty states across the platform follow different patterns with no shared component.

| Pattern | Where Used |
|---|---|
| Icon + heading + subtext + CTA | Some dashboard sections |
| Icon + subtext only | Others |
| Text only | Vendor bookings empty state |

**Standard:** One `<EmptyState icon={} title="" description="" cta={}>` component. All empty states must include: icon, title, subtext, and where appropriate a CTA that drives the next action.

**Effort:** M | **Phase:** 70E.3

---

### DD-016 — Form Input Style Inconsistency (Dark vs Light)
**Pattern:** Form inputs have two distinct visual treatments with no shared abstraction.

| Pattern | Where Used |
|---|---|
| `class="input-light"` | Auth pages (white background forms) |
| `className="bg-white/8 border border-white/8 rounded-lg px-4 py-3 text-white placeholder-slate-500"` | Dark form inputs (inline Tailwind, varies slightly) |

There is no `input-dark` CSS class — the dark variant is written inline on every usage, which means padding, border opacity, and border-radius are slightly different in each place it appears.

**Standard:** Add `input-dark` class to `globals.css` mirroring the `input-light` pattern. Replace all inline dark input styling with `input-dark`. This ensures consistent padding, radius, and border opacity across all authenticated form inputs.

**Effort:** S | **Phase:** 70E.2

---

### DD-017 — Auth Flow Submission Pattern Split
**Pattern:** Login and signup use different data submission patterns.

| Page | Pattern |
|---|---|
| `/login` | Server Action via `useActionState` → `loginAction` |
| `/signup` | Client-side `fetch()` to `/api/auth/signup` |

Both are valid Next.js patterns but their inconsistency means: different error handling approaches, different loading state management, different redirect behavior. When debugging or modifying auth flows, the developer must know which pattern each page uses.

**Standard:** Align both to Server Actions (`useActionState`). This removes the direct `/api/auth/signup` route dependency and unifies the auth submission pattern. If the signup route is kept for external API use, the page form should still use Server Actions.

**Effort:** L | **Phase:** 70E.3

---

## CATEGORY 4 — NAVIGATION PATTERNS

### DD-018 — Vendor Mobile Bottom Nav: Wrong Browse Destination
**Pattern:** Vendor mobile bottom nav "Browse" tab routes to `/browse` — the customer-facing marketplace.

**Occurrence:** `components/layout/MobileBottomNav.tsx` — vendor tab config

**Impact:** Vendor on mobile taps "Browse" and arrives on a customer discovery page. No vendor context. Likely navigated back immediately. Tab serves no vendor workflow purpose.

**Standard:** Options:
1. Replace "Browse" tab with "Contacts" or "Customers" — the two highest-retention features missing from vendor mobile nav
2. If browse is retained, route to a vendor-specific browse context (e.g., `/vendor/inspiration`) when that exists
3. Remove the tab entirely and replace with "More" → slide-out of remaining nav items

**Effort:** S | **Phase:** 70E.2

---

### DD-019 — Vendor Sidebar Depth (16 Items, No Grouping)
**Pattern:** Vendor sidebar has 16 flat nav items with no grouping or hierarchy. Customer sidebar has 10 items. Admin sidebar uses groups.

**Vendor sidebar items (in order):**
Dashboard, Bookings, Leads, Customers, Contacts, Messages, My Profile, Services & Packages, Photos & Videos, Reviews, Availability, Analytics, Revenue & Payouts, Subscription, Get Verified, Share Feedback

**Standard:** Apply the same grouped navigation pattern used in admin:
- **Operations:** Dashboard, Bookings, Leads, Messages
- **Customers:** Customers, Contacts
- **Profile:** My Profile, Services, Media, Reviews, Availability
- **Business:** Analytics, Payouts, Subscription
- **Account:** Verification, Feedback

This reduces visual overwhelm on onboarding without removing any functionality.

**Effort:** M | **Phase:** 70E.2

---

### DD-020 — Admin Team Page Uses Light Theme Cards
**Pattern:** Admin Team page (`/admin/team`) renders cards as `bg-white border border-gray-200` (light theme) within the otherwise fully dark DashboardLayout. Every other authenticated page uses dark card patterns.

**Occurrence:** `app/admin/team/page.tsx` lines 83-96, 129-148, 155-169

**Impact:** Visual whiplash — user is in a dark shell, the page content is white cards with `text-gray-900`. The admin page looks like it was designed for a different application.

**Standard:** Convert admin team page cards to match the dark card pattern used across all other authenticated pages: `bg-white/4 border border-white/6 rounded-xl` with `text-white` / `text-slate-400` text classes. Update ROLE_COLOURS to dark-compatible pill styles.

**Effort:** M | **Phase:** 70E.2

---

### DD-021 — Top Bar Breadcrumb: No Current Page Indicator
**Pattern:** `DashboardLayout` top bar shows `"Portal > [role]"` but provides no indication of the current page.

**Occurrence:** `DashboardLayout.tsx` line 335-339

**Impact:** For admin users navigating across 40+ pages in 6 nav groups, the breadcrumb gives no location context. For deep pages (e.g., `/admin/vendor-pipeline`), the user has no visual confirmation of where they are except the sidebar highlight (which may be off-screen on mobile).

**Standard:** Extend breadcrumb to include page name: `"Portal > Admin > Governance Log"` using `usePathname()` to derive the page name from the active nav item label. Apply to vendor and customer portals equally: `"Portal > Vendor > Analytics"`.

**Effort:** M | **Phase:** 70E.3

---

## CATEGORY 5 — ACCESSIBILITY DEBT

### DD-022 — Mobile Sidebar: No Focus Trap
**Pattern:** When the mobile sidebar overlay is open, focus can escape the sidebar into the backdrop and the main content behind it.

**Occurrence:** `DashboardLayout.tsx` — mobile sidebar implementation

**Standard:** Apply `focus-trap-react` or a manual `focusTrap` utility when `sidebarOpen === true`. Return focus to the menu toggle button when sidebar closes.

**Effort:** M | **Phase:** 70E.3

---

### DD-023 — Mobile Menu Toggle: Missing ARIA Attributes
**Pattern:** Mobile hamburger button has no `aria-expanded` or `aria-controls` attributes.

**Occurrence:** `DashboardLayout.tsx` line 328-333

```tsx
<button
  className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400"
  onClick={() => setSidebarOpen(true)}
>
```

**Standard:**
```tsx
<button
  aria-expanded={sidebarOpen}
  aria-controls="mobile-sidebar"
  aria-label="Open navigation menu"
  ...
>
```

And the sidebar element: `<aside id="mobile-sidebar" ...>`.

**Effort:** S | **Phase:** 70E.3

---

### DD-024 — Mobile Bottom Nav: No aria-current
**Pattern:** Active tab in `MobileBottomNav` is styled visually but `aria-current="page"` is not set on the active link.

**Occurrence:** `components/layout/MobileBottomNav.tsx` — nav link rendering

**Standard:** Add `aria-current={pathname === item.href ? "page" : undefined}` to each nav link.

**Effort:** S | **Phase:** 70E.3

---

### DD-025 — Footer Social Links: Accessibility Violation
**Pattern:** Documented in DD-011. Social icons have `aria-hidden="true"` but are visual affordances that look interactive. Separately registered here as an accessibility item.

**Occurrence:** `components/layout/Footer.tsx`

**Standard:** If icons are kept as placeholders: remove them entirely (do not render visually decorative elements that simulate links). If converted to real links: add `aria-label="ELBOLD on [Platform]"` and ensure `rel="noopener noreferrer"`.

**Effort:** S | **Phase:** 70E.2

---

## CATEGORY 6 — HARDCODED VALUES

### DD-026 — Hardcoded Image URLs (Unsplash)
**Pattern:** Multiple Unsplash image URLs hardcoded in JSX/TSX page files. These are external CDN dependencies embedded in the codebase.

**Occurrences:**
- `app/browse/page.tsx` — `CATEGORY_DISCOVERY` array (category images)
- `app/vendors/[id]/page.tsx` — `SIMILAR_VENDOR_FALLBACK` array

**Risk:** Unsplash CDN URL format could change. Hotlinking Unsplash images in production may violate their terms of service (requires API usage for production). Images are non-deterministic — the same URL may return different content over time.

**Standard:** Move all category and fallback images to Supabase Storage or Vercel's `/public` static asset folder. Reference via relative `/images/category-wedding.jpg` paths. This also enables CDN caching and removes the external dependency.

**Effort:** M | **Phase:** 70E.3

---

### DD-027 — Subscription Fallback Plan Data in Component
**Pattern:** `VendorSubscriptionView.tsx` contains a `FALLBACK_PLANS` object with hardcoded plan names, prices, and feature lists. This fallback renders when the Supabase query fails or returns no rows.

**Problem:** If subscription pricing is updated in the database, `FALLBACK_PLANS` will still display the old prices. The fallback silently serves stale data. Additionally the current fallback prices (Pro at £29/month) do not match the commercial strategy (Professional at £49/month).

**Standard:** Options:
1. Remove the fallback entirely — show a skeleton loader when the DB query returns nothing, and a retry button on error. Never render stale prices.
2. If a fallback is required for resilience, move `FALLBACK_PLANS` to a server-side constant that is at least not embedded in the UI component — and add a CI test that verifies fallback prices match the DB plan configuration.

**Effort:** M | **Phase:** 70E.3

---

### DD-028 — Homepage Vendor Count Gate (Threshold: 30)
**Pattern:** Homepage stat grid suppresses vendor count when `vendorCount < 30`. This threshold is hardcoded at 30 in the page file.

**Occurrence:** `app/page.tsx` line ~730 — `{vendorCount >= 30 && ...}`

**Problem:** When vendor count is 29 or fewer, the 4-column stat grid renders 3 stats. The grid was designed for 4 columns. The visual result is an asymmetric grid that looks incomplete.

**Standard:**
1. Fix the grid first: when 3 stats are shown, use `sm:grid-cols-3` not `sm:grid-cols-4`. The grid should never look visually incomplete.
2. Move the threshold to an environment variable `VENDOR_COUNT_DISPLAY_THRESHOLD=30` so it can be adjusted without a code change.

**Effort:** S | **Phase:** 70E.2

---

### DD-029 — Sidebar Wordmark Inline Style
**Pattern:** The "Elbold" wordmark in the sidebar uses inline `style={{ color: "rgba(255,255,255,0.92)" }}` instead of a Tailwind class.

**Occurrence:** `DashboardLayout.tsx` line 189

**Standard:** Replace with `className="text-white/90"` (Tailwind opacity modifier).

**Effort:** S | **Phase:** 70E.2

---

### DD-030 — Non-Standard Sidebar Width (`w-68`)
**Pattern:** Mobile sidebar overlay uses `w-68` which is not a standard Tailwind width. Standard values are `w-64` (16rem) and `w-72` (18rem). `w-68` requires a Tailwind config extension or will silently fall through to a non-scoped value.

**Occurrence:** `DashboardLayout.tsx` line 312 — `<aside className="relative w-68 h-full ...`

**Standard:** Replace with `w-64` (consistent with the desktop sidebar which is `w-60`/`w-[240px]`) or explicitly define `68: '17rem'` in `tailwind.config.ts` under `extend.width`. Check if `w-68` resolves correctly — if it does, it's likely already in the Tailwind config.

**Effort:** S | **Phase:** 70E.2

---

## CATEGORY 7 — THEME & ARCHITECTURE

### DD-031 — Two Incompatible Visual Themes (No Documented Contract)
**Pattern:** The platform operates two parallel visual themes with no documented specification for which applies where.

**Theme 1 — Dark Authenticated (Primary)**
- Body: `#0a0a0f`
- Sidebar: `#0d0d18`
- Text: `text-white`, `text-slate-400`
- Cards: `bg-white/4 border border-white/6`
- Used by: all vendor OS, customer dashboard, admin, DashboardLayout

**Theme 2 — Light Public (Secondary)**
- Body: `bg-white`
- Hero sections: dark navy overlay
- Text: `text-gray-900`, `text-slate-600`
- Cards: `bg-white border border-gray-200`
- Used by: homepage, browse, founding-vendors, about, how-it-works

**Mixed / Inconsistent:**
- `/login`: Split-panel (dark left + white right)
- `/signup`: Same split-panel
- `/payment/success`: White (uses Theme 2 in an authenticated flow)
- `/payment/cancel`: Dark (inherits body from Theme 1, but no explicit page class)

**Standard:** Document the theme contract in ELBOLD_DESIGN_SYSTEM.md (Phase 70E.2 deliverable):
- Public marketing pages: Theme 2 (light, brand-forward)
- Authenticated product pages: Theme 1 (dark, tool-forward)
- Auth pages (login/signup): Deliberate split-panel — intentional design state
- Post-payment pages: **both must use Theme 2** (customer is in a public, post-transaction context, not a product context)

**Effort:** M (documentation) + L (payment page fix) | **Phase:** 70E.2

---

### DD-032 — Concierge Page: No Server-Side Metadata
**Pattern:** `app/concierge/page.tsx` is a `"use client"` page with no `export const metadata` wrapper component, meaning the page has no server-rendered `<head>` metadata (title, description, OG tags).

**Occurrence:** `app/concierge/page.tsx` — file starts with `"use client"`

**Standard:** Convert to a server component wrapper:
```tsx
// app/concierge/page.tsx (server)
export const metadata = { title: "Concierge Planning Service — ELBOLD", ... }
export default function ConciergePage() {
  return <ConciergeForm />;
}
```
Move the form state logic to `ConciergeForm` (client component). The page wrapper stays as a server component for metadata and SEO.

**Effort:** S | **Phase:** 70E.2

---

## SUMMARY MATRIX

| ID | Debt | Effort | Phase | P-Level |
|---|---|---|---|---|
| DD-001 | Five competing dark background colors | M | 70E.2 | P1 |
| DD-002 | Two competing gold values | S | 70E.2 | P1 |
| DD-003 | Inline color styles in JSX | L | 70E.3 | P2 |
| DD-004 | Emoji in server-rendered heading | S | 70E.2 | P1 |
| DD-005 | Trust signal iconography (3 patterns) | M | 70E.2 | P1 |
| DD-006 | Vendor sidebar label inconsistency | S | 70E.2 | P1 |
| DD-007 | Vendor sidebar bottom: customer link | S | 70E.2 | P1 |
| DD-008 | Non-interactive booking filter tabs | M | 70E.2 | **P0** |
| DD-009 | Hardcoded notification dot | M | 70E.2 | **P0** |
| DD-010 | Payment page theme inconsistency | M | 70E.2 | **P0** |
| DD-011 | Placeholder social links in Footer | S | 70E.2 | P1 |
| DD-012 | Button class fragmentation | M | 70E.3 | P2 |
| DD-013 | Card border radius inconsistency | M | 70E.3 | P2 |
| DD-014 | Loading state inconsistency | M | 70E.3 | P2 |
| DD-015 | Empty state inconsistency | M | 70E.3 | P2 |
| DD-016 | Form input style inconsistency | S | 70E.2 | P1 |
| DD-017 | Auth submission pattern split | L | 70E.3 | P2 |
| DD-018 | Vendor mobile nav: wrong Browse destination | S | 70E.2 | P1 |
| DD-019 | Vendor sidebar depth (16 items, no groups) | M | 70E.2 | P1 |
| DD-020 | Admin team page: light theme cards | M | 70E.2 | P1 |
| DD-021 | Breadcrumb: no current page indicator | M | 70E.3 | P2 |
| DD-022 | Mobile sidebar: no focus trap | M | 70E.3 | P2 |
| DD-023 | Mobile menu toggle: missing ARIA | S | 70E.3 | P2 |
| DD-024 | Mobile bottom nav: no aria-current | S | 70E.3 | P2 |
| DD-025 | Footer social icons: accessibility | S | 70E.2 | P1 |
| DD-026 | Hardcoded Unsplash image URLs | M | 70E.3 | P3 |
| DD-027 | Subscription fallback data in component | M | 70E.3 | P1 |
| DD-028 | Homepage vendor count grid gap | S | 70E.2 | **P0** |
| DD-029 | Sidebar wordmark inline style | S | 70E.2 | P2 |
| DD-030 | Non-standard sidebar width (w-68) | S | 70E.2 | P2 |
| DD-031 | Two incompatible visual themes | M+L | 70E.2 | P1 |
| DD-032 | Concierge page: no server metadata | S | 70E.2 | P1 |

**Totals by phase:**
- Phase 70E.2 (now): 20 items — 4 P0, 11 P1, 5 P2
- Phase 70E.3 (next): 12 items — 0 P0, 1 P1, 10 P2, 1 P3

**Totals by effort:**
- S (< 1hr): 14 items
- M (1-4hr): 16 items
- L (4-8hr): 2 items

---

*This register is the input for Phase 70E.2 — Enterprise Design Resolution.*  
*Resolve P0 items first (DD-008, DD-009, DD-010, DD-028), then work through P1 items in order of commercial impact.*  
*Update this register as items are resolved: add completion date and commit hash to each entry.*
