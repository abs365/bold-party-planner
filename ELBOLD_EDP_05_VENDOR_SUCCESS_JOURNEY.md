# ELBOLD ENTERPRISE DESIGN PROGRAMME
## EDP-05 — The Vendor Success Journey: The First Ninety Days
**Prepared:** 2026-07-10 | **Classification:** Implementation Blueprint — Enterprise Design Programme
**Status:** Subordinate to `ELBOLD_CONSTITUTION.md`. Synthesises EDP-02 (Acquisition) and EDP-03 (Daily Operating Platform) into a single time-sequenced journey.

---

> **The objective:** by Month 3, a vendor considers Elbold an essential business platform rather than another marketplace listing — the exact test `ELBOLD_2030_STRATEGY.md` Section 8.1 sets as the single most important thing to get right in Year 1.
>
> Every claim below is tagged **Verified**, **Observation**, **Assumption**, or **Recommendation**, and traces to `ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md`, `ELBOLD_EDP_03_VENDOR_DAILY_OPERATING_PLATFORM.md`, `ELBOLD_2030_STRATEGY.md` Section 4 (Vendor Dependence Framework), or `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 4 (Stickiness Ladder), rather than being re-derived from scratch.

---

## DAY 1 — APPROVAL TO FIRST LOGIN

**Vendor goals:** Confirm the application was worth the time spent. See tangible proof the business dashboard is real, not a waiting room.

**Elbold responsibilities:** Deliver on every promise made during acquisition (`ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md` Sections 1-3) within the first session — this is the moment claims made on the Founding Vendor Programme page are tested against reality for the first time.

**Existing capabilities available:** **Verified** (`ELBOLD_EDP_02...` Section 6): full Vendor OS access is already live for pending and newly-approved vendors alike — dashboard, profile, media, services, contacts, availability — per the two-tier governance model.

**Current friction:** **Verified** (`ELBOLD_EDP_03...` Cluster 1): the Business Health score shown on this very first dashboard view is corrupted by the `response_rate` scale-mismatch bug for essentially every vendor — a brand-new vendor's very first impression of their own "health" score is wrong before they have done anything to earn or lose it.

**Commercial opportunity:** The single highest-leverage first action, per `ELBOLD_EDP_02...` Section 6's recommendation: prompt the vendor to add their first CRM contacts immediately — proving the business-platform thesis with an action on Day 1, not a claim.

**Success indicator:** Vendor logs in within 24 hours of approval notification and completes at least one profile-building action (media, bio, packages, or CRM contact addition).

**Risk of cancellation:** Low in absolute terms (no subscription has been sold yet at this stage for most vendors — Starter is free per `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 3.2) but this is the highest-leverage day for **future** cancellation risk: a vendor whose first dashboard view shows a wrong health number or an all-zero marketplace-only view (Pattern B, `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 2.1) forms an early impression that is disproportionately hard to reverse later.

**Retention opportunity:** Fix the `response_rate` bug before this moment is experienced by any further new vendor — this is the cheapest possible retention intervention in the entire journey because it prevents a negative first impression rather than trying to repair one.

---

## WEEK 1 — HABIT OR ABANDONMENT

**Vendor goals:** Determine, largely unconsciously, whether Elbold is worth returning to. Per `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 2.1, this decision is typically made in under a minute on a repeat visit.

**Elbold responsibilities:** Give the vendor something specific and true to act on every time they return, regardless of whether the marketplace has produced an enquiry yet.

**Existing capabilities available:** **Verified** (`ELBOLD_EDP_03...` Cluster 1): the Business Control Centre's Daily Highest-Impact Action logic is real and branching, not static — capable of surfacing a genuinely different, relevant recommendation each visit.

**Current friction:** **Verified** (`ELBOLD_EDP_03...` Cluster 1, New Finding #2): the Daily Summary email and CRM follow-up cron jobs share an unverified production authentication risk — if broken, the exact mechanism designed to pull a quiet-week vendor back into the product may not be firing at all.

**Commercial opportunity:** **Verified** (`ELBOLD_EDP_02...` Section 7): confirm the Daily Highest-Impact Action logic prioritises business-platform actions (CRM, availability, verification progress) over marketplace-dependent ones specifically for zero-activity vendors, since the latter have no controllable next step when the number is genuinely zero.

**Success indicator:** Day-7 return visit with at least one CRM contact added or follow-up reminder set (`ELBOLD_EDP_02...` Section 7's own proposed metric).

**Risk of cancellation:** Low (still pre-subscription for most vendors) but this is where **churn-in-waiting** is seeded — `ELBOLD_2030_STRATEGY.md` Section 4.3's "no login in 7 days" early-warning trigger is designed for exactly this window.

**Retention opportunity:** **Verified** (`ELBOLD_2030_STRATEGY.md` Section 4.3): the "no login in 7 days" and "no CRM contact added in 14 days" triggers are already specified in the governing strategy; **Assumption**: whether these specific triggers are implemented in code was not confirmed in the capability-truth audit and should be verified directly before relying on them as active.

---

## MONTH 1 — THE SUBSCRIPTION DECISION

**Vendor goals:** Decide whether the free tier is enough, or whether the business-platform value already experienced justifies paying.

**Elbold responsibilities:** Make the upgrade decision about business value already felt, not about a feature the vendor hasn't used yet — Constitution Principle 7's Subscription Principle 1 ("If the marketplace never sent this vendor a booking, would this tier still be worth paying for?") is the literal test this month must pass.

**Existing capabilities available:** **Verified** (`ELBOLD_EDP_03...` Cluster 6): subscription checkout, entitlement gating, and plan-specific upgrade CTAs ("Grow My Bookings" etc.) are all confirmed live and functionally correct.

**Current friction:** **Verified** (`ELBOLD_EDP_02...` Section 8, Trust Map): by this point, the vendor has encountered the "no required subscription" framing at minimum three times during acquisition (homepage, Founding Vendors, application form) before ever reaching this decision — the upgrade prompt at Month 1 is fighting an expectation the platform itself set during recruitment.

**Commercial opportunity:** The subscription-language rewrite specified in `ELBOLD_EDP_04_BRAND_AND_LANGUAGE_SYSTEM.md` Section 2-3, applied specifically to whatever upgrade nudge fires around this point — framing the decision as "continuing what's already working for your business" rather than "unlocking more."

**Success indicator:** Free-to-paid conversion rate at Day 30, segmented by whether the vendor added CRM contacts and set at least one follow-up reminder in Week 1 (testing whether early business-platform engagement predicts conversion better than early marketplace activity does).

**Risk of cancellation:** **This is the first real cancellation-risk moment** — a vendor who upgraded on marketplace-visibility hope and received no enquiries in 30 days has, per `ELBOLD_2030_STRATEGY.md` Section 8.1, no rational reason to renew unless business-platform value was independently established first.

**Retention opportunity:** **Verified** (`ELBOLD_EDP_03...` Cluster 6, subscription cancellation flow): the existing in-app cancellation flow already shows a vendor exactly what they lose (plan highlights) before confirming — a genuinely strong, already-built loss-aversion moment. **Recommendation:** ensure this same "what you have, sourced from real usage" framing is available proactively before Month 1's renewal point, not only reactively at the moment of cancellation.

---

## MONTH 2 — PROVING THE PLATFORM WORKS WITHOUT MARKETPLACE VOLUME

**Vendor goals:** See evidence, independent of marketplace bookings, that the subscription (if purchased) or the free tier (if not) is doing something for the business.

**Elbold responsibilities:** Surface accumulating, genuinely vendor-owned assets — review count, verification level, CRM contact history, analytics trend — as visible proof of progress that has nothing to do with this month's marketplace volume.

**Existing capabilities available:** **Verified** (`ELBOLD_EDP_03...` Cluster 8): analytics are genuinely real and increasingly valuable with more data — month-over-month comparison, seasonal demand, lead funnel, all confirmed computed from real aggregations, not placeholders.

**Current friction:** **Verified** (`ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 1.2, re-confirmed as still relevant in `ELBOLD_EDP_03...` Cluster 8): analytics remain "the single most under-marketed feature on the platform" — the capability that should be doing the most work in this specific month is also the one least likely to be actively surfaced without prompting.

**Commercial opportunity:** **Verified** (`ELBOLD_EDP_03...` Cluster 8, Recommendation): connect one specific analytics insight per Business Control Centre visit to a corresponding action — the exact mechanism that turns "I have analytics" into "analytics are telling me something useful this month."

**Success indicator:** Analytics-page visit count in Month 2, and — the more important signal — whether a vendor takes an action (adjusting availability, adding a package) that traces back to an analytics insight.

**Risk of cancellation:** Elevated for vendors who converted to paid in Month 1 on hope rather than evidence and have not yet seen a booking — this is the month `ELBOLD_2030_STRATEGY.md` Section 4.3's "Month-2 retention design" is explicitly built for.

**Retention opportunity:** **Verified** (`ELBOLD_2030_STRATEGY.md` Section 4.3): "before subscription renewal, show vendors: what they received (profile views, quote requests, contact count), what improved (rating, completion score), what's coming (seasonal demand forecast)... frame renewal as continuing your business infrastructure, not paying for a marketplace subscription" — already specified as governing strategy; **Assumption**: implementation status of this specific pre-renewal summary was not confirmed in the capability audit and should be verified before assuming it fires today.

---

## MONTH 3 — THE INDISPENSABILITY TEST

**Vendor goals:** By this point, either the vendor has begun treating Elbold as infrastructure their business runs on, or they have mentally filed it as "another marketplace I tried" regardless of whether their subscription is still active.

**Elbold responsibilities:** Have moved the vendor at least one full rung up the Stickiness Ladder (`ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 4.3) from where they started — from Level 1 (Passive) toward Level 3 (Business Tool User) at minimum, ideally showing early signs of Level 4/5 behaviour (off-platform payment processing once available, or public-profile sharing).

**Existing capabilities available:** **Verified** (`ELBOLD_EDP_03...` Cluster 7): the public vendor page and share/QR tooling are real and already function as a genuine "digital identity" asset — the mechanism the Stickiness Ladder's Level 5 depends on already exists in working form.

**Current friction:** **Verified** (`ELBOLD_EDP_03...` Cluster 7, and Cluster 4): the same availability-enforcement gap undermines the public profile a vendor may now be actively sharing externally — a vendor who has reached the "share my profile" stage of engagement is sharing a page that still incorrectly claims availability it cannot back up until the Cluster 4 fix ships.

**Commercial opportunity:** A vendor who has reached Month 3 with genuine CRM contact history, at least one verification level gained, and analytics trend data has, per `ELBOLD_2030_STRATEGY.md` Section 4.2's Business Dependence Indicators, crossed into measurable operational dependence — this is the point at which upsell to a higher tier (Growth, once its off-platform payment and document capabilities are real per `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 3) becomes a natural next conversation rather than a cold pitch.

**Success indicator:** Composite of `ELBOLD_2030_STRATEGY.md` Section 4.2's Operational and Business Dependence Indicators at Day 90 — CRM contact count, verification level, whether the vendor's own profile URL has been shared externally (measurable once EDP-03 Cluster 7's channel-attribution recommendation ships).

**Risk of cancellation:** This is the point `ELBOLD_2030_STRATEGY.md` Section 6.3's "Acceleration Point 2" names explicitly — average tenure crossing 9 months is where churn approaches zero for a cohort, meaning Month 3 is still inside the highest-risk window, not past it. A vendor who has not accumulated any of the Section 4.2 dependence indicators by Month 3 is a high churn-risk vendor regardless of subscription tier.

**Retention opportunity:** The cumulative effect of every earlier month's fixes and connections (response_rate, availability enforcement, CRM/analytics surfacing, pre-renewal summaries) compounds specifically here — Month 3 has no single new mechanism recommended in this document because its outcome is entirely a function of whether Months 1-2's mechanisms actually worked. This is deliberate: `ELBOLD_2030_STRATEGY.md` Section 8.1 explicitly warns against adding features after a major capability launches rather than confirming the existing ones are being used — the same discipline applies here.

---

## SECTION 6 — THE NINETY-DAY SUMMARY

| Stage | Primary risk | Primary fix required (all already named in EDP-02/03) |
|---|---|---|
| Day 1 | Wrong first-impression health score | `response_rate` bug fix |
| Week 1 | Silent cron failure breaks the habit loop | Verify cron authentication against live Vercel logs |
| Month 1 | Subscribed on hope set by acquisition copy, not evidence | Acquisition language fix (EDP-02, EDP-04) |
| Month 2 | No visible evidence platform works without bookings | Connect analytics to daily dashboard action |
| Month 3 | Insufficient dependence indicators accumulated | Cumulative — no new fix, confirms earlier ones worked |

**The pattern, stated once for the whole journey:** every stage's primary risk traces back to one of the same small set of fixes named across EDP-02 and EDP-03 — this document does not introduce new problems or new capabilities at any of the five stages. It sequences the existing, already-identified fixes against the specific moment in a vendor's first ninety days where each one matters most, and confirms that fixing three data/connection issues and one recurring language pattern addresses the dominant risk at every single stage in this journey.

---

*Companion documents: `ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md`, `ELBOLD_EDP_03_VENDOR_DAILY_OPERATING_PLATFORM.md`, `ELBOLD_EDP_04_BRAND_AND_LANGUAGE_SYSTEM.md`, `ELBOLD_2030_STRATEGY.md` Section 4 (Vendor Dependence Framework), `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 4 (Stickiness Ladder).*

*This is the final document in the initial Enterprise Design Programme series (EDP-01 through EDP-05).*
