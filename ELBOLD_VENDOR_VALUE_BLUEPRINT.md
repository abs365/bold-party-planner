# ELBOLD VENDOR VALUE BLUEPRINT
## Why Vendors Pay. What They Get. How They Stay.
**Phase 70F Strategic Reference | 2026-06-30**  
**Classification:** Internal Strategy | Founder Reference

---

> This document answers one question: **"Why would a vendor happily pay ELBOLD every month even if they received zero marketplace enquiries during that month?"**
>
> Every recommendation is grounded in the live production codebase at commit `54a01b8`.
> Nothing is speculative. Where capabilities exist, they are cited. Where they do not, the gap is named explicitly.

---

## EVIDENCE UPDATE — 2026-07-10

**Grounded in a fresh code-verified capability-truth audit (5 parallel deep-dive passes tracing actual runtime paths) and a fresh competitor/market research report. Corrects specific capability ratings below; the six-pillar framework and subscription architecture remain the working model.**

**1. Availability Calendar's rating needs a downgrade with a specific caveat.** Section 1.2 rates it "Very High" current value and calls it "the most important daily-habit feature currently on the platform." The vendor's own calendar-management experience is confirmed genuinely real (Business Management ★★★★★ holds). But the **customer-facing half of this capability is false**: `app/vendors/[id]/page.tsx` hardcodes `hasAvailability: false` for every public profile, and no quote or booking flow anywhere reads `vendor_availability` — a customer can request or book a date the vendor explicitly blocked. The vendor-facing UI's own claim ("Blocked dates are shown to customers") is not true. Core Marketplace and Customer Retention ratings in the table should drop; Business Management holds.

**2. Verification's "most subscription-resilient feature" claim has one load-bearing dependency now known to be broken.** `vendors.response_rate` — an input to Level 3 verification auto-upgrade — has a schema (0-1) vs. application (0-100) scale mismatch that silently fails every write, freezing the column at 0.5 for effectively every vendor. This blocks the automated Level 3 upgrade path this section assumes is working. The permanence-of-credential argument still holds for vendors who reach Level 2 manually; the automated progression to Level 3 does not currently function as described.

**3. Subscription (Section 3) redesign — confirmed still unimplemented, and the acquisition funnel now actively contradicts it.** The Starter/Professional/Growth/Enterprise (£0/£49/£89/£149) restructure proposed here has not shipped; live `FALLBACK_PLANS` still uses the old Free/Pro/Premium/Elite naming. More urgently: `/founding-vendors` — the actual page a vendor applies from — currently states *"No hidden fees, no required subscription"* and closes with *"Elbold earns only when you do."* This is the opposite of "Target messaging" in Section 3.3. Until this page changes, no amount of subscription-page redesign converts vendors who were told at the door they don't need to subscribe.

**4. Fresh competitor evidence validates the six-pillar framework directly** (`ELBOLD_MARKET_AND_COMPETITOR_RESEARCH.md`, 2026-07-10). HoneyBook and Dubsado — the market's pure CRM/business-ops competitors — carry zero lead-generation and prove the real answer to "why pay in a zero-lead month": the vendor's business runs through the tool (contracts, invoicing, payments), not through promised future leads. Conversely, platforms that charge for visibility alone with no operational fallback (Hitched, Bridebook) show the weakest supplier sentiment of every platform researched. This is now external market evidence for pillars 1 (CRM), 4 (Availability, once fixed), and the general "business-resilient over marketplace-dependent" thesis — not just internal reasoning.

**5. See SECTION 2.5 below (new) for explicit treatment of vendors who already use another CRM, booking system, website, or marketplace — not covered in the original 2026-06-30 version of this document, added per the founder's 2026-07-10 brief.**

---

## SECTION 1 — CURRENT VENDOR CAPABILITY AUDIT

### 1.1 Audit Framework

Every vendor-facing capability is classified across six value dimensions:

| Dimension | Definition |
|---|---|
| **Core Marketplace** | Delivers value only when customer traffic exists |
| **Business Management** | Delivers value regardless of marketplace activity |
| **Revenue Generation** | Creates direct income for the vendor |
| **Customer Retention** | Helps vendors retain their existing customers |
| **Operational Efficiency** | Saves the vendor time or money |
| **Competitive Advantage** | Creates differentiation versus other professionals |

A capability that only delivers "Core Marketplace" value is *subscription-fragile* — vendors who receive no enquiries have no reason to pay. A capability that delivers "Business Management" or "Customer Retention" value is *subscription-resilient* — vendors pay for it regardless of ELBOLD's traffic.

The strategic goal: shift the capability mix from marketplace-dependent to business-platform-embedded.

---

### 1.2 Capability Audit

#### VENDOR PROFILE
**Route:** `/vendor/profile` | **Component:** `VendorProfileEditor`

**What it contains today:**  
Business name, bio, city, category, years experience, website URL, phone, pricing type, min price, areas served, social media links (field exists), languages spoken.

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★★ | Profile is the primary customer-facing asset |
| Business Management | ★★★☆☆ | Serves as a business identity document outside ELBOLD |
| Revenue Generation | ★★★☆☆ | Directly affects quote-to-booking conversion |
| Customer Retention | ★★☆☆☆ | Existing customers reference the profile occasionally |
| Operational Efficiency | ★★☆☆☆ | One place to update business information |
| Competitive Advantage | ★★★★☆ | Professional, verified profile vs. social media page |

**Current value:** Medium-high. The vendor profile is the foundation of everything else. A complete, professional profile is the single most important factor in marketplace success. Its standalone value is limited — it requires customers to see it before it creates value.

**Gap:** The profile has a `website_url` field and social media link fields in the schema but their display on the public page is not prominent. The profile does not function as a full website replacement yet.

---

#### PUBLIC VENDOR PAGE
**Route:** `/vendors/[slug]` | **Component:** `VendorProfileView`

**What it contains today:**  
Business name, category, city, bio, photo gallery, packages with pricing, review section with customer comments, verification badges (4-level), similar vendors section, quote/booking CTAs, profile view tracking analytics, JSON-LD LocalBusiness structured data, dynamic OG images for social sharing.

URL pattern: `elbold.com/vendors/john-smith-photography` — vendor owns a permanent, canonical URL.

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★★ | Primary customer discovery page |
| Business Management | ★★★★☆ | Functions as a mini business website |
| Revenue Generation | ★★★★★ | Direct quote/booking CTA on the page |
| Customer Retention | ★★★☆☆ | Existing customers can be directed here |
| Operational Efficiency | ★★★☆☆ | Eliminates need for a separate website |
| Competitive Advantage | ★★★★★ | Trust signals (verification badges, real reviews) that social media cannot replicate |

**Current value:** Very high — but deeply underutilised. The public vendor page is the most strategically important asset on the platform for vendor retention. A vendor who shares `elbold.com/vendors/my-business` as their primary online presence becomes platform-dependent before any booking is made. See Section 6 for the full strategic assessment of this page.

