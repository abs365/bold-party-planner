import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Users, MapPin, Tag, ArrowRight, CheckCircle2, Clock, TrendingUp, Circle,
  Target, Send, Star, Zap,
} from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map((e) => e.trim()).filter(Boolean);

const CATEGORY_LABELS: Record<string, string> = {
  photographer: "Photographers", dj: "DJs", decorator: "Decorators",
  caterer: "Caterers", venue_hire: "Venues", entertainer: "Entertainers",
  cake_designer: "Cake Designers", event_planner: "Event Planners",
};

const CATEGORY_TARGETS: Record<string, number> = {
  dj: 10, photographer: 10, decorator: 8, caterer: 8, venue_hire: 5, entertainer: 5,
  cake_designer: 3, event_planner: 3,
};

const LOCATION_LABELS: Record<string, string> = {
  Essex: "Essex", Kent: "Kent", London: "London",
};

const LOCATION_TARGETS: Record<string, number> = {
  Essex: 15, Kent: 10, London: 20,
};

// ── Data ──────────────────────────────────────────────────────────────────────

async function fetchVendorGrowthData() {
  const db = await createAdminClient();
  const now  = new Date();
  const month = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();

  // All vendors with key fields
  const { data: allVendors } = await db
    .from("vendors")
    .select("id, category, city, status, subscription_plan, created_at")
    .order("created_at", { ascending: false });

  const vendors = allVendors ?? [];

  // Funnel counts
  const approved = vendors.filter(v => v.status === "approved");
  const pending   = vendors.filter(v => v.status === "pending");
  const rejected  = vendors.filter(v => v.status === "rejected");
  const all       = vendors;

  // Vendors with a booking
  const { data: bookedVendorIds } = await db
    .from("bookings")
    .select("vendor_id")
    .in("status", ["confirmed", "completed"]);

  const bookedSet = new Set((bookedVendorIds ?? []).map(b => b.vendor_id));
  const bookedVendors = approved.filter(v => bookedSet.has(v.id));

  // Active = approved + subscription not free OR has a booking
  const activeVendors = approved.filter(
    v => v.subscription_plan !== "free" || bookedSet.has(v.id)
  );

  // Category breakdown: approved
  const byCat: Record<string, number> = {};
  for (const v of approved) {
    byCat[v.category] = (byCat[v.category] ?? 0) + 1;
  }

  // Location breakdown: normalise city names
  const byLoc: Record<string, number> = { Essex: 0, Kent: 0, London: 0 };
  for (const v of approved) {
    const city = (v.city ?? "").toLowerCase();
    if (city.includes("essex") || ["chelmsford", "southend", "colchester", "basildon", "romford", "braintree", "harlow", "brentwood"].some(c => city.includes(c))) {
      byLoc["Essex"] = (byLoc["Essex"] ?? 0) + 1;
    } else if (city.includes("kent") || ["maidstone", "canterbury", "dover", "gillingham", "chatham", "tonbridge", "ashford", "sevenoaks", "sittingbourne", "dartford"].some(c => city.includes(c))) {
      byLoc["Kent"] = (byLoc["Kent"] ?? 0) + 1;
    } else if (city.includes("london") || ["hackney", "brixton", "islington", "camden", "peckham", "lewisham", "croydon", "greenwich", "lambeth"].some(c => city.includes(c))) {
      byLoc["London"] = (byLoc["London"] ?? 0) + 1;
    }
  }

  // Applications this week / month
  const week = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const appsThisWeek  = all.filter(v => v.created_at >= week).length;
  const appsThisMonth = all.filter(v => v.created_at >= month).length;

  const FUNNEL = [
    { stage: "Prospects",  count: "∞",              color: "text-slate-500",   note: "Vendors Elbold has not yet contacted" },
    { stage: "Contacted",  count: "Manual",          color: "text-slate-400",   note: "Track in outreach tracker" },
    { stage: "Interested", count: "Manual",          color: "text-slate-400",   note: "Track in outreach tracker" },
    { stage: "Applied",    count: all.length,        color: "text-blue-400",    note: `${appsThisMonth} in last 30 days` },
    { stage: "Approved",   count: approved.length,   color: "text-amber-400",   note: `${rejected.length} rejected, ${pending.length} pending` },
    { stage: "Active",     count: activeVendors.length, color: "text-emerald-400", note: "Paid plan or has booking" },
    { stage: "Booked",     count: bookedVendors.length, color: "text-purple-400",  note: "At least one confirmed booking" },
  ];

  // ── Vendor leads acquisition metrics ──────────────────────────────────────

  const today = new Date().toISOString().split("T")[0];
  const { data: allLeads } = await db
    .from("vendor_leads")
    .select("status, priority, next_follow_up_at, created_at");

  const leads = allLeads ?? [];
  const leadsNewToday    = leads.filter((l) => l.created_at.startsWith(today)).length;
  const leadsResearched  = leads.filter((l) => l.status === "researched").length;
  const leadsContacted   = leads.filter((l) => ["outreach_sent","responded"].includes(l.status)).length;
  const leadsFollowUpDue = leads.filter((l) => l.status === "follow_up_due" || (l.next_follow_up_at && l.next_follow_up_at < new Date().toISOString())).length;
  const leadsInterested  = leads.filter((l) => l.status === "interested").length;
  const leadsRegistered  = leads.filter((l) => l.status === "registered").length;
  const leadsApproved    = leads.filter((l) => l.status === "approved").length;
  const totalLeads       = leads.filter((l) => !["rejected","not_suitable"].includes(l.status)).length;

  const ACQUISITION_METRICS = [
    { label: "New Leads Today",   value: leadsNewToday,    target: 10, color: "#6366f1",  icon: Star },
    { label: "Researched",        value: leadsResearched,  target: 0,  color: "#3b82f6",  icon: Circle },
    { label: "Contacted",         value: leadsContacted,   target: 5,  color: "#7c3aed",  icon: Send },
    { label: "Follow-ups Due",    value: leadsFollowUpDue, target: 2,  color: "#ea580c",  icon: Clock },
    { label: "Interested",        value: leadsInterested,  target: 0,  color: "#16a34a",  icon: Star },
    { label: "Registered",        value: leadsRegistered,  target: 0,  color: "#059669",  icon: CheckCircle2 },
    { label: "Approved",          value: leadsApproved,    target: 2,  color: "#0B1F4D",  icon: Zap },
  ];

  return {
    funnel: FUNNEL,
    byCat,
    byLoc,
    appsThisWeek,
    appsThisMonth,
    totals: {
      all: all.length, approved: approved.length, pending: pending.length,
      rejected: rejected.length, active: activeVendors.length, booked: bookedVendors.length,
    },
    acquisition: {
      metrics: ACQUISITION_METRICS,
      totalLeads,
      leadsNewToday,
      leadsContacted,
      leadsFollowUpDue,
      leadsInterested,
      leadsRegistered,
      leadsApproved,
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function VendorGrowthPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).maybeSingle();

  const data = await fetchVendorGrowthData();

  const vendorProfileUser = (profile ?? {
    id: user.id, email: user.email ?? "", role: "admin" as const,
    full_name: null, phone: null, phone_verified: false,
    avatar_url: null, created_at: new Date().toISOString(),
  }) as Profile;

  return (
    <DashboardLayout user={vendorProfileUser}>
      <div className="max-w-5xl mx-auto space-y-6 pb-10">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-amber-400" />
              Vendor Growth
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-light">
              Acquisition funnel · category coverage · location spread
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/vendors"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/15 transition-colors"
            >
              Approve pending <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        {/* ── DAILY ACQUISITION DASHBOARD ───────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Daily Acquisition Metrics</h2>
            <Link href="/admin/vendor-acquisition" className="ml-auto text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
              Manage leads <ArrowRight size={10} />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {data.acquisition.metrics.slice(0, 4).map(({ label, value, target, color, icon: Icon }) => (
              <div key={label} className="bg-white/4 border border-white/8 rounded-xl p-4 text-center">
                <Icon size={14} className="mx-auto mb-1.5" style={{ color }} />
                <div className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</div>
                <div className="text-xs text-slate-500 font-light mt-0.5 leading-tight">{label}</div>
                {target > 0 && (
                  <div className="mt-2 text-xs text-slate-600 font-light">target: {target}/day</div>
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {data.acquisition.metrics.slice(4).map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-white/4 border border-white/8 rounded-xl p-4 text-center">
                <Icon size={14} className="mx-auto mb-1.5" style={{ color }} />
                <div className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</div>
                <div className="text-xs text-slate-500 font-light mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Daily targets */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-white/4 border border-white/8 rounded-xl px-5 py-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Daily Targets</h3>
              {[
                { label: "New leads added",      target: 10, actual: data.acquisition.leadsNewToday },
                { label: "Outreach messages",    target: 5,  actual: data.acquisition.leadsContacted },
                { label: "Follow-ups actioned",  target: 2,  actual: Math.max(0, data.acquisition.leadsFollowUpDue) },
              ].map(({ label, target, actual }) => {
                const pct = Math.min(100, Math.round((actual / target) * 100));
                return (
                  <div key={label} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-light">{label}</span>
                      <span className="font-semibold text-slate-300">{actual} / {target}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white/4 border border-white/8 rounded-xl px-5 py-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Weekly Targets</h3>
              {[
                { label: "Leads in pipeline",    target: 50, actual: data.acquisition.totalLeads },
                { label: "Outreach sent",        target: 25, actual: data.acquisition.leadsContacted },
                { label: "Interested vendors",   target: 5,  actual: data.acquisition.leadsInterested },
                { label: "Approved vendors",     target: 2,  actual: data.acquisition.leadsApproved },
              ].map(({ label, target, actual }) => {
                const pct = Math.min(100, Math.round((actual / target) * 100));
                return (
                  <div key={label} className="mb-2.5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-light">{label}</span>
                      <span className="font-semibold text-slate-300">{actual} / {target}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Weekly/monthly acquisition */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Applied this week",  value: data.appsThisWeek  },
            { label: "Applied this month", value: data.appsThisMonth },
            { label: "Approval rate",      value: data.totals.all > 0 ? `${Math.round((data.totals.approved / data.totals.all) * 100)}%` : "N/A" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/4 border border-white/8 rounded-xl p-5">
              <div className="text-xs text-slate-500 mb-1.5 font-light">{label}</div>
              <div className="text-2xl font-bold text-white">{value}</div>
            </div>
          ))}
        </div>

        {/* ── FUNNEL ──────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Acquisition Funnel</h2>
          </div>
          <div className="bg-white/3 border border-white/6 rounded-xl overflow-hidden">
            {data.funnel.map(({ stage, count, color, note }, i) => (
              <div
                key={stage}
                className={`flex items-center gap-4 px-5 py-4 ${
                  i < data.funnel.length - 1 ? "border-b border-white/4" : ""
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-200">{stage}</div>
                  <div className="text-xs text-slate-600 font-light mt-0.5">{note}</div>
                </div>
                <div className={`text-xl font-bold flex-shrink-0 ${color}`}>
                  {String(count)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-white/3 border border-white/6 rounded-xl px-5 py-3.5">
            <p className="text-xs text-slate-600 font-light">
              Prospects, Contacted, and Interested require manual tracking. Use your outreach CRM or spreadsheet.
              Applied → Booked are live from the database.
            </p>
          </div>
        </div>

        {/* ── CATEGORIES ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Categories: Approved Vendors</h2>
          </div>
          <div className="space-y-2.5">
            {Object.entries(CATEGORY_LABELS)
              .sort(([a], [b]) => (CATEGORY_TARGETS[b] ?? 0) - (CATEGORY_TARGETS[a] ?? 0))
              .map(([key, label]) => {
                const count  = data.byCat[key] ?? 0;
                const target = CATEGORY_TARGETS[key] ?? 5;
                const pct    = Math.min(100, Math.round((count / target) * 100));
                const isGood = pct >= 80;
                return (
                  <div key={key} className="bg-white/3 border border-white/6 rounded-xl px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isGood
                          ? <CheckCircle2 size={12} className="text-emerald-400" />
                          : count === 0
                          ? <Circle size={12} className="text-slate-700" />
                          : <Clock size={12} className="text-amber-400" />}
                        <span className="text-sm font-light text-slate-300">{label}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-light">{count} / {target} target</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: isGood ? "#34d399" : count === 0 ? "#374151" : "#f59e0b",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* ── LOCATIONS ───────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Locations: Approved Vendors</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {Object.entries(LOCATION_LABELS).map(([key, label]) => {
              const count  = data.byLoc[key] ?? 0;
              const target = LOCATION_TARGETS[key] ?? 10;
              const pct    = Math.min(100, Math.round((count / target) * 100));
              return (
                <div key={key} className="bg-white/3 border border-white/6 rounded-xl px-5 py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={13} className="text-slate-500" />
                    <span className="text-sm font-semibold text-slate-200">{label}</span>
                  </div>
                  <div className="text-3xl font-bold text-white mb-0.5">{count}</div>
                  <div className="text-xs text-slate-600 font-light mb-3">of {target} target</div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 80 ? "#34d399" : pct >= 40 ? "#f59e0b" : "#374151",
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-600 font-light mt-1.5">{pct}% of target</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 bg-white/3 border border-white/6 rounded-xl px-5 py-3.5">
            <p className="text-xs text-slate-600 font-light">
              Location matching uses city name keywords. Vendors in nearby towns (e.g. Chelmsford → Essex) are
              counted against the region. Vendors not matching Essex, Kent, or London show as unassigned.
              Unassigned count: {data.totals.approved - Object.values(data.byLoc).reduce((a, b) => a + b, 0)}.
            </p>
          </div>
        </div>

        {/* ── ACQUISITION TARGETS ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">90-Day Targets</h2>
          </div>
          <div className="bg-white/3 border border-white/6 rounded-xl px-5 py-4 space-y-3">
            {[
              { label: "Week 1: 10 approved vendors",  done: data.totals.approved >= 10,  progress: `${data.totals.approved}/10` },
              { label: "Week 2: 20 approved vendors",  done: data.totals.approved >= 20,  progress: `${data.totals.approved}/20` },
              { label: "Week 3: 35 approved vendors",  done: data.totals.approved >= 35,  progress: `${data.totals.approved}/35` },
              { label: "Week 4: 50 approved vendors",  done: data.totals.approved >= 50,  progress: `${data.totals.approved}/50` },
              { label: "All 3 locations covered",     done: Object.values(data.byLoc).every(c => c > 0), progress: `${Object.values(data.byLoc).filter(c => c > 0).length}/3 locations` },
              { label: "All 8 categories covered",    done: Object.keys(data.byCat).length >= 8, progress: `${Object.keys(data.byCat).length}/8 categories` },
            ].map(({ label, done, progress }) => (
              <div key={label} className="flex items-center gap-3">
                {done
                  ? <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                  : <Circle size={13} className="text-slate-700 flex-shrink-0" />}
                <span className={`text-sm font-light flex-1 ${done ? "text-slate-500 line-through" : "text-slate-300"}`}>
                  {label}
                </span>
                <span className="text-xs text-slate-600 font-light flex-shrink-0">{progress}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── NEXT ACTIONS ────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: "Review pending applications", href: "/admin/vendors" },
            { label: "View First 50 Playbook",      href: "/docs/First_50_Vendors_Playbook.md" },
            { label: "Founding Vendors page",        href: "/founding-vendors" },
            { label: "Vendor Standards",             href: "/vendor-standards" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 transition-colors text-xs text-slate-300 font-light group"
            >
              {label}
              <ArrowRight size={11} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
