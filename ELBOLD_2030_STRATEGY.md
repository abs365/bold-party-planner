# ELBOLD — FIVE-YEAR PRODUCT & COMMERCIAL STRATEGY
## ELBOLD 2030 | Master Strategic Blueprint
**Effective from:** 2026-06-30  
**Review cycle:** Quarterly  
**Classification:** Founder Reference | Company Blueprint

---

> This is the master strategic document for ELBOLD.
>
> It supersedes all prior strategy notes and becomes the reference point for every significant product, commercial, and operational decision until 2030.
>
> It was written with full knowledge of the live production codebase, deployment history, and current commercial state. Nothing in it is theoretical. Everything in it is grounded in what the platform already is, and what it can realistically become.
>
> Challenge it. Update it when reality contradicts it. But follow it until you have a better reason not to.

---

## EVIDENCE UPDATE — 2026-07-10

**This update corrects specific claims below against a fresh, code-verified capability-truth audit and a fresh market/competitor research report. It does not replace the document — the original 2026-06-30 analysis remains the working thesis. Where this update contradicts a specific row or figure below, this update is the current fact.**

**1. Year 1 Q1 target has been missed, not merely "in progress."** Section 7's Q1 milestone was 20 approved vendors by the Master Growth OS Pilot review on 2026-07-14. Verified against production on 2026-07-10 (4 days before that date): **2 approved vendors, 0 bookings, 0 reviews, £0 commission revenue.** This is 10% of the vendor target with the review window nearly closed. Section 1.4's "1% of the addressable market" framing and Section 7's £10,000 MRR target should be read as aspirational, not on-track, until the 2026-07-14 review resets them with real numbers.

**2. The Q1 "three things only" plan (subscription rewrite, Stripe Connect activation, daily summary email) is one-third done.** Daily summary email: ✅ shipped and verified functioning (real per-vendor content, real Resend send, real opt-out). Subscription rewrite: ❌ not done in code — and worse, `/founding-vendors` (the actual acquisition page a vendor sees) currently states *"no required subscription"* and *"Elbold earns only when you do,"* which is not just "not yet rewritten" but actively contradicts this document's Section 1.3 commercial thesis. Stripe Connect: ❌ not activated, and a fresh code audit found **zero payment-routing implementation exists even if the flag were flipped** (no `application_fee_amount`/`transfer_data`/`on_behalf_of` anywhere) — this is a bigger gap than "kill-switched, ready to go."

**3. Section 3 capability map corrections** (spot-checked against live code, not assumed from prior audit language):
   - *Customer-visible availability* — marked ✅ NOW below. **False.** `app/vendors/[id]/page.tsx` hardcodes `hasAvailability: false` for every public profile, and even where a vendor's own availability data is correctly captured, no quote or booking flow ever reads it. A customer can request a date the vendor explicitly blocked.
   - *Social media links display* — marked 12 MONTHS/missing below. **Done.** Shipped Wave 2 (commit `d6db444`, 2026-07-01) via the existing `portfolio_links` field — Facebook/TikTok/WhatsApp now render on the public profile. Move this row to NOW.
   - New defect not anticipated by this document: `vendors.response_rate` has a schema/application scale mismatch (DB expects 0-1, app writes 0-100) that silently fails every write and freezes the field — this corrupts the Business Health, verification, and governance signals this document assumes are reliable inputs to Level 3+ vendor progression (Section 3, Reviews/Reputation and Growth Tools rows).

**4. Fresh market research (`ELBOLD_MARKET_AND_COMPETITOR_RESEARCH.md`, 2026-07-10) validates this document's Section 1.3 thesis directly.** The market splits into pure lead-marketplaces with no subscription at all (Bark, Thumbtack — the worst-reviewed platforms researched, 1.2-1.8/5) versus pure CRM/ops tools with zero lead-gen (HoneyBook, Dubsado). Nobody occupies ELBOLD's combined position. This is independent evidence for "the thesis in one sentence" (Section 1.3) — worth citing when this document is next presented, since it is no longer only an internal hypothesis.

**5. Geography tension, flagged not resolved:** This document's Year 1 plan (Section 7) assumes Essex/London-first depth before expansion. The Founding Vendor Programme's public copy was repositioned UK-wide on 2026-07-01, and the founder's current direction is nationwide vendor (supply-side) acquisition. See the companion clarification added to `ELBOLD_CONSTITUTION.md` Principle 6 (2026-07-10): nationwide vendor *recruitment* is compatible with Depth Before Expansion as long as paid customer acquisition and marketplace-density claims stay geography-gated. This document's Year 1 roadmap text itself has not been rewritten to reflect nationwide vendor sourcing — flagged as an open update for the next full revision, not resolved here.

---

## SECTION 1 — THE ELBOLD VISION

### 1.1 The Vision

> **ELBOLD is the operating platform that event businesses cannot imagine running without.**
>
> Not because we lock them in.  
> Because we make running their business genuinely better than any alternative.

### 1.2 What This Means in Practice

In five years, an event professional who uses ELBOLD manages their entire business through one platform:

Their clients are in ELBOLD. Their calendar is in ELBOLD. Their contracts are in ELBOLD. Their invoices are issued through ELBOLD. Their payments are collected through ELBOLD. Their portfolio is on ELBOLD. Their reviews live on ELBOLD. Their annual accounts start from ELBOLD. When they quote a new client, they do it through ELBOLD. When a client pays a deposit, it comes through ELBOLD. When the event is over and the review is written, it stays on ELBOLD permanently.

Their ELBOLD profile URL is on their business card. In their Instagram bio. On their Google listing. On the QR code they give to clients at events.

They do not think of ELBOLD as "the platform that sends me customers." They think of it as the platform that runs their business.

The marketplace — where customers discover and book them — is the feature they're most grateful for. But it is not the reason they stayed.

### 1.3 The Commercial Thesis

Every two-sided marketplace in history has faced the same cold-start problem: without vendors there are no customers, without customers there are no vendors. Most marketplace businesses solve this by subsidising supply (paying vendors to join, offering free listings indefinitely) and then monetising through commission once liquidity is achieved.

This model has two fatal weaknesses at early stage:
1. Vendors who join for free and receive no customers churn before liquidity is achieved
2. Commission-only revenue is invisible until the flywheel spins — which takes 18-24 months in local service markets

ELBOLD's answer to this problem is architectural. The platform delivers business tool value to vendors from Day 1 — independent of whether ELBOLD sends them a single customer. A vendor who uses ELBOLD's CRM, calendar, analytics, and payment tools is getting value on Day 1, Day 30, and Day 365 regardless of marketplace volume.

This means:
- Vendors have a reason to pay ELBOLD from the moment they join
- Vendors have a reason to stay even in months with no marketplace activity
- ELBOLD earns subscription revenue while the marketplace builds to liquidity
- Vendors become embedded in the platform before they are financially dependent on its marketplace

When the marketplace eventually reaches liquidity — when customers are finding vendors organically through ELBOLD — those vendors are already using the platform daily and deeply integrated. The marketplace bookings become the accelerant, not the foundation.

**The thesis in one sentence: Build the platform vendors cannot leave. Let the marketplace prove itself inside it.**

### 1.4 The Market Opportunity

The UK event services market serves approximately 3 million discrete events per year across weddings, birthdays, corporate events, cultural celebrations, and private occasions. The average professional event budget includes 5-8 vendor categories: photography, music, catering, decoration, venue, cake, transport, entertainment.

The market is fragmented, unregulated, and poorly served digitally. Most event professionals:
- Have no CRM
- Have no formal contracts
- Chase invoices manually
- Manage bookings via WhatsApp
- Have no analytics on their business performance
- Operate with no professional verification

This is not a niche gap. This is the standard operating environment for the majority of the approximately 250,000 people working professionally in event services in the UK.

ELBOLD does not need to serve all 250,000. It needs to serve 2,500 of them exceptionally well to reach £6m ARR. That is 1% of the addressable market.

### 1.5 What ELBOLD is NOT

To be strategically clear:

- ELBOLD is **not** a social media platform (no feed, no follower counts, no viral content)
- ELBOLD is **not** a job board (not posting, applying, and moving on)
- ELBOLD is **not** a directory (not pay-to-appear advertising)
- ELBOLD is **not** a booking engine for fixed-price services (not hotel beds or restaurant tables)
- ELBOLD is **not** a lead-generation platform that sells contact details to vendors

ELBOLD is a **business operating platform** for event professionals that includes a trusted marketplace as its acquisition engine and social proof mechanism.

---

## SECTION 2 — THE PRODUCT PYRAMID

The ELBOLD product pyramid has four levels. Each level builds on the one below it. Do not attempt to build Level 3 before Level 2 is established. Do not attempt Level 4 before Level 3 is commercially proven.