**Gap:** The page currently presents as a marketplace listing. It could function as a vendor's complete digital business identity. Missing: QR code generation, social media link display, enquiry form (separate from platform quote flow), downloadable brochure, direct WhatsApp/phone link. No vendor-facing sharing tools are surfaced from the dashboard.

---

#### QUOTES / LEADS
**Route:** `/vendor/quotes` | **Component:** `VendorQuotesView`

**What it contains today:**  
All quote requests from customers, ordered by `lead_score` (calculated field), then `created_at`. Each quote shows: customer name, event title, event date, city, guest count, quote status. Quote responses tracked. Status: pending → accepted → rejected → expired.

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★★ | Entirely dependent on marketplace traffic |
| Business Management | ★★☆☆☆ | Lead history is useful for business analysis |
| Revenue Generation | ★★★★★ | Direct revenue source |
| Customer Retention | ★★☆☆☆ | Occasional use |
| Operational Efficiency | ★★★★☆ | Lead scoring saves time on response prioritisation |
| Competitive Advantage | ★★★☆☆ | Lead scoring is not available on most competing platforms |

**Current value:** High when traffic exists. Zero when it does not. This is the most marketplace-dependent feature — it has no value at all in a zero-traffic month.

**Gap:** No quote templates. No proposal builder. No response rate coaching (vendors don't know their response rate affects their ranking). No follow-up tracking. No quote expiry notifications.

---

#### BOOKINGS
**Route:** `/vendor/bookings` | **Component:** Booking management pages

**What it contains today:**  
Full booking lifecycle management. Status tracking (pending → accepted → confirmed → completed). Payment status tracking (deposit_paid → fully_paid). Customer name, event date, city, guest count, total amount, vendor payout, deposit amount. Upcoming events display. Revenue calculations.

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★★ | Requires marketplace bookings to function |
| Business Management | ★★★★☆ | Booking history is a business record |
| Revenue Generation | ★★★★★ | Revenue tracking, payout visibility |
| Customer Retention | ★★★★☆ | Repeat customer tracking via booking history |
| Operational Efficiency | ★★★★★ | Replaces manual calendar/spreadsheet management |
| Competitive Advantage | ★★★★☆ | Structured booking flow vs. WhatsApp/email management |

**Current value:** Very high for active vendors. Zero for vendors with no ELBOLD bookings. A vendor with 3-4 ELBOLD bookings actively uses this page. A vendor with zero ELBOLD bookings has no reason to visit it.

**Gap:** No manual booking entry (deliberate constraint in production). No recurring booking management. No booking anniversary triggers. No post-event checklist.

---

#### REVIEWS
**Route:** `/vendor/reviews` | **Component:** Review management

**What it contains today:**  
All reviews from ELBOLD bookings. Rating (1-5 stars), comment, customer name, date. Vendor can post public responses to reviews. Reviews display on public profile. Average rating calculated via `update_vendor_rating()` trigger (SECURITY DEFINER, fixed in Migration 054).

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★★ | Requires completed ELBOLD bookings |
| Business Management | ★★★★☆ | Reputation is a genuine business asset |
| Revenue Generation | ★★★★☆ | Higher ratings → higher conversion |
| Customer Retention | ★★★☆☆ | Customers return to vendors with strong reviews |
| Operational Efficiency | ★★☆☆☆ | Automated rating calculation |
| Competitive Advantage | ★★★★★ | Verified reviews cannot be faked — no other platform guarantees this |

**Current value:** Structurally high — but requires existing ELBOLD bookings. The review system is ELBOLD's most defensible competitive advantage. A vendor with 10 verified ELBOLD reviews owns something that cannot be replicated on Instagram or Google My Business without risk of fake reviews.

**Gap:** No review request automation. No review milestone notifications ("You've just reached 10 reviews!"). Cannot import reviews from external platforms. No vendor benchmark ("Your rating is 4.9 vs. average for your category of 4.3").

---

#### MESSAGING
**Route:** `/vendor/messages` | **Component:** `MessagingView`

**What it contains today:**  
Threaded messaging between vendor and customer. `message_threads` table with customer profile, vendor, and message history. Read/unread tracking for both parties. Pending vendor banner visible on the messages page for pre-approved vendors. Last message timestamp ordering.

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★☆ | Primarily used for customer communication |
| Business Management | ★★★☆☆ | Communication record keeping |
| Revenue Generation | ★★★★☆ | Good communication converts quotes to bookings |
| Customer Retention | ★★★★☆ | Message history maintains relationship context |
| Operational Efficiency | ★★★★☆ | Centralised communication vs. phone/WhatsApp/email |
| Competitive Advantage | ★★★☆☆ | Standard in marketplace products |

**Current value:** Medium-high for active vendors. The centralised message history is genuinely useful — vendors don't need to search WhatsApp threads or emails for a customer's requirements.

**Gap:** No message templates. No automated follow-up triggers. No mobile push notifications confirmed. No read receipts for vendor messages. No file/image sharing in messages.

---

#### VERIFICATION
**Route:** `/vendor/verification` | **Component:** `VendorVerificationView`

**What it contains today:**  
4-level verification system:
- Level 1: Email confirmed + phone added + bio complete + city + minimum package (automatic)
- Level 2: ID document submission and admin review
- Level 3: Business documents (incorporation, trading name)
- Level 4: Insurance documentation + premium credentials

Verification activity log. Verification status badges displayed on public profile and marketplace listings. `verification_level` column drives filtering and ranking.

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★☆ | Higher verification = better marketplace ranking |
| Business Management | ★★★★★ | Verification is a permanent business credential |
| Revenue Generation | ★★★★☆ | Higher trust signals drive higher conversion |
| Customer Retention | ★★★☆☆ | Customers book verified vendors preferentially |
| Operational Efficiency | ★★★☆☆ | One verification process, not repeated per client |
| Competitive Advantage | ★★★★★ | No social media platform offers documented verification |

**Current value:** Very high — and uniquely subscription-resilient. A verified vendor has something permanent that they cannot get elsewhere. An ID-verified, business-verified, insurance-verified vendor on ELBOLD has a level of documented credibility that no other digital platform provides. Even if ELBOLD sends zero enquiries this month, the vendor's verification badge is on their profile, their QR code, and their business card.

**This is the most subscription-resilient feature on the platform.** A vendor with Level 3-4 verification will not leave ELBOLD because they would lose their verified credentials.

**Gap:** No verification expiry system (insurance lapses need to trigger re-verification). No "verification anniversary" notification. No public verification certificate that vendors can download and show to clients independently. No tiered pricing advantage shown clearly — vendors should understand that Level 3 verification makes their profile appear higher in search.

---

#### GOVERNANCE WIDGET
**Route:** `/vendor/dashboard` | **Component:** `VendorGovernanceWidget`

**What it contains today:**  
Lifecycle state display (setup → at_risk → marketplace_ready → optimised). Health score and completion score visible to vendor. Warning system for compliance issues (cancellation rate, response rate, suspicious flags). Appears on dashboard when lifecycle state is `at_risk` or `setup`.

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★☆ | Lifecycle state affects marketplace visibility |
| Business Management | ★★★☆☆ | Gives vendors a business health score |
| Revenue Generation | ★★★★☆ | Improving scores → better marketplace placement |
| Customer Retention | ★★★☆☆ | Compliance scores reflect service quality |
| Operational Efficiency | ★★★☆☆ | Identifies business problems early |
| Competitive Advantage | ★★★☆☆ | Sophisticated scoring not common in competing platforms |

**Current value:** Medium. The governance widget is currently diagnostic rather than prescriptive. Vendors can see their scores but cannot easily understand what to do to improve them. The lifecycle state model is architecturally strong but not yet commercially leveraged.

**Gap:** Governance widget only appears when there's a problem — it should be always-visible as a business score. No "How to improve your score" guided action plan. Lifecycle state labels ("at_risk") are internally accurate but would alarm a vendor if presented without context.

---

#### SUBSCRIPTION
**Route:** `/vendor/subscription` | **Component:** `VendorSubscriptionView`

**What it contains today:**  
4-tier plans (Free, Pro, Premium, Elite) loaded dynamically from `subscription_plans` DB table. Feature comparison grid. Stripe Checkout integration for paid plans. Stripe Customer Portal for subscription management. Annual/monthly billing toggle. Founding vendor recognition in the UI.

Current plan features by tier:
- Free: 5 photos, 1 package, basic analytics
- Pro: 20 photos, unlimited packages, full analytics, +3 ranking boost, smart lead boosts
- Premium: 50 photos, +6 boost, category featured, homepage featured
- Elite: Unlimited photos, +10 boost, priority support, business insights

**Known defect:** Feature comparison table renders Unicode characters incorrectly (`âœ"` instead of `✓`).

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★☆ | Ranking boosts and featured placement are marketplace-dependent |
| Business Management | ★★★☆☆ | Photo limits and package limits affect profile quality |
| Revenue Generation | ★★★☆☆ | Indirect — more visibility leads to more revenue |
| Customer Retention | ★★☆☆☆ | Minimal direct retention value |
| Operational Efficiency | ★★☆☆☆ | Subscription management centralised |
| Competitive Advantage | ★★★☆☆ | Tiered model is standard |

**Current value:** Medium — and largely marketplace-dependent. The ranking boost only has value when there are customers searching. The photo limit is the most subscription-resilient benefit — a vendor with 25 photos needs Pro to display them all regardless of traffic.

**Critical gap:** The subscription is currently sold primarily on marketplace benefits ("get more visibility"). It is not sold on business tool value. This is the single most important strategic problem with the current subscription model. A vendor who receives zero ELBOLD enquiries will not renew because they see zero value in their subscription — even though the platform provides business management tools they use.

See Section 3 for the subscription redesign strategy.

---

#### SERVICE PACKAGES
**Route:** `/vendor/services` | **Component:** `VendorServicesManager`

**What it contains today:**  
Package management: name, description, price, pricing_type (fixed/hourly/per_person/price_on_request), duration_hours, includes (array of inclusions), is_popular flag. CRUD operations. Packages displayed on public profile.

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★★ | Packages are the product displayed to customers |
| Business Management | ★★★★☆ | Service catalogue is a core business document |
| Revenue Generation | ★★★★★ | Directly influences what customers book and at what price |
| Customer Retention | ★★★☆☆ | Returning customers reference package history |
| Operational Efficiency | ★★★★☆ | Eliminates bespoke pricing conversations |
| Competitive Advantage | ★★★★☆ | Structured pricing with inclusions is rare on competing platforms |

**Current value:** High. The package management system is one of the most business-valuable features on the platform. A vendor who builds their service catalogue on ELBOLD has documented their pricing strategy — something many freelance event professionals never formalise. This creates platform dependency: migrating away from ELBOLD means rebuilding the package structure elsewhere.

**Gap:** No package analytics (which packages generate the most enquiries). No package duplication/cloning. No seasonal pricing support. No package-level availability. No minimum notice period per package.

---

#### AVAILABILITY CALENDAR
**Route:** `/vendor/availability` | **Component:** `AvailabilityCalendar`

**What it contains today:**  
Date-blocking calendar. Future dates can be marked unavailable. Confirmed ELBOLD bookings automatically block the date. Blocked dates shown to customers on the vendor profile. Simple toggle per date.

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★☆ | Prevents double-booking from marketplace customers |
| Business Management | ★★★★★ | Vendor's master calendar for their business |
| Revenue Generation | ★★★★☆ | Accurate availability increases booking confidence |
| Customer Retention | ★★★★☆ | Reliable availability builds trust |
| Operational Efficiency | ★★★★★ | Eliminates manual availability management |
| Competitive Advantage | ★★★★☆ | Integrated availability-booking link is rare in the sector |

**Current value:** High — and genuinely business-platform value. A vendor who blocks all their off-platform booked dates in ELBOLD is using ELBOLD as their primary availability management tool. This creates daily utility: every time they book a job (from any source), they visit ELBOLD to block the date.

This is the most important daily-habit feature currently on the platform.

**Gap:** No recurring availability patterns (e.g., "I'm unavailable every Sunday"). No Google Calendar or Apple Calendar sync. No "available this weekend" quick-select. No external booking link that shows only available dates. No buffer time between bookings (e.g., "I need 2 days between events").

---

#### PAYOUTS
**Route:** `/vendor/payouts` | **Component:** Payout management view

**What it contains today:**  
Financial ledger showing: gross amount, platform commission (10%), vendor payout (90%) per booking. Payment status tracking. Vendor bank details form (sort code, account number, account name). Payout status from `vendor_payouts` table. Manual payout process — admin marks payouts as paid.

Stripe Connect infrastructure is deployed (migrations 055-059) but kill-switched (`STRIPE_CONNECT_ENABLED=false`).

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★★ | Requires ELBOLD bookings to have earnings |
| Business Management | ★★★★☆ | Financial record is a business document |
| Revenue Generation | ★★★★★ | Direct — this is the vendor's income from ELBOLD |
| Customer Retention | ★★☆☆☆ | Minimal |
| Operational Efficiency | ★★★☆☆ | Centralised earnings tracking |
| Competitive Advantage | ★★★★☆ | 90% commission rate is genuinely competitive |

**Current value:** High for active vendors. Zero for vendors with no bookings. The manual payout process is an operational liability at scale.

**Gap:** Stripe Connect not activated. No self-service payout request. No payout schedule visibility. No annual earnings summary (tax year). No VAT tracking. No expense tracking. No off-platform earnings recording.

---

#### DASHBOARD
**Route:** `/vendor/dashboard` | **Component:** Vendor dashboard page

**What it contains today:**  
KPI grid (new requests, active bookings, revenue earned, average rating). 30-day performance (profile views, quote requests, conversion rate). Booking request list. Pending quotes alert. Profile strength widget (completion score with specific action recommendations). Activation checklist. Governance widget (when applicable). Public profile URL with view stats. Quick actions sidebar. Recent reviews. Upcoming events.

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★☆ | KPIs are mostly marketplace-dependent |
| Business Management | ★★★★★ | Central command view for the vendor's ELBOLD activity |
| Revenue Generation | ★★★★☆ | Drives action on pending requests |
| Customer Retention | ★★★☆☆ | Review section maintains reputation visibility |
| Operational Efficiency | ★★★★★ | Single view replaces checking multiple pages |
| Competitive Advantage | ★★★★☆ | Depth of dashboard exceeds most competing platforms |

**Current value:** High — but the value is currently conditional on having activity. A vendor with zero ELBOLD activity sees: 0 bookings, 0 quotes, 0 revenue, 0 views, 0 reviews. This is a retention-destroying experience. A blank dashboard communicates "nothing is happening" — even if the vendor is using the platform's business tools productively.

**Gap:** The dashboard does not surface business-platform value for zero-activity vendors. A vendor with 10 contacts in their CRM, a complete package catalogue, and a fully verified profile should see a dashboard that communicates that their business is being built — not one that shows only zeros.

---

#### ANALYTICS
**Route:** `/vendor/analytics` | **Component:** `VendorAnalyticsDashboard`

**What it contains today (genuine depth):**  
- Summary: profile views, showcase views, quote requests, confirmed bookings, revenue, conversion rate, average rating, total reviews
- Daily chart: views and bookings per day (7/30/90 day periods)
- Revenue trend: monthly and weekly periods
- Month-over-month changes: revenue %, bookings %, quotes %, views %
- Average booking value
- Lead funnel: total leads → responded → accepted → converted → response rate
- Seasonal demand: monthly booking patterns across the year
- Payout split: received vs. pending vs. not yet due
- Direct contacts count
- Period selector with comparison

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★★ | Analytics primarily reflects marketplace activity |
| Business Management | ★★★★★ | Business intelligence at a level most freelancers never have |
| Revenue Generation | ★★★★☆ | Insights drive pricing and availability decisions |
| Customer Retention | ★★★★☆ | Seasonal demand data helps vendors plan capacity |
| Operational Efficiency | ★★★★★ | Replaces manual spreadsheet tracking |
| Competitive Advantage | ★★★★★ | This depth of analytics is not available on any competing platform |

**Current value:** Very high — and surprisingly subscription-resilient. A vendor who uses the analytics dashboard regularly has a business intelligence tool that helps them understand their seasonality, pricing effectiveness, and conversion funnel. Even a vendor with 5 ELBOLD bookings gets genuine value from understanding that 80% of their bookings come in March-June.

The analytics dashboard is the single most under-marketed feature on the platform. It already creates subscription value independent of marketplace volume.

**Gap:** Analytics are ELBOLD-specific — they don't capture off-platform activity. No Google Analytics integration. No competitor benchmarking. No revenue forecasting. No pricing optimisation suggestions. No "best performing package" analysis.

---

#### NOTIFICATIONS
**Implemented via:** `notifications` table, dashboard unread count badge

**What it contains today:**  
Unread notification count displayed in the dashboard header. Notification link to messages. The `notifications` table exists in the schema. No dedicated notification page visible in the route structure.

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★★ | Notifications are primarily for marketplace events |
| Business Management | ★★★☆☆ | Business alerts create habitual platform checking |
| Revenue Generation | ★★★★★ | A fast response rate to notifications is the #1 booking conversion factor |
| Customer Retention | ★★★★☆ | Prompt notification drives prompt response |
| Operational Efficiency | ★★★★☆ | Reduces need for manual checking |
| Competitive Advantage | ★★★★☆ | Speed-to-respond is a ranking factor |

**Current value:** Medium — the notification infrastructure exists but the vendor experience of it is unclear. No dedicated notifications page. No push notification confirmation. The unread count badge in the dashboard header is the only visible notification UI.

**Critical gap:** Push notifications to mobile are not confirmed active. Email notifications for new quotes/bookings are not confirmed active. Without reliable push/email notifications, a vendor misses an enquiry while the customer moves on to the next vendor. Response speed is the single most commercially important factor for lead conversion, and it depends entirely on the notification system working reliably.

---

#### CRM — DIRECT CONTACTS
**Route:** `/vendor/contacts` | **Component:** `ContactListView`

**What it contains today:**  
Off-platform contact management. Source tracking: Instagram, Facebook, TikTok, WhatsApp, Referral, Existing Customer, Direct, Other. Fields: display_name, display_email, display_phone, source_detail, notes, linked_profile_id, is_archived. GDPR anonymisation capability. Pagination, search, source filter. Archive functionality.

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★☆☆☆☆ | Completely independent of marketplace activity |
| Business Management | ★★★★★ | Core CRM for vendor's entire customer base |
| Revenue Generation | ★★★★☆ | Organising leads → more follow-ups → more revenue |
| Customer Retention | ★★★★★ | Customer relationship history drives repeat business |
| Operational Efficiency | ★★★★★ | Replaces phone contacts, spreadsheets, notebooks |
| Competitive Advantage | ★★★★★ | No competing platform offers this |

**Current value:** Very high — and the most subscription-resilient feature on the platform. This feature is completely independent of marketplace traffic. A DJ who has 200 contacts from Instagram, WhatsApp, and referrals can manage all of them in ELBOLD. They have no reason to care whether ELBOLD sent them any enquiries this month — their contact history is in ELBOLD.

The off-platform CRM is the most important feature for the "pay even without marketplace enquiries" goal. Yet it is positioned as a minor feature under `/vendor/contacts` and not prominently marketed to vendors.

**Gap:** No contact tags/labels. No follow-up reminder scheduling. No email sending from within ELBOLD (only storing contacts, not communicating with them). No pipeline stages (lead → quoted → booked → completed → review requested). No bulk actions. No contact import (CSV upload from phone contacts).

---

#### CUSTOMER HISTORY
**Route:** `/vendor/customers` | **Component:** `CustomerListView`

**What it contains today:**  
Aggregated customer view from bookings and quotes. Per customer: full name, email, booking count, quote count, total spend, first contact date, last interaction date, latest booking status. Search by name/email. Pagination.

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★☆☆ | Shows ELBOLD customers, not all customers |
| Business Management | ★★★★☆ | Customer lifetime value tracking |
| Revenue Generation | ★★★★☆ | Identifying top customers drives repeat business |
| Customer Retention | ★★★★★ | Total spend visibility enables loyalty thinking |
| Operational Efficiency | ★★★★☆ | Replaces manual tracking |
| Competitive Advantage | ★★★★☆ | CLV data is rare in event professional tools |

**Current value:** Medium-high for active vendors, low for new vendors. Shows total spend per customer — this is customer lifetime value tracking that most freelance professionals never have.

**Gap:** ELBOLD customers only — does not include manual contacts. No merge of manual contacts with ELBOLD customers. No customer segmentation. No customer notes. No repeat booking triggers ("This customer booked last year — reach out about their anniversary").

---

#### MEDIA
**Route:** `/vendor/media` | **Component:** `VendorMediaManager`

**What it contains today:**  
Portfolio management: upload photos and videos. Cover photo selection. Sort ordering (drag and drop). Caption support. Alt text for accessibility. Moderation status tracking. Plan-limited: Free (5), Pro (20), Premium (50), Elite (unlimited).

**Value Classification:**

| Dimension | Rating | Assessment |
|---|---|---|
| Core Marketplace | ★★★★★ | Gallery is primary trust signal for customers |
| Business Management | ★★★★☆ | Organised portfolio is a business asset |
| Revenue Generation | ★★★★★ | High-quality gallery is the #1 factor in getting booked |
| Customer Retention | ★★★☆☆ | Returning customers review portfolio for consistency |
| Operational Efficiency | ★★★★☆ | Single portfolio location vs. scattered social media |
| Competitive Advantage | ★★★★★ | Moderated, verified gallery vs. self-curated social media |

**Current value:** Very high. The media gallery is the vendor's primary selling tool. A vendor with 20 professionally curated photos on their ELBOLD profile has a better portfolio page than most event professionals have on their own websites. Plan-based photo limits create a clear and genuine upgrade incentive — a vendor with 22 photos needs Pro.

**Gap:** No video hosting beyond upload (no transcoding, no previews). No before/after gallery type. No event-tagged media (photos from specific bookings). No watermarking. No media analytics (which photo gets the most attention).

---

#### DOCUMENTS AND CONTRACTS
**Status:** NOT BUILT

The codebase has no document management, contract generation, invoice creation, or proposal builder. References to "documents" in the codebase relate exclusively to verification documents (ID, insurance) submitted through the verification system.

**Opportunity value:** High. Event professionals need: booking contracts, payment terms, service agreements, and invoices. They currently use Word templates, FreshBooks, or paper. If ELBOLD provides template contracts and invoice generation, it creates significant operational dependency and daily use.

See Section 3 (Subscription Strategy) and Section 5 (Stickiness) for prioritisation.

---

### 1.3 Capability Value Summary

| Capability | Marketplace-Dependent | Business-Resilient | Stickiness |
|---|---|---|---|
| Vendor Profile | Medium | High | Medium |
| Public Vendor Page | High | **Very High** | **Very High** |
| Quotes/Leads | **Very High** | Low | Low |
| Bookings | **Very High** | Medium | Medium |
| Reviews | **Very High** | High | **Very High** |
| Messaging | High | Medium | Medium |
| Verification | Medium | **Very High** | **Very High** |
| Subscription | High | Low | Low |
| Service Packages | High | High | High |
| Availability Calendar | Medium | **Very High** | **Very High** |
| Payouts | **Very High** | Low | Medium |
| Dashboard | High | Medium | Medium |
| Analytics | High | **Very High** | High |
| Notifications | **Very High** | Medium | High |
| CRM (Contacts) | **None** | **Very High** | **Very High** |
| Customer History | Medium | High | High |
| Media Gallery | High | High | High |
| Documents/Contracts | None | **Very High** | **Very High** |

**Strategic insight from the audit:**

The capabilities with the highest business-resilient value and stickiness are:
1. Verification (permanent credential)
2. CRM / Direct Contacts (off-platform customer management)
3. Public Vendor Page (digital identity)
4. Availability Calendar (daily habit)
5. Analytics (business intelligence)
6. Reviews (permanent reputation asset)

These are the six pillars on which the subscription model should be rebuilt.

---

## SECTION 2 — VENDOR DAILY WORKFLOW

### 2.1 The Current Reality

A vendor opening ELBOLD today follows one of two patterns:

**Pattern A (Active vendor, recent bookings):**  
Login → Check dashboard for new booking requests → Check quotes for new leads → Check messages for customer questions → Update availability if needed → Close.  
*Time spent: 5-10 minutes. Daily habit forming.*

**Pattern B (New vendor, no bookings yet):**  
Login → See dashboard with all zeros → Feel like nothing is happening → Close.  
*Time spent: 30 seconds. No reason to return tomorrow.*

Pattern B describes most vendors in ELBOLD's current phase. It is the most critical UX problem to solve for retention.

### 2.2 The Ideal Daily Workflow

The goal is to make ELBOLD the **first application a vendor opens every morning**. This requires the platform to have something new, actionable, and valuable every single day — regardless of whether ELBOLD sent an enquiry.

**THE IDEAL MORNING WORKFLOW:**

```
OPEN ELBOLD
     │
     ▼
TODAY'S OVERVIEW (30 seconds)
─────────────────────────────
• Any new booking requests? (marketplace)
• Any new messages? (marketplace)
• Any dates blocked that need updating? (business management)
• Any follow-ups due today? (CRM)
• Any review responses needed? (reputation)
     │
     ▼
PRIORITIES (2 minutes)
─────────────────────────
• Respond to pending quotes (if any)
• Action booking requests (if any)
• Check CRM follow-up reminders
     │
     ▼
BUSINESS PULSE (2 minutes, 2-3x per week)
──────────────────────────────────────────
• Profile views this week vs. last week
• Lead funnel: quote requests → responses → conversions
• Revenue this month vs. target
• Next upcoming event reminder
     │
     ▼
GROWTH ACTIONS (5 minutes, weekly)
────────────────────────────────────
• Profile strength: one action to improve score
• Add new media if available
• Review seasonal demand — should I block Christmas early?
• Check if any contacts need follow-up
     │
     ▼
REPUTATION (5 minutes, when triggered)
───────────────────────────────────────
• Respond to any new reviews
• Request review from recently completed booking
     │
CLOSE
```

**Total time required:** 5-15 minutes per day for an active vendor.

### 2.3 What Creates the Daily Habit

The platforms that vendors check every morning have one thing in common: **they always have something new to show**.

Instagram: new likes, comments, followers.  
WhatsApp: new messages.  
Email: new messages.  
Bank app: balance update.

ELBOLD must create the equivalent. The three mechanisms:

**1. Activity that requires a response (reactive habit)**  
New quote requests, booking requests, customer messages. These create urgency. The vendor must respond or risk losing the enquiry. This is the strongest habit mechanism but entirely marketplace-dependent.

**2. Business tasks that benefit from daily discipline (scheduled habit)**  
CRM follow-up reminders, availability updates, review responses. These are calendar-driven. A vendor with 10 contacts in their CRM and follow-up dates set will open ELBOLD on specific days because they scheduled themselves to.

**3. Business intelligence that rewards curiosity (analytical habit)**  
Profile views going up. Seasonal demand previewing a busy period. A new analytics period unlocking. These create intrinsic motivation to check in. "My views are up 40% this week — is something driving this?"

**Priority action:** Create a "Daily Summary" notification (email or push) sent to vendors every morning, containing: new activity count, upcoming follow-ups due today, profile performance in the last 24 hours, and one personalised action recommendation ("You haven't added media in 30 days — add one photo today"). This single feature converts a passive vendor into a daily active user.

---

## SECTION 2.5 — VENDORS WHO ALREADY HAVE A SYSTEM (added 2026-07-10)

Every vendor ELBOLD recruits already runs their business somehow. Nobody arrives with nothing. The acquisition page and onboarding flow must speak directly to what each vendor is being asked to give up, keep, or consolidate — vaguely implying "ELBOLD is better" without naming the specific tool being displaced or complemented is a credibility gap, not a persuasion technique.

Grounded in `ELBOLD_MARKET_AND_COMPETITOR_RESEARCH.md` (2026-07-10) and the Section 1 capability audit above.

| Vendor already uses | ELBOLD's honest relationship to it | What to say |
|---|---|---|
| **A CRM (Dubsado, HoneyBook, 17hats)** | **Complements, does not yet replace.** These tools have contracts, e-signatures, and invoicing that ELBOLD does not (Section 1.2 "Documents and Contracts: NOT BUILT"). ELBOLD adds a public marketplace profile and verified reviews neither of them has. A vendor with an active Dubsado subscription has no commercial reason to cancel it for ELBOLD today. | "Keep your CRM for contracts and invoicing. Use ELBOLD for the marketplace profile, verified reviews, and off-platform contact tracking it doesn't do." Do not claim replacement until Contracts/Invoices ship (Section 1.2 gap). |
| **A booking/scheduling system (Square Appointments, Acuity)** | **Overlaps partially.** ELBOLD's availability calendar is real for the vendor's own view (Section 1.2) but not yet customer-facing (see Evidence Update #1). Do not claim ELBOLD replaces a scheduling tool a customer-facing business depends on until that gap closes. | "Your availability calendar lives in ELBOLD too — sync it as your second system for now, not your only one." |
| **A personal website** | **Replaces, credibly.** The public vendor page (Section 5) already out-features most self-built vendor websites: verified badges, structured reviews, JSON-LD SEO, booking CTA — assets a vendor cannot build alone without cost. This is the strongest "replace" claim ELBOLD can honestly make. | "Your ELBOLD page can be your only website. It already does more than most self-built ones." |
| **Social media (Instagram, Facebook, TikTok)** | **Complements, explicitly.** ELBOLD is not a content or follower platform (Constitution EDR-13, "no social mechanics") and should never claim to be. Social media builds audience; ELBOLD converts audience into verified bookings and reputation an Instagram grid cannot hold. | "Keep posting on Instagram. Put your ELBOLD link in the bio — that's where the follower becomes a booking with a paper trail." |
| **WhatsApp for enquiries** | **Consolidates, via the CRM.** WhatsApp itself is not replaced (nothing in ELBOLD sends or receives WhatsApp messages today — confirmed no such capability in the codebase). What ELBOLD does is stop those conversations from disappearing: the CRM's `source: "whatsapp"` field exists specifically to log a WhatsApp lead as a tracked contact with follow-up dates and history. | "Keep messaging on WhatsApp. Log the contact in ELBOLD so it doesn't disappear when the chat scrolls away." |
| **Spreadsheets / paper diaries** | **Replaces, credibly, for the specific job of tracking contacts.** This is the CRM's exact use case (Section 1.2, "the most subscription-resilient feature on the platform... completely independent of marketplace traffic"). No caveat needed here — this is ELBOLD's strongest, most evidence-backed claim in this table. | "This is the spreadsheet you were always going to lose. Except it doesn't get lost." |
| **Another marketplace (Bark, Poptop, Hitched)** | **Complements today, differentiates on integrity.** ELBOLD does not ask a vendor to leave another marketplace — multi-homing is normal in this market (confirmed across every competitor researched). The honest differentiator is what the other marketplace cannot offer: reviews that are structurally impossible to fake (booking-gated, per Constitution Principle 5/EDR-01) versus Bark/Thumbtack's pay-per-lead model, which the market research found to be the most reputationally damaged model in the category (1.2-1.8/5 aggregate vendor sentiment). | "List on both. ELBOLD's reviews can't be bought or faked — that's the one thing worth being on ELBOLD for even if you stay on the others." |

**The one honest limitation across this whole table:** ELBOLD cannot yet claim full consolidation for any vendor whose business runs on contracts and invoices (Section 1.2, "Documents and Contracts: NOT BUILT" — still true as of this update, see Section 3 subscription tiers below which name this as the Growth-tier build target). Until that ships, the correct positioning is "complement and start consolidating," not "replace everything." Overclaiming here is exactly the Commercial Honesty principle (Constitution Principle 11) this document set is built to protect.

---

## SECTION 3 — SUBSCRIPTION STRATEGY

### 3.1 The Strategic Problem with the Current Subscription

The current subscription model sells marketplace visibility:
- "Upgrade to Pro for more search ranking"
- "Get featured placement"
- "Increase your visibility"

This only has value when there are customers searching. In a marketplace at early-stage supply, this is: "pay more for visibility in a marketplace where few customers currently search." A rational vendor who receives zero ELBOLD enquiries in Month 1 will cancel their subscription at Month 2 regardless of their plan tier.

The subscription model must be rebuilt on a fundamentally different value proposition:

**Current:** "Pay us to be more visible to ELBOLD customers."  
**Target:** "Pay us because we run your business better than anything else available."

### 3.2 The Business-First Subscription Framework

The subscription tiers should be restructured around **business tool value**, not marketplace reach. Marketplace benefits are included but not lead-positioned.

#### ELBOLD STARTER — Free
*For event professionals who want a verified profile and basic marketplace access.*

**Daily value:** Your verified ELBOLD profile exists as your professional digital identity. Customers searching for your category in your area can find you.

**Weekly value:** Access your booking requests and messages. Basic profile analytics.

**Monthly value:** Your profile maintains its position in search results. You can see how many people viewed your profile.

**What's included:**
- Verified public profile at `elbold.com/vendors/your-name`
- 5 portfolio photos
- 1 service package
- Availability calendar
- Customer messaging
- Basic analytics (monthly views, quote count)
- ELBOLD Verified badge (Level 1)
- Direct contacts CRM (up to 25 contacts)

**What's not included:** Advanced analytics, CRM beyond 25 contacts, media library beyond 5 photos, unlimited packages, document tools, calendar sync, priority ranking.

---

#### ELBOLD PROFESSIONAL — £49/month (or £39/month annual)
*For event professionals who are building a business, not just taking bookings.*

**Daily value:** Your CRM shows who to follow up today. Your availability is live. Your analytics tell you what's working.

**Weekly value:** Full analytics dashboard with lead funnel, revenue trends, and seasonal demand. Review management with response tools.

**Monthly value:** Your business record is complete. You know your revenue, your conversion rate, your best-performing packages, and your seasonal patterns.

**What's included (everything in Starter, plus):**
- 30 portfolio photos (up from 5)
- Unlimited service packages
- Full analytics dashboard (all metrics, all periods, MoM comparison)
- Direct contacts CRM: unlimited contacts with follow-up reminders
- Seasonal demand forecasting
- Lead funnel analytics
- Revenue trend reporting
- Payout history and annual earnings summary
- Search ranking boost (+3)
- Priority messaging (responses ranked higher in customer inbox)
- Profile strength coaching (personalised recommendations)
- `"Professional"` badge on profile

**The value case:** ELBOLD Professional replaces: Calendly/booking management (£12/month), basic CRM like Notion or Airtable (£15/month), basic analytics (Google Analytics setup, £0 but hours of work). Total replacement value: £27+/month. ELBOLD Professional at £49 is asking vendors to pay £22/month for the marketplace access, verified profile, and all other tools. That is a defensible price point.

---

#### ELBOLD GROWTH — £89/month (or £69/month annual)
*For event professionals actively growing their business beyond ELBOLD.*

**Daily value:** Document tools help you run every booking professionally. CRM pipeline stages show exactly where each prospect is. Payment requests sent from ELBOLD keep your cash flow visible.

**Weekly value:** Proposal and invoice tools. Follow-up sequences. Performance benchmarks versus your category.

**Monthly value:** Your full business finances are trackable. Category ranking visibility. Growth recommendations based on your performance data.

**What's included (everything in Professional, plus):**
- 75 portfolio photos
- Off-platform payment request links (send a payment request to any customer, collect through ELBOLD Stripe, vendor keeps 97% — ELBOLD takes 3% for payment processing)
- Booking contract templates (standard event professional contracts, pre-written, customisable)
- Invoice generation (PDF branded invoices for off-platform jobs)
- CRM pipeline stages (Lead → Quoted → Booked → Completed → Review Requested)
- Follow-up sequence reminders
- Category performance benchmarks ("Your conversion rate is X vs. average Y in your category")
- Google Calendar sync
- Search ranking boost (+6)
- Category featured placement (when available)
- `"Growth"` badge on profile

**The value case:** ELBOLD Growth replaces: FreshBooks/QuickBooks basic invoice tool (£15-30/month), contract management tool (£20-40/month), calendar sync setup. The off-platform payment links create a genuine revenue share model — ELBOLD earns from every payment a vendor processes, regardless of whether it originated from ELBOLD marketplace.

**This tier is the business-changing subscription tier.** A vendor who processes £3,000/month through ELBOLD payment links earns ELBOLD £90/month in addition to the £89 subscription — £179 total monthly revenue per vendor at this level.

---

#### ELBOLD ENTERPRISE — £149/month (or £119/month annual)
*For established event professionals and agencies treating their business seriously.*

**Daily value:** Comprehensive business management. Multiple team members. Client portal access for customers to track bookings.

**Weekly value:** Business performance report. Revenue forecast. Market positioning analysis.

**Monthly value:** Complete business intelligence. Compliance tools. Priority support.

**What's included (everything in Growth, plus):**
- Unlimited portfolio media
- Team member access (up to 3 team accounts)
- Client-facing booking tracker (a customer portal link per booking)
- Advanced business intelligence report (monthly auto-generated PDF)
- Custom branding on invoices and contracts (your logo, your colours)
- Revenue forecasting based on seasonal demand
- Search ranking boost (+10)
- Homepage featured placement (when available)
- Priority support (same-day response)
- `"Enterprise"` badge on profile
- Dedicated account manager (manual, founder-level at current scale)

**The value case:** This tier targets event planning agencies, large caterers, and established photographers — not freelancers. At 20 Enterprise vendors, ELBOLD earns £2,980/month in subscription alone, before any commission.

---

### 3.3 The Subscription Communication Rewrite

The subscription page copy must change from marketplace language to business language.

**Current messaging (paraphrased):**  
"Upgrade to get more visibility. Get featured. Get found faster."

**Target messaging:**  
"Run your event business professionally. Get paid reliably. Keep your clients coming back."

The featured placement and ranking boost should be presented as **bonuses**, not the primary selling point. The primary selling point is: "This is the professional toolkit your business needs to operate."

---

## SECTION 4 — VENDOR STICKINESS

### 4.1 Current Stickiness Score

**Overall: 4 / 10**

The platform has low stickiness because it has not yet accumulated the conditions that create stickiness: booking history, customer relationships, review reputation, and financial records. At current vendor count and activity level, most vendors could leave ELBOLD without losing anything they couldn't recreate elsewhere in 30 minutes.

### 4.2 Stickiness by Capability

| Capability | Current Stickiness | Potential Stickiness |
|---|---|---|
| Verified reviews | ★★★★☆ | ★★★★★ (with volume) |
| Verification credential | ★★★★☆ | ★★★★★ (with expiry tracking) |
| CRM contacts | ★★☆☆☆ | ★★★★★ (with follow-up sequences) |
| Booking history | ★★★★☆ | ★★★★★ (with financial records) |
| Public vendor page | ★★★☆☆ | ★★★★★ (as digital identity) |
| Availability calendar | ★★★☆☆ | ★★★★★ (with calendar sync) |
| Analytics | ★★★☆☆ | ★★★★★ (with year-over-year history) |
| Payment history | ★★★☆☆ | ★★★★★ (with off-platform payments) |
| Package catalogue | ★★★★☆ | ★★★★★ (with proposal/contract tools) |
| Subscription plan | ★★☆☆☆ | ★★★★☆ (with founding lock-in) |

### 4.3 The Stickiness Ladder

There are distinct levels of vendor platform dependency. ELBOLD must move vendors up this ladder deliberately:

**Level 1 — Passive (stickiness: 1/10)**  
Vendor has a profile. No bookings. No activity. They haven't logged in for 3 weeks.  
*What makes them stay: nothing. They will churn unless contacted.*

**Level 2 — Active Marketplace (stickiness: 4/10)**  
Vendor has 1-3 ELBOLD bookings. They check the platform when they get a notification.  
*What makes them stay: pending bookings they need to manage.*

**Level 3 — Business Tool User (stickiness: 6/10)**  
Vendor uses ELBOLD CRM, updates availability regularly, reviews analytics monthly.  
*What makes them stay: their business data is in ELBOLD. Leaving means losing their contact history.*

**Level 4 — Financial Integration (stickiness: 8/10)**  
Vendor processes off-platform payments through ELBOLD. Issues invoices through ELBOLD.  
*What makes them stay: ELBOLD is in their financial workflow. Leaving disrupts their billing.*

**Level 5 — Digital Identity (stickiness: 9/10)**  
Vendor's ELBOLD URL is on their business card, Instagram bio, Google profile, and WhatsApp.  
*What makes them stay: the URL IS their business identity. Leaving means losing their professional online presence.*

**Level 6 — Enterprise Dependency (stickiness: 10/10)**  
Vendor uses ELBOLD for team management, client portals, contracts, invoices, and payments. Their annual business reports are generated by ELBOLD.  
*What makes them stay: the platform is operationally irreplaceable.*

### 4.4 Stickiness-Building Priorities

The three highest-impact stickiness improvements, in order:

**Priority 1: Public Vendor Page as Digital Identity**  
Make the ELBOLD vendor URL the vendor's primary online destination. When vendors promote `elbold.com/vendors/their-name` publicly, they are promoting ELBOLD by default, and they cannot leave without losing a URL they've shared with hundreds of customers. See Section 6 for full recommendations.

**Priority 2: Off-Platform Payment Processing**  
A vendor who collects £2,000 through ELBOLD payment links in a month has their financial workflow integrated with the platform. ELBOLD's 3% processing fee on this is £60 — and the vendor cannot easily move to a different tool without setting up a new payment infrastructure. Financial integration is the highest-stickiness feature available.

**Priority 3: Year-Over-Year Analytics History**  
A vendor who has 12 months of ELBOLD analytics cannot recreate that history elsewhere. Their seasonal demand patterns, revenue trends, and conversion rate history live in ELBOLD. Leaving means starting over analytically. This stickiness compounds over time: after 2 years of data, the vendor has a proprietary business intelligence asset they've built inside ELBOLD.

---

## SECTION 5 — PUBLIC VENDOR PAGES

### 5.1 Current State

The public vendor page at `elbold.com/vendors/[slug]` is currently built as a marketplace listing. Its purpose, as designed, is to convert a browsing customer into a quote request. The page contains: gallery, bio, packages, reviews, verification badges, quote CTA, similar vendors.

The page already has:
- **Schema.org JSON-LD** (`LocalBusiness` type with `AggregateRating`, `PostalAddress`, pricing range, phone)
- **Dynamic OG images** (vendor cover photo used for social sharing previews)
- **Permanent canonical URL** with slug history redirect
- **Profile view tracking** via `ProfileViewTracker` component
- **Quality gate** (score < 50 → 404, prevents weak profiles from appearing)

### 5.2 Strategic Value Assessment

The vendor page has the potential to become the most commercially important page ELBOLD owns — more important than the homepage.

Here is why: **every vendor who shares their ELBOLD URL is doing unpaid marketing for the platform.**

A photographer with 2,000 Instagram followers who puts `elbold.com/vendors/sarah-chen-photography` in their bio exposes ELBOLD to those 2,000 followers every day. Of those, some will be planning events. When they visit the page to check Sarah's availability, they see the ELBOLD trust signals, the booking protection language, and the similar vendors section. Some will come back to ELBOLD for their next event — without a photographer they follow.

The vendor page is a dual-purpose asset:  
1. A vendor conversion tool (getting customers to enquire)  
2. An ELBOLD discovery tool (exposing the platform to the vendor's existing audience)

### 5.3 Recommended Improvements

**A — Make it the vendor's personal website replacement**

The page should be feature-complete as a standalone professional website. Add:
- Social media links displayed prominently (fields exist in vendor table, not currently displayed)
- Contact button (separate from the platform quote flow — a direct WhatsApp link or email link for vendors who want off-platform enquiries)
- Dedicated "About" section with years of experience, service areas, and languages spoken
- Testimonials from off-platform clients (not ELBOLD-verified but listed separately — "from satisfied clients, unverified")
- FAQ section (vendor adds their own Q&A to address common customer questions)

**B — Add QR code generation**

On the vendor dashboard, surface a "Share My Profile" section with:
- A downloadable QR code that resolves to their ELBOLD URL
- A "Copy my profile link" button
- Template social media caption ("Book me for your next event — fully verified")
- PDF brochure download (auto-generated from profile data: name, photo, category, packages, verification level, contact)

The QR code that a vendor puts on their business card is a permanent stake in ELBOLD's visibility. Once printed on 500 business cards, the vendor cannot easily replace it.

**C — Google Business companion**

Add a "Connect to Google My Business" prompt on the dashboard. When connected:
- Keep ELBOLD profile and Google Business profile in sync
- Display ELBOLD review count on the Google Business description
- Use ELBOLD verification as a Google Business trust signal

**D — SEO enhancement**

The JSON-LD is already in place. Additional improvements:
- Add `Event` schema to bookings that have been completed (makes individual events appear in Google search for event types in that location)
- Add `Review` schema to individual reviews (not just aggregate)
- Create dedicated landing pages for category+city combinations (`elbold.com/photographers/london`, `elbold.com/djs/essex`) that are properly indexed and link to vendor profiles

**E — Quote landing page mode**

Allow vendors to share a specific "get a quote" link that pre-fills their name and opens a streamlined quote request form. This bypasses the full ELBOLD browse experience — customers land directly on the quote flow without needing to discover the vendor. Shareable via WhatsApp, Instagram, or email.

**F — Shareable digital brochure**

Auto-generate a PDF brochure from the vendor's ELBOLD profile: their photo, bio, key packages, verification badges, review excerpt, and contact information. Vendors can download it and send it to potential clients via any channel. Every page of the brochure contains: `Learn more at elbold.com/vendors/their-name`.

---

## SECTION 6 — MASTER GROWTH OS RELATIONSHIP

The relationship between Master Growth OS and ELBOLD is deliberately and correctly separated. This section confirms the intended architecture and defines the boundaries.

```
MASTER GROWTH OS
(Internal Founder Operating Platform)
         │
         ▼ Vendor Discovery
    network_entities
    waitlist_contacts
    outreach_contacts
         │
         ▼ Outreach
    Relationship Journey Engine
    12-stage journey pipeline
         │
         ▼ Conversion
    VENDOR APPLIES TO ELBOLD
    /founding-vendors → /vendor/apply
         │
         ▼ ELBOLD RECEIVES
    vendors.status = 'pending'
    Admin approves → 'approved'
         │
         ▼ Vendor Onboards
    Profile → Media → Packages → Verification
         │
         ▼ Vendor Operates
    Bookings → Payments → Reviews
         │
         ▼ Business Growth
    Analytics → CRM → Subscriptions
         │
         ▼ Retention
    Daily habit → Financial integration → Digital identity
```

**Master Growth OS must never appear in any ELBOLD user-facing experience.** No vendor should ever see a reference to Master Growth OS, a vendor lead ID, or any internal pipeline data. These are separate systems with no visible integration point.

**Data flows in one direction only:** Master Growth OS discovers vendors → vendors apply to ELBOLD → ELBOLD manages vendors independently. No ELBOLD vendor data (financial, booking, or customer data) should ever flow to Master Growth OS.

**The correct integration point (when built):** A webhook or event when a vendor's ELBOLD status changes from `pending` to `approved`. This event should update the vendor's record in Master Growth OS (`waitlist_contacts.stage = 'approved'`) so the Founder Pilot can track conversion from outreach to active vendor. This integration should be backend-only, invisible to both the vendor and to customers.

---

*Document continues in ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md*
