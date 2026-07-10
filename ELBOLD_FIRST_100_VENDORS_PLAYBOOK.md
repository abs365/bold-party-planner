# ELBOLD FIRST 100 VENDORS PLAYBOOK
**Prepared:** 2026-07-10 | **Classification:** Operational handbook — Commercial Launch Programme v1.0
**Status:** No platform capability described below is new. Every mechanism, page, threshold, and figure cited in this playbook is a real, production-verified capability confirmed in `ELBOLD_TRANSFORMATION_GATE_2_REVIEW.md` and the Programme A-D completion reports. Where a capability does not yet exist (e.g. Stripe Connect activation, the REG-13 tier restructure), this playbook says so explicitly and works within the current, real system rather than assuming a future one.
**Foundation documents:** `ELBOLD_CONSTITUTION.md`, `ELBOLD_2030_STRATEGY.md`, `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md`, `ELBOLD_VENDOR_VALUE_BLUEPRINT.md`, the EDP series, `ELBOLD_ENTERPRISE_COMMERCIAL_PRIORITY_REGISTER.md`, `ELBOLD_TRANSFORMATION_GATE_1_REVIEW.md`, `ELBOLD_TRANSFORMATION_GATE_2_REVIEW.md`, and all four Programme completion reports.

---

## 1. Commercial objectives

The first 100 vendors exist to prove the model Master Growth OS will scale nationally — not to generate meaningful revenue in isolation. Three objectives, in priority order:

1. **Prove Constitutional Principle 6 (Depth Before Expansion) in at least one geography.** The Constitution's expansion threshold — 30+ approved vendors, 50+ completed bookings, 20+ public verified reviews, at least one category with 15+ vendors, in a single target geography — is the actual commercial finish line for this cohort, not an arbitrary count. 100 vendors distributed correctly across Essex, Kent, and London (see §2) can clear this threshold in more than one geography simultaneously, which is what unlocks the Constitution's permission for paid customer acquisition and further geographic replication (EDR-05, EDR-10, EDR-12).
2. **Establish the first real subscription MRR.** Production currently holds zero paying vendors (TG-2, confirmed 2026-07-10). Every mechanism needed to convert a free vendor to Pro/Premium/Elite is built and verified (Programme C); none has been tested against a real vendor making a real decision. The first 100 is the first opportunity to learn whether the priced value proposition converts.
3. **Exercise every trust and operational mechanism Programmes A-D built, under real load.** TG-2's central qualification was that every fix is "verified correct against production, not yet proven under real decision pressure, because that pressure doesn't exist yet." The first 100 vendors is what creates that pressure.

**Explicitly not an objective of this phase:** paid customer acquisition. Per Constitutional EDR-10, that remains gated behind the density thresholds above, in whichever geography reaches them first. This playbook governs vendor (supply-side) acquisition only.

---

## 2. Ideal vendor profile

**Category mix** — reuses the exact category taxonomy and per-category coverage targets already tracked on `/admin/vendor-growth`, scaled from the platform's existing first-50 target to a first-100 target (same ratios, doubled):

| Category | Existing 50-vendor target | First-100 target |
|---|---|---|
| DJ | 10 | 20 |
| Photographer | 10 | 20 |
| Decorator | 8 | 16 |
| Caterer | 8 | 16 |
| Venue Hire | 5 | 10 |
| Entertainer | 5 | 10 |
| Cake Designer | 3 | 6 |
| Event Planner | 3 | 6 |

DJ and Photographer are prioritised first: they are the two categories capable of independently clearing the Constitution's "15+ vendors in one category" expansion-threshold clause on their own.

**Geographic mix** — reuses the exact location taxonomy and targets already tracked on `/admin/vendor-growth`, same doubling:

| Location | Existing 50-vendor target | First-100 target |
|---|---|---|
| Essex | 15 | 30 |
| Kent | 10 | 20 |
| London | 20 | 40 |

Essex at 30 vendors independently clears the Constitution's 30+ vendor density threshold; London at 40 clears it with margin. Kent at 20 does not on its own — Kent should not be the geography a launch decision is anchored to until it either reaches 30 or is deliberately merged into a wider "South East" reading of "target geography" (a Founder-level interpretive call, not an operational one).

