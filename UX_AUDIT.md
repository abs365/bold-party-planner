# UX Audit — Bold Party Event Planner
_Completed: 2026-05-25_

---

## 1. Fixed Non-Clickable / Broken Areas

| Area | Previous State | Fix Applied |
|------|---------------|-------------|
| Navbar Bell icon | `<button>` with no action | → `<Link href="/dashboard/notifications">` with animated dot |
| Navbar dropdown `/profile` link | Route did not exist | → Created `app/dashboard/settings/page.tsx` |
| Navbar dropdown outside-click | Dropdown stayed open | → `useRef` + `addEventListener("mousedown")` close handler |
| Sidebar `/dashboard/bookings` link | Page didn't exist (only `[id]` existed) | → Created full bookings list page |
| VendorProfileView Heart button | `<button>` with no `onClick` | → Toggles `saved` state + toast |
| VendorProfileView Share button | `<button>` with no `onClick` | → Web Share API + clipboard fallback |
| DashboardLayout "Account Settings" | Dead `/profile` link | → Updated to `/dashboard/settings` |
| DashboardLayout "Inspiration Feed" | Had `setSidebarOpen` scope error | → Changed to `onClose` prop |
| Mobile nav "Browse" tab | Went to `/browse` (exit dashboard) | → Replaced with "Inspire" `/inspire` and "Plan" CTA |

---

## 2. New Routes / Pages Created

| Route | Description |
|-------|-------------|
| `/inspire` | Pinterest-style inspiration hub — masonry feed, trending themes, collections, palettes, vendor spotlight, event of the week |
| `/dashboard/bookings` | Full bookings list grouped by status (active / completed / other) |
| `/dashboard/settings` | Account settings: profile card, info items, account actions grid |

---

## 3. New Components Created

| Component | File | Purpose |
|-----------|------|---------|
| `InspirationFeed` | `components/ui/InspirationFeed.tsx` | Pinterest masonry with real vendor photos + save interactions |
| `InspirationPreview` | `components/ui/InspirationFeed.tsx` | Compact 6-tile grid for homepage |
| `VendorHighlightReel` | `components/ui/InspirationFeed.tsx` | Story-style vertical vendor card |
| `TrendingVendors` | `components/ui/TrendingVendors.tsx` | Ranked vendor cards with gold/silver/bronze badges |
| `ActivityFeedItem` | `components/ui/TrendingVendors.tsx` | Single real-time activity row |
| `LiveActivityWidget` | `components/ui/TrendingVendors.tsx` | Live activity feed with pulse dot |

---

## 4. Database / Migration Fixes

| File | Fix |
|------|-----|
| `supabase/seed.sql` | `vendor_media.type`: changed all 10 inserts from `'photo'` → `'image'` |
| `supabase/seed.sql` | `events.status`: changed all 3 inserts from `'active'` → `'planning'` |
| `supabase/migrations/008_data_consistency_fix.sql` | Created production-safe normalization migration |

---

## 5. Visual / UX Improvements

### Homepage
- Added `InspirationPreview` section (6-tile inspiration grid)
- Added "Happening Now" live activity widget
- Added "Community Spotlight" social card grid (4 tiles)
- Removed redundant parallel `trendingVendors` DB query

### Inspiration Hub (`/inspire`)
- Hero section with gradient blur orbs
- Trending themes horizontal scroll (8 themes, save counts)
- Collections grid (6 themes, 2-row responsive grid)
- Colour palettes (6 palettes with visual swatches)
- **Vendor Spotlight** (top-rated verified vendors with cover photos)
- **Featured Event of the Week** editorial banner
- Pinterest masonry feed (real vendor photos interleaved with styled tiles)

### Vendor Cards (VendorMarketplace)
- Taller cover image (h-48 → h-52)
- "Hot" badge for vendors with rating ≥ 4.7 and ≥ 30 reviews
- Save button (heart) on hover — toggles saved state with toast
- Engagement counter row (likes/views metrics)
- Gradient placeholder for vendors without media

### Smart Planner Wizard
- Step 4 loading: multi-step animated checklist (5 steps with Loader2 spinner on current)
- Budget breakdown: coloured hue bars + percentage labels + smart tip chip
- Loading animation: radial glow ring on Sparkles icon

### Mobile Bottom Nav
- "Plan" CTA tab (elevated gradient pill, `-mt-4`) in centre position
- "Inspire" tab linking to `/inspire`
- Active indicator moved to top (active underline at top edge)
- Improved visual contrast: `rgba(10,10,15,0.92)` + backdrop blur

