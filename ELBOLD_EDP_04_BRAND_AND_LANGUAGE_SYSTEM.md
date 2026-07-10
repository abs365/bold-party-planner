# ELBOLD ENTERPRISE DESIGN PROGRAMME
## EDP-04 — Brand & Language System
**Prepared:** 2026-07-10 | **Classification:** Implementation Blueprint — Enterprise Design Programme. **This document is the editorial standard for the entire company** — every future piece of ELBOLD-facing copy, in any surface, should be checked against it.
**Status:** Subordinate to `ELBOLD_CONSTITUTION.md`, which is the authority on *what* ELBOLD may claim; this document is the authority on *how* ELBOLD says it.

---

> A reusable system, not a list of corrected sentences. Every rule below generalises to copy this document's authors have not seen yet — a new empty state, a new email, a new error message written next year should be writable correctly by applying the principles here, without needing a new audit to find the specific mistake first.

Every claim below is tagged **Verified** (an exact string read from live code, cited), **Observation** (a pattern inferred across multiple citations, not exhaustively confirmed everywhere it could occur), **Assumption** (a gap being inferred), or **Recommendation** (a proposed rule or rewrite). This document does not speculate about copy it has not read.

---

## SECTION 1 — THE BRAND NAME

**Rule, restated from the founder's governing instruction:** The brand is always **Elbold**. Never **ELBOLD**, **ElBold**, **El Bold**, or **ELBOLD Events**.

**Verified**: every customer- and vendor-facing string read across the homepage, Founding Vendor Programme, onboarding, and the governing strategy documents' own prose (not their filenames) already writes "Elbold" correctly and consistently — this rule is holding in practice, not just in policy.

**Recommendation, scoped narrowly:** this rule governs brand copy — page titles, body text, button labels, emails. It does not extend to file naming conventions (`ELBOLD_CONSTITUTION.md`, etc.), which are an internal documentation convention, not customer-facing brand expression, and are explicitly out of scope for this rule.

---

## SECTION 2 — THE CORE PRINCIPLE

**Observation, synthesised across every document produced in this programme:** the platform's copy defaults, in three separate audited places (`ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md` Sections 1-3), to *transactional* framing — what is free, what is required, what happens next as a mechanical sequence — even in sections whose underlying substance is genuinely about trust, professionalism, and business growth. The gap is not that the copy is inaccurate. It is that accurate, transactional language and warm, confidence-building language are not the same thing, and the platform has been defaulting to the former where the brief calls for the latter.

**The rule:** every piece of ELBOLD copy should be tested against a single question before it ships: **does this sentence describe a transaction, or does it communicate trust, confidence, professionalism, business growth, business success, or warmth?** Facts do not change. Only the register they are delivered in does.

**Recommendation — the substitution pattern, evidenced:**

| Instead of (transactional) | Write (relational) | Evidence this pattern currently exists |
|---|---|---|
| "No hidden fees, no required subscription" | "Everything you need to start is included — upgrade when your business is ready to grow further" | **Verified**, `app/founding-vendors/page.tsx`, `BENEFITS[0]` |
| "Elbold earns only when you do" | "We succeed when your business succeeds" | **Verified**, `app/founding-vendors/page.tsx`, final CTA |
| "Start receiving enquiries" | "Start building your business on Elbold" | **Verified**, recurring in `app/founding-vendors/page.tsx` Step 4, `VendorApplyForm.tsx` sidebar Step 4, and `app/vendor/onboarding/page.tsx`'s onboarding subtitle |
| "No vendor joins automatically. No review is unverified. No payment is unprotected." | "Every professional here was personally reviewed. Every review comes from a real event. Every payment is protected from start to finish." | **Verified**, `app/page.tsx`, "The Elbold Promise" section |
| "Keep 90% of every booking you receive" | "You keep the vast majority of every booking — we take a fair, transparent share for the trust and protection we provide" | **Verified**, `app/page.tsx`, `VENDOR_BENEFITS[1]` |

The pattern in every row above is the same: the underlying fact is unchanged (nothing here proposes altering the 90/10 split, the free tier, or any disclosure required by Constitution Principle 11). What changes is whether the sentence is built around a rule/prohibition/condition, or around what the reader receives and becomes.