**Qualitative profile** — a vendor worth pursuing in this cohort:
- An established UK business with a real trading history (not a hobbyist testing the platform) — the verification tiers in §6 are built to confirm this, and a vendor who can't clear ID Verification is not a good fit for this cohort's purpose.
- Operating in Essex, Kent, or London, or willing to serve those areas — matches the only geographies with live category/location landing pages (`app/essex`, `app/kent`, `app/london`) today.
- Currently active on other platforms/social media for bookings — the "already using a system" honest-comparison messaging (Programme B, WP-B2) is built specifically to convert this profile, not a vendor with zero existing bookings anywhere.
- Comfortable with a free-to-start, pay-as-you-grow model — Free tier is fully functional (not a crippled trial), which is the correct opening offer for an unproven marketplace with zero reviews today.

---

## 3. UK acquisition strategy

Per Constitutional Principle 6's 2026-07-10 clarification: **nationwide vendor (supply-side) recruitment is explicitly compatible with Depth Before Expansion.** The constraint is on paid *customer* acquisition and on the *customer-facing marketplace* implying density that doesn't exist — not on where vendor applications are sourced from. This section governs supply only.

**Channel 1 — Founding Vendor Programme (primary, first 20 vendors only).** `/founding-vendors` is real, live, and explicitly capped: *"20 places available"* (confirmed in current copy). This is the highest-leverage channel for the first 20 — permanent priority placement, a permanent Founding Vendor badge, and full "access every tool as it ships" positioning, none of which cost anything to grant since priority placement is a display-order property, not a new capability. **Vendors 21-100 join under standard terms** — no Founding Vendor badge, standard placement — this distinction must be communicated accurately in outreach; overselling Founding Vendor status past place 20 is a Constitution-adjacent honesty risk (see §15).

