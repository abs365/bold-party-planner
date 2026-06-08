"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search, Wallet, CheckCircle } from "lucide-react";

interface Payout {
  id: string;
  vendor_payout: number;
  commission_amount: number;
  total_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
  vendor: { id: string; business_name: string } | null;
  event: { id: string; title: string; date: string } | null;
}

interface AdminPayoutsViewProps {
  payouts: Payout[];
}

const PAYMENT_COLOR: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300",
  deposit_paid: "bg-blue-500/20 text-blue-300",
  fully_paid: "bg-green-500/20 text-green-300",
  refunded: "bg-red-500/20 text-red-300",
};

export function AdminPayoutsView({ payouts }: AdminPayoutsViewProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const pendingPayout = payouts
    .filter((p) => p.status === "completed" && p.payment_status !== "refunded")
    .reduce((sum, p) => sum + (p.vendor_payout ?? 0), 0);

  const totalCommission = payouts
    .filter((p) => p.payment_status !== "pending")
    .reduce((sum, p) => sum + (p.commission_amount ?? 0), 0);

  const filtered = payouts.filter((p) => {
    const matchFilter = filter === "all" || p.payment_status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || p.vendor?.business_name?.toLowerCase().includes(q) || p.event?.title?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Bookings" value={String(payouts.length)} />
        <StatCard label="Pending Payouts" value={`£${pendingPayout.toFixed(0)}`} highlight />
        <StatCard label="Platform Commission" value={`£${totalCommission.toFixed(0)}`} />
        <StatCard label="Completed" value={String(payouts.filter((p) => p.status === "completed").length)} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500/60 pointer-events-none" />
          <input className="input-field pl-icon" placeholder="Search vendor or event..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All payments</option>
          <option value="pending">Pending</option>
          <option value="deposit_paid">Deposit Paid</option>
          <option value="fully_paid">Fully Paid</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="bg-white/4 border border-white/6 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-white/50 font-medium">Vendor</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium">Event</th>
                <th className="text-right px-4 py-3 text-white/50 font-medium">Booking Total</th>
                <th className="text-right px-4 py-3 text-white/50 font-medium">Commission (10%)</th>
                <th className="text-right px-4 py-3 text-white/50 font-medium">Vendor Payout (90%)</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium">Payment</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14">
                    <Wallet size={28} className="text-white/15 mx-auto mb-3" />
                    <p className="text-white/50 font-medium">No payouts pending</p>
                    <p className="text-white/30 text-sm mt-1">
                      Vendor payouts will appear here after bookings are completed.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((payout) => (
                  <tr key={payout.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{payout.vendor?.business_name ?? "N/A"}</td>
                    <td className="px-4 py-3">
                      <p className="text-white/70">{payout.event?.title ?? "N/A"}</p>
                      {payout.event?.date && <p className="text-white/40 text-xs">{new Date(payout.event.date).toLocaleDateString("en-GB")}</p>}
                    </td>
                    <td className="px-4 py-3 text-right text-white">£{payout.total_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-300">£{(payout.commission_amount ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-green-300 font-semibold">£{(payout.vendor_payout ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${PAYMENT_COLOR[payout.payment_status] ?? "bg-white/10 text-white/60"}`}>
                        {payout.payment_status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {formatDistanceToNow(new Date(payout.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-sm flex items-start gap-3">
        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Manual payout process:</strong> Vendor payouts are processed manually via bank transfer or Stripe payouts. Mark bookings as fully paid in Stripe Dashboard after processing. Automated payout scheduling is planned for Phase 4.
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`bg-white/4 border rounded-xl p-4 ${highlight ? "border-yellow-500/30" : "border-white/6"}`}>
      <div className="flex items-center gap-2 mb-1">
        <Wallet className={`w-4 h-4 ${highlight ? "text-yellow-400" : "text-slate-400"}`} />
        <span className="text-white/50 text-xs">{label}</span>
      </div>
      <p className={`text-xl font-bold ${highlight ? "text-yellow-300" : "text-white"}`}>{value}</p>
    </div>
  );
}
