# ELBOLD ENTERPRISE DESIGN PROGRAMME
## EDP-01 — Customer Experience: The Homepage as a Trust Relationship
**Prepared:** 2026-07-10 | **Classification:** Implementation Blueprint — Enterprise Design Programme
**Status:** Governance-compliant, not governance. This document proposes how to build; it does not change what ELBOLD is permitted to build. Every recommendation is subordinate to `ELBOLD_CONSTITUTION.md` and must be re-checked against the Decision Filter before implementation.

---

> The Constitution answers *what ELBOLD is for*. The 2030 Strategy answers *what ELBOLD becomes*. This document answers one narrower question: **what does a person feel, in order, in the first three minutes on elbold.com, and does that feeling make them trust ELBOLD with something that matters to them?**
>
> This is not a feature list. A feature list describes what exists. This document describes what a visitor experiences — the emotional sequence, not the component inventory.

---

## SECTION 1 — WHY THIS DOCUMENT EXISTS

Every recommendation in this document is tested against six questions before it is written down. A recommendation that cannot answer all six is not included.

1. **Why does this exist?**
2. **Which commercial problem does it solve?**
3. **How does it improve customer trust?**
4. **How does it improve vendor success?**
5. **How does it increase recurring revenue?**
6. **How will success be measured?**

The homepage is the single highest-leverage page ELBOLD owns for one reason the Constitution and 2030 Strategy both already establish: it is where a stranger decides, in silence, whether ELBOLD is a platform worth trusting with a wedding, a christening, a funeral reception, a child's birthday, or a company's reputation at its annual dinner. Nothing downstream — no verification badge, no review count, no commission rate — matters if this first decision goes the wrong way.

---

## SECTION 2 — THE CURRENT EXPERIENCE, HONESTLY

This section is grounded directly in the live code (`app/page.tsx`, read in full 2026-07-10) and the fresh Public Pages experience audit. It is not a criticism of the people who built it — the current homepage is competent, professional, and converts. It is a description of the gap between "competent" and "the thing this document is asked to build."

**What a visitor feels today, in order:**
1. A navy-and-gold typographic hero: *"Find Trusted Professionals For Every Occasion."* Correct, calm, slightly corporate.
2. A four-step "How It Works" — functional, procedural.
3. A category grid (Photographers, DJs, Decorators, Catering, Live Music, Venues).
4. A trust bar: five short claims (reviewed, real reviews, Stripe, refund, UK-based).
5. Six occasion cards with stock photography: **Weddings, Birthdays, Corporate, Baby Showers, Anniversaries, Cultural Celebrations.**
6. A featured-vendor grid (visible only once ≥1 approved vendor exists).
7. A concierge invitation.
8. **"The Elbold Promise"** — a dark navy section, six rule cards, phrased almost entirely as constraints: *"No vendor joins automatically. No review is unverified. No payment is unprotected."*
9. A vendor-recruitment block: *"Keep 90% of every booking... No monthly subscription to get started."*
10. A closing CTA repeating the hero.

**Named gaps against this document's brief:**

- **No religious or faith occasion is represented anywhere** — not in the occasion showcase, not in quick-starts, not in category framing. For a platform explicitly asked to serve "religious events" alongside weddings and birthdays, this is not a copy oversight; it is an entire audience currently told, by omission, that ELBOLD was not built with them in mind. Christenings, communions, bar/bat mitzvahs, Eid celebrations, and church/mosque/temple hall bookings are real, recurring, high-trust-sensitivity events with real vendor categories (caterers, decorators, photographers, venues) already live on the platform.
- **The dominant emotional register is procedural, not warm.** Six of ten sections are built around rules, protections, and constraints ("No X. No Y. No Z."). This is trust-through-legalism, not trust-through-feeling. It answers "will I be protected if something goes wrong" before it answers "does this person planning my daughter's christening understand what this day means to me."
- **The vendor section on the customer's own homepage is 100% commission-framed** ("Keep 90%... no monthly subscription") — a direct visual contradiction of the business-platform-first subscription thesis this whole document set has just spent three governing documents establishing. A customer who scrolls past this section learns, incidentally, that ELBOLD thinks of itself as a lead marketplace — the opposite of what EDP-02 (vendor acquisition) is about to argue the platform actually is.
- **No human storytelling anywhere.** Every image is unpeopled stock photography with a gradient overlay. There is no sentence on the entire page written in a customer's own voice, no named moment ("Sarah's 60th," "the Okafor wedding"), nothing that signals ELBOLD has been present at a real occasion that mattered to a real family.

