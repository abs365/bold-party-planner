# ELBOLD ENTERPRISE HOMEPAGE TRANSFORMATION BLUEPRINT
**Prepared:** 2026-07-10 | **Classification:** Implementation Blueprint — Phase 2, Enterprise Transformation
**Status:** Planning only. No implementation, no UI redesign, no marketing copy is produced or authorised by this document. This blueprint redesigns the commercial journey; a separate, explicit approval is required before any of it is built.
**Scope:** `app/page.tsx` (www.elbold.com) as one complete commercial experience, reviewed section-by-section and as a single emotional journey, for both audiences it serves simultaneously.

---

## 0. The Two Beliefs This Page Must Create

> **Customer belief:** *"I trust ELBOLD with one of the most important occasions in my life."*
> **Vendor belief:** *"My business becomes stronger because I use ELBOLD."*

Every section audited below is tested against these two beliefs, not against whether it looks good in isolation. A section can be well-designed, accurate, and still fail this test if it doesn't move either belief forward — and per this brief, a section that only *describes a feature* without building one of these two beliefs is a candidate for redesign, merger, or removal regardless of its craft quality.

---

## 1. Method and Evidence Base

This blueprint does not re-derive judgments from scratch. It is built on four layers of existing evidence, each independently verified before being cited:

1. **`ELBOLD_EDP_01_CUSTOMER_EXPERIENCE.md`** — the governing document that already performed a full moment-by-moment redesign of this exact homepage, using a six-question test (why it exists, commercial problem, customer trust, vendor success, recurring revenue, success metric). Prepared 2026-07-10, same day as this review.
2. **`ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md`** Section 1 — the vendor-acquisition-side counterpart finding on the same homepage section EDP-01 covers under Moment 5.
3. **`ELBOLD_EDP_05_VENDOR_SUCCESS_JOURNEY.md`** — confirms the homepage's vendor-facing framing is encountered "at minimum three times during acquisition (homepage, Founding Vendors, application form)" before a vendor's Month-1 subscription decision, establishing that this page's vendor content is not cosmetic — it measurably shapes retention economics established elsewhere.
4. **Direct, fresh verification of `app/page.tsx` (read in full, 2026-07-10, this review)** — because EDP-01 and EDP-02 are now several implementation programmes old. Where their findings have since been addressed by shipped work (Programme B in particular), this blueprint says so explicitly rather than repeating a stale finding as if it were still true — the same discipline this transformation applied to the REG-01 correction and every Gate review since.

**What has changed since EDP-01/EDP-02 were written, verified directly against current code:** EDP-01 Moment 5 and EDP-02 Section 1 both flagged the homepage's vendor section as reading *"Keep 90% of every booking you receive... No monthly subscription to get started... We earn when you earn"* — a pure commission-marketplace pitch contradicting the platform's own business-platform thesis. **This is no longer true.** Programme B (WP-B1, commit `09bf513`) rewrote this section; the current `VENDOR_BENEFITS` array leads with *"A business platform, not just a listing"* and the section header now reads *"Why Join Elbold Instead of Relying on Social Media?"* This is the single largest change to report: **one of EDP-01's two most consequential findings is already resolved.** Every other EDP-01 Moment (1, 2, 3, 4, 6) and its Section 4 rhythm guidance remain unaddressed, verified by direct comparison of the current copy against what EDP-01 quoted.

---

## 2. Section-by-Section Audit

The current page renders ten sections (the code's own comments mislabel two as "Section 3" and skip "Section 7" — noted for completeness, not corrected here, since renumbering is a code change out of this blueprint's scope). Each is tested against the six questions this phase specifies.

### Section 1 — Typographic Hero
| Question | Answer |
|---|---|
| Why does this exist? | First-impression headline, primary CTAs (Browse / Plan My Event), and occasion quick-start chips — the arrival moment. |
| Primary audience | Customer (deliberately — the code's own comment notes vendor recruitment is excluded here so it doesn't compete with the customer decision this hero exists to drive). |
| Commercial objective | Funnel-entry conversion into Browse or guided planning. |
| Increases Customer Trust? | Partially. The reassurance line ("Every payment protected") is present but arrives before any warmth has been established — EDP-01 Moment 1 flags this ordering as backwards: proof should follow warmth, not lead it. |
| Increases Vendor Subscription Value? | No direct effect — correctly so, by design. |
| Verdict | **Redesign.** EDP-01 Moment 1's core recommendation — replace the single generic headline with one that recognises the visitor's actual occasion — remains unimplemented, verified against current code (`"Find Trusted Professionals For Every Occasion"`, unchanged). |

