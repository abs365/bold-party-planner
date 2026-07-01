# UK EXPANSION & COMMERCIAL READINESS REPORT

**Date:** 2026-07-01
**Status:** Audit complete, approved cleanup and profile improvements implemented, deployed in small increments
**Objective:** Position ELBOLD as a UK-wide vendor platform while keeping customer acquisition supply-led

---

## Priority 1 — Remove Public Test Data

### Findings

A repo-wide audit plus direct production-database verification found test/placeholder data in two categories: **live public vendors with obvious test names**, and **unprotected public routes**.

| Finding | Verified state | Action |
|---|---|---|
| "Smoke Test1" and "LJ Test Vendor" — approved, publicly visible vendors | Confirmed live in production (`status = 'approved'`), not in the existing `TEST_VENDOR_IDS` exclusion list | **Fixed** — suspended in production with `ARCHIVED_TEST_VENDOR` admin-note tag (existing house convention) |
| "REV TEST Photography" | An internal doc claimed this was still `approved`. Direct DB query showed it was already `status: suspended` since 2026-06-10 (admin notes confirm: "Test vendor created during Phase 53/54 revenue validation... No real vendor behind this account"). The doc was stale, not the database. | No action needed — already correctly suspended; added the standard note tag for consistency |
| Tinms, Mastaly, Baptist, Ballet — 4 vendors kept `approved` for QA, hidden only via a hardcoded exclusion array | On explicit request, fully investigated and removed (see below) | **Removed** |
| `/testing/admin`, `/testing/customer`, `/testing/vendor` — internal pilot-feedback forms with no auth gate, no env check, no `noindex` | Confirmed publicly reachable in production | **Fixed** — added `noindex, nofollow` to the shared layout. Left auth-gating as a follow-up recommendation (see below) since I don't have visibility into who currently uses these for active pilot testing, and a wrong guess there could lock out real testers |
| Smart-matching API (`/api/vendor/matching`) had **no test-vendor exclusion at all** | Confirmed by reading the route — it filters only `status = 'approved'`, nothing else | **Fixed** — added the same `TEST_VENDOR_EXCLUSION` filter used elsewhere |
| Regional landing pages (`/essex`, `/kent`, `/london`), `/sitemap.xml`, `/about` vendor count | None of these applied the test-vendor exclusion either | **Fixed** — same filter added to all three |
| Homepage, `/browse`, `/categories/[category]`, `/vendor-spotlights` | Already correctly excluded test vendors | No action needed |
| Fabricated vendor counts / stats | Every count on the homepage and elsewhere is a real `count: "exact"` Supabase query — no hardcoded numbers found | No action needed |

### Removal of Tinms, Mastaly, Baptist, Ballet — what actually happened

This went through an extra verification step before anything was deleted, because the codebase carried an explicit `// Do NOT delete these vendors; they contain valid test data for QA` comment. A first-draft deletion script was blocked by a live foreign-key constraint (`admin_roles_granted_by_fkey`) before it could commit anything — because the account behind "Ballet" turned out to be the founder's own login (`blue2gtv@gmail.com`), which had also granted an admin role to another account. The transaction rolled back atomically; nothing was lost.

Checking the other three owner accounts before proceeding again showed:
- **Mastaly** (`mastalyinfo@gmail.com`) — a real contact previously earmarked for a future admin-role grant
- **Tinms** (`boldeventplanner@gmail.com`, "Tim") and **Baptist** (`alawal543@yahoo.com`, "John Baptist") — real-looking personal emails, not confirmed disposable

