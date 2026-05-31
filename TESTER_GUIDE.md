# ELBOLD — Tester Guide (Beta)

Welcome to the ELBOLD beta test! This guide gives you everything you need to explore the platform thoroughly and provide meaningful feedback.

---

## Test Accounts

All accounts use the same password: **`ElboldDemo2026!`**

### Customer Accounts
| Name | Email | Use For |
|------|-------|---------|
| Emily Carter | emily.carter@elbold.demo | Wedding planning, multi-vendor booking |
| Oliver Webb | oliver.webb@elbold.demo | Birthday party, DJ + decor bookings |
| Priya Singh | priya.singh@elbold.demo | Baby shower, quote flow |

### Vendor Accounts
| Name | Email | Business | Category |
|------|-------|----------|----------|
| James Bennett | james.bennett@elbold.demo | Bennett Visuals | Photographer |
| Sofia Martinez | sofia.martinez@elbold.demo | Sofia Blooms | Florist/Decorator |
| Ravi Patel | ravi.patel@elbold.demo | Spice & Grace Catering | Caterer |
| Charlotte Hughes | charlotte.hughes@elbold.demo | Charlotte DJ Services | DJ |
| Marcus Thompson | marcus.thompson@elbold.demo | Marcus Events Decor | Decorator |
| Aisha Okafor | aisha.okafor@elbold.demo | Aisha Films | Videographer |
| Daniel Walsh | daniel.walsh@elbold.demo | The Prestige Band | Live Band |
| Grace Chen | grace.chen@elbold.demo | Glow by Grace | Makeup Artist |
| Theo Harrington | theo.harrington@elbold.demo | Theo's Couture Cakes | Cake Maker |
| Fatima Ahmed | fatima.ahmed@elbold.demo | Fatima Hosts | MC / Host |
| Jake Morrison | jake.morrison@elbold.demo | Canvas & Canopy | Marquee Hire |
| Natalie Russo | natalie.russo@elbold.demo | Neon Nights Events | Lighting & Stage |
| Ben Osei | ben.osei@elbold.demo | Pop & Bloom | Balloon Decorator |
| Isabelle Martin | isabelle.martin@elbold.demo | Premier Arrivals | Transport |
| Chris Obi | chris.obi@elbold.demo | ProStaff Yorkshire | Event Staff |

### Admin Account
> Create via Supabase dashboard: set `role = 'admin'` in the profiles table, or use the create-demo-users API endpoint with the secret `BOLD_PARTY_DEMO_2026`.

---

## Customer Flow — What to Test

### 1. Sign Up & Onboarding
- [ ] Sign up as a new customer at `/signup`
- [ ] Verify email confirmation (if email is configured)
- [ ] Land on the customer dashboard
- [ ] See the Smart Tips Widget with a daily planning tip
- [ ] Smart Concierge appears in bottom-right corner

### 2. Smart Event Planner (Most Important Flow)
- [ ] Click "Plan Event" or navigate to `/dashboard/events/new`
- [ ] **Step 1**: Select event type — notice the mood banner changes dynamically
- [ ] Enter an event title (e.g. "Sophie's 21st Birthday")
- [ ] **Step 2**: Enter date, time, city (try "London"), and venue setting
- [ ] **Step 3**: Set guest count (try 80) and budget (try £3,500)
- [ ] **Step 4**: Select vendor categories — pick DJ, Photographer, Decoration
- [ ] **Step 5**: Watch the animated Smart Plan build — check loading steps and final plan
- [ ] Click "Create & Send Quotes" — should create event AND auto-send quote requests
- [ ] Land on the event detail page — check progress, countdown, checklist

### 3. Marketplace Browsing
- [ ] Browse `/browse` — should see 15+ vendors
- [ ] Filter by category (DJ, Photographer, etc.)
- [ ] Filter by city (try "London")
- [ ] Use budget range filter
- [ ] Click "Verified only" toggle
- [ ] Click a vendor card — go to vendor profile page
- [ ] Check vendor badges, social feed, event highlights
- [ ] Check the Booking Protection card in the sidebar
- [ ] Use the "Request Free Quote" button

### 4. Quote / RFQ Flow
- [ ] Go to `/dashboard/quotes` — see any auto-sent quotes
- [ ] Notice "New Response" badge on responded quotes
- [ ] Click a quote to see the full detail view
- [ ] If status = "responded": accept and create a booking
- [ ] Check the quote timeline (Sent → Responded → Booked)
- [ ] Check expiry countdown if a quote is about to expire

### 5. Guest & Invitation System
- [ ] Go to an event → Guests tab
- [ ] Add 3+ guests with email, VIP tag, meal preference
- [ ] Check RSVP status tracking
- [ ] Go to Invitations tab
- [ ] Create a digital invitation using a template
- [ ] Copy the RSVP link and open it in a private browser
- [ ] Submit an RSVP response (accept with meal preference)
- [ ] Return and see RSVP count updated

### 6. Messaging
- [ ] Go to `/dashboard/messages`
- [ ] Find a conversation with a vendor
- [ ] Send a message and check it appears
- [ ] Check unread badge counts

### 7. Notifications
- [ ] Go to `/dashboard/notifications`
- [ ] Check notification types and read/unread states
- [ ] Mark all as read

### 8. Saved Vendors
- [ ] Browse to a vendor profile
- [ ] Click the heart icon to save the vendor
- [ ] Go to `/dashboard/saved` — confirm vendor appears

---

## Vendor Flow — What to Test

### 1. Vendor Dashboard
- [ ] Sign in as a vendor (e.g. james.bennett@elbold.demo)
- [ ] Check the dashboard stats: profile views, pending quotes, revenue
- [ ] Check profile completion percentage
- [ ] Navigate using the vendor sidebar