```
                    ┌─────────────────────────┐
                    │   LEVEL 4               │
                    │   Industry              │
                    │   Infrastructure        │
                    │   (36-60 months)        │
                  ┌─┴─────────────────────────┴─┐
                  │   LEVEL 3                   │
                  │   Growth Platform           │
                  │   (24-36 months)            │
                ┌─┴─────────────────────────────┴─┐
                │   LEVEL 2                       │
                │   Business Platform             │
                │   (Now → 24 months)             │
              ┌─┴─────────────────────────────────┴─┐
              │   LEVEL 1                           │
              │   Marketplace                       │
              │   (Now — permanent foundation)      │
              └─────────────────────────────────────┘
```

---

### LEVEL 1 — The Marketplace
**Role:** Trust engine, discovery mechanism, social proof accumulator  
**Begins:** Now  
**Revenue model:** 10% commission on completed bookings  
**Status as at 2026-06-30:** Architecture complete, business substance pre-commercial

The marketplace is not the product. It is the most visible feature of the product, and the mechanism through which ELBOLD creates verified reviews and proven transaction records.

**What the marketplace does:**
- Gives customers a trusted place to discover verified event professionals
- Gives vendors public exposure with credibility they cannot build alone
- Creates verified reviews (the only review system in UK event services where every review is from a confirmed booking)
- Generates commission revenue that scales with GMV
- Creates social proof that makes every subsequent vendor easier to recruit

**The marketplace rule:** Never compromise the trust architecture for volume. The slowest, most selective marketplace with genuine verified reviews is worth more than the fastest directory with unverifiable content. Every competitor takes the fast path. ELBOLD's competitive moat is built on the slow path.

**Minimum viable marketplace (Phase 1 milestone):**  
30+ approved vendors across 6+ categories in the target geography. 50+ customer accounts. 20+ completed bookings. 15+ public verified reviews. These numbers make the marketplace credible to a first-time customer visitor.

**Permanent principles of the marketplace (never change):**
1. Every vendor individually reviewed by a human before approval
2. Every review tied to a confirmed booking — no exceptions
3. Every payment through Stripe — no off-platform payment arrangements
4. Every commission split recorded and immutable in the financial ledger

---

### LEVEL 2 — The Business Platform
**Role:** Daily value engine, subscription revenue driver, stickiness creator  
**Begins:** Now — most foundation already exists  
**Revenue model:** Monthly subscriptions + payment processing fees  
**Status as at 2026-06-30:** Foundation deployed, not yet commercially positioned

This is where the company is built. The marketplace brings vendors in. The business platform makes them stay.

**What the business platform does:**
- Gives vendors tools to manage their entire business, not just their ELBOLD bookings
- Creates daily utility independent of marketplace traffic
- Generates subscription revenue that is predictable and volume-independent
- Creates operational dependency through CRM, financial records, and digital identity

**The business platform rule:** Every capability must pass this test: "Does this create value for a vendor who received zero ELBOLD enquiries this month?" If yes, build it. If no, it belongs in the marketplace layer, not the business platform layer.

**See Section 3 for the complete business platform capability map.**

---

### LEVEL 3 — The Growth Platform
**Role:** Vendor business growth engine, advanced intelligence, automation  
**Begins:** 24 months — when 200+ active vendors have 12+ months of platform history  
**Revenue model:** Growth plan subscriptions, advanced analytics subscriptions, finance partnerships

The growth platform transforms ELBOLD from a business management tool into a business growth engine. Where the business platform helps vendors run their business, the growth platform helps them grow it.

**What the growth platform does:**
- Provides market intelligence derived from aggregated platform data (demand patterns, pricing benchmarks, seasonal trends)
- Offers vendor performance benchmarking versus category peers
- Enables automated re-engagement sequences for lapsed customers
- Provides revenue forecasting based on historical patterns and upcoming seasonal demand
- Partners with financial services providers (insurance, lending) to offer vendor-specific products
- Surfaces growth opportunities the vendor could not identify without the data ELBOLD has

**The growth platform milestone:** 200+ vendors with 12+ months of history. This is the minimum data volume needed for benchmarks and market intelligence to be statistically meaningful. Building this before the data exists produces misleading outputs that damage vendor trust.

---

### LEVEL 4 — Industry Infrastructure
**Role:** Market authority, certification standard, ecosystem builder  
**Begins:** 36-60 months — when ELBOLD has established authority through scale and track record  
**Revenue model:** Certification fees, data licensing, API partnerships, training programmes

The industry infrastructure layer is where ELBOLD transitions from a platform that serves the event industry to a platform that defines part of its standards.

**What industry infrastructure does:**
- Establishes ELBOLD verification as a recognised credential beyond the platform
- Creates the first data-driven industry benchmark report for UK event services
- Builds an API programme allowing third parties (venues, agencies, insurance providers) to verify ELBOLD vendor credentials
- Offers structured training and professional development pathways
- Establishes partnerships with professional associations and trade bodies

**The industry infrastructure rule:** Authority cannot be claimed. It must be earned through scale, consistency, and track record. Do not attempt Level 4 initiatives until ELBOLD is the most trusted name in UK event vendor verification. This is a 36-month minimum horizon.

---

## SECTION 3 — BUSINESS OPERATING PLATFORM CAPABILITY MAP

This section defines every capability the ELBOLD business platform should eventually include, classified by when it should be built.

**Timing classifications:**
- **NOW** — exists or should be built/activated within 30 days
- **12 MONTHS** — build in the next 12 months; high priority
- **24 MONTHS** — build after the foundation is proven; medium priority
- **36 MONTHS** — build when the platform has scale; long-term priority
- **60 MONTHS** — aspirational; build when industry authority is established

---

### CUSTOMER MANAGEMENT

| Capability | Timing | Notes |
|---|---|---|
| Customer records from bookings | NOW | ✅ Exists — CustomerListView |
| Customer search and filter | NOW | ✅ Exists — name/email search |
| Customer lifetime value display | NOW | ✅ Exists — total spend per customer |
| Customer notes and history | 12 MONTHS | Add notes field per customer; link manual contacts with ELBOLD customers into unified view |
| Customer tags and segmentation | 12 MONTHS | Tag customers: "wedding", "corporate", "VIP", "high-value" |
| Customer merge (off-platform + ELBOLD) | 12 MONTHS | Unify manual contact records with ELBOLD customer records when same person |
| Customer re-engagement tracking | 24 MONTHS | "This customer last booked 14 months ago" — trigger re-engagement recommendation |
| Customer loyalty tiers | 36 MONTHS | Track repeat booking customers; surface for vendor rewards and priority treatment |
| Customer portal | 36 MONTHS | Customers can log in to view their full booking and payment history with a specific vendor |
| Customer annual event calendar | 36 MONTHS | "This customer books a birthday photographer every February" — predictive recommendation |

---

### CRM

| Capability | Timing | Notes |
|---|---|---|
| Manual contact creation and management | NOW | ✅ Exists — ContactListView, manual_contacts table |
| Source tracking (Instagram, WhatsApp, etc.) | NOW | ✅ Exists — 8 source types |
| Contact archive / GDPR anonymisation | NOW | ✅ Exists |
| Contact notes | NOW | ✅ Exists — notes field |
| Contact search and filter | NOW | ✅ Exists |
| Contact CSV import | 12 MONTHS | Upload phone contacts or spreadsheet to populate CRM rapidly |
| Follow-up reminder scheduling | 12 MONTHS | Set a date to follow up with a specific contact; dashboard alert on due date |
| CRM pipeline stages | 12 MONTHS | Lead → Contacted → Quoted → Negotiating → Booked → Completed → Review Requested |
| CRM conversion tracking | 12 MONTHS | Track what % of contacts at each pipeline stage convert to the next |
| Automated follow-up sequences | 24 MONTHS | "Send follow-up 3 days after quote if no response" — rule-based, no AI |
| Contact enrichment | 24 MONTHS | If contact's email matches an ELBOLD customer, auto-link and show their booking history |
| WhatsApp send from ELBOLD | 24 MONTHS | Send WhatsApp messages directly from the CRM interface |
| Email send from ELBOLD | 24 MONTHS | Vendor-branded emails sent from ELBOLD to CRM contacts |
| CRM analytics | 24 MONTHS | Conversion rates by source, pipeline velocity, win/loss analysis |

---

### QUOTES AND LEADS

| Capability | Timing | Notes |
|---|---|---|
| Marketplace quote requests | NOW | ✅ Exists — VendorQuotesView with lead_score |
| Lead scoring | NOW | ✅ Exists — lead_score field, ordered by score |
| Quote response management | NOW | ✅ Exists |
| Quote templates | 12 MONTHS | Vendor saves standard response templates for common enquiry types |
| Proposal builder | 12 MONTHS | Structured quote with pricing breakdown, photos, package detail, terms — shareable link |
| Quote analytics | 12 MONTHS | Which quote template converts best? What response time achieves best conversion? |
| Custom quote landing page | 24 MONTHS | `elbold.com/vendors/sarah-chen/quote` — pre-filled enquiry form shared directly by vendor |
| Quote-to-booking conversion coaching | 24 MONTHS | "Vendors who respond within 2 hours convert 40% better — you typically respond in 6 hours" |

---

### BOOKINGS

