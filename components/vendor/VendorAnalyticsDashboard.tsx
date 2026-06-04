"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Eye, MessageSquare, ShoppingBag, TrendingUp, Star, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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

interface AnalyticsData {
  summary: AnalyticsSummary;
  chart: DayData[];
}

const PERIODS = [
  { label: "7 days", value: 7 },
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

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
}

export function VendorAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    let cancelled = false;
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
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white/4 border border-white/6 rounded-xl p-4 animate-pulse h-24" />)}
        </div>
        <div className="bg-white/4 border border-white/6 rounded-xl p-5 animate-pulse h-52" />
        <div className="bg-white/4 border border-white/6 rounded-xl p-5 animate-pulse h-44" />
      </div>
    );
  }

  if (!data) {
    return <div className="bg-white/4 border border-white/6 rounded-xl p-8 text-center text-white/40">Unable to load analytics</div>;
  }

  const { summary, chart } = data;

  const chartData = chart.map((d) => ({ ...d, label: formatDay(d.date) }));

  const stats = [
    { label: "Profile Views",    value: summary.profile_views,   icon: Eye,         color: "text-blue-400",    bg: "bg-blue-500/10",    sub: `last ${period} days` },
    { label: "Showcase Views",   value: summary.showcase_views ?? 0, icon: Eye,     color: "text-sky-400",     bg: "bg-sky-500/10",     sub: "from /inspire page" },
    { label: "Quote Requests",   value: summary.quote_requests,  icon: MessageSquare, color: "text-slate-400", bg: "bg-slate-500/10",   sub: "from customers" },
    { label: "Confirmed Bookings", value: summary.confirmed_bookings, icon: ShoppingBag, color: "text-green-400", bg: "bg-green-500/10", sub: "completed" },
    { label: "Revenue",          value: formatCurrency(summary.revenue), icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500/10", sub: "from paid bookings" },
    { label: "Conversion Rate",  value: `${summary.conversion_rate}%`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", sub: "quotes to bookings" },
    { label: "Average Rating",   value: summary.avg_rating.toFixed(1), icon: Star,   color: "text-yellow-400",  bg: "bg-yellow-500/10",  sub: `${summary.total_reviews} reviews` },
  ];

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => { setLoading(true); setData(null); setPeriod(p.value); }}
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
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: 4 }}
              formatter={(val) => [Number(val ?? 0), "Views"]}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#viewsGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6" }}
            />
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
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: 4 }}
              formatter={(val) => [Number(val ?? 0), "Bookings"]}
            />
            <Bar dataKey="bookings" fill="#0B1F4D" opacity={0.8} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

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
    tip: "bg-blue-500/8 border-blue-500/25 text-blue-300",
    good: "bg-green-500/8 border-green-500/25 text-green-300",
    warning: "bg-amber-500/8 border-amber-500/25 text-amber-300",
  };
  return (
    <div className={`border rounded-lg px-3 py-2 text-xs leading-relaxed ${styles[type]}`}>{text}</div>
  );
}
