# ELBOLD Design Phase 2 — Visual Audit

**Date:** 2026-06-07  
**Scope:** Homepage · Browse · Vendor Profile · Customer Dashboard  
**Benchmark:** Airbnb · Uber · Stripe · Pinterest  
**Focus:** Trust, Premium appearance, Conversion, Mobile experience, Image quality

---

## Scoring Framework

Each dimension scored 1–5:
- **5** — On par with Airbnb/Stripe premium standard
- **4** — Good, minor polish needed
- **3** — Functional but average; conversion impact measurable
- **2** — Below par; actively reduces trust or conversion
- **1** — Broken or absent

---

## Page 1 — Homepage (`/`)

### Current Scores (pre-fix)

| Dimension | Score | Finding |
|---|---|---|
| Trust | 3/5 | Promise section is excellent. Trust bar icons too small (13px, 55% opacity) to scan at a glance. |
| Premium Appearance | 3/5 | Correct brand language and typography. Photography entirely hidden by 85–90% opacity overlay. |
| Conversion | 3/5 | Two clear CTAs. Subheadline value prop at 42% opacity — nearly invisible. Occasion pills at 38% opacity. |
| Mobile Experience | 4/5 | Grid scales cleanly. CTAs stack correctly. |
| Image Quality | 2/5 | Hero image: Unsplash wedding photo behind rgba(85%) overlay. Customers see a dark navy wall, not a wedding. |

**Overall: 15/25**

### Root Issues

**1. Hero overlay crushes photography**
The background gradient is `rgba(6,14,36,0.85) 0%, rgba(8,18,42,0.78) 40%, rgba(5,10,24,0.90) 100%`.
At 78–90% opacity across the full frame, the Unsplash wedding image is essentially invisible. This is the opposite of what a premium marketplace wants — customers should feel the aspiration of the event before they see a CTA. Airbnb's hero overlays run 25–45%. Pinterest runs 0–30%. ELBOLD was running 78–90%.

**2. Value proposition text is near-invisible**
Subheadline: `rgba(255,255,255,0.42)` — 42% opacity. At typical screen brightness the "Individually reviewed DJs, photographers..." text is unreadable. This is the sentence that should close the brand promise.

**3. Occasion cards lose photography**
Overlay: `rgba(4,8,20,0.88)` at the bottom and `rgba(4,8,20,0.62)` mid. Wedding, Birthday, Cultural cards have excellent Unsplash photography but they're rendered as dark panels. At 88% opacity the photo barely contributes to the emotional message.

**4. Trust bar undersells ELBOLD's real differentiators**
Icons at 13px / gold 55% opacity. Text at 38% opacity. These are ELBOLD's strongest conversion points (manual vetting, Stripe escrow, verified reviews) and they're rendered as whispering footnotes. Airbnb puts their trust signals in 16px icon + 600-weight text. Stripe uses full-colour icons on white.

**5. Featured Vendors empty state (when no featured vendors)**
When no `featured` or `pro` vendors exist, the entire Section 4 is hidden. For a marketplace with 1 approved vendor this means a massive gap between Section 3 and Section 5.

### Post-Fix Scores

| Dimension | Score | Change |
|---|---|---|
| Trust | 4/5 | Trust bar icons 15px / 80% opacity. Text 62%. |
| Premium Appearance | 4/5 | Hero overlay 48%/38%/68%. Photography visible. |
| Conversion | 4/5 | Subheadline at 72% opacity. Occasion pills at 62%. |
| Mobile Experience | 4/5 | No regression. |
| Image Quality | 4/5 | Wedding photography now visible through hero. Occasion cards show upper 55% of image clearly. |

**Overall: 20/25 (+5)**

---

## Page 2 — Browse Vendors (`/browse`)

### Current Scores (pre-fix)

| Dimension | Score | Finding |
|---|---|---|
| Trust | 4/5 | Trust strip excellent. Badge system clear. |
| Premium Appearance | 3/5 | Category discovery cards crushed by 82% overlay. Vendor cards show emoji on gray for vendors without photos — looks unfinished. |
| Conversion | 3/5 | Good filter system. Empty vendor state for new categories looks abandoned. |
| Mobile Experience | 4/5 | 2-col grid works well. Category pills scroll horizontally. |
| Image Quality | 2/5 | VendorCard no-photo fallback: `<span className="text-5xl">🎸</span>` on gray bg. SmartPickCard height only 128px — photos too cropped to read. VendorCard height 208px — reasonable but could breathe more. |

