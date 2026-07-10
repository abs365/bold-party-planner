# ELBOLD ENTERPRISE COMMERCIAL PRIORITISATION PROGRAMME (ECP)
## The Definitive Enterprise Implementation Backlog
**Prepared:** 2026-07-10 | **Classification:** Enterprise Implementation Backlog — supersedes all prior standalone priority lists (Commercial Evolution Strategy's Top 25, individual EDP recommendations) as the single register of record.
**Status:** Consolidation only. No new strategy, no new capability recommendations beyond what is essential to close a gap already identified in a source document. Nothing in this document has been implemented or deployed.

---

## METHODOLOGY

**Sources consolidated (all produced or refreshed 2026-07-10 within this Enterprise Design/Commercial Transformation Programme, except the Constitution which is 2026-06-30):**
`ELBOLD_CONSTITUTION.md` · `ELBOLD_2030_STRATEGY.md` · `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` · `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` · `ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md` · `ELBOLD_MARKET_AND_COMPETITOR_RESEARCH.md` · `ELBOLD_ENTERPRISE_EXPERIENCE_AUDIT.md` · `ELBOLD_EDP_01` through `ELBOLD_EDP_05`.

**Conflict check performed before scoring:** the governing strategy cluster was refreshed with current evidence immediately before this consolidation (same programme, same day), specifically to reconcile stale claims before they could propagate into this register. No live contradictions were found between the eight source documents at consolidation time — where an earlier document's estimate (e.g. Commercial Evolution Strategy's original Effort score for Stripe Connect activation) has since been corrected by fresher evidence, the corrected figure is used here and the correction is noted in the affected entry, not treated as a conflict requiring adjudication.

**Deduplication:** the same underlying fix (e.g. the `vendors.response_rate` scale mismatch) was independently flagged in four separate source documents (2030 Strategy, Vendor Value Blueprint, Executive Business Status Review, EDP-03). It appears exactly once below, as REG-01, with every source cited.

**Scoring model:** each item is scored 1-5 on six dimensions, weighted, summed, and multiplied by 20 to produce a 0-100 Priority Score.

| Dimension | Weight | 5 means | 1 means |
|---|---|---|---|
| Revenue Impact | 30% | Directly unblocks or materially grows commission/subscription revenue | No measurable revenue path |
| Vendor Retention | 25% | Directly prevents churn or deepens stickiness (per the Dependence Framework/Stickiness Ladder) | No retention effect |
| Customer Trust | 20% | Closes a real, evidenced trust gap or bug | No customer-facing trust effect |
| Operational Efficiency | 10% | Materially reduces manual admin/founder effort | No operational effect |
| Engineering Effort | 10% | **Scored as ease, not cost** — 5 = trivial/low effort, 1 = large multi-system build | (inverse) |
| Strategic Importance | 5% | Directly required by a Constitution EDR or 2030 Strategy milestone | Peripheral to stated strategy |

`Priority Score = 20 × [(Revenue×0.30) + (Retention×0.25) + (Trust×0.20) + (OpEff×0.10) + (Effort×0.10) + (Strategic×0.05)]` — range 20-100.

**Evidence discipline:** every entry's "Existing Capability" and "Business Problem" fields carry forward the evidence tags (Verified/Observation/Assumption) already established in the source documents rather than re-asserting them as new fact.

---

## P0 — CRITICAL LAUNCH BLOCKERS
*Data-integrity and trust defects that silently corrupt every other metric or promise in this register. Nothing else should be measured as "working" until these close.*