| Capability | Timing | Notes |
|---|---|---|
| Full booking lifecycle management | NOW | ✅ Exists — all status transitions |
| Booking request management | NOW | ✅ Exists |
| Payment status tracking | NOW | ✅ Exists |
| Upcoming event reminders | NOW | ✅ Exists |
| Booking revenue tracking | NOW | ✅ Exists — financial ledger |
| Booking history | NOW | ✅ Exists |
| Post-event checklist | 12 MONTHS | Vendor checklist after event: "Review requested? Invoice sent? Thank you sent?" |
| Booking notes | 12 MONTHS | Vendor can add notes to a specific booking (parking, special requirements, etc.) |
| Recurring booking support | 24 MONTHS | Corporate clients who book quarterly events — recurring booking structure |
| Booking anniversary alerts | 24 MONTHS | "Sarah booked you for her wedding last year — her first anniversary is in 3 weeks" |

---

### CALENDAR AND AVAILABILITY

| Capability | Timing | Notes |
|---|---|---|
| Date blocking calendar | NOW | ✅ Exists — AvailabilityCalendar |
| Auto-block on confirmed booking | NOW | ✅ Exists |
| Customer-visible availability | NOW (gap) | ❌ **Corrected 2026-07-10:** `hasAvailability` is hardcoded `false` on the public profile (`app/vendors/[id]/page.tsx:141`); no quote/booking flow reads availability at all. Data capture works, display and enforcement do not. See Evidence Update above. |
| Recurring unavailability patterns | 12 MONTHS | "I'm never available on Sundays in term time" |
| Buffer time between bookings | 12 MONTHS | "I need 1 day's notice before any booking" — blocks adjacent dates automatically |
| Google Calendar sync | 12 MONTHS | Two-way sync: ELBOLD blocks → Google; Google events → ELBOLD blocks |
| Apple Calendar sync | 12 MONTHS | iCal feed export |
| Availability quick-share | 12 MONTHS | "I'm available this Saturday" — one-tap message to send to a contact |
| Seasonal capacity planning | 24 MONTHS | Visual heatmap of booked vs. available dates; percentage capacity view |
| Booking density alerts | 24 MONTHS | "You're 80% booked in June — consider premium pricing for remaining slots" |
| Team calendar (Enterprise) | 36 MONTHS | Multi-staff availability management for agencies |

---

### CONTRACTS

| Capability | Timing | Notes |
|---|---|---|
| No contract capability | NOW (gap) | Not built — critical gap for Growth plan |
| Standard event contract templates | 12 MONTHS | Pre-written contracts for: photography, DJ, catering, decoration, cake. Vendor customises terms, date, amount. One-click send to customer. |
| Digital signature collection | 12 MONTHS | Customer signs contract electronically via ELBOLD; PDF stored on both sides |
| Contract version history | 12 MONTHS | Track amendments; immutable contract record after both parties sign |
| Custom contract builder | 24 MONTHS | Vendor builds own contract structure with drag-and-drop clauses |
| Contract-to-booking linking | 24 MONTHS | Contract automatically attached to the corresponding ELBOLD booking |
| Contract expiry reminders | 24 MONTHS | "This contract hasn't been signed — follow up with the client" |
| Contract analytics | 36 MONTHS | Which contract clauses reduce disputes? Time from contract send to signature? |

---

### INVOICES

| Capability | Timing | Notes |
|---|---|---|
| No invoice capability | NOW (gap) | Not built — critical gap for Growth plan |
| Basic invoice generation | 12 MONTHS | Create PDF invoice for any job (on or off ELBOLD). Fields: vendor branding, client name, service description, amount, payment terms, ELBOLD bank details or payment link |
| Invoice send via email | 12 MONTHS | Send invoice directly to client from ELBOLD |
| Invoice status tracking | 12 MONTHS | Sent / Viewed / Paid / Overdue |
| Payment link on invoice | 12 MONTHS | Client clicks "Pay Now" in invoice → ELBOLD payment page (Stripe) |
| Recurring invoice | 24 MONTHS | Monthly retainer clients — auto-generate invoice each period |
| VAT-compliant invoicing | 24 MONTHS | VAT number field, VAT calculation, compliant format for HMRC |
| Invoice history and archive | 24 MONTHS | Full invoice history by client and year |
| Annual invoice summary | 24 MONTHS | "Your total invoiced revenue in 2026: £28,400. Invoices outstanding: £1,200." |
| Branded invoices (Enterprise) | 36 MONTHS | Vendor's own logo, colours, and font on generated invoices |

---

### PAYMENTS

| Capability | Timing | Notes |
|---|---|---|
| Marketplace payment collection | NOW | ✅ Exists — Stripe Checkout, 30% deposit + balance |
| Financial ledger recording | NOW | ✅ Exists — immutable records |
| Bank details collection | NOW | ✅ Exists — sort code + account number |
| Off-platform payment request links | 12 MONTHS | Vendor sends payment link to any client. Client pays through Stripe. Vendor receives 97%, ELBOLD takes 3% |
| Payment receipt confirmation | 12 MONTHS | Automatic receipt email to client on payment |
| Partial payment support | 12 MONTHS | 30% deposit + 70% balance — extends to off-platform payments |
| Refund management | 12 MONTHS | Vendor initiates partial or full refund from dashboard |
| Payment link sharing | 12 MONTHS | WhatsApp-ready payment link. QR code for in-person payment |
| Recurring payment collection | 24 MONTHS | Monthly retainer clients pay automatically via stored card |
| Multiple currency support | 36 MONTHS | For vendors serving international clients |

---

### STRIPE CONNECT AND PAYOUTS

| Capability | Timing | Notes |
|---|---|---|
| Stripe Connect infrastructure | NOW | ⚠️ Onboarding UI/API exists, kill-switched — **but 2026-07-10 audit found zero payment-routing implementation** (no fee-split code anywhere); activating the flag alone would not route any booking payment through Connect. See Evidence Update above. |
| Manual payout (current) | NOW | ✅ Exists — admin processes manually |
| Self-service payout request | 12 MONTHS | Vendor requests payout from available balance; connects to their bank via Stripe Connect |
| Automatic weekly payout | 12 MONTHS | Post-Stripe Connect: automatic weekly transfer of available vendor balance |
| Payout history | NOW | ✅ Exists — vendor_payouts table |
| Real-time balance visibility | 12 MONTHS | Vendor sees current available balance, pending balance, total lifetime earnings |
| Tax year earnings summary | 12 MONTHS | ELBOLD vs off-platform earnings breakdown for tax purposes |
| Instant payout (premium) | 36 MONTHS | Pay extra for same-day payout (Stripe Instant Payouts) |

---

### REVIEWS AND REPUTATION

| Capability | Timing | Notes |
|---|---|---|
| Marketplace review system | NOW | ✅ Exists — gated to confirmed bookings |
| Vendor review response | NOW | ✅ Exists |
| Aggregate rating calculation | NOW | ✅ Exists — SECURITY DEFINER trigger |
| Rating on public profile | NOW | ✅ Exists |
| Review display on browse results | NOW | ✅ Exists |
| Review request automation | 12 MONTHS | After booking marked complete, send vendor a one-click "request review" link to forward to customer |
| Review milestone notifications | 12 MONTHS | "You've just received your 10th review!" — celebrate progress |
| Review analytics | 12 MONTHS | Which service packages generate the best reviews? Seasonal review patterns? |
| Vendor performance benchmarks | 24 MONTHS | "Your average rating is 4.9 vs. category average 4.4" |
| Review response coaching | 24 MONTHS | Suggested response templates for different review types |
| Off-platform testimonial collection | 24 MONTHS | Vendor can invite off-platform clients to leave a testimonial (unverified, displayed separately) |
| Review integration export | 36 MONTHS | Export verified review data for use on vendor's own website or Google Business |
| Trust Score (composite) | 36 MONTHS | Composite public score combining: review rating, verification level, response rate, cancellation rate, years on platform |

---

### MARKETING TOOLS

| Capability | Timing | Notes |
|---|---|---|
| Public vendor page | NOW | ✅ Exists — elbold.com/vendors/[slug] |
| JSON-LD SEO metadata | NOW | ✅ Exists — LocalBusiness + AggregateRating schema |
| Dynamic OG images for social sharing | NOW | ✅ Exists |
| Profile share button | 12 MONTHS | One-click copy of vendor profile URL from dashboard |
| QR code generation | 12 MONTHS | Downloadable QR code linking to vendor profile |
| Printable business brochure (PDF) | 12 MONTHS | Auto-generated from profile: name, photo, category, packages, verification, contact |
| Social media bio link optimisation | 12 MONTHS | Dashboard guidance: "Add your ELBOLD URL to your Instagram bio" with instructions per platform |
| Email signature template | 12 MONTHS | HTML email signature with vendor name, photo, ELBOLD profile link, verification badge |
| Seasonal promotion tools | 24 MONTHS | "Create a wedding season offer" — one-click promotional badge on profile |
| Vendor blog/content section | 24 MONTHS | Vendor publishes short articles (SEO: "wedding photography tips in Essex") — indexed by Google, builds vendor authority and ELBOLD domain authority simultaneously |
| Social post templates | 24 MONTHS | Branded templates for Instagram/Facebook posts referencing their ELBOLD profile |
| Google Business integration | 36 MONTHS | Sync ELBOLD verification status, photos, and review count to Google Business Profile |
| Paid placement within ELBOLD | 36 MONTHS | Category-sponsored listings — only when 15+ vendors per category |

