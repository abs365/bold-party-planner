# Vendor Journey Map — ELBOLD Beta

**Version:** 1.0  
**Date:** 2026-06-03  
**Scope:** Beta phase — founding vendor onboarding

---

## Overview

A vendor is a UK event professional (photographer, DJ, caterer, decorator, etc.) who lists their services on ELBOLD, receives quote requests from customers, and converts them into paid bookings.

---

## Stage 1 — Discovery and Decision

```
Entry points
    │
    ├── Direct outreach (WhatsApp, Instagram DM, Email from pilot pack)
    ├── /founding-vendors page
    ├── /vendor/apply direct link
    └── Homepage: "List Your Services Free" CTA
```

**What the vendor sees on `/founding-vendors`:**
- Founding Vendor positioning (early, exclusive)
- Benefits: visibility, enquiries, verified reviews, Stripe payments
- Application CTA → `/vendor/apply`

**Emotional state:** Interested but sceptical. "Is this worth my time?"

**Key objection handled:** "Free to list. No commission on your first bookings during pilot."

---

## Stage 2 — Vendor Registration

**Path A — Signup first, apply after (direct to /signup)**
```
/signup → "Join as Vendor" tab
    │
    ├── Fill: Full Name, Email, Password
    ├── Click "Create Vendor Account"
    ├── "Check Your Email" screen shown
    ├── Confirmation email sent
    ├── Click link → /api/auth/callback
    └── Role = vendor, no vendor record → redirected to /vendor/apply
```

**Path B — Apply first, signup after (via /vendor/apply)**
```
/vendor/apply  (unauthenticated)
    │
    ├── Fill 3-step application form
    ├── Submit → not logged in detected
    ├── Draft saved to sessionStorage
    ├── Redirected to /signup?role=vendor
    ├── Complete signup → email confirmation
    ├── Click link → /vendor/apply  (draft may restore)
    └── Re-fill if draft lost (same short form)
```

**Beta monitoring point:** Does the vendor land on `/vendor/apply` after email confirmation — not `/dashboard`?

---

## Stage 3 — Vendor Application Form

```
/vendor/apply  (3-step wizard)
    │
    Step 1 — Your Business
    ├── Business Name (required)
    ├── Service Category (required — 20 categories)
    └── Custom description (if "Other" selected)
    │
    Step 2 — Location & Pricing
    ├── City (required)
    ├── Area / address (optional)
    ├── Travel radius in km (slider, default 30)
    ├── Price range min/max (optional — used for matching)
    ├── Years of experience (optional)
    └── Contact Phone — UK format required (07xxx or +44)
    │
    Step 3 — About & Links
    ├── Bio (optional but strongly encouraged)
    ├── Instagram URL (optional)
    ├── Website URL (optional)
    └── Submit Application button
    │
    On submit:
    ├── profiles.role updated to "vendor"
    ├── user_metadata.role synced to "vendor"
    ├── vendors row inserted (status = "pending")
    ├── Application received email sent to vendor
    ├── Admin alert created
    └── Vendor redirected to /vendor/dashboard
```

**Beta monitoring point:** Does admin receive an alert for new application? Does vendor see pending status?

---

## Stage 4 — Pending Review Period

```
/vendor/dashboard  (status = pending)
    │
    ├── "Application Under Review" banner shown
    ├── Vendor can begin building profile (photo, packages, bio)
    ├── Verification wizard available: /vendor/verification
    └── Admin reviews at /admin/vendors
```

**What the vendor should do while waiting (24–48 hours):**
- Complete their profile: bio, photos, packages, pricing
- Upload verification documents (optional at this stage)
- Add availability calendar

**Beta SLA:** Admin reviews and approves within 24 hours for beta testers.

---

## Stage 5 — Admin Review and Approval

```
Admin at /admin/vendors
    │
    ├── Sees vendor application (status: pending)
    ├── Reviews: business name, category, city, phone, bio
    ├── Actions:
    │   ├── Approve → status = "approved", email sent to vendor
    │   ├── Reject (with reason) → email sent to vendor
    │   └── Request resubmission
    └── Optionally: toggle phone_verified (green phone button)
```

**Vendor receives approval email:**
- Subject: "You're approved on ELBOLD!"
- Body: link to complete profile, guidance on packages and photos

