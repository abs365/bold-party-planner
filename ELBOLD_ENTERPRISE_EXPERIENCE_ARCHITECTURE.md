# ELBOLD ENTERPRISE EXPERIENCE ARCHITECTURE
**Prepared:** 2026-07-10 | **Classification:** Governing Commercial Architecture — highest tier below the Constitution
**Status:** This document defines the commercial experience. It does not design pages, write copy, or specify implementation. Every future customer- or vendor-facing surface — page, email, onboarding flow, dashboard, or marketing communication — must be checked against this document before design work begins, in the same tier as the Constitution's Decision Filter.
**Subordinate to:** `ELBOLD_CONSTITUTION.md` (authority on what ELBOLD may claim and build). This document is the authority on how every experience across the platform is architected to deliver on that mission — the layer between "what ELBOLD is" and "what any single page does."

---

## 1. ENTERPRISE IDENTITY

### 1.1 ELBOLD's Purpose

The Constitution states the mission in one sentence: *"To give every event professional a platform they can build their business on, and every customer a marketplace they can trust completely."* This architecture exists to make that sentence operational — to ensure that every touchpoint a customer or vendor encounters, individually and in sequence, is built to deliver on one half of it or the other, and ideally both.

ELBOLD is not building a marketplace with tools attached, and it is not building a SaaS platform with a marketplace attached. It is building the company event professionals choose to grow their businesses with, and that customers choose to trust when something important is being planned. Every capability described in this document (§5) exists in service of one of those two outcomes. A capability that serves neither has no place in the platform.

### 1.2 The Relationship Between Customer Trust and Vendor Success

The Constitution's Mission (Section 1) states this relationship directly and it is treated here as the load-bearing fact of the entire architecture: *"Customers who trust ELBOLD bring the bookings that validate the vendor's investment in the platform. Without customer trust, the marketplace produces no revenue. Without marketplace revenue, the vendor sees no return beyond the tools. Without return, the vendor leaves."*

This is not two separate businesses run on shared infrastructure. It is one loop:

```
Customer trust → willingness to book → real transaction volume →
vendor sees marketplace return → vendor's business tools (CRM, analytics,
verification) compound in value → vendor stays and grows → vendor's
continued presence and quality → sustains customer trust
```

Every stage in §2 and §3 of this document exists somewhere on this loop. No experience decision may be made in service of one side of the loop in a way that damages the other — this is Constitution Principle 2 (Vendor Success is the Business Model) applied at the architecture level, not the feature level.

### 1.3 Why the Marketplace Is One Capability Within the Wider Platform

The Constitution's Vision (Section 2) is explicit about what ELBOLD becomes: a platform vendors *build their business on* — CRM, calendar, contracts, invoices, analytics, and a professional public identity, of which the marketplace (customer discovery and booking) is one component, not the whole. `ELBOLD_VENDOR_VALUE_BLUEPRINT.md`'s Stickiness Ladder (§4.3, cited in full at §3.6 below) formalises why this distinction is commercially load-bearing, not philosophical: a vendor whose relationship with ELBOLD is *only* the marketplace (Ladder Level 1-2) has almost nothing keeping them on the platform through a quiet month. A vendor whose business data, calendar, client history, and professional identity live on ELBOLD (Ladder Level 3-6) has genuine switching costs — the marketplace becomes one valuable input among several, not the entire relationship.