### REG-01 — Fix `vendors.response_rate` scale mismatch
- **Description:** DB column is `NUMERIC(4,3)` constrained 0-1; all application write paths send 0-100. Every write has been silently rejected since introduction, freezing the field at `DEFAULT 0.5` for effectively every vendor.
- **Business Problem:** Corrupts Business Health scoring (shown to every vendor, every day), generates false "low response rate" warnings with a real ranking penalty, blocks Level 3 verification auto-upgrade, and feeds `/admin/governance`'s at-risk list with a false signal.
- **Existing Capability:** **Verified** — the scoring/warning/verification logic that consumes this field is otherwise real and correctly wired (`capability_truth_audit.md` Capabilities 1, 13, 20); only the input is broken.
- **Proposed Improvement:** Widen the CHECK constraint to accept 0-100, or normalise application code to write 0-1 — either resolves it; a migration decision, not a design decision.
- **Commercial Value:** Restores the accuracy of the single number most likely to make a vendor feel "Elbold understands my business" (EDP-03 Cluster 1), and unblocks Level 3 credential progression (EDP-02 Section 4, EDP-03 Cluster 5).
- **Dependencies:** None — self-contained migration + code fix.
- **Estimated Effort:** S (single migration + call-site audit).
- **Sources:** `ELBOLD_2030_STRATEGY.md` Evidence Update §3; `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Evidence Update §2; `ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md` §0.4; `ELBOLD_EDP_03` Clusters 1, 5; `ELBOLD_EDP_05` Day 1.
- **Scoring:** Revenue 4 / Retention 5 / Trust 4 / OpEff 3 / Effort 5 / Strategic 4 → **Priority Score: 87**
- **Suggested Implementation Order: 1**

### REG-02 — Verify and, if broken, fix cron authentication (6 scheduled jobs)
- **Description:** All `app/api/cron/*` routes authorize via a custom `x-cron-secret` header; Vercel's native Cron Jobs feature sends `Authorization: Bearer`. No bridging code found.
- **Business Problem:** If broken, CRM follow-up reminders, the Daily Summary email, and verification auto-upgrade sweeps — three separate retention mechanisms this register otherwise treats as "built" — may never have fired in production.
- **Existing Capability:** **Verified** — the logic inside every cron route is confirmed sound; only the trigger mechanism is unverified (`capability_truth_audit.md` Capabilities 4, 5, 13, New Finding #2).
- **Proposed Improvement:** First step is verification only — check Vercel's Cron Jobs invocation log directly. If confirmed broken, add a bridging auth check accepting either header convention.
- **Commercial Value:** Directly determines whether three named retention mechanisms in EDP-03/EDP-05 are real or theoretical — the highest-leverage single verification action in this entire register because it changes the confidence level of multiple other entries at once.
- **Dependencies:** None to verify; the fix (if needed) is self-contained.
- **Estimated Effort:** S (verification), S-M (fix, if required).
- **Sources:** `ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md` §0.3; `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` Evidence Update §5; `ELBOLD_EDP_03` Clusters 1, 2; `ELBOLD_EDP_05` Week 1.
- **Scoring:** Revenue 3 / Retention 5 / Trust 3 / OpEff 4 / Effort 5 / Strategic 3 → **Priority Score: 83**
- **Suggested Implementation Order: 2**

### REG-03 — Fix hardcoded public-profile availability and enforce it in booking flows
- **Description:** `app/vendors/[id]/page.tsx:141` hardcodes `hasAvailability: false` for every vendor; separately, no quote or booking flow anywhere reads `vendor_availability` at all.
- **Business Problem:** A customer can request or book a date a vendor explicitly blocked. The vendor-facing UI's own claim ("Blocked dates are shown to customers") is false. This is the single feature named across three documents as the platform's most important daily habit (`ELBOLD_VENDOR_VALUE_BLUEPRINT.md` §2.1) — and it currently has no protective payoff.
- **Existing Capability:** **Verified** — the vendor's own calendar management works correctly and the same fix pattern already exists elsewhere in the codebase (`app/vendor/dashboard/page.tsx:106`).
- **Proposed Improvement:** Replace the hardcoded value with the real count query already proven correct elsewhere; wire availability checking into quote-request and direct-booking creation so a blocked date is honoured, not merely displayed.
- **Commercial Value:** `ELBOLD_EDP_03` names this the single highest-priority fix in the entire Design Programme — it also directly protects the public profile a vendor is actively encouraged to share externally (EDP-03 Cluster 7), so the fix compounds across two commercial mechanisms at once.
- **Dependencies:** None.
- **Estimated Effort:** S-M (known pattern to replicate + two call sites to gate).
- **Sources:** `capability_truth_audit.md` Capability 8; `ELBOLD_2030_STRATEGY.md` Evidence Update §3; `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Evidence Update §1; `ELBOLD_EDP_03` Clusters 4, 7; `ELBOLD_EDP_05` Month 3.
- **Scoring:** Revenue 3 / Retention 5 / Trust 5 / OpEff 2 / Effort 4 / Strategic 4 → **Priority Score: 86**
- **Suggested Implementation Order: 3**

### REG-04 — Enforce moderation status on the public reviews query
- **Description:** `app/vendors/[id]/page.tsx:166-172` queries all reviews for a vendor with no `moderation_status = 'approved'` filter; only the aggregate rating (DB-trigger maintained) currently excludes non-approved reviews.
- **Business Problem:** An admin "remove" or "flag" action does not actually remove a review from public view — a genuine moderation/reputation-protection failure on the platform's core trust asset (Constitution Principle 5, the review system).
- **Existing Capability:** **Verified** — the moderation workflow (approve/flag/remove, audit-logged) is otherwise fully real; only the read-side filter is missing.
- **Proposed Improvement:** Add the missing filter clause to the public query.
- **Commercial Value:** Protects the integrity of the platform's single most defensible competitive asset (`ELBOLD_2030_STRATEGY.md` §8.1's review-integrity argument) from being undermined by an admin action that silently doesn't work.
- **Dependencies:** None.
- **Estimated Effort:** S (one-line query fix).
- **Sources:** `capability_truth_audit.md` Capability 12, New Finding #4; `ELBOLD_EDP_03` Clusters 3, 5.
- **Scoring:** Revenue 2 / Retention 3 / Trust 5 / OpEff 2 / Effort 5 / Strategic 3 → **Priority Score: 68**
- **Suggested Implementation Order: 4**

### REG-05 — Server-side price verification on the direct "Book Now" path
- **Description:** `BookingRequestForm.tsx` computes `total_amount`/`deposit_amount`/`commission_amount` client-side; the Stripe checkout route trusts this figure without recomputing it against the vendor's real package price.
- **Business Problem:** A real, if narrow, financial-integrity gap — unlike the quote-acceptance path (server-computed and correct), this path's commission and payout figures are only as trustworthy as an unverified client-submitted value.
- **Existing Capability:** **Verified** — the correct pattern already exists and works in the quote-acceptance path; this is a consistency gap, not a missing capability.
- **Proposed Improvement:** Route this path through the same server-side recomputation pattern already proven in quote-acceptance.
- **Commercial Value:** Closes a financial-integrity gap before booking volume grows enough for it to matter at scale — cheapest to fix now, most expensive to discover later.
- **Dependencies:** None.
- **Estimated Effort:** M (touches checkout + booking creation).
- **Sources:** `capability_truth_audit.md` Capability 7, New Finding #3; `ELBOLD_EDP_03` Cluster 3.
- **Scoring:** Revenue 2 / Retention 2 / Trust 4 / OpEff 2 / Effort 3 / Strategic 2 → **Priority Score: 55**
- **Suggested Implementation Order: 8**

### REG-06 — Correct `.env.example` Stripe price variable names
- **Description:** `.env.example` still lists the old `STRIPE_PRO_MONTHLY_PRICE_ID` naming and has no entry for the Premium tier vars the live code actually requires.
- **Business Problem:** A fresh environment provisioned from this file would silently reintroduce the exact platform-wide checkout failure already fixed once in production (commit `9811021`).
- **Existing Capability:** **Verified** — the live checkout code itself is already fixed; only the reference/documentation file is stale.
- **Proposed Improvement:** Update `.env.example` to match the live code's actual variable names.
- **Commercial Value:** Pure regression prevention — protects a previously-fixed, revenue-critical bug from recurring.
- **Dependencies:** None.
- **Estimated Effort:** S (documentation-only change).
- **Sources:** `capability_truth_audit.md` Capability 14; `ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md` §0.3.
- **Scoring:** Revenue 3 / Retention 1 / Trust 1 / OpEff 3 / Effort 5 / Strategic 2 → **Priority Score: 51**
- **Suggested Implementation Order: 5**

---

## P1 — COMMERCIAL LAUNCH IMPROVEMENTS
*The acquisition and trust-page contradictions that undermine the subscription thesis this entire programme exists to establish, plus the specific trust/consistency bugs found on customer- and vendor-facing surfaces.*

### REG-07 — Rewrite vendor acquisition commercial framing (homepage + Founding Vendor Programme + application form)
- **Description:** Merges three separately-flagged instances of the same root problem: the homepage's vendor-recruitment section, `/founding-vendors`' opening benefit and closing CTA, and the application form's "what happens next" sidebar all currently lead with "no required subscription... we earn only when you do" / "start receiving enquiries" framing.
- **Business Problem:** This is the single most repeated friction point found across the entire programme — a prospective vendor encounters commission-only, lead-marketplace framing up to four times before reaching any evidence that Elbold is a business platform, directly contradicting the thesis every governing strategy document argues for.
- **Existing Capability:** **Verified** — the underlying business-platform capabilities (CRM, verification, analytics) this copy should be leading with are already real and well-built (`capability_truth_audit.md`); this is a messaging-sequencing fix, not a capability gap.
- **Proposed Improvement:** Apply `ELBOLD_EDP_04_BRAND_AND_LANGUAGE_SYSTEM.md`'s substitution table across all three surfaces; lead with business-platform value, disclose commission fully but not first. Add the "vendors who already use X" comparison content (`ELBOLD_VENDOR_VALUE_BLUEPRINT.md` §2.5) directly onto `/founding-vendors`, where it does not currently appear despite being written for that page.
- **Commercial Value:** `ELBOLD_EDP_02`'s Trust Map identifies this as the highest-leverage single fix in the acquisition journey — correcting one recurring sentence pattern addresses the majority of friction found across seven separate acquisition-journey stages.
- **Dependencies:** None technical; requires copy approval against `ELBOLD_EDP_04`.
- **Estimated Effort:** S-M (copy + content changes across 3 existing pages, no new components).
- **Sources:** `ELBOLD_EDP_01` Moment 5; `ELBOLD_EDP_02` §§1-3, 8, 9; `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Evidence Update §3, §2.5; `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` Evidence Update §3.
- **Scoring:** Revenue 5 / Retention 4 / Trust 4 / OpEff 1 / Effort 4 / Strategic 5 → **Priority Score: 85**
- **Suggested Implementation Order: 6**

### REG-08 — Reposition the vendor Payouts "Beta" disclosure
- **Description:** The Payouts page's best-in-class commission-transparency content is currently preceded by a leading amber "Payout System Beta / manual processing" banner.
- **Business Problem:** Undercuts trust on the single most money-sensitive page in the vendor product, ahead of content independently assessed as best-in-class fintech transparency.
- **Existing Capability:** **Verified** — the transparency content itself (exact 90/10 split, audited ledger tags) is correctly built and must not be redesigned.
- **Proposed Improvement:** Move the manual-processing disclosure to sit contextually with payout-history detail rather than leading the page; the underlying fact stays fully disclosed per Constitution Principle 11 — this is sequencing, not concealment.
- **Commercial Value:** Improves first impression of the platform's money-handling on the page most likely to influence subscription-renewal confidence.
- **Dependencies:** None.
- **Estimated Effort:** S (copy/layout reorder only).
- **Sources:** `experience_audit.md` Vendor Pages; `ELBOLD_EDP_03` Cluster 6.
- **Scoring:** Revenue 3 / Retention 3 / Trust 4 / OpEff 1 / Effort 5 / Strategic 2 → **Priority Score: 65**
- **Suggested Implementation Order: 9**

### REG-09 — Fix `PhoneVerifyModal` SMS/email mislabeling
- **Description:** Titled "Verify Phone Number" but its own copy discloses the code is sent by email, not SMS.
- **Business Problem:** A naming/mechanism mismatch on the exact page whose purpose is building vendor credibility.
- **Existing Capability:** **Verified** — the underlying email-OTP mechanism works correctly; only the label is wrong.
- **Proposed Improvement:** Rename the step to reflect the real mechanism (or implement true SMS delivery if that was the original intent — a Founder decision, not an engineering default).
- **Commercial Value:** Small-surface but direct trust-integrity fix on a verification-credibility page.
- **Dependencies:** Founder decision on which correction path (rename vs. implement real SMS).
- **Estimated Effort:** S (rename) or M (real SMS integration) depending on chosen path.
- **Sources:** `experience_audit.md` Vendor Pages; `ELBOLD_ENTERPRISE_EXPERIENCE_AUDIT.md` Refresh.
- **Scoring:** Revenue 1 / Retention 2 / Trust 4 / OpEff 1 / Effort 4 / Strategic 1 → **Priority Score: 47**
- **Suggested Implementation Order: 14**

### REG-10 — Resolve Customer Invitations (corrupted glyphs, non-functional, prominently linked)
- **Description:** Sits in primary customer nav; its four explainer icons are literally corrupted `"??"` glyphs and none of its four described features exist anywhere in the codebase.
- **Business Problem:** The inverse failure mode of an orphaned page — this one is prominently promoted and non-functional, the highest-risk pattern found because it's customer-visible by default.
- **Existing Capability:** **Verified** — none; this is genuinely unbuilt behind a real nav entry.
- **Proposed Improvement:** Either fix the glyphs and clearly label the page "Coming Soon" until built, or remove the nav entry entirely until the feature is real — per `ELBOLD_EDP_04` §4's rule that "a nav label is a promise; it should not ship before the destination can honour it." Building the full feature is explicitly not recommended here (not essential, per the founder's standing instruction against new capabilities unless essential).
- **Commercial Value:** Removes a live, customer-visible broken-promise from primary navigation.
- **Dependencies:** None.
- **Estimated Effort:** S (glyph fix + honest labelling, or nav removal).
- **Sources:** `experience_audit.md` Customer Pages; `ELBOLD_ENTERPRISE_EXPERIENCE_AUDIT.md` Refresh; `ELBOLD_EDP_04` §4.
- **Scoring:** Revenue 1 / Retention 1 / Trust 4 / OpEff 1 / Effort 5 / Strategic 1 → **Priority Score: 46**
- **Suggested Implementation Order: 15**

### REG-11 — Fix duplicate legal route canonical tag
- **Description:** `/vendor-terms` and `/legal/vendor-terms` are byte-identical with no `canonical` tag on either.
- **Business Problem:** Real SEO duplicate-content risk with no customer-facing symptom.
- **Existing Capability:** **Verified** — content itself is correct; only the canonicalisation is missing.
- **Proposed Improvement:** Add a canonical tag pointing one route at the other, or 301-redirect the duplicate.
- **Commercial Value:** Minor, technical-SEO hygiene.
- **Dependencies:** None.
- **Estimated Effort:** S.
- **Sources:** `experience_audit.md` Public Pages.
- **Scoring:** Revenue 1 / Retention 1 / Trust 1 / OpEff 1 / Effort 5 / Strategic 1 → **Priority Score: 33**
- **Suggested Implementation Order: 20**

### REG-12 — Fix 3 admin pages missing `adminRole` prop
- **Description:** `vendor-acquisition`, `vendor-outreach`, `vendor-pipeline` call `DashboardLayout` with no `adminRole`, silently disabling nav-level role filtering and leaking founder-only nav links to every admin viewing those pages.
- **Business Problem:** A nav-visibility leak (underlying API routes remain correctly gated — not a data-access breach, but an operational-hygiene and governance-consistency gap).
- **Existing Capability:** **Verified** — the role-filtering mechanism itself works correctly everywhere else; this is a missing prop on 3 call sites.
- **Proposed Improvement:** Add the missing prop; audit every `<DashboardLayout>` call site for the same omission as a one-time sweep.
- **Commercial Value:** Operational governance hygiene, low customer/revenue impact but directly relevant to Constitution Principle 3 (Enterprise Standards Always).
- **Dependencies:** None.
- **Estimated Effort:** S.
- **Sources:** `experience_audit.md` Admin/Founder Pages; `ELBOLD_ENTERPRISE_EXPERIENCE_AUDIT.md` Refresh.
- **Scoring:** Revenue 1 / Retention 1 / Trust 1 / OpEff 3 / Effort 5 / Strategic 3 → **Priority Score: 45**
- **Suggested Implementation Order: 16**

---

## P2 — SUBSCRIPTION GROWTH
*Deepening business-platform value and the specific mechanisms that make a subscription renew independent of marketplace volume.*

### REG-13 — Implement the subscription tier redesign (naming, pricing, code)
- **Description:** `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` §3.2 proposes Starter (free) / Professional (£49) / Growth (£89) / Enterprise (£149), reframed around business-tool value. Live `FALLBACK_PLANS` still uses the old Free/Pro/Premium/Elite naming.
- **Business Problem:** The single largest gap between governing strategy and live code in the entire register — three separate strategy documents recommend this and none of it has shipped.
- **Existing Capability:** **Observation** — checkout/webhook/entitlement infrastructure is confirmed functionally real (`capability_truth_audit.md` Capability 14); only the tier names, prices, and feature bundling need to change to match the proposal.
- **Proposed Improvement:** Implement the proposed tier structure in code, informed by `ELBOLD_MARKET_AND_COMPETITOR_RESEARCH.md`'s finding that contracts/invoicing should never be gated behind a tier alone (price the CRM module to stand alone against Dubsado/HoneyBook specifically).
- **Commercial Value:** Directly implements the core commercial thesis this entire document set exists to establish — the single highest revenue-impact item in the register that is not also a P0 trust bug.
- **Dependencies:** REG-07 (acquisition framing should not contradict the tier structure it's about to promote); ideally sequenced after REG-14/15 below so Growth-tier features exist before being sold.
- **Estimated Effort:** L (pricing/plan model changes, `FALLBACK_PLANS` and DB `subscription_plans` table, checkout copy, comparison table).
- **Sources:** `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` §3.2, Evidence Update §3; `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` §1.2; `ELBOLD_MARKET_AND_COMPETITOR_RESEARCH.md` positioning implications.
- **Scoring:** Revenue 5 / Retention 4 / Trust 2 / OpEff 1 / Effort 2 / Strategic 5 → **Priority Score: 74**
- **Suggested Implementation Order: 11**

### REG-14 — Activate Stripe Connect with real payment-routing (fee-split implementation)
- **Description:** Beyond the kill-switch, an exhaustive code search found zero fee-split implementation (`application_fee_amount`/`transfer_data`/`on_behalf_of` absent everywhere). Flipping the flag alone only activates vendor account onboarding.
- **Business Problem:** Every downstream off-platform payment/invoicing revenue line (REG-15, REG-16) depends on this being real, not just enabled.
- **Existing Capability:** **Verified** — onboarding UI/API genuinely exists and is correctly kill-switched; the payment-routing layer genuinely does not exist.
- **Proposed Improvement:** Build the actual Connect payment-routing layer (fee-split PaymentIntent creation) before any further off-platform payment feature work — this was previously mis-scored as "low effort, already built" across two source documents and is corrected here.
- **Commercial Value:** Foundational — `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` identifies off-platform payment processing as the highest-stickiness revenue line available, but it is entirely blocked on this.
- **Dependencies:** External: Stripe Connect platform approval status (unconfirmed, outside code); `STRIPE_CONNECT_WEBHOOK_SECRET` not yet configured in production.
- **Estimated Effort:** L (genuine payment-infrastructure build, not a configuration change — corrected effort score from prior documents).
- **Sources:** `capability_truth_audit.md` Capability 16, New Finding #5; `ELBOLD_2030_STRATEGY.md` Evidence Update §2; `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` Evidence Update §2; `ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md` §0.3.
- **Scoring:** Revenue 5 / Retention 4 / Trust 2 / OpEff 2 / Effort 1 / Strategic 4 → **Priority Score: 68**
- **Suggested Implementation Order: 12**

### REG-15 — Off-platform payment request links
- **Description:** Vendor sends a payment link to any client, off-platform or on; ELBOLD processes via Stripe, takes a processing fee.
- **Business Problem:** Named across three documents as the single highest-stickiness revenue mechanism available (financial integration = Stickiness Ladder Level 4).
- **Existing Capability:** **Verified — not built.**
- **Proposed Improvement:** Build once REG-14 provides real payment routing to build on.
- **Commercial Value:** Revenue independent of marketplace volume, plus the strongest stickiness mechanism in the Vendor Dependence Framework short of full enterprise integration.
- **Dependencies:** REG-14 (hard blocker).
- **Estimated Effort:** M-L.
- **Sources:** `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` §1.1, Priority #9; `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` §3.2 (Growth tier), §4.4.
- **Scoring:** Revenue 5 / Retention 4 / Trust 1 / OpEff 1 / Effort 2 / Strategic 3 → **Priority Score: 64**
- **Suggested Implementation Order: 17**

### REG-16 — Invoice generation and contract templates
- **Description:** No document management, invoicing, or contract capability exists anywhere in the codebase.
- **Business Problem:** Named consistently across every strategy document as the gap separating "tools that help" from "platform you cannot leave" — the two named capabilities that would make ELBOLD replace, not just complement, an existing CRM for an established vendor.
- **Existing Capability:** **Verified — not built.**
- **Proposed Improvement:** Basic PDF invoice generation (branded, status-tracked) and standard event-professional contract templates with e-signature — scoped exactly as `ELBOLD_2030_STRATEGY.md` §3's "12 MONTHS" tier describes, not gold-plated.
- **Commercial Value:** Per `ELBOLD_MARKET_AND_COMPETITOR_RESEARCH.md`: this is exactly the capability class (contracts/invoicing) that makes HoneyBook/Dubsado viable with zero lead-generation — the strongest, most externally-validated argument in the entire register for why this specific pair of features matters more than most.
- **Dependencies:** None technical (independent of Stripe Connect for the document-generation piece; payment-link-on-invoice depends on REG-14).
- **Estimated Effort:** L (genuinely new product surface, two related but distinct features).
- **Sources:** `ELBOLD_2030_STRATEGY.md` §3 (Contracts, Invoices); `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` Priorities #10-11; `ELBOLD_MARKET_AND_COMPETITOR_RESEARCH.md`.
- **Scoring:** Revenue 4 / Retention 5 / Trust 1 / OpEff 1 / Effort 1 / Strategic 4 → **Priority Score: 63**
- **Suggested Implementation Order: 18**

### REG-17 — Elevate CRM and analytics visibility inside the daily dashboard
- **Description:** Two independent, already-real capabilities (CRM, Analytics) are each independently described in source documents as under-surfaced relative to their actual commercial importance.
- **Business Problem:** A vendor cannot feel a capability is indispensable if they don't know it's there — both capabilities are fully built and correctly working, but not prioritised in the Business Control Centre's daily-action logic relative to marketplace-dependent prompts.
- **Existing Capability:** **Verified** — both CRM and Analytics are fully real (`capability_truth_audit.md` Capabilities 2, 15); the Business Control Centre's priority logic is also real and branching (Capability 1).
- **Proposed Improvement:** No new capability — reprioritise existing Daily Highest-Impact Action logic to weight CRM/analytics actions equally with marketplace-dependent ones, especially for zero-marketplace-activity vendors; surface one specific analytics insight per Business Control Centre visit connected to a corresponding action (e.g., availability adjustment).
- **Commercial Value:** Directly serves `ELBOLD_2030_STRATEGY.md` §8.1's "subscription MRR per active vendor" thesis by connecting existing value to daily habit formation, at effectively zero new-build cost.
- **Dependencies:** None.
- **Estimated Effort:** S-M (logic reprioritisation within an existing, working system).
- **Sources:** `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` §1.2; `ELBOLD_EDP_02` §7; `ELBOLD_EDP_03` Clusters 2, 8; `ELBOLD_EDP_05` Week 1, Month 2.
- **Scoring:** Revenue 3 / Retention 4 / Trust 1 / OpEff 1 / Effort 4 / Strategic 3 → **Priority Score: 60**
- **Suggested Implementation Order: 10**

### REG-18 — Build/verify pre-renewal "what you've gained" retention summary
- **Description:** `ELBOLD_2030_STRATEGY.md` §4.3 specifies this exact mechanism (show what improved, what's coming, before renewal); implementation status was not confirmed by the capability-truth audit.
- **Business Problem:** Month-2/3 is the highest-risk churn window (`ELBOLD_EDP_05` Month 2-3) — this is the named, already-designed mechanism for it.
- **Existing Capability:** **Assumption** — specified in governing strategy, not confirmed built or unbuilt in the fresh audit; requires direct verification before scoping further work.
- **Proposed Improvement:** Verify first; if unbuilt, implement using data already computed elsewhere (profile views, completion score, seasonal forecast are all confirmed real per `capability_truth_audit.md` Capability 15).
- **Commercial Value:** Directly targeted at the exact churn window `ELBOLD_2030_STRATEGY.md` names as highest-risk.
- **Dependencies:** Verification step must precede scoping.
- **Estimated Effort:** S (verification) then S-M (build, if needed — all source data already exists).
- **Sources:** `ELBOLD_2030_STRATEGY.md` §4.3; `ELBOLD_EDP_05` Month 2.
- **Scoring:** Revenue 3 / Retention 4 / Trust 1 / OpEff 1 / Effort 4 / Strategic 3 → **Priority Score: 59**
- **Suggested Implementation Order: 13**

### REG-19 — Verify/build early-warning churn triggers (no login 7d, no CRM contact 14d)
- **Description:** `ELBOLD_2030_STRATEGY.md` §4.3 specifies these triggers; implementation status unconfirmed.
- **Business Problem:** Same churn-prevention gap as REG-18, earlier in the funnel (Week 1-2 rather than Month 2-3).
- **Existing Capability:** **Assumption** — specified, not confirmed.
- **Proposed Improvement:** Verify against production; the Daily Summary email infrastructure (confirmed real, Capability 5) is the natural delivery channel if these need building.
- **Commercial Value:** Earliest possible churn intervention point in the entire journey.
- **Dependencies:** REG-02 (cron reliability) should be confirmed first, since these triggers likely depend on the same scheduled-job infrastructure.
- **Estimated Effort:** S (verification) then S-M (build, if needed).
- **Sources:** `ELBOLD_2030_STRATEGY.md` §4.3; `ELBOLD_EDP_05` Week 1.
- **Scoring:** Revenue 2 / Retention 4 / Trust 1 / OpEff 1 / Effort 4 / Strategic 3 → **Priority Score: 55**
- **Suggested Implementation Order: 19**

### REG-20 — Channel-specific share/QR attribution
- **Description:** Extend the already-working `?ref=share` parameter pattern to distinguish QR scans, link copies, and native shares.
- **Business Problem:** A vendor who prints a QR code on business cards currently has no way to know whether it's working — the zero-cost acquisition channel `ELBOLD_2030_STRATEGY.md` §6.3 names as a flywheel acceleration point is unmeasurable.
- **Existing Capability:** **Verified** — the `?ref=share` mechanism already exists, works, and is already read by the destination page (competitor-suppression use case); this proposal extends an existing, proven pattern.
- **Proposed Improvement:** Tag each sharing channel at generation time (`?ref=qr`, `?ref=share`, future `?ref=whatsapp`) using the existing parameter-reading infrastructure — no new tracking system required.
- **Commercial Value:** Makes a genuinely zero-cost acquisition channel measurable for the first time, informing whether further investment in share tooling (brochure PDF, etc.) is justified.
- **Dependencies:** None.
- **Estimated Effort:** S (extends an existing, working pattern).
- **Sources:** `capability_truth_audit.md` Capability 11; `ELBOLD_EDP_03` Cluster 7.
- **Scoring:** Revenue 2 / Retention 2 / Trust 1 / OpEff 2 / Effort 5 / Strategic 2 → **Priority Score: 51**
- **Suggested Implementation Order: 7**

### REG-21 — Google Calendar sync
- **Description:** Two-way sync between ELBOLD's availability calendar and Google Calendar.
- **Business Problem:** Converts the availability calendar from "useful when remembered" to "automatic" — directly reinforces REG-03's fix by making the underlying habit easier to sustain.
- **Existing Capability:** **Verified — not built.**
- **Proposed Improvement:** Standard OAuth-based two-way sync, sequenced after REG-03 (no value in syncing a calendar whose enforcement is still broken).
- **Commercial Value:** Named priority #12 in `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md`'s original register; retained here at moderate priority.
- **Dependencies:** REG-03 (logical, not technical — sequencing only).
- **Estimated Effort:** M.
- **Sources:** `ELBOLD_2030_STRATEGY.md` §3 (Calendar and Availability); `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` Priority #12.
- **Scoring:** Revenue 2 / Retention 3 / Trust 1 / OpEff 1 / Effort 3 / Strategic 2 → **Priority Score: 49**
- **Suggested Implementation Order: 21**

### REG-22 — CRM contact CSV import
- **Description:** Bulk-upload existing contacts (phone export or spreadsheet) directly into the CRM.
- **Business Problem:** The fastest possible way to populate the CRM and create the "would lose real business history" dependency EDP-03 Cluster 2 identifies as the core stickiness mechanism — currently a vendor must add every contact manually, one at a time.
- **Existing Capability:** **Verified — not built.** The CRM itself (destination) is fully real (Capability 2).
- **Proposed Improvement:** Standard CSV/vCard import into `manual_contacts`.
- **Commercial Value:** Directly accelerates the single most subscription-resilient capability on the platform reaching meaningful usage volume per vendor.
- **Dependencies:** None.
- **Estimated Effort:** S-M.
- **Sources:** `ELBOLD_2030_STRATEGY.md` §3 (CRM); `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` Priority #22.
- **Scoring:** Revenue 2 / Retention 3 / Trust 1 / OpEff 2 / Effort 4 / Strategic 2 → **Priority Score: 51**
- **Suggested Implementation Order: 22**

---

## P3 — CUSTOMER GROWTH
*The homepage/customer-experience transformation and the SEO/navigation fixes that widen genuine top-of-funnel discovery.*

### REG-23 — Homepage transformation (EDP-01 full recommendation set)
- **Description:** Consolidates EDP-01's six moments into one implementation item: occasion-aware hero, adding a Religious & Family Milestones occasion card, reframing "The Elbold Promise" from prohibition to care language, elevating the concierge section with specific framing, and closing-CTA personalisation.
- **Business Problem:** Current homepage under-represents an entire occasion class (no religious/faith representation anywhere) and leads with procedural trust language over warmth, against a brief specifically requiring both — see REG-07 for the vendor-section portion of this same page, tracked separately since it's a distinct audience and root cause.
- **Existing Capability:** **Verified** — every underlying trust fact referenced (verification, Stripe protection, refund policy) is real; this is a content/structure/copy transformation of an already-functioning page, not new capability.
- **Proposed Improvement:** As specified in full in `ELBOLD_EDP_01_CUSTOMER_EXPERIENCE.md`.
- **Commercial Value:** First-time, non-branded-search visitor conversion — the top of the entire customer acquisition funnel.
- **Dependencies:** None technical.
- **Estimated Effort:** M (copy, one new occasion card with sourced imagery, section reordering — no new backend).
- **Sources:** `ELBOLD_EDP_01_CUSTOMER_EXPERIENCE.md` (full document).
- **Scoring:** Revenue 3 / Retention 1 / Trust 4 / OpEff 1 / Effort 3 / Strategic 3 → **Priority Score: 56**
- **Suggested Implementation Order: 23**

### REG-24 — Fix orphaned `/categories/[category]` route and Customer Settings navigation
- **Description:** Two structurally identical failures: a fully-built, SEO-correct category route tree with zero inbound internal links, and a fully-built Customer Settings page with zero navigation entry points.
- **Business Problem:** Complete, working pages that were never wired into navigation — a launch-checklist gap (build → link from nav → verify reachability), not a scoping problem.
- **Existing Capability:** **Verified** — both destinations are fully built and correct; only the navigation path is missing.
- **Proposed Improvement:** Add `/categories` to relevant nav/browse-page cross-links; add Customer Settings to the customer sidebar/header nav.
- **Commercial Value:** Recovers SEO value already built but currently undiscoverable (categories) and improves account-management self-service (settings).
- **Dependencies:** None.
- **Estimated Effort:** S.
- **Sources:** `experience_audit.md` Public Pages, Customer Pages; `ELBOLD_ENTERPRISE_EXPERIENCE_AUDIT.md` Refresh.
- **Scoring:** Revenue 2 / Retention 1 / Trust 1 / OpEff 1 / Effort 5 / Strategic 2 → **Priority Score: 47**
- **Suggested Implementation Order: 24**

### REG-25 — Category + city SEO landing pages
- **Description:** Dedicated, indexed pages (`elbold.com/photographers/london`) distinct from the orphaned `/categories/[category]` tree — combining category and geography for long-tail search capture.
- **Business Problem:** Named across two strategy documents as organic customer acquisition ELBOLD does not currently have, and specifically flagged as a differentiator ("no competing marketplace has strong local SEO").
- **Existing Capability:** **Observation** — related but distinct from REG-24's existing category pages; not confirmed built.
- **Proposed Improvement:** Build once REG-24 confirms the base category-page pattern is sound and discoverable.
- **Commercial Value:** Zero-marginal-cost customer acquisition once indexed, per `ELBOLD_2030_STRATEGY.md` §6.3 Acceleration Point 3.
- **Dependencies:** REG-24 (logical sequencing — fix the existing tree's discoverability before multiplying it).
- **Estimated Effort:** M.
- **Sources:** `ELBOLD_2030_STRATEGY.md` §3 (SEO); `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` Priority #19.
- **Scoring:** Revenue 2 / Retention 1 / Trust 1 / OpEff 1 / Effort 3 / Strategic 2 → **Priority Score: 40**
- **Suggested Implementation Order: 25**

### REG-26 — Customer-side empty-state and loading-skeleton parity
- **Description:** Vendor-side empty states are confirmed excellent; customer-side is uneven — Bookings has no pagination/scale handling, Quote Detail has no loading skeleton at all.
- **Business Problem:** Inconsistent polish between the two audiences undermines the "premium, enterprise-consistent" standard the brief requires uniformly.
- **Existing Capability:** **Verified** — the vendor-side pattern to replicate already exists and works.
- **Proposed Improvement:** Apply the vendor-side empty/loading-state pattern to the specific customer surfaces named in the audit.
- **Commercial Value:** Incremental trust/polish improvement, lower urgency than P0-P1 trust bugs since nothing here is factually wrong, only inconsistently finished.
- **Dependencies:** None.
- **Estimated Effort:** S-M.
- **Sources:** `experience_audit.md` Customer Pages; `ELBOLD_EDP_04` §4.
- **Scoring:** Revenue 1 / Retention 2 / Trust 2 / OpEff 1 / Effort 4 / Strategic 1 → **Priority Score: 41**
- **Suggested Implementation Order: 26**

---

## P4 — OPERATIONAL OPTIMISATION
*Design-system consistency, dead-code cleanup, and outstanding operational-hygiene items — real, but the least commercially urgent tier given current vendor volume.*

### REG-27 — Resume Component Migration Plan V2 (Sprints 2-4)
- **Description:** Sprint 0-1 (design tokens, 4 P0 component fixes) shipped and confirmed live; Sprints 2-4 (Alert/Modal components, vendor sidebar regrouping, emoji removal, admin dark-theme conversion, ~15 more items) were fully specced in `ELBOLD_COMPONENT_MIGRATION_PLAN_V2.md` but never started.
- **Business Problem:** A stalled, already-planned programme — this is resumption, not new scoping.
- **Existing Capability:** **Verified** — Sprint 0-1 deliverables confirmed live in code; the plan for the remainder already exists in full detail.
- **Proposed Improvement:** Resume from Sprint 2 exactly as specced; no re-planning needed.
- **Commercial Value:** Design consistency at platform scale — real but lower urgency than any P0-P2 item given current ~2-vendor production volume.
- **Dependencies:** None blocking; sequenced last because effort-to-current-commercial-impact ratio is weaker than every item above it.
- **Estimated Effort:** L (multi-sprint, already scoped).
- **Sources:** `ELBOLD_COMPONENT_MIGRATION_PLAN_V2.md`; `prior_strategy_digest.md` Cross-cutting finding #4.
- **Scoring:** Revenue 1 / Retention 1 / Trust 2 / OpEff 2 / Effort 1 / Strategic 2 → **Priority Score: 30**
- **Suggested Implementation Order: 28**

### REG-28 — Fix admin dark-theme fork (governance-log, team, 3 vendor-acquisition pages, SEO)
- **Description:** These pages render in a completely different light Tailwind-default theme against the dark navy/gold system used by ~40 other admin pages.
- **Business Problem:** Internal-only (admin/founder-facing), so no customer/vendor commercial impact — pure operational-consistency debt.
- **Existing Capability:** **Verified** — the correct dark-theme pattern already exists and is used everywhere else in admin; this is a migration of 6 outlier pages to match it.
- **Proposed Improvement:** Migrate the named pages to the standard admin theme.
- **Commercial Value:** Minimal direct commercial value; improves founder/ops daily experience only.
- **Dependencies:** Naturally bundles with REG-27.
- **Estimated Effort:** M.
- **Sources:** `experience_audit.md` Admin/Founder Pages; `ELBOLD_ENTERPRISE_EXPERIENCE_AUDIT.md` Refresh.
- **Scoring:** Revenue 1 / Retention 1 / Trust 1 / OpEff 3 / Effort 3 / Strategic 1 → **Priority Score: 33**
- **Suggested Implementation Order: 27**

### REG-29 — Design-token drift cleanup (inline hex → token classes)
- **Description:** The dominant, most recurring issue found across all four page groups in the fresh experience audit — real navy/gold tokens exist in `globals.css` but are bypassed by inline hex styles platform-wide.
- **Business Problem:** Nothing currently looks broken (values match); the risk is entirely future — any rebrand or theme adjustment currently requires a manual audit of dozens of files instead of one token edit.
- **Existing Capability:** **Verified** — the token system itself is real and correct; the problem is non-adoption, not absence.
- **Proposed Improvement:** A lint rule or codemod pass replacing inline hex with token classes, prioritising highest-traffic pages first (homepage, browse, vendor profile, quotes flows).
- **Commercial Value:** Pure future-proofing; zero present-day customer-visible effect.
- **Dependencies:** None.
- **Estimated Effort:** L (platform-wide sweep, even if mechanically assisted).
- **Sources:** `experience_audit.md` Platform-Wide Cross-Cutting Findings #1.
- **Scoring:** Revenue 1 / Retention 1 / Trust 1 / OpEff 2 / Effort 1 / Strategic 1 → **Priority Score: 21**
- **Suggested Implementation Order: 29**

### REG-30 — Remove confirmed dead code and close operational-hygiene gaps
- **Description:** Bundles four small, independent items: remove `components/admin/AdminPayoutsView.tsx` (confirmed unused); deploy the `financial_ledger_events` migration (P3 gap open since Phase 69F.3); reconcile `schema_migrations` for migrations 051-059; verify PITR retention at the Supabase billing dashboard.
- **Business Problem:** None are commercially urgent; all are standing operational-hygiene debt with no customer or vendor visibility.
- **Existing Capability:** **Verified** (dead code) / **Verified as still-open gaps** (the other three, carried forward unchanged from `ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md`'s original Appendix, not re-verified as fixed in this pass).
- **Proposed Improvement:** Batch these into a single low-priority operational-hygiene pass.
- **Commercial Value:** Disaster-recovery/audit-completeness insurance, not growth.
- **Dependencies:** None.
- **Estimated Effort:** S (each individually), grouped for efficiency.
- **Sources:** `experience_audit.md` Admin/Founder Pages (dead code); `ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md` Appendix (the other three).
- **Scoring:** Revenue 1 / Retention 1 / Trust 1 / OpEff 3 / Effort 4 / Strategic 1 → **Priority Score: 35**
- **Suggested Implementation Order: 30**

### REG-31 — Stage 2 admin role assignments (Lz, ML)
- **Description:** Global Admin Ts is active; Lz and ML remain unassigned, pending an identity-confirmation step for Lz (two candidate accounts) already documented.
- **Business Problem:** Founder remains a structural single point of failure for operations beyond Ts's capacity — an organisational/people item, not an engineering one.
- **Existing Capability:** **Verified** — the RBAC infrastructure to support this is fully built and already proven with Ts's assignment.
- **Proposed Improvement:** Founder confirms Lz's correct account, then executes the already-documented role-assignment procedure.
- **Commercial Value:** Operational scalability; indirectly protects every other item in this register from being bottlenecked on founder availability.
- **Dependencies:** Founder decision (identity confirmation) — not an engineering dependency.
- **Estimated Effort:** S (process, not code).
- **Sources:** `ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md` §1.4, §6.3; `project_elbold` memory.
- **Scoring:** Revenue 1 / Retention 1 / Trust 1 / OpEff 4 / Effort 4 / Strategic 2 → **Priority Score: 42**
- **Suggested Implementation Order: 31**

### REG-32 — Language system rollout: heading/CTA/error-message pass
- **Description:** Apply `ELBOLD_EDP_04_BRAND_AND_LANGUAGE_SYSTEM.md`'s remaining generalised rules not already captured in REG-07 — heading language (e.g. "Contacts" → "Your Customers"), CTA-specificity pass beyond the one surface already fixed, and a dedicated error/validation-message audit (explicitly flagged in EDP-04 as unaudited and requiring a follow-up pass, not claimed as complete).
- **Business Problem:** Incremental warmth/clarity improvement across many small surfaces — individually low-impact, collectively part of the "premium, consistent" standard.
- **Existing Capability:** **Assumption** for the error-message portion specifically — EDP-04 explicitly did not audit this exhaustively and recommended a dedicated pass first.
- **Proposed Improvement:** Sequenced last precisely because it requires the not-yet-done error-message inventory before implementation can be scoped accurately — recommend the audit pass as its own small item ahead of the fixes it would produce.
- **Commercial Value:** Diffuse, cumulative brand-consistency value rather than one measurable commercial lever.
- **Dependencies:** A dedicated validation/error-copy audit (not yet performed) should precede this item's implementation.
- **Estimated Effort:** M (audit) + S-M (fixes, scope TBD by audit).
- **Sources:** `ELBOLD_EDP_04_BRAND_AND_LANGUAGE_SYSTEM.md` §§3-4.
- **Scoring:** Revenue 1 / Retention 1 / Trust 2 / OpEff 1 / Effort 3 / Strategic 2 → **Priority Score: 34**
- **Suggested Implementation Order: 32**

---

## SECTION — CONSOLIDATED IMPLEMENTATION SEQUENCE

| Order | ID | Item | Group | Score |
|---|---|---|---|---|
| 1 | REG-01 | Fix `response_rate` scale mismatch | P0 | 87 |
| 2 | REG-02 | Verify/fix cron authentication | P0 | 83 |
| 3 | REG-03 | Fix availability hardcode + enforce in booking flows | P0 | 86 |
| 4 | REG-04 | Enforce moderation status on public reviews | P0 | 68 |
| 5 | REG-06 | Correct `.env.example` Stripe vars | P0 | 51 |
| 6 | REG-07 | Rewrite vendor acquisition commercial framing | P1 | 85 |
| 7 | REG-20 | Channel-specific share/QR attribution | P2 | 51 |
| 8 | REG-05 | Server-side price verification, "Book Now" | P0 | 55 |
| 9 | REG-08 | Reposition Payouts "Beta" disclosure | P1 | 65 |
| 10 | REG-17 | Elevate CRM/analytics visibility in dashboard | P2 | 60 |
| 11 | REG-13 | Implement subscription tier redesign | P2 | 74 |
| 12 | REG-14 | Stripe Connect real payment-routing | P2 | 68 |
| 13 | REG-18 | Pre-renewal retention summary (verify/build) | P2 | 59 |
| 14 | REG-09 | Fix `PhoneVerifyModal` mislabeling | P1 | 47 |
| 15 | REG-10 | Resolve Customer Invitations | P1 | 46 |
| 16 | REG-12 | Fix 3 admin pages' missing `adminRole` | P1 | 45 |
| 17 | REG-15 | Off-platform payment request links | P2 | 64 |
| 18 | REG-16 | Invoice generation + contract templates | P2 | 63 |
| 19 | REG-19 | Early-warning churn triggers (verify/build) | P2 | 55 |
| 20 | REG-11 | Duplicate legal route canonical tag | P1 | 33 |
| 21 | REG-21 | Google Calendar sync | P2 | 49 |
| 22 | REG-22 | CRM contact CSV import | P2 | 51 |
| 23 | REG-23 | Homepage transformation (EDP-01) | P3 | 56 |
| 24 | REG-24 | Fix orphaned categories/settings nav | P3 | 47 |
| 25 | REG-25 | Category + city SEO landing pages | P3 | 40 |
| 26 | REG-26 | Customer empty-state/skeleton parity | P3 | 41 |
| 27 | REG-28 | Fix admin dark-theme fork | P4 | 33 |
| 28 | REG-27 | Resume Migration Plan V2 Sprints 2-4 | P4 | 30 |
| 29 | REG-29 | Design-token drift cleanup | P4 | 21 |
| 30 | REG-30 | Dead code + operational-hygiene batch | P4 | 35 |
| 31 | REG-31 | Stage 2 admin role assignments | P4 | 42 |
| 32 | REG-32 | Language system rollout (headings/CTA/errors) | P4 | 34 |

**Note on sequencing versus raw score:** implementation order is not a strict score-descending sort — dependencies override score where a lower-scored item unblocks a higher-scored one (e.g. REG-20's attribution work is sequenced early at position 7 despite a mid-range score because it is a five-minute extension of already-shipped code with no dependency chain, while REG-05 at position 8 has a materially higher engineering surface despite scoring similarly). Every dependency noted in an individual entry above is reflected in this ordering.

---

## SECTION — WHAT WAS DELIBERATELY EXCLUDED

Per the founder's standing instruction against new capabilities unless essential, the following items appeared in one or more source documents but are **not included** in this register because no source document established they are currently essential:

- Mobile application (`ELBOLD_2030_STRATEGY.md` explicitly defers to Year 4; `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` defers to 200+ active vendors).
- Business intelligence / market data reports, category benchmarking, industry certification (all explicitly gated by every source document behind data volume or vendor-count thresholds not yet met — current production has 2 approved vendors).
- Finance partnerships (insurance/lending referrals) — gated behind 50+ vendors with 12+ months of financial history, per `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md`.
- Any AI-assisted or AI-generated customer/vendor-facing feature — explicitly excluded by Constitution "What Elbold Never Builds" and EDR-06 before Year 3.
- Adjacent-vertical expansion beyond event services — explicitly excluded by Constitution Principle 6 and `ELBOLD_2030_STRATEGY.md` §8.2 before Phase 3.

---

*Companion documents: all eight sources listed in Methodology above. This register supersedes `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` Section 3 (Top 25 Commercial Priorities) as the operative priority list — that section remains in place as historical record per this program's "preserve document history" convention, cross-referenced here rather than deleted.*

*Not implemented. Not deployed. This is a backlog, not a change log.*