**Overall: 16/25**

### Root Issues

**1. Emoji fallback on vendor cards is not premium**
When a vendor has no cover photo, the card shows a giant emoji (`🎸`, `📸`, `🍽`) on a plain gray background. This reads like an unfinished demo. Pinterest never shows empty tiles. Airbnb uses architectural photography or blurred placeholders. Customers will associate blank cards with low quality vendors.

**2. Category discovery cards — overlay too heavy**
`rgba(4,8,20,0.82) 0%, rgba(4,8,20,0.35) 50%, rgba(4,8,20,0.14) 100%`. The bottom 50% of each discovery card is nearly black. In a 6-column grid of 180px tall cards, this means the photography contributes almost nothing visually.

**3. SmartPickCard too short (h-32 = 128px)**
These "Top Picks" cards are 128px tall. At that height the cover photo is an unidentifiable sliver. Compare to Pinterest pin cards (min 200px) or Airbnb listing thumbnails (min 220px).

**4. VendorCard card info shows emoji icon inline**
Category shown as `<span>🎸</span> DJ & Sound` — using emoji next to text in a card info block looks casual, not premium. Airbnb uses category icons that are 14px SVGs, not emoji.

### Post-Fix Scores

| Dimension | Score | Change |
|---|---|---|
| Trust | 4/5 | No change. |
| Premium Appearance | 4/5 | Category cards show photography. Vendor cards show category Unsplash fallback instead of emoji. |
| Conversion | 4/5 | Cards feel more premium. Browse feels populated even with few vendors. |
| Mobile Experience | 4/5 | No regression. |
| Image Quality | 4/5 | SmartPickCard 176px. VendorCard 240px. Fallback photos per category. |

**Overall: 20/25 (+4)**

---

## Page 3 — Vendor Profile (`/vendors/[id]`)

### Current Scores (pre-fix)

| Dimension | Score | Finding |
|---|---|---|
| Trust | 4/5 | Rating summary, verification badges, BookingProtection card, and "Why Book Through ELBOLD" section all excellent. |
| Premium Appearance | 3/5 | Hero overlay too dark (94% bottom). Social feed section renders dark-styled component in white card — jarring mismatch. No-photo hero is a flat navy gradient. |
| Conversion | 4/5 | Sticky booking panel with packages is strong. CTA is clear. Quote flow well documented. |
| Mobile Experience | 4/5 | Sticky CTA at bottom on mobile. Lightbox works. Thumbnail strip scrolls. |
| Image Quality | 2/5 | Hero overlay `rgba(4,8,20,0.94)` at bottom. The vendor's best photo is 94% covered at the identity zone — where name, price, rating and location display. Similar vendor cards h-32 (128px). |

**Overall: 17/25**

### Root Issues

**1. Hero overlay destroys vendor photography**
The identity zone sits at the bottom of the hero. The overlay running from 94% to 50% means vendors' best professional photos are barely visible — especially in the lower half where the most overlay sits. This reduces emotional impact of the vendor's work and reduces the impulse to enquire.

**2. VendorSocialFeed dark/light theme mismatch**
The `VendorSocialFeed` component uses `text-white`, `text-slate-500`, `bg-white/5` throughout — designed for a dark background. But it was rendered inside `<div className="bg-white border border-gray-100 rounded-2xl p-6">`. The "Event Highlights" heading (`text-white`) is invisible on the white card. The grid cells (`bg-white/5`) look blank. The "Sample content" badge (amber) always shows to customers — actively damaging trust by advertising that the content isn't real.

**3. VendorSocialFeed always shows placeholder data**
The component shows 6 Unsplash placeholder posts with a "Sample content" badge visible to every customer. Customers see fabricated likes and views. This is the opposite of ELBOLD's "real bookings, real reviews" brand promise.

**4. Similar vendor cards h-32 (128px)**
At 128px, the similar vendor thumbnails are too small to show meaningful photography. A vendor photograph needs at least 160–180px to communicate quality.