None of this means the current page is wrong to exist. It means the page currently optimises for *credibility* (a rational, checklist-driven trust) and under-invests in *warmth* (an emotional, felt trust) — and this brief specifically asks for both, in balance, because an event that matters is not a rational purchase.

---

## SECTION 3 — THE REDESIGNED EXPERIENCE

Organised as a sequence of moments a visitor moves through, not a list of sections to build. Each moment states the feeling it must produce before it states anything about layout.

---

### MOMENT 1 — Arrival: "This was made for what I'm planning"

**The feeling:** Within two seconds, a visitor should recognise their own occasion in the page, not just the category of business the page operates in.

**The change:** Replace the single generic headline ("Find Trusted Professionals For Every Occasion") with a headline that names the occasion the visitor is closest to having in mind, using signal already available at the moment of arrival — referral source, `?event=` query param if present from a shared link, or a rotating set of specific occasion names ("...for the wedding you've been picturing," "...for the christening that means everything," "...for the birthday she'll actually remember") rather than one abstract noun ("occasion") standing in for all of them. Fall back to a warm, specific default when no signal exists — not the current corporate default.

The trust language currently crammed into the hero subheadline ("every payment protected") moves down to Moment 3, where it belongs — proof follows warmth, it does not lead it.

| Test | Answer |
|---|---|
| Why does this exist? | The first sentence a stranger reads is currently written for every occasion at once, which reads as written for none of them specifically. |
| Commercial problem | Bounce rate on first-time, non-branded-search arrivals — a category-generic headline gives a visitor no reason to keep scrolling versus leaving for a named-occasion Google result. |
| Customer trust | Specificity reads as expertise. "We know what a christening needs" is a stronger trust signal than "we have vendors for every occasion." |
| Vendor success | A visitor who feels understood converts to a quote request faster, which is the entire top of the funnel every vendor depends on regardless of subscription tier. |
| Recurring revenue | Every additional customer who completes a first booking is a candidate for the 2030 Strategy's Customer Lifetime Phase 5 (Return) — the funnel only compounds if entry conversion improves first. |
| Success metric | Scroll-past-hero rate and time-to-first-interaction (browse click, occasion chip click, or concierge click), measured pre/post. |

---

### MOMENT 2 — "Who is this for?": Occasion Discovery, Made Actually Complete

**The feeling:** Every visitor, regardless of what they're planning, sees themselves represented within the first screenful of scrolling — not eventually, not in a footer link.

**The change:** Add a seventh occasion to the existing six (Weddings, Birthdays, Corporate, Baby Showers, Anniversaries, Cultural Celebrations): **Religious & Family Milestones** — christenings, communions, bar/bat mitzvahs, Eid and other faith celebrations, memorial and remembrance gatherings. This is not a token category card; it is a real gap against real, already-supported vendor categories (caterer, decorator, photographer, venue hire), and its absence is currently an implicit statement about who ELBOLD is for.

Photography and copy for this category must avoid depicting a single faith tradition as representative of all of them — the honest solution is warm, occasion-neutral imagery (a decorated hall, a family table, hands lighting candles) rather than iconography specific to one religion, so the card reads as inclusive rather than narrowly targeted.

