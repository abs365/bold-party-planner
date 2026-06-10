# Phase 50 — First Real Vendor Activation

**Date:** 2026-06-10  
**Objective:** Convert the first genuine pending vendor into a quote-ready marketplace listing.  
**Success metric:** 1 real vendor with approved status, a working package, real media, and a meaningful bio — ready to receive customer enquiries.  
**No code changes. No deployments. No migrations.**

---

## Media Fingerprint Finding

Before actioning any vendor, one cross-account finding requires context.

The file `screenshot_2026-02-15_212503.png` appears in two separate vendor storage buckets:

| Vendor | Path | Uploaded |
|--------|------|----------|
| Baptist | `cfe5733a.../1780590922383_screenshot_2026-02-15_212503.png` | 2026-06-04 16:35 |
| Mastaly | `db6756f2.../1780664224737_screenshot_2026-02-15_212503.png` | 2026-06-05 12:57 |

The filename includes the original creation timestamp (`21:25:03, 15 Feb 2026`). Identical filename means the file originated from the same device or was shared between parties before upload.

Additionally, Baptist and Tinms share phone number `07305042612`, and Mastaly and Tinms are both based in Kent.

**Interpretation:** Mastaly, Baptist, and Tinms are likely known to each other — possibly a small friend or family group who registered together. This does not disqualify them as real vendors. It means: if Mastaly is genuine, Baptist may be too. Treat them as an interconnected cohort, not as a suspicious cluster. The shared file is consistent with someone sending "upload this" via WhatsApp to help a contact register.

**Action:** No hold on activation. Note the connection. If both are approved, monitor for duplicate enquiries from the same customer account.

---

## Vendor 1 — Mastaly

### Profile Summary

| Field | Value |
|-------|-------|
| Vendor ID | `db6756f2-4417-4813-a0fd-1cf5b2bc6e2b` |
| Email | **mastalyinfo@gmail.com** |
| Phone | 07543890756 |
| Category | Videographer |
| City | Kent |
| Travel radius | 60 km |
| Experience | 7 years |
| Status | **Pending** |
| Bio | "Winner all the way 2025" (23 chars) |
| Media | 3 real uploads: faith.png, mi.mp4, screenshot |
| Packages | 3 tiers: Basic £1 / Standard £200 / Premium £2000 |
| Event types | None set |
| Instagram | None |
| Last signed in | 2026-06-05 |

### What Is Already Done

- Real personal business email
- Unique phone number
- Real media uploaded including a showreel video (mi.mp4)
- Three pricing tiers with realistic professional rates (£200 / £2000)
- 7 years experience declared
- 60 km travel radius — covers Kent, parts of London and Essex

### Missing Items (to become quote-ready)

| Item | Blocker? | Notes |
|------|----------|-------|
| Admin approval | YES — hard blocker | Founder must approve in admin panel |
| Bio length | Soft — profile looks weak | "Winner all the way 2025" is 23 chars. Ask vendor to expand to 80+ chars |
| Package descriptions | Soft — customers can still enquire | "Sample / Testing / Sample" are placeholders. Ask vendor to describe what each tier covers |
| Basic £1 package price | Soft | £1 is clearly a test price. Can be updated by vendor at any time |
| Tagline | No | Empty — would improve profile presentation |
| Event types | No | Empty — optional for browsing filters |
| Instagram / website | No | Optional trust signals |

### Expected Completion Effort

- **Founder effort:** 5 minutes (approve in admin panel, send one email)
- **Vendor effort:** 15 minutes (update bio, update package descriptions)
- **Time to quote-ready:** Same day if vendor responds

### Recommended Next Action

1. Approve Mastaly in the admin panel at `/admin/vendors`
2. Send the outreach email below
3. Follow up by phone (07543890756) if no email response within 48 hours

### Outreach Email — Mastaly

**To:** mastalyinfo@gmail.com  
**Subject:** Your Elbold application has been reviewed  

---

Hi Mastaly,

Thank you for applying to Elbold. We have reviewed your application and are ready to approve your profile.

Before we go live, there are two small things we need from you so that customers can understand exactly what you offer:

**1. Update your bio**

Your current bio ("Winner all the way 2025") is a great start, but customers need to know a little more before they enquire. Something like this would work well:

> "Based in Kent, I have been filming events professionally for 7 years. I cover weddings, birthdays, corporate events and celebrations of all sizes. My work is fast, personal and delivered in full HD."

Log in at www.elbold.com, go to your vendor dashboard, and update your profile bio.

**2. Update your package descriptions**

Your three packages (Basic, Standard, Premium) show good pricing, but the descriptions currently say "Sample" and "Testing." Customers need to know what is included at each tier. For example:

- Basic: What is included? How long? What format is the final video?
- Standard: What makes this different from Basic?
- Premium: What is the full experience?

