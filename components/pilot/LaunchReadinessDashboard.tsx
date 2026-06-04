"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Users, Store, Shield, Bug, Star, TrendingUp,
  AlertTriangle, CheckCircle2, ExternalLink,
} from "lucide-react";

interface Submission {
  id: string;
  test_type: "customer" | "vendor" | "admin";
  tester_name: string;
  tester_email: string;
  rating: number;
  results: {
    steps?: Record<string, string>;
    device?: string;
    category?: string;
  };
  comments: string | null;
  critical_bugs: number;
  high_bugs: number;
  medium_bugs: number;
  low_bugs: number;
  submitted_at: string;
}

interface LaunchReadinessDashboardProps {
  submissions: Submission[];
  bugCount: { critical: number; high: number; medium: number; low: number; total: number };
}

function passRate(subs: Submission[]): number {
  if (subs.length === 0) return 0;
  const passed = subs.filter((s) => {
    const steps = s.results?.steps ?? {};
    const vals = Object.values(steps);
    if (vals.length === 0) return true;
    const passCount = vals.filter((v) => v === "pass").length;
    return passCount / vals.length >= 0.7;
  }).length;
  return Math.round((passed / subs.length) * 100);
}

function avgRating(subs: Submission[]): string {
  if (subs.length === 0) return "—";
  const avg = subs.reduce((s, r) => s + r.rating, 0) / subs.length;
  return avg.toFixed(1);
}

function computeReadiness(submissions: Submission[], bugs: { critical: number; high: number; medium: number; low: number }) {
  const customerSubs = submissions.filter((s) => s.test_type === "customer");
  const vendorSubs   = submissions.filter((s) => s.test_type === "vendor");
  const adminSubs    = submissions.filter((s) => s.test_type === "admin");

  const cpr = passRate(customerSubs);
  const vpr = passRate(vendorSubs);
  const apr = passRate(adminSubs);

  const hasData = submissions.length > 0;
  const baseScore = hasData
    ? cpr * 0.4 + vpr * 0.35 + apr * 0.25
    : 0;

  const penalty = bugs.critical * 15 + bugs.high * 5 + bugs.medium * 2 + bugs.low * 0.5;
  const score   = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  let label: string;
  let color: string;
  let bg: string;
  if (score >= 85)      { label = "READY FOR PUBLIC LAUNCH";     color = "text-green-400";  bg = "bg-green-500/15 border-green-500/25"; }
  else if (score >= 70) { label = "READY FOR MORE TESTERS";      color = "text-blue-400";   bg = "bg-blue-500/15 border-blue-500/25"; }
  else if (score >= 50) { label = "NEEDS WORK";                  color = "text-amber-400";  bg = "bg-amber-500/15 border-amber-500/25"; }
  else                  { label = "NOT READY";                   color = "text-red-400";    bg = "bg-red-500/15 border-red-500/25"; }

  return { score, label, color, bg, cpr, vpr, apr, penalty: Math.round(penalty) };
}

