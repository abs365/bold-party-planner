# Phase 51 — Elbold Parent Brand Repositioning Proposal

**Date:** 2026-06-10  
**Type:** Design and positioning proposal — no implementation  
**Review required before any changes are made**

---

## Executive Summary

Elbold is currently positioned as a luxury events marketplace. The brand language, hero image, navigation, and metadata all communicate a single vertical: events. The objective of this phase is to lift the brand one level — to communicate that Elbold is a trusted professional marketplace, of which events is the first (and current) category.

The infrastructure does not need to change. The trust system, RBAC, vendor onboarding, and booking flow are all category-agnostic already. Only the presentation layer requires repositioning.

The changes required are smaller than they appear. One line in the hero, one headline, one navigation label, one hero image, and the page metadata. Everything else follows.

---

## 1. Brand Assessment — Current Homepage

### What the homepage currently communicates

A visitor landing on www.elbold.com today sees:

**Logo:** "Elbold" — clean wordmark, navy. Correct and ready for parent brand positioning.

**Hero brand line:**  
`ELBOLD EVENTS · UNITED KINGDOM`

**Headline:**  
`Every Celebration Deserves Extraordinary Professionals.`

**Subheadline:**  
`Individually reviewed DJs, photographers, decorators, caterers and more. Every vendor vetted before they join. Every booking protected.`

**Hero image:**  
Unsplash `photo-1519741497674-611481863552` — a wedding reception scene with dancing and warm light. Romantic. Unmistakably a wedding.

**CTA:**  
`Begin Planning`

**Quick-start pills:**  
Weddings · Birthdays · Corporate · Anniversaries · Cultural Events · Baby Showers

**Navigation:**  
Find Vendors · Event Ideas · How It Works

### What this communicates to a first-time visitor

> "This is a luxury wedding and events marketplace. It looks beautiful, but it is for event planning only."

A visitor looking for a personal trainer, a music tutor, a photographer for a headshot session, or a caterer for a corporate function will either: (a) not know whether this platform is for them, or (b) correctly assume it is not.

### What the homepage should communicate

> "This is Elbold — a marketplace where you can find and book trusted, verified professionals. Events are what we do first."

The trust infrastructure, payment protection, verification, and review system are all already there. The copy just needs to describe the platform at the right altitude.

---

## 2. Parent-Brand Positioning Assessment

### The Uber / Airbnb / Stripe model

These brands do not describe their first product in their logo or their homepage headline. Uber does not say "Uber Rides." Airbnb does not say "Airbnb Homes." Stripe does not say "Stripe Payments." They name the platform and let the product speak.

Elbold should operate at the same level. The brand communicates the platform values (trust, verification, quality). The products and categories sit beneath that.

### Current positioning gap

| Element | Current | Target |
|---------|---------|--------|
| Brand line | "ELBOLD EVENTS · UNITED KINGDOM" | "VERIFIED PROFESSIONALS · UNITED KINGDOM" |
| Headline | Celebration-specific | Platform-level |
| Subheadline | Category listing (DJs, photographers...) | Trust-first, category-agnostic |
| Hero image | Wedding scene | Celebration or professional moment |
| Navigation | "Event Ideas" | Category-agnostic label |
| Page title | "Trusted Event Professionals" | "Trusted Professionals" |

### What does NOT need to change

The occasion cards (Weddings, Birthdays, Corporate etc.) are correct below the fold. Events is the current live product. Customers should still be able to browse by occasion. The quick-start pills are fine. What needs to change is the first thing a visitor reads at the top of the page — the brand framing, not the product features.

---

## 3. Logo Assessment and Recommendations

### Current state

The logo situation is better than Phase 51 assumes. A full logo redesign is not required.

**What is currently live:**