This is why every previous programme in this transformation (Programme B's homepage/Founding Vendor reframe, Programme C's Business Control Centre work, this session's Commercial Implementation Programme) has treated "the marketplace sent you a booking" and "the platform makes your business stronger" as two distinct, both-necessary value propositions — never substitutes for each other. The marketplace produces revenue events; the platform produces retention. Both are required; neither is sufficient alone.

---

## 2. CUSTOMER EXPERIENCE ARCHITECTURE

The complete customer belief journey, mapped as seven stages independent of any single page's section boundaries. Each stage states the belief it must produce before anything about the surface that produces it.

### 2.1 Arrival

| | |
|---|---|
| **Desired belief** | "This was made for what I'm planning." |
| **Emotional objective** | Recognition, within seconds, not eventually. |
| **Commercial objective** | Convert a visitor with no branded search intent into a visitor who keeps scrolling rather than returning to a named-occasion search result. |
| **Existing capabilities supporting it** | The homepage hero and occasion quick-start chips; SEO-indexed category × location landing pages (`/essex`, `/kent`, `/london` and their category sub-pages) that let a visitor arrive already matched to a specific need. |
| **Current weaknesses** | Verified in `ELBOLD_ENTERPRISE_HOMEPAGE_TRANSFORMATION_BLUEPRINT.md` §2: the primary arrival surface (the homepage hero) still uses one generic headline for every occasion at once, which reads as written for none of them specifically (EDP-01 Moment 1, unaddressed as of this document). |
| **Future design principles** | Specificity outperforms breadth at the point of arrival. Where a genuine signal exists (referral source, query parameter, prior session activity), the arrival experience should reflect the visitor's actual occasion rather than a category-neutral default. Where no signal exists, the default should be warm and specific to *a* real occasion, not abstract to *all* of them. |

### 2.2 Trust

| | |
|---|---|
| **Desired belief** | "I am safe trusting this platform with something that matters." |
| **Emotional objective** | Reassurance, felt once, clearly — not repeated thinly across multiple surfaces. |
| **Commercial objective** | Convert reassurance into willingness to proceed past browsing into an actual quote request, the highest-leverage single conversion on the customer side of the funnel. |
| **Existing capabilities supporting it** | Human vendor review before any profile goes live (Constitution Principle 1); booking-gated reviews with no exceptions, actively enforced on public display (verified this session: `app/vendors/[id]/page.tsx` filters public reviews to `moderation_status = "approved"`, the fix for a previously real bug where a removed review remained publicly visible); Stripe-processed, deposit-protected payment; a documented, published refunds and cancellation policy; the platform's own trust/guarantee page. |
| **Current weaknesses** | Verified in the Homepage Transformation Blueprint's own new finding: this belief is currently the platform's *most important* and *least effectively delivered* belief, because it is fragmented across three separate surfaces that each restate an overlapping subset of the same facts rather than landing as one strong, felt moment — and its fullest expression is phrased as a list of prohibitions ("No vendor joins automatically. No review is unverified. No payment is unprotected") rather than as care. Separately, `ELBOLD_TRANSFORMATION_GATE_2_REVIEW.md` §2 found that dispute resolution — the mechanism this belief ultimately rests on if something goes wrong — has a real backend and admin queue but no customer-facing form; the live path is an unmonitored email address, not the tracked system built for it. |
| **Future design principles** | State what the customer receives, not what ELBOLD forbids itself from doing — the same underlying fact told as outcome rather than as policy (EDP-04 §2's substitution pattern is the standing rule for this). One trust moment, told well and positioned early, outperforms several thin repetitions positioned throughout the journey. A trust guarantee that depends on a downstream mechanism (dispute resolution, refund processing) must have that mechanism actually reachable by the customer it's promised to, not only by an internal team. |

### 2.3 Discovery

| | |
|---|---|
| **Desired belief** | "My occasion belongs here, and real professionals exist for it." |
| **Emotional objective** | Representation — every visitor, regardless of what they're planning, sees themselves reflected within the first screenful, not eventually or in a footer link. |
| **Commercial objective** | Widen top-of-funnel entry across every occasion type UK event spend actually covers, without requiring a single new vendor category to be built. |
| **Existing capabilities supporting it** | Six occasion categories with dedicated discovery surfaces (Weddings, Birthdays, Corporate, Baby Showers, Anniversaries, Cultural Celebrations); category-based browse; the Featured Vendors surface, which shows real, concrete supply once it exists rather than a fabricated count. |
| **Current weaknesses** | Verified, still open as of this document: no religious or family-milestone occasion (christenings, communions, bar/bat mitzvahs, Eid, memorial gatherings) is represented anywhere on the platform's discovery surfaces, despite real, already-supported vendor categories (caterer, decorator, photographer, venue hire) serving this occasion type today. Independently flagged in `ELBOLD_TRANSFORMATION_GATE_1_REVIEW.md` §1 and the Homepage Transformation Blueprint's §2 as still open. |
| **Future design principles** | An occasion is only genuinely represented if it has a real discovery surface, not a mention in copy. Occasion representation must be occasion-neutral in imagery and language where the audience spans multiple faiths or traditions — inclusive by design, not narrowly targeted at one. Discovery supply proof (Featured Vendors) must remain honestly conditional on real data existing; density-honesty is never traded for the appearance of a fuller marketplace. |

### 2.4 Confidence

| | |
|---|---|
| **Desired belief** | "This specific professional is legitimate, and I can tell why." |
| **Emotional objective** | Confidence transferred from the platform's general trust architecture to one specific vendor a customer is now evaluating. |
| **Commercial objective** | Convert a browsing session into a specific quote request by making one vendor's credibility concrete and checkable. |
| **Existing capabilities supporting it** | Public vendor profiles carrying live verification status, tier badges (ID Verified, Trusted Pro, Premium Partner), rating and review count sourced from the same enforced, booking-gated review system described in §2.2; the four-tier verification system (Reviewed → ID Verified → Documents Reviewed → Elite), published and explained on its own dedicated page. |
| **Current weaknesses** | Verified in the Homepage Transformation Blueprint's new Finding 2: the platform's one surface making subscription-tier vendor quality visible (Featured Vendors) and the platform's one surface pitching that same quality proposition to prospective vendors (the vendor recruitment section) currently never reference each other — a customer or vendor moving between them has to make the connection themselves. |
| **Future design principles** | A trust badge is only as strong as a customer's ability to understand what it means without leaving the page — verification tier meaning should be one hover or one click away, never a separate research task. Concrete, individual proof (a specific vendor's real reviews, real verification level) should always be reachable from any general claim about vendor quality, and vice versa. |

### 2.5 Decision

| | |
|---|---|
| **Desired belief** | "I can choose between these options with confidence, not guesswork." |
| **Emotional objective** | Clarity under choice — comparing several real quotes should feel considered, not overwhelming. |
| **Commercial objective** | Convert multiple quote responses into one accepted booking, and capture visitors who don't want to self-serve the comparison at all. |
| **Existing capabilities supporting it** | Side-by-side quote comparison (`/dashboard/quotes/compare`); the concierge service, which produces a human-recommended shortlist for a customer who prefers a personal recommendation over self-service comparison — already live, already correctly positioned by `ELBOLD_2030_STRATEGY.md` §5.3 as a Phase 1→2 retention tactic. |
| **Current weaknesses** | Verified in the Homepage Transformation Blueprint (EDP-01 Moment 4, unaddressed): the concierge invitation is currently generic ("Not sure where to start?") rather than naming the specific kind of person it serves best (a first-time parent planning a christening with no idea where to start), and is positioned as a mid-page afterthought rather than a genuine second front door into the decision stage. |
| **Future design principles** | The two decision paths — self-serve comparison and concierge-assisted recommendation — should be equally legitimate, equally visible entry points, not a primary path with a fallback bolted on. A named, specific invitation to the concierge service converts better than a generic one because it signals understanding, not customer-service overflow. |

### 2.6 Booking

| | |
|---|---|
| **Desired belief** | "My money and my event are protected from this moment forward." |
| **Emotional objective** | Confidence that converting intent into a paid commitment does not create new risk. |
| **Commercial objective** | Complete the transaction that produces the marketplace revenue every other part of the loop (§1.2) depends on. |
| **Existing capabilities supporting it** | Server-side price and commission computation at the point of booking, replacing an earlier client-trusted flow (Programme A, REG-05, independently verified live via a rolled-back production test); server-enforced availability checking before a booking can be created against a vendor-blocked date (Programme A, REG-03, independently verified live); Stripe-processed deposit payment; a booking management dashboard showing exactly what has been paid and what remains. |
| **Current weaknesses** | Verified in `ELBOLD_TRANSFORMATION_GATE_2_REVIEW.md` §2: the platform's trust copy describes deposits in escrow-holding language ("not released to the vendor until your event has completed"), while the vendor's actual payout mechanic today is a separate, manual bank transfer process — the relationship between what a customer is told about their payment's protection and what actually happens operationally has not been independently confirmed to match, and is flagged there for business confirmation rather than diagnosed as a defect this document can resolve. |
| **Future design principles** | Every claim made about payment protection at the booking stage must be verified against the platform's actual, current payout mechanism before being stated — Commercial Honesty (Constitution Principle 11) applies with particular force at the exact moment a customer is asked to pay. Booking-stage trust claims should never describe the target-state mechanic (e.g. a future Stripe Connect-automated flow) as if it were the current one. |

### 2.7 Relationship

| | |
|---|---|
| **Desired belief** | "ELBOLD remembers this event, and I will start here again next time." |
| **Emotional objective** | Continuity — a completed booking is the start of an ongoing relationship, not the end of a transaction. |
| **Commercial objective** | Move a customer through `ELBOLD_2030_STRATEGY.md` §5.2's Phase 3 (Post-Event) → Phase 4 (Dormant) → Phase 5 (Return) without requiring paid re-acquisition — the cheapest possible source of second-and-later bookings. |
| **Existing capabilities supporting it** | Post-event review prompting (the single most important customer action in the entire lifecycle per §5.4 of the 2030 Strategy, since it compounds trust for every future customer as well as the one giving it); a booking management dashboard that preserves a customer's event history. |
| **Current weaknesses** | The 2030 Strategy's own Phase 4→5 retention tactics (seasonal prompts, anniversary reminders, "your vendors are still on ELBOLD" notifications) are specified as governing strategy but their implementation status was not confirmed in this pass — this document states that as an open verification question, not a settled fact in either direction. The Homepage Transformation Blueprint independently found the page's own closing moment (Final CTA) does not yet personalise based on what a visitor engaged with in-session, the cheapest version of "remembering" a visitor already available. |
| **Future design principles** | A customer relationship does not end at payment confirmation or even at the post-event review — every touchpoint after booking should be evaluated on whether it moves the customer toward Phase 5 (Return), not only whether it closes out Phase 2-3 administratively. Continuity should be demonstrated with information ELBOLD already has (what a visitor clicked, what they booked, when their event was) before any new instrumentation is proposed to manufacture it artificially. |

---

## 3. VENDOR EXPERIENCE ARCHITECTURE

The complete vendor belief journey, mapped as eight stages. Where a stage corresponds to a specific window already studied in `ELBOLD_EDP_05_VENDOR_SUCCESS_JOURNEY.md`'s ninety-day journey, that mapping is stated explicitly.

### 3.1 Discovery

| | |
|---|---|
| **Desired belief** | "This could make my business stronger." |
| **Emotional objective** | Recognition that ELBOLD is infrastructure a serious business would use, not a listings site competing for attention with every other lead-generation app. |
| **Commercial objective** | Filter the applicant pool toward vendors who understand and will pay for business-platform value, rather than vendors chasing free leads who churn the moment marketplace volume is thin (Constitution Principle 2). |
| **Existing capabilities supporting it** | The homepage's vendor-recruitment section — verified this session, already corrected (Programme B, WP-B1) from a pure commission-marketplace pitch to a business-platform-first framing (`VENDOR_BENEFITS` leads with "a business platform, not just a listing"). |
| **Current weaknesses** | New finding, this document: a prospective vendor's first ELBOLD surface is very often the customer homepage as a whole (`ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md` §1), not only its vendor section. A vendor reading the entire page in order encounters several sections written in pure customer-marketplace voice before reaching the section addressed to them — no individual section is wrong, but the cumulative ambient impression partially precedes and can undercut the now-corrected pitch. |
| **Future design principles** | The vendor-belief journey begins at the first sentence a prospective vendor reads on any ELBOLD surface, not only at the section formally addressed to them — consistency of framing across the whole page matters, not just correctness of the one section that names vendors explicitly. |

### 3.2 Evaluation

| | |
|---|---|
| **Desired belief** | "This solves a problem I already have today, regardless of whether ELBOLD sends me a single customer this year." |
| **Emotional objective** | Recognition of immediate, tool-level value independent of marketplace hope. |
| **Commercial objective** | Produce applicants who are retainable subscribers from day one, not applicants who churn the moment marketplace volume disappoints (`ELBOLD_VENDOR_VALUE_BLUEPRINT.md` §3.1). |
| **Existing capabilities supporting it** | The Founding Vendor Programme page — verified as well-built and disciplined: a genuine head-to-head comparison against social media and directories, a four-level verification explainer, an honest standards disclosure, and a real, capped scarcity mechanism (20 places). |
| **Current weaknesses** | `ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md` §2's most consequential finding: the page's commercial framing ("free to list... no required subscription... we earn only when you do") is structurally identical to the promise made by the two platforms with the worst vendor sentiment in the researched competitive set — a genuine contradiction between the page's own comparison table (which correctly differentiates ELBOLD on trust grounds) and its commercial framing (which does not differentiate it from a pure lead marketplace at all). Implementation status of this specific finding was not re-verified as part of this document and should not be assumed resolved without a direct check, the same discipline applied to the homepage finding in §3.1 above. |
| **Future design principles** | The first commercial sentence a prospective vendor reads should lead with the business-platform value already live (CRM, calendar, verification, analytics), never with the absence of a fee — a free entry tier remains correct and should stay available, but it must never be the *opening claim* a recruitment surface makes about itself. |

### 3.3 Registration

| | |
|---|---|
| **Desired belief** | "My time is respected, and this is proportionate to what I'm being asked to commit." |
| **Emotional objective** | Low-stakes momentum — an established business owner filling out an application between client calls should never feel like they've started something disproportionate to the time advertised. |
| **Commercial objective** | Collect application-quality data sufficient for approval without a second data-gathering round trip, which is itself a retention risk. |
| **Existing capabilities supporting it** | A genuine three-step application form with a visible step indicator and an honest "what happens next" sidebar naming exact stage timing. |
| **Current weaknesses** | `ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md` §3: the same marketplace-lead framing recurring at the homepage and Founding Vendor Programme reappears a third time in this form's own "what happens next" copy, at the exact moment of commitment. |
| **Future design principles** | The framing a vendor encounters at the moment of commitment should be the most consistent point in the entire journey with what they were told during discovery and evaluation — registration is not the place to introduce a different story about what ELBOLD is. |

### 3.4 Approval

| | |
|---|---|
| **Desired belief** | "The wait was worth it — this dashboard is real, not a waiting room." |
| **Emotional objective** | Confirmation that every claim made during acquisition is true, tested for the first time in the vendor's own account. |
| **Commercial objective** | Convert a newly-approved vendor's first session into at least one profile-building or CRM action, the highest-leverage single early indicator of retention (`ELBOLD_EDP_05_VENDOR_SUCCESS_JOURNEY.md`, Day 1). |
| **Existing capabilities supporting it** | Full dashboard, profile, media, services, contact, and availability access already live for newly-approved vendors, not gated behind a waiting period; guided onboarding directing a new vendor toward their first CRM contact as the single highest-leverage first action. |
| **Current weaknesses** | EDP-05's Day 1 finding regarding a `response_rate` scale-mismatch corrupting a new vendor's first Business Health view is superseded — the Enterprise Baseline v1.0.1 correction (2026-07-10) established this bug does not exist in production; no corrective action is required at this stage, and no future design work should reintroduce a fix for a defect that was never real. This is stated here to prevent the stale finding from being carried forward into future design work, the same correction already applied at EDP-05's own document level. |
| **Future design principles** | The first dashboard view after approval is the single highest-stakes screen in the vendor journey — every number shown on it must be verified correct before shipping, because a wrong first impression of "health" or "value" is disproportionately hard to reverse later, regardless of how the platform performs afterward. |

### 3.5 Daily Operations

| | |
|---|---|
| **Desired belief** | "ELBOLD tells me what to do next, every day, whether or not the marketplace has sent me anything." |
| **Emotional objective** | The dashboard reads as a business assistant, not a reporting screen — the exact standard this session's Commercial Implementation Programme was run against. |
| **Commercial objective** | Give a vendor something specific and true to act on every time they return, converting habitual return visits into the "no login in 7 days" early-warning window never being triggered. |
| **Existing capabilities supporting it** | The Business Control Centre's Daily Highest-Impact Action — real, branching logic prioritising a controllable business-platform action (a CRM contact) for a vendor with genuinely zero marketplace activity, rather than a marketplace-dependent action with no controllable next step; a unified Revenue view distinguishing confirmed, pipeline, and potential income; a review-volume nudge, verified this session (Commercial Implementation Programme, WP4) to have been structurally unreachable behind an always-present generic fallback and corrected so it fires at the right moment. |
| **Current weaknesses** | Verified this session (Commercial Implementation Programme, WP1-WP5): before this pass, the dashboard's Daily Highest-Impact Action logic and its supporting revenue/operations panels contained real, evidenced defects — duplicate stat displays repeating identical numbers across multiple surfaces, two unreconciled revenue figures with no stated relationship between them, and a subscription-upsell claim ("more bookings with a Pro subscription") that was not grounded in any verified platform fact. Five of these were corrected in this session; one further finding — two different "health score" concepts (Business Health, Governance's own Health Score) shown with the same visual pattern and no stated relationship — was identified and deliberately deferred, not yet resolved. |
| **Future design principles** | Every number shown to a vendor claiming to represent the same underlying concept (revenue, health, activity) must be either the same number everywhere it appears, or explicitly explained as measuring something different — a vendor should never have to reconcile two dashboard panels themselves to understand their own business. Every recommendation surfaced to a vendor must be reachable in practice, not merely present in code — a well-designed candidate that is structurally always outranked by a generic fallback delivers no value regardless of how good its underlying logic is. |

