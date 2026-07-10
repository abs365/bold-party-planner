# ELBOLD ENTERPRISE DESIGN PROGRAMME
## EDP-02 — Vendor Acquisition Experience: Changing an Established Business Owner's Mind
**Prepared:** 2026-07-10 | **Classification:** Implementation Blueprint — Enterprise Design Programme
**Status:** Subordinate to `ELBOLD_CONSTITUTION.md`. This document designs how the acquisition journey should feel; it does not change what ELBOLD is permitted to build or promise.

---

> This document does not evaluate a registration form. It evaluates a conversation with a stranger who already runs a working business, has working tools, and has no urgent unmet need — and asks what has to happen in that conversation for them to conclude that giving up part of their Saturday to apply to ELBOLD, and later a slice of their monthly cash flow, is worth it.
>
> **The question every section answers:** *Why should an event business move part of its business onto ELBOLD instead of continuing to rely on Facebook, Instagram, WhatsApp, Google Business Profile, spreadsheets, or an existing CRM?*

---

## METHODOLOGY

Every major experience in this document answers all eight questions below, in order, before any recommendation is written:

1. Why does this experience exist?
2. What emotion should the user feel?
3. Which commercial objective does it achieve?
4. What evidence proves the current experience succeeds or fails?
5. What friction exists today?
6. What transformation is recommended?
7. How will success be measured?
8. What must never change?

Every factual claim is tagged: **Verified** (read directly from live code/production/governing documents, cited), **Observation** (plausible, code-supported, not independently confirmed at runtime), **Assumption** (a gap being inferred, explicitly flagged), or **Recommendation** (a proposed action, never presented as a finding). These are never mixed in the same sentence.

---

