# ELBOLD Vendor Acquisition System

## Overview

The Vendor Acquisition System is ELBOLD's internal operating system for growing from 5 to 100 approved vendors across London, Kent and Essex. It is a curated pipeline: the founder researches, scores, and contacts real vendors - and approves each one manually. No auto-registration, no spam, no fake vendors.

---

## Architecture

### Database

**Table: `vendor_leads`** (migration 042 + 043)

Stores all researched vendor candidates before they register on ELBOLD. Separate from the `vendors` table, which holds registered users only.

| Column | Type | Purpose |
|---|---|---|
| id | uuid | Primary key |
| business_name | text | Vendor name |
| category | text | Service category |
| location, city, region | text | Geographic targeting |
| website, instagram, facebook | text | Online presence |
| email, phone | text | Contact channels |
| google_maps_url | text | Maps listing |
| source | text | Where the lead came from |
| rating, review_count | numeric | Quality signals |
| follower_count | integer | Social reach |
| lead_score | integer | 0-100 automated score |
| priority | text | high / medium / low |
| status | text | Pipeline stage (13 values) |
| notes | text | Founder contact notes |
| objections | text | Phase 1J - what they said no to |
| interest_level | text | Phase 1J - high/medium/low/unknown |
| contact_outcome | text | Phase 1J - what happened on each contact |
| last_contacted_at | timestamptz | Date of last outreach |
| next_follow_up_at | timestamptz | Scheduled follow-up |
| created_at, updated_at | timestamptz | Audit trail |

**Status pipeline (13 values):**
new -> researched -> approved_for_outreach -> outreach_sent -> follow_up_due -> responded -> interested -> registered -> verified -> approved -> active -> rejected / not_suitable

### Scoring Engine

**File:** `lib/vendor-acquisition/scoring.ts`

Automated lead quality score (0-100):

| Signal | Points |
|---|---|
| Location in London/Kent/Essex | 20 |
| Category in ELBOLD target list | 20 |
| Email present | 15 |
| Website present | 10 |
| Instagram or Facebook present | 10 |
| Phone present | 10 |
| Google rating 4.0+ | 10 |
| Review count 20+ | 5 |

Priority thresholds:
- High: 75-100
- Medium: 45-74
- Low: 0-44

Score recalculates automatically on every edit.

### Outreach Engine

**File:** `lib/vendor-acquisition/outreach.ts`

Uses gpt-4o-mini to generate 5 personalised outreach messages per vendor:
1. First contact email (150-200 words, subject line included)
2. Instagram DM (under 80 words, no links)
3. Facebook message (under 100 words)
4. Follow-up email (80-120 words, gentle)
5. Phone script (under 150 words, natural spoken language)

Positioning rules (enforced in prompt):
- Never claim "UK's leading marketplace"
- Never claim "thousands of customers"
- Never promise bookings or income
- Always be founder-led and personal
- Always mention payment protection via Stripe

---

## Pages

### /admin/vendor-growth - Daily Acquisition Dashboard

Server component. Shows:
- Acquisition metrics from vendor_leads (new today / researched / contacted / follow-ups due / interested / registered / approved)
- Daily targets: 10 leads / 5 outreach / 2 follow-ups
- Weekly targets: 50 leads / 25 outreach / 5 interested / 2 approved
- Acquisition funnel (from both vendor_leads and vendors tables)
- Category coverage vs targets
- Location breakdown by region

### /admin/vendor-acquisition - Lead CRM

Client component. The primary data entry and research tool:
- Full table of all vendor leads with sort/filter
- Add lead form (manual entry)
- Edit lead form with all Phase 1J fields (interest level, contact outcome, objections)
- CSV import with duplicate detection
- Inline outreach message generator
- Status quick-update buttons
- Follow-up date scheduler
- Score bar for every lead

### /admin/vendor-pipeline - Pipeline Kanban Board

Client component. Drag-and-drop Kanban across all 10 pipeline stages:
NEW -> RESEARCHED -> APPROVED FOR OUTREACH -> CONTACTED -> RESPONDED -> INTERESTED -> REGISTERED -> VERIFIED -> APPROVED -> ACTIVE

Cards show: business name, category, location, lead score, priority dot. Drag to move, status updates immediately via PATCH API. Off-pipeline statuses (rejected, not_suitable, follow_up_due) are hidden.

### /admin/vendor-outreach - Outreach Queue

Client component. Shows only leads in actionable outreach stages (approved_for_outreach, outreach_sent, follow_up_due, responded). Sorted: overdue follow-ups first.

Per lead card:
- Generate outreach messages (5 types, tabbed)
- Copy individual message
- Mark outreach sent (timestamped)
- Set follow-up due
- Mark responded
- Record contact outcome, interest level, notes
- Save founder intelligence fields

Compliance reminder shown on every load: manual review required, no auto-sending, public details only.

### /admin/vendor-coverage - Coverage Map

