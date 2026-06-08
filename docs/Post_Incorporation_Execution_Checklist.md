# Post-Incorporation Execution Checklist

**Target completion time: < 30 minutes**  
**Trigger:** Certificate of Incorporation received from Companies House  
**Entity:** ELBOLD Ltd (trading as ELBOLD Events)

---

## Before You Start

Have the Certificate of Incorporation open. You will need:
- Company number (e.g. 15123456)
- Incorporation date (e.g. 10 June 2026)
- Registered office address (exactly as it appears on the certificate)

Open the **Company Information Registry** (`docs/Company_Information_Registry.md`) and populate the top section first. This becomes your source of truth for the next 30 minutes.

---

## Step 1 — Record Company Details (2 min)

Fill in `docs/Company_Information_Registry.md`:
- [ ] Company number
- [ ] Incorporation date
- [ ] Registered office (full address)

Also record in `docs/Company_Information_Registry.md`:
- [ ] Note first accounts due date (21 months from incorporation)
- [ ] Note first confirmation statement due date (1 year + 14 days from incorporation)

---

## Step 2 — Privacy Policy (5 min)

**File:** `app/privacy/page.tsx`

Find and replace (3 replacements):

| Find | Replace with |
|------|-------------|
| `[COMPANY_NUMBER]` | actual company number |
| `[INCORPORATION_DATE]` | actual incorporation date |
| `[REGISTERED_OFFICE]` | full registered office address |

Confirm the "Who We Are" section now reads:
> ELBOLD Ltd (trading as ELBOLD Events), company number XXXXXXXX, registered in England and Wales (incorporated DD Month YYYY), operates the event planning marketplace at elbold.com. Registered office: [full address].

- [ ] Done

---

## Step 3 — Terms of Service (2 min)

**File:** `app/terms/page.tsx`

Find and replace (2 replacements):

| Find | Replace with |
|------|-------------|
| `[COMPANY_NUMBER]` | actual company number |
| `[REGISTERED_OFFICE]` | full registered office address |

- [ ] Done

---

## Step 4 — Vendor Terms (2 min)

**File:** `app/vendor-terms/page.tsx`

Find and replace (2 replacements — same as Terms):

| Find | Replace with |
|------|-------------|
| `[COMPANY_NUMBER]` | actual company number |
| `[REGISTERED_OFFICE]` | full registered office address |

- [ ] Done

---

## Step 5 — Refund Policy (2 min)

**File:** `app/refunds/page.tsx`

Find and replace (2 replacements — same as Terms):

| Find | Replace with |
|------|-------------|
| `[COMPANY_NUMBER]` | actual company number |
| `[REGISTERED_OFFICE]` | full registered office address |

- [ ] Done

---

## Step 6 — Footer (2 min)

**File:** `components/layout/Footer.tsx`, line 132

Find:
```
Company No. [COMPANY_NUMBER]
```
Replace with:
```
Company No. XXXXXXXX
```

- [ ] Done

---

## Step 7 — Email Templates (3 min)

Four files. All carry `Company No. [COMPANY_NUMBER]`. Replace in each:

- [ ] `lib/resend/index.ts` — replace `[COMPANY_NUMBER]`
- [ ] `lib/resend/vendor-outreach.ts` — replace `[COMPANY_NUMBER]`
- [ ] `lib/resend/verification-emails.ts` — replace `[COMPANY_NUMBER]`
- [ ] `app/api/concierge/route.ts` — replace `[COMPANY_NUMBER]`

---

## Step 8 — Verify No Placeholders Remain (1 min)

Run this in PowerShell from the project root:
```powershell
Select-String -Path "app\**\*.tsx", "components\**\*.tsx", "lib\**\*.ts" -Pattern "\[COMPANY_NUMBER\]|\[REGISTERED_OFFICE\]|\[INCORPORATION_DATE\]" -Recurse
```

Expected output: **no matches**

- [ ] Zero matches confirmed

---

## Step 9 — Commit and Deploy (3 min)

```bash
git add app/privacy/page.tsx app/terms/page.tsx app/vendor-terms/page.tsx \
        app/refunds/page.tsx components/layout/Footer.tsx \
        lib/resend/index.ts lib/resend/vendor-outreach.ts \
        lib/resend/verification-emails.ts app/api/concierge/route.ts

git commit -m "legal: add company number [COMPANY_NUMBER] — ELBOLD Ltd incorporated [INCORPORATION_DATE]"

git push origin main
```

Vercel deploys automatically. Monitor at vercel.com/dashboard.

- [ ] Pushed and deploying

---

## Step 10 — Stripe Business Details (3 min)

Log in to Stripe Dashboard → Settings → Business Details:

- [ ] Legal business name: confirm `ELBOLD Ltd`
- [ ] Business type: confirm `Private limited company`
- [ ] Company number: enter `XXXXXXXX`
- [ ] Registered address: confirm matches Companies House record
- [ ] Payout bank account: confirm is ELBOLD Ltd business account (not personal)

---

## Step 11 — Resend Sender Identity (2 min)

Log in to Resend dashboard:

- [ ] Sender name: confirm `ELBOLD Events` (not "ELBOLD Event Planner")
- [ ] Domain `elbold.com`: confirm DNS verification is active (DKIM, SPF, DMARC)
- [ ] Reply-to addresses: confirm support@elbold.com is monitored

---

## Step 12 — Google Business Profile (3 min)

Create at business.google.com if not yet done:

- [ ] Business name: `ELBOLD Events`
- [ ] Category: `Event Planning Service`
- [ ] Website: `www.elbold.com`
- [ ] Service area: UK (or London, Kent, Essex)
- [ ] Phone: monitored number
- [ ] Do NOT list home address — service area only if registered office is private

---

## Step 13 — Update Privacy Policy Contact (if ICO registered)

**File:** `app/privacy/page.tsx`, section 11

If ICO registration is complete, add ICO number:
```
ICO Registration Number: ZXXXXXXX
```

- [ ] Complete (if ICO registered) or defer

---

## Step 14 — Final Verification (2 min)

Visit these pages on the live site at www.elbold.com:

- [ ] `/privacy` — company number visible in "Who We Are"
- [ ] `/terms` — company number visible in section 1
- [ ] `/vendor-terms` — company number visible in section 1
- [ ] `/refunds` — company number visible in section 1
- [ ] Footer — company number visible on any page

---

## Done

**Total time target: < 30 minutes**

Record completion in `docs/Company_Information_Registry.md` sign-off table.

Announce to the team: ELBOLD Ltd is incorporated and all legal documents are updated.
