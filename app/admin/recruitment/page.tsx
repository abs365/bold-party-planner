import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdminRole } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Users, TrendingUp, CheckCircle2, ArrowRight, Target } from "lucide-react";

export const dynamic = "force-dynamic";


const FUNNEL_STAGES = [
  { key: "prospect",    label: "Prospect",    color: "bg-slate-500",   text: "text-slate-400" },
  { key: "contacted",   label: "Contacted",   color: "bg-blue-500",    text: "text-blue-400" },
  { key: "interested",  label: "Interested",  color: "bg-violet-500",  text: "text-violet-400" },
  { key: "registered",  label: "Registered",  color: "bg-amber-500",   text: "text-amber-400" },
  { key: "approved",    label: "Approved",    color: "bg-emerald-500", text: "text-emerald-400" },
  { key: "verified",    label: "Verified",    color: "bg-teal-500",    text: "text-teal-400" },
  { key: "active",      label: "Active",      color: "bg-green-500",   text: "text-green-400" },
  { key: "lost",        label: "Lost",        color: "bg-red-500",     text: "text-red-400" },
];

const SOFT_TARGET    = 25;
const STRETCH_TARGET = 50;

export default async function RecruitmentPage() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) redirect("/");
  const db = auth.db;
  const { data: profile } = await db.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();

  const [
    { data: pilotVendors },
    { count: approvedCount },
    { count: verifiedCount },
    { count: pendingCount },
  ] = await Promise.all([
    db.from("pilot_vendors").select("status, category, acquisition_source, created_at").order("created_at", { ascending: false }),
    db.from("vendors").select("*", { count: "exact", head: true }).eq("status", "approved"),
    db.from("vendors").select("*", { count: "exact", head: true }).gte("verification_level", 2),
    db.from("vendors").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const contacts = (pilotVendors ?? []) as Array<{ status: string; category?: string; acquisition_source?: string; created_at: string }>;

  const funnelCounts = Object.fromEntries(
    FUNNEL_STAGES.map((s) => [s.key, contacts.filter((c) => c.status === s.key).length])
  );

  const totalContacts = contacts.length;
  const activeVendors = approvedCount ?? 0;
  const conversionRate = totalContacts > 0 ? Math.round((activeVendors / totalContacts) * 100) : 0;

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  contacts.forEach((c) => {
    if (c.category) categoryCounts[c.category] = (categoryCounts[c.category] ?? 0) + 1;
  });
  const topCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  // Source breakdown
  const sourceCounts: Record<string, number> = {};
  contacts.forEach((c) => {
    const s = c.acquisition_source ?? "unknown";
    sourceCounts[s] = (sourceCounts[s] ?? 0) + 1;
  });

  // Weekly cadence: how many added in last 7 days
  const cutoff7 = new Date();
  cutoff7.setDate(cutoff7.getDate() - 7);
  const addedThisWeek = contacts.filter((c) => new Date(c.created_at) > cutoff7).length;

  return (
    <DashboardLayout user={{ id: auth.user.id, email: auth.user.email ?? "", role: "admin", full_name: profile?.full_name ?? null, phone: profile?.phone ?? null, phone_verified: profile?.phone_verified ?? false, avatar_url: profile?.avatar_url ?? null, created_at: profile?.created_at ?? new Date().toISOString() }} adminRole={auth.role}>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-400" />
              Vendor Recruitment
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Target: {SOFT_TARGET} quality vendors (stretch: {STRETCH_TARGET}). {activeVendors} approved so far.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/pilot/vendors" className="btn-secondary text-xs py-2">
              CRM <ArrowRight size={13} />
            </Link>
            <Link href="/admin/cohort" className="btn-secondary text-xs py-2">
              Approval Queue <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Progress toward target */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={15} className="text-brand-400" />
              <span className="text-sm font-semibold text-white">Progress to {SOFT_TARGET}-vendor target</span>
            </div>
            <span className="text-sm font-bold text-white">{activeVendors} / {SOFT_TARGET}</span>
          </div>
          <div className="bg-white/5 rounded-full h-3 overflow-hidden mb-1">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-700"
              style={{ width: `${Math.min(100, (activeVendors / SOFT_TARGET) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1.5">
            <span>0</span>
            <span className="text-slate-400">{SOFT_TARGET} soft target</span>
            <span>{STRETCH_TARGET} stretch</span>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total contacts",    value: totalContacts,     sub: `+${addedThisWeek} this week`, color: "text-white" },
            { label: "Approved vendors",  value: activeVendors,     sub: `${pendingCount ?? 0} pending review`, color: "text-emerald-400" },
            { label: "ID verified",       value: verifiedCount ?? 0, sub: "verification level 2+",     color: "text-blue-400" },
            { label: "Conversion rate",   value: `${conversionRate}%`, sub: "contact to approved",    color: "text-brand-400" },
          ].map((k) => (
            <div key={k.label} className="bg-white/4 border border-white/6 rounded-xl p-4">
              <div className="text-xs text-slate-500 mb-1">{k.label}</div>
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-xs text-slate-600 mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Funnel visualization */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Acquisition Funnel</h2>
          <div className="space-y-2">
            {FUNNEL_STAGES.filter((s) => s.key !== "lost").map((stage) => {
              const count = funnelCounts[stage.key] ?? 0;
              const pct = totalContacts > 0 ? (count / totalContacts) * 100 : 0;
              return (
                <div key={stage.key} className="flex items-center gap-4">
                  <span className={`text-xs font-medium w-20 text-right ${stage.text}`}>{stage.label}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-5 rounded-full ${stage.color} opacity-70 transition-all duration-700`}
                      style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
          {funnelCounts.lost > 0 && (
            <p className="text-xs text-slate-600 mt-2">
              {funnelCounts.lost} contacts marked as lost.
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Category breakdown */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">By Category</h2>
            {topCategories.length === 0 ? (
              <p className="text-slate-600 text-sm">No contacts yet.</p>
            ) : (
              <div className="space-y-2.5">
                {topCategories.map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 capitalize w-28 truncate">{cat}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-brand-500 opacity-70"
                        style={{ width: `${(count / (topCategories[0]?.[1] ?? 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-300 font-semibold w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acquisition source */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">By Source</h2>
            {Object.entries(sourceCounts).length === 0 ? (
              <p className="text-slate-600 text-sm">No contacts yet.</p>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(sourceCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([src, count]) => (
                    <div key={src} className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 capitalize">{src.replace(/_/g, " ")}</span>
                      <span className="text-xs font-semibold text-white">{count}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Recruitment actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { href: "/admin/pilot/vendors",   label: "Manage Outreach",       icon: Users,        sub: "Add contacts, update funnel status" },
            { href: "/admin/cohort",          label: "Review Pending Vendors", icon: CheckCircle2, sub: "Approve quality vendors from the queue" },
            { href: "/admin/verification-audit", label: "Verification Gaps",  icon: TrendingUp,   sub: "Chase outstanding verifications" },
          ].map(({ href, label, icon: Icon, sub }) => (
            <Link
              key={href}
              href={href}
              className="bg-white/4 border border-white/6 rounded-xl p-5 hover:border-white/10 transition-colors group"
            >
              <Icon size={16} className="text-brand-400 mb-3" />
              <div className="font-semibold text-white text-sm group-hover:text-brand-300 transition-colors">{label}</div>
              <div className="text-xs text-slate-500 mt-1">{sub}</div>
            </Link>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
