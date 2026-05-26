"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search, Calendar, DollarSign } from "lucide-react";

interface Booking {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  deposit_amount: number;
  commission_amount: number;
  created_at: string;
  customer: { id: string; full_name: string; email: string } | null;
  vendor: { id: string; business_name: string } | null;
  event: { id: string; title: string; date: string } | null;
}

interface AdminBookingsViewProps {
  bookings: Booking[];
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300",
  confirmed: "bg-blue-500/20 text-blue-300",
  accepted: "bg-teal-500/20 text-teal-300",
  completed: "bg-green-500/20 text-green-300",
  cancelled: "bg-red-500/20 text-red-300",
  disputed: "bg-orange-500/20 text-orange-300",
};

const PAYMENT_COLOR: Record<string, string> = {
  pending: "text-yellow-400",
  deposit_paid: "text-blue-400",
  fully_paid: "text-green-400",
  refunded: "text-red-400",
};

export function AdminBookingsView({ bookings }: AdminBookingsViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const totalRevenue = bookings.filter((b) => b.payment_status !== "pending").reduce((sum, b) => sum + (b.commission_amount ?? 0), 0);
  const totalGMV = bookings.filter((b) => b.payment_status === "fully_paid").reduce((sum, b) => sum + b.total_amount, 0);

  const filtered = bookings.filter((b) => {
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || b.customer?.full_name?.toLowerCase().includes(q) || b.vendor?.business_name?.toLowerCase().includes(q) || b.event?.title?.toLowerCase().includes(q) || b.id.includes(q);
    return matchStatus && matchSearch;
  });

  const statuses = ["all", "pending", "confirmed", "accepted", "completed", "cancelled", "disputed"];

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Bookings" value={String(bookings.length)} icon={Calendar} />
        <StatCard label="Platform Revenue" value={`£${totalRevenue.toFixed(0)}`} icon={DollarSign} />
        <StatCard label="Total GMV" value={`£${totalGMV.toFixed(0)}`} icon={DollarSign} />
        <StatCard label="Active" value={String(bookings.filter((b) => ["confirmed", "accepted"].includes(b.status)).length)} icon={Calendar} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500/60 pointer-events-none" />
          <input
            className="input-field pl-icon"
            placeholder="Search by customer, vendor, event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statuses.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/4 border border-white/6 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-white/50 font-medium">Customer</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium">Vendor</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium">Event</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium">Payment</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-white/40">No bookings found</td></tr>
              ) : (
                filtered.map((booking) => (
                  <tr key={booking.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{booking.customer?.full_name ?? "—"}</p>
                      <p className="text-white/40 text-xs">{booking.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-white/70">{booking.vendor?.business_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <p className="text-white/70">{booking.event?.title ?? "—"}</p>
                      {booking.event?.date && <p className="text-white/40 text-xs">{new Date(booking.event.date).toLocaleDateString("en-GB")}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">£{booking.total_amount.toFixed(2)}</p>
                      <p className="text-white/40 text-xs">Comm: £{(booking.commission_amount ?? 0).toFixed(2)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLOR[booking.status] ?? "bg-white/10 text-white/60"}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${PAYMENT_COLOR[booking.payment_status] ?? "text-white/60"}`}>
                        {booking.payment_status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-purple-400" />
        <span className="text-white/50 text-xs">{label}</span>
      </div>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  );
}
