# Pre-Launch Priority 1 — Concierge System Test

**Date:** 2026-06-07
**Sprint:** ELBOLD Pre-Launch Operations
**Objective:** Apply migration 041, verify the concierge system works end-to-end, and produce a pass/fail record.

---

## Step 1 — Apply Migration 041

Open the Supabase Dashboard and navigate to SQL Editor.

Paste and execute the contents of:
```
supabase/migrations/041_concierge_requests.sql
```

Confirm the following in the SQL Editor response:
- No error messages
- "Success" or row count returned for CREATE TABLE
- Trigger function created without error
- RLS policies created without error

After applying, run this verification query in SQL Editor:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'concierge_requests';
```

Expected result: one row returned with table_name = concierge_requests.

---

## Step 2 — Submit a Real Concierge Request

Open a browser in private/incognito mode (unauthenticated).

Navigate to: https://www.elbold.com/concierge

Fill in the form with real test data:
- Name: your actual name
- Email: an email address you can check (e.g. blue2gtv@gmail.com or a separate test address)
- Phone: your phone number
- Event type: Birthday Party
- Event date: a future date 2-3 months away
- Location: Essex
- Guest count: 50
- Budget: £500 - £1,000
- Notes: "This is an operational test from the ELBOLD founder."

Submit the form.

Expected result: the form clears and the success screen appears with a confirmation message.

---

## Step 3 — Confirm Database Record

In Supabase Dashboard SQL Editor, run:

```sql
SELECT id, name, email, event_type, status, created_at
FROM concierge_requests
ORDER BY created_at DESC
LIMIT 5;
```

Expected result: the test submission appears as the most recent row with status = 'new'.

---

## Step 4 — Confirm Admin Notification Email

Check the inbox for the ADMIN_EMAILS addresses configured in Vercel (or .env.local).

Expected: an email with subject "New Concierge Request" or similar, containing the customer's name, event type, email, date, and notes.

If the email did not arrive within 5 minutes, check:
1. Resend dashboard for any send failures
2. ADMIN_EMAILS environment variable is set in Vercel production
3. RESEND_API_KEY is active

---

## Step 5 — Confirm Customer Confirmation Email

Check the inbox for the email address used in the test submission.

Expected: a confirmation email addressed to the customer, acknowledging receipt and explaining next steps.

---

## Step 6 — Confirm Request Appears in Admin Panel

Log in to the admin account and navigate to: /admin/concierge

Expected: the test request appears as a card with status "New", showing all submitted fields.

---

## Step 7 — Confirm Status Update

In the admin concierge panel, locate the test request.

The current admin UI shows a "Reply" (mailto link) and "Find Vendors" link.

To test status management, run this SQL directly in Supabase SQL Editor:

```sql
UPDATE concierge_requests
SET status = 'in_progress', admin_notes = 'Test status update — founder'
WHERE email = 'your-test-email@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

Refresh /admin/concierge and confirm the request now shows status "In Progress".

---

## Pass/Fail Report

Complete this table after running all steps.

| Test | Result | Notes |
|---|---|---|
| Migration 041 applied without errors | PASS / FAIL | |
| concierge_requests table confirmed in DB | PASS / FAIL | |
| Form submission succeeds (success screen appears) | PASS / FAIL | |
| Database record created with correct data | PASS / FAIL | |
| Admin notification email received | PASS / FAIL | Time to receive: __ min |
| Customer confirmation email received | PASS / FAIL | Time to receive: __ min |
| Request appears in /admin/concierge | PASS / FAIL | |
| Status update confirmed via SQL | PASS / FAIL | |

**Overall Result:** PASS / FAIL / PARTIAL

---

## Known Limitations (not test failures)

The admin concierge panel at /admin/concierge does not currently have a UI button for updating status. Status changes must be made via Supabase SQL Editor or a future PATCH API endpoint. This is a known pending item, not a system failure.

If ADMIN_EMAILS is not set in Vercel, the admin notification email will not send. The customer confirmation email still sends because it uses the email from the form field. Set ADMIN_EMAILS in Vercel environment variables before going live.

---

## If Migration Fails

If the migration produces an error like "relation already exists", the table may already be partially applied. Run:

```sql
DROP TABLE IF EXISTS concierge_requests CASCADE;
```

Then re-run the full migration. This is safe because no production data exists yet.

If the error is a permissions issue, confirm you are running the SQL as the postgres (service role) user in Supabase SQL Editor, not as the anon role.
