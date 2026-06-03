"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import {
  TrendingUp, Clock, CheckCircle, XCircle, AlertCircle,
  Search, Filter, ExternalLink, Flame, ArrowUpDown, AlertTriangle,
  MessageSquare, Eye, Zap,
} from "lucide-react";

interface QuoteRow {
  id: string;
  status: string;
  lead_score: number | null;
  event_type: string | null;
  event_date: string | null;
  guest_count: number | null;
  budget_min: number | null;
  budget_max: number | null;
  city: string | null;
  category: string | null;
  created_at: string;
  responded_at: string | null;
  accepted_at: string | null;
  viewed_at: string | null;
  shortlisted_at: string | null;
  vendor_decline_reason: string | null;
  customer_rejection_reason: string | null;
  converted_booking_id: string | null;
  vendor: { id: string; business_name: string; category: string; city: string } | null;
  customer: { id: string; full_name: string } | null;
  event: { id: string; title: string } | null;
  response: { id: string; price: number; status: string }[] | null;
}

interface Stats {
  total: number;
  pending: number;
  responded: number;
  shortlisted: number;
  converted: number;
  declined: number;
  expired: number;
  conversionRate: number;
}

interface AdminQuotesViewProps {
  quotes: QuoteRow[];
  stats: Stats;
}

const STATUS_COLORS: Record<string, string> = {
  pending:     "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  responded:   "bg-blue-500/20 text-blue-300 border-blue-500/30",
  viewed:      "bg-blue-500/20 text-blue-300 border-blue-500/30",
  shortlisted: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  converted:   "bg-green-500/20 text-green-300 border-green-500/30",
  accepted:    "bg-green-500/20 text-green-300 border-green-500/30",
  rejected:    "bg-white/10 text-white/40 border-white/20",
  withdrawn:   "bg-white/10 text-white/40 border-white/20",
  declined:    "bg-red-500/20 text-red-300 border-red-500/30",
  expired:     "bg-white/10 text-white/40 border-white/20",
};

const STATUS_LABELS: Record<string, string> = {
  pending:     "Pending",
  responded:   "Responded",
  viewed:      "Viewed",
  shortlisted: "Shortlisted",
  converted:   "Converted",
  accepted:    "Accepted",
  rejected:    "Rejected",
  withdrawn:   "Withdrawn",
  declined:    "Declined",
  expired:     "Expired",
};

type SortField = "created_at" | "lead_score" | "price" | "status";

function getActionSignal(quote: QuoteRow): { label: string; color: string; urgent: boolean } | null {
  const ageHours = differenceInHours(new Date(), new Date(quote.created_at));

  if (quote.status === "pending") {
    if (ageHours >= 72) return { label: "Vendor not responding", color: "text-red-400",    urgent: true };
    if (ageHours >= 48) return { label: "Awaiting vendor",       color: "text-amber-400",  urgent: true };
    return                       { label: "Awaiting vendor",       color: "text-yellow-400", urgent: false };
  }
  if (quote.status === "responded") {
    const viewAge = quote.responded_at ? differenceInHours(new Date(), new Date(quote.responded_at)) : ageHours;
    if (viewAge >= 48) return { label: "Customer not deciding", color: "text-amber-400", urgent: true };
    return                     { label: "Awaiting customer",    color: "text-blue-400",   urgent: false };
  }
  if (quote.status === "viewed") {
    return { label: "Customer reviewing",  color: "text-blue-400",   urgent: false };
  }
  if (quote.status === "shortlisted") {
    return { label: "Comparing quotes",    color: "text-purple-400", urgent: false };
  }
  if (quote.status === "converted") {
    return { label: "Booking live",        color: "text-emerald-400",urgent: false };
  }
  return null;
}

function StatCard({ label, value, color, icon: Icon }: {
  label: string;
  value: number | string;
  color: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-4 flex items-center gap-3">
      <Icon size={18} className={color} />
      <div>
        <p className="text-white font-bold text-xl tabular-nums">{value}</p>
        <p className="text-slate-500 text-xs">{label}</p>
      </div>
    </div>
  );
}

