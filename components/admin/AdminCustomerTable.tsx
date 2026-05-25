"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Search, Users, Calendar, ShoppingBag, TrendingUp, Mail } from "lucide-react";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface AdminCustomerTableProps {
  customers: Record<string, unknown>[];
  events: Record<string, unknown>[];
  bookings: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  currentSearch: string;
}

export function AdminCustomerTable({ customers, events, bookings, payments, currentSearch }: AdminCustomerTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [, startTransition] = useTransition();

  function applySearch() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    startTransition(() => router.push(`/admin/customers?${params.toString()}`));
  }

  function getCustomerStats(customerId: string) {
    const customerEvents = events.filter((e) => String(e.customer_id) === customerId);
    const customerBookings = bookings.filter((b) => String(b.customer_id) === customerId);
    const completedBookings = customerBookings.filter((b) => b.status === "completed");
    return {
      eventCount: customerEvents.length,
      bookingCount: customerBookings.length,
      completedCount: completedBookings.length,
    };
  }

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customer Management</h1>
        <p className="text-slate-400 text-sm mt-1">View and manage all platform customers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Users size={18} className="text-brand-400" />, label: "Total Customers", value: customers.length },
          { icon: <Calendar size={18} className="text-blue-400" />, label: "Total Events", value: events.length },
          { icon: <ShoppingBag size={18} className="text-green-400" />, label: "Total Bookings", value: bookings.length },
          { icon: <TrendingUp size={18} className="text-amber-400" />, label: "Revenue (GBP)", value: formatCurrency(totalRevenue) },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">{stat.icon}<span className="text-xs text-slate-400">{stat.label}</span></div>
            <div className="text-xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="glass-card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500/60 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            placeholder="Search by name or email..."
            className="input-field pl-icon w-full"
          />
        </div>
        <button onClick={applySearch} className="btn-secondary">Search</button>
      </div>

      {/* Customer List */}
      {customers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No customers found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left text-xs text-slate-400 font-medium p-4">Customer</th>
                <th className="text-left text-xs text-slate-400 font-medium p-4 hidden md:table-cell">Joined</th>
                <th className="text-center text-xs text-slate-400 font-medium p-4 hidden sm:table-cell">Events</th>
                <th className="text-center text-xs text-slate-400 font-medium p-4 hidden sm:table-cell">Bookings</th>
                <th className="text-center text-xs text-slate-400 font-medium p-4 hidden lg:table-cell">Completed</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const customerId = String(customer.id);
                const stats = getCustomerStats(customerId);
                const initials = getInitials(String(customer.full_name ?? "?"));

                return (
                  <tr key={customerId} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {customer.avatar_url ? (
                          <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                            <Image src={String(customer.avatar_url)} alt="" fill className="object-cover" sizes="36px" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-400 flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-white">{String(customer.full_name ?? "—")}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Mail size={10} />
                            {String(customer.email ?? "—")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-400 hidden md:table-cell">
                      {formatDate(String(customer.created_at))}
                    </td>
                    <td className="p-4 text-center hidden sm:table-cell">
                      <span className="text-sm font-medium text-white">{stats.eventCount}</span>
                    </td>
                    <td className="p-4 text-center hidden sm:table-cell">
                      <span className="text-sm font-medium text-white">{stats.bookingCount}</span>
                    </td>
                    <td className="p-4 text-center hidden lg:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">
                        {stats.completedCount}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