Once these two things are updated, your profile will go live and customers will be able to send you enquiries.

If you have any questions, reply to this email or call us. We are here to help you get your first booking.

Welcome to Elbold.

[Your name]  
Founder, Elbold  
hello@elbold.com

---

---

## Vendor 2 — Baptist

### Profile Summary

| Field | Value |
|-------|-------|
| Vendor ID | `cfe5733a-805e-4a90-a5f0-b0d8d3185d9d` |
| Email | **alawal543@yahoo.com** |
| Phone | 07305042612 |
| Category | Decorator |
| City | Basildon |
| Travel radius | 30 km |
| Experience | 10 years |
| Status | **Pending** |
| Bio | "Award winning Decoration." (25 chars) |
| Media | 2 real uploads: screenshots of previous work |
| Packages | 1: Basic £1, 2h, description "I speaker" |
| Event types | Birthday, wedding, anniversary, naming ceremony, engagement |
| Last signed in | 2026-06-04 |

### What Is Already Done

- Personal Yahoo email confirmed and active
- 10 years experience declared
- Real media uploaded (screenshots of decoration work from Nov 2025 and Feb 2026)
- Event types fully populated — shows genuine thought about target market
- Basildon is a real Essex location within the ELBOLD target geography
- Shares a media file with Mastaly — likely part of the same social circle (see fingerprint note above)

### Missing Items (to become quote-ready)

| Item | Blocker? | Notes |
|------|----------|-------|
| Admin approval | YES — hard blocker | Approve after verifying below items |
| Package fix | YES — hard blocker | "I speaker" is clearly wrong for a decorator. Price of £1 is a test. Vendor must update package before approval |
| Bio length | Soft | "Award winning Decoration." is 25 chars. Ask for 80+ |
| Media quality | Soft | Screenshots are acceptable evidence of work. Better if real photos were added, but not blocking |
| Phone shared with Tinms | Note | Hold visibility — ask the vendor to confirm phone number on outreach |
| Instagram / website | No | Empty — optional |

### Expected Completion Effort

- **Founder effort:** 10 minutes (send outreach, wait for package fix, then approve)
- **Vendor effort:** 20 minutes (fix package, update bio, optionally add better photos)
- **Time to quote-ready:** 2 to 3 days depending on vendor response speed

### Recommended Next Action

1. Send the outreach email below — do not approve yet
2. Wait for Baptist to fix their package and update their bio
3. Once the package is corrected (real price, real description of decoration services), approve
4. Confirm the phone number matches during outreach

### Outreach Email — Baptist

**To:** alawal543@yahoo.com  
**Subject:** Your Elbold application — a couple of things to fix  

---

Hi John,

Thank you for applying to Elbold as a decorator. We can see you have 10 years of experience and have uploaded some of your previous work. Before we can approve your profile, there are two things that need to be updated.

**1. Fix your service package**

Your current package says "I speaker" and is priced at £1. This looks like it may have been entered by mistake. As a decorator, your package should describe what you actually provide.

For example:

- What type of events do you decorate (birthdays, weddings, naming ceremonies)?
- What is included (table centrepieces, backdrop, balloon arch, full venue styling)?
- What is your starting price for a typical job?

Log in at www.elbold.com, go to your vendor dashboard, open your services, and update or replace the existing package.

**2. Expand your bio**

Your bio says "Award winning Decoration." which is a strong opening, but customers want to know more. Add a sentence or two about your style, the types of events you cover, and the areas you serve.

Once these are updated, we will approve your profile and you will start receiving enquiries from customers in Basildon and the surrounding area.

If you need any help, reply to this email or call us directly.

[Your name]  
Founder, Elbold  
hello@elbold.com

---

---

## Vendor 3 — Seun Barker

### Profile Summary

| Field | Value |
|-------|-------|
| Vendor ID | `639594de-b93f-40fd-8f0b-5475670c8163` |
| Email | **osunseun242@gmail.com** |
| Phone | 07781212234 |
| Category | Other (custom: "Barker") |
| City | London |
| Travel radius | 30 km |
| Experience | 2 years |
| Price range declared | £200 to £1,000 |
| Status | **Pending** |
| Bio | "Delivering good service" (23 chars) |
| Media | 0 |
| Packages | 0 |
| Last signed in | 2026-06-09 (yesterday) |

### What Is Already Done

- Real personal Gmail confirmed and active
- Registered yesterday — active and engaged
- Unique phone number not seen on any other account
- Price range declared (£200 to £1,000) shows awareness of their value
- "Barker" as a category is a legitimate event role (crowd engagement, hosting, promotion)

### Missing Items (to become quote-ready)