---

## Stage 6 — Profile Completion

```
/vendor/dashboard  (status = approved)
    │
    Completion score shown (0-100%)
    │
    ├── /vendor/profile    — edit bio, location, contact details
    ├── /vendor/media      — upload photos and videos (react-dropzone)
    ├── /vendor/services   — create packages (name, price, description)
    ├── /vendor/availability — set blocked dates
    └── /vendor/verification — submit ID/business documents (optional)
    
Score thresholds:
    ├── 0-59%   → "Almost Ready" (not visible in marketplace)
    ├── 60-79%  → "Good Profile" (visible, basic placement)
    ├── 80-99%  → "Strong Profile" (better placement)
    └── 100%    → "Fully Optimised" (top placement)
```

**Beta monitoring point:** Do vendor photos upload successfully? Does completion score update?

---

## Stage 7 — Marketplace Visibility

```
Once approved and profile > 60% complete:
    │
    ├── Vendor appears in /browse results
    ├── Visible on /categories/[category] pages
    ├── Searchable by city, price range, category
    └── Public profile at /vendors/[id]
```

**Subscription plans affect placement:**
- Free: standard listing
- Pro (£29/mo): priority search, analytics, pro badge
- Featured (£79/mo): homepage featured, top placement

---

## Stage 8 — Receiving and Responding to Leads

```
Customer sends quote request → vendor notified by email
    │
/vendor/quotes  (Leads tab)
    │
    ├── Quote cards sorted by lead score (Hot / Good / Lead)
    ├── Lead score = budget + guest count + response rate + verified customer
    ├── Expand card to see: event details, date, budget, requirements
    │
    Respond to lead:
    ├── Title, price, deposit amount
    ├── Description of service offered
    ├── Package inclusions list
    ├── Terms and conditions
    ├── Duration (hours)
    ├── Valid until date
    └── Submit → customer receives quote response email
```

**Vendor dashboard also shows:**
- Expiry badge (countdown if quote expires < 48h)
- viewed_at / responded_at timestamps
- Response rate metric (affects vendor scoring)

---

## Stage 9 — Booking Confirmed

```
Customer accepts vendor quote → booking created
    │
    ├── Vendor receives "Booking confirmed" email
    ├── Booking appears at /vendor/bookings
    ├── Status: confirmed (deposit paid)
    ├── Payout tracked at /vendor/payouts
    └── Calendar automatically updated
```

---

## Stage 10 — Payout and Review

```
After event completed:
    │
    ├── Booking marked "completed" by customer or admin
    ├── Vendor metrics updated (completed_jobs_count, response_rate)
    ├── Customer leaves review → visible on vendor profile
    ├── Vendor reputation score updated
    └── Payout processed (manual during pilot phase)
```

**Payout process during pilot:** Admin processes bank transfer manually. Stripe Connect to be implemented post-pilot. See `/vendor/payouts` for bank details form.

---

## Vendor Journey Summary Table

| Stage | Route | Key Action | Success Signal |
|---|---|---|---|
| Discovery | `/founding-vendors` `/vendor/apply` | Lands on apply page | Fills step 1 |
| Registration | `/signup` or `/vendor/apply` | Creates account | Confirms email |
| Application | `/vendor/apply` | Submits 3-step form | Lands on `/vendor/dashboard` |
| Pending | `/vendor/dashboard` | Sees pending status | Begins profile |
| Approved | Email + `/vendor/dashboard` | Receives approval | Completes profile |
| Profile | `/vendor/profile` `/vendor/media` `/vendor/services` | Builds listing | Score > 60% |
| Live | `/browse` `/vendors/[id]` | Appears in marketplace | First lead received |
| Lead | `/vendor/quotes` | Responds to quote | Customer receives response |
| Booking | `/vendor/bookings` | Booking confirmed | Payout tracked |
| Review | Vendor profile | Receives review | Reputation score updated |

---

## Beta-Specific Notes

- Phone number is collected at apply time and visible to admin only — not public.
- Vendor status during beta: all start as "pending", admin approves within 24 hours.
- Stripe is live — vendor payouts are processed manually during pilot.
- If vendor gets stuck on email confirmation, check Supabase Auth → URL Configuration.
- Direct testers to complete their profile fully before expecting leads.
