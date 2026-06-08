import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Tag, MapPin, TrendingUp, AlertTriangle, CheckCircle2, Circle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

// ── Targets ───────────────────────────────────────────────────────────────────

const CATEGORY_TARGETS: Record<string, { label: string; target: number }> = {
  dj:                { label: "DJ",                target: 10 },
  photographer:      { label: "Photographer",      target: 10 },
  videographer:      { label: "Videographer",      target: 5  },
  decorator:         { label: "Decorator",         target: 8  },
  caterer:           { label: "Caterer",           target: 8  },
  venue_hire:        { label: "Venue",             target: 5  },
  event_planner:     { label: "Event Planner",     target: 5  },
  cake_maker:        { label: "Cake Maker",        target: 5  },
  balloon_decorator: { label: "Balloon Decorator", target: 5  },
  live_band:         { label: "Live Band",         target: 5  },
  mc:                { label: "MC / Host",         target: 5  },
};

const LOCATION_TARGETS: Record<string, number> = {
  London: 20,
  Kent:   15,
  Essex:  15,
};

const CITY_REGION_MAP: Record<string, string> = {
  chelmsford: "Essex", southend: "Essex", colchester: "Essex", basildon: "Essex",
  romford: "Essex", braintree: "Essex", harlow: "Essex", brentwood: "Essex",
  maidstone: "Kent", canterbury: "Kent", dover: "Kent", gillingham: "Kent",
  chatham: "Kent", tonbridge: "Kent", ashford: "Kent", sevenoaks: "Kent",
  sittingbourne: "Kent", dartford: "Kent",
  hackney: "London", brixton: "London", islington: "London", camden: "London",
  peckham: "London", lewisham: "London", croydon: "London", greenwich: "London",
  lambeth: "London", london: "London",
};