export function AdminQuotesView({ quotes, stats }: AdminQuotesViewProps) {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortAsc, setSortAsc]     = useState(false);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc((a) => !a);
    else { setSortField(field); setSortAsc(false); }
  }

  const needsAction = useMemo(() =>
    quotes.filter((q) => ["pending", "responded", "viewed"].includes(q.status)).length,
  [quotes]);

  const stuckCount = useMemo(() =>
    quotes.filter((q) => {
      if (q.status !== "pending") return false;
      return differenceInHours(new Date(), new Date(q.created_at)) >= 48;
    }).length,
  [quotes]);

  const filtered = useMemo(() => {
    let rows = quotes;
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        rows = rows.filter((q) => ["pending", "responded", "viewed", "shortlisted"].includes(q.status));
      } else if (statusFilter === "needs_action") {
        rows = rows.filter((q) => ["pending", "responded", "viewed"].includes(q.status));
      } else {
        rows = rows.filter((q) => q.status === statusFilter);
      }
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      rows = rows.filter(
        (q) =>
          q.vendor?.business_name.toLowerCase().includes(term) ||
          q.customer?.full_name.toLowerCase().includes(term) ||
          q.event?.title?.toLowerCase().includes(term) ||
          q.city?.toLowerCase().includes(term) ||
          q.event_type?.toLowerCase().includes(term)
      );
    }
    return [...rows].sort((a, b) => {
      let av: number | string = 0, bv: number | string = 0;
      if (sortField === "created_at") { av = a.created_at; bv = b.created_at; }
      if (sortField === "lead_score") { av = a.lead_score ?? 0; bv = b.lead_score ?? 0; }
      if (sortField === "price")      { av = a.response?.[0]?.price ?? 0; bv = b.response?.[0]?.price ?? 0; }
      if (sortField === "status")     { av = a.status; bv = b.status; }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [quotes, statusFilter, search, sortField, sortAsc]);

  return (
    <div className="space-y-6">

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Total"        value={stats.total}                  color="text-slate-400"   icon={Filter} />
        <StatCard label="Pending"      value={stats.pending}                color="text-yellow-400"  icon={Clock} />
        <StatCard label="Responded"    value={stats.responded}              color="text-blue-400"    icon={MessageSquare} />
        <StatCard label="Shortlisted"  value={stats.shortlisted}            color="text-purple-400"  icon={Eye} />
        <StatCard label="Converted"    value={stats.converted}              color="text-emerald-400" icon={CheckCircle} />
        <StatCard label="Declined"     value={stats.declined}               color="text-red-400"     icon={XCircle} />
        <StatCard label="Expired"      value={stats.expired}                color="text-slate-500"   icon={AlertCircle} />
        <StatCard label="Conv. rate"   value={`${stats.conversionRate}%`}  color="text-brand-400"   icon={TrendingUp} />
      </div>

      {/* Operational warnings */}
      {(needsAction > 0 || stuckCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {needsAction > 0 && (
            <button
              onClick={() => setStatus("needs_action")}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs hover:bg-amber-500/15 transition-colors"
            >
              <Zap size={13} />{needsAction} quotes need attention
            </button>
          )}
          {stuckCount > 0 && (
            <button
              onClick={() => { setStatus("pending"); setSortField("created_at"); setSortAsc(true); }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs hover:bg-red-500/15 transition-colors"
            >
              <AlertTriangle size={13} />{stuckCount} vendor{stuckCount !== 1 ? "s" : ""} not responding (48h+)
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor, customer, event, city…"
            className="input-field pl-9 text-sm w-full"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: "all",          label: "All" },
            { value: "needs_action", label: "Needs Action" },
            { value: "active",       label: "Active" },
            { value: "pending",      label: "Pending" },
            { value: "responded",    label: "Responded" },
            { value: "shortlisted",  label: "Shortlisted" },
            { value: "converted",    label: "Converted" },
            { value: "declined",     label: "Declined" },
            { value: "expired",      label: "Expired" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === value
                  ? "bg-brand-500/20 border-brand-500/40 text-brand-300"
                  : "bg-white/4 border-white/10 text-slate-500 hover:bg-white/8 hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/3 border border-white/6 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-slate-500 text-xs">
                <th className="text-left px-4 py-3 font-medium">
                  <button className="flex items-center gap-1 hover:text-slate-300 transition-colors" onClick={() => toggleSort("created_at")}>
                    Age <ArrowUpDown size={11} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium">Vendor</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Event & Budget</th>
                <th className="text-left px-4 py-3 font-medium">
                  <button className="flex items-center gap-1 hover:text-slate-300 transition-colors" onClick={() => toggleSort("status")}>
                    Status <ArrowUpDown size={11} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium">Action Required</th>
                <th className="text-right px-4 py-3 font-medium">
                  <button className="flex items-center gap-1 hover:text-slate-300 transition-colors ml-auto" onClick={() => toggleSort("price")}>
                    Price <ArrowUpDown size={11} />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <button className="flex items-center gap-1 hover:text-slate-300 transition-colors ml-auto" onClick={() => toggleSort("lead_score")}>
                    Score <ArrowUpDown size={11} />
                  </button>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    {quotes.length === 0 ? (
                      <>
                        <MessageSquare size={28} className="text-white/15 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">No quote requests yet</p>
                        <p className="text-slate-600 text-sm mt-1 max-w-sm mx-auto">
                          When customers request pricing from vendors, they will appear here for monitoring.
                        </p>
                      </>
                    ) : (
                      <>
                        <Filter size={20} className="text-white/15 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No quotes match this filter.</p>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((quote) => {
                  const price   = quote.response?.[0]?.price;
                  const score   = quote.lead_score ?? 0;
                  const isHot   = score >= 70;
                  const action  = getActionSignal(quote);
                  const ageHrs  = differenceInHours(new Date(), new Date(quote.created_at));
                  const isStuck = quote.status === "pending" && ageHrs >= 48;

                  return (
                    <tr
                      key={quote.id}
                      className={`hover:bg-white/4 transition-colors ${isStuck ? "bg-red-500/4" : ""}`}
                    >
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-white font-medium text-xs">{quote.vendor?.business_name ?? "—"}</p>
                        <p className="text-slate-600 text-xs capitalize">
                          {(quote.vendor?.category ?? quote.category ?? "").replace(/_/g, " ")}
                          {quote.vendor?.city ? ` · ${quote.vendor.city}` : ""}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {quote.customer?.full_name ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <p className="text-slate-300">
                          {quote.event?.title ?? quote.event_type?.replace(/_/g, " ") ?? "—"}
                        </p>
                        {quote.event_date && (
                          <p className="text-slate-600">
                            {new Date(quote.event_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            {quote.guest_count ? ` · ${quote.guest_count} guests` : ""}
                          </p>
                        )}
                        {(quote.budget_min != null || quote.budget_max != null) && (
                          <p className="text-slate-600">
                            £{(quote.budget_min ?? 0).toLocaleString()}
                            {quote.budget_max != null ? `–£${quote.budget_max.toLocaleString()}` : "+"}
                          </p>
                        )}
                        {quote.city && <p className="text-slate-700 text-xs">{quote.city}</p>}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[quote.status] ?? "bg-white/10 text-white/40 border-white/20"}`}>
                          {STATUS_LABELS[quote.status] ?? quote.status}
                        </span>
                        {quote.converted_booking_id && (
                          <Link href="/admin/bookings" className="block text-xs text-emerald-400 hover:text-emerald-300 mt-0.5 transition-colors">
                            Booking created →
                          </Link>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs">
                        {action ? (
                          <span className={`flex items-center gap-1 ${action.color}`}>
                            {action.urgent && <AlertTriangle size={11} />}
                            {action.label}
                          </span>
                        ) : (
                          <span className="text-slate-700">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {price != null ? (
                          <span className="text-white font-semibold text-sm">
                            £{price.toLocaleString("en-GB")}
                          </span>
                        ) : (
                          <span className="text-slate-700 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {score > 0 ? (
                          <span className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                            isHot
                              ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                              : score >= 40
                              ? "bg-yellow-500/15 text-yellow-300 border border-yellow-500/25"
                              : "text-slate-600"
                          }`}>
                            {isHot && <Flame size={9} />}
                            {score}
                          </span>
                        ) : (
                          <span className="text-slate-700 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/quotes/${quote.id}`}
                          title="View quote"
                          className="text-slate-600 hover:text-slate-300 transition-colors"
                        >
                          <ExternalLink size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-white/6 px-4 py-2 text-xs text-slate-600 flex items-center justify-between">
            <span>Showing {filtered.length} of {quotes.length} quotes</span>
            {stuckCount > 0 && (
              <span className="text-red-500/70">{stuckCount} stuck 48h+</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