---

### ANALYTICS AND BUSINESS INTELLIGENCE

| Capability | Timing | Notes |
|---|---|---|
| Profile views (30-day) | NOW | ✅ Exists |
| Quote requests (30-day) | NOW | ✅ Exists |
| Conversion rate | NOW | ✅ Exists |
| Revenue trend (monthly/weekly) | NOW | ✅ Exists |
| Month-over-month comparison | NOW | ✅ Exists |
| Average booking value | NOW | ✅ Exists |
| Lead funnel | NOW | ✅ Exists — total leads → responded → accepted → converted |
| Seasonal demand chart | NOW | ✅ Exists — monthly booking patterns |
| Payout split | NOW | ✅ Exists |
| Period selector (7/30/90 day) | NOW | ✅ Exists |
| Year-over-year comparison | 12 MONTHS | Requires 13 months of data — auto-unlocks after first full year |
| Package performance analytics | 12 MONTHS | Which packages generate the most enquiries and bookings? |
| Response time tracking | 12 MONTHS | Average time from quote request to first response — with category benchmark |
| Off-platform revenue tracking | 12 MONTHS | Record off-platform earnings for complete business picture |
| Category benchmarking | 24 MONTHS | "Your conversion rate is 4.2% vs. category average 3.1%" — requires 50+ vendors per category |
| Revenue forecasting | 24 MONTHS | Based on seasonal demand pattern + current bookings: "Projected revenue next 3 months" |
| Business health score | 24 MONTHS | Composite score: bookings, reviews, response rate, profile completeness, revenue trend |
| Market intelligence reports | 36 MONTHS | Quarterly aggregated market data: demand trends by category, geography, event type |
| Pricing optimisation suggestions | 36 MONTHS | "Similar photographers in your area charge 15% more — are you leaving revenue on the table?" |
| Predictive booking windows | 36 MONTHS | "Weddings in June are booked on average 8 months in advance — now is the time to be visible" |

---

### DOCUMENTS AND TASK MANAGEMENT

| Capability | Timing | Notes |
|---|---|---|
| No document management | NOW (gap) | Not built |
| Contract templates and signing | 12 MONTHS | See Contracts section above |
| Invoice generation | 12 MONTHS | See Invoices section above |
| Post-event checklist | 12 MONTHS | Vendor task list triggered after booking completes |
| Booking-linked document storage | 24 MONTHS | Attach contracts, invoices, event briefs to specific bookings |
| Document templates library | 24 MONTHS | Rider templates, technical requirements, pre-event questionnaires |
| E-signature capture | 24 MONTHS | Customer signs digitally; stored as legal record |
| Task management (basic) | 24 MONTHS | Vendor creates tasks linked to upcoming bookings: "Confirm venue address", "Pack lighting rig" |
| Pre-event questionnaire builder | 36 MONTHS | Vendor builds a custom questionnaire sent to clients after booking — captures detailed event requirements |

---

### COMMUNICATION

| Capability | Timing | Notes |
|---|---|---|
| In-platform messaging | NOW | ✅ Exists — message_threads |
| Unread message notification | NOW | ✅ Exists — dashboard badge |
| Message history | NOW | ✅ Exists |
| Email notifications (Resend) | 12 MONTHS | Confirm live and reliable; daily summary email; new quote notifications |
| Push notifications (web) | 12 MONTHS | Browser push for new quotes, messages, booking updates |
| Push notifications (mobile, future) | 36 MONTHS | Native mobile push — with mobile app |
| Message templates | 12 MONTHS | Vendor saves standard response templates |
| WhatsApp integration | 24 MONTHS | Send WhatsApp from CRM; WhatsApp link on vendor profile |
| Email broadcast to customers | 36 MONTHS | Vendor sends branded newsletter to their ELBOLD customer list |
| In-platform group messaging | 36 MONTHS | Multi-vendor event coordination (e.g., photographer and decorator both booked for same wedding) |

---

### GROWTH TOOLS

| Capability | Timing | Notes |
|---|---|---|
| Profile strength widget | NOW | ✅ Exists — completion score with specific recommendations |
| Activation checklist | NOW | ✅ Exists |
| Verification progression | NOW | ✅ Exists — 4-level system |
| Subscription upgrade prompts | NOW | ✅ Exists |
| Daily summary email | 12 MONTHS | "Today's priorities: 2 follow-ups due, 1 message to respond to, 3 profile views yesterday" |
| Growth recommendations | 12 MONTHS | "Adding a 5th photo typically increases quote requests by 30% for your category" |
| Competition visibility | 24 MONTHS | "3 new photographers joined your area this month" — drives quality investment |
| Referral programme for vendors | 24 MONTHS | Vendor refers another vendor → both receive subscription credit |
| Seasonal promotion planner | 24 MONTHS | Calendar showing when to promote for upcoming event seasons |
| Growth coaching sessions | 36 MONTHS | Virtual session with ELBOLD team — "Profile Review" for Enterprise plan |

---

### SEASONAL PLANNING

| Capability | Timing | Notes |
|---|---|---|
| Seasonal demand chart (historical) | NOW | ✅ Exists — monthly booking patterns |
| Forward-looking demand forecast | 24 MONTHS | "Weddings peak in June-August — 4 months away. Your calendar has 6 available Saturdays." |
| Seasonal pricing recommendations | 36 MONTHS | Suggest premium pricing in peak months based on category demand |
| Pre-season capacity alert | 36 MONTHS | "June is 8 weeks away and you're 70% booked — should you increase your prices?" |

---

### LOYALTY AND REPEAT BUSINESS

| Capability | Timing | Notes |
|---|---|---|
| Customer lifetime value tracking | NOW | ✅ Exists — total spend per customer visible |
| Repeat customer identification | 12 MONTHS | Dashboard highlight: "3 customers have booked you more than once" |
| Re-engagement recommendations | 24 MONTHS | "Sarah booked you 18 months ago for her daughter's birthday — her second daughter turns 5 next month" |
| Loyalty discount tools | 24 MONTHS | Vendor creates a returning-customer discount code |
| Referral tracking | 24 MONTHS | Track when one customer refers another — credit vendor for referral bookings |
| Anniversary booking alerts | 24 MONTHS | Trigger: "Client's 1-year wedding anniversary is in 3 weeks — reach out" |

---

### PUBLIC VENDOR PAGES

| Capability | Timing | Notes |
|---|---|---|
| SEO-optimised profile page | NOW | ✅ Exists — JSON-LD, canonical URL, OG images |
| Portfolio gallery | NOW | ✅ Exists |
| Review display | NOW | ✅ Exists |
| Verification badges | NOW | ✅ Exists |
| Package/pricing display | NOW | ✅ Exists |
| Similar vendors section | NOW | ✅ Exists |
| Profile view tracking | NOW | ✅ Exists — ProfileViewTracker |
| Social media links display | NOW | ✅ **Corrected 2026-07-10 — done, moved from 12 MONTHS.** Facebook/TikTok/WhatsApp shown on public profile via existing `portfolio_links` field, shipped commit `d6db444` (2026-07-01). |
| Direct contact links (WhatsApp/email) | 12 MONTHS | "Contact me directly" button using vendor's phone/email (separate from platform quote flow) |
| Shareable quote link | 12 MONTHS | Vendor-specific URL that pre-fills their details in the quote form |
| Testimonials section (unverified) | 24 MONTHS | Off-platform client testimonials displayed separately from verified ELBOLD reviews |
| FAQ section | 24 MONTHS | Vendor adds their own Q&A ("Do you travel?", "What's included in your packages?") |
| Event video showreel | 24 MONTHS | Featured video at top of profile (replaces static photo for video-heavy categories) |
| Vendor blog / case studies | 36 MONTHS | Short articles on the vendor's ELBOLD profile — SEO value for vendor and platform |
| Custom domain mapping | 60 MONTHS | `www.johnsmithphotography.com` resolves to their ELBOLD profile (Enterprise) |

---

### PERSONAL BUSINESS WEBSITE REPLACEMENT

| Capability | Timing | Notes |
|---|---|---|
| Profile as mini-website | 12 MONTHS | Profile page functions as complete personal website — bio, gallery, packages, reviews, contact |
| QR code generation | 12 MONTHS | Business card QR code pointing to vendor profile |
| PDF brochure download | 12 MONTHS | Auto-generated from profile data |
| "Website powered by ELBOLD" footer | 12 MONTHS | Attribution on profile when used as website replacement |
| Custom about section | 24 MONTHS | Extended "about me" section beyond the bio field |
| Multiple gallery collections | 24 MONTHS | "Wedding portfolio", "Birthday portfolio", "Corporate portfolio" — separate galleries |
| Embed booking widget | 36 MONTHS | Embeddable HTML snippet for vendors who have their own website — ELBOLD booking flow within their site |
| Custom domain mapping | 60 MONTHS | Full subdomain or domain pointing to their ELBOLD profile |

