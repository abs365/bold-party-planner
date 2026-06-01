import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { Profile } from "@/types";
import { startOfWeek, subWeeks, format } from "date-fns";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

function weekStart(weeksAgo: number) {
  return startOfWeek(subWeeks(new Date(), weeksAgo), { weekStartsOn: 1 }).toISOString();
}

function Stat({ label, value, sub, color = "text-white" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-white/50 text-xs mt-0.5">{label}</p>
      {sub && <p className="text-white/25 text-xs">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, period }: { title: string; period: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-white font-semibold">{title}</h2>
      <span className="text-xs text-white/30">{period}</span>
    </div>
  );
}

export default async function PilotReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const db = await createAdminClient();

  const thisWeek = weekStart(0);
  const lastWeek = weekStart(1);
  const twoWeeks = weekStart(2);

  const [
    // Vendor growth
    vendorsThisWeek, vendorsLastWeek, approvedVendors, verifiedVendors,
    // Quote activity
    quotesThisWeek, quotesLastWeek, respondedThisWeek, acceptedThisWeek,
    // Booking activity
    bookingsThisWeek, bookingsLastWeek, completedBookings,
    // Revenue
    revenueThisWeek,
    // Feedback
    vendorFeedback, customerFeedback,
    // CRM
    pilotVendors,
    // All-time totals
    allVendors, allQuotes, allBookings,
  ] = await Promise.all([
    db.from("vendors").select("id", { count: "exact", head: true }).gte("created_at", thisWeek),
    db.from("vendors").select("id", { count: "exact", head: true }).gte("created_at", lastWeek).lt("created_at", thisWeek),
    db.from("vendors").select("id", { count: "exact", head: true }).eq("status", "approved"),
    db.from("vendors").select("id", { count: "exact", head: true }).gte("verification_level", 2),

    db.from("quotes").select("id", { count: "exact", head: true }).gte("created_at", thisWeek),
    db.from("quotes").select("id", { count: "exact", head: true }).gte("created_at", lastWeek).lt("created_at", thisWeek),
    db.from("quotes").select("id", { count: "exact", head: true }).not("responded_at", "is", null).gte("created_at", thisWeek),
    db.from("quotes").select("id", { count: "exact", head: true }).in("status", ["accepted","converted"]).gte("created_at", thisWeek),

    db.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", thisWeek),
    db.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", lastWeek).lt("created_at", thisWeek),
    db.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed"),

    db.from("bookings").select("total_amount, commission_amount").eq("status", "completed").gte("created_at", thisWeek),

    db.from("pilot_feedback").select("q_onboarding, q_verification, q_quoting, q_recommend, missing_features, additional_comments, created_at").eq("type", "vendor").order("created_at", { ascending: false }).limit(20),
    db.from("pilot_feedback").select("q_finding_vendors, q_requesting, q_comparing, q_trust, q_use_again, additional_comments, created_at").eq("type", "customer").order("created_at", { ascending: false }).limit(20),

    db.from("pilot_vendors").select("status, category, business_name, created_at"),

    db.from("vendors").select("id", { count: "exact", head: true }),
    db.from("quotes").select("id", { count: "exact", head: true }),
    db.from("bookings").select("id", { count: "exact", head: true }),
  ]);

  const revenueTotal = (revenueThisWeek.data ?? []).reduce((s, b) => s + (b.commission_amount ?? (b.total_amount ?? 0) * 0.1), 0);

  const vFeedback = vendorFeedback.data ?? [];
  const cFeedback = customerFeedback.data ?? [];

  function avg(arr: (number | null)[]): string {
    const valid = arr.filter((n): n is number => n != null);
    if (valid.length === 0) return "—";
    return (valid.reduce((s, n) => s + n, 0) / valid.length).toFixed(1);
  }

  const pilotByStatus = (pilotVendors.data ?? []).reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1;
    return acc;
  }, {});

  const reportDate = format(new Date(), "d MMMM yyyy");
  const weekLabel  = `Week of ${format(new Date(thisWeek), "d MMM yyyy")}`;

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Pilot Operations Report</h1>
            <p className="text-white/40 text-sm mt-1">Generated {reportDate} &middot; {weekLabel}</p>
          </div>
          <div className="text-right text-xs text-white/30">
            <p>All-time: {allVendors.count ?? 0} vendors</p>
            <p>{allQuotes.count ?? 0} quotes &middot; {allBookings.count ?? 0} bookings</p>
          </div>
        </div>

        {/* Vendor Growth */}
        <section>
          <SectionHeader title="Vendor Growth" period={weekLabel} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="New vendors this week"  value={vendorsThisWeek.count ?? 0}  color="text-brand-400" />
            <Stat label="New vendors last week"  value={vendorsLastWeek.count ?? 0}  color="text-white/60" />
            <Stat label="Total approved"         value={approvedVendors.count ?? 0}  color="text-emerald-400" />
            <Stat label="Verified (Level 2+)"    value={verifiedVendors.count ?? 0}  sub="Target: 5" color="text-blue-400" />
          </div>
        </section>

        {/* CRM Pipeline */}
        <section>
          <SectionHeader title="Outreach Pipeline" period="All-time" />
          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {["prospect","contacted","interested","registered","approved","verified","active","lost"].map((s) => (
                <div key={s} className="text-center">
                  <p className="text-xl font-bold text-white">{pilotByStatus[s] ?? 0}</p>
                  <p className="text-xs text-white/30 capitalize mt-0.5">{s}</p>
                </div>
              ))}
            </div>
            {(pilotVendors.data ?? []).slice(0, 5).length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/6 space-y-1.5">
                <p className="text-white/30 text-xs mb-2">Recent additions</p>
                {(pilotVendors.data ?? []).slice(0, 5).map((v) => (
                  <div key={v.business_name + v.created_at} className="flex items-center justify-between text-xs">
                    <span className="text-white/70">{v.business_name}</span>
                    <span className="text-white/30 capitalize">{v.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Quote Activity */}
        <section>
          <SectionHeader title="Quote Activity" period={weekLabel} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Quote requests"  value={quotesThisWeek.count ?? 0}     color="text-yellow-400" sub={`vs ${quotesLastWeek.count ?? 0} last week`} />
            <Stat label="Responded"       value={respondedThisWeek.count ?? 0}  color="text-blue-400" />
            <Stat label="Accepted"        value={acceptedThisWeek.count ?? 0}   color="text-emerald-400" sub="Target: 5 total" />
            <Stat label="Response rate"   value={quotesThisWeek.count ? Math.round(((respondedThisWeek.count ?? 0) / (quotesThisWeek.count ?? 1)) * 100) + "%" : "—"} />
          </div>
        </section>

        {/* Booking & Revenue */}
        <section>
          <SectionHeader title="Bookings & Revenue" period={weekLabel} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="New bookings"     value={bookingsThisWeek.count ?? 0}  color="text-green-400" sub={`vs ${bookingsLastWeek.count ?? 0} last week`} />
            <Stat label="Completed"        value={completedBookings.count ?? 0} color="text-emerald-400" sub="Target: 1" />
            <Stat label="Platform revenue" value={`£${revenueTotal.toFixed(0)}`} color="text-brand-400" sub="this week" />
            <Stat label="Revenue target"   value="£0 → £1" color="text-white/30" sub="First payout pending" />
          </div>
        </section>

        {/* Vendor Feedback */}
        <section>
          <SectionHeader title="Vendor Feedback" period={`${vFeedback.length} response${vFeedback.length !== 1 ? "s" : ""}`} />
          {vFeedback.length === 0 ? (
            <div className="bg-white/4 border border-white/6 rounded-xl p-6 text-center text-white/30 text-sm">
              No vendor feedback yet. Share the link: /vendor/feedback
            </div>
          ) : (
            <div className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Onboarding ease"   value={avg(vFeedback.map((f) => f.q_onboarding))}   sub="/ 5" color="text-brand-400" />
                <Stat label="Verification ease" value={avg(vFeedback.map((f) => f.q_verification))} sub="/ 5" color="text-brand-400" />
                <Stat label="Quoting ease"      value={avg(vFeedback.map((f) => f.q_quoting))}      sub="/ 5" color="text-brand-400" />
                <Stat label="NPS (recommend)"   value={avg(vFeedback.map((f) => f.q_recommend))}    sub="/ 5" color="text-brand-400" />
              </div>
              {vFeedback.some((f) => f.missing_features || f.additional_comments) && (
                <div className="space-y-3 pt-3 border-t border-white/6">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">Written Responses</p>
                  {vFeedback
                    .filter((f) => f.missing_features || f.additional_comments)
                    .map((f, i) => (
                      <div key={i} className="bg-white/3 rounded-lg p-3 space-y-1">
                        {f.missing_features && <p className="text-white/60 text-xs"><span className="text-white/30">Missing: </span>{f.missing_features}</p>}
                        {f.additional_comments && <p className="text-white/60 text-xs"><span className="text-white/30">Comments: </span>{f.additional_comments}</p>}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Customer Feedback */}
        <section>
          <SectionHeader title="Customer Feedback" period={`${cFeedback.length} response${cFeedback.length !== 1 ? "s" : ""}`} />
          {cFeedback.length === 0 ? (
            <div className="bg-white/4 border border-white/6 rounded-xl p-6 text-center text-white/30 text-sm">
              No customer feedback yet. Share the link: /dashboard/feedback
            </div>
          ) : (
            <div className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <Stat label="Finding vendors"  value={avg(cFeedback.map((f) => f.q_finding_vendors))} sub="/ 5" color="text-blue-400" />
                <Stat label="Requesting quote" value={avg(cFeedback.map((f) => f.q_requesting))}      sub="/ 5" color="text-blue-400" />
                <Stat label="Comparing quotes" value={avg(cFeedback.map((f) => f.q_comparing))}       sub="/ 5" color="text-blue-400" />
                <Stat label="Trust level"      value={avg(cFeedback.map((f) => f.q_trust))}           sub="/ 5" color="text-blue-400" />
                <Stat label="Use again"        value={avg(cFeedback.map((f) => f.q_use_again))}       sub="/ 5" color="text-blue-400" />
              </div>
              {cFeedback.some((f) => f.additional_comments) && (
                <div className="space-y-2 pt-3 border-t border-white/6">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">Comments</p>
                  {cFeedback.filter((f) => f.additional_comments).map((f, i) => (
                    <div key={i} className="bg-white/3 rounded-lg p-3">
                      <p className="text-white/60 text-xs">{f.additional_comments}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Success Criteria */}
        <section>
          <SectionHeader title="Pilot Success Criteria" period="All-time" />
          <div className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-4">
            {[
              { label: "Vendors onboarded",     current: approvedVendors.count ?? 0, target: 10 },
              { label: "Vendors verified L2+",  current: verifiedVendors.count ?? 0, target: 5  },
              { label: "Quote requests",        current: allQuotes.count ?? 0,       target: 20 },
              { label: "Accepted quotes",       current: acceptedThisWeek.count ?? 0, target: 5 },
              { label: "Completed bookings",    current: completedBookings.count ?? 0, target: 1 },
            ].map(({ label, current, target }) => {
              const pct     = Math.min(100, target > 0 ? Math.round((current / target) * 100) : 0);
              const done    = current >= target;
              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">{label}</span>
                    <span className={done ? "text-emerald-400 font-semibold" : "text-white/50"}>{current} / {target}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-brand-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
