# ELBOLD ENTERPRISE DESIGN PROGRAMME
## EDP-03 — The Vendor Daily Operating Platform
**Prepared:** 2026-07-10 | **Classification:** Implementation Blueprint — Enterprise Design Programme
**Status:** The single most commercially important document in the programme. Subordinate to `ELBOLD_CONSTITUTION.md`.

---

> ELBOLD is not being designed as a marketplace with tools attached. It is being designed as the operating platform an event business runs on, of which the marketplace is one capability among several — exactly the position `ELBOLD_CONSTITUTION.md` Section 2 and `ELBOLD_2030_STRATEGY.md` Section 1.2 already commit to.
>
> **The question every section answers:** *What would make a vendor feel they cannot comfortably run their business without ELBOLD — not because they are locked in, but because ELBOLD has become where their business actually lives?*

---

## METHODOLOGY

Every major experience cluster below answers all eight questions: (1) why does this experience exist, (2) what emotion should the user feel, (3) which commercial objective does it achieve, (4) what evidence proves the current experience succeeds or fails, (5) what friction exists today, (6) what transformation is recommended, (7) how will success be measured, (8) what must never change.

Twenty individually-named capabilities are grouped into eight daily-experience clusters — a vendor does not experience "Business Health" and "Business Control Centre" as separate products, they experience one morning arrival. Grouping by lived experience rather than by database table is itself the discipline this document was commissioned to apply.

Every claim is tagged **Verified** (traced to actual runtime code, cited — primarily from `capability_truth_audit.md`, produced 2026-07-10 via 5 parallel deep-dive code audits), **Observation**, **Assumption**, or **Recommendation**. Per the founder's standing instruction: prefer improving what exists over introducing new capability. Every recommendation below modifies or completes something already built; none proposes new infrastructure.

---