### 2. Leads / Quote Management
- [ ] Go to `/vendor/quotes` — check for pending quote requests
- [ ] Notice lead score badges (Hot / Good / Lead)
- [ ] Open a lead and respond with a price + message
- [ ] Check expiry badge for urgency
- [ ] Go back — the lead should show as "Responded"

### 3. Bookings
- [ ] Go to `/vendor/bookings` — check status of bookings
- [ ] Open a booking detail
- [ ] Check deposit status, total amount, customer notes

### 4. Profile & Media
- [ ] Go to `/vendor/profile` — edit bio, tagline, event types
- [ ] Go to `/vendor/media` — upload or manage photos
- [ ] Check masonry gallery display

### 5. Services & Packages
- [ ] Go to `/vendor/services`
- [ ] Add a new service package with price and includes list
- [ ] Check that changes appear on your public vendor profile

### 6. Availability Calendar
- [ ] Go to `/vendor/availability`
- [ ] Block a date with a reason
- [ ] Confirm blocked date shows correctly

### 7. Analytics
- [ ] Go to `/vendor/analytics`
- [ ] Check views, bookings, and revenue charts
- [ ] Change the period (7 days, 30 days, 90 days)

### 8. Subscription Plans
- [ ] Go to `/vendor/subscription`
- [ ] Review Free / Pro / Featured plan comparison
- [ ] Note Stripe integration (don't complete payment in demo)

---

## Admin Flow — What to Test

### 1. Admin Dashboard
- [ ] Sign in as admin and navigate to `/admin`
- [ ] Check overview stats

### 2. Vendor Management
- [ ] Go to `/admin/vendors`
- [ ] Search for a vendor by name
- [ ] Click to view/edit vendor details
- [ ] Try approving or suspending a vendor

### 3. Customer Management
- [ ] Go to `/admin/customers`
- [ ] Search for a customer
- [ ] View their events and bookings

### 4. Verification Workflow
- [ ] Go to `/admin/verifications`
- [ ] Review a pending vendor verification
- [ ] Approve or reject with a note

### 5. Bookings & Payouts
- [ ] Go to `/admin/bookings` — filter by status
- [ ] Go to `/admin/payouts` — check payout queue

### 6. Analytics
- [ ] Go to `/admin/analytics`
- [ ] Check platform-wide revenue and booking trends

---

## Features to Test for Mobile

Test ALL of the above on a mobile device or using browser DevTools (375px width — iPhone):

- [ ] Home page hero and category grid
- [ ] Vendor marketplace filtering and card layout
- [ ] Smart Event Planner wizard (mood banner, step flow, loading)
- [ ] Vendor profile page (media gallery, mobile CTA bar, social feed)
- [ ] Quote list with urgency badges
- [ ] Quote detail view timeline
- [ ] Guest list on mobile
- [ ] Mobile bottom navigation (customer vs vendor tabs)
- [ ] Smart Concierge chat widget
- [ ] Notification centre

---

## Smart Concierge — What to Test

The floating chat widget (bottom right corner) is an AI event planning assistant.

- [ ] Open the concierge and ask: "What vendors do I need for a wedding for 100 people?"
- [ ] Ask: "Help me plan a 21st birthday party in London on a £2000 budget"
- [ ] Ask: "What's a good timeline for an outdoor garden party?"
- [ ] Minimise and reopen — chat history should persist
- [ ] Check that it knows the event context (if opened from an event page)

---

## Known Beta Limitations

- **Stripe payments**: Live payments are not active in demo. Clicking "Pay Deposit" will go to Stripe test mode — do not enter real card details. Use Stripe test card: `4242 4242 4242 4242` with any future date and CVC.
- **Email notifications**: Transactional emails (booking confirmations, quote alerts) require Resend API key to be configured. May not arrive in demo unless configured.
- **Vendor media uploads**: Image uploads go to Supabase Storage. In demo, you can browse and save but actual file uploads may require Storage bucket permissions.
- **AI responses**: Smart Planner and Smart Concierge require an OpenAI API key. In demo without the key, plan generation will show a friendly error — the event can still be created.
- **Phone numbers**: All demo vendor phone numbers are fake (07700 9000xx format).
- **Instagram links**: Demo Instagram URLs are placeholders and don't point to real profiles.

---

## What We Most Want Feedback On

Please note your honest reaction to each of these:

1. **First impression**: When you land on the home page, does it feel trustworthy and premium?
2. **Smart Planner**: Did the wizard feel magical and easy, or form-heavy and complicated?
3. **Vendor profiles**: Do the profiles feel real and credible? Are reviews convincing?
4. **Quote flow**: Was it clear what happens after requesting a quote? Did you feel in control?
5. **Mobile experience**: Did any pages feel cramped, broken, or hard to use on phone?
6. **Trust signals**: Did you feel safe enough to "book" a vendor? What was missing?
7. **Vendor perspective**: (As a vendor) Would you trust this platform to manage your leads?
8. **Overall feel**: Premium marketplace, or early startup product?

---

## How to Submit Feedback

Please use the following format when reporting issues:

```
Page: /dashboard/events/new
Device: iPhone 14 / Chrome Mobile
Issue: Step 3 budget slider overflows on small screens
Severity: Medium
Screenshot: [attach if possible]
```

Share feedback in the designated Slack channel or Google Form provided by the team.

---

## Security Reminders

- These are test accounts — do not use real personal data
- Do not share your test credentials publicly
- Report any security concerns privately to the team lead immediately

---

*ELBOLD Beta — Tester Guide v1.0 — Last updated: May 2026*