---

### SEO AND DISCOVERABILITY

| Capability | Timing | Notes |
|---|---|---|
| Vendor profile JSON-LD | NOW | ✅ Exists — LocalBusiness + AggregateRating |
| Dynamic meta titles and descriptions | NOW | ✅ Exists |
| Canonical URL with slug history | NOW | ✅ Exists |
| Sitemap | NOW | ✅ Exists — robots.ts, sitemap.ts |
| Category + city landing pages | 12 MONTHS | `/photographers/london`, `/djs/essex` — indexed, vendor-listing pages |
| Event type landing pages | 12 MONTHS | `/wedding-photographers`, `/birthday-djs` — long-tail keyword capture |
| Blog / content hub | 24 MONTHS | "How to plan a wedding in Essex" — drives organic customer acquisition |
| Google My Business integration | 36 MONTHS | Keep ELBOLD verification and review count synced to Google Business |
| Local citation building | 36 MONTHS | ELBOLD vendor profiles automatically submitted to local directories |

---

## SECTION 4 — VENDOR DEPENDENCE FRAMEWORK

### 4.1 The Dependence Ladder

Vendor dependence is not built through artificial lock-in. It is built through genuine operational integration. The goal is to make leaving ELBOLD feel like losing a business infrastructure that took years to build.

```
LEVEL 6 — ENTERPRISE DEPENDENCY (MRR: ~£149+/vendor)
Vendor uses ELBOLD for: team management, client portals,
contracts, invoices, all payments, annual accounts.
Their business cannot operate for 48 hours without ELBOLD.

LEVEL 5 — DIGITAL IDENTITY (MRR: ~£89+/vendor)
Vendor's ELBOLD URL is their primary online presence.
Their business card, Instagram bio, and Google listing
all point to elbold.com/vendors/their-name.
Leaving means losing their professional digital identity.

LEVEL 4 — FINANCIAL INTEGRATION (MRR: ~£89/vendor)
Vendor processes off-platform payments through ELBOLD.
Issues invoices through ELBOLD.
Annual earnings tracked through ELBOLD.
Financial records are in ELBOLD.

LEVEL 3 — BUSINESS TOOL USER (MRR: ~£49/vendor)
Vendor uses ELBOLD CRM, analytics, calendar.
Their customer contacts are in ELBOLD.
Their booking history is in ELBOLD.
Leaving means losing their business data.

LEVEL 2 — ACTIVE MARKETPLACE (MRR: £0-49/vendor)
Vendor has 1+ ELBOLD bookings.
Checks platform when notifications arrive.
Staying because bookings arrive and reviews accumulate.

LEVEL 1 — PASSIVE PROFILE (MRR: £0)
Vendor has a profile but no bookings.
No daily utility. Churn risk: HIGH.
```

**Target distribution by Year 2:**  
Level 1: < 10% of vendors  
Level 2: 20%  
Level 3: 35%  
Level 4: 25%  
Level 5: 8%  
Level 6: 2%

### 4.2 Measuring Dependence

**Daily Usage Signals** (track these; any vendor with 0 in the last 7 days is a churn risk):
- Login events
- Availability calendar updates
- CRM contact views or additions
- Message views
- Dashboard load

**Weekly Usage Signals:**
- Analytics viewed
- Quote or booking actioned
- Profile edit or media update
- Follow-up reminder triggered

**Monthly Usage Signals:**
- Invoice generated
- Payment link sent or received
- Subscription renewing without cancellation attempt
- Profile views trending positive

**Operational Dependence Indicators:**
- CRM contact count > 20 (database dependency)
- Calendar has blocks from off-platform bookings (habit formed)
- Off-platform payments processed through ELBOLD (financial dependency)
- Contracts stored in platform (legal dependency)
- Invoices generated through platform (financial dependency)

**Business Dependence Indicators:**
- Vendor's ELBOLD URL shared publicly (identity dependency)
- Year-over-year analytics visible (historical data dependency)
- Review count > 5 (reputation dependency)
- Verification level 3+ (credential dependency)

**Revenue Dependence Indicators:**
- 3+ bookings attributed to ELBOLD in last 3 months
- Subscription auto-renewed without cancellation
- Off-platform payment volume > £1,000/month through ELBOLD

### 4.3 Churn Prevention Design

**Early warning signals (trigger within the first 30 days):**
- No login in 7 days → trigger "Your business summary" email: "Here's what's happened on ELBOLD this week"
- No CRM contact added in 14 days → trigger prompt: "Have you added your off-platform contacts to ELBOLD?"
- Analytics not viewed in 21 days → trigger: "Your profile had 47 views this month — here's what that means"
- Profile completion score < 60 after 14 days → trigger: "3 quick steps to reach more customers"

**Month-2 retention design:**
- Before subscription renewal, show vendors: what they received (profile views, quote requests, contact count), what improved (rating, completion score), what's coming (seasonal demand forecast)
- Frame renewal as "continuing your business infrastructure" not "paying for a marketplace subscription"

**Reactivation design:**
- Vendor who hasn't logged in for 30 days → "Your business while you were away": profile views, any messages, seasonal opportunity upcoming

---

## SECTION 5 — CUSTOMER LIFETIME STRATEGY

### 5.1 The Customer Lifecycle Problem

Event customers are not like SaaS customers, e-commerce customers, or subscription customers. They do not have a monthly purchasing cadence. They plan a birthday party, book vendors, attend the event — and then have no reason to return to ELBOLD for 12-18 months.

This is not a flaw. It is the market structure. The challenge is to remain present, relevant, and trusted across the gaps.

A customer who plans 3 events per decade and books an average of 5 vendors per event represents approximately 15 ELBOLD bookings over 10 years at an average of £400/booking. That is £6,000 in GMV, generating £600 in commission — from one customer relationship.

This is worth maintaining.

### 5.2 Customer Lifetime Phases

```
PHASE 1: DISCOVERY
Customer finds ELBOLD via search, social, or vendor referral.
They browse. They compare. They request quotes.
Goal: convert to first booking.

PHASE 2: FIRST BOOKING
Customer books their first vendor.
They experience: Stripe payment protection, direct messaging,
booking management, post-event review.
Goal: deliver a flawless experience. Set expectations for ELBOLD's reliability.

PHASE 3: POST-EVENT
Event completes. Payment finalised.
Customer is prompted to leave a review.
Goal: capture the review (most important customer action).

PHASE 4: DORMANT
Customer has no active events.
They may return in weeks, months, or years.
Goal: remain top-of-mind without being intrusive.

PHASE 5: RETURN
Customer plans next event.
They return to ELBOLD because they remember the trust.
Goal: make return frictionless and better than the first time.
```

### 5.3 Customer Retention Tactics by Phase

**Phase 1 → 2 (Discovery to First Booking):**
- Concierge service for customers who don't know where to start (already live at `/concierge`)
- Smart Planner: event type + date + budget → recommended vendor categories
- Trust signals prominently visible before first click (verification, review gating, payment protection)
- No account creation required to browse — minimise friction
- Quote request should be effortless: auto-populate event details if customer is logged in

**Phase 2 → 3 (First Booking to Post-Event Review):**
- Booking management dashboard: customer sees exactly what they've paid, what's coming, what's next
- Pre-event reminder: "Your event is in 7 days — here's everything you've booked"
- Day-after-event review prompt: single email, single click to leave a review
- Post-event summary: what was booked, what was paid, what the vendor delivered — a record of the experience

**Phase 3 → 4 (Post-Event to Dormant):**
- Review thank-you: "Your review helps other customers trust ELBOLD — thank you"
- Optional: "Would you like to receive planning inspiration for your next event?" — consent to remain in contact
- Vendor recommendation follow-up (not immediate): "Vendors similar to the ones you booked are getting 5-star reviews"
- Save the event to customer profile — builds their history

**Phase 4 → 5 (Dormant to Return):**
- Seasonal event prompts (consent-based): "Christmas party season is 3 months away — start planning early"
- "Your vendors are still on ELBOLD" — notification when a previously booked vendor receives new 5-star reviews
- Anniversary prompt: "It was one year ago today that you hosted your birthday event with [vendor] — planning another celebration?"
- New vendor notifications: "A new photographer has joined ELBOLD in your area with 5 reviews averaging 4.9 stars"

### 5.4 The Review as Retention Engine

The review is the most important customer action in the entire ELBOLD lifecycle. It benefits three parties:
1. **The vendor** — receives a verified trust signal that grows in value over time
2. **Future customers** — can trust the social proof is genuine
3. **ELBOLD** — every review is permanent social proof that a real transaction happened