> **Enterprise Baseline v1.0.1 Correction (2026-07-10):** every reference below to the `vendors.response_rate` "scale mismatch" bug (Section 4, Section 8's trust map) is disproved. Direct production verification confirmed the live column accepts 0-100 writes correctly with no CHECK constraint blocking it. This does not change Section 4's conclusion that no verification-experience redesign is needed — if anything it strengthens it, since there was never a data-integrity fix required underneath the existing, correctly-designed UI. Full evidence: `ELBOLD_ENTERPRISE_BASELINE_v1.0.1_CORRECTIONS.md`. Original text below is left as-is, historical record only.

---

## SECTION 0 — THE ESTABLISHED BUSINESS OWNER'S REAL ALTERNATIVE

Before evaluating ELBOLD's journey, the honest baseline: what does this vendor's business actually look like the day before they discover ELBOLD?

**Verified** (`ELBOLD_MARKET_AND_COMPETITOR_RESEARCH.md`, 2026-07-10): the UK event-professional market has no single dominant tool. A typical established vendor multi-homes: Instagram/Facebook for discovery and portfolio, WhatsApp for enquiry conversations, Google Business Profile for local search credibility, and either a spreadsheet or a dedicated CRM (Dubsado, HoneyBook, 17hats) for the operational side, if they have formalised at all. None of these tools talk to each other. None of them is a marketplace. None of them independently verifies anything about the vendor.

**Verified** (`ELBOLD_2030_STRATEGY.md` Section 1.4): this is not a knowledge gap on the vendor's part — it is the standard operating environment for the majority of the ~250,000 people working professionally in UK event services. An established vendor with five years of trading and a full Saturday diary is not under-resourced; they have simply never had a single tool built for their specific trade.

**The honest implication for this document:** ELBOLD is not competing against nothing. It is competing against a working, familiar, zero-marginal-cost status quo. Every stage below must justify itself against that alternative specifically, not against an imagined vendor with no tools at all.

---

## SECTION 1 — HOMEPAGE: THE FIRST IMPRESSION OF ELBOLD AS A BUSINESS, NOT A LEAD SOURCE

**1. Why does this experience exist?** For a prospective vendor, the homepage is often the first and only ELBOLD surface seen before a decision to click through to `/founding-vendors` or `/vendor/apply`. It sets the category ELBOLD is judged against — lead marketplace, or business platform — before a single application field is filled in.

**2. What emotion should the user feel?** Recognition that this is infrastructure a serious business would use, not a listings site competing with Bark or Poptop for their attention.

**3. Which commercial objective does it achieve?** Filters the applicant pool toward vendors who understand and will pay for business-platform value (Constitution Principle 2, Vendor Success is the Business Model) rather than vendors chasing free leads who will churn the moment volume is thin.

**4. Evidence — current experience:** **Verified**, read directly from `app/page.tsx` (2026-07-10): the "For Event Professionals" section on the homepage states *"Keep 90% of every booking you receive... No monthly subscription to get started. No hidden platform fees. We earn when you earn."* **Verified**: no CRM, calendar, verification, or analytics capability is mentioned anywhere in this section — the entire vendor pitch on the customer-facing homepage is a commission-only marketplace pitch.

**5. Friction:** **Verified**: this directly contradicts `ELBOLD_2030_STRATEGY.md` Section 1.3 ("The thesis in one sentence: Build the platform vendors cannot leave") and every governing document updated in this programme. A prospective vendor arriving from anywhere other than a direct `/founding-vendors` link forms their first impression of ELBOLD as a commission marketplace, not a business platform — before they ever reach the page actually designed to recruit them.

**6. Transformation recommended:** Already specified in `ELBOLD_EDP_01_CUSTOMER_EXPERIENCE.md` Moment 5 — this document does not duplicate that recommendation, only confirms it is load-bearing for vendor acquisition specifically, not just customer trust. The homepage's vendor section is the true first touchpoint for a large share of prospective vendors and must not contradict the page they land on next.

**7. Success measured by:** Consistency check — zero customer-facing surface should describe ELBOLD's vendor relationship in commission-only terms once EDP-01 and this document's Section 2 recommendation both ship. This is a binary compliance measure, not a funnel metric, because the actual conversion impact is measured downstream at Section 2.

**8. What must never change:** The 90/10 commission split itself and its disclosure (Constitution EDR-09, Principle 11 Commercial Honesty) — the recommendation is about what leads the pitch, never about hiding or altering the underlying commercial fact.

---

## SECTION 2 — FOUNDING VENDOR PROGRAMME: THE ACTUAL RECRUITMENT PAGE

**1. Why does this experience exist?** This is the page purpose-built to convert a discovered prospect into an applicant — the highest-leverage single page in the entire acquisition journey.

**2. What emotion should the user feel?** "This solves a problem I already have, today, regardless of whether ELBOLD sends me a single customer this year."

**3. Which commercial objective does it achieve?** Subscription conversion readiness from day one — a vendor who applies believing ELBOLD is a business platform is a fundamentally different, more retainable applicant than one who applies believing it is a free lead source (`ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 3.1).

**4. Evidence — current experience:** **Verified**, read directly from `app/founding-vendors/page.tsx` (818 lines, read in full 2026-07-10): the page is well-built and disciplined — a genuine head-to-head comparison table against social media and directories (Bark, Poptop named explicitly), a 4-level verification explainer, a stickiness argument ("The longer you're on Elbold, the more valuable your account becomes"), and honest standards disclosure. **Verified**: benefit #1 in the `BENEFITS` array states *"Free to list your services... Elbold earns a 10% commission only when a booking is completed... No hidden fees, no required subscription."* **Verified**: the final CTA section closes with *"No credit card · Free to list · Elbold earns only when you do · Cancel anytime."*

**5. Friction:** **Verified**: this is the single most consequential contradiction found across the entire Enterprise Design Programme's evidence base. The page's own comparison table (Section "Platform Comparison") correctly differentiates ELBOLD from Bark/Poptop on trust and verification grounds — but its commercial framing is *identical* to a pure lead-marketplace: free to join, pay only on results, no subscription required. **Verified** (`ELBOLD_MARKET_AND_COMPETITOR_RESEARCH.md`): this is structurally the same commercial promise made by Bark and Thumbtack — the two platforms the research found carry the worst vendor sentiment of any platform researched (1.2-1.8/5 aggregate). ELBOLD is, on its own primary recruitment page, making the same commercial promise as the platforms its own comparison table is trying to differentiate against. An established business owner reading this page today has no reason to believe ELBOLD's business-platform tools are the actual product — the page tells them, explicitly and twice, that a subscription is not required.

**6. Transformation recommended:** Restructure the page's opening commercial framing from "free to list, pay only for results" to "a business platform your operations already need, with a marketplace attached." Concretely: **BENEFITS** entry #1 should lead with the CRM/calendar/analytics/verification stack already live (correctly described later in the same array as "already live" — `BENEFITS[3]`, "A full business dashboard. Already live.") rather than leading with the absence of fees. The "no required subscription" framing should be retired entirely — not because the commission-only entry tier should be removed (Free/Starter tier remains correct per `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 3.2), but because leading the page's very first commercial statement with "you don't need to pay us" actively trains every applicant to expect and defend a fee-free relationship, which every later subscription-conversion attempt then has to overturn. This is a sequencing problem, not a factual one — the Starter tier can and should remain free; it should not be the first sentence the page uses to describe ELBOLD.

Direct address to the specific tools an established vendor already uses (Section 0 above) is currently entirely absent from this page — no mention of Instagram, WhatsApp, spreadsheets, or existing CRMs anywhere in `app/founding-vendors/page.tsx`. **Recommendation:** add the "already using a system" treatment defined in `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 2.5 (added 2026-07-10) directly onto this page — currently that content exists only in the internal strategy document and has not reached the actual applicant-facing surface it was written for.

**7. Success measured by:** Applicant-to-approved conversion rate, and — the more important signal per the Constitution's Principle 4 (Long-Term Thinking) — 90-day subscription retention of vendors who applied after this change versus those who applied under the current framing. A higher application rate driven by "free" framing that produces lower subscription retention is not success; it is the exact failure mode this whole document set exists to prevent.

**8. What must never change:** The Founding Vendor Programme's substantive terms (permanent badge, priority placement, 20-place scarcity) — Constitution EDR-18 requires these honoured permanently for all participants regardless of any copy change made here.

---

## SECTION 3 — JOIN AS VENDOR / REGISTRATION: THE FIVE-MINUTE FORM

**1. Why does this experience exist?** The transition from "convinced" to "committed" — the point where a browsing prospect becomes a named application with a business identity attached.

**2. What emotion should the user feel?** Respected time and low-stakes commitment — an established business owner filling this out during a gap between client calls should never feel like they've started something disproportionate to the five minutes advertised.

**3. Which commercial objective does it achieve?** Application-quality data collection sufficient for Founder/Ts approval without requiring a second data-gathering round trip, which is itself a retention risk (an applicant who has to return to finish a form loses momentum).

**4. Evidence — current experience:** **Verified**, read directly from `components/vendor/VendorApplyForm.tsx` (2026-07-10): a genuine 3-step form (Business basics → Location & pricing → About & links) with a visible step indicator and a "What happens next" sidebar stating exact stage timing (submit ~5 minutes; verify/activate 24-48 hours; complete profile; start receiving enquiries). **Verified**: the sidebar's step 4 reads *"Start receiving enquiries — Customers searching in your category find and contact you"* — the third instance across the acquisition journey (after homepage and Founding Vendor Programme) of leading with marketplace-lead framing rather than business-platform framing.

**5. Friction:** **Verified**: this is a real, consistent pattern, not an isolated instance — the same "you're here to get leads" framing recurs at homepage, Founding Vendor Programme, and now the application form itself, meaning an applicant who somehow missed it twice encounters it a third time at the exact moment of commitment. **Assumption** (not independently verified in this pass): whether the form itself has any field asking what tools the vendor currently uses (CRM, socials, etc.) — if absent, ELBOLD collects no data at application time that would let it personalise the "why move to ELBOLD" case per-vendor later, a missed opportunity flagged as Assumption because the full field list was not exhaustively reviewed.

**6. Transformation recommended:** Retire the "start receiving enquiries" framing from the "What happens next" sidebar in favour of language consistent with Sections 1-2's recommended reframe (e.g., "Your business dashboard activates — CRM, calendar, and profile all live from day one, alongside marketplace visibility"). **Recommendation:** add one optional field — "What do you currently use to manage bookings and customers?" (free text or short multi-select: Instagram/WhatsApp/spreadsheet/CRM/none) — both because it lets the onboarding sequence (Section 6 below) speak directly to what the vendor is being asked to complement or replace, and because it gives ELBOLD, for the first time, real data on the Section 0 baseline instead of an assumed one.

**7. Success measured by:** Form completion rate (started vs. submitted) and time-to-completion, both currently unmeasured per **Assumption** — no analytics event covering form abandonment was confirmed present in this pass.

**8. What must never change:** The five-minute promise itself — Constitution Principle 7 (Simplicity at Scale) explicitly tests every step against "can the vendor explain this to another vendor in two sentences"; any field added must be justified against that test, which is why the recommended new field above is optional, not required.

---

## SECTION 4 — VERIFICATION: THE MOMENT ELBOLD ASKS FOR PROOF

**1. Why does this experience exist?** The credential that makes ELBOLD's trust claim to customers (Constitution Principle 12, Human Judgment at the Gate) real rather than declared.

**2. What emotion should the user feel?** Being taken seriously — verification should read as ELBOLD raising its own standard to match the vendor's professionalism, not as bureaucratic suspicion of a stranger.

**3. Which commercial objective does it achieve?** The verification badge is, per `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 1.2, "the most subscription-resilient feature on the platform" — a permanent credential a vendor keeps regardless of marketplace volume, and therefore one of the strongest arguments for why an established business owner would value ELBOLD independent of leads.

**4. Evidence — current experience:** **Verified** (`capability_truth_audit.md`, Capability 13, 2026-07-10): this is the single most fully-wired capability audited in the entire platform — a real 4-level document pipeline, private storage with signed preview URLs, genuine admin review with distinct per-level conditions, and confirmed-wired automation (`tryUpgradeLevel1` fires on every profile save, `updateVendorMetrics` fires on every booking). This is not a weak link in the journey.

**5. Friction:** **Verified** (`capability_truth_audit.md`, New Finding #1, cross-referenced in `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Evidence Update): `vendors.response_rate` — an input to Level 3 verification's automated upgrade condition — has a schema/application scale mismatch that silently fails every write, freezing the field. **Verified**: this means a vendor whose Level 3 progression depends partly on response rate cannot currently earn that upgrade automatically no matter how responsive they genuinely are, which directly undermines the "your credential grows with your real performance" promise this whole section's commercial case depends on.

**6. Transformation recommended:** Fix the `response_rate` scale mismatch (already flagged as a P0-priority engineering fix in the Evidence Update to `ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md`) before any further verification-experience design work — this is a data-integrity fix, not a design change, and this document defers to that existing recommendation rather than duplicating it. Once fixed, no experience redesign is recommended for verification itself — the existing flow already answers "why should I trust this credential" correctly; the fix required is beneath the UI, not in it.

**7. Success measured by:** Level 3 auto-upgrade event count, currently zero for the wrong reason (the bug, not lack of qualifying vendors) — this is the clearest before/after signal in this entire document, since the fix should produce a step-change the moment it ships.

**8. What must never change:** Human judgment remains at every gate (Constitution Principle 12, EDR-07) — the fix corrects a scoring input, it does not and must not introduce automated approval of any kind.

---

## SECTION 5 — FOUNDER APPROVAL: THE HUMAN MOMENT

**1. Why does this experience exist?** The single quality gate the Constitution identifies as non-negotiable and permanent (Principle 12) — this is not a processing step, it is the moment ELBOLD's core trust claim to every future customer is actually enacted.

**2. What emotion should the applicant feel?** Reviewed by a real person who cared enough to look, not processed by a queue.

**3. Which commercial objective does it achieve?** Every approved vendor is, structurally, evidence the review happened — this is what lets the customer-facing trust claim ("every vendor individually reviewed") remain true rather than aspirational (Constitution Principle 11).

**4. Evidence — current experience:** **Verified** (`capability_truth_audit.md`, Capability 20; `ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md` Section 2.4 and 6.2): a real, working admin approval workflow at `/admin/vendors`, with search, bulk actions, and an "Approval Standards" checklist modal baked into the workflow itself — not just documentation. **Verified**: `governance_decisions` records every approval/rejection immutably.

**5. Friction:** **Verified** (`ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md` Section 6.3, unresolved as of the 2026-07-10 refresh): the applicant-side experience of waiting for this decision is a static status page (Section 3's onboarding page, "pending" state) with no visibility into where in the queue they sit or who is reviewing them — the human review is real, but it is invisible to the applicant while it happens, which is a missed opportunity given how central this moment is to ELBOLD's actual differentiation.

**6. Transformation recommended:** No change to the approval mechanism itself (this remains correctly human-only per EDR-07). **Recommendation:** the pending-review status page (Section 6 below) should name what is actually happening in more human terms than the current generic "our team is reviewing" — e.g., surfacing that a real named team member (not necessarily by name, but by role — "a member of our vendor standards team") reviews every application against the same published Vendor Standards the applicant can read, closing the loop between the promise made on the Founding Vendor Programme page and the wait the applicant is currently experiencing blind.

**7. Success measured by:** Applicant satisfaction/support-contact volume during the pending window — currently unmeasured (**Assumption**, no instrumentation confirmed for this specific window).

**8. What must never change:** Approval remains exclusively human, at the standard defined in published Vendor Standards, with no volume-based pressure to lower the bar during acquisition pushes (Constitution EDR-07, Principle 12).

---

## SECTION 6 — FIRST LOGIN: THE PENDING WAIT AND THE APPROVED ARRIVAL

**1. Why does this experience exist?** The moment a name on an application becomes an active account inside the product — the first chance to prove the "business platform" promise made in Sections 1-3, not just repeat it.

**2. What emotion should the user feel?** Immediate, tangible business value — "I can already do something useful here" — regardless of approval status.

**3. Which commercial objective does it achieve?** Governance model confirmation: **Verified** (`project_elbold` memory, Phase 69E.1/69E.2; re-confirmed structurally consistent with `capability_truth_audit.md`): pending vendors already receive full Vendor OS access (dashboard, profile, media, services, contacts, availability) — only marketplace-facing routes (bookings, quotes, reviews) are gated to approved status. This is a genuine, already-built competitive advantage: an applicant does not wait idle for approval, they can begin building their business platform immediately.

**4. Evidence — current experience:** **Verified**, read directly from `app/vendor/onboarding/page.tsx` (2026-07-10): the pending state shows a real 5-stage status timeline (Received → Review In Progress → Verification → Profile Published → Active Vendor) with an honest 2-working-day estimate, plus a "While you wait" panel linking directly to Media, Profile, and Services — each with a specific, credible reason to act now ("Profiles with 8+ photos receive 3× more enquiries"). **Observation**: the "3× more enquiries" statistic's source was not confirmed in this pass — if it is not a measured platform statistic, it is an unsupported specific claim and should be replaced or sourced before being presented as fact (Constitution Principle 11, Commercial Honesty test: "Is this accurate as of today, not as of our roadmap?").

**5. Friction:** **Verified**: the "While you wait" panel's three prompts (photos, bio, packages) are all marketplace-profile tasks — none point the pending vendor toward the CRM (`/vendor/contacts`), which per `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 1.2 is "the most subscription-resilient feature on the platform... completely independent of marketplace traffic." A vendor sitting in the 24-48 hour pending window is being directed exclusively toward marketplace-readiness tasks, missing the single best opportunity in the entire journey to demonstrate the business-platform value this document argues is the actual differentiator — the vendor is, at this exact moment, not receiving marketplace value yet (nothing to see) but could be receiving CRM value immediately (import their existing WhatsApp/Instagram contacts while they wait).

**6. Transformation recommended:** Add a fourth "While you wait" prompt: "Add your first 5 customer contacts to your CRM" (linking to `/vendor/contacts`), framed explicitly against the tools named in Section 0 — "already have contacts in your phone, WhatsApp, or a spreadsheet? Bring the first few over now." This is the earliest possible moment to prove the business-platform thesis with an action, not a claim, and it costs no new engineering — `/vendor/contacts` already exists and is already accessible to pending vendors per the governance model **Verified** above.

**7. Success measured by:** CRM-contact-added rate during the pending window, pre/post this change — a direct, attributable activation metric.

**8. What must never change:** The two-tier governance model itself (Vendor OS open to pending, marketplace-facing routes gated to approved) — this is the correct, already-proven architecture; the recommendation only changes what pending vendors are prompted to do inside it.

---

## SECTION 7 — FIRST WEEK: THE HABIT WINDOW

**1. Why does this experience exist?** `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 2.1 identifies this as the single most critical UX window on the platform: a new vendor with no bookings yet follows "Pattern B" — log in, see a dashboard of zeros, leave in 30 seconds, and do not return. The first week determines whether a habit forms before the marketplace has produced a single enquiry.

**2. What emotion should the user feel?** "My business is visibly further along than it was a week ago" — progress that has nothing to do with whether ELBOLD has sent a customer yet.

**3. Which commercial objective does it achieve?** This is the direct precursor to subscription conversion and retention — `ELBOLD_2030_STRATEGY.md` Section 8.1 names "subscription MRR per active vendor" as the single most important metric for the first 18 months, and that outcome is decided in exactly this window, not later.

**4. Evidence — current experience:** **Verified** (`capability_truth_audit.md`, Capability 1): the Business Control Centre is genuinely real and query-driven — Today's Priorities, Business Health, Revenue, Marketplace Activity, and a "Daily Highest-Impact Action" card that surfaces one specific, ranked recommendation rather than a generic checklist. This is a substantively strong foundation already built for exactly this window.

**5. Friction:** **Verified** (`capability_truth_audit.md`, New Finding #1, cross-referenced above): the Business Health score's Operations/Trust component is corrupted by the same `response_rate` bug affecting Section 4, meaning a first-week vendor's own health score may be inaccurate from day one. **Verified** (`ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 2.1, still current per the fresh capability audit): a vendor with zero marketplace activity in week one sees a dashboard oriented around marketplace KPIs (bookings, quotes, revenue) that are all genuinely zero — the Business Control Centre's non-marketplace panels (CRM activity, profile completeness, availability) exist but are not confirmed, in this pass, to be given equal or greater visual priority than the marketplace-KPI grid for a zero-activity vendor specifically.

**6. Transformation recommended:** For vendors in their first 7 days with zero bookings/quotes, the dashboard's Daily Highest-Impact Action logic (already real, per Capability 1) should be confirmed to prioritise business-platform actions (add CRM contacts, complete availability, finish verification) over marketplace-dependent ones, since the latter have no vendor-controllable next step when the number is genuinely zero. **Recommendation:** the first-week experience should also introduce, gently and once, the "already using a system" framing from `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 2.5 — e.g., a one-time prompt after the third dashboard visit: "Still checking WhatsApp for enquiries? Log your last three conversations here so nothing falls through the cracks" — turning the coexistence with the vendor's existing tools (Section 0) into an explicit, welcomed migration path rather than leaving the vendor to independently decide whether and how to use ELBOLD alongside what they already have.

**7. Success measured by:** Day-7 return rate and CRM-contact count at day 7, both directly attributable to whether Pattern A (habit forming) or Pattern B (one visit, gone) occurred — `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 2.1's own framework, applied as the measurement standard here.

**8. What must never change:** No fabricated activity or inflated numbers to mask a genuinely quiet first week (Constitution Principle 11) — every recommendation above surfaces real, vendor-controllable actions; none simulates marketplace activity that has not occurred.

---

## SECTION 8 — THE JOURNEY AS A WHOLE: TRUST MAP

A single trust ledger across the full journey, each entry tagged with its evidence basis:

| Stage | Trust increases because | Trust decreases because |
|---|---|---|
| Homepage | **Verified**: genuine trust architecture disclosed (verification, Stripe protection, refund policy) | **Verified**: vendor section frames ELBOLD as commission-only, undercutting the business-platform claim before it's made |
| Founding Vendor Programme | **Verified**: honest, evidenced comparison table vs. social/directories; published standards | **Verified**: commercial framing ("no required subscription," "earns only when you do") matches the worst-reviewed competitor archetype researched |
| Registration | **Verified**: genuinely 5 minutes, transparent next-steps sidebar | **Verified**: third repetition of lead-only framing at the point of commitment |
| Verification | **Verified**: real, fully-wired 4-level system, human-reviewed | **Verified**: Level 3 auto-upgrade silently broken by a data bug, undermining the "your credential reflects your real performance" promise |
| Founder Approval | **Verified**: real human review, immutable audit trail, published standard | **Observation**: the review is invisible to the applicant while it happens |
| First Login (pending) | **Verified**: genuine, already-built full OS access during the wait | **Verified**: "while you wait" prompts are 100% marketplace-profile tasks, missing the CRM opportunity |
| First Week | **Verified**: real, well-architected Business Control Centre | **Verified**: zero-activity dashboard risk (Business Health corrupted by the same data bug found at Verification) |

**The pattern across all seven rows:** ELBOLD's underlying capability is consistently strong — verification, governance, and the vendor OS are genuinely well-built, evidence-backed by the capability-truth audit. Every trust *decrease* found in this journey is a **framing or sequencing problem, not a capability gap** — the same commercial promise repeated four separate times (homepage, Founding Vendors, application form sidebar, onboarding "while you wait" copy) before the vendor has any counter-evidence, and one data-integrity bug (`response_rate`) that touches two separate trust-building moments (verification, first-week health score) at once. This is the single most actionable finding in this document: fixing one bug and rewriting one recurring sentence pattern addresses the majority of friction identified across the entire acquisition journey.

---

## SECTION 9 — THE ANSWER

Returning to the question this document opened with: *why should an established business owner move part of their business onto ELBOLD instead of continuing to rely on Facebook, Instagram, WhatsApp, Google Business Profile, spreadsheets, or an existing CRM?*

The honest answer the evidence supports is not yet the answer the current journey tells them. The capability to answer correctly already exists — verified reviews no other tool can replicate, a CRM available from the first pending day, a genuine human-reviewed credential, and a business dashboard built specifically for this trade. What the journey currently tells the vendor, four times before they've logged in once, is that none of that is required — only a commission on results. **Recommendation, standing above every section-level recommendation in this document:** align what the acquisition journey says with what the platform actually is, before any further acquisition volume is driven at it. Recruiting more vendors into a journey that undersells the product they are actually joining produces exactly the outcome `ELBOLD_2030_STRATEGY.md` Section 8.1 warns against — vendors who arrive expecting a free lead source, receive one slowly, and churn before the real value is ever demonstrated.

---

*Companion documents: `ELBOLD_CONSTITUTION.md` (Principles 2, 7, 11, 12; EDR-07, EDR-09, EDR-18), `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` (Sections 1.2, 2.1, 2.5, 3), `ELBOLD_2030_STRATEGY.md` (Sections 1.3, 1.4, 8.1), `ELBOLD_MARKET_AND_COMPETITOR_RESEARCH.md`, `ELBOLD_EDP_01_CUSTOMER_EXPERIENCE.md` (Moment 5, the homepage-side counterpart to Section 1 above).*

*Next in series: EDP-03 (Vendor Daily Operating Platform), EDP-04 (Brand & Language System), EDP-05 (Vendor Success Journey).*