### 3.6 Business Growth

| | |
|---|---|
| **Desired belief** | "My business is measurably better because of ELBOLD, independent of this month's marketplace volume." |
| **Emotional objective** | Visible, accumulating proof of progress that has nothing to do with whether the marketplace produced a booking this specific month. |
| **Commercial objective** | Move a vendor at least one rung up the Stickiness Ladder (`ELBOLD_VENDOR_VALUE_BLUEPRINT.md` §4.3) from Level 1 (Passive) toward Level 3 (Business Tool User) and beyond within their first ninety days (`ELBOLD_EDP_05...`, Month 2-3). |
| **Existing capabilities supporting it** | Genuinely real analytics computed from real aggregations (month-over-month comparison, seasonal demand, lead funnel); a public vendor profile with real share/QR/social attribution tooling — the mechanism the Stickiness Ladder's Level 5 (Digital Identity) depends on already exists in working form. |
| **Current weaknesses** | `ELBOLD_EDP_03_VENDOR_DAILY_OPERATING_PLATFORM.md`, re-confirmed in EDP-05 Month 2: analytics remain the single most under-marketed capability on the platform — the feature that should be doing the most work in this exact stage is also the one least likely to be actively surfaced to a vendor without deliberate prompting. |
| **Future design principles** | A capability that exists but is not actively connected to a moment where a vendor would naturally look for it delivers roughly the same commercial value as a capability that does not exist — visibility and existence are not the same thing, and future design work should treat "is this surfaced at the moment it matters" as a first-class question alongside "does this exist." |