The review submission experience must be the best it can be:
- Timed to arrive within 24 hours of the event (not immediately after booking completion)
- Single-click from email (no login required for the review step itself)
- Short (rating + optional comment) — not a 10-question form
- Immediately visible on the vendor's public profile after submission

### 5.5 The Concierge as Customer Lifetime Extension

The concierge service (`/concierge`) is currently underutilised. A customer who submits a concierge request receives personalised vendor recommendations. This is a relationship, not a transaction.

The concierge model should evolve:
- First event: customer submits a brief; ELBOLD team recommends vendors
- Second event: customer has a relationship with ELBOLD; they return to the same concierge channel
- Tenth event: customer thinks of ELBOLD whenever they need to plan anything

The concierge is the beginning of a long-term customer relationship. Treat every concierge enquiry as a lifetime customer acquisition, not a one-off request.

---

## SECTION 6 — THE COMMERCIAL FLYWHEEL

### 6.1 The Complete Flywheel

```
                    ┌─────────────────────────┐
                    │    MASTER GROWTH OS     │
                    │   (Internal Engine)     │
                    │                         │
                    │  Discover → Qualify     │
                    │  Outreach → Nurture     │
                    │  12-stage Journey       │
                    └────────────┬────────────┘
                                 │ Vendor Applications
                                 ▼
                    ┌─────────────────────────┐
                    │   VENDOR ACQUISITION    │
                    │                         │
                    │  Founding Vendor Page   │
                    │  Application Flow       │
                    │  Human Review & Approve │
                    │  Verification Pathway   │
                    └────────────┬────────────┘
                                 │ Approved Vendors
                                 ▼
                    ┌─────────────────────────┐
                    │    VENDOR SUCCESS       │
                    │                         │
                    │  Profile Completion     │
                    │  Business Tools (OS)    │
                    │  Subscription Upgrade   │
                    │  Verification Progress  │
                    │  Daily Platform Usage   │
                    └────────────┬────────────┘
                                 │ High-quality, complete profiles
                                 ▼
                    ┌─────────────────────────┐
                    │    CUSTOMER TRUST       │
                    │                         │
                    │  Verified Reviews       │
                    │  Trust Architecture     │
                    │  Strong Profiles        │
                    │  Stripe Protection      │
                    └────────────┬────────────┘
                                 │ Customer confidence
                                 ▼
                    ┌─────────────────────────┐
                    │       BOOKINGS          │
                    │                         │
                    │  Quote → Accept         │
                    │  Payment (30% deposit)  │
                    │  Event Delivery         │
                    │  Balance Payment        │
                    └────────────┬────────────┘
                                 │ Completed bookings
                                 ▼
                    ┌─────────────────────────┐
                    │       REVIEWS           │
                    │                         │
                    │  Verified by booking    │
                    │  Permanent on profile   │
                    │  Indexed by Google      │
                    │  Trust for next visitor │
                    └────────────┬────────────┘
                                 │ Trust evidence
                                 ▼
                    ┌─────────────────────────┐
                    │      RETENTION          │
                    │                         │
                    │  Vendor: Business tools │
                    │  Customer: Review sent  │
                    │  Both: Relationship     │
                    │  active                 │
                    └────────────┬────────────┘
                                 │ Revenue
                                 ▼
                    ┌─────────────────────────┐
                    │   RECURRING REVENUE     │
                    │                         │
                    │  Commission (bookings)  │
                    │  Subscriptions (OS)     │
                    │  Processing fees        │
                    │  (off-platform pmts)    │
                    └────────────┬────────────┘
                                 │ Capital for growth
                                 ▼
                    ┌─────────────────────────┐
                    │        GROWTH           │
                    │                         │
                    │  More vendor categories │
                    │  Geographic expansion   │
                    │  Platform improvements  │
                    │  Team growth            │
                    └────────────┬────────────┘
                                 │ Larger vendor pool
                                 └──────────────────────┐
                                 (loops back to)        │
                                 CUSTOMER TRUST ◄───────┘
```

### 6.2 How Each Stage Strengthens the Next

**Master Growth OS → Vendor Acquisition**  
The Relationship Journey Engine (12-stage pipeline) identifies, qualifies, and nurtures vendor relationships systematically. It eliminates the cold outreach problem by building a warm relationship before the application request. Better-qualified applicants → higher approval rate → less wasted admin time.

**Vendor Acquisition → Vendor Success**  
The onboarding experience immediately delivers business tool value. A vendor who adds 10 contacts to their CRM in the first week, uploads their portfolio, and builds their service packages has already embedded themselves in the platform before their first enquiry arrives. This reduces early churn dramatically.

**Vendor Success → Customer Trust**  
Vendors with high completion scores, multiple verification levels, and complete portfolios create customer-facing profiles that convert. A customer who sees 20 photos, 5 verified reviews, Level 3 verification, and a complete package menu trusts the vendor before reading the bio. Complete vendor profiles are the primary customer conversion driver.

**Customer Trust → Bookings**  
Trust translates directly to conversion rate. A marketplace where every vendor is individually reviewed and every review is verified is categorically different from a marketplace where vendors self-register and reviews can be fabricated. Customers who understand ELBOLD's model convert at higher rates, book larger events, and return more reliably.

**Bookings → Reviews**  
Every completed booking automatically enables a verified review. The review is not optional infrastructure — it is a structural output of every booking. Over time, the accumulation of verified reviews is the most valuable asset ELBOLD builds. A review that appears on Google Search for "[vendor name] + [city]" drives inbound discovery without any acquisition spend.

**Reviews → Retention (Vendor)**  
A vendor with 20 verified ELBOLD reviews has built a reputation asset they cannot replicate elsewhere. They will not leave ELBOLD because leaving means losing their review history. Every additional review makes the vendor more dependent on the platform — not through artificial lock-in, but because their professional reputation is embedded in it.

**Reviews → Retention (Customer)**  
Customers who read reviews before booking have higher satisfaction rates because they make better-informed choices. Satisfied customers return. The review cycle is also a trust signal for future customers, reducing acquisition cost for every subsequent booking.

**Retention → Recurring Revenue**  
Vendor subscriptions renew monthly because the platform is genuinely useful every day. Commission arrives on every booking. Processing fees arrive on every off-platform payment. The three revenue streams compound: as vendor count grows, subscription revenue grows linearly. As vendor success drives more bookings, commission grows with GMV. As financial integration deepens, processing fees grow independently.

**Recurring Revenue → Growth**  
Predictable MRR funds platform development, team growth, and geographic expansion. The financial model becomes self-reinforcing: better tools → more vendor retention → more subscription revenue → better tools.

**Growth → Customer Trust (the closing loop)**  
Geographic expansion brings ELBOLD into new markets where the trust architecture repeats its effect. More vendor categories attract more customer types. More complete category coverage means customers can plan entire events through ELBOLD rather than using it for one vendor type. This creates the "event planning home base" relationship that drives lifetime customer value.

### 6.3 Flywheel Acceleration Points

The flywheel has three natural acceleration points — moments where growth compounds faster than linear:

**Acceleration Point 1: Minimum Viable Density**  
When any category in any geography reaches 20+ vendors, the marketplace becomes self-sustaining for that category. Customers searching "wedding photographers in Essex" find enough options to make a real choice. Vendors in that category start receiving regular enquiries. Enquiries drive bookings. Bookings drive reviews. Reviews drive more customer trust. The flywheel spins independently for that category.

Target: achieve minimum viable density in photographers, DJs, and decorators in Essex within 12 months.

**Acceleration Point 2: Subscription Stickiness Threshold**  
When average vendor subscription tenure exceeds 9 months, churn approaches zero for that cohort. The operational dependency (CRM data, financial records, review history, calendar integration) makes the cost of leaving greater than the cost of staying. At this point, subscriptions renew automatically and the only growth required is new vendor acquisition.

Target: achieve 9-month average tenure for Professional plan subscribers within 18 months.

**Acceleration Point 3: Organic Discovery**  
When vendor profiles begin appearing in Google Search results for "[category] in [city]" queries, customer acquisition becomes organic. A photographer with 15 reviews, Level 3 verification, and a complete JSON-LD schema will rank in local search. Every customer who discovers ELBOLD through a vendor profile is a zero-cost customer acquisition. When this becomes material (>20% of customer traffic from organic search), the marketplace becomes self-funding from a customer acquisition perspective.

Target: 20% of customer sessions from organic search within 24 months.

---

## SECTION 7 — FIVE-YEAR ROADMAP

This is a business evolution roadmap, not a software development timeline. It describes the commercial milestones, the team growth, and the market position ELBOLD should occupy at each stage — not the features being shipped.

---

### YEAR 1 (2026): PLANT THE ROOTS

**Theme:** "Build the platform vendors rely on. Let the marketplace prove itself."

**Commercial objective:**  
50 approved vendors. £10,000 MRR. First 100 customer bookings. 40+ public verified reviews.

**The business task in Year 1:**  
Prove two things: that vendors will pay for ELBOLD as a business tool even before they receive marketplace traffic, and that customers who arrive find enough vendors to complete a real event.

