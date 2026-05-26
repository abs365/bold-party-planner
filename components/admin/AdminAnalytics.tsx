"use client";

import {
  TrendingUp, Users, Building2, ShoppingBag, Calendar,
  CreditCard, Star, AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { VENDOR_CATEGORIES } from "@/types";

interface AdminAnalyticsProps {
  stats: Record<string, unknown> | null;
  recentPayments: Record<string, unknown>[];
  bookings: Record<string, unknown>[];
  vendors: Record<string, unknown>[];
}

export function AdminAnalytics({ stats, recentPayments, bookings, vendors }: AdminAnalyticsProps) {
  const bookingStatusCounts = bookings.reduce<Record<string, number>>((acc, b) => {
    const s = String(b.status);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const vendorCatCounts = vendors.reduce<Record<string, number>>((acc, v) => {
    const c = String(v.category);
    acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});

  const sortedCats = Object.entries(vendorCatCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const maxCat = sortedCats[0]?.[1] ?? 1;

  const totalRevenue = recentPayments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const commissionRevenue = totalRevenue * 0.1;

  const statCards = [
    { icon: <TrendingUp size={20} className="text-brand-400" />, label: "Total Revenue (30d)", value: formatCurrency(totalRevenue), sub: `${formatCurrency(commissionRevenue)} platform commission` },
    { icon: <Users size={20} className="text-blue-400" />, label: "Total Customers", value: String(stats?.total_customers ?? 0), sub: "Registered accounts" },
    { icon: <Building2 size={20} className="text-green-400" />, label: "Active Vendors", value: String(stats?.total_vendors ?? 0), sub: `${stats?.pending_vendors ?? 0} pending approval` },
    { icon: <ShoppingBag size={20} className="text-amber-400" />, label: "Total Bookings", value: String(stats?.total_bookings ?? 0), sub: `${bookingStatusCounts.completed ?? 0} completed` },
    { icon: <Calendar size={20} className="text-purple-400" />, label: "Events Created", value: String(stats?.total_events ?? 0), sub: "Across all customers" },
    { icon: <Star size={20} className="text-yellow-400" />, label: "Platform Rating", value: Number(stats?.avg_vendor_rating ?? 0).toFixed(1), sub: "Average vendor rating" },
  ];

  const bookingStatuses = [
    { key: "pending", label: "Pending", color: "bg-amber-400" },
    { key: "accepted", label: "Accepted", color: "bg-blue-400" },
    { key: "confirmed", label: "Confirmed", color: "bg-brand-400" },
    { key: "completed", label: "Completed", color: "bg-green-400" },
    { key: "rejected", label: "Rejected", color: "bg-red-400" },
    { key: "cancelled", label: "Cancelled", color: "bg-slate-400" },
  ];
  const totalBookings = bookings.length || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Revenue, bookings, and platform health at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white/4 border border-white/6 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">{card.icon}<span className="text-xs text-slate-400">{card.label}</span></div>
            <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
            <div className="text-xs text-slate-500">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Booking Status Breakdown */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingBag size={16} className="text-slate-400" />Booking Status Breakdown
          </h3>
          <div className="space-y-3">
            {bookingStatuses.map(({ key, label, color }) => {
              const count = bookingStatusCounts[key] ?? 0;
              const pct = Math.round((count / totalBookings) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{label}</span>
                    <span className="text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Vendor Categories */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-slate-400" />Top Vendor Categories
          </h3>
          {sortedCats.length === 0 ? (
            <p className="text-slate-500 text-sm">No approved vendors yet</p>
          ) : (
            <div className="space-y-3">
              {sortedCats.map(([cat, count]) => {
                const category = VENDOR_CATEGORIES[cat as keyof typeof VENDOR_CATEGORIES];
                const pct = Math.round((count / maxCat) * 100);
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{category?.icon} {category?.label ?? cat}</span>
                      <span className="text-slate-400">{count} vendors</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-slate-400" />Recent Payments (last 30)
        </h3>
        {recentPayments.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle size={28} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No payments yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-3 text-xs text-slate-500 pb-2 border-b border-white/8">
              <span>Type</span>
              <span className="text-center">Amount</span>
              <span className="text-right">Commission</span>
            </div>
            {recentPayments.slice(0, 10).map((p, i) => (
              <div key={i} className="grid grid-cols-3 text-sm py-2 border-b border-white/5">
                <span className="text-slate-300 capitalize">{String(p.type)} payment</span>
                <span className="text-center font-medium text-white">{formatCurrency(Number(p.amount))}</span>
                <span className="text-right text-brand-400">{formatCurrency(Number(p.amount) * 0.1)}</span>
              </div>
            ))}
            <div className="grid grid-cols-3 text-sm pt-2 font-bold">
              <span className="text-slate-300">Total ({recentPayments.length} payments)</span>
              <span className="text-center text-white">{formatCurrency(totalRevenue)}</span>
              <span className="text-right text-brand-400">{formatCurrency(commissionRevenue)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