### 3.7 Subscription Renewal

| | |
|---|---|
| **Desired belief** | "Renewing is continuing what's already working for my business, not paying again for a hope that hasn't materialised." |
| **Emotional objective** | The renewal decision should feel like confirming an existing habit, not re-evaluating a purchase from zero. |
| **Commercial objective** | Pass Constitution Principle 7's Subscription Principle 1 test directly — *"if the marketplace never sent this vendor a booking, would this tier still be worth paying for?"* — at the exact moment a vendor is deciding whether to keep paying. |
| **Existing capabilities supporting it** | Subscription checkout, entitlement gating, and plan-specific upgrade framing, confirmed functionally correct; an in-app cancellation flow that already shows a vendor exactly what they lose (real plan benefits, sourced from real usage) before confirming — a genuinely strong, already-built loss-aversion moment. |
| **Current weaknesses** | `ELBOLD_EDP_05...` Month 1: by the point a vendor reaches this decision, they have encountered "no subscription required" framing at minimum three times during acquisition (homepage, Founding Vendors, application form) — the upgrade decision is fighting an expectation the platform itself set during recruitment. The existing loss-aversion framing in the cancellation flow is confirmed to exist only reactively, at the moment of cancellation — whether the same framing is shown proactively *before* the renewal point was not confirmed and should not be assumed. |
| **Future design principles** | Every renewal or upgrade prompt should be built from what the vendor has actually received and actually improved (per `ELBOLD_2030_STRATEGY.md` §4.3's specified framing: what they received, what improved, what's coming), sourced from real usage — never a generic feature list. The strongest loss-aversion moment already built (the cancellation flow) should be the template for every earlier renewal touchpoint, not a mechanism reserved only for the moment a vendor is already leaving. |