**What happens in Year 1:**

*Q1 (Jul-Sep 2026):*  
- Founding Vendor Programme delivers first 20 approved vendors (Master Growth OS Pilot evidence by July 14)
- Stripe Connect activated — manual payouts eliminated
- Subscription value rewritten around business tools, not visibility
- Daily summary email launched
- CRM follow-up reminders built
- Enterprise Design Pass (Phase 70E.1) completed

*Q2 (Oct-Dec 2026):*  
- 35+ approved vendors across London and Essex
- QR code and brochure generation live
- Social media links displayed on public vendor pages
- Category + city SEO landing pages indexed
- First 50 customer bookings completed
- First cohort of Professional subscribers (target: 15 at £49/month = £735/month)
- Invoice generation and contract templates launched (Growth plan)
- Off-platform payment request links live

*Year 1 team:*  
Founder (CEO/CPO), Global Admin Ts (operations), Lz (community/vendor relations), ML (to be defined). No external hires required if Operations Guide is followed correctly. Operations are designed to function with 3-4 part-time team members.

*Year 1 financial target:*  
£10,000 MRR by December 2026. Breakdown: 30 Professional subscribers × £49 = £1,470; 5 Growth subscribers × £89 = £445; commission on 80 bookings × £40 average = £3,200; processing fees on £15,000 off-platform payments × 3% = £450. Remainder from ad hoc and Founding Vendor annual subscriptions. This is achievable.

*Year 1 challenge:*  
The single biggest risk is vendor supply not materialising fast enough. If the Founder Pilot produces fewer than 10 strong vendor applications by July 14, the vendor acquisition strategy needs immediate revision — not the platform.

---

### YEAR 2 (2027): PROVE THE FLYWHEEL

**Theme:** "Marketplace liquidity achieved in the first category. Subscriptions self-sustaining."

**Commercial objective:**  
150 approved vendors. £35,000 MRR. Geographic coverage: London, Essex, Kent proven. 500+ completed bookings. 200+ public reviews. First category (photographers) reaches 20+ vendors.

**What happens in Year 2:**

*Marketplace:*  
The photographer and DJ categories in Essex achieve minimum viable density. Customers searching organically find enough options to compare and book. First organic bookings (not driven by founder outreach) begin appearing. Google organic traffic to vendor profile pages begins converting.

*Business platform:*  
Growth plan (£89/month) proves its value through off-platform payment processing. Vendors who process £2,000+/month through ELBOLD pay £89 subscription + generate £60 in processing fees. Total vendor contribution: £149/month. These vendors are embedded.

CRM pipeline stages prove the follow-up conversion improvement. Vendors who use the CRM actively convert 25%+ more of their off-platform leads. This becomes the primary upgrade trigger for Professional → Growth conversion.

Year-over-year analytics unlock for the first cohort of vendors. Having 12 months of data becomes a retention anchor — they will not leave without losing it.

*Team:*  
First operational hire beyond core team — a vendor success role whose sole job is to take vendors from Level 1 (passive profile) to Level 3 (business tool user). This person handles onboarding calls, profile completion coaching, and subscription upgrade conversations. Target: 1 vendor success person per 100 active vendors.

*Year 2 financial target:*  
£35,000 MRR by December 2027. Breakdown: 80 Professional × £49 = £3,920; 30 Growth × £89 = £2,670; 5 Enterprise × £149 = £745; commission on 500 bookings/year × £45 average = £1,875/month; processing fees on £80,000 off-platform payments/month × 3% = £2,400. Total: ~£11,610/month from these lines plus growth in subscription base.

*Year 2 challenge:*  
Scaling operations without the founder being the decision point on all approvals. The admin role model must function with Ts, Lz, and ML handling daily operations autonomously, with founder involvement only on governance exceptions.

---

### YEAR 3 (2028): EXPAND AND DEEPEN

**Theme:** "Geographic expansion. Business platform deepens. Growth plan scales."

**Commercial objective:**  
400 approved vendors across 6 UK cities. £90,000 MRR. 2,000+ completed bookings. First business intelligence product launched.

**What happens in Year 3:**

*Geographic expansion:*  
Enter Birmingham and Manchester with the same supply-first approach. Master Growth OS is adapted to target vendors in each new geography. The Founding Vendor Programme becomes a repeatable market entry playbook. Each new city starts with 20 target vendors across 6 categories before customer acquisition begins.

*Business platform deepens:*  
Pre-event questionnaire builder launched. Customer re-engagement automation live. Vendor blog and content section released. First automated seasonal promotion planner available. Finance partnership active — insurance referral with a UK public liability insurer.

*Data product:*  
The first ELBOLD Market Intelligence Report published — "UK Event Services: Q1 2028 Demand Trends." Based on 18 months of aggregated, anonymised booking data. Available to Enterprise plan subscribers first, then commercially published. This is the first step toward industry authority.

*Team:*  
Engineering team expands (first full-time engineer, if not already hired in Year 2). Marketing role focused on SEO and content. Second vendor success team member. Operations team handles approvals and verifications without founder involvement.

*Year 3 financial target:*  
£90,000 MRR by December 2028. New revenue lines include: finance partnership referrals (£200-500/month), market intelligence report access (£99/year per non-subscriber), vendor blog SEO driving organic customer traffic reducing acquisition cost.

---

### YEAR 4 (2029): ESTABLISH AUTHORITY

**Theme:** "ELBOLD becomes the most trusted name in UK event vendor verification. Industry partnerships begin."

**Commercial objective:**  
800 approved vendors nationally. £180,000 MRR. First professional association partnership. ELBOLD verification recognised by at least one major UK insurer.

**What happens in Year 4:**

