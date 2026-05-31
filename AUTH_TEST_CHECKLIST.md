# Auth Test Checklist — ELBOLD
_Created: 2026-05-25_

---

## Quick Start: Get Test Accounts Working

### Step 1: Run migrations + seed in Supabase SQL editor

```sql
-- Run each migration in order (001 through 008) if not already done
-- Then run seed.sql to create vendor/customer demo data
```

### Step 2: Activate demo account passwords

The seed SQL creates auth.users with placeholder hashes. Use the admin API endpoint to set real passwords:

```bash
curl -X POST http://localhost:3000/api/auth/create-demo-users \
  -H "Content-Type: application/json" \
  -d '{"secret":"BOLD_PARTY_DEMO_2026"}'
```

Or in the browser console on localhost:
```js
fetch('/api/auth/create-demo-users', {
  method: 'POST',
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify({secret:'BOLD_PARTY_DEMO_2026'})
}).then(r => r.json()).then(console.log)
```

### Test Account Credentials

| Email | Password | Role |
|-------|----------|------|
| emily.carter@elbold.demo | ElboldDemo2026! | Customer |
| oliver.webb@elbold.demo | ElboldDemo2026! | Customer |
| priya.singh@elbold.demo | ElboldDemo2026! | Customer |
| james.bennett@elbold.demo | ElboldDemo2026! | Vendor (approved) |
| sofia.martinez@elbold.demo | ElboldDemo2026! | Vendor (approved) |
| ravi.patel@elbold.demo | ElboldDemo2026! | Vendor (approved) |

### Admin Account

The admin account is controlled by the `ADMIN_EMAILS` environment variable (currently: `abylaw365@gmail.com`).

To create the admin account:
1. Go to `/signup`
2. Sign up with `abylaw365@gmail.com` + any password
3. Confirm the email if required
4. You can then access `/admin`

---

## Important Supabase Auth Setting

**For the easiest testing experience**, disable email confirmation in your Supabase project:
- Supabase Dashboard → Authentication → Providers → Email → Disable "Confirm email"

If email confirmation is **enabled**, users must click the confirmation link before they can log in. The signup page now handles this correctly by showing a "Check your email" state instead of redirecting.

---

## Signup Tests

- [ ] Customer signup with full name, email, password
  - Email confirmation disabled: → lands on `/dashboard`
  - Email confirmation enabled: → shows "Check your email" message (does NOT redirect)
- [ ] Vendor signup with full name, email, password
  - Email confirmation disabled: → lands on `/vendor/apply`
  - Email confirmation enabled: → shows "Check your email" message
- [ ] Password < 8 characters → shows validation error toast
- [ ] Duplicate email → shows "account already exists" toast
- [ ] Empty required fields → HTML validation prevents submit
- [ ] Role toggle (Plan Events / List Services) works visually
- [ ] After email confirmation click → lands on correct dashboard

---

## Login Tests

- [ ] Login with valid customer credentials → lands on `/dashboard`
- [ ] Login with valid vendor credentials → lands on `/vendor/dashboard`
- [ ] Login with admin email → lands on `/admin`
- [ ] Login with wrong password → shows "Incorrect email or password" toast
- [ ] Login with unconfirmed email → shows "Please confirm your email" toast
- [ ] Login with non-existent email → shows error toast
- [ ] Session persists after browser tab close and reopen
- [ ] Session persists after page refresh
- [ ] The `?redirect=` param works (e.g., `/login?redirect=/dashboard/events`)

---

## Protected Route Tests

After signing out, verify these routes all redirect to `/login?redirect=<path>`:

**Customer protected:**
- [ ] `/dashboard`
- [ ] `/dashboard/events`
- [ ] `/dashboard/bookings`
- [ ] `/dashboard/messages`
- [ ] `/dashboard/payments`
- [ ] `/dashboard/notifications`
- [ ] `/dashboard/settings`
- [ ] `/dashboard/quotes`

**Vendor protected:**
- [ ] `/vendor/dashboard`
- [ ] `/vendor/bookings`
- [ ] `/vendor/quotes`
- [ ] `/vendor/messages`
- [ ] `/vendor/profile`
- [ ] `/vendor/media`
- [ ] `/vendor/services`
- [ ] `/vendor/reviews`
- [ ] `/vendor/analytics`
- [ ] `/vendor/subscription`
- [ ] `/vendor/availability`

**Admin protected:**
- [ ] `/admin` — logged-in non-admin → redirects to `/dashboard`
- [ ] `/admin` — admin email → shows admin dashboard
- [ ] `/admin/vendors`
- [ ] `/admin/customers`
- [ ] `/admin/bookings`
- [ ] `/admin/disputes`

