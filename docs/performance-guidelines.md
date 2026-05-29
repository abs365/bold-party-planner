# Bold Party Planner — Performance Guidelines

**Version:** 1.0  
**Applies to:** All contributors, all phases

---

## 1. Query Optimization Rules

### 1.1 Never select `*` on joined relations

```typescript
// BAD — fetches all columns on every joined row
supabase.from("bookings").select("*, vendor:vendors(*), event:events(*)")

// GOOD — fetch only what the component renders
supabase.from("bookings").select(`
  id, status, payment_status, total_amount, created_at,
  vendor:vendors(business_name, category),
  event:events(title, date)
`)
```

Selecting `*` on the root table is acceptable when the table is small (<30 columns) and no joins are involved. As soon as a join is added, both sides must use explicit column lists.

### 1.2 Parallel queries — no sequential awaits after `Promise.all`

```typescript
// BAD — third query runs after the first two complete
const [aRes, bRes] = await Promise.all([queryA, queryB]);
const cRes = await queryC; // wastes a full DB round-trip

// GOOD — all three run in parallel
const [aRes, bRes, cRes] = await Promise.all([queryA, queryB, queryC]);
```

Every `await` outside a `Promise.all` on a server-rendered page adds latency equal to one full DB round-trip (~20–50 ms on Supabase EU). Always audit new page files for stray sequential awaits.

### 1.3 Unbounded queries must have limits

All list queries must declare an explicit `.limit()`. Defaults:

| Context | Default limit | Notes |
|---|---|---|
| Public-facing lists | 20 | Reviews, search results |
| Dashboard tables | 50 | Bookings, vendor lists |
| Admin tables | 100 | With pagination UI |
| Background analytics | 200 | Cursor-based when > 500 |

```typescript
// Required on all list queries
supabase.from("reviews").select("...").eq("vendor_id", id).limit(20)
```

### 1.4 Count queries use `{ count: "exact", head: true }`

```typescript
// BAD — fetches all rows just to count them
const { data } = await supabase.from("vendors").select("id").eq("status", "pending");
const count = data?.length ?? 0;

// GOOD — PostgREST COUNT, no row data transferred
const { count } = await supabase
  .from("vendors")
  .select("id", { count: "exact", head: true })
  .eq("status", "pending");
```

### 1.5 `generateMetadata` DB calls are unavoidable — do not try to eliminate them

In Next.js, `generateMetadata` and the page's default export run concurrently in production. The second DB call is not a waterfall. Document this in code reviews when reviewers flag it.

---

## 2. Image Rules

### 2.1 Always use `next/image`, never raw `<img>`

All images must use `next/image` with `fill` or explicit `width`/`height`. Raw `<img>` tags bypass Next.js optimization and produce layout shift.

### 2.2 Always set the `sizes` attribute on `fill` images

```tsx
// BAD — browser downloads full-width image for all viewports
<Image src={url} alt={alt} fill />

// GOOD — browser picks the right variant
<Image
  src={url}
  alt={alt}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
/>
```

Use these standard `sizes` strings:

| Layout context | `sizes` value |
|---|---|
| Full-width hero | `100vw` |
| Half-width card (2-col grid) | `(max-width: 640px) 100vw, 50vw` |
| Quarter-width card (4-col grid) | `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw` |
| Small avatar / thumbnail | `(max-width: 640px) 48px, 64px` |

### 2.3 Always set `alt` text

Empty `alt=""` is acceptable only for decorative images. Vendor images, avatars, and media gallery images must have meaningful alt text.

### 2.4 Use `priority` on above-the-fold images only

```tsx
// Only on the first visible image on a page (LCP candidate)
<Image src={coverUrl} alt={name} fill priority sizes="..." />
```

Overusing `priority` negates its purpose — it forces eager loading even when the image is off-screen.

---

## 3. Rendering Strategy

### 3.1 Server components are the default

All pages and layouts are server components unless interactivity requires otherwise. Do not add `"use client"` to a component just because it renders data.

```
Server component  →  fetch data, render HTML
Client component  →  state, event handlers, browser APIs
```

### 3.2 When to use `"use client"`

| Acceptable | Not acceptable |
|---|---|
| State (`useState`, `useReducer`) | Fetching data that could be server-side |
| Event handlers | Static rendering with no interaction |
| Browser APIs (`window`, `document`) | Passing down non-serializable context |
| Third-party libraries requiring DOM | |

### 3.3 Data flows server → client, not the reverse

```tsx
// GOOD — server fetches, client renders
async function Page() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}

// BAD — client fetches in useEffect what the server could have provided
function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch("/api/data").then(...) }, []);
}
```

The only valid `useEffect` data-fetches are when data depends on client state that changes after mount (e.g., date range pickers, real-time subscriptions, per-user state on cached pages).

### 3.4 Dynamic imports for large client-only libraries

Libraries over ~100 KB gzipped that are only needed on one route must use `next/dynamic` with `ssr: false`.

```typescript
const HeavyChart = dynamic(
  () => import("@/components/HeavyChart").then((m) => ({ default: m.HeavyChart })),
  { ssr: false, loading: () => <Skeleton /> }
);
```

Current deferred libraries:
- `recharts` (~250 KB) — deferred to `/vendor/analytics` only

### 3.5 `force-dynamic` is only required when opting out of static generation