| File | Description | Where used |
|------|-------------|------------|
| `elbold-logo-final.svg` | Clean "Elbold" wordmark, navy, system sans-serif 700 | Navbar (light) |
| `elbold-logo-white.svg` | Clean "Elbold" wordmark, white, system sans-serif 700 | Navbar (dark), Footer, Dashboard sidebar |
| `elbold-mark.svg` | "E" lettermark, white on navy square, 64×64 | Login, signup, forgot-password, onboarding, reset |

**Verdict:** The logo is already correct for a parent brand. No crown. No monogram. No decorative element. Clean wordmark only. The brand simplification phase already completed this work.

**One legacy file to deprecate (not in use):**  
`elbold-wordmark.svg` — the old crown + "EB" monogram + all-caps ELBOLD serif design. This file is not referenced anywhere in the app but exists in `/public/brand/`. It should be removed in a future cleanup to avoid confusion.

### Three logo weight options for review

The current wordmark renders in system sans-serif at weight 700. Below are three alternative typographic weight directions, presented as text mockups, should you want to explore them before committing.

---

**Option A — Current (Recommended)**  
System sans-serif, weight 700, mixed case

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   Elbold                                                 │
│                                                          │
│   Renders identically on every device and OS.           │
│   Clean, fast, no FOUT (flash of unstyled text).        │
│   Already live. Already correct.                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Why this works:** Mixed case ("Elbold" not "ELBOLD") reads as a brand name, not an acronym. System font = instant render, no loading delay. 700 weight = confident without being heavy.

---

**Option B — Custom weight exploration**  
Same wordmark, weight 800 or 900 (if switching to a web font)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   Elbold  (weight 800)                                   │
│                                                          │
│   Requires a web font (e.g. Inter, DM Sans, or Outfit). │
│   More distinct at small sizes. Font load overhead.     │
│   Recommended only if adding a web font to the stack.   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Why to consider:** Weight 800/900 with a modern geometric sans (DM Sans, Outfit, Plus Jakarta Sans) gives stronger brand differentiation while remaining clean.

---

**Option C — Wordmark with subtle letter-spacing**  
Current system font, weight 700, letter-spacing 0.04em–0.06em

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   E l b o l d                                            │
│                                                          │
│   Evokes Notion / Linear / premium SaaS.                │
│   Works best at larger display sizes.                   │
│   Smaller sizes may feel loose.                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Why to consider:** Adds distinctiveness without changing the typeface. Risk: at small sizes (navbar at 28px height), spaced letters can appear weak.

### Recommendation

**Keep Option A.** The current logo is already correct. Revisit Option B only if the brand adds a web font for headline typography — at that point, use the same font for the wordmark for visual consistency.

### Logo consistency audit

All four surfaces are consistent:

| Surface | File | Status |
|---------|------|--------|
| Navbar (dark bg) | `elbold-logo-white.svg` | Clean wordmark |
| Navbar (light bg) | `elbold-logo-final.svg` | Clean wordmark |
| Footer | `elbold-logo-white.svg` | Clean wordmark |
| Dashboard sidebar | `elbold-logo-white.svg` | Clean wordmark |
| Auth pages (login, signup) | `elbold-mark.svg` | "E" lettermark — correct for compact auth layout |
| Onboarding | `elbold-mark.svg` | "E" lettermark — correct |
| Email header | `elbold-email-header.svg` | White wordmark on transparent |

No logo changes required. Zero implementation effort.

---

## 4. Hero Brand Line — 5 Options

**Current:**
```
ELBOLD EVENTS · UNITED KINGDOM
```

This is the single most important element to change. It is the first thing a visitor reads on the page.

---

**Option 1 — Recommended**
```
VERIFIED PROFESSIONALS · UNITED KINGDOM
```
Clean. Platform-level. Communicates the core brand promise (verification) and the geography. Does not mention events. Works for any future professional category.

---

**Option 2**
```
TRUSTED PROFESSIONALS · UNITED KINGDOM
```
Warm and broad. "Trusted" is slightly softer than "Verified" — it implies the outcome (you can trust them) rather than the mechanism (they are verified). Either works. Trusted is more emotive; Verified is more specific.

