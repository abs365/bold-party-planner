# Bold Party — Launch Checklist

Use this checklist before going live. Check off each item as it's completed.

---

## 🏗️ Infrastructure

- [ ] Supabase project created in correct region (EU for UK users)
- [ ] All 7 database migrations run in order (001 through 007)
- [ ] Supabase storage buckets created (`vendor-images`, `vendor-videos`, `avatars`)
- [ ] Storage bucket RLS policies applied
- [ ] Supabase Auth: site URL and redirect URLs configured
- [ ] Vercel project connected to repository
- [ ] Custom domain configured and SSL active
- [ ] All environment variables set in Vercel (production)

## 💳 Stripe

- [ ] Stripe account in live mode (not test mode)
- [ ] Pro subscription product created (£29/month)
- [ ] Featured subscription product created (£79/month)
- [ ] Price IDs saved in Vercel env vars
- [ ] Webhook endpoint created: `https://yourdomain.co.uk/api/payments/webhook`
- [ ] Webhook listening to: `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Webhook signing secret saved in Vercel env vars
- [ ] Test payment processed end-to-end (deposit + full payment)
- [ ] Test refund processed
- [ ] Stripe email receipts disabled (we send our own via Resend)

## 📧 Email (Resend)

- [ ] Domain added and verified in Resend
- [ ] DKIM, SPF, DMARC DNS records configured
- [ ] Test emails delivered to inbox (not spam)
- [ ] FROM address updated in `lib/resend/index.ts`
- [ ] Unsubscribe link updated to real URL
- [ ] All transactional email templates tested:
  - [ ] Vendor application received
  - [ ] Vendor approved
  - [ ] Vendor rejected
  - [ ] Booking request (vendor)
  - [ ] Booking accepted (customer)
  - [ ] Booking rejected (customer)
  - [ ] Payment confirmed
  - [ ] Refund processed
  - [ ] Event reminder

## 🔐 Security

- [ ] `ADMIN_EMAILS` set to real admin email(s)
- [ ] Admin account created and tested at `/admin`
- [ ] No test/debug credentials in production code
- [ ] Supabase RLS enabled on all tables (verified in DB)
- [ ] Service role key NOT exposed in frontend code
- [ ] Rate limiting working on AI endpoints
- [ ] Stripe webhook signature verification working

## 🏪 Platform Content

- [ ] Admin account created
- [ ] At least 5 demo/seed vendors created and approved
- [ ] Vendors have: photos, description, packages, city, pricing
- [ ] At least 1 vendor per major category (DJ, photographer, caterer, decorator)
- [ ] Featured vendors set for homepage showcase
- [ ] Sample events created in dashboard
- [ ] Platform looks "alive" with real-looking data

## 📄 Legal & Compliance

- [ ] Privacy Policy reviewed and published at `/privacy`
- [ ] Terms of Service reviewed and published at `/terms`
- [ ] Refund Policy reviewed and published at `/refunds`
- [ ] Vendor Terms reviewed and published at `/vendor-terms`
- [ ] Booking Protection page published at `/booking-protection`
- [ ] Community Guidelines published at `/community-guidelines`
- [ ] Footer links to all legal pages working
- [ ] Contact email addresses set up and monitored:
  - [ ] support@yourdomain.co.uk
  - [ ] legal@yourdomain.co.uk
  - [ ] disputes@yourdomain.co.uk
  - [ ] safety@yourdomain.co.uk
  - [ ] urgent@yourdomain.co.uk

## 🔍 SEO

- [ ] `/robots.txt` accessible and correct
- [ ] `/sitemap.xml` accessible and includes all key pages
- [ ] Google Search Console: site submitted
- [ ] OG tags set on homepage, category pages, vendor profiles
- [ ] JSON-LD structured data on vendor profile pages
- [ ] Canonical URLs set on all pages

## 📱 Device Testing

- [ ] Homepage: mobile (375px), tablet (768px), desktop (1440px)
- [ ] Signup and login flows on mobile
- [ ] Vendor browse and filter on mobile
- [ ] Booking request flow on mobile
- [ ] Payment flow on mobile
- [ ] Vendor dashboard on mobile
- [ ] Customer dashboard on mobile
- [ ] Messaging on mobile
- [ ] Notifications on mobile

## ⚡ Performance

- [ ] Lighthouse score > 80 on mobile (Performance)
- [ ] Largest Contentful Paint < 3s on mobile
- [ ] No unused JavaScript bundles > 500KB
- [ ] Images have correct `sizes` attribute
- [ ] No console errors on key pages (home, browse, vendor profile)

## 🧪 End-to-End Test Flows

### Customer Flow
- [ ] Sign up → create event → browse vendors → request quote
- [ ] Receive booking request → pay deposit → receive confirmation email
- [ ] Leave review after event

### Vendor Flow
- [ ] Apply as vendor → receive approval email → complete profile
- [ ] Upload 5+ photos → create 2 packages → set availability
- [ ] Receive booking request → accept → view payment received

### Admin Flow
- [ ] Log in to `/admin`
- [ ] Approve a pending vendor application
- [ ] View platform analytics
- [ ] Manage a dispute

## 🚀 Launch Day

- [ ] Final build passes: `npm run build`
- [ ] Final lint passes: `npm run lint`
- [ ] TypeScript check passes: `npx tsc --noEmit`
- [ ] Vercel deployment successful
- [ ] DNS propagated fully
- [ ] Announce on social media
- [ ] Monitor Vercel logs for first 30 minutes
- [ ] Monitor Stripe webhook deliveries
- [ ] Monitor Resend email delivery rates

---

## 🚨 Emergency Contacts

| Issue | Contact |
|-------|---------|
| Platform down | Check Vercel status → vercel.com/status |
| Database issues | Supabase dashboard → supabase.com/dashboard |
| Payment failures | Stripe dashboard → dashboard.stripe.com |
| Email delivery | Resend dashboard → resend.com/emails |

---

## 🗓️ Post-Launch (First 30 days)

- [ ] Monitor error logs daily
- [ ] Review all new vendor applications within 48h
- [ ] Respond to all support emails within 24h
- [ ] Check weekly analytics in `/admin/analytics`
- [ ] Collect feedback from first 10 customers
- [ ] Identify and fix top 3 UX issues
- [ ] Add real customer testimonials to homepage

---

*Last updated: May 2026*
