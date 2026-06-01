import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PilotDashboard } from "@/components/admin/PilotDashboard";
import { calculateVendorHealthScore } from "@/lib/vendor/health";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export default async function AdminPilotPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const db = await createAdminClient();

  // ── All parallel queries ───────────────────────────────────────────────────
  const [
    vendorsRes,
    allQuotesRes,
    allBookingsRes,
    customersRes,
    eventsRes,
    reviewsRes,
    verificationsRes,
    warningsRes,
    subsRes,
    alertsRes,
    govFlagsRes,
  ] = await Promise.all([
    // All vendors with full detail for funnel + tracker
    db.from("vendors").select(`
      id, business_name, category, status, verification_level, verified,
      rating, review_count, response_rate, completed_jobs_count,
      cancellation_rate, last_active_at, lead_count, conversion_count,
      min_price, bio, phone, city, instagram_url, website_url,
      subscription_plan, suspicious_flag, created_at,
      profile:profiles(full_name, email)
    `).order("created_at", { ascending: true }).limit(500),

    // All quotes — for funnel and vendor tracker
    db.from("quotes").select(
      "id, vendor_id, customer_id, status, created_at, responded_at, accepted_at"
    ).limit(5000),

    // All bookings — for revenue and vendor tracker
    db.from("bookings").select(
      "id, vendor_id, customer_id, total_amount, commission_amount, status, payment_status, created_at"
    ).limit(5000),

    // Customer count
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),

    // Events created
    db.from("events").select("id, customer_id", { count: "exact" }).limit(5000),

    // Reviews
    db.from("reviews").select("id, vendor_id, rating, created_at").limit(5000),

    // Pending verifications
    db.from("vendor_verifications")
      .select("id, vendor_id, status, type, created_at")
      .eq("status", "pending")
      .limit(100),

    // Active governance warnings
    db.from("vendor_warnings")
      .select("id, vendor_id, type, severity, created_at, vendor:vendors(business_name)")
      .eq("resolved", false)
      .limit(50),

    // Subscriptions
    db.from("vendor_subscriptions")
      .select("id, vendor_id, plan, status, billing_cycle, created_at")
      .in("status", ["active", "trialing"])
      .limit(200),

    // Unread admin alerts
    db.from("admin_alerts")
      .select("id, type, title, severity, created_at")
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(20),

    // Governance flags
    db.from("vendor_governance_flags")
      .select("id, vendor_id, flag_type, created_at")
      .eq("is_active", true)
      .limit(100),
  ]);

  const vendors       = vendorsRes.data ?? [];
  const allQuotes     = allQuotesRes.data ?? [];
  const allBookings   = allBookingsRes.data ?? [];
  const allReviews    = reviewsRes.data ?? [];
  const allEvents     = eventsRes.data ?? [];
  const subscriptions = subsRes.data ?? [];

  // ── Vendor funnel ──────────────────────────────────────────────────────────
  const totalVendors     = vendors.length;
  const pendingVendors   = vendors.filter((v) => v.status === "pending").length;
  const approvedVendors  = vendors.filter((v) => v.status === "approved").length;
  const suspendedVendors = vendors.filter((v) => v.status === "suspended").length;
  const rejectedVendors  = vendors.filter((v) => v.status === "rejected").length;
  const verifiedL1       = vendors.filter((v) => (v.verification_level ?? 0) >= 1).length;
  const verifiedL2Plus   = vendors.filter((v) => (v.verification_level ?? 0) >= 2).length;

  // Vendors who have received at least one quote lead
  const vendorIdsWithLeads   = new Set(allQuotes.map((q) => q.vendor_id));
  const vendorIdsWithQuote   = new Set(allQuotes.filter((q) => q.responded_at != null).map((q) => q.vendor_id));
  const vendorIdsWithBooking = new Set(allBookings.map((b) => b.vendor_id));

  const receivedLead    = vendors.filter((v) => vendorIdsWithLeads.has(v.id)).length;
  const submittedQuote  = vendors.filter((v) => vendorIdsWithQuote.has(v.id)).length;
  const wonBooking      = vendors.filter((v) => vendorIdsWithBooking.has(v.id)).length;

  const vendorFunnel = [
    { label: "Registered",        count: totalVendors,    note: "all time" },
    { label: "Application Sent",  count: totalVendors,    note: "= registered (form required)" },
    { label: "Approved",          count: approvedVendors, note: "admin approved" },
    { label: "Level 1 Verified",  count: verifiedL1,      note: "profile complete" },
    { label: "ID Verified",       count: verifiedL2Plus,  note: "document checked" },
    { label: "Received Lead",     count: receivedLead,    note: "got a quote request" },
    { label: "Submitted Quote",   count: submittedQuote,  note: "responded with price" },
    { label: "Won Booking",       count: wonBooking,      note: "booking created" },
  ];

  // ── Customer funnel ────────────────────────────────────────────────────────
  const totalCustomers         = customersRes.count ?? 0;
  const customersWithEvent     = new Set(allEvents.map((e) => e.customer_id)).size;
  const customersWithQuote     = new Set(allQuotes.map((q) => q.customer_id)).size;
  const customersWithResponse  = new Set(
    allQuotes.filter((q) => q.responded_at != null).map((q) => q.customer_id)
  ).size;
  const customersWithAccepted  = new Set(
    allQuotes.filter((q) => ["accepted", "converted"].includes(q.status)).map((q) => q.customer_id)
  ).size;
  const customersWithBooking   = new Set(allBookings.map((b) => b.customer_id)).size;

  const customerFunnel = [
    { label: "Signed Up",           count: totalCustomers },
    { label: "Created Event",        count: customersWithEvent },
    { label: "Requested Quote",      count: customersWithQuote },
    { label: "Received Response",    count: customersWithResponse },
    { label: "Accepted Quote",       count: customersWithAccepted },
    { label: "Booking Confirmed",    count: customersWithBooking },
  ];

  // ── Verification level distribution ───────────────────────────────────────
  const levelCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const v of vendors) {
    const l = v.verification_level ?? 0;
    levelCounts[Math.min(l, 4)] = (levelCounts[Math.min(l, 4)] ?? 0) + 1;
  }
  const verificationLevels = Object.entries(levelCounts).map(([level, count]) => ({
    level: Number(level),
    count,
  }));

  // ── Pilot vendor tracker ───────────────────────────────────────────────────
  // Build per-vendor maps from quotes and bookings
  type QuoteRow = { vendor_id: string; created_at: string; responded_at: string | null };
  type BookingRow = { vendor_id: string; created_at: string };

  const quotesByVendor = new Map<string, QuoteRow[]>();
  for (const q of allQuotes as QuoteRow[]) {
    if (!quotesByVendor.has(q.vendor_id)) quotesByVendor.set(q.vendor_id, []);
    quotesByVendor.get(q.vendor_id)!.push(q);
  }
  const bookingsByVendor = new Map<string, BookingRow[]>();
  for (const b of allBookings as BookingRow[]) {
    if (!bookingsByVendor.has(b.vendor_id)) bookingsByVendor.set(b.vendor_id, []);
    bookingsByVendor.get(b.vendor_id)!.push(b);
  }

  const pilotVendors = vendors
    .filter((v) => v.status === "approved")
    .map((v, index) => {
      const health  = calculateVendorHealthScore(v);
      const vQuotes = quotesByVendor.get(v.id) ?? [];
      const vBooks  = bookingsByVendor.get(v.id) ?? [];

      const firstLead = vQuotes.length > 0
        ? vQuotes.sort((a, b) => a.created_at.localeCompare(b.created_at))[0].created_at
        : null;
      const firstQuoteSubmitted = vQuotes.filter((q) => q.responded_at).length > 0
        ? vQuotes.filter((q) => q.responded_at).sort((a, b) => a.created_at.localeCompare(b.created_at))[0].created_at
        : null;
      const firstBooking = vBooks.length > 0
        ? vBooks.sort((a, b) => a.created_at.localeCompare(b.created_at))[0].created_at
        : null;

      const tags: string[] = [];
      if (index < 5) tags.push("Pilot Vendor");
      else if (index < 15) tags.push("Early Adopter");
      if ((v.verification_level ?? 0) >= 2 && (v.response_rate ?? 0) >= 70 && (v.lead_count ?? 0) > 0) {
        tags.push("High Potential");
      }

      return {
        id:                   v.id,
        business_name:        v.business_name,
        category:             v.category,
        verification_level:   v.verification_level ?? 0,
        status:               v.status,
        rating:               v.rating,
        review_count:         v.review_count ?? 0,
        response_rate:        v.response_rate,
        completed_jobs_count: v.completed_jobs_count ?? 0,
        last_active_at:       v.last_active_at,
        created_at:           v.created_at,
        first_lead:           firstLead,
        first_quote_submitted: firstQuoteSubmitted,
        first_booking:        firstBooking,
        health_score:         health.total,
        health_tier:          health.tier,
        tags,
        email:                (v.profile as { email?: string } | null)?.email ?? null,
      };
    });

  // ── Revenue ───────────────────────────────────────────────────────────────
  const confirmedBookingValue = allBookings
    .filter((b) => ["confirmed", "completed"].includes(b.status))
    .reduce((s, b) => s + (b.total_amount ?? 0), 0);
  const completedRevenue = allBookings
    .filter((b) => b.status === "completed")
    .reduce((s, b) => s + (b.total_amount ?? 0), 0);
  const platformRevenue = allBookings
    .filter((b) => b.status === "completed")
    .reduce((s, b) => s + (b.commission_amount ?? (b.total_amount ?? 0) * 0.1), 0);

  // Subscription revenue estimate
  const subPlanPrices: Record<string, number> = { free: 0, pro: 29, premium: 29, featured: 79, elite: 149 };
  const subscriptionRevenue = subscriptions.reduce((s, sub) => {
    const monthly = subPlanPrices[sub.plan] ?? 0;
    return s + (sub.billing_cycle === "annual" ? monthly * 10 : monthly);
  }, 0);

  // ── Health metrics ─────────────────────────────────────────────────────────
  const approvedVendorList = vendors.filter((v) => v.status === "approved");
  const avgRating = approvedVendorList.length > 0 && approvedVendorList.some((v) => (v.review_count ?? 0) > 0)
    ? approvedVendorList.filter((v) => (v.review_count ?? 0) > 0)
        .reduce((s, v) => s + (v.rating ?? 0), 0)
      / approvedVendorList.filter((v) => (v.review_count ?? 0) > 0).length
    : null;

  const avgResponseRate = approvedVendorList.length > 0
    ? approvedVendorList.reduce((s, v) => s + (v.response_rate ?? 0), 0) / approvedVendorList.length
    : null;

  const quoteResponseRate = allQuotes.length > 0
    ? Math.round((allQuotes.filter((q) => q.responded_at != null).length / allQuotes.length) * 100)
    : null;

  const acceptedQuotes  = allQuotes.filter((q) => ["accepted", "converted"].includes(q.status)).length;
  const respondedQuotes = allQuotes.filter((q) => q.responded_at != null).length;
  const bookingConvRate  = respondedQuotes > 0
    ? Math.round((acceptedQuotes / respondedQuotes) * 100)
    : null;

  // Vendors inactive 30+ days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const inactiveVendors = approvedVendorList.filter((v) => {
    if (!v.last_active_at) return true;
    return new Date(v.last_active_at) < thirtyDaysAgo;
  }).length;

  const lowResponseVendors = approvedVendorList.filter((v) =>
    (v.lead_count ?? 0) >= 3 && (v.response_rate ?? 100) < 50
  ).length;

  // ── Launch readiness targets ───────────────────────────────────────────────
  const launchTargets = [
    { label: "Pilot Vendors",      current: approvedVendors,  target: 10 },
    { label: "Verified Vendors",   current: verifiedL2Plus,   target: 5  },
    { label: "Quote Requests",     current: allQuotes.length, target: 20 },
    { label: "First Booking",      current: Math.min(allBookings.length, 1), target: 1 },
    { label: "First Payout",
      current: allBookings.filter((b) => b.status === "completed").length > 0 ? 1 : 0,
      target: 1
    },
  ];

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Pilot Operations</h1>
          <p className="text-white/50 text-sm mt-1">Are we becoming a real marketplace?</p>
        </div>
        <PilotDashboard
          vendorFunnel={vendorFunnel}
          customerFunnel={customerFunnel}
          verificationLevels={verificationLevels}
          pilotVendors={pilotVendors}
          health={{
            approvedVendors,
            pendingVendors,
            suspendedVendors,
            rejectedVendors,
            verifiedL2Plus,
            avgRating,
            avgResponseRate,
            quoteResponseRate,
            bookingConvRate,
            totalCustomers,
            totalQuotes:   allQuotes.length,
            totalBookings: allBookings.length,
            totalReviews:  allReviews.length,
            inactiveVendors,
            lowResponseVendors,
          }}
          revenue={{
            confirmedBookingValue,
            completedRevenue,
            platformRevenue,
            subscriptionRevenue,
            totalMarketplaceRevenue: platformRevenue + subscriptionRevenue,
          }}
          alerts={{
            pendingVerifications: verificationsRes.data?.length ?? 0,
            activeWarnings:       warningsRes.data?.length ?? 0,
            unreadAlerts:         alertsRes.data?.length ?? 0,
            govFlags:             govFlagsRes.data?.length ?? 0,
            inactiveVendors,
            lowResponseVendors,
          }}
          launchTargets={launchTargets}
        />
      </div>
    </DashboardLayout>
  );
}