Server component. Shows coverage gaps for marketplace balance:

Category coverage table: Target / Approved / Pipeline / Gap / % bar
Geography coverage cards: London / Kent / Essex with Target / Approved / Pipeline / Gap

Priority actions panel: lists top 5 categories and locations most in need of leads.

### /admin/vendor-activation - Vendor Activation Tracker

Server component. Tracks registered vendors through 8 activation stages:
S1: Application submitted
S2: Verification completed (level 2+)
S3: Approved (status = approved)
S4: Profile completed (bio 50+ chars + phone + city)
S5: Media uploaded (1+ photo/video)
S6: Services added (1+ package)
S7: First quote received
S8: First booking received

Shows per-vendor progress, days waiting, bottlenecks. Success = approved vendor receiving a quote within 30 days.

---

## API Routes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/admin/vendor-leads | Fetch leads with filters |
| POST | /api/admin/vendor-leads | Create lead (auto-scores) |
| PATCH | /api/admin/vendor-leads/[id] | Update lead (rescores if needed) |
| DELETE | /api/admin/vendor-leads/[id] | Remove lead |
| POST | /api/admin/vendor-leads/outreach | Generate outreach messages (OpenAI) |
| POST | /api/admin/vendor-leads/import | CSV bulk import with deduplication |

All routes require admin authentication (ADMIN_EMAILS env var).

---

## Founder Daily Routine

**Every morning (20-30 minutes):**

1. Open `/admin/vendor-growth` - check daily metrics and target progress
2. Open `/admin/vendor-coverage` - identify the biggest category/location gaps
3. Research 10 leads that fit gaps, add to `/admin/vendor-acquisition`
4. Open `/admin/vendor-outreach` - check follow-up queue for overdue items
5. Generate outreach messages for approved_for_outreach leads
6. Review and personalise each message before sending
7. Send manually (email/Instagram/Facebook/WhatsApp/phone)
8. Mark as sent and set follow-up date

**Every week:**
- Review `/admin/vendor-growth` weekly targets
- Check `/admin/vendor-pipeline` for stuck leads
- Review `/admin/vendor-activation` for approved vendors not yet active
- Note objections and interest patterns from contact_outcome fields

---

## Compliance Rules

This system handles publicly available business information only.

**Permitted:**
- Public business websites
- Public social media profiles
- Public Google Business listings
- Public contact details on business websites

**Not permitted:**
- Scraping private Facebook groups
- Harvesting emails from non-public sources
- Bypassing platform anti-scraping protections
- Sending bulk automated messages to personal profiles
- Messaging private individuals (only business accounts)

**Legal basis (UK GDPR / PECR):**
- Data is legitimate interest for B2B contact
- Publicly available business information
- Business email / business social profiles
- All outreach is manually reviewed and sent one-by-one
- Vendors can request removal from the pipeline at any time

---

## Outreach Rules

The system generates messages but the founder must:
1. Read every message before sending
2. Personalise where possible (reference their specific work, city, or reviews)
3. Send from a personal or business account (not a bulk sender)
4. Never send the same message to the same vendor twice
5. Respect no-contact responses immediately
6. Remove from pipeline anyone who explicitly declines

ELBOLD's positioning in all outreach:
- "ELBOLD is building a carefully selected network of event professionals across London, Kent and Essex."
- Founder-led: messages come from the founder, not a corporate platform
- Trust-first: verify every vendor, protect payments, curate quality
- Honest about early stage: "we are growing and we want quality over quantity"

---

## Activation Process

Once a vendor registers via `/vendor/apply`:

1. Founder reviews application in `/admin/vendors`
2. Check vendor has at least 1 package before approving
3. Approve in admin panel
4. Vendor receives approval email (Resend)
5. Vendor completes profile in `/vendor/dashboard`
6. Track progress in `/admin/vendor-activation`
7. Follow up personally if vendor is stuck at any stage for 3+ days

Target: every approved vendor receives their first quote within 30 days of approval.

---

## Coverage Targets

### Categories

| Category | Target vendors |
|---|---|
| DJ | 10 |
| Photographer | 10 |
| Decorator | 8 |
| Caterer | 8 |
| Venue | 5 |
| Event Planner | 5 |
| Cake Maker | 5 |
| Balloon Decorator | 5 |
| Videographer | 5 |
| Live Band | 5 |
| MC / Host | 5 |

### Locations

| Location | Target vendors |
|---|---|
| London | 20 |
| Kent | 15 |
| Essex | 15 |

---

## Growth Milestones

| Milestone | Vendors | Action |
|---|---|---|
| Launch | 5 | First real quotes and bookings |
| Phase 1 | 20 | Prove marketplace works in all 3 regions |
| Phase 2 | 50 | Launch Freeze unlock gate |
| Phase 3 | 100 | Full market coverage |

The Launch Freeze gate requires all 4 conditions: 20 approved vendors, 20 quote requests, 10 completed bookings, first payout completed.
