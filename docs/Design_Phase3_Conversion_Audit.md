# ELBOLD Phase 3 — Conversion Audit

**Date:** 2026-06-07  
**Pages reviewed:** Home (`/`), Browse (`/browse`), Vendor Profile (`/vendors/[id]`)  
**Focus areas:** Trust, Conversion, Mobile experience, Quote request visibility

---

## 1. Home Page (`/`)

### Trust
- **Hero overlay is now correct** (Design Phase 2 fixed from 85%→48% opacity) — vendor photography is visible.
- **Trust bar** (3 icons + labels) renders at 80% opacity — readable and credible. No change needed.
- **"Trusted by couples across the UK"** social proof copy is present but unquantified. **Recommendation:** Replace with a live count or specific number (e.g., "Trusted by 200+ event planners") once real data allows. Even a modest real number outperforms a vague claim.
- **No verification badge explanation** on the homepage. Customers who haven't used ELBOLD before don't know what "ID Verified" means. **Recommendation:** Add a 2-line trust section ("Every vendor on ELBOLD is identity-checked before they can receive enquiries") above the featured vendor strip.

### Conversion
- **Primary CTA ("Find Your Vendors")** is above the fold on desktop. On mobile the hero is tall — verify the CTA button is visible without scrolling on 375px viewports.
- **Occasion cards** (Birthday, Wedding, etc.) are a discovery entry point, but they navigate to a pre-filtered browse page. This is the right pattern — no change needed.
- **Featured vendors strip:** Cards show trust badges (Phase 3C done). The "Get a Quote" micro-CTA on each card is the right affordance. **Recommendation:** Ensure this strip is always populated (min 2 vendors) — an empty strip destroys conversion. Add an admin guard or fallback.
- **No urgency or scarcity signal.** **Recommendation (low priority):** A subtle "3 vendors available this weekend in London" dynamic hook, if feasible, would lift CTR significantly. Defer until real availability data exists.

### Mobile
- Category pill row may overflow horizontally on small screens — confirm it scrolls rather than wrapping to two rows (two-row layout breaks visual rhythm).
- Hero text hierarchy (h1 → subtitle → CTA) is correct size for mobile. No change.

---

## 2. Browse Page (`/browse`)

### Trust
- Vendor cards show trust badges (Phase 3C done). ID Verified badge is the highest-impact trust signal on cards.
- **No explanation of what the badges mean** for first-time browsers. **Recommendation:** Add a dismissible tooltip or a single-line legend below the filter bar: "Shield = ID Verified · Star = Top Rated · ⚡ = Fast Responder."
- Category hero images (Phase 2 fixed all DJ/fallback URLs) render correctly.

### Conversion
- **Filter bar** (category + city + price range) is functional. **Recommendation:** Add a "Sort by" dropdown with options: Relevance (default), Top Rated, Price: Low→High, Newest. This reduces decision paralysis for browsing customers.
- **"Get a Quote" button** is visible on each card. This is the primary conversion action — good placement. Ensure it is prominent on mobile (full-width below the card details).
- **Empty state** (no results found) currently shows a generic message. **Recommendation:** Show 3 "You might also like" cards from adjacent categories plus a "Broaden search" CTA. An empty page is a dead end.
- **Pagination vs infinite scroll:** Current page-based pagination requires a deliberate click. On mobile this is fine; the real risk is vendors never reaching page 2. Aim for ≤20 vendors per page so the best vendors are always visible.

### Mobile
- Card grid switches from 3-col → 2-col → 1-col correctly.
- Filter bar collapses to a "Filters" button on mobile — this is the right pattern.
- Verify that the "Get a Quote" button tap target is ≥44px height (WCAG AA minimum for touch).

---

## 3. Vendor Profile Page (`/vendors/[id]`)

### Trust
- **Trust badges row** renders directly under the vendor name (Phase 2 + Phase 3C). Correct position.
- **Hero overlay** reduced in Phase 2 — vendor's photography is now visible immediately. High impact.
- **Verification section** shows ID/Address/Business Verified status with explanations. Good.
- **Review section** is present. **Recommendation:** Show the most recent review above the fold, not behind a "see all" collapse. The first review is the highest-converting piece of content on the page.
- **No "This vendor has X completed bookings" social proof number.** `completed_jobs_count` is available. **Recommendation:** Add "X events completed" alongside the star rating in the profile header — one line, high trust signal.

### Conversion
- **"Request a Quote" CTA** exists but its position varies by viewport. **Recommendation:** On mobile, pin a sticky "Request a Quote" bar to the bottom of the screen (fixed, above the bottom nav) — this is the single highest-impact conversion improvement available. The CTA should never scroll out of view.
- **Package cards** (pricing section) are the second conversion trigger. **Recommendation:** Add a "Most Popular" badge to the vendor's best-selling package (highest booking count or admin-flagged). This reduces decision paralysis.
- **Response time signal is missing.** `response_rate` is stored but response_time_hours is not shown. **Recommendation:** Show "Typically responds within X hours" if the data is available — this reduces anxiety about quote abandonment.
- **"Similar Vendors" section** at the bottom is correctly populated (Phase 2). Good for retaining browsers who don't convert on this vendor.

### Mobile
- **Sticky "Request a Quote" bar** (as above) is the top mobile recommendation.
- Profile hero image is full-width on mobile — the overlay reduction (Phase 2) means vendor photography reads well.
- Package cards stack to single column on mobile — correct.
- Social media links (Instagram / Website) need tap targets ≥44px.

---

## Summary — Priority Matrix

| Recommendation | Page | Trust | Conversion | Effort | Priority |
|---|---|:---:|:---:|:---:|:---:|
| Sticky "Request a Quote" on mobile | Vendor Profile | — | ★★★ | Low | **P1** |
| Show most recent review above fold | Vendor Profile | ★★ | ★★ | Low | **P1** |
| Trust badge legend on Browse | Browse | ★★ | ★ | Low | **P2** |
| Sort by dropdown (Browse) | Browse | — | ★★ | Low | **P2** |
| "X events completed" in profile header | Vendor Profile | ★★ | ★ | Low | **P2** |
| Trust explanation paragraph on Home | Home | ★★ | ★ | Low | **P2** |
| Empty state with adjacent vendors | Browse | — | ★★ | Medium | **P2** |
| "Most Popular" package badge | Vendor Profile | — | ★★ | Low | **P3** |
| Response time signal on profile | Vendor Profile | ★ | ★ | Medium | **P3** |
| Live vendor count on Home hero | Home | ★ | ★ | Medium | **P3** |
| Home CTA above fold on 375px | Home | — | ★★ | Low | **P3** |

**P1 items can be shipped in < 1 day each and have the highest expected conversion lift.**

---

*No major redesigns recommended — the Design Phase 2 improvements have resolved the primary visual trust gap. The remaining wins are micro-optimisations and copy changes.*