**Final scope, confirmed before execution:** the 4 vendor *business listings* and their vendor-only data (packages, media, availability, bookings, quotes, reviews) were deleted. All 4 underlying login/profile accounts were left completely untouched. One clearly-disposable demo customer account (`phase53.customer@elbold.demo`, linked to Mastaly's test booking) was also removed. A separate quote from `lawloni4@gmail.com` — linked to Ballet, with no demo markers — was removed as a quote record only; that person's own profile and login were never touched.

Verified post-deletion: 0 of the 4 vendor listings remain, all 4 owner accounts still exist, the demo customer account is gone, `lawloni4@gmail.com`'s account is intact.

**Migration:** `067_remove_named_test_vendors.sql`. `lib/test-vendors.ts` updated to reflect the new state — the array is now empty of real entries (a placeholder nil UUID is kept so the generated SQL `NOT IN (...)` clause stays syntactically valid; an empty `IN ()` list is a Postgres syntax error, verified directly against production before relying on it).

### Recommendation (not implemented)

Auth-gate `/testing/admin`, `/testing/customer`, `/testing/vendor` beyond `noindex` — either behind the existing admin-email check or a pilot-tester allowlist. Needs your input on who currently uses these routes before I pick a gating mechanism, so a real tester isn't locked out.

---

## Priority 2 — Update the Founding Vendor Programme

### Findings

The Founding Vendor Programme's copy consistently scoped itself to "London, Kent and Essex" (or "London, Essex and Kent") across 6 public-facing locations, while other homepage/site copy already claimed UK-wide coverage (JSON-LD `areaServed: Country/UK`, "Trusted Professionals Across the UK") — a real messaging inconsistency for a customer or vendor outside those 3 counties.

### Changes made

| File | Change |
|---|---|
| `app/founding-vendors/page.tsx` | Metadata description + OG description + hero paragraph — "London, Kent and Essex" → UK-wide framing |
| `app/page.tsx` | Homepage hero status line and the 4-stat block ("London · Essex · Kent" → "Nationwide Coverage") |
| `app/browse/page.tsx`, `app/categories/[category]/page.tsx`, `components/vendor/VendorMarketplace.tsx` | "Onboarding... across London, Essex and Kent" → "across the UK" |
| `app/vendor-spotlights/page.tsx` | Same pattern, adjusted wording |

The scarcity mechanic ("20 founding places available") was kept unchanged — only the geographic scoping was removed, per the brief's focus on early access / founding status / long-term benefits rather than removing the programme's actual structure.

**Deliberately not touched:** the `/essex`, `/kent`, `/london` SEO landing pages themselves (legitimate, separate regional SEO strategy — not part of the Founding Vendor Programme's own copy) and `docs/ELBOLD_MASTER_PLAYBOOK.md` / `app/admin/vendor-acquisition/page.tsx` (internal strategy docs and admin tooling, not public copy).

---

## Priority 3 — Vendor Public Profile

### Findings

The public vendor profile (`app/vendors/[id]/page.tsx`) already has a solid foundation: canonical slug URLs with permanent redirects from UUID/old-slug requests, full `generateMetadata()` with OpenGraph (1200×630 image, proper alt text) and Twitter `summary_large_image` cards, and JSON-LD `LocalBusiness` structured data. This is enough for clean link previews on Facebook, WhatsApp, and Google Business Profile out of the box.

Two real gaps for the specific platforms named in the brief:

1. **A vendor's own shared link could 404.** `page.tsx` gated the entire public profile behind a profile-completion score (`< 50`, or `< 32` for founding vendors) and called `notFound()` below that threshold. A vendor could share their profile URL on Instagram/WhatsApp/Google Business Profile while still building it out, or their score could later dip (e.g. a photo removed in moderation) — and the previously-shared link would start returning a hard 404 for anyone who clicks it. This directly undermines "vendor confidence in sharing their profile," which is the explicit goal of this priority.
2. **Instagram and TikTok have no share-panel option**, and structurally can't — neither platform supports URL-based share intents the way WhatsApp/Facebook/LinkedIn do. The existing `VendorSharePanel` had no fallback for this.

### Changes made

- **Fixed the 404 bug**: replaced the hard `notFound()` with a soft "this profile is still being finalised" page (same Navbar/Footer, professional copy, links back to `/browse`) — a shared link now always resolves to a real, presentable page instead of looking broken.
- **Added a native share button** (`navigator.share()`, feature-detected, hydration-safe) to `VendorSharePanel`. On mobile this invokes the OS share sheet, which surfaces Instagram Direct, TikTok, Messages, Mail, and any other installed app with a share target — the practical workaround for platforms with no web share intent.

### Recommended, not built now

- **QR code generation** for the vendor's profile URL — the realistic mechanism for Instagram/TikTok bio use and printed materials (business cards, stalls). Not built in this pass: it's a genuinely new capability (image generation, a new UI surface) rather than a fix to something existing, and doesn't yet have a demonstrated vendor asking for it. Worth scoping properly as its own small feature once there's real usage signal.
- **vCard / email-signature export** — a downloadable contact-card format for vendors who want to link their profile from an email signature. Same reasoning: real but speculative until a vendor asks for it.

---

## Priority 4 — Customer Geography

### Findings

This is the one priority where the audit did **not** surface a fabricated-density problem — the honest parts were already honest:

- Every vendor count shown to customers (homepage, `/about`) is a real `count: "exact"` Supabase query. No hardcoded "X vendors near you" copy exists anywhere.
- `app/browse/page.tsx`'s city filter is a genuine hard filter (`.ilike("city", ...)`) when a customer searches by city — it does not silently fall back to nationwide results.
- Every vendor card displays the vendor's actual `city` (confirmed in `VendorMarketplace.tsx`), so even in the default (no city filter) view, a customer can always see where a vendor is actually based — there's no impression of density that isn't there.

One real, but different, gap: **`travel_radius_km` is fetched but never enforced.** `app/api/vendor/matching/route.ts` selects it and never references it in scoring; it functions as a decorative column. This matters less than it first appears — the matching endpoint is a ranked-list tool for a customer actively planning a specific event (city match is a *scoring bonus*, not a proximity claim), not a "vendors near you" browse view, and every vendor card the ranked list surfaces still shows a real city. A second candidate fix — using the `service_areas` array field to widen city matching beyond a vendor's primary city — was investigated and **not implemented**: `service_areas` is defined in the schema but is never collected anywhere in the vendor profile-edit UI, so it is unpopulated in practice. Building matching logic on top of a field nothing ever writes to would be dead code solving nothing.

### Recommendation (not implemented)

True distance/radius enforcement needs vendor geocoding (lat/lng), which the schema doesn't currently have — that's new data collection (an address-to-coordinates step at vendor onboarding, likely a geocoding API integration), not a quick fix, and isn't justified until the vendor base is dense enough nationwide for radius-based exclusion to actually matter. Revisit once vendor count and geographic spread grow — this report's Priority 1/2 changes are explicitly aimed at growing that spread.

---

## Summary of Code Changes

| File | Status | Priority |
|---|---|---|
| `lib/test-vendors.ts` | MODIFIED | 1 |
| `app/testing/layout.tsx` | MODIFIED | 1 |
| `app/api/vendor/matching/route.ts` | MODIFIED | 1 |
| `app/(locations)/location-page.tsx` | MODIFIED | 1 |
| `app/sitemap.ts` | MODIFIED | 1 |
| `app/about/page.tsx` | MODIFIED | 1 |
| `supabase/migrations/067_remove_named_test_vendors.sql` | NEW (applied to production) | 1 |
| `app/founding-vendors/page.tsx` | MODIFIED | 2 |
| `app/page.tsx` | MODIFIED | 2 |
| `app/browse/page.tsx` | MODIFIED | 2 |
| `app/categories/[category]/page.tsx` | MODIFIED | 2 |
| `components/vendor/VendorMarketplace.tsx` | MODIFIED | 2 |
| `app/vendor-spotlights/page.tsx` | MODIFIED | 2 |
| `app/vendors/[id]/page.tsx` | MODIFIED | 3 |
| `components/vendor/VendorSharePanel.tsx` | MODIFIED | 3 |

No new dependencies. No changes made for Priority 4 (audit-only outcome, justified above).

---

*Report complete. Implementation for Priorities 1-3 shipped in small, independently-verified commits per the standing "deploy frequently in small, reversible increments" directive.*