*Industry partnerships:*  
ELBOLD approaches professional associations (e.g., BECTU, the UK's Broadcasting Entertainment, Communications and Theatre Union, or photography associations) to explore mutual recognition of verification credentials. The goal: ELBOLD verification status matters outside the platform — insurers give discounts to Level 3+ verified vendors, and industry bodies reference the standard.

*Certification launch:*  
"ELBOLD Certified Professional" — a formal certification programme beyond the current verification levels. Requires: Level 3 verification, minimum 20 reviews averaging 4.5+, minimum 2 years on platform, completion of ELBOLD training modules. Annual renewal fee of £149. By Year 4, certification has meaning because the track record exists.

*Platform maturation:*  
Mobile app launched (iOS and Android). Vendor blog content hub driving significant organic traffic. Vendor API (allow approved third parties to verify ELBOLD credentials). First enterprise agency accounts (multi-vendor agencies using ELBOLD Enterprise).

*Year 4 financial target:*  
£180,000 MRR. New lines: certification fees (£149 × 200 certified vendors = £29,800/year), mobile app driving increase in daily active usage, agency enterprise plans (£299+/month), API access fees.

---

### YEAR 5 (2030): PLATFORM BUSINESS

**Theme:** "ELBOLD is the infrastructure layer for UK event professional services."

**Commercial objective:**  
1,500+ approved vendors. £400,000 MRR. Adjacent vertical assessment. First platform business characteristics.

**What happens in Year 5:**

*Scale:*  
All major UK cities covered. 15+ vendor categories with minimum viable density in most cities. Customer discovery is predominantly organic — Google search drives most new customers without acquisition spend. The marketplace is self-sustaining.

*Platform characteristics:*  
Vendors use ELBOLD as their primary business operating system. The average vendor has: 18+ months of ELBOLD history, 30+ CRM contacts, 5+ off-platform payment requests per month through ELBOLD, a professional contract on file for every booking, and automatic annual earnings reports. ELBOLD is embedded at Level 4-5 on the dependence ladder for 60%+ of vendors.

*Adjacent vertical consideration:*  
Assess entry into adjacent service verticals — personal trainers, beauty professionals, event venues. Do not expand unless: (a) the event professional market is at capacity or saturation in the target geographies, and (b) the existing platform architecture genuinely serves the new vertical without modification.

The architecture of ELBOLD (vendor OS, trust architecture, review system, subscription model) is generalisable. The brand and operational expertise are event-specific. The adjacency decision must be commercial: where can ELBOLD leverage its platform architecture in a market that is equally fragmented and equally poorly served?

*Year 5 financial target:*  
£400,000 MRR (~£4.8m ARR). At this scale, ELBOLD is a material business. Path to Series A funding or profitable operation with no external capital. The choice between growth funding and organic profitability should be made at Year 4 based on market conditions.

---

## SECTION 8 — EXECUTIVE RECOMMENDATION

### 8.1 If I Were CEO

The question asked is: "If you were CEO of ELBOLD for the next five years, explain exactly how you would build the company."

Here is the honest, opinionated answer.

---

**I would make one decision that most marketplace founders don't make: I would refuse to measure success by GMV for the first 18 months.**

The temptation in marketplace businesses is to obsess over GMV (gross merchandise value) from day one. GMV is the number that investors want to see, that PR stories are built around, and that the founder tells at dinner parties. But in the early stage of a two-sided marketplace with thin supply, GMV is a vanity metric. A marketplace with £50,000 in annual GMV and 40 deeply embedded vendors who each pay £89/month in subscriptions is a better business than a marketplace with £200,000 in GMV and 40 vendors who may all churn after a slow month.

The first 18 months metric I would track obsessively is: **subscription MRR per active vendor**. It tells me whether vendors are extracting genuine business value from the platform independent of marketplace traffic. If the average active vendor is paying £49/month, I'm on track. If they're on the free plan, I'm failing at the product's core purpose regardless of how many bookings the marketplace is doing.

---

**I would build the subscription value before I built the marketplace volume.**

I would spend the first 30 days after Day 1 on three things and three things only:
1. Rewriting the subscription page to sell business tools, not visibility
2. Activating Stripe Connect (already built, just switched off)
3. Launching the daily summary email

These three actions do not require a single new line of product code in the backend. The subscription rewrite is copy and positioning. Stripe Connect is a configuration change. The daily email is a Resend template.

After those three, I would build invoice generation and contract templates before I built any marketplace feature. Because a vendor who generates their first invoice through ELBOLD is 10 times less likely to churn than one who is waiting for a marketplace enquiry that has not arrived.

---

**I would not hire a marketing person until Year 2.**

The instinct when a platform has no traffic is to hire a marketer. Wrong. At 50 vendors and pre-commercial customer traffic, the problem is not awareness — it is conversion and retention. A marketer who drives 1,000 visitors to a marketplace with 15 vendors creates 975 disappointed potential customers who will never return.

The correct Year 1 hire is a vendor success person — someone whose job is to take every new vendor from "I just applied" to "I can't imagine running my business without ELBOLD." That person pays for themselves in reduced churn and increased subscription revenue within 3 months.

---

**I would make the public vendor page famous before I made the marketplace famous.**

I would tell every vendor, on the day they are approved: "You now have a professional business page at elbold.com/vendors/your-name. Put this URL in your Instagram bio today. Print it on your next batch of business cards. Make it your Google listing. This is your business identity."

I would build the QR code generator, the PDF brochure, the social media link display, and the shareable quote link before I spent a pound on ELBOLD customer acquisition marketing. Because every vendor who shares their ELBOLD URL publicly is giving ELBOLD an organic distribution channel. 50 vendors × 1,000 social followers each = 50,000 people who could potentially discover ELBOLD through a vendor's content.

This is zero-cost customer acquisition. It should be engineered from Day 1.

---

**I would refuse to add features for 90 days after the Growth plan launches.**

When invoices and contracts go live, I would freeze feature development for 90 days and instead focus on three things:
1. Are vendors using the new features? (usage analytics)
2. Are they upgrading to Growth because of them? (conversion tracking)
3. What are they asking for that Growth doesn't do? (qualitative feedback)

The temptation after launching a major feature update is to immediately start planning the next one. Resist it. Features that aren't being used tell you more than features you haven't built yet. If Growth plan vendors aren't generating invoices after 30 days, the problem is not that the invoices feature is missing — it's that something is wrong with the onboarding, the education, or the communication around what the feature does.

---

**I would protect the review integrity with my life.**

At some point — maybe Year 2, maybe Year 3 — someone will suggest that ELBOLD should allow imported reviews, AI-generated summaries of off-platform testimonials, or some other mechanism to "boost" a vendor's review count before they have real ELBOLD bookings.

The answer is no. Every time. Without exception.

The ELBOLD review system — where every review is mathematically impossible to fake because of the `NOT NULL` foreign key constraint on `bookings.customer_id` — is the single feature that competitors cannot copy without rebuilding their entire platform from scratch. Bark.com, Hitched, and Poptop have millions of users and thousands of reviews. Most of them are impossible to verify. ELBOLD's reviews are impossible to fabricate.

This is the moat. Do not fill it in for short-term gain.

---

**I would be honest with vendors about what the marketplace cannot promise.**

The worst thing ELBOLD could do is overpromise marketplace traffic and underdeliver. A vendor who joins expecting "customers actively searching for your services" and receives no enquiries in the first 60 days will churn — and will tell other potential vendors exactly what happened.

The communication strategy from Day 1 should be: "ELBOLD is a business operating platform. We are building a marketplace alongside it. You will benefit from the marketplace as it grows. In the meantime, the platform tools are yours to use from today."

This is honest. It is also strategically correct — it positions ELBOLD as a business platform that happens to have a marketplace, not a marketplace that also has some tools.

---

### 8.2 What I Would Deliberately Avoid Building

**1. A reviews import tool or AI review aggregation**  
The moat is integrity. See above.

**2. A customer subscription or premium membership**  
Customers plan 1-3 events per decade. A £9.99/month customer membership creates friction at exactly the moment the customer is deciding whether to use ELBOLD. The revenue is trivial. The conversion damage is not.

**3. Manual booking entry in the booking system**  
This is a permanent constraint. The moment a booking can be created without a real customer transaction, the review system's integrity is in question. If vendors need to track off-platform jobs, the CRM is the right place — not the booking system.

**4. A competing social media presence before the platform is proven**  
ELBOLD does not need a TikTok account in Year 1. It needs 50 excellent vendors. Social media presence amplifies an existing platform — it cannot create one from nothing.

**5. A geographic expansion before local density**  
Expanding to Birmingham before Essex has 30 vendors and a proven local flywheel is a strategic mistake. Diluted focus, diluted quality, diluted brand. Go deep before going wide.

**6. An AI assistant or chatbot**  
Event planning requires human judgment. A chatbot that gives advice about wedding photographers will give bad advice to some customers, and those customers will lose trust in ELBOLD permanently. Defer AI until the platform has enough data to make it genuinely useful (Year 3+), and then apply it to analytics and intelligence — not customer-facing conversation.

**7. A fundraising round before commercial proof**  
The unit economics of the ELBOLD model — subscriptions + commission + processing fees — can build a sustainable business without external capital if vendor acquisition is managed carefully and subscription revenue covers operational costs before team growth is required. Fundraising before commercial proof dilutes equity, creates investor pressure on timelines, and introduces competing priorities. Prove the model on the founder's terms first.

---

### 8.3 The Test That Cuts Through Everything

When in doubt about whether to build something, spend resources on something, or change the strategy, apply this test:

**"Does this make it harder for a vendor to leave ELBOLD, because ELBOLD is genuinely good for their business — not because we made it artificially difficult?"**

If yes: build it, fund it, prioritise it.  
If no: defer it, cut it, or find a different approach.

Every decision that passes this test builds genuine commercial value. Every decision that fails it is, at best, wasted resource, and at worst, a feature that vendor will resent when they eventually do leave.

The companies that event professionals spend money on without question — Canva, Stripe, Calendly, QuickBooks — are the ones that make running a business genuinely easier. ELBOLD is building in that direction.

The companies that event professionals cancel the moment business slows — lead generation platforms, directories, social media ads — are the ones that only deliver value when the market is already working for the vendor.

ELBOLD must be the first type of company. That is the entire strategy.

---

## APPENDIX — STRATEGIC DECISION REGISTER

These decisions are recorded as standing policy. Any proposal to reverse them should be escalated to the Founder and documented with a full commercial rationale before proceeding.

| Decision | Rationale | What It Rules Out |
|---|---|---|
| Subscription sold on business value, not marketplace visibility | Marketplace value is market-dependent and cannot be promised | Marketing subscriptions as "get found faster" |
| Review integrity: only from confirmed bookings, no exceptions | The moat is integrity; compromising it removes the competitive advantage | Review imports, testimonial imports, AI-generated summaries |
| No manual booking entries | Preserves review system integrity | Vendor convenience for tracking off-platform work |
| No customer-side subscription | Customer acquisition is a competitive advantage; friction kills it | Easy short-term revenue from premium customer tiers |
| Supply-before-demand: no paid customer acquisition before 30 vendors | Driving customers to a thin marketplace creates lasting negative brand associations | Short-term GMV boost through paid ads |
| No geographic expansion before local density (30+ vendors per city) | Depth before breadth; local flywheel must prove before replication | Fast national footprint |
| No AI customer-facing tools before Year 3 | Data volume required for AI to be genuinely useful; premature AI creates trust risk | "AI-powered" marketing claims before the system earns them |
| Master Growth OS is permanently internal; no visible integration | Customer and vendor data security; brand integrity | Automated vendor onboarding that bypasses human review |
| No fundraising before commercial proof | Maintains founder control; avoids investor timeline pressure | Faster scale through external capital |

---

*This is the master strategic document for ELBOLD through 2030.*  
*Review date: 2026-10-01 (after Q1 of commercial execution).*  
*Update trigger: any commercial event that contradicts a core assumption in this document.*  
*Owner: Founder.*

*Companion documents:*  
*— `ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md` (baseline, 2026-06-30)*  
*— `ELBOLD_VENDOR_VALUE_BLUEPRINT.md` (vendor value strategy, 2026-06-30)*  
*— `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md` (revenue and evolution, 2026-06-30)*
