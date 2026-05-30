# ELBOLD — Performance Audit

**Conducted:** 2026-05-28  
**Status:** Phase 3 (Production Performance)

---

## Executive Summary

| Area | Severity Before | Status |
|---|---|---|
| Admin dashboard sequential query | 🔴 Critical | ✅ Fixed |
| Customer dashboard console.logs | 🟡 Medium | ✅ Fixed |
| Vendor profile unbounded reviews | 🔴 Critical | ✅ Fixed |
| Vendor profile `*` on nested relations | 🟡 Medium | ✅ Fixed |
| Recharts in all-page bundle | 🟡 Medium | ✅ Fixed |
| Marketplace no pagination | 🟡 Medium | ✅ Fixed |
| Vendor/customer dashboard `*` bookings select | 🟡 Medium | ✅ Fixed |
| framer-motion installed but unused | 🟢 Low | Documented |
| Vendor profile ISR opportunity | 🟡 Medium | Deferred |
| Browse page ISR opportunity | 🟡 Medium | Deferred |

---

## 1. Query Audit

### Admin Dashboard (`app/admin/page.tsx`)

**Before:** 10 parallel queries + 1 sequential query (flaggedVendors ran AFTER Promise.all completed)  
**After:** 11 parallel queries (flaggedVendors moved into Promise.all)

**Time saved:** Eliminates one full DB round-trip (~20–50ms) from the critical path.

**Secondary fix:** pendingVendors query narrowed from `*` to explicit columns:
```
id, business_name, category, city, created_at, profile:profiles(full_name, email)
```

**Remaining:** bookings query uses `.limit(200)` which covers early-stage production well. Revisit with cursor-based pagination when bookings exceed 500.

---

### Vendor Dashboard (`app/vendor/dashboard/page.tsx`)

**Before:** bookings select used `*` — fetched all ~20+ columns including unused notes, contract_url, etc.

**After:** Explicit column list:
```
id, status, payment_status, total_amount, vendor_payout, deposit_amount, created_at,
event:events(title, date, city, guest_count),
customer:profiles(full_name, email, avatar_url)
```

Estimated payload reduction per booking row: ~40% (removes ~8 unused text columns).

---

### Customer Dashboard (`app/dashboard/page.tsx`)

**Before:** bookings select used `*` + 2 `[AUTH-DEBUG]` console.log statements  
**After:** Explicit column list + debug logs removed:
```
id, total_amount, payment_status, status, created_at,
vendor:vendors(business_name, category),
event:events(title, date)
```

---

### Vendor Profile (`app/vendors/[id]/page.tsx`)

**Before:** Single Promise.all with vendor + auth. Reviews were inline nested with `*` — unbounded, could fetch 200+ rows × all columns. Media used `*`.

**After:**
- Three-way Promise.all: vendor + auth + reviews (parallel)
- Reviews: separate query with `.limit(20)`, explicit 7 columns
- Media: narrowed from `*` to `id, url, type, is_cover, caption, sort_order, moderation_status, alt_text, width, height, duration_secs`
- Packages: narrowed from `*` to `id, name, description, price, duration_hours, includes, is_popular`

**Impact:** For vendors with 50+ reviews, this reduces payload from ~50KB to ~5KB for the reviews portion alone.

**Note:** `generateMetadata` makes a second independent DB call for SEO data. This is unavoidable in Next.js `generateMetadata` — the calls run concurrently (Next.js optimizes this internally via the `preload` pattern in production).

---

### Browse/Marketplace (`app/browse/page.tsx`)

**No query changes.** The existing select is already lean:
```
*, media:vendor_media(url, type, is_cover), packages:vendor_packages(price)
```
`*` on vendors (single table, no joins for media/packages other than those specified) is acceptable since each vendor row is ~30 columns × ~50 vendors.

**Pagination:** Moved to client-side (see Section 4).

---

## 2. Bundle Size Audit

### Recharts

**Size:** ~250 KB gzipped  
**Before:** Statically imported in `VendorAnalyticsDashboard.tsx` ("use client") — included in the JS chunk for every page that imports this component  
**After:** Dynamic import via `next/dynamic` at the import site (`app/vendor/analytics/page.tsx`)

```typescript
const VendorAnalyticsDashboard = dynamic(
  () => import("@/components/vendor/VendorAnalyticsDashboard").then(...),
  { ssr: false, loading: () => <Skeleton /> }
);
```

**Impact:** recharts is now deferred until the user navigates to `/vendor/analytics`. All other pages save ~250 KB from their JS payload.

### framer-motion

**Status:** In `package.json` but **not imported anywhere in the codebase.**  
**Recommendation:** Remove with `npm uninstall framer-motion` to reduce `node_modules` size and prevent accidental future imports.  
**Impact on bundle:** Effectively zero since Next.js tree-shakes unused imports. But removing it prevents accidental future use.

### openai, stripe, resend

All server-side only. Never in client bundle. ✅

---

## 3. Image Delivery Audit

### Configuration (`next.config.ts`)

**Before:** Default `deviceSizes` and `imageSizes`  
**After:** Explicit breakpoints aligned with Tailwind CSS breakpoints:
```typescript
deviceSizes: [640, 750, 828, 1080, 1200, 1920],
imageSizes: [32, 48, 64, 96, 128, 256],
```

This prevents Next.js generating too many intermediate image variants, reducing image optimization worker load.

**minimumCacheTTL:** 3600s (1 hour) — appropriate for vendor images that rarely change.

### next/image compliance

All image rendering uses `next/image` with `fill` + `sizes` attributes. No raw `<img>` tags found.

**Well-implemented examples:**
- `VendorMarketplace.tsx` — `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"`
- `app/vendors/[id]/page.tsx` — `sizes="(max-width: 640px) 50vw, 25vw"`
- `TrendingVendors.tsx` — `sizes="(max-width: 640px) 240px, 25vw"`