---

**Option 3**
```
VERIFIED · REVIEWED · TRUSTED · UNITED KINGDOM
```
Three-value statement. More detail at the cost of elegance. Works if you want to communicate all three pillars at a glance. The dots create a visual rhythm that can look strong in this small-cap tracking style.

---

**Option 4**
```
THE PROFESSIONAL MARKETPLACE · UNITED KINGDOM
```
Explicit parent-brand statement. States directly what Elbold is. "Marketplace" is a functional word — some audiences respond to it well (they know exactly what they're getting), others find it cold. Strong for B2B-adjacent use cases like corporate or supplier contexts.

---

**Option 5**
```
QUALITY PROFESSIONALS FOR EVERY OCCASION · UNITED KINGDOM
```
Longer. The word "every" does the positioning work — it implies breadth. "Occasion" is more neutral than "event" and includes professional, personal, and social contexts. However, at this font size and tracking, long strings lose visual impact.

### Recommendation

**Option 1** for the initial repositioning. **Option 2** as the alternative if you want warmth over precision.

---

## 5. Headline — 10 Options Ranked by Strength

**Current:**
```
Every Celebration Deserves Extraordinary Professionals.
```

This is a strong line. It is emotional and premium. But "Celebration" narrows the scope to festivities — it does not cover corporate, professional, or functional use cases. "Extraordinary" is a luxury signal that may set expectations the platform's current vendor pool cannot yet meet.

---

**Ranked options:**

**Rank 1 — Recommended**
```
Find Trusted Professionals For Every Occasion.
```
Clear. Action-led. "Every Occasion" is broad without being vague. "Trusted" is the brand promise. Simple enough to work immediately; strong enough to scale. Works for events, corporate, personal, and any future category.

---

**Rank 2**
```
Trusted Professionals. Verified by Us.
```
Two short sentences. The second does the credibility work. Very clean. Platform-level. No category assumption. Works in large type. The period after each phrase creates authority.

---

**Rank 3**
```
The Professionals You Need. Verified Before They Arrive.
```
Conversational but precise. "Before They Arrive" creates a safety feeling without being clinical. Works across event types and professional categories.

---

**Rank 4**
```
Book Verified Professionals With Complete Confidence.
```
Direct. Outcome-focused. "Complete Confidence" is slightly superlative — use it only if the platform consistently earns that. Confidence is a better word than "peace of mind" (overused).

---

**Rank 5**
```
Every Moment Deserves a Professional.
```
Closest to the current line in structure and emotion. "Every Moment" is broader than "Every Celebration" — it includes work, family, personal milestones, not just parties. Slightly abstract but memorable.

---

**Rank 6**
```
Verified Professionals. Transparent Prices. Real Reviews.
```
Three-pillar structure. Functional. Works well if the platform wants to lead with what it does, not what it feels like. Better for conversion-focused markets; slightly cold for premium positioning.

---

**Rank 7**
```
Professionals You Can Trust For the Moments That Matter.
```
"Moments That Matter" is emotional and universal — weddings, graduations, funerals, launches, birthdays. Covers broad ground. Risk: "moments that matter" has become slightly overused in marketing.

---

**Rank 8**
```
The Right Professional For Every Event and Occasion.
```
Functional. Explicit. Includes both "Event" and "Occasion" to cover all bases. Works but lacks brand character. More suited to a search meta description than a homepage headline.

---

**Rank 9**
```
Elbold. The Marketplace Built on Verification and Trust.
```
Self-referential headline (includes the brand name). Works well in a billboard or OOH context. On a homepage where the logo is already visible, the brand name in the headline is redundant. Avoid unless there is a specific brand-awareness objective.

---

**Rank 10**
```
Exceptional Professionals. Verified. Reviewed. Ready For You.
```
Four beats. Good rhythm. The final "Ready For You" brings the message back to the customer. Risk: at large display type, four-beat headlines can feel like a bullet list. Better as supporting copy than a primary headline.

---

## 6. Subheadline — Rewrite

**Current:**
```
Individually reviewed DJs, photographers, decorators, caterers and more.
Every vendor vetted before they join. Every booking protected.
```

**Problems:**
- Lists specific event categories (DJs, photographers, decorators, caterers) which anchors the brand in events
- "And more" at the end implies the list is the primary offering
- Two separate sentence fragments connected by a line break — slightly disjointed
- "Vendor" is an internal/marketplace word — customers may respond better to "professional"

**Rewrite options:**

---

**Option A — Recommended**
```
Every professional individually reviewed before they join.
Every review from a real, confirmed booking.
Every payment protected.
```
Three short parallel statements. Each one is a distinct trust signal. No categories listed. Clean. Works for any professional vertical. The triple structure (Every / Every / Every) creates rhythm and makes each point memorable.

---

**Option B — Single paragraph**
```
We review every professional before they appear on Elbold.
Every review you read came from a real, confirmed booking.
Your payment is held securely until the job is done.
```
More conversational. First person ("we review") adds accountability. Works well for a brand that wants to communicate founder-level personal oversight.

---

**Option C — Trust-forward condensed**
```
Verified professionals. Genuine reviews. Secure payments.
The marketplace built on accountability, not just ratings.
```
Two-line format. The second line does brand positioning work — it implies Elbold is different from generic rating platforms. "Accountability, not just ratings" is a pointed differentiator.

---

**Option D — Minimal**
```
Every professional reviewed. Every booking protected.
```
Shortest possible. Works at large type. Relies on the headline and hero doing the heavier lifting.

### Recommendation

**Option A** for richness and rhythm. **Option D** if the visual design needs to breathe.

---

## 7. Navigation Recommendations

**Current:**
```
Find Vendors   Event Ideas   How It Works
```

### Audit

| Label | Issue | Recommendation |
|-------|-------|----------------|
| Find Vendors | Neutral. "Vendors" is marketplace language — acceptable. Could become "Find Professionals" for parent-brand consistency. | Optional change: "Find Professionals" or keep "Find Vendors" |
| Event Ideas | "Event" is the problem word. This label explicitly positions Elbold as an events platform. | Change required |
| How It Works | Clear and functional. No issue. | Keep |

### Options for "Event Ideas"

**Option 1 — Recommended:** `Inspiration`  
Platform-agnostic. Used successfully by Pinterest, Houzz, and luxury platforms. Works for events, lifestyle, occasions, and any future professional category. No category assumption.

**Option 2:** `Explore`  
Very neutral. Works anywhere. Slightly generic — common in app navigation and may not stand out. Good if the page is expanded beyond event content.

**Option 3:** `Occasions`  
More specific than "Events" but still tied to the events vertical. Use if the page content remains occasion-focused and you are not yet planning to expand to other content types.

**Option 4:** `Ideas`  
Short and conversational. Implies breadth. Could work well at mobile scale where space is limited.

**Option 5 — Keep current for now:** `Event Ideas`  
If the page behind this nav item is genuinely events-only content (which it currently is), keeping the label honest about what the page contains is defensible. Change the label only when the content behind it broadens.

### Additional navigation consideration

The desktop CTA button currently says `Get Quotes`. This is tied to the booking/quoting flow — which is currently events-based. At the parent-brand level, this could eventually become `Find a Professional` or `Browse`. No change recommended now — the quoting flow is what the platform actually offers. Change this when a non-events category launches.

### Full navigation: before and after

**Before:**
```
┌──────────────────────────────────────────────────────────────┐
│  Elbold    Find Vendors   Event Ideas   How It Works         │
│                                        Sign In  Get Quotes   │
└──────────────────────────────────────────────────────────────┘
```

**After (Recommended):**
```
┌──────────────────────────────────────────────────────────────┐
│  Elbold    Find Vendors   Inspiration   How It Works         │
│                                        Sign In  Get Quotes   │
└──────────────────────────────────────────────────────────────┘
```

One word change. The entire nav reads as a platform, not a events directory.

---

## 8. Hero Image Recommendations

**Current image:**  
Unsplash `photo-1519741497674-611481863552`  
A warm wedding reception scene — romantic lighting, dancing, clearly a wedding celebration.

**Problem:**  
This image signals "wedding platform" before any copy is read. A visitor looking for a corporate event photographer or a birthday DJ sees a wedding image and may self-select out.

**Note:** This same image ID also appears as the "Weddings" occasion card. Using the same image for both the hero and the first category card makes the brand feel narrow, as if weddings are the primary product rather than one of many.

### Recommended image directions

These are directions for review — the specific Unsplash ID should be verified live before committing.

---

**Direction 1 — Recommended: Warm crowd scene / celebration energy**  
A crowd at a celebration — raised glasses, people together, warm light, upward energy. Not wedding-specific. Could be a birthday, corporate, or cultural event. Communicates joy and occasion without naming the event type.

Candidate Unsplash IDs to review:
- `photo-1492684223066-81342ee5ff30` (currently used for Cultural Celebrations card)
- `photo-1530103862676-de8c9debad1d` (currently used for Birthdays card)

Neither should be reused from the occasion cards section — same image in hero and card creates visual repetition.

---

**Direction 2: Professional at work — human and warm**  
A professional in their element — a photographer with a camera, a DJ at a setup, a decorator arranging a table. Communicates "skilled professional" rather than "beautiful event." Shifts the brand from venue/occasion to people/service.

This direction is good for the parent brand positioning (Elbold = professionals, not events) but risks feeling less aspirational than a full celebration scene.

---

**Direction 3: Abstract celebration energy**  
Bokeh lights, warm glow, crowd silhouettes — evocative without being specific. Very common on luxury and lifestyle platforms. Risk: feels generic. Benefit: zero category specificity.

---

**Direction 4: Multiple occasions collage (implement later)**  
A split or tiled hero showing multiple occasion types — wedding, corporate, birthday, cultural — in a grid. Communicates breadth immediately. Technically more complex to implement well. Better suited to a future redesign sprint when vendor supply across categories is established.

---

**Direction 5: Keep current image, change the copy**  
The wedding image is beautiful and trust-building. If the headline and brand line change to parent-brand language, the wedding image becomes "one example of what Elbold covers" rather than "what Elbold is." This is the lowest-risk option — no image replacement, only copy changes. The visual contract between image and words is slightly misaligned, but it is not a critical failure.

### Recommendation

**Direction 1 in the short term** — replace with a warm celebration crowd scene that is not visually identifiable as a wedding. Pick an image not currently used on the occasions cards below.

**Direction 5 as the fallback** — if no suitable image is identified quickly, change the copy first. A parent-brand headline over a wedding image is better than a wedding headline over a wedding image.

---

## 9. Page Metadata Recommendations

**Current page title:**
```
Elbold | Trusted Event Professionals Across the UK
```

**Recommended:**
```
Elbold | Trusted Professionals Across the UK
```

One word removed. The SEO signal shifts from "event professionals" to "professionals." Category-specific pages (`/browse?category=photographer`, `/essex/djs`) retain their event-specific metadata — the homepage should not.

**Current description:**
```
The UK's home for verified event professionals. Book trusted DJs, photographers,
caterers, decorators and more for weddings, birthdays, corporate events and
cultural celebrations.
```

**Recommended:**
```
The UK marketplace for verified professionals. Every professional individually
reviewed. Every booking protected. Every review from a real, confirmed booking.
```

Removes category listing from meta description. Emphasises the trust infrastructure rather than the product categories.

---

## 10. Before / After Summary

### Hero — full before and after

**Before:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                  [ WEDDING RECEPTION PHOTO ]                             │
│                                                                          │
│         ─────────  ELBOLD EVENTS · UNITED KINGDOM  ─────────            │
│                                                                          │
│           Every Celebration                                              │
│           Deserves                                                        │
│           Extraordinary                                                  │
│           Professionals.                                                 │
│                                                                          │
│     Individually reviewed DJs, photographers, decorators, caterers      │
│     and more. Every vendor vetted before they join. Every booking       │
│     protected.                                                           │
│                                                                          │
│       [ Begin Planning ]     [ Join As a Vendor ]                       │
│                                                                          │
│   WHAT ARE YOU PLANNING?                                                 │
│   Weddings · Birthdays · Corporate · Anniversaries · Cultural Events    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**After:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│              [ WARM CELEBRATION CROWD SCENE ]                            │
│                                                                          │
│       ─────────  VERIFIED PROFESSIONALS · UNITED KINGDOM  ─────────     │
│                                                                          │
│           Find Trusted Professionals                                     │
│           For Every Occasion.                                            │
│                                                                          │
│     Every professional individually reviewed before they join.          │
│     Every review from a real, confirmed booking.                        │
│     Every payment protected.                                             │
│                                                                          │
│       [ Find a Professional ]     [ Join As a Vendor ]                  │
│                                                                          │
│   WHAT ARE YOU PLANNING?                                                 │
│   Weddings · Birthdays · Corporate · Anniversaries · Cultural Events    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

The occasion cards below the fold remain unchanged. Events is still the product. The frame around it has changed.

### Navigation — before and after

| | Before | After |
|-|--------|-------|
| Link 1 | Find Vendors | Find Vendors (no change) |
| Link 2 | Event Ideas | Inspiration |
| Link 3 | How It Works | How It Works (no change) |
| CTA | Get Quotes | Get Quotes (no change) |

### Metadata — before and after

| | Before | After |
|-|--------|-------|
| Page title | Trusted Event Professionals | Trusted Professionals |
| Description | UK's home for verified event professionals. Book trusted DJs, photographers... | UK marketplace for verified professionals. Every professional individually reviewed... |

---

## 11. Implementation Scope (For Reference When Ready)

All of the above requires changes to exactly three files:

| File | Changes |
|------|---------|
| `app/page.tsx` | Brand line, headline, subheadline, CTA text, hero image, meta title and description |
| `components/layout/Navbar.tsx` | "Event Ideas" → "Inspiration" in `navLinks` array |
| `public/brand/elbold-wordmark.svg` | Archive / remove (not in use, legacy file) |

No database changes. No authentication changes. No migrations. No new routes.

Total implementation time: 30 minutes.

---

## 12. What NOT to Change

The following are correct at the current stage and should not be changed:

- **Occasion cards** (Weddings, Birthdays, etc.) — events is the live product, show it
- **"Find Vendors" nav label** — honest and clear for the current offering
- **"Get Quotes" CTA** — this is what the platform actually does
- **Trust bar** (Every vendor reviewed / Reviews from real bookings / Stripe secured) — already platform-level language
- **Vendor Benefits section** — already written at the right altitude
- **Logo files** — all correct and consistent
- **Any page below the fold** — the repositioning is entirely above the fold

---

## Decision Required

Before implementation, confirm:

1. **Brand line:** Option 1 `VERIFIED PROFESSIONALS · UNITED KINGDOM` or Option 2 `TRUSTED PROFESSIONALS · UNITED KINGDOM`?

2. **Headline:** Rank 1 `Find Trusted Professionals For Every Occasion.` or an alternative from the ranked list?

3. **Subheadline:** Option A (triple parallel structure) or Option D (minimal two-line)?

4. **Hero image:** Direction 1 (new crowd scene), Direction 5 (keep wedding image, change copy only), or another direction?

5. **Navigation:** `Inspiration` or another alternative for "Event Ideas"?

Once confirmed, implementation is approximately 30 minutes.

---

*Document created: Phase 51 — 2026-06-10. Proposal only. No code changes made.*
