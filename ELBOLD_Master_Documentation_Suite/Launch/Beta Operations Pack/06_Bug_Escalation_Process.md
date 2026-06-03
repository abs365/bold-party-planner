# Bug Escalation Process — ELBOLD Beta

**Version:** 1.0  
**Date:** 2026-06-03  
**Applies to:** All bugs reported during 6-tester and 20-tester beta phases

---

## Severity Classification

Every bug reported during beta is assigned a severity level immediately.

| Level | Name | Definition | Examples |
|---|---|---|---|
| **P0** | Critical | Platform is down, data is lost, security is breached, or a user cannot complete signup/login | Site returns 500 on all pages; user data deleted; `/api/auth/callback` broken; payment charged but booking not created |
| **P1** | High | A core user journey is blocked for some or all users. No workaround exists. | Vendor cannot submit application; customer cannot send quote; email confirmation not sending; vendor approval email not sending |
| **P2** | Medium | A feature is broken but a workaround exists, or the issue affects a non-critical path | Quote comparison view errors for some events; vendor photo upload fails for specific file types; filter not resetting on browse page |
| **P3** | Low | Cosmetic, copy, or minor UX issue. Does not block any journey. | Typo on vendor apply page; icon misaligned on mobile; error message wording unclear |

---

## Response and Fix SLAs

| Severity | Acknowledge | Fix deployed | Communication |
|---|---|---|---|
| P0 Critical | Immediately | Within 2 hours | Notify all active testers immediately |
| P1 High | Within 1 hour | Within 24 hours | Notify affected testers |
| P2 Medium | Within 4 hours | Next sprint (within 72 hours) | Log in Beta_Test_Results.md |
| P3 Low | Within 24 hours | Backlog | Log only |

---

## Bug Reporting — What Testers Should Send

Ask testers to provide all of the following when reporting a bug:

```
1. WHAT they were trying to do
   "I was trying to submit my vendor application"

2. WHAT happened instead
   "I clicked Submit and got a blank white page"

3. EXACT URL at the time of the error
   "https://www.elbold.com/vendor/apply"

4. EXACT error message (screenshot or copy-paste)
   "Application submitted! Check your email — we'll be in touch within 24–48 hours."
   OR
   "Error: Submission failed"

5. DEVICE and BROWSER
   "iPhone 14 / Safari 17"
   OR
   "Windows 11 / Chrome 124"

6. WHEN it happened
   "Today at 14:30 BST"

7. STEPS to reproduce
   Step 1: Go to /vendor/apply
   Step 2: Fill Step 1 (business name = Test Florist, category = Decorator)
   Step 3: Click Continue
   Step 4: Fill Step 2 (City = London, phone = 07700900001)
   Step 5: Click Continue
   Step 6: Click Submit Application
   → Error occurs
```

---

## Bug Intake Channels

| Channel | Priority | Who monitors |
|---|---|---|
| WhatsApp (direct to founder) | P0, P1 | Founder — check immediately |
| Email to abylaw365@gmail.com | P1, P2 | Founder — check 3x daily |
| `Beta_Test_Results.md` Section 8 | All | Founder — log after every session |
| Verbal (in-person testers) | Any | Note immediately, log within 1 hour |

---

## Bug Response Workflow

```
Bug reported
    │
    ├── Founder receives report
    │
    ├── STEP 1: Classify severity (P0/P1/P2/P3)
    │
    ├── STEP 2: Reproduce the bug locally
    │   ├── Can reproduce → proceed to fix
    │   └── Cannot reproduce → ask tester for more detail
    │
    ├── STEP 3: Log in Beta_Test_Results.md Section 8
    │   Format: B00X | Section | Description | Severity | Reproducible | Status
    │
    ├── STEP 4: Fix
    │   ├── Edit code
    │   ├── npx tsc --noEmit (must pass)
    │   ├── npm run build (must pass)
    │   └── Manual verify fix in browser
    │
    ├── STEP 5: Deploy
    │   ├── git add [files]
    │   ├── git commit -m "fix: [short description] (P1 beta fix)"
    │   └── git push origin main → Vercel auto-deploys
    │
    ├── STEP 6: Log fix in Beta_Test_Results.md Section 9
    │   Format: F00X | Bug ref | File changed | Description | TSC | Build | Date
    │
    └── STEP 7: Notify tester
        └── Confirm fix is live, ask them to retest
```

---

## P0 Critical — Emergency Protocol

When a P0 is confirmed:

```
1. STOP all other work immediately

2. ASSESS — determine blast radius:
   "Is this affecting one user or all users?"
   "Is data at risk?"
   "Is the payment system involved?"

3. COMMUNICATE (within 5 minutes):
   Message all active testers:
   "We've identified an issue and are fixing it now. 
   Please do not attempt [affected action] until we confirm it's resolved."

4. FIX — do not ship partial fixes:
   Fix root cause, not symptoms.
   All fixes must pass TypeScript and build before deploy.

5. VERIFY on production — not just localhost:
   curl the affected route
   Manually walk through the broken journey

6. COMMUNICATE resolution:
   "Issue resolved at [time]. Please retry [action]."

7. POST-MORTEM (within 24h):
   What broke, why, how it was fixed, how to prevent recurrence.
   Log in Beta_Test_Results.md.
```

---

## Known Non-Bugs (Do Not Escalate)

These are intentional platform behaviours that testers may report as bugs:

| Report | Reality |
|---|---|
| "I can't see my vendor profile in Browse" | Profile score must be > 60% for marketplace visibility. Guide vendor to complete profile. |
| "I didn't get a quote response" | Vendor has not responded yet. Not a bug — follow up with vendor tester. |
| "The email took 10 minutes to arrive" | Resend delivery can be delayed. Not a bug unless > 30 minutes. |
| "I can't change my email address" | Email change requires re-confirmation. By design (Supabase secure email change). |
| "The site is slow on first load" | Cold Vercel function start. Expected on serverless. Not a bug. |
| "I see 'No vendors yet' on Browse" | No approved vendors with complete profiles in that category. Not a bug. |
| "My quote shows as Pending for hours" | Vendor has not responded yet. Follow up with vendor. |

---

## Beta Bug Log Template

Copy this into `Beta_Test_Results.md` Section 8 for each bug:

```
| B00X | [Section #] | [One-line description] | P0/P1/P2/P3 | Yes/No | Open/Fixed |
```

Example:
```
| B001 | Section 3 | Email confirmation not received on Safari iOS | P1 | Yes | Fixed |
| B002 | Section 5 | Vendor photo upload fails for HEIC files | P2 | Yes | Open |
| B003 | Section 4 | Dashboard shows "undefined" for event date | P2 | Yes | Fixed |
```

---

## Escalation Contacts

| Role | Name | Contact |
|---|---|---|
| Platform owner / sole fixer | Founder | abylaw365@gmail.com |
| Supabase issues | Supabase support | supabase.com/support |
| Vercel build failures | Vercel support | vercel.com/support |
| Stripe payment issues | Stripe support | support.stripe.com |
| Resend email issues | Resend support | resend.com/support |

---

## Decision: Fix vs Defer

| Scenario | Fix now | Defer |
|---|---|---|
| Blocks any part of the signup or auth flow | Yes | No |
| Blocks vendor from applying | Yes | No |
| Blocks customer from requesting a quote | Yes | No |
| Breaks admin vendor approval | Yes | No |
| UI misalignment on desktop only | No | Yes (P3) |
| Missing feature not in scope | No | Yes |
| Performance issue under no load | No | Yes (P3) |
| Console warning (not error) | No | Yes (P3) |
