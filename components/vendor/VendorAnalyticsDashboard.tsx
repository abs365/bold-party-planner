"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Eye, MessageSquare, ShoppingBag, TrendingUp, Star, DollarSign,
  ArrowUp, ArrowDown, Minus, Users, Calendar, Banknote, BookUser,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsSummary {
  profile_views: number;
  showcase_views: number;
  quote_requests: number;
  confirmed_bookings: number;
  revenue: number;
  conversion_rate: number;
  avg_rating: number;
  total_reviews: number;
}

interface DayData {
  date: string;
  views: number;
  bookings: number;
}

interface RevenuePeriod {
  label: string;
  gross: number;
  net: number;
  count: number;
}

interface MoMMonth {
  revenue: number;
  bookings: number;
  quotes: number;
  views: number;
}

interface MoMChanges {
  revenue_pct: number | null;
  bookings_pct: number | null;
  quotes_pct: number | null;
  views_pct: number | null;
}

interface LeadFunnel {
  total_leads: number;
  responded: number;
  accepted: number;
  converted: number;
  response_rate: number;
}

interface SeasonMonth {
  month: number;
  month_short: string;
  count: number;
}

interface PayoutSplit {
  received: number;
  pending: number;
  not_yet_due: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  chart: DayData[];
  // Phase 69A
  revenue_trend?: { monthly: RevenuePeriod[]; weekly: RevenuePeriod[] };
  mom?: { current_month: MoMMonth; previous_month: MoMMonth; changes: MoMChanges };
  avg_booking_value?: number | null;
  lead_funnel?: LeadFunnel;
  seasonal_demand?: SeasonMonth[];
  payout_split?: PayoutSplit;
  // Phase 69C Stage A
  direct_contacts_count?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PERIODS = [
  { label: "7 days",  value: 7  },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#111118",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
}

function PctBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-white/30 text-xs">—</span>;
  if (pct === 0)    return <span className="text-white/40 text-xs flex items-center gap-0.5"><Minus className="w-3 h-3" />0%</span>;
  const up = pct > 0;
  return (
    <span className={`text-xs flex items-center gap-0.5 font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
      {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(pct)}%
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function VendorAnalyticsDashboard() {
  const [data, setData]     = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [trendView, setTrendView] = useState<"monthly" | "weekly">("monthly");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    fetch(`/api/vendor/analytics?days=${period}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) { setData(d as AnalyticsData); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="bg-white/4 border border-white/6 rounded-xl p-4 animate-pulse h-24" />)}
        </div>
        <div className="bg-white/4 border border-white/6 rounded-xl p-5 animate-pulse h-52" />
        <div className="bg-white/4 border border-white/6 rounded-xl p-5 animate-pulse h-44" />
        <div className="bg-white/4 border border-white/6 rounded-xl p-5 animate-pulse h-52" />
      </div>
    );
  }

  if (!data) {
    return <div className="bg-white/4 border border-white/6 rounded-xl p-8 text-center text-white/40">Unable to load analytics</div>;
  }

  const { summary, chart } = data;
  const chartData = chart.map((d) => ({ ...d, label: formatDay(d.date) }));

  const stats = [
    { label: "Profile Views",      value: summary.profile_views,                icon: Eye,           color: "text-blue-400",    bg: "bg-blue-500/10",    sub: `last ${period} days` },
    { label: "Showcase Views",     value: summary.showcase_views ?? 0,          icon: Eye,           color: "text-sky-400",     bg: "bg-sky-500/10",     sub: "from /inspire page" },
    { label: "Quote Requests",     value: summary.quote_requests,               icon: MessageSquare, color: "text-slate-400",   bg: "bg-slate-500/10",   sub: "from customers" },
    { label: "Confirmed Bookings", value: summary.confirmed_bookings,           icon: ShoppingBag,   color: "text-green-400",   bg: "bg-green-500/10",   sub: "completed" },
    { label: "Revenue",            value: formatCurrency(summary.revenue),      icon: DollarSign,    color: "text-amber-400",   bg: "bg-amber-500/10",   sub: "from paid bookings" },
    { label: "Conversion Rate",    value: `${summary.conversion_rate}%`,        icon: TrendingUp,    color: "text-emerald-400", bg: "bg-emerald-500/10", sub: "quotes to bookings" },
    { label: "Average Rating",     value: summary.avg_rating.toFixed(1),        icon: Star,          color: "text-yellow-400",  bg: "bg-yellow-500/10",  sub: `${summary.total_reviews} reviews` },
    {
      label: "Avg Booking Value",
      value: data.avg_booking_value != null ? formatCurrency(data.avg_booking_value) : "—",
      icon: Banknote, color: "text-violet-400", bg: "bg-violet-500/10", sub: "per confirmed booking",
    },
    {
      label: "Direct Contacts",
      value: String(data.direct_contacts_count ?? 0),
      icon: BookUser, color: "text-orange-400", bg: "bg-orange-500/10", sub: "off-platform contacts",
    },
  ];

  const trendData = data.revenue_trend
    ? (trendView === "monthly" ? data.revenue_trend.monthly : data.revenue_trend.weekly)
    : [];

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              period === p.value
                ? "bg-brand-500/20 text-brand-300 border border-brand-500/40"
                : "text-white/50 hover:text-white border border-white/10 hover:border-white/20"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="bg-white/4 border border-white/6 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-xs">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-white/30 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Profile views area chart */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-semibold text-sm">Profile Views</h3>
            <p className="text-white/40 text-xs mt-0.5">Daily traffic to your profile</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <span className="w-3 h-0.5 bg-blue-400 rounded-full inline-block" />
            Views
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 6)} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: 4 }} formatter={(val) => [Number(val ?? 0), "Views"]} />
            <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} fill="url(#viewsGrad)" dot={false} activeDot={{ r: 4, fill: "#3b82f6" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bookings bar chart */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-semibold text-sm">Bookings</h3>
            <p className="text-white/40 text-xs mt-0.5">Confirmed bookings per day</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-brand-400">
            <span className="w-3 h-3 bg-brand-500/60 rounded-sm inline-block" />
            Bookings
          </div>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 6)} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: 4 }} formatter={(val) => [Number(val ?? 0), "Bookings"]} />
            <Bar dataKey="bookings" fill="#0B1F4D" opacity={0.8} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Phase 69A: Revenue Trend ─────────────────────────────────────── */}
      {data.revenue_trend && (
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-semibold text-sm">Revenue Trend</h3>
              <p className="text-white/40 text-xs mt-0.5">Your net payout over time</p>
            </div>
            <div className="flex gap-1">
              {(["monthly","weekly"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setTrendView(v)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    trendView === v
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "text-white/40 border border-white/10 hover:text-white/70"
                  }`}
                >
                  {v === "monthly" ? "Monthly" : "Weekly"}
                </button>
              ))}
            </div>
          </div>
          {trendData.every((d) => d.net === 0) ? (
            <div className="h-40 flex items-center justify-center text-white/30 text-sm">No confirmed revenue in this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trendData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: 4 }}
                  formatter={(val, name) => [
                    `£${Number(val ?? 0).toFixed(2)}`,
                    name === "net" ? "Net payout" : "Gross",
                  ]}
                />
                <Bar dataKey="gross" fill="rgba(245,158,11,0.15)" radius={[2, 2, 0, 0]} name="gross" />
                <Bar dataKey="net"   fill="#f59e0b"              radius={[2, 2, 0, 0]} name="net" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="w-3 h-3 rounded-sm bg-amber-500/20 inline-block" />Gross
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-300">
              <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />Net (your payout)
            </div>
          </div>
        </div>
      )}

      {/* ── Phase 69A: Month-over-Month ─────────────────────────────────── */}
      {data.mom && (
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Month-over-Month</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(
              [
                { label: "Revenue",   curr: formatCurrency(data.mom.current_month.revenue),   prev: formatCurrency(data.mom.previous_month.revenue),   pct: data.mom.changes.revenue_pct  },
                { label: "Bookings",  curr: String(data.mom.current_month.bookings),            prev: String(data.mom.previous_month.bookings),            pct: data.mom.changes.bookings_pct },
                { label: "Quotes",    curr: String(data.mom.current_month.quotes),              prev: String(data.mom.previous_month.quotes),              pct: data.mom.changes.quotes_pct   },
                { label: "Views",     curr: String(data.mom.current_month.views),               prev: String(data.mom.previous_month.views),               pct: data.mom.changes.views_pct    },
              ] as { label: string; curr: string; prev: string; pct: number | null }[]
            ).map(({ label, curr, prev, pct }) => (
              <div key={label} className="bg-white/3 border border-white/6 rounded-lg p-3">
                <p className="text-white/40 text-xs mb-2">{label}</p>
                <p className="text-white font-bold text-lg">{curr}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-white/30 text-xs">prev: {prev}</span>
                  <PctBadge pct={pct} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Phase 69A: Lead Funnel ───────────────────────────────────────── */}
      {data.lead_funnel && (
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                Lead Funnel
              </h3>
              <p className="text-white/40 text-xs mt-0.5">All-time quote journey</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-lg">{data.lead_funnel.response_rate}%</p>
              <p className="text-white/40 text-xs">response rate</p>
            </div>
          </div>
          {data.lead_funnel.total_leads === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">No quote requests yet</p>
          ) : (
            <div className="space-y-3">
              {(
                [
                  { label: "Total Inquiries",   count: data.lead_funnel.total_leads, color: "bg-slate-500" },
                  { label: "Responded",          count: data.lead_funnel.responded,   color: "bg-blue-500"  },
                  { label: "Accepted",           count: data.lead_funnel.accepted,    color: "bg-violet-500"},
                  { label: "Converted (Booked)", count: data.lead_funnel.converted,   color: "bg-emerald-500"},
                ] as { label: string; count: number; color: string }[]
              ).map(({ label, count, color }) => {
                const pct = data.lead_funnel!.total_leads > 0 ? Math.round((count / data.lead_funnel!.total_leads) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{label}</span>
                      <span className="text-white/80">{count} <span className="text-white/30">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Phase 69A: Payout Split ──────────────────────────────────────── */}
      {data.payout_split && (
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-400" />
            Pending vs Received Revenue
          </h3>
          <p className="text-white/40 text-xs mb-4">Last 12 months — your net payout share</p>
          {(data.payout_split.received + data.payout_split.pending + data.payout_split.not_yet_due) === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">No booking revenue in the last 12 months</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { label: "Received",     amount: data.payout_split.received,    color: "text-emerald-400", bg: "bg-emerald-500/10", bar: "bg-emerald-500", desc: "Fully paid" },
                  { label: "Pending",      amount: data.payout_split.pending,     color: "text-amber-400",   bg: "bg-amber-500/10",   bar: "bg-amber-500",   desc: "Confirmed, awaiting payment" },
                  { label: "Not Yet Due",  amount: data.payout_split.not_yet_due, color: "text-slate-400",   bg: "bg-slate-500/10",   bar: "bg-slate-500",   desc: "Pre-payment bookings" },
                ] as { label: string; amount: number; color: string; bg: string; bar: string; desc: string }[]
              ).map(({ label, amount, color, bg, desc }) => (
                <div key={label} className={`${bg} border border-white/6 rounded-lg p-3`}>
                  <p className={`${color} font-bold text-lg`}>{formatCurrency(amount)}</p>
                  <p className="text-white/70 text-xs font-medium mt-1">{label}</p>
                  <p className="text-white/30 text-xs mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Phase 69A: Seasonal Demand ───────────────────────────────────── */}
      {data.seasonal_demand && (
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-sky-400" />
            <h3 className="text-white font-semibold text-sm">Seasonal Demand</h3>
          </div>
          <p className="text-white/40 text-xs mb-4">When your customers plan events (all-time, by event month)</p>
          {data.seasonal_demand.every((m) => m.count === 0) ? (
            <div className="h-32 flex items-center justify-center text-white/30 text-sm">No event dates recorded yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.seasonal_demand} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month_short" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: 4 }}
                  formatter={(val) => [Number(val ?? 0), "Quote requests"]}
                />
                <Bar dataKey="count" fill="#0ea5e9" opacity={0.8} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Smart insights */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-brand-400" />
          Smart Insights
        </h3>
        <div className="space-y-2">
          {summary.profile_views < 10 && (
            <InsightTip type="tip" text="Profile views are low. Add more portfolio photos and complete your bio to attract more customers." />
          )}
          {summary.conversion_rate < 20 && summary.quote_requests > 0 && (
            <InsightTip type="tip" text="Your quote-to-booking rate has room to improve. Respond faster and provide detailed pricing breakdowns." />
          )}
          {summary.avg_rating >= 4.5 && (
            <InsightTip type="good" text={`Excellent rating of ${summary.avg_rating}! Consider upgrading to Featured plan to reach even more customers.`} />
          )}
          {summary.total_reviews < 5 && (
            <InsightTip type="tip" text="More reviews build trust. After completing a booking, politely ask customers to leave a review." />
          )}
          {summary.quote_requests > 5 && summary.conversion_rate > 40 && (
            <InsightTip type="good" text="Strong conversion rate! You're turning quote requests into bookings effectively. Keep it up." />
          )}
          {data.lead_funnel && data.lead_funnel.total_leads > 0 && data.lead_funnel.response_rate < 50 && (
            <InsightTip type="warning" text={`You respond to ${data.lead_funnel.response_rate}% of quote requests. Aim for 80%+ — faster responses win more bookings.`} />
          )}
          {data.mom?.changes.revenue_pct !== undefined && (data.mom.changes.revenue_pct ?? 0) > 20 && (
            <InsightTip type="good" text={`Revenue is up ${data.mom.changes.revenue_pct}% vs last month. Great momentum!`} />
          )}
          {summary.profile_views >= 10 && summary.conversion_rate >= 20 && summary.avg_rating >= 4 && summary.total_reviews >= 5 && (
            <InsightTip type="good" text="Your profile is performing well! Stay consistent with quick responses to maintain your momentum." />
          )}
        </div>
      </div>
    </div>
  );
}

function InsightTip({ type, text }: { type: "tip" | "good" | "warning"; text: string }) {
  const styles = {
    tip:     "bg-blue-500/8 border-blue-500/25 text-blue-300",
    good:    "bg-green-500/8 border-green-500/25 text-green-300",
    warning: "bg-amber-500/8 border-amber-500/25 text-amber-300",
  };
  return (
    <div className={`border rounded-lg px-3 py-2 text-xs leading-relaxed ${styles[type]}`}>{text}</div>
  );
}