**Public (must NOT redirect to login):**
- [ ] `/` (homepage)
- [ ] `/browse`
- [ ] `/vendors/[id]`
- [ ] `/categories/[category]`
- [ ] `/vendor/apply`
- [ ] `/inspire`
- [ ] `/login`
- [ ] `/signup`
- [ ] `/how-it-works`
- [ ] `/privacy`, `/terms`, etc.

---

## Role Tests

- [ ] Customer login → cannot reach `/vendor/dashboard` (redirected to `/dashboard`)
- [ ] Vendor login → reaches `/vendor/dashboard`
- [ ] Non-admin login → cannot reach `/admin` (redirected to `/dashboard`)
- [ ] Admin email login → reaches `/admin`
- [ ] Vendor with profile.role = "vendor" but no vendors row → redirected to `/vendor/apply`

---

## Logged-In Redirect Tests

- [ ] Logged-in user visits `/login` → redirected to dashboard
- [ ] Logged-in user visits `/signup` → redirected to dashboard
- [ ] Logged-in admin visits `/login` → redirected to `/admin`

---

## Onboarding Tests

### Customer
- [ ] New customer → `/dashboard` shows empty state with CTA to create event
- [ ] Create event wizard loads and submits correctly

### Vendor
- [ ] New vendor → `/vendor/apply` form submits and redirects to `/vendor/dashboard`
- [ ] Pending vendor sees "Application under review" message in dashboard
- [ ] Approved vendor sees full dashboard metrics

### Admin
- [ ] Admin sees all vendor applications
- [ ] Admin can approve/reject vendor
- [ ] Approved vendor status shows in vendor dashboard

---

## Logout / Session Tests

- [ ] Sign out from sidebar → lands on `/login`, session cleared
- [ ] Sign out from settings page → lands on `/login`, session cleared
- [ ] Sign out from navbar dropdown → lands on `/login`, session cleared
- [ ] After sign out, visiting `/dashboard` redirects to `/login`
- [ ] After sign out and sign in, session works normally

---

## Customer Full Flow

- [ ] Sign up as customer
- [ ] Confirm email (if required)
- [ ] Land on `/dashboard` — empty state shown
- [ ] Click "Create Event" → wizard works
- [ ] Complete wizard → event created, lands on event detail page
- [ ] Browse vendors via `/browse`
- [ ] Click vendor → view vendor profile
- [ ] Request quote → quote form submits
- [ ] View quote in `/dashboard/quotes`
- [ ] Browse bookings in `/dashboard/bookings`
- [ ] Check messages in `/dashboard/messages`
- [ ] Sign out

---

## Vendor Full Flow

- [ ] Sign up as vendor
- [ ] Complete vendor application at `/vendor/apply`
- [ ] Land on `/vendor/dashboard` with pending status
- [ ] (Admin approves vendor via `/admin/vendors`)
- [ ] Upload media at `/vendor/media`
- [ ] Add services at `/vendor/services`
- [ ] Update availability at `/vendor/availability`
- [ ] Respond to bookings at `/vendor/bookings`
- [ ] View analytics at `/vendor/analytics`

---

## Mobile Auth Tests

- [ ] Signup form works on mobile viewport (375px width)
- [ ] Login form works on mobile viewport
- [ ] Password show/hide toggle accessible on mobile
- [ ] Email confirmation message readable on mobile
- [ ] After login, mobile bottom nav appears and works
- [ ] Sign out accessible via mobile sidebar

---

## Auth Error Edge Cases

- [ ] Network offline during login → graceful error message
- [ ] Supabase project down → graceful error message
- [ ] Expired session → refresh to `/dashboard` works (middleware refreshes token)
- [ ] Signup with SQL-injection-style input → handled safely by Supabase client
- [ ] Very long email address → form validation catches it

---

## Root Causes Fixed (Summary)

| Issue | Fix |
|-------|-----|
| Admin blocked by role check in proxy | proxy.ts now checks `ADMIN_EMAILS` env var (consistent with page-level checks) |
| Signup redirected to protected route before email confirmation | Signup now checks `data.session`; if null shows "check email" message |
| Login session race condition | All sign-in redirects now use `window.location.href` (hard reload) |
| Sign-out race condition | All sign-out flows now use `window.location.href` (hard reload) |
| Seed test users had fake bcrypt hashes | Added `/api/auth/create-demo-users` endpoint using admin API |
| Logged-in user could revisit /login | proxy.ts now bounces authenticated users from auth pages |
| Missing vendor routes in middleware | proxy.ts now protects all vendor routes |
| "Sign Out" button in settings was dead (`href="#"`) | Created `SignOutButton` client component with real signOut |