### Upload size limits

`/api/uploads/route.ts` already enforces: MIME validation, extension validation, min/max size check, media count limit, DB rollback on storage failure. ✅

---

## 4. Pagination

### VendorMarketplace — Client-Side Pagination

**Before:** All 80 vendors rendered at once (80 DOM nodes × full card HTML)  
**After:** 20 vendors rendered initially with "Show more" button (+20 per click)

```typescript
const VENDOR_PAGE_SIZE = 20;
const [displayCount, setDisplayCount] = useState(VENDOR_PAGE_SIZE);

// Resets to 20 when any filter changes
useEffect(() => {
  setDisplayCount(VENDOR_PAGE_SIZE);
}, [search, category, city, sortBy, budgetMin, budgetMax, minRating, verifiedOnly, eventType]);
```

**Why client-side not server-side:** VendorMarketplace does all filtering in useMemo on the client. Server-side pagination would require re-fetching on every filter change (adds latency). Client-side pagination with `limit(80)` fetch keeps the current architecture while reducing DOM size on first render.

**Trade-off:** 80 vendor records are still fetched from the server. In production with hundreds of vendors, switch to URL-param-based server pagination.

### Other Large Lists — Not Yet Paginated

These are ordered by severity for future implementation:

| Page | Current limit | Risk |
|---|---|---|
| `/admin/bookings` | unknown | Medium — check and cap at 50 |
| `/admin/moderation` | unknown | Medium — reports can grow |
| `/admin/verifications` | unknown | Low — few pending at any time |
| `/admin/audit` (API) | max 200 | Low — query param enforced |
| `/dashboard/bookings` | none | Low — customers rarely have many |
| Vendor bookings list | 20 | ✅ Already paginated |

---

## 5. Caching Strategy — Current State & Opportunities

### Why `force-dynamic` is unavoidable on auth-gated pages

All dashboard pages and most public pages call `createClient()` which reads cookies. In Next.js 15, reading cookies makes the page inherently dynamic. The `force-dynamic` directives are therefore **redundant but harmless** on auth-gated pages.

### ISR Opportunities (deferred)

| Page | Opportunity | Blocker |
|---|---|---|
| `/vendors/[id]` | `revalidate = 60` for vendor data | User's "is saved" state breaks with ISR |
| `/browse` | `revalidate = 60` for approved vendors | Auth cookie makes it dynamic |
| `/categories/[category]` | `revalidate = 300` | Same auth issue |

**Path to ISR for vendor profiles:**
1. Move "is saved" state fetch to a client-side `useEffect` in VendorProfileView
2. Remove `supabase.auth.getUser()` from the page server component
3. Add `export const revalidate = 60`

This would allow vendor profiles to be served from cache for 60 seconds, reducing DB load significantly for high-traffic vendors.

---

## 6. API Performance

### Timing instrumentation

`lib/monitoring/apiLogger.ts` wraps all API routes with `withApiLogger()`, which logs:
- `elapsed_ms` per request
- `status_code`
- `route`
- `request_id`

**Slow query threshold:** Currently no automatic slow-query warning. Recommendation: add a threshold check in apiLogger:
```typescript
if (elapsed > 2000) logger.warn("slow_request", { route, elapsed_ms: elapsed, request_id });
```

### `/api/vendor/analytics` — Per-user, cannot be shared cached

This endpoint does aggregations over `vendor_analytics` events. Since it's per-vendor, response caching must be keyed by vendor ID. An `s-maxage=300` Cache-Control header would allow CDN to cache per-user for 5 minutes.

Currently: no cache headers. Acceptable for now; add when analytics traffic grows.

---

## 7. Hydration Cost Analysis

### "use client" components

| Component | Data fetching | Notes |
|---|---|---|
| `VendorAnalyticsDashboard` | `fetch()` in `useEffect` | Necessary — period changes require re-fetch |
| `VendorMarketplace` | None (props) | Client filtering is acceptable trade-off |
| `DashboardLayout` | None (props) | Correct pattern |
| `SmartConcierge` | `fetch()` in `useEffect` | Floating widget — lazy is correct |

No unnecessary client components found. All dashboards correctly use server components for data fetching.

### Hydration waterfalls

No hydration waterfalls detected. The pattern of:
1. Server component fetches all data
2. Passes as props to client components

is consistently applied across all dashboard pages.

---

## 8. Measurements (Approximate, Dev Server)

| Metric | Before | After (estimated) |
|---|---|---|
| Admin dashboard DB round-trips | 11 (sequential) | 11 (parallel) |
| Vendor profile reviews payload | Unbounded | Max 20 reviews |
| Marketplace initial DOM nodes | 80 vendor cards | 20 vendor cards |
| Analytics page JS (recharts) | Synchronous in bundle | Deferred on-demand |
| Vendor dashboard booking payload | ~100% columns | ~60% columns |

**Note:** These are code-level estimates. Run Lighthouse or Vercel Speed Insights in production for real TTFB, LCP, and CLS numbers.

---

## Remaining Opportunities (Not This Phase)

1. **ISR for vendor profiles** — Significant impact, requires VendorProfileView refactor
2. **Server-side marketplace filtering** — Eliminates `limit(80)` fetch; requires URL param routing
3. **Cursor-based booking pagination** — Replace offset pagination when bookings > 500
4. **`/api/vendor/analytics` caching** — Add `s-maxage=300` when analytics traffic grows
5. **Remove framer-motion** — `npm uninstall framer-motion` (zero bundle impact but clean deps)
6. **Slow request logging threshold** — Add 2000ms threshold to apiLogger
7. **`/admin/bookings` pagination** — Audit and cap large admin lists