On auth-gated pages that call `createClient()`, the page is already dynamic (cookie read). Adding `export const dynamic = "force-dynamic"` is harmless but redundant. It is **required** on API routes that must never be statically cached.

---

## 4. Caching Strategy

### 4.1 Do not add ISR (`revalidate`) to pages that call `createClient()`

Reading cookies makes a page permanently dynamic in Next.js 15. Adding `revalidate` alongside cookie reads has no effect and adds confusion.

```typescript
// This does nothing — createClient() reads cookies
export const revalidate = 60;
export default async function Page() {
  const supabase = await createClient(); // reads cookies → dynamic
}
```

### 4.2 ISR requires user-specific state to move to client

The path to ISR on a page with auth state:
1. Move "is saved", "is following", or similar per-user state out of the server component
2. Fetch per-user state client-side via `useEffect` after mount
3. Remove `createClient()` from the server component
4. Add `export const revalidate = N`

This is currently deferred for `/vendors/[id]` and `/browse`. Do not implement without the VendorProfileView refactor.

### 4.3 API route caching

Per-user API routes (e.g., `/api/vendor/analytics`) cannot use shared CDN cache. Use vendor-ID-keyed `Cache-Control` headers when analytics traffic grows:

```typescript
return NextResponse.json(data, {
  headers: { "Cache-Control": "private, s-maxage=300" }
});
```

Public, non-personalized API responses can use `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.

### 4.4 `minimumCacheTTL` for images is set to 3600s

Vendor images rarely change. The current `minimumCacheTTL: 3600` in `next.config.ts` is intentional — do not reduce it.

---

## 5. Hydration Rules

### 5.1 Do not trigger hydration waterfalls

A hydration waterfall occurs when a client component fetches data on mount, which triggers a child component to render, which fetches more data on mount. Prevent this by passing all data as props from the server component.

```tsx
// BAD — waterfall
function ParentClient() {
  const [data, setData] = useState(null);
  useEffect(() => fetch("/api/parent").then(setData), []);
  return data ? <ChildClient parentId={data.id} /> : null;
}

// GOOD — no waterfall
async function ParentServer() {
  const data = await fetchParent();
  const child = await fetchChild(data.id);
  return <ChildClient data={data} childData={child} />;
}
```

### 5.2 Skeleton loading states must match rendered dimensions

When using `loading:` in `next/dynamic` or `<Suspense fallback>`, the skeleton must be the same height as the loaded component. Dimension mismatches cause layout shift (CLS).

```tsx
// The skeleton height should approximate the chart height
loading: () => <div className="animate-pulse h-64 rounded-xl bg-white/4" />
```

### 5.3 `useState` initial value must be deterministic

Never initialize state from a browser-only API synchronously:

```typescript
// BAD — hydration mismatch (window is undefined on server)
const [width, setWidth] = useState(window.innerWidth);

// GOOD — safe initial value, update after mount
const [width, setWidth] = useState(0);
useEffect(() => setWidth(window.innerWidth), []);
```

---

## 6. Pagination Rules

### 6.1 Default page sizes

| Context | Page size |
|---|---|
| Public vendor grid (marketplace) | 20 |
| Admin table | 50 |
| Vendor bookings | 20 |
| Reviews | 20 |
| Search suggestions | 10 |

### 6.2 Client-side pagination is acceptable when filtering is client-side

When a page already downloads a bounded list for client-side filtering (e.g., marketplace with `limit(80)`), client-side `displayCount` pagination is the right trade-off. It avoids re-fetching on every filter change.

When the list is unbounded (could grow to thousands), use server-side pagination with URL params.

### 6.3 Filter changes must reset pagination

```typescript
useEffect(() => {
  setDisplayCount(PAGE_SIZE);
}, [filter1, filter2, filter3]); // every filter variable
```

Missing a filter in this dependency array is a bug: users will see page 2 results after changing filters.

### 6.4 Cursor-based pagination when offset pagination breaks

Offset pagination degrades at scale (`.range(500, 550)` scans 550 rows). Switch to cursor-based (keyed on `created_at` + `id`) when:
- A list reliably exceeds 500 rows
- The list is time-ordered (bookings, events, audit logs)

---

## 7. What Not to Optimize

### 7.1 Do not optimize until there is evidence of a problem

Avoid:
- Memoizing values that are not in hot render paths
- Splitting queries that are already fast
- Moving server fetches to client to "reduce server load"
- Adding cache layers before the DB is a bottleneck

### 7.2 Do not break observability for performance

All API routes must retain `withApiLogger()` wrapping. Do not remove timing instrumentation to shave milliseconds from logs.

### 7.3 Do not break deterministic rendering for caching

ISR and caching are valid optimizations, but never at the cost of users seeing stale auth state, stale booking status, or stale moderation decisions. Cache only data that is safe to be 60 seconds stale.

---

## 8. Checklist for New Pages

Before merging a new page or dashboard:

- [ ] All list queries have explicit `.limit()`
- [ ] No `*` on joined relations
- [ ] No sequential `await` after `Promise.all`
- [ ] All `<Image>` components have `sizes` and `alt`
- [ ] `"use client"` is only on components that require it
- [ ] Any library > 100 KB gzipped uses `next/dynamic`
- [ ] Pagination resets on filter changes
- [ ] No hydration waterfalls (no client-side fetches that could be server-side)
- [ ] Skeletons match component dimensions