**Channel 2 — Direct outreach via the existing lead pipeline.** `/admin/vendor-acquisition` (Lead CRM), `/admin/vendor-pipeline` (Pipeline Board), `/admin/vendor-outreach` (Outreach Queue), and `/admin/pilot/outreach` (Outreach Templates/Pack) are real, built tools — `vendor_leads` table, tracked through researched → contacted → interested → registered → approved (the exact stages already computed by `fetchVendorGrowthData()`'s acquisition metrics). This is the channel for categories/geographies the Founding Vendor page alone won't fill (e.g. Cake Designer, Event Planner — low target volume, likely to need direct sourcing rather than inbound).

**Channel 3 — Organic category/location SEO surfaces.** `app/essex`, `app/kent`, `app/london` and their `{caterers,djs,photographers}` sub-pages are real, live pages today. These serve customer-side discovery, but a vendor searching "list my [category] business Essex" who lands on these pages is a real, zero-cost acquisition path already in production — worth confirming these pages carry a visible "Apply as a vendor" path (they should; verify during onboarding QA, not a new build).

**Channel 4 — Referral via existing share/attribution tooling.** Programme C's WP-C5 (channel-attributed share links, `?ref=share/qr/whatsapp/facebook/linkedin`) measures a *customer-facing* vendor's own sharing of their profile — it is not a vendor-referral mechanism. Do not conflate the two in outreach materials; a "refer another vendor" programme does not exist in code today and is out of this playbook's scope (no new capabilities).

**Sequencing:** Essex first (largest existing target, closest to independently clearing the Constitutional threshold), London second (largest absolute target), Kent third. Within each geography, DJ and Photographer first (§2's category-threshold logic), then Caterer/Decorator, then the smaller-volume categories via direct outreach once the anchor categories have momentum.

---

## 4. Vendor qualification criteria

A lead should not enter the formal application/verification pipeline (§6) unless it clears these, checked during the "researched" stage of the existing lead pipeline:

1. **Real, operating UK business** — a findable trading history (own website, social presence, or marketplace listing elsewhere) predating outreach. This is what the verification tiers in §6 are designed to confirm formally; qualification at the lead stage is a lighter pre-check to avoid spending verification-team time on speculative applicants.
2. **Category fit** — falls into one of the eight existing platform categories (`photographer, dj, decorator, caterer, venue_hire, entertainer, cake_designer, event_planner`). Do not recruit outside this taxonomy; a new category is a platform-capability question, out of this playbook's scope.
3. **Geographic fit** — genuinely serves Essex, Kent, or London (or explicitly states willingness to travel to them). A vendor with no connection to any of the three target geographies should be deprioritised, not rejected outright — Constitutional Principle 6 is about where *density* is proven, not a hard geographic exclusion, but every off-geography vendor added dilutes the path to clearing a threshold.
4. **Capacity to pass at minimum "ID Verified" tier** — able to provide a valid UK contact number and government-issued ID matching their business identity (`app/how-we-verify/page.tsx`'s tier 2). A vendor unwilling or unable to clear this is a trust risk in a marketplace with zero existing reviews to vouch for them independently.
5. **Not already a rejected applicant without a stated change in circumstances** — production currently holds one rejected vendor (`Balh`, rejected, `status='rejected'`); the standard queue should not re-solicit a prior rejection without a specific, documented reason the original rejection basis no longer applies.

---

## 5. Vendor onboarding journey

This is the real, current, live journey — every step below maps to a page or process that exists today.

1. **Apply** — `app/vendor/apply/page.tsx` (`VendorApplyForm`). Programme B (WP-B1/B3) confirmed the "what happens next" copy and sidebar commission bullet accurately describe the real process.
2. **Initial review (1-2 days)** — per `app/how-we-verify/page.tsx`, the team assesses identity, phone number, and portfolio. Application lands in `/admin/vendors?status=pending` for approval.
3. **Approval or rejection** — `status` transitions to `approved`/`rejected` via the existing admin vendor-review flow. Approval is the baseline "Reviewed" verification tier — every approved vendor holds this as a minimum per the verification copy.
4. **Onboarding page** — `app/vendor/onboarding/page.tsx`. Programme B (WP-B3) humanized the "Review In Progress" stage detail and added a fourth CRM-focused "while you wait" prompt — this page is where a newly-approved vendor is directed to add their first manual contact, not left idle.
5. **Phone verification** — `components/vendor/PhoneVerifyModal.tsx` (Programme B, WP-B4 fixed the SMS/email mismatch — this now correctly says "Confirm Your Phone Number").
6. **Profile completion (S4-S6 of the real activation stage model, `app/admin/vendor-activation/page.tsx`)** — bio (50+ characters), phone, city (S4); at least one photo uploaded (S5); at least one service package added (S6). A vendor who completes S1-S6 is "quote-ready" in the platform's own existing terminology.
7. **First quote received (S7)**, **first booking (S8)**, **paid subscription (S9)** — see §8-§9 for how the platform proactively drives a vendor toward these, and §7 for subscription specifically.

**Operational note:** `app/admin/vendor-activation`'s "Needs Attention" section (real, live) already surfaces exactly which vendors are stuck and why (profile incomplete / no photos / no services) with a one-click link to their record — this is the tool to run this journey from daily, not a spreadsheet.

---

## 6. Verification standards

Reused verbatim from the real, live, customer-facing verification copy (`app/how-we-verify/page.tsx`) — this is what a vendor is told, and what the team must actually deliver on:

| Tier | Requirement | What it confirms |
|---|---|---|
| **Reviewed** (baseline — every approved vendor holds this minimum) | Identity, trading description, service category assessed by the Elbold team | The business exists as described |
| **ID Verified** | Valid UK contact phone number + government-issued identification, legal name cross-referenced against business identity | Exactly who is behind the listing |
| **Documents Reviewed** | Category-specific required documents (insurance certificates, professional licences, trade credentials per `lib/verification-requirements.ts`'s `CATEGORY_REQUIREMENTS`) | The business is legitimately equipped to deliver the service |
| **Elite** | Exceptional track record, multiple verified five-star reviews, full identity confirmation, consistent performance across numerous events | The highest trust tier — earned through real platform history, not granted at onboarding |

**Production reality check (TG-2):** the one currently-approved vendor sits at the baseline "Reviewed" tier, unchanged for 18+ days. **Operational target for this cohort: every approved vendor should reach at least "ID Verified" within 7 days of approval.** This is not a new capability — it is holding the existing process to the timeline already published (`app/how-we-verify/page.tsx`: "2-5 days" for document review "if required," on top of the 1-2 day initial review).

---

## 7. Subscription conversion strategy

**Use the real, current tier names and prices — do not describe the REG-13 restructured tier names (Starter/Professional/Growth/Enterprise), because that restructure has not been built.** The live, sellable structure is:

| Plan | Monthly | Annual |
|---|---|---|
| Free | £0 | — |
| Pro | £29 | £279 |
| Premium | £79 | £759 |
| Elite | £149 | £1,428 |

Commission is a flat 10% on every plan, confirmed consistent everywhere it's displayed (TG-2, §3). Do not describe commission as tiered or plan-dependent — it isn't.

**Conversion mechanism, already instrumented:** `computeCommercialMetrics()`'s `subscription_funnel` tracks `page_viewed → checkout_started → upgraded` (real event tracking, `vendor.subscription.page_viewed`/`checkout_started`). This funnel currently shows 0 at every stage — there is no baseline conversion rate to compare against yet. The first task for this cohort is establishing that baseline, not optimising against one that doesn't exist.

**What to lead with:** the CRM, analytics, availability calendar, and booking intelligence tools are genuinely free-tier accessible today (confirmed in Founding Vendor Programme copy: *"Revenue analytics, client CRM, direct contact tracking, lead funnel reporting, availability calendar and booking intelligence are already live"*) — the honest pitch for Pro/Premium/Elite is priority placement and higher-tier features, not gatekeeping tools a vendor needs to operate. This matches Programme B's core positioning fix and should not be re-litigated in sales conversations.

**What not to promise:** Stripe Connect (automated payout routing) is not active (kill-switched off, TG-2 §3) — payouts are manual bank transfer today. Do not tell a prospective subscriber that upgrading changes how or when they get paid; it doesn't, yet.

---

## 8. Daily activation strategy

The platform already computes a single "Daily Highest-Impact Action" per vendor (`lib/vendor/business-control-centre.ts`, `computeDailyHighestImpactAction`) — this is the mechanism to operationalise, not a new one to build:

- **Zero-marketplace-activity vendors** are prioritised toward a CRM action first (Programme B, WP-B5) — a vendor with no bookings/quotes/contacts is nudged to log a manual contact before anything else, verified against the real vendor's data to trigger correctly.
- **Seasonal booking-pattern insight** (Programme C, WP-C2) connects to the availability calendar once a vendor has 3+ dated bookings across 2+ months — inert for a brand-new vendor, activates naturally as they gain history.
- **CRM-quiet nudge** (Programme C, WP-C3) fires in the Daily Summary email on a 7-day cadence once a vendor has gone quiet — deliberately not a daily repeat, to avoid habituating vendors to ignore it.

**Operational rhythm this implies:** the team does not need to manually decide what to tell each vendor to do next — the dashboard and daily email already surface it. The operational job is making sure vendors actually open the dashboard and read the email, which is a marketing/comms task (subject lines, timing, personal outreach for vendors who go dark), not a platform task.

**Standing caveat (TG-2):** REG-02's cron-execution confirmation was still pending as of the last check (`email_log`/`automation_logs` both at 0 rows) because the confirmation window hadn't occurred yet. **Before relying on the Daily Summary email as an activation channel for this cohort, confirm this checkpoint has cleared** — check `email_log`/`automation_logs` for rows after the next scheduled cron window. This is a five-minute production query, not implementation work.

---

## 9. First-booking strategy

The Founder Dashboard's existing "First Booking Mission" (`app/admin/founder/page.tsx`) is a real, live 7-step tracker: quote requested → vendor responds → booking created → confirmed → deposit paid → completed → review submitted. This is the platform's own definition of a vendor/customer pair succeeding, and should be the operational team's definition too — not a separately-invented metric.

**For this cohort specifically:**
- A vendor's first quote is the highest-leverage early event — Programme C's seasonal-insight and CRM tools exist to help a vendor *ask for* activity (via their own network/CRM outreach), since the marketplace itself has zero customer-side traffic to generate inbound quotes yet (TG-2: 0 quotes in production).
- Server-side price and availability integrity (REG-05, REG-03, both independently verified in Programme A) mean a vendor's first quote-to-booking conversion will not be undermined by a pricing or availability bug — this was specifically hardened before this cohort was invited.
- The seasonal-availability insight (§8) only activates after 3+ bookings — for a vendor's *first* booking, the operational lever is manual encouragement and CRM discipline, not a platform nudge (the nudge mechanism is designed for vendors who already have some history).

---

## 10. Vendor retention strategy

Built directly on Programme D's WP-D2 unified risk view (`app/admin/founder`'s "Vendors Needing Attention" section) — the platform already merges quality risk (Governance's `calculateVendorHealthScore`) and financial risk (Monetization's `churn_risk`) into one severity-ranked list per vendor. This is the retention dashboard; it does not need to be rebuilt or supplemented.

**Quality-risk signals already computed:** rating, response rate, activity recency, booking completion, cancellation rate, review consistency — combined into a 0-100 health score with tiers (excellent/good/fair/poor/critical). A vendor scoring "critical" (as the one current live vendor does — TG-2) should be the first retention priority, before marketplace volume makes the list longer.

**Financial-risk signals already computed:** failed payments, cancel-at-period-end — surfaced per vendor with their MRR at risk. Currently empty (0 subscriptions in production) — this branch of the unified view will start populating the moment the first vendor subscribes (§7), and should be checked daily from that point.

**Operational rhythm:** `/admin/founder`'s "Vendors Needing Attention" list, capped at the 10 highest-severity vendors, is the daily retention checklist. Each row links directly to the vendor's record (Programme D, WP-D3) — there is no manual cross-referencing step required.

---

## 11. Founder daily operating rhythm

This is a direct operational script for `/admin/founder`, the Executive Decision Centre Programme D built and verified:

1. **Today block** — new applications, quotes requested, bookings created today, revenue today. New Applications links directly to the pending queue (Programme D, WP-D3) — clear the pending queue first thing, since a slow approval turnaround directly works against §6's 7-day verification target.
2. **Platform Metrics** — cumulative counts (pending/approved/verified vendors, quotes, bookings, revenue, commission). Use for a general health scan, not daily action.
3. **Commercial Overview** — MRR, paying vendors, paid conversion %, at-risk MRR (real, sourced from `computeCommercialMetrics()`, the same function `/admin/monetization` uses). Zero today; the first non-zero reading here is a milestone worth noting operationally.
4. **Executive Signals** — at-risk vendor count (→ Governance), applications this week (→ Vendor Growth), booking status mix (→ Bookings). Each tile links to the page that lets you act on what it shows (Programme D, WP-D3).
5. **Vendors Needing Attention** — the unified retention list (§10). Work this list top-to-bottom; severity-4 (both quality and financial risk) vendors first once that branch has real data.
6. **First Booking Mission** — the 7-step tracker (§9). Check daily until it completes for the first time; this is a genuine platform milestone (the copy literally says so: *"Elbold has processed its first real transaction. Scale the model."*).
7. **Vendor pipeline banner** — appears automatically while approved vendors are under 5; links to Outreach Templates and the Founding Vendor page. Use these links directly rather than improvising outreach copy.

**Daily time allocation guidance:** pending-queue clearance and Vendors Needing Attention should be checked every single operating day; Commercial Overview and Executive Signals are a morning scan; the First Booking Mission tracker matters most in the early weeks of this cohort and matters less once bookings become routine.

---

## 12. Weekly commercial review

Run against `/admin/vendor-growth`'s real, already-built weekly structure — do not build a separate weekly report:

- **Acquisition Funnel** (Applied → Approved → Active → Booked, with stage-to-stage conversion %) — review which stage is the actual bottleneck each week, not just the top-line applied count.
- **Weekly Targets** panel (real, on the same page): leads in pipeline (target 50), outreach sent (target 25), interested vendors (target 5), approved vendors (target 2/week baseline — scale expectation upward for this cohort's more active recruitment push per §3).
- **Categories: Approved Vendors** and **Locations: Approved Vendors** — check weekly against the §2 targets; a category or geography falling behind should trigger a §3 Channel 2 (direct outreach) push that week, specifically into the lagging category/geography.
- **Vendor Activation Board** (`/admin/vendor-activation`) — weekly scan of the "Needs Attention" and "Waiting for Customer" segments; the former needs vendor-side coaching, the latter needs marketplace traffic, and conflating the two wastes outreach effort (the page's own copy makes this distinction explicitly).

---

## 13. Monthly performance review

Run against `/admin/monetization`'s real 30-day metrics (`computeCommercialMetrics(db, 30)`) — the same function powering Founder Dashboard's Commercial Overview, so the monthly review and the daily glance are guaranteed to agree (this consistency was the specific bug Programme A fixed — do not reintroduce a second hand-computed monthly figure):

- MRR, ARR, paying vendors, paid conversion %, net new (30d), upgrades/cancels/failures/recovered, plan distribution, revenue by category, subscription conversion funnel (page_viewed → checkout_started → upgraded).
- Cross-reference against the Constitution's expansion threshold (§1): approved-vendor count, and — once real transaction volume exists — completed-booking count and public review count, per geography. The month this cohort first clears 30+ approved / 50+ bookings / 20+ reviews / 15+ in one category, in Essex or London, is the month a Founder-level decision on paid customer acquisition (EDR-10) becomes live, per the Constitution's own terms.
- Churn Risk list (Monetization page) — monthly deep review of every vendor on it, cross-referenced against Governance's quality tier for the same vendor (the same cross-reference WP-D2 already automates on Founder Dashboard).

---

## 14. KPIs for the first 100 vendors

All KPIs below reuse existing, already-tracked metrics — no new instrumentation is required.

**Acquisition:**
- 100 approved vendors, distributed per §2's category/location mix (with Essex and/or London prioritised to independently clear the Constitutional 30+ threshold).
- First 20 under Founding Vendor terms; vendors 21-100 under standard terms (§3).

**Verification quality:**
- 100% of approved vendors reach "ID Verified" within 7 days of approval (§6).
- At least the category(ies) targeted for the 15+ single-category threshold (DJ, Photographer) should trend toward "Documents Reviewed" tier over time, strengthening the specific categories most exposed to customer trust risk.

**Activation:**
- 100% of approved vendors reach "quote-ready" (S1-S6 of the real activation model) within 14 days of approval.
- Vendor Activation Board's "Needs Attention" segment should not exceed 20% of the approved base at any weekly check (§12).

**Commercial:**
- First paid subscription (any tier) — a genuine first-of-cohort milestone, since production has never had one.
- Subscription funnel baseline established (page_viewed → checkout_started → upgraded conversion rates) — the first real data this funnel will ever hold.
- 10%+ paid conversion across the cohort by the time all 100 are approved (a working assumption for a first cohort, not a figure derived from existing data, since none exists — treat as provisional and revise once real conversion data exists).

**Retention:**
- Zero vendors reach "critical" health tier without a logged retention-outreach action from the Vendors Needing Attention list (§10, §11).
- Churn-risk vendors (once subscriptions exist) contacted before their `current_period_end`, not after.

**Transactional proof (the Constitutional finish line, §1):**
- 50+ completed bookings and 20+ public verified reviews, concentrated in whichever geography (Essex or London) is closest to also clearing 30+ approved vendors and 15+ in one category — this combination is what unlocks the next Founder-level decision under EDR-10/EDR-12.

---

## 15. Risks and mitigation

Every risk below is drawn directly from `ELBOLD_TRANSFORMATION_GATE_2_REVIEW.md`'s verified findings — this section does not introduce new speculative risks, and does not recommend any platform change to address them; each mitigation is operational.

| Risk | Evidence | Operational mitigation |
|---|---|---|
| Overselling Founding Vendor status past the real 20-place cap | `/founding-vendors` copy: "20 places available" | Outreach scripts and CRM stages must distinguish "Founding Vendor pitch" (first 20 leads) from "standard pitch" (21-100) explicitly; do not reuse Founding Vendor messaging past place 20. |
| Customers unable to self-serve a dispute | TG-2 §2: dispute API + admin queue exist, no customer-facing form calls it; live path is email only | Until this changes (a platform decision, out of this playbook's scope), the operational team must monitor `disputes@elbold.com` actively and treat it as the sole live channel — do not assume the in-app system will surface a customer complaint automatically. |
| Escrow-language vs. manual-payout reality mismatch | TG-2 §2: `/trust` and `/about` describe deposit-holding in escrow terms; live payouts are manual bank transfer (Stripe Connect off) | Flag to the Founder for a copy/legal decision before this cohort generates real deposits at volume; do not personally reassure a vendor or customer about "held funds" mechanics beyond what the published copy already states. |
| Founder-facing commission figure inaccuracy at scale | TG-2 §3: `AdminAnalytics.tsx` estimates commission as 10% of gross revenue rather than summing the real ledger | Treat `/admin/monetization` and `/admin/founder`'s Commercial Overview (both using the real `computeCommercialMetrics()` ledger sum) as the authoritative commission figures for this cohort's reviews (§12, §13); do not use the Analytics page's commission sub-figure for commercial reporting. |
| False confidence in automated alerting | TG-2 §5: "Telegram alerts" is documented but not implemented in code | Do not rely on Telegram for operational awareness during this cohort. Check `/api/health` and the in-app admin alerts table directly; treat any belief that Telegram is already alerting the Founder as incorrect until the capability is actually built (a platform decision, out of scope here). |
| Rate-limiting silently fails open | TG-2 §5: Upstash-backed rate limiting fails open if credentials are unset in production; unverifiable from the repository | Confirm operationally (a Vercel environment check, not a code change) that Upstash credentials are live before this cohort's acquisition volume increases public-form traffic (applications, quote requests, contact forms). |
| Cron-driven vendor communications unconfirmed | TG-2 §4: `email_log`/`automation_logs` at 0 rows as of the last check; confirmation window had not yet occurred | Before relying on the Daily Summary email or CRM-follow-up cron as an activation lever for this cohort (§8), re-run the production check TG-1/TG-2 specified and confirm rows now exist. |
| REG-13 tier-naming gap creates messaging risk | TG-2 §3: live tiers are still Free/Pro/Premium/Elite, not the strategic Starter/Professional/Growth/Enterprise naming | Use only the real, live tier names and prices (§7) in all vendor-facing material for this cohort; do not pre-announce a tier structure that does not exist in the product yet. |
| Manual payout process does not scale with vendor count | TG-2 §1/§3/§5: Stripe Connect is code-complete but inactive; payouts are manual bank transfer | Budget Founder/operational time proportional to paying-vendor count for manual payout processing until Stripe Connect's external prerequisite clears; do not commit to payout SLAs that assume automation which isn't active. |
| REG-12 admin nav-filter gap | TG-1/Programme D: 3 admin pages missing the `adminRole` guard, still open, explicitly Engineering Excellence scope | No customer/vendor-facing impact identified; noted here only so the operational team is aware it is a known, tracked item and not a surprise if encountered. |
| No unit test coverage | TG-2 §5: `package.json`'s test script is a placeholder; E2E coverage is real | Not an operational mitigation this playbook can action — noted so the operational team does not assume unit-level regression protection exists when reporting a suspected bug; escalate suspected logic bugs for direct verification rather than assuming existing tests would have caught them. |

---

*This playbook does not authorise or recommend any platform implementation. It is an operating manual for the system as it exists today, per `ELBOLD_TRANSFORMATION_GATE_2_REVIEW.md`. Where a gap is named above, the mitigation is operational — a process, a communication discipline, or a verification check — never a proposed code change. Any decision to close one of these gaps at the platform level is a separate, explicit decision outside Commercial Launch Programme v1.0's current mandate.*