### Section 2 — How It Works
| Question | Answer |
|---|---|
| Why does this exist? | Procedural walkthrough of the four-step booking process; reduces unfamiliarity friction before the customer decision point. |
| Primary audience | Customer. |
| Commercial objective | Removes "how does this even work" hesitation ahead of quote requests. |
| Increases Customer Trust? | Marginally — informational, not felt trust. This is exactly the "credibility over warmth" pattern EDP-01 names as the page's dominant, over-represented register. |
| Increases Vendor Subscription Value? | No. |
| Verdict | **Redesign (compress).** EDP-01 Section 4 names this section explicitly as over-weighted for its content density — "four short sentences" currently occupy a full four-column, generously padded section. |

### Section 3 — Category Grid
| Question | Answer |
|---|---|
| Why does this exist? | Fast wayfinding for visitors who already know what they want. |
| Primary audience | Customer. |
| Commercial objective | Funnel-entry acceleration for high-intent visitors. |
| Increases Customer Trust? | No — pure utility, not a trust signal. |
| Increases Vendor Subscription Value? | Indirectly (drives category-specific browse traffic, undifferentiated by vendor subscription tier). |
| Verdict | **Remain.** No EDP finding against it; cheap, functional, doesn't compete with warmth-building sections for attention if kept compact. |

### Section 3 (duplicate label in code) — Trust Bar
| Question | Answer |
|---|---|
| Why does this exist? | Five compressed trust claims (reviewed, real reviews, Stripe, refund, UK-based) for a fast-scan reassurance pass. |
| Primary audience | Customer. |
| Commercial objective | Low-cost, repeated trust reinforcement. |
| Increases Customer Trust? | Yes, but redundantly — EDP-01 Section 4 explicitly names payment protection as appearing in the Hero, this bar, and The Elbold Promise section: three restatements of the same fact. |
| Increases Vendor Subscription Value? | No. |
| Verdict | **Merge.** Per EDP-01's own rhythm test ("does this section change what the next section is allowed to assume the visitor already believes?"), this section fails that test — everything in it is re-stated more fully later. Candidate to fold into a single, stronger trust moment rather than exist as a third repetition. |

### Section 4 — Occasion Showcase
| Question | Answer |
|---|---|
| Why does this exist? | Emotional "what are you celebrating" wayfinding via editorial photography — the page's closest current approach to warmth. |
| Primary audience | Customer. |
| Commercial objective | Occasion-specific funnel entry plus emotional resonance. |
| Increases Customer Trust? | Indirectly, through recognition — but incompletely, per the gap below. |
| Increases Vendor Subscription Value? | Indirectly (routes browse traffic to relevant vendor categories). |
| Verdict | **Redesign (expand).** EDP-01 Moment 2's central recommendation — a seventh occasion, **Religious & Family Milestones** (christenings, communions, bar/bat mitzvahs, Eid, memorial gatherings) — remains unbuilt, verified against the current `OCCASIONS` array (still exactly six entries). Also independently flagged as still open in `ELBOLD_TRANSFORMATION_GATE_1_REVIEW.md` Section 1. Per EDP-01 Section 4, this section should *gain* visual weight once complete, not lose it — it is the page's actual answer to "who is this for." |