### 3.8 Advocacy

| | |
|---|---|
| **Desired belief** | "I want other professionals to know about this." |
| **Emotional objective** | Pride in association — a vendor who has reached genuine platform dependence (Stickiness Ladder Level 4-6) becomes a willing, visible advocate rather than a passive user. |
| **Commercial objective** | Zero-cost vendor acquisition through peer referral and public association, the natural commercial endpoint of a vendor relationship that has actually delivered on §3.1's opening belief. |
| **Existing capabilities supporting it** | Channel-attributed share/QR tooling on the public vendor profile (Programme C, WP-C5) — the mechanism that makes a vendor's own advocacy measurable once it happens. |
| **Current weaknesses** | New finding, this document, extending the Homepage Transformation Blueprint's Finding 3: no vendor testimonial, named business story, or peer social proof exists anywhere on the platform's public-facing surfaces. The "no human storytelling" gap identified on the customer side (EDP-01) applies with equal force here — there is currently no mechanism, formal or informal, converting a vendor who has reached genuine dependence into a visible advocate for the platform. |
| **Future design principles** | Advocacy should be earned evidence (a real vendor's real story, real tenure, real results), never manufactured — consistent with Constitution Principle 5 (Honest Reviews, Without Exception) applied to testimonial content generally, not only star ratings. A vendor at Stickiness Ladder Level 4+ is the correct, evidence-based population to draw advocacy content from — this is a targeting principle for future work, not a feature recommendation this document is making. |

---

## 4. ENTERPRISE COMMUNICATION PRINCIPLES

### 4.1 The Standing Test

Every public message ELBOLD produces — page copy, email, notification, onboarding text, error message, marketing communication — must strengthen at least one of two beliefs:

> **Customer:** "I trust ELBOLD."
> **Vendor:** "ELBOLD makes my business stronger."

A message that strengthens neither should be challenged before it ships, regardless of how accurate, well-written, or conventional it is. This is not a stylistic preference; it is the same discipline the Constitution applies to product decisions (Section 4's Decision Filter), applied to language.

### 4.2 Transactional vs. Relational Register

`ELBOLD_EDP_04_BRAND_AND_LANGUAGE_SYSTEM.md` §2 establishes the operative distinction and it is adopted here as permanent standard: the question is never whether copy is *accurate* — it is whether copy is built around a transaction (what is free, what is required, what happens next as a mechanical sequence) or around trust, confidence, professionalism, and business growth. The underlying fact never changes between the two registers; only which one is delivered determines whether the message strengthens either belief in §4.1 or merely informs without persuading.

The substitution pattern already evidenced across multiple live surfaces (EDP-04 §2) — replacing prohibition-framed trust claims with outcome-framed ones, replacing "no subscription required" framing with "everything you need to start is included," replacing "start receiving enquiries" with "start building your business" — is the template every future piece of copy should be tested against before shipping.

### 4.3 Voice Consistency Across Audience and Surface

Per EDP-04 §3-4: customer language should be specific and occasion-aware, never a generic corporate register standing in for every occasion at once. Vendor language should address a business owner operating their own business, never an applicant or a participant in ELBOLD's marketplace — "your business," not "your listing." Trust language should state what ELBOLD does before it states what ELBOLD prevents. Subscription language should describe what a vendor's business gains, never a feature-unlock framing. These four rules apply identically regardless of which page, email, or dashboard surface the copy appears on — voice consistency is a property of the message, not of the surface it happens to live on.

### 4.4 What Must Never Change Regardless of Tone

No register change — however warmer, more relational, more confidence-building — may ever imply a capability, guarantee, or level of automation that does not currently exist (Constitution Principle 11, Commercial Honesty). The 90/10 commission split and its disclosure, the Founding Vendor Programme's permanent terms, and every factual guarantee currently made to a customer or vendor must remain exactly and only as strong as what the platform can currently prove. Every recommendation in this document changes how a fact is told; none proposes changing which facts are true.

---

## 5. CAPABILITY MAPPING

This is evidence that ELBOLD delivers on its two commercial promises — not a feature inventory. Each capability below is mapped to which belief (§4.1) it primarily supports, and cited against real, independently-verified evidence from this transformation's own implementation record rather than described from a specification.

| Capability | Primary belief supported | Evidence it delivers on that promise |
|---|---|---|
| **Marketplace** | Both | The mechanism producing the transaction volume the entire trust/success loop (§1.2) depends on — customer discovery and quote/booking flow, server-validated (REG-05) and availability-enforced (REG-03), both independently verified live against real production data. |
| **Verification** | Customer: "I trust ELBOLD" | A real, tiered, human-review process (Reviewed → ID Verified → Documents Reviewed → Elite), published and explained on its own dedicated page — not a rubber stamp; the platform's own live data shows the current cohort has not yet progressed past the baseline tier, an honest reflection of an early-stage vendor base, not a design gap. |
| **Business Control Centre** | Vendor: "ELBOLD makes my business stronger" | The vendor dashboard's core daily-return mechanism — real, branching Daily Highest-Impact Action logic, a unified revenue view, and business-health scoring, actively hardened this session (Commercial Implementation Programme, WP1-5) against duplication and unreachable logic. |
| **CRM** | Vendor: "ELBOLD makes my business stronger" | A genuinely controllable action available to a vendor regardless of marketplace volume — the platform's own answer to "what can I do today if the marketplace sent me nothing," verified as the highest-priority candidate in the Daily Highest-Impact Action logic for zero-activity vendors. |
| **Bookings** | Both | The point at which trust becomes revenue (§2.6) and marketplace activity becomes a vendor's measurable business outcome (§3.5) simultaneously — the single transaction both belief systems in §4.1 converge on. |
| **Quotes** | Customer: "I trust ELBOLD" (primarily); Vendor secondarily | The decision-stage mechanism (§2.5) — side-by-side comparison plus concierge-assisted matching — that converts browsing intent into a considered choice rather than a rushed one. |
| **Business Health** | Vendor: "ELBOLD makes my business stronger" | A composite signal intended to answer "how is my business actually doing" independent of raw booking count — currently carrying an unresolved internal inconsistency (two differently-computed "health" concepts, §3.5) flagged for correction, cited honestly here rather than presented as fully resolved. |
| **Reviews** | Both | Constitution Principle 5's "most important customer action in the entire lifecycle" (2030 Strategy §5.4) — booking-gated with no exceptions, actively enforced on public display (verified this session), and the accumulating trust asset that compounds a vendor's Stickiness Ladder position over time. |
| **Subscriptions** | Vendor: "ELBOLD makes my business stronger" | Real, functioning checkout, entitlement gating, and a genuinely strong existing loss-aversion cancellation flow — the commercial mechanism the entire vendor journey (§3) is ultimately sequenced toward, currently unproven at scale (zero live subscriptions in production as of this document) but architecturally sound and previously verified. |
| **Founder Operations** | Vendor: "ELBOLD makes my business stronger" (indirectly, via platform quality) | The Executive Decision Centre built in Programme D — surfaces vendor quality risk, financial risk, and funnel velocity to the founder in one place, each traceable to a verified source, directly supporting the operational quality every vendor and customer belief above depends on. |
| **Governance** | Customer: "I trust ELBOLD" (primarily) | The mechanism enforcing Constitution Principle 1 in practice — vendor health scoring, warning detection, and lifecycle state, the operational backbone behind every trust claim made in §2.2 and §2.4. |
| **Growth** | Vendor: "ELBOLD makes my business stronger" (population-level) | Acquisition funnel, lead pipeline, and activation tooling ensuring the vendor population the platform recruits is one capable of experiencing §3's full journey, not just an application count. |
| **Trust** | Customer: "I trust ELBOLD" | The published guarantee page, refunds policy, and trust-badge infrastructure — currently fragmented in delivery (§2.2) despite being individually accurate, the architecture's clearest example of a real capability underperforming its own evidence through presentation rather than substance. |
| **Concierge** | Customer: "I trust ELBOLD" | A human-relationship alternative to self-service, already correctly identified by `ELBOLD_2030_STRATEGY.md` §5.5 as an underutilised lifetime-customer acquisition asset — real and functioning, currently generic in its invitation (§2.5) rather than specific. |

---

## 6. EXPERIENCE GOVERNANCE

### 6.1 This Document's Standing

This architecture becomes the required reference for every future page, email, onboarding flow, dashboard, or marketing communication ELBOLD produces — in the same governance tier as the Constitution's Decision Filter (`ELBOLD_CONSTITUTION.md` Section 4) and `ELBOLD_EDP_04_BRAND_AND_LANGUAGE_SYSTEM.md`'s own governance clause (Section 6). No future design work should begin without first identifying which stage of §2 or §3 it belongs to, which belief in §4.1 it is meant to strengthen, and which existing capability in §5 it draws evidence from.

### 6.2 The Pre-Design Test

Before any future implementation work begins on a customer- or vendor-facing surface, it should be able to answer, in order:

1. Which stage of the Customer Experience Architecture (§2) or Vendor Experience Architecture (§3) does this surface serve?
2. Which of the two beliefs (§4.1) does it strengthen?
3. Does a capability already exist (§5) that delivers this, or does this genuinely require something new? (Per this phase's own instruction: new capabilities are recommended only when absolutely necessary — the overwhelming majority of future work should connect, reframe, or correct what already exists, following the exact discipline Programmes A through D and the Commercial Implementation Programme have already applied.)
4. What does the relevant stage's "current weaknesses" entry (§2/§3) already say about this area — is this work closing a named gap, or introducing a new one?
5. Does the proposed language pass the transactional-vs-relational test (§4.2)?

A design that cannot answer all five is not ready to proceed to implementation, regardless of how complete its visual or technical specification is.

### 6.3 Relationship to Prior Governing Documents

This document does not replace `ELBOLD_EDP_01_CUSTOMER_EXPERIENCE.md` through `ELBOLD_EDP_05_VENDOR_SUCCESS_JOURNEY.md`, `ELBOLD_ENTERPRISE_HOMEPAGE_TRANSFORMATION_BLUEPRINT.md`, or `ELBOLD_EDP_04_BRAND_AND_LANGUAGE_SYSTEM.md`. It sits above them as the architecture that organises their findings into one coherent journey per audience, and it is the document future work should consult first — the EDP series and the Homepage Blueprint remain the detailed evidence base this architecture draws from and cites throughout, and should be consulted for implementation-level detail once a proposed change has passed the §6.2 test.

### 6.4 Currency

Every "current weaknesses" entry in §2 and §3 reflects this document's own verification against live code and the most recent Gate Review (`ELBOLD_TRANSFORMATION_GATE_2_REVIEW.md`) as of 2026-07-10. As with every governing document in this transformation, a finding here should be re-verified against production before being relied upon in future work if meaningful time has passed or further implementation has occurred — the same discipline that corrected EDP-01/EDP-02's stale finding about the homepage's vendor section (§3.1) during the production of this document, and the same discipline the Enterprise Baseline v1.0.1 correction established as standing practice for this entire transformation.

---

*Companion documents: `ELBOLD_CONSTITUTION.md` (superior authority), `ELBOLD_2030_STRATEGY.md`, `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md`, `ELBOLD_VENDOR_VALUE_BLUEPRINT.md`, `ELBOLD_EDP_01` through `ELBOLD_EDP_05`, `ELBOLD_ENTERPRISE_HOMEPAGE_TRANSFORMATION_BLUEPRINT.md`, `ELBOLD_TRANSFORMATION_GATE_1_REVIEW.md`, `ELBOLD_TRANSFORMATION_GATE_2_REVIEW.md`, `ELBOLD_PROGRAMME_A_TRUST_FOUNDATION_COMPLETION_REPORT.md` through `ELBOLD_PROGRAMME_D_FOUNDER_OPERATIONS_COMPLETION_REPORT.md`.*

*This document defines the commercial experience architecture. It does not authorise implementation of any kind. Future work against any stage, weakness, or capability named above requires its own explicit authorisation, tested against §6.2 before design begins.*
