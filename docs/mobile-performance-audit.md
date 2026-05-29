# Mobile Performance Audit — Bold Party

Audit date: 2026-05-29
Auditor: Phase 25A review of codebase

---

## Current State Summary

### What's already optimised

| Area | Status | Notes |
|------|--------|-------|
| Image formats | ✅ Good | `next.config.ts` uses AVIF + WebP with `deviceSizes` breakpoints |
| Image caching | ✅ Good | `minimumCacheTTL: 3600` set |
| Font loading | ✅ Good | Inter with `display: "swap"` prevents invisible text flash |
| Gzip compression | ✅ Good | `compress: true` in `next.config.ts` |
| Mobile tap targets | ✅ Good | Buttons use `p-2` minimum, bottom nav uses `h-16` tabs |
| Bottom nav CLS | ✅ Good | `fixed` positioning means no layout shift from nav |
| Content bottom padding | ✅ Good | `pb-20` on main ensures content not obscured by bottom nav |
| Viewport meta | ✅ Added | `viewport-fit=cover` added in Phase 25A |
| SW caching | ✅ Added | Service worker added in Phase 25A — static assets cached |
| Safe area insets | ✅ Fixed | `.safe-area-bottom` CSS class now properly defined |

---

## Issues Found

### 1. No `priority` prop on above-the-fold images

**Impact**: High — LCP (Largest Contentful Paint)
**Severity**: Medium

Vendor card images on `/browse` and vendor profile hero images are rendered using Next.js `<Image>` but without `priority={true}` on the first visible image. This means the browser must wait for layout before fetching the hero image.

**Fix**: Add `priority` to the first image on browse and vendor profile pages:
```tsx
<Image src={vendor.photo_url} alt={vendor.name} priority={true} ... />
```

### 2. Framer Motion bundle size

**Impact**: Medium — TTI (Time to Interactive)
**Severity**: Low

`framer-motion` adds ~30KB gzipped to the JS bundle. Currently used throughout the app for animations.

**Fix** (optional): Use `import { motion } from "framer-motion"` with lazy imports, or migrate simple animations to CSS for non-critical paths.

### 3. No font preconnect hint for Google Fonts

**Impact**: Medium — LCP
**Severity**: Low

Next.js `next/font/google` handles font optimisation by inlining font faces, but a DNS preconnect to `fonts.googleapis.com` and `fonts.gstatic.com` can reduce font fetch latency on slow connections.

**Fix**: Add to `app/layout.tsx`:
```tsx
// In the <head> via Next.js metadata or directly in layout
```
Note: Next.js font with `display: swap` already downloads fonts efficiently — this is a marginal improvement.

### 4. No resource hints for Supabase

**Impact**: Medium — TTFB on data-heavy pages
**Severity**: Low

No `<link rel="preconnect">` for the Supabase API URL. On pages that immediately fetch from Supabase (like `/browse`), a preconnect hint can reduce connection setup time.

**Fix**: Add to layout:
```html
<link rel="preconnect" href="https://YOUR_PROJECT.supabase.co" />
<link rel="dns-prefetch" href="https://YOUR_PROJECT.supabase.co" />
```

### 5. No bundle analyser configured

**Impact**: Unknown — blind to bundle composition
**Severity**: Medium

No `@next/bundle-analyzer` configured. Cannot currently see which dependencies contribute most to bundle size.

**Fix**:
```bash
npm install --save-dev @next/bundle-analyzer
```
```typescript
// next.config.ts
import withBundleAnalyzer from "@next/bundle-analyzer";
const analyze = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
export default analyze(withSentryConfig(nextConfig, ...));
```
Run with: `ANALYZE=true npm run build`

### 6. Recharts bundle size on dashboard

**Impact**: Medium — dashboard TTI
**Severity**: Low

`recharts` (~100KB gzip) is imported on the vendor analytics page. If users navigate to `/vendor/analytics` from the dashboard, they'll see a delay.

**Fix**: Dynamic import the analytics chart component:
```tsx
const VendorAnalyticsChart = dynamic(() => import("@/components/vendor/AnalyticsChart"), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

---

## Core Web Vitals Targets (Mobile)

| Metric | Target | Assessment |
|--------|--------|-----------|
| LCP (Largest Contentful Paint) | < 2.5s | Unknown — measure with Lighthouse |
| FID/INP (Interaction to Next Paint) | < 200ms | Likely good — React 19 with concurrent features |
| CLS (Cumulative Layout Shift) | < 0.1 | Likely good — fixed nav, font swap on fast connections |
| TTFB (Time to First Byte) | < 600ms | Depends on Vercel edge region proximity to UK users |

---

## Recommended Measurement Tools

1. **Lighthouse** (Chrome DevTools): simulate mobile on production URL
2. **PageSpeed Insights** (`pagespeed.web.dev`): real-world CrUX data + lab data
3. **Vercel Analytics**: built-in Web Vitals dashboard (already set up via Sentry)
4. **WebPageTest.org**: waterfall charts from UK locations

---

## Priority Action Items

| Priority | Action | Effort |
|----------|--------|--------|
| High | Add `priority` to first vendor card image on `/browse` | 30 mins |
| High | Add `priority` to vendor hero image on `/vendors/[id]` | 30 mins |
| Medium | Install bundle analyser and review output | 1 hour |
| Medium | Dynamic import Recharts on `/vendor/analytics` | 1 hour |
| Low | Add Supabase preconnect hints | 15 mins |
| Low | Review framer-motion usage | 2 hours |