---

## SECTION 3 — VOICE BY AUDIENCE

**Customer language.** **Observation**, drawn from `ELBOLD_EDP_01_CUSTOMER_EXPERIENCE.md` Section 2: current customer-facing copy skews toward procedural reassurance (what is protected, what is verified) over emotional recognition (what this event means to the person planning it). The corrected voice: specific, warm, and occasion-aware — speaking to "the wedding you've been picturing" rather than "your occasion." Never presumes an occasion type; when the audience is mixed, use warmth that is genuinely occasion-neutral (family, celebration, milestone) rather than a generic corporate register.

**Vendor language.** **Observation**, drawn from `ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md` and `ELBOLD_EDP_03_VENDOR_DAILY_OPERATING_PLATFORM.md`: vendor-facing copy should speak to a business owner, not an applicant or a gig worker. "Your business" appears correctly in some places already (`ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 3.3's own recommended rewrite: *"Run your event business professionally"*) and should be the default frame everywhere a vendor is addressed — including in places currently framed around "listings" or "enquiries" as the unit of value, which subtly casts the vendor as a participant in ELBOLD's marketplace rather than an operator of their own business that ELBOLD serves.

**Founder/operations language.** **Verified** (`project_elbold` memory; `ELBOLD_COMMERCIAL_LAUNCH_READINESS_REPORT.md` Nav/terminology cleanup, 2026-07-02): this register has already been substantially corrected in a prior pass — "Pilot Launch" → "Founder & Growth," "Pilot Ops" → "Growth Operations," etc. **Observation** (`experience_audit.md`, Admin/Founder Long Tail finding): the underlying **URLs still read `/admin/pilot/*`** despite the nav labels being corrected — internal-only, not customer-facing, but worth naming here as the one place this document's principle (say what the platform is, not what stage it's privately in) has not yet reached the code layer, only the display layer.

**Trust language.** **Recommendation**: trust copy should state what ELBOLD does, in the active voice, before it states what ELBOLD prevents. Section 2's substitution table is the concrete application of this rule to the platform's single largest trust-copy block (the "Elbold Promise" section).

**Subscription language.** **Verified** (`ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 3.3, already the governing recommendation): "Current: 'Upgrade to get more visibility. Get featured. Get found faster.' Target: 'Run your event business professionally. Get paid reliably. Keep your clients coming back.'" This document adopts that rewrite as the standing rule for all subscription copy, platform-wide, not only the subscription page itself — every CTA, email, and in-app nudge that mentions upgrading should be checked against this same target register.

**Marketplace language.** **Recommendation**: "marketplace" and "commission" should be named plainly and disclosed clearly (Constitution Principle 11 requires this) but should not be the *lead* framing in vendor-facing copy, consistent with `ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md`'s finding that leading with commission-only framing actively undermines the subscription thesis. Marketplace language is disclosure language — it belongs in full, honest detail on pricing/terms pages, not as the opening sentence of a recruitment or onboarding surface.

---

## SECTION 4 — VOICE BY SURFACE

**Navigation.** **Verified** (`experience_audit.md`, Customer Pages, Invitations finding): navigation should never promote a feature that does not exist behind it — the audited Invitations nav entry currently does exactly this (corrupted icon glyphs, zero implemented functionality). **Recommendation**: a nav label is a promise; a label should not ship before the destination can honour it.

**Buttons and CTAs.** **Observation**: the strongest CTA copy already found in this audit is plan-specific, not generic — `ELBOLD_2030_STRATEGY.md`/prior phase work already replaced a single generic "Upgrade" button with tier-specific copy ("Grow My Bookings," "Get Featured," "Go Elite," confirmed live per `experience_audit.md` Vendor Pages, Subscription row). **Recommendation, generalising this pattern**: every CTA should name the specific outcome the click produces, not the mechanical action — "See my quotes" rather than "View," "Protect this date" rather than "Save," continuing the pattern already proven correct in the one place it's been applied.

**Titles and section headings.** **Recommendation**: headings should answer "what will I find here" in the reader's terms, not the platform's internal terms — e.g., a heading naming "Contacts" (an ELBOLD data-model term) reads more coldly than one naming "Your Customers" (the vendor's own term for the same thing). This is directly relevant to `ELBOLD_EDP_03_VENDOR_DAILY_OPERATING_PLATFORM.md` Cluster 2's finding that the CRM is under-signposted relative to its importance — heading language is one contributing factor alongside navigational placement.

**Emails and notifications.** **Verified** (`capability_truth_audit.md`, Capabilities 4-5): the Daily Summary email and CRM follow-up reminders are both confirmed to already follow good practice — genuinely personalised content, honest suppression when there is nothing to report, and an honest upsell message to Free-tier vendors ("tracked but won't send a reminder — upgrade") rather than a false promise. **Recommendation**: this honesty-first pattern should be the template for every future notification — state what is real, never imply automation or delivery that has not happened (directly enforcing Constitution Principle 11 at the copy level).

**Validation, errors, and success messages.** **Assumption** (not exhaustively audited in this pass — no dedicated pass was made across every form's validation-error copy): a full inventory of error-message copy was outside this programme's evidence-gathering scope. **Recommendation, stated as a rule pending that inventory:** an error message should tell the reader what to do next, not only what went wrong — "Enter a UK mobile number to continue" rather than "Invalid phone number." This is proposed as the standing rule; a dedicated audit pass against it is recommended as follow-up work, not claimed as already complete.

**Empty states.** **Verified** (`experience_audit.md`, Cross-cutting finding #7): empty states are "a genuine strength" on the vendor side specifically — Contacts, Customers, Quotes, Bookings, Reviews, and Analytics all have action-oriented, well-designed empty states already. **Verified**: the strongest example found is Quotes' empty state — a numbered "How Elbold Leads Work" walkthrough with three concrete next actions, turning a dead end into an activation path. **Verified**, the same audit found this discipline **uneven on the customer side** — weaker on Bookings scalability, and Quote detail is missing a loading skeleton entirely. **Recommendation**: apply the vendor-side empty-state pattern (name what's missing, explain why it matters, give one specific next action) as the standard for every customer-facing empty state, closing the gap the audit found rather than inventing a new pattern.

---

## SECTION 5 — WHAT MUST NEVER CHANGE

Consistent with the Constitution's Commercial Honesty principle and the "Commercial Honesty" test explicitly named there ("Is this accurate as of today, not as of our roadmap?"):

- No warmth rewrite may imply a capability, guarantee, or automation that does not exist. Every example in Section 2's substitution table preserves the exact underlying fact of the transactional version it replaces.
- No trust language may be strengthened beyond what the platform can currently prove — Constitution Principle 11 forbids marketing subscriptions on marketplace visibility "before the marketplace has sufficient volume," and this document's recommendations do not propose working around that constraint through softer language; they propose telling the true, currently-strong story (verification, CRM, reviews) instead of over-claiming a weaker one (marketplace volume).
- The brand name rule (Section 1) and the disclosure requirements around commission, subscription terms, and data handling remain absolute regardless of tone.

---

## SECTION 6 — HOW THIS SYSTEM IS GOVERNED

**Recommendation:** this document, once approved, becomes a required reference in the same tier as the Constitution's Decision Filter (`ELBOLD_CONSTITUTION.md` Section 4) for any new customer- or vendor-facing copy — not a one-time copy-editing pass. Proposed changes to the rules in this document (not applications of them) should route through the same approval threshold the Constitution assigns to product-philosophy questions, since a language system is, functionally, a permanent product-philosophy commitment about how ELBOLD is allowed to sound.

---

*Companion documents: `ELBOLD_CONSTITUTION.md` (Principle 11, Commercial Honesty — the absolute ceiling on every recommendation above), `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` Section 3.3 (the subscription-language rewrite this document adopts wholesale), `ELBOLD_EDP_01_CUSTOMER_EXPERIENCE.md` and `ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md` (the specific transactional-language instances this document generalises from).*

*Next in series: EDP-05 (Vendor Success Journey).*
