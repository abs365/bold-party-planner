import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  CheckCircle2, Circle, AlertTriangle, ArrowRight,
  Users, Zap, Clock, BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";


// ── Types ─────────────────────────────────────────────────────────────────────

interface VendorRow {
  id: string;
  business_name: string | null;
  category: string;
  status: string;
  verification_level: number;
  bio: string | null;
  phone: string | null;
  city: string | null;
  min_price: number | null;
  subscription_plan: string | null;
  created_at: string;
}

interface ActivatedVendor extends VendorRow {
  mediaCount: number;
  packageCount: number;
  quoteCount: number;
  bookingCount: number;
  stages: boolean[];   // [s1..s9]
  stageIndex: number;  // 0-8, highest sequential stage reached
  quoteReady: boolean;
  daysApproved: number | null;
  daysToFirstQuote: number | null;
  activated: boolean;  // approved + quote within 30 days
}

// ── Activation logic ──────────────────────────────────────────────────────────

function computeStages(v: VendorRow & { mediaCount: number; packageCount: number; quoteCount: number; bookingCount: number }): boolean[] {
  const profileComplete = (v.bio ?? "").trim().length >= 50 && !!v.phone && !!v.city;
  return [
    true,                              // S1: application submitted (always true if record exists)
    (v.verification_level ?? 0) >= 2,  // S2: verification completed (gov ID approved)
    v.status === "approved",           // S3: approved
    profileComplete,                   // S4: profile completed
    v.mediaCount >= 1,                 // S5: media uploaded
    v.packageCount >= 1,               // S6: services added
    v.quoteCount >= 1,                 // S7: first quote received
    v.bookingCount >= 1,               // S8: first booking received
    !!v.subscription_plan && v.subscription_plan !== "free", // S9: subscribed to a paid plan
  ];
}

function highestSequentialStage(stages: boolean[]): number {
  let i = 0;
  while (i < stages.length && stages[i]) i++;
  return i; // 0 = none, 8 = all
}

const STAGE_LABELS = [
  "Applied",
  "Verified",
  "Approved",
  "Profile",
  "Media",
  "Services",
  "Quote",
  "Booking",
  "Subscribed",
];

const CATEGORY_LABELS: Record<string, string> = {
  photographer: "Photographer", dj: "DJ", decorator: "Decorator",
  caterer: "Caterer", venue_hire: "Venue", entertainer: "Entertainer",
  cake_designer: "Cake Designer", event_planner: "Event Planner",
  florist: "Florist", band: "Band", videographer: "Videographer",
  makeup_artist: "MUA", photo_booth: "Photo Booth", toastmaster: "Toastmaster",
  marquee_rental: "Marquee", lighting_stage: "Lighting", transport: "Transport",
  luxury_services: "Luxury", other: "Other",
};

// ── Data fetcher ──────────────────────────────────────────────────────────────

