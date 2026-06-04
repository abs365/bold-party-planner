"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle, RefreshCw, CheckCircle, XCircle, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonetizationData {
  summary: {
    mrr: number;
    arr: number;
    paying_vendors: number;
    total_vendors: number;
    paid_conversion: number;
    past_due_count: number;
    cancelled_count: number;
    at_risk_mrr: number;
  };
  plan_distribution: Record<string, number>;
  category_revenue: Record<string, number>;
  billing_events: BillingEvent[];
  trends: {
    upgrades: number;
    cancels: number;
    failures: number;
    recovered: number;
    net_new: number;
  };
}

interface BillingEvent {
  event_type: string;
  plan_slug: string | null;
  amount_gbp: number | null;
  created_at: string;
  vendor_id: string;
}

interface Props {
  initialData: MonetizationData;
}

const PLAN_COLOR: Record<string, string> = {
  free:     "bg-slate-500/30 text-slate-300",
  pro:      "bg-slate-500/20 text-slate-300",
  featured: "bg-amber-500/30 text-amber-300",
  premium:  "bg-amber-500/30 text-amber-300",
  elite:    "bg-rose-500/30 text-rose-300",
};

const EVENT_ICON: Record<string, React.ElementType> = {
  subscription_started:  ArrowUpCircle,
  subscription_updated:  RefreshCw,
  subscription_cancelled:XCircle,
  payment_succeeded:     CheckCircle,
  payment_failed:        AlertTriangle,
};

const EVENT_COLOR: Record<string, string> = {
  subscription_started:  "text-emerald-400",
  subscription_updated:  "text-blue-400",
  subscription_cancelled:"text-red-400",
  payment_succeeded:     "text-emerald-400",
  payment_failed:        "text-red-400",
};

function Kpi({ label, value, sub, icon: Icon, accent = "text-white" }: { label: string; value: string; sub?: string; icon: React.ElementType; accent?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-gray-400" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className={cn("text-2xl font-bold", accent)}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

const PLAN_ORDER = ["free", "pro", "premium", "elite"];
const PLAN_LABEL: Record<string, string> = { free: "Free", pro: "Pro", featured: "Premium (legacy)", premium: "Premium", elite: "Elite" };

export function AdminMonetizationDashboard({ initialData }: Props) {
  const [data] = useState<MonetizationData>(initialData);
  const { summary, plan_distribution, category_revenue, billing_events, trends } = data;

  const totalVendors = summary.total_vendors || 1;

  // Sort categories by revenue descending
  const topCategories = Object.entries(category_revenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxCatRevenue = topCategories[0]?.[1] ?? 1;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="MRR" value={`£${summary.mrr.toLocaleString()}`} sub={`ARR ~£${summary.arr.toLocaleString()}`} icon={DollarSign} accent="text-emerald-400" />
        <Kpi label="Paying Vendors" value={String(summary.paying_vendors)} sub={`${summary.paid_conversion}% conversion`} icon={Users} />
        <Kpi label="Net New (30d)" value={trends.net_new > 0 ? `+${trends.net_new}` : String(trends.net_new)} sub={`${trends.upgrades} upgrades / ${trends.cancels} cancels`} icon={trends.net_new >= 0 ? TrendingUp : TrendingDown} accent={trends.net_new >= 0 ? "text-emerald-400" : "text-red-400"} />
        <Kpi label="At-Risk MRR" value={`£${summary.at_risk_mrr}`} sub={`${summary.past_due_count} past_due`} icon={AlertTriangle} accent={summary.past_due_count > 0 ? "text-red-400" : "text-gray-300"} />
      </div>

      {/* Plan distribution + Category revenue */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Plan distribution */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Plan Distribution</h3>
          <div className="space-y-3">
            {PLAN_ORDER.map((slug) => {
              const count = plan_distribution[slug] ?? 0;
              const pct   = Math.round((count / totalVendors) * 100);
              return (
                <div key={slug}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 capitalize">{PLAN_LABEL[slug] ?? slug}</span>
                    <span className="text-gray-500">{count} vendors ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-xs text-gray-500">
            <span>Total vendors: {summary.total_vendors}</span>
            <span className="text-slate-400">{summary.paying_vendors} paying</span>
          </div>
        </div>

        {/* Revenue by category */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Revenue by Category (MRR)</h3>
          {topCategories.length === 0 ? (
            <p className="text-gray-500 text-sm">No paid subscriptions yet</p>
          ) : (
            <div className="space-y-2">
              {topCategories.map(([cat, rev]) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 capitalize">{cat.replace(/_/g, " ")}</span>
                    <span className="text-gray-400">£{rev}/mo</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500/60 rounded-full" style={{ width: `${Math.round((rev / maxCatRevenue) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trend indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Upgrades",  val: trends.upgrades,  color: "text-emerald-400" },
          { label: "Cancels",   val: trends.cancels,   color: "text-red-400"     },
          { label: "Failures",  val: trends.failures,  color: trends.failures > 0 ? "text-amber-400" : "text-gray-400" },
          { label: "Recovered", val: trends.recovered, color: "text-blue-400"    },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <div className={cn("text-xl font-bold", color)}>{val}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label} (30d)</div>
          </div>
        ))}
      </div>

      {/* Billing events log */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Recent Billing Events</h3>
        {billing_events.length === 0 ? (
          <p className="text-gray-500 text-sm">No billing events in this period</p>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {billing_events.map((ev, i) => {
              const Icon  = EVENT_ICON[ev.event_type] ?? RefreshCw;
              const color = EVENT_COLOR[ev.event_type] ?? "text-gray-400";
              return (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <Icon size={14} className={color} />
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-xs font-medium", color)}>
                      {ev.event_type.replace(/_/g, " ")}
                    </span>
                    {ev.plan_slug && (
                      <span className={cn("ml-2 text-xs px-1.5 py-0.5 rounded capitalize", PLAN_COLOR[ev.plan_slug] ?? "bg-gray-500/20 text-gray-400")}>
                        {ev.plan_slug}
                      </span>
                    )}
                  </div>
                  {ev.amount_gbp !== null && (
                    <span className="text-xs text-gray-400 shrink-0">£{ev.amount_gbp.toFixed(2)}</span>
                  )}
                  <span className="text-xs text-gray-600 shrink-0">
                    {new Date(ev.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