| Item | Blocker? | Notes |
|------|----------|-------|
| Packages | YES — hard blocker | No packages at all. Cannot receive quotes without at least one |
| Media | YES — soft blocker | No images or video. Profile is invisible to customers without media |
| Admin approval | YES — hard blocker | Must happen after packages and media are added |
| Bio | Soft | "Delivering good service" is 23 chars. Needs real description |
| Category clarity | Soft | "Barker" is a niche — customers may not know what to search for. Needs a clear bio to compensate |

### Expected Completion Effort

- **Founder effort:** 15 minutes (send outreach, guide through setup, approve when ready)
- **Vendor effort:** 30 to 45 minutes (add package, add photos or video, update bio)
- **Time to quote-ready:** 3 to 7 days — depends entirely on vendor following through

### Recommended Next Action

1. Send the outreach email below
2. Offer a 10-minute setup call if they do not respond within 48 hours
3. Do not approve until at least 1 package and 1 media item are added

### Outreach Email — Seun Barker

**To:** osunseun242@gmail.com  
**Subject:** Complete your Elbold profile to start receiving enquiries  

---

Hi Seun,

Thank you for signing up to Elbold. We can see you registered yesterday and we want to help you get your first enquiry as quickly as possible.

Your application is almost there. There are three things to complete before your profile can go live.

**1. Add at least one service package**

Customers need to know what they are getting and how much it costs. Log in at www.elbold.com, go to your vendor dashboard, and add a package. You can keep it simple to start:

- Name: e.g., "Event Barker / Host"
- Description: What do you do? How long? What kind of events?
- Price: Your starting rate (you declared £200 to £1,000 during signup, so start from there)

**2. Add at least one photo or video**

Your profile has no images yet. Even one strong image of you working at an event will make a significant difference. If you have a short video of you hosting or promoting, even better. Go to your vendor dashboard and upload under "Media."

**3. Update your bio**

"Delivering good service" is a start, but customers searching for an event barker need to understand exactly what you do. Add two or three sentences: what type of events you have worked, what you bring to the room, and where you are based in London.

Once these three things are done, we will review and approve your profile.

If you would like help getting set up, reply to this email or call us. We can guide you through it in under 10 minutes.

[Your name]  
Founder, Elbold  
hello@elbold.com

---

---

## Activation Tracker

| Vendor | Classification | Contacted | Response | Profile Complete | Quote Ready |
|--------|---------------|-----------|----------|-----------------|-------------|
| Mastaly | REAL | Pending | Pending | Partial (bio + package descriptions needed) | No |
| Baptist | UNKNOWN (likely real) | Pending | Pending | No (package must be fixed) | No |
| Seun Barker | REAL (incomplete) | Pending | Pending | No (packages + media missing) | No |

**Tracker key:**  
Contacted: Not started / Emailed / Called / Responded  
Profile Complete: No / Partial / Yes  
Quote Ready: No / Yes

---

## Priority Action Plan for the Founder

### Today (2026-06-10)

1. **Approve Mastaly immediately** — they meet the minimum threshold already. Bio and package descriptions can be improved post-approval. Customers can still enquire.  
   Go to: `/admin/vendors` → find Mastaly → approve  

2. **Send the Mastaly email** — notify them their profile is approved and ask for the two small updates.  

3. **Send the Baptist email** — do not approve yet. Wait for the package to be fixed.  

4. **Send the Seun Barker email** — set expectations clearly. They need the most work.  

### This Week

- If Mastaly updates their bio and packages: profile is fully polished, ready for any customer.
- If Baptist fixes their package: approve and the platform has a decorator in Essex.
- If Seun Barker adds packages and media: approve and London coverage improves.

### Success Condition

The platform has its first genuinely quote-ready vendor when **Mastaly is approved today**.

The Standard package (£200) and Premium package (£2,000) are real prices for videography. Real uploaded media exists. Three pricing tiers exist. The only step between "pending" and "first enquiry" is the admin approval click.

---

## Connected Vendor Note (Baptist + Mastaly + Tinms)

These three vendors show signals of a social connection:

| Signal | Vendors |
|--------|---------|
| Shared media file (`screenshot_2026-02-15_212503.png`) | Baptist + Mastaly |
| Shared phone number (07305042612) | Baptist + Tinms |
| Same city (Kent) | Mastaly + Tinms |

This is not fraud. It is a small social cluster who likely discovered Elbold through the same channel and helped each other register. This is common on new marketplace platforms.

Tinms is still classified as TEST due to the bio filler and placeholder package. Baptist and Mastaly are treated as independent genuine vendors with a social connection.

If both Mastaly and Baptist are eventually active and begin receiving enquiries, monitor whether a single customer account contacts both — that would confirm the cluster is a known social group exploring the platform together.

---

*Document created: Phase 50 — 2026-06-10. Read-only audit. No records modified.*
