# ELBOLD Enterprise Language Alignment Report

**Status:** Audit only. No wording changed. No implementation. Awaiting approval per this document's own next-step instruction.
**Scope:** Production-wide language review of public-facing pages — Homepage, Trust pages, Vendor pages, About, How It Works, Footer, public navigation, key CTAs.
**Objective:** Identify wording that positions Elbold primarily as a marketplace, directory, or listing website where that conflicts with the approved Enterprise Mission.
**Evidence tags:** Verified / Observation / Assumption / Recommendation — never blended, per this transformation's standing convention.
**Relationship to the homepage freeze:** The homepage remains structurally frozen per the prior authorisation. Findings below that fall on `app/page.tsx` are reported for completeness (the audit's scope explicitly includes Homepage) but are **not eligible for implementation** unless the freeze is separately lifted or the finding is reclassified as a production defect — neither of which this report claims.

---

## 1. What "Conflicts" Actually Means Here — Grounding in the Approved Documents

This is not a global ban on the word "marketplace." The Constitution's own Mission statement uses it deliberately and permanently:

> "To give every event professional a **platform** they can build their business on, and every customer a **marketplace** they can trust completely." — `ELBOLD_CONSTITUTION.md`, Section 1

Two-sided framing is the approved strategy: **platform** to vendors, **marketplace** to customers. "Marketplace" said plainly on customer-facing trust copy is not a conflict — it is the mission's own language. The actual rules, drawn directly from `ELBOLD_CONSTITUTION.md` and `ELBOLD_EDP_04_BRAND_AND_LANGUAGE_SYSTEM.md`:

1. **Vendor-facing copy should speak to a business owner, not a listings customer.** `EDP_04` line 48 (Observation, drawn from EDP-02/EDP-03): copy framed around "listings" or "enquiries" as the unit of value "subtly casts the vendor as a participant in ELBOLD's marketplace rather than an operator of their own business."
2. **Marketplace/commission language is disclosure language, not opening-pitch language.** `EDP_04` line 56 (Recommendation): it "should not be the *lead* framing in vendor-facing copy... it belongs in full, honest detail on pricing/terms pages, not as the opening sentence of a recruitment or onboarding surface."
3. **The emotional target for a prospective vendor is explicitly named and explicitly not a directory feeling.** `ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md` line 51: a vendor should feel "recognition that this is infrastructure a serious business would use, **not a listings site competing with Bark or Poptop for their attention.**"
4. **"Directory" is named as the failure mode of ELBOLD's own approval process if it were ever automated.** `ELBOLD_CONSTITUTION.md` EDR-07: "Volume-driven automated approval would produce a directory, not a marketplace." Directory is already established in the Constitution as the *thing ELBOLD is not*, which makes it a strong, existing internal standard to check copy against — not a new one this report is inventing.

So a finding below is a **conflict** when copy frames Elbold's core value as a passive listing/directory entry, especially as the *lead* framing on a vendor-facing page — not merely when it uses the word "marketplace" in an honest, disclosure-appropriate, or customer-facing trust context.

---

## 2. High-Severity Findings

### 2.1 Founding Vendors page — title tag contradicts the page's own body copy

- **Current wording:** `<title>` metadata (rendered as the browser tab title, Google search result title, and social share title): **"Join as a Founding Vendor | List Your Services Free | Elbold."** (`app/founding-vendors/page.tsx:19`)
- **Why it conflicts:** This is the single highest-visibility piece of copy on the platform's primary vendor-recruitment page — it's what a prospective vendor sees before they even click through from a Google search. It is pure directory/listing framing, and it directly contradicts a claim made three lines later in the page's own metadata description ("Reach customers actively searching for event professionals, not just browsing a social media feed") and, more strikingly, contradicts the page's own first Benefit card 30 lines into the body: *"real tools for running your business, not just a listing."* The page argues against its own title tag.
- **Recommended replacement direction:** Lead with the business-platform framing already proven correct elsewhere on this same page (e.g. the "business dashboard" language in `BENEFITS[0]`), keep "free" (a real, disclosure-honest fact worth keeping), drop "listing" as the verb.

### 2.2 Founding Vendors page — Hero's opening sentence is the exact pattern EDP-02 says to avoid

- **Current wording:** *"Elbold connects event hosts with verified DJs, photographers, caterers, decorators and more across the UK. **List your services free**, receive enquiries from customers actively looking to book, and build your reputation on a platform designed specifically for UK event professionals."* (`app/founding-vendors/page.tsx:262-266`)
- **Why it conflicts:** This is the first sentence a prospective vendor reads after the H1. `EDP_02` line 51 names this exact scenario — a vendor should feel "infrastructure a serious business would use, not a listings site" — and `EDP_04` line 56 specifically flags marketplace/listing language as wrong when it's "the opening sentence of a recruitment... surface." This is that opening sentence.
- **Recommended replacement direction:** Open on the business-outcome ("build your reputation," "customers actively looking to book" — both already present and both good) and move "free" and the mechanics of joining later in the paragraph or into the reassurance line beneath the buttons, where "No credit card required. Free to start." already lives.

### 2.3 Homepage Final CTA button — "Get Listed Free" (blocked by the homepage freeze)

- **Current wording:** Founding Vendor teaser box, "For Event Professionals" section: **"Get Listed Free"** (`app/page.tsx:874`)
- **Why it conflicts:** Same pattern as 2.1/2.2 — a primary CTA button using "listed" as the verb for joining the platform, on the page's one vendor-recruitment moment.
- **Recommended replacement direction:** Same direction as 2.1/2.2 (a verb that names the business outcome, not the listing action) — but this finding is on `app/page.tsx`, which is under the standing homepage freeze ("no further structural homepage changes... unless a production defect is discovered"). A CTA word choice is not a defect. **This finding is reported, not actioned, and stays out of scope until the freeze is separately revisited.**

---

## 3. Moderate-Severity Findings — "Listing" as the Vendor's Unit of Value

These use "listing" as a noun describing the vendor's entire presence on Elbold, rather than as an incidental verb. Distinct from the high-severity items above because none is the single highest-visibility line on its page, but each is structural to how its page frames the vendor relationship.

- **Founding Vendors, Benefit card 3:** *"Customers browsing Elbold see your Founding Vendor badge alongside **your listing**. Verified vendors with complete profiles typically receive more enquiries than **incomplete listings** at comparable prices."* (`app/founding-vendors/page.tsx:47`) — **Why it conflicts:** the vendor's profile is called "your listing" twice in one sentence, on the same page whose own Benefit card 1 explicitly argues against that framing. **Direction:** "your profile."
- **Vendor Standards, Hero subheadline:** *"These standards are not aspirational guidelines. They are the minimum requirements for **listing on Elbold**..."* (`app/vendor-standards/page.tsx:126`), reinforced by *"condition of listing"* (line 30) and *"suspended from public listings"* (line 82) later on the same page. **Why it conflicts:** this page's central framing device — appearing in its Hero, its terms-of-agreement copy, and its enforcement-consequences copy — is "listing," used three separate times as the noun for the vendor's standing on the platform. **Direction:** "requirements for joining Elbold" / "condition of approval" / "suspended from the public platform."
- **How We Verify, Timeline section heading:** *"From application to **live listing**"* (`app/how-we-verify\page.tsx:256`) — **Why it conflicts:** names the end-state of the entire verification journey — the thing seven days of human review culminates in — as "a listing." **Direction:** "From application to live profile" or "...to approved vendor."
- **Booking Protection:** *"Vendors on Elbold agree to uphold these standards as a condition of **their listing**"* (`app/booking-protection/page.tsx:347`) — near-identical phrasing to the Vendor Standards line above, suggesting shared copy origin; worth correcting together rather than separately. **Direction:** "as a condition of their approval."

---

## 4. Low-Severity, Aggregate Pattern — "Before Listing" as the Default Verb

**Observation**, not a per-instance defect: the phrase "before listing" (or "before they appear on the marketplace") is used as the default, near-identical verb for "a vendor goes live" in at least ten places across otherwise well-aligned trust pages: `about/page.tsx:299`, `guides/page.tsx:111`, `guides/[slug]/page.tsx:210`, `why-elbold/page.tsx:22,61,99`, `vendor-spotlights/page.tsx:271,284,286`, `how-we-verify/page.tsx:94,191,210-211,510`, `how-it-works/page.tsx:147`, `our-commitments/page.tsx:26,63,221`, `vendor-faq/page.tsx:51`.

No single instance here is a significant conflict on its own — most read as ordinary operational description ("reviewed before listing," "reduced marketplace visibility"). But the same homepage review that led to this programme (`ELBOLD_ENTERPRISE_HOMEPAGE_TRANSFORMATION_BLUEPRINT.md` Finding 1) established the precedent that a mild, individually-defensible phrase repeated identically across many surfaces becomes a real pattern in aggregate, independent of any single instance's severity. Ten near-identical uses of "listing" as the default verb for "goes live," spread across the platform's core trust surfaces, is that same shape of finding.

**Recommended replacement direction:** not urgent enough to warrant ten separate content changes on its own, but worth folding into whichever future work package touches any of these pages for another reason — replace "before listing" with "before approval" / "before joining" wherever it's touched anyway, rather than as a standalone sweep.

---

## 5. Areas Reviewed With No Conflict Found

Reported explicitly, per this transformation's practice of stating what was checked and found clean, not only what was found wrong:

- **Footer** (`components/layout/Footer.tsx`) — zero uses of marketplace/directory/listing in any visible copy. Clean.
- **Public navigation** (`components/layout/Navbar.tsx`) — zero uses in any visible copy. Clean.
- **Individual vendor profile page** (`app/vendors/[id]/page.tsx`) — the actual product surface every customer sees for every vendor never refers to the profile as "a listing." The one "marketplace" mention is a low-quality-gate fallback CTA ("Browse the marketplace"), disclosure-appropriate. Clean.
- **Legal/terms pages** (`terms`, `privacy`, `vendor-terms`, `legal/vendor-terms`, `refunds`) — deliberately **excluded from findings**, not overlooked. `EDP_04` line 56 explicitly designates pricing/terms pages as where full, plain marketplace/commission disclosure belongs. Legal correctness there takes precedence over brand framing.

---

## 6. Existing Strengths Worth Preserving (Model Examples for the Fixes Above)

Several pages already do exactly what §2-3's recommended directions ask for. These aren't findings — they're proof the target framing already exists natively in this codebase's own voice, which should make the fixes low-risk and consistent:

- **Trust page Hero:** *"...work together to make Elbold **the most trustworthy event marketplace in the UK**."* — near-verbatim echo of the Constitution's own Mission phrase. The model for customer-facing marketplace language.
- **About page:** *"Event professionals are **not commodities in a directory**. They are skilled, independent people building businesses."* — explicit rejection of the directory frame, stated plainly.
- **About page:** *"We are not trying to be the biggest event marketplace in the UK. We are trying to be the one event hosts can genuinely trust."* — Depth Before Expansion (Constitution Principle 6) in the platform's own marketing voice.
- **Our Commitments:** *"Honest marketplaces publish their limitations."* — Commercial Honesty (Constitution Principle 11) stated as a value, not a hedge.
- **Founding Vendors comparison table + "Why Elbold, not Instagram or a directory?"** — positions "directories" explicitly as the competitor category Elbold is being judged against, not as a description of Elbold itself. The correct pattern, already live, one section below the page's own title-tag conflict in §2.1.
- **Founding Vendors, Benefit card 1:** *"real tools for running your business, **not just a listing**."* — the exact counter-argument to this whole report's findings, already written, already live, on the very page with this report's two highest-severity findings.

---

## 7. What This Report Deliberately Does Not Do

- **No wording changed.** No file in this repository was edited to produce this report.
- **No final copy proposed.** §2-4 give a recommended *direction* per finding, not a drafted replacement sentence, per this task's explicit instruction.
- **No page redesign proposed.** Every finding is a word/phrase-level observation on existing page structures.
- **No homepage implementation implied.** §2.3 is reported for completeness only and stays behind the homepage freeze.
- **No ranking into a delivery sequence.** Unlike the Browse Commercial Readiness Assessment, this report was not asked to recommend a sequence — only to catalogue findings for approval.

---

## 8. Status and Next Step

This report is complete and awaits approval before any wording is changed, per this task's explicit instruction. Per this transformation's standing discipline, implementation of any finding above would require a separate, explicit authorisation naming which findings to act on.
