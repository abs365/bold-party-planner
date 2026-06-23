import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Target, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Users, Tag,
} from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";


// ── Constants ──────────────────────────────────────────────────────────────────

const TARGET_CATEGORIES = [
  "dj", "decorator", "photographer", "videographer", "caterer",
  "event_planner", "cake_maker", "balloon_decorator", "venue", "live_band", "mc",
] as const;

const CATEGORY_LABEL: Record<string, string> = {
  dj: "DJ", decorator: "Decorator", photographer: "Photographer",
  videographer: "Videographer", caterer: "Caterer", event_planner: "Event Planner",
  cake_maker: "Cake Maker", balloon_decorator: "Balloon Decorator",
  venue: "Venue", live_band: "Live Band", mc: "MC",
};

const OUTREACH_STATUSES = new Set([
  "outreach_sent", "follow_up_due", "responded", "interested",
  "registered", "verified", "approved", "active", "rejected",
]);
const RESPONSE_STATUSES  = new Set(["responded", "interested", "registered", "verified", "approved", "active"]);
const CONVERTED_STATUSES = new Set(["registered", "verified", "approved", "active"]);

const TARGETS = { approved: 20, quoteReady: 10, categories: 11 } as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function weekStartISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon.toISOString();
}

function weekLabel(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  return mon.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.min(100, Math.round((n / d) * 100));
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-slate-500">{icon}</span>
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</h2>
    </div>
  );
}

function TargetCard({ label, current, target }: { label: string; current: number; target: number }) {
  const gap      = target - current;
  const progress = pct(current, target);
  const done     = gap <= 0;
  return (
    <div className={`bg-white/4 border rounded-xl p-5 ${done ? "border-emerald-500/25" : "border-white/6"}`}>
      <p className="text-xs text-slate-500 font-light mb-3">{label}</p>
      <div className="flex items-end gap-3 mb-3">
        <span className={`text-3xl font-bold ${done ? "text-emerald-400" : "text-white"}`}>{current}</span>
        <span className="text-slate-600 text-sm font-light pb-0.5">/ {target}</span>
      </div>
      <div className="h-1.5 bg-white/6 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all ${done ? "bg-emerald-500" : "bg-brand-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={done ? "text-emerald-400 font-medium" : "text-slate-500 font-light"}>
          {done ? "Target reached" : `Gap: ${gap}`}
        </span>
        <span className="text-slate-600 font-light">{progress}%</span>
      </div>
    </div>
  );
}

function SupplyRow({
  label, value, accent,
}: { label: string; value: number; accent?: "emerald" | "brand" | "amber" }) {
  const colorMap = { emerald: "text-emerald-400", brand: "text-brand-400", amber: "text-amber-400" };
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400 font-light">{label}</span>
      <span className={`font-bold ${accent ? colorMap[accent] : "text-white"}`}>{value}</span>
    </div>
  );
}

function AcqRow({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div className="min-w-0">
        <span className="text-slate-400 font-light">{label}</span>
        {sub && <p className="text-xs text-slate-600 font-light mt-0.5">{sub}</p>}
      </div>
      <span className="font-bold text-white flex-shrink-0">{value}</span>
    </div>
  );
}