async function fetchActivationData(): Promise<ActivatedVendor[]> {
  const db = await createAdminClient();

  const { data: rawVendors } = await db
    .from("vendors")
    .select("id, business_name, category, status, verification_level, bio, phone, city, min_price, subscription_plan, created_at")
    .not("status", "eq", "rejected")
    .order("created_at", { ascending: true })
    .limit(50);

  if (!rawVendors || rawVendors.length === 0) return [];

  const ids = rawVendors.map((v) => v.id);

  const [
    { data: mediaRows },
    { data: packageRows },
    { data: quoteRows },
    { data: bookingRows },
  ] = await Promise.all([
    db.from("vendor_media").select("vendor_id").in("vendor_id", ids),
    db.from("vendor_packages").select("vendor_id").in("vendor_id", ids),
    db.from("quotes").select("vendor_id, created_at").in("vendor_id", ids).order("created_at", { ascending: true }),
    db.from("bookings").select("vendor_id").in("vendor_id", ids),
  ]);

  const mediaCounts:   Record<string, number> = {};
  const packageCounts: Record<string, number> = {};
  const quoteCounts:   Record<string, number> = {};
  const bookingCounts: Record<string, number> = {};
  const firstQuoteDates: Record<string, string> = {};

  for (const r of mediaRows   ?? []) mediaCounts[r.vendor_id]   = (mediaCounts[r.vendor_id] ?? 0) + 1;
  for (const r of packageRows ?? []) packageCounts[r.vendor_id] = (packageCounts[r.vendor_id] ?? 0) + 1;
  for (const r of bookingRows ?? []) bookingCounts[r.vendor_id] = (bookingCounts[r.vendor_id] ?? 0) + 1;

  for (const r of quoteRows ?? []) {
    quoteCounts[r.vendor_id] = (quoteCounts[r.vendor_id] ?? 0) + 1;
    if (!firstQuoteDates[r.vendor_id]) firstQuoteDates[r.vendor_id] = r.created_at as string;
  }

  const now = Date.now();

  return rawVendors.map((v) => {
    const extended = {
      ...v,
      verification_level: v.verification_level ?? 0,
      mediaCount:   mediaCounts[v.id]   ?? 0,
      packageCount: packageCounts[v.id] ?? 0,
      quoteCount:   quoteCounts[v.id]   ?? 0,
      bookingCount: bookingCounts[v.id] ?? 0,
    };

    const stages    = computeStages(extended);
    const stageIndex = highestSequentialStage(stages);
    const quoteReady = stages[0] && stages[2] && stages[3] && stages[4] && stages[5]; // approved + profile + media + services

    const approvedDate   = v.status === "approved" ? new Date(v.created_at) : null;
    const firstQuoteDate = firstQuoteDates[v.id] ? new Date(firstQuoteDates[v.id]) : null;

    const daysApproved    = approvedDate    ? Math.floor((now - approvedDate.getTime())    / 86400000) : null;
    const daysToFirstQuote = (approvedDate && firstQuoteDate)
      ? Math.floor((firstQuoteDate.getTime() - approvedDate.getTime()) / 86400000)
      : null;

    const activated = stages[2] && stages[6] && (daysToFirstQuote !== null ? daysToFirstQuote <= 30 : false);

    return { ...extended, stages, stageIndex, quoteReady, daysApproved, daysToFirstQuote, activated };
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StageChip({ done, label, index }: { done: boolean; label: string; index: number }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
        done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-700"
      }`}>
        {done ? <CheckCircle2 size={13} className="text-emerald-400" /> : index + 1}
      </div>
      <span className={`text-[9px] leading-none text-center font-light whitespace-nowrap ${
        done ? "text-slate-500" : "text-slate-700"
      }`}>
        {label}
      </span>
    </div>
  );
}

function FunnelBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-xs text-slate-400 font-light text-right flex-shrink-0">{label}</div>
      <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-8 text-right text-xs font-bold text-white">{count}</div>
      <div className="w-8 text-right text-xs text-slate-600 font-light">{pct}%</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function VendorActivationPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const { data: profile } = await auth.db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  const vendors = await fetchActivationData();

  // Funnel counts
  const totalVendors = vendors.length;
  const stageCounts = STAGE_LABELS.map((_, i) => vendors.filter((v) => v.stages[i]).length);

  // Needs attention: approved but stuck (approved + not quote-ready + > 3 days)
  const needsAttention = vendors.filter(
    (v) => v.status === "approved" && !v.quoteReady && (v.daysApproved ?? 0) >= 3
  );

  // Quote-ready but waiting (all stages 1-6 done, no quote yet)
  const waitingForCustomer = vendors.filter(
    (v) => v.quoteReady && v.quoteCount === 0
  );

  // Activated (quote within 30 days of approval)
  const activatedCount = vendors.filter((v) => v.activated).length;

  const vendorProfileUser = (profile ?? {
    id: auth.user.id, email: auth.user.email ?? "", role: "admin" as const,
    full_name: null, phone: null, phone_verified: false,
    avatar_url: null, created_at: new Date().toISOString(),
  }) as Profile;

  return (
    <DashboardLayout user={vendorProfileUser} adminRole={auth.role}>
      <div className="max-w-5xl mx-auto space-y-6 pb-10">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap size={18} className="text-amber-400" />
              Vendor Activation
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-light">
              Track each vendor from application through to a paid subscription
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/verifications"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-slate-400 text-xs hover:text-white transition-colors"
            >
              Verifications <ArrowRight size={11} />
            </Link>
            <Link
              href="/admin/vendors"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/15 transition-colors"
            >
              Approve pending <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total vendors",    value: totalVendors,                  sub: "all non-rejected" },
            { label: "Quote-ready",      value: vendors.filter(v => v.quoteReady).length,  sub: "stages 1-6 complete" },
            { label: "Received a quote", value: stageCounts[6],                sub: "stage 7 reached" },
            { label: "Activated (30d)",  value: activatedCount,                sub: "quote within 30 days", accent: true },
          ].map(({ label, value, sub, accent }) => (
            <div key={label} className="bg-white/4 border border-white/8 rounded-xl p-5">
              <div className="text-xs text-slate-500 mb-1.5 font-light">{label}</div>
              <div className={`text-2xl font-bold mb-0.5 ${accent ? "text-amber-400" : "text-white"}`}>{value}</div>
              <div className="text-xs text-slate-600 font-light">{sub}</div>
            </div>
          ))}
        </div>

        {/* ── NEEDS ATTENTION ─────────────────────────────────────────── */}
        {needsAttention.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/6 p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={14} className="text-amber-400" />
              <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                Needs Attention: {needsAttention.length} vendor{needsAttention.length !== 1 ? "s" : ""} stuck
              </h2>
            </div>
            <div className="space-y-3">
              {needsAttention.map((v) => {
                const missing: string[] = [];
                if ((v.bio ?? "").trim().length < 50 || !v.phone || !v.city) missing.push("profile incomplete");
                if (v.mediaCount === 0) missing.push("no photos");
                if (v.packageCount === 0) missing.push("no services");
                return (
                  <div key={v.id} className="flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="text-slate-200 font-medium">
                        {v.business_name ?? "Unnamed vendor"}
                      </span>
                      <span className="text-slate-500 font-light ml-2 text-xs">
                        {CATEGORY_LABELS[v.category] ?? v.category}
                      </span>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {missing.map((m) => (
                        <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-light">
                          {m}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-slate-600 font-light flex-shrink-0">
                      {v.daysApproved}d approved
                    </span>
                    <Link
                      href={`/admin/vendors?search=${encodeURIComponent(v.business_name ?? "")}`}
                      className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0"
                    >
                      View &rarr;
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── WAITING FOR CUSTOMER ────────────────────────────────────── */}
        {waitingForCustomer.length > 0 && (
          <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/6 px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={13} className="text-indigo-400" />
              <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                Quote-Ready: Waiting for Customers ({waitingForCustomer.length})
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-light mb-3">
              These vendors have completed all 6 setup stages. They need customer traffic, not coaching.
            </p>
            <div className="flex flex-wrap gap-2">
              {waitingForCustomer.map((v) => (
                <span key={v.id} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-slate-300 font-light">
                  {v.business_name ?? "Unnamed"}
                  <span className="text-slate-600 ml-1">({CATEGORY_LABELS[v.category] ?? v.category})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── STAGE FUNNEL ────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Activation Funnel</h2>
          </div>
          <div className="bg-white/3 border border-white/6 rounded-xl px-5 py-5 space-y-3">
            {STAGE_LABELS.map((label, i) => {
              const colors = [
                "bg-slate-500", "bg-blue-400", "bg-amber-400",
                "bg-purple-400", "bg-indigo-400", "bg-cyan-400",
                "bg-emerald-400", "bg-green-400",
              ];
              return (
                <FunnelBar
                  key={label}
                  label={`S${i + 1}: ${label}`}
                  count={stageCounts[i]}
                  total={totalVendors}
                  color={colors[i]}
                />
              );
            })}
          </div>
        </div>

        {/* ── PER-VENDOR TABLE ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BadgeCheck size={13} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Vendor Activation Board: {totalVendors} vendors
            </h2>
          </div>

          {vendors.length === 0 ? (
            <div className="bg-white/3 border border-white/6 rounded-xl px-5 py-10 text-center">
              <p className="text-slate-600 text-sm font-light">No vendors have applied yet.</p>
              <Link href="/admin/pilot/outreach" className="mt-3 inline-flex items-center gap-1.5 text-amber-400 text-xs hover:text-amber-300 transition-colors">
                View outreach pack <ArrowRight size={11} />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {vendors.map((v) => {
                const statusColor =
                  v.activated ? "border-emerald-500/30 bg-emerald-500/4" :
                  v.quoteReady ? "border-indigo-500/25 bg-indigo-500/4" :
                  v.status === "approved" ? "border-white/8 bg-white/3" :
                  "border-white/5 bg-white/2";

                return (
                  <Link
                    key={v.id}
                    href={`/admin/vendors?search=${encodeURIComponent(v.business_name ?? "")}`}
                    className={`block rounded-xl border px-4 py-3.5 hover:border-white/20 transition-colors ${statusColor}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Vendor name + category */}
                      <div className="min-w-0 w-44 flex-shrink-0">
                        <div className="text-sm font-medium text-slate-200 truncate">
                          {v.business_name ?? "Unnamed vendor"}
                        </div>
                        <div className="text-[11px] text-slate-600 font-light">
                          {CATEGORY_LABELS[v.category] ?? v.category}
                          {v.city ? ` · ${v.city}` : ""}
                        </div>
                      </div>

                      {/* Stage dots */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {STAGE_LABELS.map((label, i) => (
                          <StageChip key={label} done={v.stages[i]} label={label} index={i} />
                        ))}
                      </div>

                      {/* Right: status / days */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {v.activated && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 font-medium">
                            Activated
                          </span>
                        )}
                        {v.daysToFirstQuote !== null && !v.activated && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-light">
                            Quote: d+{v.daysToFirstQuote}
                          </span>
                        )}
                        {v.status === "pending" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/25 font-light">
                            Pending
                          </span>
                        )}
                        {v.daysApproved !== null && !v.activated && (
                          <span className="text-[10px] text-slate-700 font-light">
                            {v.daysApproved}d
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── LEGEND ──────────────────────────────────────────────────── */}
        <div className="bg-white/3 border border-white/6 rounded-xl px-5 py-4">
          <div className="text-xs text-slate-600 font-light mb-3">Stage definitions</div>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5">
            {[
              ["S1: Applied",   "Vendor application exists in the system"],
              ["S2: Verified",  "Government ID approved (verification level 2+)"],
              ["S3: Approved",  "Admin has approved the vendor profile"],
              ["S4: Profile",   "Bio 50+ chars, phone, and city all set"],
              ["S5: Media",     "At least one photo uploaded"],
              ["S6: Services",  "At least one package with pricing created"],
              ["S7: Quote",     "At least one customer has sent a quote request"],
              ["S8: Booking",   "At least one booking confirmed"],
            ].map(([stage, desc]) => (
              <div key={stage} className="flex gap-2 text-xs font-light">
                <span className="text-amber-400 flex-shrink-0 w-20">{stage}</span>
                <span className="text-slate-600">{desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/4 text-xs text-slate-600 font-light">
            <span className="text-emerald-400">Activated</span> = approved vendor who received a quote within 30 days of approval. &nbsp;
            <span className="text-indigo-400">Indigo border</span> = quote-ready, waiting for customer traffic.
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: "Approve pending vendors",    href: "/admin/vendors" },
            { label: "Review verifications",       href: "/admin/verifications" },
            { label: "Vendor outreach pack",       href: "/admin/pilot/outreach" },
            { label: "First 20 Activation Plan",  href: "/docs/First_20_Vendor_Activation_Plan.md" },
            { label: "Launch Freeze tracker",     href: "/admin/launch-freeze" },
            { label: "Vendor growth funnel",      href: "/admin/vendor-growth" },
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

        <p className="text-slate-700 text-xs text-center">
          All stage data is live from the database. Refresh to update.
        </p>
      </div>
    </DashboardLayout>
  );
}