| Test | Answer |
|---|---|
| Why does this exist? | The brief explicitly requires the homepage to be appropriate for religious events; the current page has zero representation of this occasion class. |
| Commercial problem | An entire segment of UK event spend (christenings, faith celebrations, memorial gatherings) currently has no entry point into the marketplace from the homepage. |
| Customer trust | A visitor planning a religious occasion who sees no reference to it reasonably concludes the platform wasn't built with their occasion in mind — this is a trust failure of omission, not commission. |
| Vendor success | Caterers, decorators, and venues already on the platform who serve this occasion type currently have no homepage discovery path driving enquiries to them. |
| Recurring revenue | New occasion-type demand widens the top of the marketplace funnel without requiring a single new vendor category to be built. |
| Success metric | New occasion-tagged browse sessions and quote requests originating from this card, tracked from zero (there is no current baseline because the category doesn't exist yet). |

---

### MOMENT 3 — Trust, Earned Not Declared

**The feeling:** A visitor should feel *reassured*, not *warned*. The current "Elbold Promise" section is written almost entirely in the negative ("No X. No Y. No Z.") — six rules stated as prohibitions. Prohibitions protect ELBOLD's legal position; they do not comfort a parent booking a photographer for a child's christening.

**The change:** Reframe the same six underlying facts (human vendor review, Stripe-protected payment, booking-gated reviews, full refund on vendor cancellation, UK-only vendors, published standards) from constraint language into outcome language — what the customer *gets*, not what ELBOLD *forbids itself* from doing. "No vendor joins automatically" becomes something closer to "every professional you see here was personally reviewed by our team before their profile went live" — same fact, told as care rather than policy. This is a copywriting change, not a new capability; every fact stated remains exactly and only what is true today (Constitution Principle 11, Commercial Honesty — nothing here should imply more than the platform delivers).

The section should also move earlier relative to the vendor-recruitment block, not later — proof of trust belongs adjacent to the discovery moment, not after the page has already pivoted to recruiting vendors.

| Test | Answer |
|---|---|
| Why does this exist? | Trust content that reads as legal defence rather than customer care under-performs its own evidence. |
| Commercial problem | A visitor who feels lectured rather than reassured is more likely to abandon before requesting a quote, regardless of how genuinely strong the underlying trust architecture is. |
| Customer trust | Reframing constraint-as-care increases felt trust without changing a single underlying fact — this is presentation, not embellishment, and stays inside Constitution Principle 11. |
| Vendor success | Every vendor's professionalism is validated by the same trust architecture; framing it warmly makes that validation land, rather than being scrolled past as boilerplate. |
| Recurring revenue | Higher quote-request conversion from this section compounds into more first bookings, which is the entry point to every later-lifecycle revenue phase in the 2030 Strategy. |
| Success metric | Scroll-depth completion and quote-request click-through rate for sessions that reach this section, A/B tested against the current constraint-framed copy. |

---

### MOMENT 4 — Concierge as a Relationship, Not a Fallback

**The feeling:** A visitor who doesn't know where to start should feel invited into a relationship with a real person, not offered a form as a consolation prize for being unable to self-serve.

**The change:** The 2030 Strategy (Section 5.5) already identifies the concierge service as underutilised and names the correct long-term framing: *"treat every concierge enquiry as a lifetime customer acquisition, not a one-off request."* The homepage's current concierge section is positioned and worded correctly in isolation but sits between the featured-vendor grid and the trust section — visually a mid-page afterthought rather than a genuine second front door. Elevate its framing to match Moment 1's specificity: name the kind of person who benefits most from it (a first-time parent planning a christening with no idea where to start; someone organising a parent's 80th who has never booked an event professional before) rather than leaving it generic ("Not sure where to start?").

| Test | Answer |
|---|---|
| Why does this exist? | A meaningful share of visitors, especially for once-in-a-lifetime or religious/family-milestone occasions, do not want to self-serve a marketplace — they want a human recommendation. |
| Commercial problem | An underused, correctly-built feature is a wasted acquisition asset — the 2030 Strategy already flags this as underutilised without prescribing a fix. |
| Customer trust | A named, specific invitation ("planning a christening with no idea where to start?") reads as understanding, not as a generic customer-service fallback. |
| Vendor success | Concierge-matched customers arrive at a vendor's profile pre-qualified by a human, which the Vendor Value Blueprint's lead-scoring logic already treats as higher-intent. |
| Recurring revenue | The 2030 Strategy explicitly frames concierge as the seed of a lifetime customer relationship — first-event concierge customers become second-event self-service customers over time. |
| Success metric | Concierge submission rate and, longitudinally, the return rate of concierge-originated customers for a second event (requires the customer-lifecycle instrumentation this document set has already flagged as absent). |

---

### MOMENT 5 — Vendor Discovery on the Customer's Own Homepage

**The feeling:** A customer who reads the "For Event Professionals" section should come away thinking "this is a serious business platform, and that's part of why I trust it with my event" — not "oh, this is also a gig marketplace for freelancers."

**The change:** This is the most commercially consequential fix in this document, because it is a direct contradiction currently live in production, not a missed opportunity. The current section reads: *"Keep 90% of every booking you receive... No monthly subscription to get started. No hidden platform fees. We earn when you earn."* Every one of the three governing documents committed this session argues the opposite positioning: ELBOLD is a business operating platform with a marketplace attached, not a marketplace with some tools attached. A customer who reads this section is being told, by ELBOLD itself, that vendors here are commission-only gig workers — which undercuts the very professionalism and permanence the trust sections above it are trying to establish.

Rewrite this section to reflect what a customer should believe about the professionals they're browsing: these are people who run real, ongoing businesses — with their own CRM, their own calendar, their own verified track record — of which ELBOLD's marketplace is one channel among several. This does not require removing the commission fact (it remains true and should stay disclosed, per Commercial Honesty); it requires it stop being the *entire* pitch.

| Test | Answer |
|---|---|
| Why does this exist? | This section currently actively contradicts the platform's own governing commercial thesis, in front of every customer, on the highest-traffic page. |
| Commercial problem | A customer who believes they're booking a side-hustle vendor trusts the booking less than a customer who believes they're booking an established local business. |
| Customer trust | Professionalism framing (real business, real CRM, real track record) is a stronger trust signal for an important event than a gig-economy framing. |
| Vendor success | Vendors are, on their own customer-facing homepage, currently being described in terms that undersell the seriousness of their business — this affects how customers approach the enquiry, not just how vendors feel about it. |
| Recurring revenue | Correct positioning here is upstream of and reinforces EDP-02's fix to `/founding-vendors` — a customer and a prospective vendor should encounter the same story about what ELBOLD is, not two contradictory ones. |
| Success metric | Qualitative: a copy audit confirming zero customer-facing page describes vendors as commission-only. Quantitative: no direct metric on this page alone, but track quote-to-booking conversion rate as a downstream signal of customer confidence in vendor seriousness. |

---

### MOMENT 6 — Leaving Without Losing Them

**The feeling:** A visitor who doesn't convert on this visit should leave with a specific reason to come back, not a generic goodbye.

**The change:** The current closing CTA repeats the hero verbatim ("Every event deserves professionals you can trust completely... Plan My Event / Browse Professionals"). This is fine as a safety net but does nothing the hero didn't already do. Replace repetition with a bridge to the next visit: surface the occasion-specific browse link the visitor actually engaged with (if they clicked "Weddings," the closing CTA should say "Continue exploring wedding professionals," not restate the generic pair) — a small, low-cost personalisation that treats the visit as a continuing relationship rather than a single pass-fail conversion attempt.

| Test | Answer |
|---|---|
| Why does this exist? | A generic closing CTA wastes the one piece of information the page has gathered about this specific visitor — what they clicked. |
| Commercial problem | Non-converting sessions currently leave with no memory of visitor intent, requiring them to re-orient from zero on any return visit. |
| Customer trust | Continuity ("pick up where you left off") reads as attentiveness rather than a marketing funnel. |
| Vendor success | A returning visitor who resumes browsing a specific category reaches relevant vendor profiles faster, improving enquiry quality. |
| Recurring revenue | Directly serves the 2030 Strategy's Customer Lifetime Phase 4→5 (Dormant→Return) — the cheapest possible version of that mechanism, requiring no new backend capability. |
| Success metric | Return-visit rate within 7 days for sessions that did not convert on first visit. |

---

## SECTION 4 — RHYTHM, NOT UNIFORM WHITESPACE

The brief is explicit: *"Do not simply reduce whitespace everywhere. Establish intentional rhythm and make every section earn its space."* Applied concretely to the ten current sections:

**Sections that should compress:** How It Works (currently a full-width 4-column section with generous padding for four short sentences — this is oriented content, not persuasion content, and can run tighter). The trust bar (five short claims already read in under two seconds; its current padding treats it as a hero-weight section).

**Sections that should expand:** The occasion showcase (Moment 2) earns more space once it correctly represents every occasion type, including the new religious/family-milestone card — this is the page's actual "who is this for" answer and deserves the visual weight the brief asks for. Moment 4 (concierge) earns more space if rewritten with the specificity recommended above — a generic concierge pitch deserves modest space; a named, specific invitation earns more.

**The test for every section, going forward:** does this section change what the next section is allowed to assume the visitor already believes? "How It Works" and the trust bar both currently repeat facts established elsewhere on the page (payment protection appears in the hero, the trust bar, and the Promise section — three times). Sections that only repeat an already-established fact are compression candidates regardless of how well-designed they are in isolation.

---

## SECTION 5 — WHAT THIS DOCUMENT DELIBERATELY DOES NOT PROPOSE

Consistent with the Constitution's "What ELBOLD Never Builds" and the 2030 Strategy's discipline against scope creep:

- No new CMS, blog engine, or content-authoring system to support "emotional storytelling" — start with real vendor/customer stories manually curated by the team (a documents-and-copy exercise), not new infrastructure. Build the infrastructure only once manual curation proves the content converts.
- No AI-generated imagery or copy personalisation beyond the simple, deterministic query-param/referral-based headline variants in Moment 1 — this stays inside EDR-06/Constitution's AI caution and the "no AI customer-facing tools before Year 3" strategic decision.
- No redesign of `/browse`, `/vendors/[slug]`, or the footer/navigation structure — those are EDP-03's and future EDP documents' scope. This document is homepage-only.
- No new occasion categories beyond Religious & Family Milestones — six existing plus one genuine gap is the correct, evidence-based scope; inventing further categories without a named gap would be exactly the "feature list" instinct this document is asked to avoid.

---

## SECTION 6 — HOW SUCCESS IS MEASURED, TAKEN TOGETHER

No single metric validates a homepage redesign; the six per-moment metrics above should be read as one instrument, not six separate experiments. The composite signal that matters: **does a first-time visitor who arrives with no branded search intent complete a quote request or concierge submission at a materially higher rate than today** — everything in this document is in service of that one number, and every recommendation above states, individually, which part of the sequence it is responsible for moving.

Baseline for comparison: current production has near-zero organic customer traffic (per `ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md` Section 0, 2026-07-10 refresh) — meaningful measurement of this redesign's effect will require either a controlled test against Master Growth OS-driven traffic, or waiting until organic volume is large enough to be statistically meaningful. This is stated honestly rather than promising measurement that current traffic volume cannot yet support.

---

*Companion documents: `ELBOLD_CONSTITUTION.md` (governs what may be built), `ELBOLD_2030_STRATEGY.md` (Customer Lifetime Strategy, Section 5, is the strategic parent of this document), `ELBOLD_MARKET_AND_COMPETITOR_RESEARCH.md` (competitive evidence for warmth-over-procedure positioning).*

*Next in series: EDP-02 (Vendor Acquisition Experience), EDP-03 (Vendor Public Profile & Daily Platform Experience), EDP-04 (Brand & Language System).*