function GapBlock({
  title, categories, color,
}: { title: string; categories: readonly string[]; color: "red" | "amber" }) {
  const c = color === "red"
    ? { border: "border-red-500/20 bg-red-500/4", title: "text-red-400", chip: "bg-red-500/10 border-red-500/20 text-red-300" }
    : { border: "border-amber-500/20 bg-amber-500/4", title: "text-amber-400", chip: "bg-amber-500/10 border-amber-500/20 text-amber-300" };
  return (
    <div className={`border rounded-xl p-5 ${c.border}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${c.title}`}>{title}</p>
      {categories.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 font-light">
          <CheckCircle2 size={12} className="text-emerald-400" />
          All covered
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <span key={cat} className={`text-xs px-2.5 py-1 rounded-lg border font-light ${c.chip}`}>
              {CATEGORY_LABEL[cat] ?? cat}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ScoreboardPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const { data: profile } = await auth.db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  const db = auth.db;
  const ws  = weekStartISO();

  const [
    { data: vendorRows },
    { data: pkgRows },
    { data: mediaRows },
    { data: leadRows },
  ] = await Promise.all([
    db.from("vendors")
      .select("id, category, status, city, bio, phone, created_at")
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: true }),

    db.from("vendor_packages").select("vendor_id"),

    db.from("vendor_media").select("vendor_id").is("deleted_at", null),

    db.from("vendor_leads")
      .select("id, status, last_contacted_at, updated_at, created_at, category, region"),
  ]);

  // ── Vendor calculations ────────────────────────────────────────────────────
  const vendors  = vendorRows ?? [];
  const pkgSet   = new Set((pkgRows   ?? []).map((r) => r.vendor_id));
  const mediaSet = new Set((mediaRows ?? []).map((r) => r.vendor_id));

  const approved = vendors.filter((v) => v.status === "approved");
  const pending  = vendors.filter((v) => v.status === "pending");

  const quoteReady = approved.filter(
    (v) => v.bio && v.bio.length > 10 && v.phone && pkgSet.has(v.id) && mediaSet.has(v.id)
  );

  // Category breakdown (approved only)
  const catCount = new Map<string, number>();
  for (const v of approved) {
    catCount.set(v.category, (catCount.get(v.category) ?? 0) + 1);
  }

  const coveredCount   = TARGET_CATEGORIES.filter((c) => (catCount.get(c) ?? 0) >= 1).length;
  const zeroVendorCats = TARGET_CATEGORIES.filter((c) => (catCount.get(c) ?? 0) === 0);
  const oneVendorCats  = TARGET_CATEGORIES.filter((c) => (catCount.get(c) ?? 0) === 1);

  // Region breakdown (approved only, grouped by city)
  const regionCount = new Map<string, number>();
  for (const v of approved) {
    const city = v.city ?? "Unknown";
    regionCount.set(city, (regionCount.get(city) ?? 0) + 1);
  }
  const regionEntries = [...regionCount.entries()].sort((a, b) => b[1] - a[1]);

  // This week
  const newThisWeek = vendors.filter((v) => v.created_at >= ws).length;

  // ── Outreach calculations ──────────────────────────────────────────────────
  const leads = leadRows ?? [];

  const outreachSent      = leads.filter((l) => OUTREACH_STATUSES.has(l.status)).length;
  const responsesReceived = leads.filter((l) => RESPONSE_STATUSES.has(l.status)).length;
  const converted         = leads.filter((l) => CONVERTED_STATUSES.has(l.status)).length;

  const outreachThisWeek  = leads.filter(
    (l) => l.last_contacted_at && l.last_contacted_at >= ws
  ).length;
  const responsesThisWeek = leads.filter(
    (l) => RESPONSE_STATUSES.has(l.status) && l.updated_at && l.updated_at >= ws
  ).length;

  const responseRate   = outreachSent === 0 ? null : Math.round((responsesReceived / outreachSent) * 100);
  const activationRate = outreachSent === 0 ? null : Math.round((converted         / outreachSent) * 100);

  const resolvedUser = (profile ?? {
    id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const,
    full_name: null, phone: null, phone_verified: false,
    avatar_url: null, created_at: new Date().toISOString(),
  }) as Profile;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout user={resolvedUser} adminRole={auth.role}>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Target size={18} className="text-brand-400" />
              Founding Vendor Scoreboard
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-light">
              Week of {weekLabel()} · Live data
            </p>
          </div>
          <Link
            href="/admin/health"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-slate-400 text-xs hover:text-white transition-colors"
          >
            Health Dashboard <ArrowRight size={11} />
          </Link>
        </div>

        {/* ── 1. GROWTH TARGETS ─────────────────────────────────────────────── */}
        <section>
          <SectionTitle icon={<TrendingUp size={13} />} label="Growth Targets" />
          <div className="grid sm:grid-cols-3 gap-4">
            <TargetCard label="Approved Vendors"   current={approved.length}  target={TARGETS.approved} />
            <TargetCard label="Quote-Ready Vendors" current={quoteReady.length} target={TARGETS.quoteReady} />
            <TargetCard label="Covered Categories"  current={coveredCount}      target={TARGETS.categories} />
          </div>
        </section>

        {/* ── 2. VENDOR SUPPLY ──────────────────────────────────────────────── */}
        <section>
          <SectionTitle icon={<Users size={13} />} label="Vendor Supply" />

          <div className="grid sm:grid-cols-2 gap-4 mb-4">

            {/* Headline numbers */}
            <div className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-3">
              <SupplyRow label="Approved"      value={approved.length}    accent="emerald" />
              <SupplyRow label="Quote-Ready"   value={quoteReady.length}  accent="brand" />
              <SupplyRow label="Pending Review" value={pending.length}    accent="amber" />
              <div className="pt-1 border-t border-white/5">
                <SupplyRow label="Total Active" value={vendors.length} />
              </div>
            </div>

            {/* By region */}
            <div className="bg-white/4 border border-white/6 rounded-xl p-5">
              <p className="text-xs text-slate-500 font-medium mb-3 uppercase tracking-wider">By Region</p>
              {regionEntries.length === 0 ? (
                <p className="text-slate-600 text-xs font-light">No approved vendors yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {regionEntries.map(([region, count]) => (
                    <div key={region} className="flex items-center gap-3">
                      <span className="text-slate-300 text-sm font-light w-28 truncate">{region}</span>
                      <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-500/60"
                          style={{ width: `${pct(count, approved.length)}%` }}
                        />
                      </div>
                      <span className="text-white text-sm font-bold w-4 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* By category */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
            <p className="text-xs text-slate-500 font-medium mb-3 uppercase tracking-wider">
              By Category — Approved Vendors
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2.5">
              {TARGET_CATEGORIES.map((cat) => {
                const count  = catCount.get(cat) ?? 0;
                const status = count === 0 ? "zero" : count === 1 ? "one" : "good";
                return (
                  <div key={cat} className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      status === "zero" ? "bg-red-500/60" :
                      status === "one"  ? "bg-amber-500/60" :
                      "bg-emerald-500/60"
                    }`} />
                    <span className="text-slate-300 font-light flex-1">{CATEGORY_LABEL[cat]}</span>
                    <span className={`font-bold text-xs tabular-nums ${
                      status === "zero" ? "text-red-400" :
                      status === "one"  ? "text-amber-400" :
                      "text-emerald-400"
                    }`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 3. ACQUISITION ────────────────────────────────────────────────── */}
        <section>
          <SectionTitle icon={<Tag size={13} />} label="Acquisition Funnel" />
          <div className="grid sm:grid-cols-2 gap-4">

            {/* All-time pipeline */}
            <div className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-3">
              <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">All Time</p>
              <AcqRow label="Total Leads in Pipeline" value={leads.length} />
              <AcqRow
                label="Outreach Sent"
                value={outreachSent}
              />
              <AcqRow
                label="Responses Received"
                value={responsesReceived}
                sub={responseRate !== null ? `${responseRate}% response rate` : undefined}
              />
              <AcqRow
                label="Registered / Activated"
                value={converted}
                sub={activationRate !== null ? `${activationRate}% activation rate` : undefined}
              />
            </div>

            {/* This week */}
            <div className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-3">
              <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">This Week</p>
              <AcqRow label="New Vendor Applications" value={newThisWeek} />
              <AcqRow label="Outreach Sent"            value={outreachThisWeek} />
              <AcqRow label="Responses Received"       value={responsesThisWeek} />
            </div>
          </div>
        </section>

        {/* ── 4. COVERAGE GAPS ──────────────────────────────────────────────── */}
        <section>
          <SectionTitle icon={<AlertTriangle size={13} />} label="Coverage Gaps" />
          <div className="grid sm:grid-cols-2 gap-4">
            <GapBlock
              title={`Zero vendors (${zeroVendorCats.length})`}
              categories={zeroVendorCats}
              color="red"
            />
            <GapBlock
              title={`One vendor — fragile (${oneVendorCats.length})`}
              categories={oneVendorCats}
              color="amber"
            />
          </div>
        </section>

        {/* Quick links */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: "Vendor Activation",     href: "/admin/vendor-activation" },
            { label: "Lead CRM",              href: "/admin/vendor-acquisition" },
            { label: "Approve Pending",        href: "/admin/vendors" },
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