> **Enterprise Baseline v1.0.1 Correction (2026-07-10):** every reference below to the `vendors.response_rate` "scale mismatch" bug (Clusters 1, 2, 5, and Section 9's conclusion) is disproved by direct production verification — the live column accepts 0-100 writes with no CHECK constraint. This narrows this document's conclusion: of the three cross-cutting defects Section 9 named as the highest-leverage fixes, only two remain (the availability hardcode and the unverified cron authentication). Full evidence: `ELBOLD_ENTERPRISE_BASELINE_v1.0.1_CORRECTIONS.md`. Original text below is left as-is, historical record only — do not act on the response_rate claims in it.

---

## CLUSTER 1 — THE MORNING ARRIVAL (Business Control Centre, Business Health, Daily Summary)

**1. Why does this experience exist?** This is the first thing a vendor sees when they open ELBOLD — the moment that decides whether today is a day they engage with their business platform or a day they don't.

**2. What emotion should the user feel?** "Something specific needs my attention, and I know exactly what it is" — not "here are some numbers."

**3. Which commercial objective does it achieve?** This is the entire mechanism behind `ELBOLD_2030_STRATEGY.md` Section 8.1's headline metric — "subscription MRR per active vendor" is only earned if the vendor actually opens the platform regularly enough to feel the subscription is working for them.

**4. Evidence — current experience:** **Verified** (`capability_truth_audit.md`, Capability 1): six real, query-driven widgets — Today's Priorities, Business Health, Revenue, Marketplace Activity, Business Operations, and a Daily Highest-Impact Action card with genuine branching priority logic (`lib/vendor/business-control-centre.ts:214-330, 379-441`), not static copy. **Verified**: empty states are handled honestly — `RevenuePanel.tsx` shows a real empty state rather than a fabricated number when there is no data. **Verified** (`ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 2.1): the "Daily Summary" email, delivering the same priorities outside the browser, is confirmed **Verified** in `capability_truth_audit.md` Capability 5 as genuinely vendor-specific and suppressing itself when there's nothing to report — real engineering discipline, not a spam mechanism.

**5. Friction:** **Verified** (`capability_truth_audit.md`, New Finding #1): `vendors.response_rate` has a schema (0-1) vs. application (0-100) scale mismatch that silently fails every write, freezing the field at 0.5 for effectively every vendor. This corrupts the Operations/Trust component of the Business Health score shown on this exact screen every morning — meaning the single number most likely to make a vendor feel "ELBOLD understands how my business is doing" is currently wrong for almost everyone. **Verified** (New Finding #2): the Daily Summary and CRM follow-up cron jobs authenticate via a custom header that does not match Vercel's native cron convention, unverified against live logs — if broken, the "Daily Summary" habit-forming mechanism this whole cluster depends on may not be firing at all in production.

**6. Transformation recommended:** Fix `response_rate` (data-integrity fix, already flagged as the top engineering priority across three documents in this programme) before any further design work on Business Health — a beautifully designed panel showing a wrong number does more damage to trust than a plain panel showing a right one. **Recommendation:** verify the cron authentication issue directly against Vercel's invocation logs — this is the single highest-priority verification action in the entire programme, since it determines whether "the Daily Summary email" is a real capability or a capability that exists in code but has never fired.

**7. Success measured by:** Daily/weekly active vendor rate, segmented by subscription tier — the direct, correct measure of whether this cluster is doing its job, once the two blocking issues above are resolved.

**8. What must never change:** No fabricated urgency or invented priorities — the Daily Highest-Impact Action logic must continue to be driven only by real data, honestly suppressing itself when nothing genuinely needs attention (already correctly designed this way per Capability 1 evidence above).

---

## CLUSTER 2 — CUSTOMER RELATIONSHIP MEMORY (CRM, Customer Timeline, Follow-up Reminders)

**1. Why does this experience exist?** This is the cluster `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 1.2 names explicitly as "the most subscription-resilient feature on the platform... completely independent of marketplace traffic" — the clearest single answer to "why pay ELBOLD in a month with zero marketplace leads."

**2. What emotion should the user feel?** "My customer relationships live here now — I would lose real business history if I left."

**3. Which commercial objective does it achieve?** Direct subscription justification independent of GMV, and — per `ELBOLD_MARKET_AND_COMPETITOR_RESEARCH.md` — this is the exact value proposition that makes HoneyBook and Dubsado viable businesses with zero lead-generation of their own. ELBOLD does not need to invent this model; the market has already proven it works.

**4. Evidence — current experience:** **Verified** (`capability_truth_audit.md`, Capabilities 2-4): genuinely real, end-to-end. The CRM has a full create → list → stage-change → persist round trip with real RLS scoping and no mocked data. The Customer Timeline is confirmed **bidirectional** — 4 real write triggers (creation, stage change, follow-up set/cleared, archive) and live UI refresh, not a write-only audit log nobody reads. Follow-up reminders' manual path works fully, including an honest message to Free-tier vendors that the automated push won't fire without upgrading — a genuinely honest upsell moment, not a dark pattern.

**5. Friction:** **Verified** (Capability 4, shared with Cluster 1 Finding #2): the automated follow-up cron shares the same unverified authentication risk — if broken, a vendor who set a follow-up reminder and upgraded specifically to receive the automated push may not be receiving what they paid for. **Observation**: this cluster is, per `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 1.2's own assessment, "positioned as a minor feature under `/vendor/contacts` and not prominently marketed to vendors" — the capability is complete; its visibility within the product relative to its actual commercial importance was not confirmed to have improved since that 2026-06-30 assessment.

**6. Transformation recommended:** Verify the cron authentication issue (shared root cause with Cluster 1 — one fix, two clusters benefit). **Recommendation, no new capability required:** elevate this cluster's visual and navigational prominence to match its actual commercial importance — concretely, ensure the Business Control Centre's Today's Priorities and Daily Highest-Impact Action logic (Cluster 1, already real) treats "add your existing contacts" and "respond to a due follow-up" as equally weighted priorities to marketplace-driven ones, not a secondary nav item a vendor has to discover independently. This is a prioritisation/surfacing change to logic that already exists, not a new build.

**7. Success measured by:** CRM contact count and follow-up-reminder-set rate, segmented by weeks-since-signup — the leading indicator for the Stickiness Ladder's Level 3 ("Business Tool User," `ELBOLD_2030_STRATEGY.md` Section 4.1).

**8. What must never change:** Manual follow-up tracking stays free for every tier (Constitution Principle 2 — vendors should feel value before paying); only the automated push notification is gated to paid plans, per the existing, correctly-designed entitlement split already confirmed in Capability 4's evidence above.

---

## CLUSTER 3 — THE MARKETPLACE LOOP (Quotes, Bookings, Messaging)

**1. Why does this experience exist?** The transactional core — where a marketplace-originated relationship actually becomes revenue, for both the vendor and ELBOLD's commission.

**2. What emotion should the user feel?** Momentum and confidence — every step of an enquiry's progress should feel forward-moving, never ambiguous about what happens next or who is waiting on whom.

**3. Which commercial objective does it achieve?** Commission revenue (Constitution EDR-09) and — indirectly — subscription retention, since a vendor whose few marketplace enquiries convert well has direct evidence the platform works, independent of volume.

**4. Evidence — current experience:** **Verified** (`capability_truth_audit.md`, Capabilities 6-7, 18): the full quote request → response → accept → booking lifecycle is genuinely server-validated end-to-end, including real notification and email delivery to both sides. Booking cancellation on a paid booking triggers a real, fully-wired automatic Stripe refund with ledger updates — not a manual admin task disguised as automation. Messaging is real (polling-based, not push, but functionally complete) with deduplicated notifications that avoid spamming a recipient who already has an unread message in the same thread.

**5. Friction:** **Verified** (Capability 7, New Finding #3): a second, independent booking path — the direct "Book Now" flow (`components/customer/BookingRequestForm.tsx`) — computes price and commission client-side, and the Stripe checkout route trusts that figure without recomputing it against the vendor's actual package price server-side. This is a real financial-integrity gap: a vendor's payout on this specific path is only as correct as a value the customer's browser sent, not one ELBOLD's own server independently verified. **Verified** (Capability 12, New Finding #4): admin "remove" or "flag" on a review does not actually remove it from the public profile a customer sees — only the aggregate rating (DB-trigger-maintained) excludes it, meaning a moderation action a vendor or admin believes has happened has not fully happened.

**6. Transformation recommended:** Route the direct "Book Now" path through the same server-side price recomputation pattern already proven correct in the quote-acceptance path (Capability 6) — this is applying an existing, working pattern to a second entry point, not inventing new logic. Add the missing moderation-status filter to the public reviews query (a one-line fix per the audit) so that an admin action to protect a vendor's reputation actually protects it.

**7. Success measured by:** Quote-to-booking conversion rate (already instrumented per Capability 6/19 evidence) as the primary signal; zero-tolerance count of price mismatches between client-submitted and server-verified booking totals as the integrity signal for the fix above.

**8. What must never change:** No manual booking entry — Constitution's permanent exclusion, explicit in both the "Never Builds" list and EDR-01 (review integrity depends on every booking tracing to a real customer transaction). The recommended fix strengthens server-side validation of real transactions; it does not create any path for unverified ones.

---

## CLUSTER 4 — AVAILABILITY & CALENDAR

**1. Why does this experience exist?** `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 2.1 names this "the most important daily-habit feature currently on the platform" — the one action a vendor takes for every booking regardless of source, because it protects them from double-booking.

**2. What emotion should the user feel?** Reflex confidence — checking and blocking a date in ELBOLD should feel as automatic as checking a phone calendar, because every booking from any source gets recorded here.

**3. Which commercial objective does it achieve?** Daily habit formation independent of marketplace activity — a vendor who blocks their off-platform bookings in ELBOLD visits the platform every time they take any job, from any source, which is precisely the "indispensable regardless of booking origin" position this document is built around.

**4. Evidence — current experience:** **Verified** (`capability_truth_audit.md`, Capability 8): the vendor's own calendar management is genuinely real — a working date-blocking calendar with correct auto-blocking on confirmed bookings, backed by real `vendor_availability` rows since the platform's first migration.

**5. Friction:** **Verified**, and this is the most severe single finding in the capability audit for this cluster: the public profile hardcodes `hasAvailability: false` for every vendor (`app/vendors/[id]/page.tsx:141`) regardless of what the vendor has actually blocked, and — more seriously — **no quote or booking flow anywhere in the codebase reads `vendor_availability` at all**. A customer can request a quote or attempt a direct booking on a date the vendor has explicitly marked unavailable. **Verified**: the vendor-facing availability page itself states "Blocked dates are shown to customers when they browse your profile" — this claim is false as of this audit. This means the single feature identified as the platform's most important daily habit is currently a habit with no actual protective payoff — a vendor faithfully blocking dates every day is not, in fact, being protected from double-booking by doing so.

**6. Transformation recommended:** This is the highest-priority fix in this entire document, ranked above every other recommendation in every other cluster, because it is the one place where a genuinely well-designed daily habit is currently commercially hollow. Fix the public-profile hardcoding (already flagged as a one-line fix against a working pattern that exists elsewhere in the same codebase — `app/vendor/dashboard/page.tsx:106`) and wire availability checking into the quote-request and direct-booking flows so a blocked date is honoured, not merely displayed. No new capability is required — every piece needed already exists; it is disconnected, not missing.

**7. Success measured by:** Zero tolerance — the number of quote requests or bookings created against a vendor-blocked date should be exactly zero once this ships; any non-zero count post-fix is a regression, not a metric to optimise.

**8. What must never change:** The calendar remains vendor-controlled (block/unblock only, no forced availability) — nothing here proposes ELBOLD auto-managing a vendor's calendar without their action.

---

## CLUSTER 5 — REPUTATION & CREDIBILITY (Reviews, Verification)

**1. Why does this experience exist?** `ELBOLD_CONSTITUTION.md` Principle 1 states trust "is the thing ELBOLD sells" — this cluster is where that trust becomes a permanent, portable asset attached to an individual vendor's name, not just a platform-wide claim.

**2. What emotion should the user feel?** Ownership — a vendor's reviews and verification level should feel like something they built and now possess, not something ELBOLD merely displays about them.

**3. Which commercial objective does it achieve?** `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 1.2 names verification as "the most subscription-resilient feature on the platform" for a structural reason: unlike marketplace leads, a credential does not disappear in a slow month.

**4. Evidence — current experience:** **Verified** (`capability_truth_audit.md`, Capabilities 12-13): verification is "the most fully-wired capability audited" — real document pipeline, real automated level-upgrade triggers confirmed wired into the actual write paths (`app/api/vendor/profile/route.ts:71`, `app/api/bookings/[id]/route.ts:216`), not dead code. Reviews have a complete submission → display → moderation → vendor-response loop.

**5. Friction:** **Verified**: the same `response_rate` data-integrity bug found in Clusters 1-2 also blocks Level 3 verification's automated upgrade path — a vendor doing everything right cannot currently earn the credential this cluster's entire commercial case rests on. **Verified** (Capability 12, New Finding #4, restated from Cluster 3 for completeness): the public reviews query has no moderation-status filter, so an admin-removed review is not actually hidden from the profile that customers and the vendor themselves see — this directly undermines "ownership" (question 2 above), since a vendor believes a damaging or fraudulent review has been handled when it has not.

**6. Transformation recommended:** Both fixes are already named in Clusters 1 and 3 respectively — this cluster's contribution is naming precisely why they matter here specifically: they are the two concrete mechanisms standing between "ELBOLD's reputation system is well-designed" (true, per the audit) and "a vendor's reputation on ELBOLD is fully reliable" (not yet true, because of these two bugs). No new design work is recommended for this cluster beyond ensuring both fixes are prioritised with this commercial context attached, not treated as generic bug tickets.

**7. Success measured by:** Level 3 auto-upgrade count and confirmed-removed-review-actually-hidden rate — both currently zero or unverifiable for the wrong reasons.

**8. What must never change:** Constitution Principle 5 and EDR-01 — review integrity remains absolutely booking-gated, with no import mechanism, no exceptions, ever.

---

## CLUSTER 6 — MONEY (Subscriptions, Payments, Payouts)

**1. Why does this experience exist?** The literal commercial relationship — where a vendor experiences ELBOLD either as a trustworthy financial partner or as a source of anxiety about their own money.

**2. What emotion should the user feel?** Complete financial confidence — a vendor should never have to wonder where money is or what they are being charged for.

**3. Which commercial objective does it achieve?** Every revenue line the platform has (commission, subscription, and eventually processing fees per `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` Section 1) runs through this cluster's trust.

**4. Evidence — current experience:** **Verified** (`capability_truth_audit.md`, Capabilities 14, 19): subscription checkout, webhook handling, and entitlement gating are all genuinely functional and correctly enforced (not decorative — plan-based upload limits and featured-placement scoring both actually change behaviour). Revenue reporting on both vendor and founder sides is confirmed real, including a live Stripe balance API call for reconciliation. **Verified** (Experience Audit, Vendor Pages, `app/vendor/payouts`): the commission transparency here — an exact 90/10 split per booking with an "audited" tag distinguishing ledger-sourced figures from fallbacks — is independently assessed as best-in-class fintech transparency, a genuine strength to preserve exactly as built.

**5. Friction:** **Verified** (`capability_truth_audit.md`, Capability 16; Experience Audit, Vendor Pages): Stripe Connect remains kill-switched, and — a materially worse finding than previously documented — **zero payment-routing implementation exists even if the flag were flipped** (no fee-split code anywhere in the codebase). **Verified** (Experience Audit): the Payouts page, which contains the platform's best money-transparency design, opens with an amber "Payout System Beta / manual processing" disclosure directly above that content — undercutting trust on the single page whose entire purpose is building it. **Verified** (Evidence Update to `ELBOLD_VENDOR_VALUE_BLUEPRINT.md`, and this cluster's own evidence): `/founding-vendors` tells applicants "no required subscription" while this cluster's actual subscription infrastructure is fully functional and ready to justify a business-platform-first pitch — the mismatch is commercial-messaging, not capability.

**6. Transformation recommended:** No design change recommended for the payout ledger/commission-transparency UI itself — it is already correctly built and should not be redesigned, only left alone (see Question 8). **Recommendation:** reposition the "Beta/manual processing" disclosure — the underlying fact (payouts are currently processed manually) must remain honestly disclosed per Constitution Principle 11, but it does not need to be the first thing the page says; move it to sit alongside the payout-history detail where it belongs contextually, rather than as a leading banner that colours the reader's first impression of the whole page. This is a sequencing change, identical in kind to the recommendation in EDP-02 Section 2 for `/founding-vendors` — disclose everything, lead with confidence.

**7. Success measured by:** Subscription conversion rate specifically among vendors who have completed at least one booking (the group best positioned to feel the payout system's trustworthiness directly) versus those who haven't — isolates whether the Payouts-page framing itself is a conversion factor.

**8. What must never change:** Full disclosure of manual payout processing must remain — Constitution Principle 11 forbids implying automation that doesn't exist. The 90/10 transparency pattern itself, already best-in-class, is the template other financial surfaces should be measured against, not a page to be redesigned.

---

## CLUSTER 7 — PUBLIC IDENTITY (Profile, Public Vendor Page, QR Sharing)

**1. Why does this experience exist?** `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 5.2 names this "the most commercially important page ELBOLD owns" for a specific structural reason: every vendor who shares it is doing ELBOLD's customer acquisition for free, at zero marginal cost, on a channel (the vendor's own social following) ELBOLD does not otherwise reach.

**2. What emotion should the user feel?** Pride — a vendor should want to put this link in their Instagram bio because it makes them look more credible than their own unaided presence would.

**3. Which commercial objective does it achieve?** Organic customer acquisition (zero-cost, per `ELBOLD_2030_STRATEGY.md` Section 6.3's "Organic Discovery" flywheel acceleration point) and the Level 5 "Digital Identity" rung of the Vendor Dependence Framework — the highest-retention state short of full financial integration.

**4. Evidence — current experience:** **Verified** (`capability_truth_audit.md`, Capabilities 10-11): the public profile has real slug-based permanent routing, a genuine quality gate that shows a soft "still being finalised" state rather than a broken page for thin profiles, and correct JSON-LD SEO. Share links and QR codes genuinely work and resolve to the real profile; the `?ref=share` parameter correctly suppresses the competitor cross-sell section on a vendor's own shared link (Capability 11) — a real, already-shipped fix protecting a vendor from unknowingly funnelling their own audience to rivals.

**5. Friction:** **Verified** (Capability 10, shared root cause with Cluster 4): the same hardcoded `hasAvailability: false` undermines this page too — a vendor sharing this link as their "digital identity" is sharing a page that incorrectly tells visitors nothing about real availability. **Verified** (Capability 11): beyond the generic profile-view counter, there is no way to distinguish a QR scan from a WhatsApp click from organic traffic — a vendor who prints a QR code on business cards (the exact scenario `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 5.3-B envisions) has no way to know whether it is working.

**6. Transformation recommended:** The availability fix is already named in Cluster 4 — its benefit compounds here specifically because this is the page vendors are being actively encouraged to share externally. **Recommendation:** extend the already-working `?ref=share` parameter pattern (proven, low-risk, already shipped for the competitor-suppression use case) to also tag the source at the point of link/QR generation in `VendorSharePanel` — e.g., `?ref=qr` vs `?ref=share` vs a future `?ref=whatsapp` — giving each sharing channel its own attribution without any new tracking infrastructure, purely by extending a query-parameter pattern that already exists and is already read by the page.

**7. Success measured by:** Per-channel referred-traffic count (QR vs. link-copy vs. native share) once the parameter extension ships; secondarily, self-reported "where did you find us" data is not required since real attribution becomes available.

**8. What must never change:** The competitor-suppression behaviour on shared links (Capability 11's existing correct behaviour) must be preserved through any attribution extension — a vendor's own shared link must never surface a "similar vendors" section, regardless of which channel drove the click.

---

## CLUSTER 8 — BUSINESS INTELLIGENCE (Analytics, Business Growth)

**1. Why does this experience exist?** `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 1.2 calls this "the single most under-marketed feature on the platform" — genuine business intelligence most freelance event professionals have never had access to, built and working today.

**2. What emotion should the user feel?** Insight a vendor could not get anywhere else — "I understand my own business better because of this."

**3. Which commercial objective does it achieve?** A second, independent pillar of subscription-resilient value (alongside Cluster 2's CRM) — analytics remain useful and increasingly valuable the longer a vendor stays, regardless of any single month's marketplace volume.

**4. Evidence — current experience:** **Verified** (`capability_truth_audit.md`, Capability 15): every displayed metric traces to a real aggregation query against real tables — revenue trend, month-over-month comparison, lead funnel, seasonal demand, and payout split are all genuinely computed, not hardcoded. **Verified**: the profile-view counter feeding this dashboard was specifically traced end-to-end (visitor page load → tracking API → RPC → analytics table) and confirmed to be fed by real traffic, not a dead or orphaned insert — this is exactly the class of bug the founder has previously found elsewhere in the product (`hasAvailability`), and this specific capability was checked and cleared.

**5. Friction:** **Observation** (not independently re-verified in the fresh 2026-07-10 pass, carried forward from `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 1.2's 2026-06-30 assessment): this capability is described as "under-marketed" relative to its genuine strength — the risk is not that it doesn't work, but that vendors may not know it's there or understand why it matters to them independent of bookings.

**6. Transformation recommended:** No functional change recommended — this is one of the most reliably real capabilities in the entire audit and should not be redesigned. **Recommendation:** ensure Cluster 1's Business Control Centre (already the vendor's daily entry point) surfaces one specific analytics insight per visit as part of its existing priority logic — e.g., "your seasonal pattern shows March-June as your busiest window; make sure your availability reflects that now" — connecting Cluster 8's genuine intelligence to Cluster 1's daily habit and Cluster 4's calendar action in a single, already-real data pipeline, rather than leaving analytics as a page a vendor has to remember to visit separately.

**7. Success measured by:** `/vendor/analytics` visit frequency, and, once the Cluster 1 connection above ships, click-through rate from a surfaced insight to the corresponding action page (e.g., availability).

**8. What must never change:** No forecasting or benchmarking claim presented as fact without the underlying data volume to support it — `ELBOLD_2030_STRATEGY.md` Section 3 correctly gates category benchmarking behind "50+ vendors per category," and this document does not recommend bringing that forward before the data genuinely supports it.

---

## SECTION 9 — THE ANSWER

Returning to this document's opening question: *what would make a vendor feel they cannot comfortably run their business without ELBOLD?*

The evidence across all eight clusters supports one conclusion, consistently. **ELBOLD's actual capability is not the constraint.** Every cluster in this document contains genuinely real, well-engineered functionality — the capability-truth audit found 10 of 20 named capabilities fully "Live and valuable" with no caveats, and every remaining one is "incomplete" or "dormant" for a small number of specific, named, fixable reasons rather than broad weakness. The constraint is that **three specific defects touch a disproportionate number of these clusters at once**: the `response_rate` scale mismatch (Clusters 1, 5), the hardcoded public-profile availability (Clusters 4, 7), and the unverified cron authentication (Clusters 1, 2). Fixing these three items does more to make ELBOLD indispensable than any new feature this document could have proposed instead — which is precisely why this document, instructed to prefer improving existing capability over introducing new capability, recommends no new capability anywhere in it.

The second conclusion: the clusters that already make the strongest case for indispensability — Customer Relationship Memory (Cluster 2) and Public Identity (Cluster 7) — are, by the Vendor Value Blueprint's own prior assessment, the most under-surfaced relative to their actual importance. A vendor cannot feel they cannot live without a capability they don't know is there. Connecting what already exists — CRM to the daily dashboard, analytics to the daily dashboard, availability protection to the page vendors are told to share — is the highest-leverage work available, and none of it requires new engineering beyond the specific, named fixes above.

---

*Companion documents: `ELBOLD_CONSTITUTION.md` (Principles 1, 2, 11), `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` (Sections 1.2, 1.3, 2.1, 4, 5), `ELBOLD_2030_STRATEGY.md` (Sections 4, 6.3, 8.1), `ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md` (Section 6-7, the first-week handoff into this document's Clusters 1-2).*

*Next in series: EDP-04 (Brand & Language System), EDP-05 (Vendor Success Journey).*