### Global CSS Additions
- `.scrollbar-hide` for horizontal feeds
- `.social-card-hover` cubic-bezier lift
- `.masonry-grid` responsive columns
- `.story-ring` Instagram-style gradient ring
- `.pulse-dot` animated pulse
- `.gradient-border` CSS mask gradient border
- `.ken-burns` subtle image pan on hover
- `.fab` floating action button
- `.engagement-pill` social metric chip
- `.frosted-glass` heavy backdrop blur
- `.play-button-overlay` video play button
- `.reveal` / `.reveal.visible` scroll animations

---

## 6. Remaining Weak UI Areas

### High Priority

| Area | Issue | Recommended Fix |
|------|-------|-----------------|
| Security settings (`/dashboard/settings`) | Links to `#` — non-functional | Build `/dashboard/security` with password change via Supabase auth |
| Sign Out button in settings | Links to `#` | Wire to `supabase.auth.signOut()` client action |
| Payment Methods | Links to `/dashboard/payments` but no saved card UI | Add Stripe payment method management or placeholder |
| Vendor onboarding `/vendor/apply` | Static form — submits but needs review flow | Connect to admin verification queue |

### Medium Priority

| Area | Issue | Recommended Fix |
|------|-------|-----------------|
| Event gallery on event detail page | No photo upload / gallery viewer | Add drag-and-drop upload with lightbox viewer |
| Message threads | No real-time updates | Add Supabase Realtime subscription |
| Quote flow | Acceptance / counter-offer UI is minimal | Add inline negotiation with price input |
| Notification bell count | Shows animated dot but no unread count badge | Fetch unread count from `notifications` table |
| `/inspire` masonry | Static placeholder tiles alongside real photos | Replace static tiles with real community content when available |

### Low Priority / Future

| Area | Issue |
|------|-------|
| Swipe gestures | No swipe-to-dismiss, swipe-to-save on mobile inspiration tiles |
| Offline state | No offline/error UI — just blank screens on network failure |
| Skeleton loaders | Most pages show blank during data fetch; no loading skeletons |
| Infinite scroll | Inspiration feed is finite — no "load more" / infinite scroll |
| Social sharing | Share to WhatsApp, Facebook deep links not wired |
| Event countdown widget | Days counter on event detail is good but no push notification integration |
| Video previews | `vendor_media` supports video type but no player UI |
| Vendor analytics charts | Recharts installed but vendor analytics page is basic |

---

## 7. Mobile Responsiveness Notes

| Page | Status |
|------|--------|
| Homepage | Good — hero, categories, vendor cards all responsive |
| Browse / Marketplace | Good — filters collapse on mobile |
| Vendor profile | Good — tabs switch to compact layout |
| Dashboard | Good — sidebar collapses to mobile bottom nav |
| Inspire page | Good — masonry adapts (2→3→4 columns) |
| Event detail | Good — two-column layout stacks on mobile |
| Create event wizard | Good — step pills abbreviate on mobile |
| Admin pages | Acceptable — tables scroll horizontally |
| Messages | Acceptable — no dedicated mobile chat layout |

---

## 8. Performance Notes

- All dashboard pages use `export const dynamic = "force-dynamic"` — correct for authenticated pages
- Homepage fetches vendors server-side — good
- `InspirationFeed` renders statically with real vendor media URLs — no image optimization (`next/image`) on masonry tiles; consider adding for LCP improvement
- `VendorProfileView` save/share are client-only with no persistence — saves are lost on page reload; consider adding `saved_vendors` table
- No `loading.tsx` files in any route — users see blank during navigation; add route-level loading skeletons
- No `error.tsx` boundaries — unhandled Supabase errors will crash pages; add error boundaries

---

## 9. Technical Debt

| Item | Location | Note |
|------|----------|------|
| `useEffect` + interval in wizard | `CreateEventWizard.tsx` | Missing `LOADING_STEPS` in dep array (stable constant, no actual bug) |
| `// eslint-disable-next-line @next/next/no-img-element` | `inspire/page.tsx` | Using `<img>` in vendor spotlight — swap to `<Image>` with known dimensions |
| Static engagement metrics | `TrendingVendors`, homepage spotlight | Hardcoded "2.4k saves" — should come from DB aggregates |
| Missing `loading.tsx` | All routes | Add skeleton loaders for route transitions |
| Vendor media type guard | `InspirationFeed.tsx` | Type cast as `unknown` — should be typed through DB query result types |