### Section 5 — Featured Vendors
| Question | Answer |
|---|---|
| Why does this exist? | Concrete social proof that real vendors exist on the marketplace. |
| Primary audience | **Both** — customers see proof of supply; vendors (reading this page themselves, per EDP-02's finding that the homepage is often a prospective vendor's first ELBOLD surface) see a live, public demonstration of what a Featured/verified subscription tier actually looks like. |
| Commercial objective | Customer proof-of-supply, and a tangible, third-party-visible payoff for the Pro/Featured subscription tier. |
| Increases Customer Trust? | Yes — concrete vendor proof outperforms abstract claims. |
| Increases Vendor Subscription Value? | **Yes, directly** — this is the one section on the page that makes a subscription tier's benefit (the Featured badge, the ID-Verified/Trusted-Pro/Premium-Partner tier badges) visible and real to a third party, not just described. |
| Verdict | **Remain, with a connection opportunity.** No EDP finding against the section itself. Correctly conditional (`vendors.length > 0` — will not render on a near-empty marketplace, consistent with the Constitution's density-honesty requirement). New finding from this review (see §4): this section and Section 9's vendor pitch are thematically connected but never reference each other. |

### Section 6 — Concierge Band
| Question | Answer |
|---|---|
| Why does this exist? | Human-assisted alternative for customers who don't want to self-serve the marketplace. |
| Primary audience | Customer. |
| Commercial objective | Captures customers who would otherwise bounce from a self-serve experience; per `ELBOLD_2030_STRATEGY.md` Section 5.5, concierge enquiries should be treated as lifetime-customer acquisition, not one-off transactions. |
| Increases Customer Trust? | Potentially strongly — a human relationship beats a form — but current copy is generic ("Not sure where to start?"), not the specific, named invitation EDP-01 Moment 4 recommends. |
| Increases Vendor Subscription Value? | Indirectly — concierge-matched customers are pre-qualified, higher-intent leads per the Vendor Value Blueprint's lead-scoring logic, though this value is never communicated on the page itself. |
| Verdict | **Redesign and move.** EDP-01 Moment 4: needs a specific, named invitation (e.g. addressing a first-time parent planning a christening) rather than a generic prompt, and — per EDP-01's own critique — should move out of its current position between Featured Vendors and The Elbold Promise, where it reads as a mid-page afterthought rather than a genuine second front door. |

### Section 7 — The Elbold Promise
| Question | Answer |
|---|---|
| Why does this exist? | The page's consolidated, load-bearing trust statement — six guarantees plus platform stats, positioned immediately before the pivot to vendor recruitment. |
| Primary audience | Customer. |
| Commercial objective | Converts abstract trust claims into concrete, memorable guarantees at the highest-leverage point in the page. |
| Increases Customer Trust? | **Underperforms its own evidence.** Verified unchanged against EDP-01's citation: every guarantee is still phrased as a prohibition — *"No vendor joins Elbold automatically. No review is unverified. No payment is unprotected."* This is trust-through-legalism, not trust-through-feeling, per EDP-01 Moment 3's still-live diagnosis. |
| Increases Vendor Subscription Value? | Indirectly — a platform customers trust generates the volume that makes a vendor subscription worth paying for — but nothing here speaks to vendors directly. |
| Verdict | **Redesign and move.** EDP-01 Moment 3: reframe every "No X" statement into outcome/care language describing what the customer *gets* (the same underlying facts — sanctioned explicitly by EDP-01 as "presentation, not embellishment," staying inside Constitution Principle 11, Commercial Honesty). Also move earlier, adjacent to the discovery moment (Occasion Showcase), rather than after the page has already pivoted toward vendor recruitment. |

### Section 8 — For Event Professionals
| Question | Answer |
|---|---|
| Why does this exist? | The page's vendor-recruitment section — the pitch to a prospective vendor reading the customer homepage. |
| Primary audience | **Vendor**, explicitly — but also Customer indirectly, per EDP-01 Moment 5: what a customer believes about vendors reading this section shapes their confidence in the professionals they're about to enquire with. |
| Commercial objective | Vendor acquisition funnel entry from the highest-traffic page on the site, and reinforcement of customer confidence in vendor professionalism. |
| Increases Customer Trust? | **Yes — already resolved.** See §1: Programme B's rewrite means this section no longer describes vendors in commission-only, gig-economy terms. |
| Increases Vendor Subscription Value? | **Yes, directly and already improved.** `VENDOR_BENEFITS` now leads with the business-platform thesis; commission remains honestly disclosed (third bullet) but is no longer the entire pitch. |
| Verdict | **Remain, minor polish only.** The structural defect EDP-01/EDP-02 both flagged is fixed. One residual softening: the Founding Vendor teaser box's closing line, *"Free to start. Upgrade when you're ready to grow. Cancel anytime,"* still ends the section on "free" rather than on the business-platform value just described above it. Not the same severity as the original finding (this is not "no subscription required, ever") — flagged as a candidate for a future wording pass, not a structural redesign. |

### Section 9 — Final CTA
| Question | Answer |
|---|---|
| Why does this exist? | Last conversion prompt before the footer. |
| Primary audience | Customer. |
| Commercial objective | Catches remaining funnel-entry intent before exit. |
| Increases Customer Trust? | No — repeats the hero's language verbatim, adds nothing new. |
| Increases Vendor Subscription Value? | No. |
| Verdict | **Redesign.** EDP-01 Moment 6, still unaddressed: verified the closing CTA is an exact repeat of the hero ("Every event deserves professionals you can trust completely... Plan My Event / Browse Professionals"). Should personalise based on what the visitor actually engaged with in-session (the occasion or category they clicked) — "a bridge to the next visit," not a copy of the first message. |

---

## 3. The Complete Journey, Ignoring Section Boundaries

Section boundaries are an implementation detail. What the brief actually asks for is the sequence of *beliefs* each audience forms, in order, as they move down the page — regardless of which named section happens to carry each moment.

### 3.1 The Customer Journey (what should happen, belief by belief)

1. **Recognition** — *"this was made for what I'm planning."* Owned today by the Hero (generic, needs Moment 1's fix) and partially by the Occasion Showcase (stronger, but incomplete).
2. **Representation** — *"my occasion belongs here."* Owned by the Occasion Showcase alone — and fails for any visitor planning a religious or family-milestone occasion, who currently sees zero acknowledgement anywhere on the page.
3. **Reassurance as care, not warning** — *"I am safe trusting this platform with something that matters."* This is the belief the whole page exists to build, and it is currently **fragmented across three separate sections** (the Hero's trust line, the Trust Bar, and The Elbold Promise) that each restate the same handful of facts without ever landing as one strong, felt moment — and the fullest version of this content (The Elbold Promise) is the one still phrased as prohibitions rather than care, and positioned after the page has already moved on to other business.
4. **Confidence in real supply** — *"real professionals actually exist here."* Owned by the Category Grid (wayfinding only) and Featured Vendors (genuine proof, correctly conditional on real data existing).
5. **A human alternative when self-serve isn't wanted** — *"I don't have to figure this out alone."* Owned by the Concierge Band, present but generic and positioned as a mid-page afterthought rather than a genuine second front door.
6. **Confidence in the professionals themselves** — *"the people I'm about to contact are serious business owners, not side-hustlers."* Owned by the For Event Professionals section, now correctly reframed — but this belief is currently built *after* belief 3 (reassurance) and belief 5 (concierge), meaning a customer who reaches this section has already formed most of their trust judgment without it. It is reinforcing evidence arriving late, not load-bearing evidence arriving on time.
7. **A reason to return** — *"I'm not ready today, but I'll come back."* Owned by the Final CTA, currently a verbatim repeat with no memory of what the visitor actually did on this visit.

**The single largest structural finding:** belief 3 — the entire reason a customer should trust ELBOLD with something that matters — is the belief this page tries hardest to build and does so the *least* effectively, because it is split three ways, framed negatively in its strongest form, and positioned after two sections (Featured Vendors, Concierge) that don't need it to come first. Everything else on the page is in reasonable, defensible shape by comparison.

### 3.2 The Vendor Journey (a prospective vendor reading the *customer* homepage)

Per EDP-02 Section 1's verified finding, the homepage is frequently a prospective vendor's *first* ELBOLD surface, before `/founding-vendors` or `/vendor/apply`. Their journey through this same page is therefore a real, distinct audience path, not a hypothetical one:

1. **Ambient first impression** — before a vendor ever reaches the section addressed to them, they read six sections written entirely in customer voice (Browse, request quotes, compare, book). No single one of these sections is *wrong*, but their cumulative effect partially forms the "this is a customer marketplace with a vendor add-on" impression EDP-02 explicitly warns against — a structural risk visible only when the page is read as one journey, not six independent sections.
2. **The actual pitch** — Section 8 (For Event Professionals), now correctly business-platform-first (verified fixed, §1 above).
3. **Proof the pitch is real** — Featured Vendors, if a vendor connects "the Featured badge shown there" to "the subscription tier just described here." **New finding from this review:** these two sections currently share a theme (subscription-tier value) but never reference each other — a vendor reading Section 8's pitch has no signal to look back at Section 5's concrete proof of it, and a vendor scanning Section 5 sees badges with no link forward to what earns them. This is a connection opportunity, not a defect in either section individually — exactly the kind of finding this review's "ignore section boundaries" instruction exists to surface.
4. **Social proof from peers** — currently **absent entirely.** No vendor testimonial, named business, or real story appears anywhere on the homepage. This is the vendor-side instance of EDP-01's "no human storytelling anywhere" finding, which that document raised only from the customer side — the same gap applies symmetrically to the vendor journey and has not been named as such before this review.
5. **A low-friction next step** — the Founding Vendor CTA box, present and functional, with the minor closing-line softening noted in §2.

---

## 4. New Findings Produced by This Review

Consistent with this transformation's practice of reporting genuinely new evidence rather than only re-stating prior findings (see `ELBOLD_TRANSFORMATION_GATE_2_REVIEW.md`'s four new findings for the precedent this follows):

1. **Belief 3 (customer reassurance) is fragmented three ways**, not merely "framed negatively" as EDP-01 Moment 3 alone states — the redundancy across Hero, Trust Bar, and The Elbold Promise is itself part of the defect, because a diluted repeated claim is felt less than one well-told claim, independent of tone.
2. **Featured Vendors and For Event Professionals are thematically connected but structurally disconnected** — the page's one piece of concrete subscription-tier proof and the page's one subscription pitch do not reference each other.
3. **The "no human storytelling" gap (EDP-01) applies symmetrically to the vendor journey**, not only the customer journey — no vendor story or testimonial exists anywhere on the page, a gap not previously named from this side.
4. **Section 8's already-fixed vendor reframing is undercut by ambient exposure earlier in the page** — no individual customer-facing section is wrong, but a vendor reading the whole page in order encounters six sections of customer-marketplace framing before reaching the one section addressed to them, partially pre-forming the "lead marketplace" impression the fixed Section 8 then has to overcome.

---

## 5. Recommendation Summary

| Section | Verdict | Primary driver |
|---|---|---|
| 1. Hero | Redesign | EDP-01 Moment 1 (unaddressed) |
| 2. How It Works | Redesign (compress) | EDP-01 §4 rhythm |
| 3. Category Grid | Remain | No finding against it |
| 3(dup). Trust Bar | Merge | EDP-01 §4 rhythm; this review's Finding 1 |
| 4. Occasion Showcase | Redesign (expand) | EDP-01 Moment 2 (unaddressed) |
| 5. Featured Vendors | Remain + connect | This review's Finding 2 |
| 6. Concierge Band | Redesign + move | EDP-01 Moment 4 (unaddressed) |
| 7. The Elbold Promise | Redesign + move | EDP-01 Moment 3 (unaddressed); this review's Finding 1 |
| 8. For Event Professionals | Remain, minor polish | Already fixed (Programme B); this review's Finding 4 |
| 9. Final CTA | Redesign | EDP-01 Moment 6 (unaddressed) |

Net shape of the recommended journey: compress the two purely-procedural sections (How It Works, Category Grid stays as-is since it's already lean), consolidate the three-times-repeated trust claim into one strong, earlier-positioned, care-framed moment, complete the occasion set, give the concierge invitation a name and a better position, connect Featured Vendors to the vendor pitch, and replace the two weakest, most generic moments (opening headline, closing CTA) with visitor-aware versions of themselves. This is six real changes and two structural moves — not a section-by-section rewrite of the whole page, and not a single line of new marketing copy, consistent with this document's mandate.

---

## 6. What Must Never Change

Directly inherited from `ELBOLD_CONSTITUTION.md` and the governing EDP documents — no recommendation in this blueprint may be implemented in a way that violates any of these:

- **Commercial Honesty (Principle 11).** No guarantee, statistic, or claim may imply more than the platform currently delivers. The reframing recommended for The Elbold Promise (§2, Section 7) changes tone, never the underlying fact.
- **The 90/10 commission split and its disclosure (EDR-09).** Reframing the vendor pitch's *lead* message (already done, §1) never means hiding or altering the commission fact itself, which must remain disclosed wherever it currently is.
- **Founding Vendor Programme's permanent terms (EDR-18).** The badge, priority placement, and 20-place scarcity must remain honoured exactly as promised regardless of any copy change to how the programme is introduced.
- **Density-honesty (Principle 6, Depth Before Expansion).** Featured Vendors' conditional rendering (`vendors.length > 0`) must never be replaced with a fabricated or padded vendor count — the section correctly does not exist yet at near-zero volume, and that is the honest behaviour, not a bug to be masked.
- **No implied faith-tradition specificity in the Religious & Family Milestones addition** — EDP-01 is explicit that imagery/copy for this occasion must remain occasion-neutral (a decorated hall, a family table) rather than iconography specific to one religion.

---

## 7. What This Blueprint Deliberately Does Not Propose

Mirroring EDP-01 Section 5's own scope discipline, and this phase's explicit instruction:

- **No implementation, UI redesign, or marketing copy** — this document maps the journey; it does not write the journey.
- **No new occasion categories beyond Religious & Family Milestones** — one genuine, evidence-based gap, not an invitation to expand the taxonomy further.
- **No AI-generated personalisation** — Moment 1 and Moment 6's visitor-aware variants (occasion recognised, CTA reflecting session activity) are deterministic, based on already-available signal (query params, referral, in-session clicks), consistent with EDP-01's own explicit exclusion of AI-driven customer-facing tools.
- **No redesign of `/browse`, `/vendors/[slug]`, or global navigation/footer** — homepage-only scope, exactly as EDP-01 bounded itself.
- **No new backend capability of any kind** — every recommendation above is a content, framing, sequencing, or positioning change to sections and data that already exist and already render correctly.

---

## 8. Success Measurement

Per EDP-01 Section 6's own honest baseline, restated because it remains true as of `ELBOLD_TRANSFORMATION_GATE_2_REVIEW.md`'s fresh production check: **production currently holds 0 quotes, 0 bookings, and near-zero organic customer traffic.** No version of this homepage — current or redesigned — can be measured against real conversion volume until that changes. The composite signal this blueprint should eventually be judged against, once volume exists: does a first-time visitor arriving with no branded search intent complete a quote request or concierge submission at a materially higher rate than the current page, with the specific per-moment metrics EDP-01 already defined (scroll-past-hero rate, new-occasion-tagged sessions, quote-request click-through from the reframed trust section, concierge submission rate, return-visit rate within 7 days) tracked individually rather than as one blended number.

---

## 9. Status and Next Step

This blueprint is complete. It redesigns the commercial journey; it builds nothing. Per this phase's explicit instruction, implementation does not begin from this document alone — a separate, explicit authorisation is required to convert any recommendation above (§5) into a work package, following the same build/test/deploy/verify discipline this transformation has used for every prior programme.

---

*Companion documents: `ELBOLD_EDP_01_CUSTOMER_EXPERIENCE.md` (primary source), `ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md` Section 1, `ELBOLD_EDP_05_VENDOR_SUCCESS_JOURNEY.md`, `ELBOLD_CONSTITUTION.md` (Principles 2, 6, 11; EDR-09, EDR-18), `ELBOLD_2030_STRATEGY.md` Section 5.5, `ELBOLD_TRANSFORMATION_GATE_1_REVIEW.md` Section 1, `ELBOLD_TRANSFORMATION_GATE_2_REVIEW.md`, `ELBOLD_PROGRAMME_B_VENDOR_CONVERSION_COMPLETION_REPORT.md` (source of the already-shipped Section 8 fix this blueprint verifies and credits).*