function cityToRegion(city: string | null): string | null {
  if (!city) return null;
  const lc = city.toLowerCase();
  for (const [kw, region] of Object.entries(CITY_REGION_MAP)) {
    if (lc.includes(kw)) return region;
  }
  return null;
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchCoverageData() {
  const db = await createAdminClient();

  // vendor_leads: count by category and by region (for pipeline)
  const { data: allLeads } = await db
    .from("vendor_leads")
    .select("category, region, status")
    .not("status", "in", "(rejected,not_suitable)");

  const leads = allLeads ?? [];

  // Approved vendors in platform: count by category and by city
  const { data: approvedVendors } = await db
    .from("vendors")
    .select("category, city")
    .eq("status", "approved");

  const vendors = approvedVendors ?? [];

  // ── Category breakdown ────────────────────────────────────────────────────

  const leadsByCategory: Record<string, number> = {};
  const leadsActivated: Record<string, number> = {}; // status=active in leads
  for (const l of leads) {
    if (!l.category) continue;
    leadsByCategory[l.category] = (leadsByCategory[l.category] ?? 0) + 1;
    if (l.status === "active") leadsActivated[l.category] = (leadsActivated[l.category] ?? 0) + 1;
  }

  const approvedByCategory: Record<string, number> = {};
  for (const v of vendors) {
    approvedByCategory[v.category] = (approvedByCategory[v.category] ?? 0) + 1;
  }

  const categoryRows = Object.entries(CATEGORY_TARGETS).map(([key, { label, target }]) => ({
    key,
    label,
    target,
    inPipeline:  leadsByCategory[key] ?? 0,
    approved:    approvedByCategory[key] ?? 0,
    gap:         Math.max(0, target - (approvedByCategory[key] ?? 0)),
    pct:         Math.min(100, Math.round(((approvedByCategory[key] ?? 0) / target) * 100)),
  }));

  // ── Geography breakdown ───────────────────────────────────────────────────

  const leadsByRegion: Record<string, number> = { London: 0, Kent: 0, Essex: 0 };
  for (const l of leads) {
    const r = l.region;
    if (r && r in leadsByRegion) leadsByRegion[r]++;
  }

  const approvedByRegion: Record<string, number> = { London: 0, Kent: 0, Essex: 0 };
  for (const v of vendors) {
    const r = v.city ? cityToRegion(v.city) : null;
    if (r && r in approvedByRegion) approvedByRegion[r]++;
  }

  const locationRows = Object.entries(LOCATION_TARGETS).map(([region, target]) => ({
    region,
    target,
    inPipeline: leadsByRegion[region] ?? 0,
    approved:   approvedByRegion[region] ?? 0,
    gap:        Math.max(0, target - (approvedByRegion[region] ?? 0)),
    pct:        Math.min(100, Math.round(((approvedByRegion[region] ?? 0) / target) * 100)),
  }));

  // ── Summary stats ──────────────────────────────────────────────────────────

  const totalApproved = vendors.length;
  const totalLeads = leads.length;
  const categoriesMet = categoryRows.filter((r) => r.pct >= 100).length;
  const categoriesStarted = categoryRows.filter((r) => r.pct > 0).length;

  return { categoryRows, locationRows, totalApproved, totalLeads, categoriesMet, categoriesStarted };
}

// ── Status indicator ──────────────────────────────────────────────────────────

function CoverageIndicator({ pct }: { pct: number }) {
  if (pct >= 100) return <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />;
  if (pct >= 50)  return <TrendingUp   size={14} className="text-amber-500 flex-shrink-0" />;
  if (pct > 0)    return <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />;
  return <Circle size={14} className="text-gray-300 flex-shrink-0" />;
}

function barColor(pct: number) {
  if (pct >= 100) return "#10b981";
  if (pct >= 50)  return "#f59e0b";
  if (pct > 0)    return "#f97316";
  return "#e5e7eb";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function VendorCoveragePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).maybeSingle();

  const data = await fetchCoverageData();

  const vendorProfileUser = (profile ?? {
    id: user.id, email: user.email ?? "", role: "admin" as const,
    full_name: null, phone: null, phone_verified: false,
    avatar_url: null, created_at: new Date().toISOString(),
  }) as Profile;

  return (
    <DashboardLayout user={vendorProfileUser}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-light text-gray-900 tracking-tight">Vendor Coverage</h1>
            <p className="text-sm text-gray-400 mt-1">Category and location targets versus approved vendors and pipeline leads.</p>
          </div>
          <Link
            href="/admin/vendor-acquisition"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Add Leads <ArrowRight size={13} />
          </Link>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Approved Vendors", value: data.totalApproved, color: "#0B1F4D" },
            { label: "Leads in Pipeline", value: data.totalLeads, color: "#6366f1" },
            { label: "Categories at Target", value: `${data.categoriesMet} / ${Object.keys(CATEGORY_TARGETS).length}`, color: "#16a34a" },
            { label: "Categories Started", value: `${data.categoriesStarted} / ${Object.keys(CATEGORY_TARGETS).length}`, color: "#d97706" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-5 text-center">
              <div className="text-2xl font-light tabular-nums" style={{ color }}>{value}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Category coverage */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Tag size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Category Coverage</h2>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 border-b border-gray-50">
              <div className="col-span-3">Category</div>
              <div className="col-span-2 text-center">Target</div>
              <div className="col-span-2 text-center">Approved</div>
              <div className="col-span-2 text-center">Pipeline</div>
              <div className="col-span-1 text-center">Gap</div>
              <div className="col-span-2">Coverage</div>
            </div>
            {data.categoryRows
              .sort((a, b) => b.gap - a.gap)
              .map((row) => (
                <div
                  key={row.key}
                  className="grid grid-cols-12 items-center px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <CoverageIndicator pct={row.pct} />
                    <span className="text-sm font-medium text-gray-800">{row.label}</span>
                  </div>
                  <div className="col-span-2 text-center text-sm text-gray-500">{row.target}</div>
                  <div className="col-span-2 text-center">
                    <span className={`text-sm font-semibold ${row.approved > 0 ? "text-emerald-600" : "text-gray-300"}`}>
                      {row.approved}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-sm ${row.inPipeline > 0 ? "text-blue-500" : "text-gray-300"}`}>
                      {row.inPipeline}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`text-sm font-bold ${row.gap > 5 ? "text-red-500" : row.gap > 0 ? "text-amber-500" : "text-emerald-600"}`}>
                      {row.gap > 0 ? `-${row.gap}` : "Met"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${row.pct}%`, background: barColor(row.pct) }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 tabular-nums w-8">{row.pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Location coverage */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Geography Coverage</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {data.locationRows.map((row) => (
              <div key={row.region} className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="font-semibold text-gray-900">{row.region}</span>
                  </div>
                  <CoverageIndicator pct={row.pct} />
                </div>

                <div className="text-4xl font-light text-gray-900 mb-1 tabular-nums">{row.approved}</div>
                <div className="text-xs text-gray-400 mb-4">approved vendors of {row.target} target</div>

                <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${row.pct}%`, background: barColor(row.pct) }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900 tabular-nums">{row.target}</div>
                    <div className="text-xs text-gray-400">Target</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-500 tabular-nums">{row.inPipeline}</div>
                    <div className="text-xs text-gray-400">Pipeline</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold tabular-nums ${row.gap > 0 ? "text-red-500" : "text-emerald-600"}`}>
                      {row.gap > 0 ? `-${row.gap}` : "Met"}
                    </div>
                    <div className="text-xs text-gray-400">Gap</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What to prioritise */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Priority Actions</h3>
          <div className="space-y-2">
            {data.categoryRows
              .filter((r) => r.gap > 0)
              .sort((a, b) => b.gap - a.gap)
              .slice(0, 5)
              .map((row) => (
                <div key={row.key} className="flex items-center gap-3 text-sm">
                  <AlertTriangle size={13} className={row.gap > 5 ? "text-red-400" : "text-amber-400"} />
                  <span className="text-gray-700">
                    Need <span className="font-semibold">{row.gap}</span> more {row.label} vendors
                    {row.inPipeline > 0 && (
                      <span className="text-gray-400"> ({row.inPipeline} in pipeline)</span>
                    )}
                  </span>
                </div>
              ))}
            {data.locationRows
              .filter((r) => r.gap > 0)
              .sort((a, b) => b.gap - a.gap)
              .map((row) => (
                <div key={row.region} className="flex items-center gap-3 text-sm">
                  <AlertTriangle size={13} className={row.gap > 8 ? "text-red-400" : "text-amber-400"} />
                  <span className="text-gray-700">
                    Need <span className="font-semibold">{row.gap}</span> more vendors in <span className="font-semibold">{row.region}</span>
                    {row.inPipeline > 0 && (
                      <span className="text-gray-400"> ({row.inPipeline} in pipeline)</span>
                    )}
                  </span>
                </div>
              ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50 flex gap-3">
            <Link
              href="/admin/vendor-acquisition"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white"
              style={{ background: "#0B1F4D" }}
            >
              Add Leads to Pipeline <ArrowRight size={11} />
            </Link>
            <Link
              href="/admin/vendor-growth"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Acquisition Funnel <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