export function LaunchReadinessDashboard({ submissions, bugCount }: LaunchReadinessDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "recent">("overview");

  const customerSubs = submissions.filter((s) => s.test_type === "customer");
  const vendorSubs   = submissions.filter((s) => s.test_type === "vendor");
  const adminSubs    = submissions.filter((s) => s.test_type === "admin");

  const readiness = computeReadiness(submissions, bugCount);

  const overallRating = submissions.length > 0
    ? (submissions.reduce((s, r) => s + r.rating, 0) / submissions.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pilot Testing Centre</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time launch readiness from pilot tester submissions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/testing/customer" target="_blank" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
            <ExternalLink size={11} /> Customer Form
          </Link>
          <Link href="/testing/vendor" target="_blank" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
            <ExternalLink size={11} /> Vendor Form
          </Link>
          <Link href="/testing/admin" target="_blank" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
            <ExternalLink size={11} /> Admin Form
          </Link>
        </div>
      </div>

      {/* Launch Readiness Score — hero card */}
      <div className={cn("border rounded-2xl p-6", readiness.bg)}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Launch Readiness Score</p>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-6xl font-extrabold text-white">{readiness.score}</span>
              <span className="text-2xl text-slate-400 mb-2">/100</span>
            </div>
            <div className={cn("inline-block px-3 py-1.5 rounded-full text-sm font-bold border", readiness.bg, readiness.color)}>
              {readiness.label}
            </div>
          </div>
          <div className="flex-shrink-0">
            {/* Progress ring visual */}
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={readiness.score >= 85 ? "#22c55e" : readiness.score >= 70 ? "#60a5fa" : readiness.score >= 50 ? "#fbbf24" : "#f87171"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(readiness.score / 100) * 314} 314`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{readiness.score}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-slate-400 text-xs mb-1">Customer Pass Rate</div>
            <div className="font-bold text-white">{submissions.length === 0 ? "—" : `${readiness.cpr}%`}</div>
            <div className="text-xs text-slate-500">{customerSubs.length} submission{customerSubs.length !== 1 ? "s" : ""}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs mb-1">Vendor Pass Rate</div>
            <div className="font-bold text-white">{submissions.length === 0 ? "—" : `${readiness.vpr}%`}</div>
            <div className="text-xs text-slate-500">{vendorSubs.length} submission{vendorSubs.length !== 1 ? "s" : ""}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs mb-1">Admin Pass Rate</div>
            <div className="font-bold text-white">{submissions.length === 0 ? "—" : `${readiness.apr}%`}</div>
            <div className="text-xs text-slate-500">{adminSubs.length} submission{adminSubs.length !== 1 ? "s" : ""}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs mb-1">Bug Penalty</div>
            <div className="font-bold text-red-400">-{readiness.penalty}</div>
            <div className="text-xs text-slate-500">{bugCount.total} bug{bugCount.total !== 1 ? "s" : ""} reported</div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Testing Summary */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">Total Tests</span>
            <TrendingUp size={15} className="text-brand-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{submissions.length}</div>
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between"><span className="flex items-center gap-1"><Users size={10} /> Customer</span><span className="text-white font-medium">{customerSubs.length}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-1"><Store size={10} /> Vendor</span><span className="text-white font-medium">{vendorSubs.length}</span></div>
            <div className="flex justify-between"><span className="flex items-center gap-1"><Shield size={10} /> Admin</span><span className="text-white font-medium">{adminSubs.length}</span></div>
          </div>
        </div>

        {/* Bug Summary */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">Bugs Reported</span>
            <Bug size={15} className="text-red-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{bugCount.total}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-red-400">Critical</span><span className="text-white font-medium">{bugCount.critical}</span></div>
            <div className="flex justify-between"><span className="text-orange-400">High</span><span className="text-white font-medium">{bugCount.high}</span></div>
            <div className="flex justify-between"><span className="text-amber-400">Medium</span><span className="text-white font-medium">{bugCount.medium}</span></div>
            <div className="flex justify-between"><span className="text-blue-400">Low</span><span className="text-white font-medium">{bugCount.low}</span></div>
          </div>
        </div>

        {/* Ratings */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">Ratings (avg / 10)</span>
            <Star size={15} className="text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{overallRating}</div>
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between"><span>Customer avg</span><span className="text-white font-medium">{avgRating(customerSubs)}</span></div>
            <div className="flex justify-between"><span>Vendor avg</span><span className="text-white font-medium">{avgRating(vendorSubs)}</span></div>
            <div className="flex justify-between"><span>Admin avg</span><span className="text-white font-medium">{avgRating(adminSubs)}</span></div>
          </div>
        </div>

        {/* Status alerts */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">Quick Actions</span>
            <AlertTriangle size={15} className="text-amber-400" />
          </div>
          <div className="space-y-2 mt-1">
            {bugCount.critical > 0 && (
              <Link href="/admin/pilot-testing/bugs" className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={11} /> {bugCount.critical} critical bug{bugCount.critical !== 1 ? "s" : ""} open
              </Link>
            )}
            {submissions.length === 0 && (
              <div className="text-xs text-slate-500 p-2 rounded-lg bg-white/3 border border-white/6">
                No submissions yet. Share the testing links with pilot testers.
              </div>
            )}
            {submissions.length > 0 && bugCount.critical === 0 && (
              <div className="flex items-center gap-2 text-xs text-green-400 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 size={11} /> No critical bugs
              </div>
            )}
            <Link href="/admin/pilot-testing/submissions" className="block text-xs text-slate-400 hover:text-white text-center pt-2 border-t border-white/6">
              View all submissions
            </Link>
            <Link href="/admin/pilot-testing/bugs" className="block text-xs text-slate-400 hover:text-white text-center">
              View all bugs
            </Link>
          </div>
        </div>
      </div>

      {/* Recent submissions */}
      <div className="bg-white/4 border border-white/6 rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-white/6">
          <div className="flex gap-3">
            {["overview", "recent"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as typeof activeTab)}
                className={cn("text-sm font-medium capitalize transition-colors",
                  activeTab === tab ? "text-white" : "text-slate-500 hover:text-slate-300")}>
                {tab === "overview" ? "Testing Links" : "Recent Submissions"}
              </button>
            ))}
          </div>
          <Link href="/admin/pilot-testing/submissions" className="text-xs text-slate-400 hover:text-slate-300">
            View all
          </Link>
        </div>

        {activeTab === "overview" && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-400">Share these links with pilot testers. No login required — they submit directly.</p>
            <div className="space-y-3">
              {[
                { label: "Customer Testing Form", url: "/testing/customer", icon: Users, color: "text-brand-400", desc: "Account creation, events, quotes, bookings" },
                { label: "Vendor Testing Form",   url: "/testing/vendor",   icon: Store, color: "text-slate-400", desc: "Registration, profile, media upload, verification" },
                { label: "Admin Testing Form",    url: "/testing/admin",    icon: Shield, color: "text-amber-400", desc: "Vendor queue, approvals, pipeline, analytics" },
              ].map(({ label, url, icon: Icon, color, desc }) => (
                <div key={url} className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/6">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{label}</div>
                    <div className="text-xs text-slate-500 truncate">{desc}</div>
                  </div>
                  <a href={`https://www.elbold.com${url}`} target="_blank" rel="noreferrer"
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 flex-shrink-0">
                    <ExternalLink size={10} /> Open
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "recent" && (
          <div className="divide-y divide-white/5">
            {submissions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No submissions yet.</div>
            ) : (
              submissions.slice(0, 10).map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize",
                    s.test_type === "customer" ? "bg-brand-500/20 text-brand-300" :
                    s.test_type === "vendor"   ? "bg-slate-500/20 text-slate-300" :
                    "bg-amber-500/20 text-amber-300"
                  )}>
                    {s.test_type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{s.tester_name}</div>
                    <div className="text-xs text-slate-500 truncate">{s.tester_email}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={cn("text-sm font-bold",
                      s.rating >= 7 ? "text-green-400" : s.rating >= 4 ? "text-amber-400" : "text-red-400")}>
                      {s.rating}/10
                    </div>
                    {(s.critical_bugs > 0 || s.high_bugs > 0) && (
                      <span className="text-xs text-red-400 flex items-center gap-0.5">
                        <Bug size={10} /> {s.critical_bugs + s.high_bugs}
                      </span>
                    )}
                    <div className="text-xs text-slate-500">
                      {new Date(s.submitted_at).toLocaleDateString("en-GB")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