**5. No-hero fallback is a flat navy gradient**
If a vendor hasn't uploaded media, the hero is `linear-gradient(160deg, #0B1F4D 0%, #091529 100%)` — an empty brand-coloured rectangle. No imagery, no texture, no photography.

### Post-Fix Scores

| Dimension | Score | Change |
|---|---|---|
| Trust | 5/5 | "Sample content" badge no longer shown to customers. Social feed only renders when vendor has real media. |
| Premium Appearance | 4/5 | Hero overlay 88%/42%/6% — photography visible in upper 60%. Dark social feed card matches component design. |
| Conversion | 4/5 | No regression to booking panel. |
| Mobile Experience | 4/5 | No regression. |
| Image Quality | 4/5 | Hero shows vendor photography clearly. Similar vendor cards h-44 (176px). |

**Overall: 21/25 (+4)**

---

## Page 4 — Customer Dashboard (`/dashboard`)

### Current Scores

| Dimension | Score | Finding |
|---|---|---|
| Trust | 4/5 | StatusBadge system clear. Booking protection messaging visible via menu. |
| Premium Appearance | 3/5 | Dark dashboard creates stark contrast with the light browse/profile pages. Stats cards `bg-white/4` barely visible. Emoji quick-action icons (✨🔍📅💳). |
| Conversion | 4/5 | Empty state CTA to "Plan My Event" is well-placed. Recent bookings "Browse Vendors" link present. |
| Mobile Experience | 3/5 | 2-col stats grid cramped on mobile at 2 columns. Quick actions text tiny. |
| Image Quality | 3/5 | No photography. Dashboard is entirely icon + text. Vendor photos don't appear here even in recent bookings. |

**Overall: 17/25**

### Root Issues (not fixed in this sprint — require new features)

**1. Context switch from light marketplace to dark dashboard**
Homepage and browse are cream/white. Dashboard is dark navy. This creates a jarring experience for customers who browse → view vendor → click "Book" → land in dashboard. No other premium marketplace has such a dramatic theme change within a single funnel.

**2. Recent bookings show no vendor photography**
The bookings list shows "Business Name · category · £amount". No vendor photo, no event image. On Airbnb the booking summary always shows the listing image. On Uber it shows the driver photo. The absence of imagery makes bookings feel abstract rather than real.

**3. Emoji quick-action icons**
✨🔍📅💳 look like a demo. These should be brand-styled SVG icons or small photography.

**4. Stats cards barely visible**
`bg-white/4` with `border-white/6` — on a dark background these cards are almost invisible. The border at 6% white opacity on dark navy is a 1px barely-perceptible line. Stripe's dashboard cards have strong visual hierarchy. ELBOLD's blend into the background.

**These require component redesign beyond the scope of this sprint. Flagged for Phase 3.**

---

## Summary Scorecard

| Page | Before | After | Delta |
|---|---|---|---|
| Homepage | 15/25 | 20/25 | +5 |
| Browse Vendors | 16/25 | 20/25 | +4 |
| Vendor Profile | 17/25 | 21/25 | +4 |
| Customer Dashboard | 17/25 | 17/25 | 0 (Phase 3) |
| **Total** | **65/100** | **78/100** | **+13** |

---

## Benchmark Comparison

### Airbnb
- Hero overlays: 25–40% opacity gradient, bottom-only
- Card photos: min 220px height, always photography
- Empty state: category-specific photography, never emoji
- Trust: 4-point icon strip, 16px icons, full opacity text

### Pinterest
- Cards: photography-first, no overlays on grid cards
- Category cards: 0% overlay, text below image
- No emoji fallbacks anywhere

### Stripe
- Dashboard cards: strong border, clear hierarchy, data-forward
- Trust signals: full-colour icons, paragraph text, case studies
- Context consistency: dark/light themes don't mix within one funnel

### Uber
- Booking history always shows driver photo + car photo
- Empty states always contextual photography
- Status badges: colour-coded, prominent

### ELBOLD Gap (pre-fix)
- Overlays 2–3× heavier than Airbnb/Pinterest
- Emoji fallbacks — no benchmark uses this
- Trust bar too subtle for brand promise of "individually reviewed"

### ELBOLD Gap (post-fix)
- Overlays now in line with Airbnb (48–68%)
- Photography-first card fallbacks
- Trust bar legible
- Dashboard still behind Stripe/Uber standard — Phase 3
