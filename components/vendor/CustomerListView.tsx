"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Search, ArrowRight, Calendar, ShoppingBag, DollarSign } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { ContactTypeBadge } from "@/components/vendor/SourceBadge";

export interface CustomerRow {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  booking_count: number;
  quote_count: number;
  total_spend: number;
  first_contact: string | null;
  last_interaction: string | null;
  latest_booking_status: string | null;
  latest_booking_id: string | null;
}

const PAGE_SIZE = 20;

export function CustomerListView({ customers }: { customers: CustomerRow[] }) {
  const [query, setQuery]   = useState("");
  const [page, setPage]     = useState(1);

  const filtered = customers.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (c.full_name ?? "").toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const slice      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-white/50 text-sm mt-1">
          {customers.length} customer{customers.length !== 1 ? "s" : ""} from your bookings and quotes
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="w-full bg-white/4 border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20"
        />
      </div>

      {/* List */}
      {customers.length === 0 ? (
        <div className="bg-white/4 border border-white/6 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-white/30" />
          </div>
          <h3 className="font-bold text-white mb-2">No customers yet</h3>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            Customers appear here once they send a quote request or make a booking.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/4 border border-white/6 rounded-xl p-8 text-center">
          <p className="text-white/40 text-sm">No customers match &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-2">
          {slice.map((c) => (
            <Link
              key={c.id}
              href={`/vendor/customers/${c.id}`}
              className="bg-white/4 border border-white/6 rounded-xl p-4 flex items-center gap-4 hover:border-brand-500/30 transition-all group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500/30 to-brand-700/30 border border-brand-500/20 flex items-center justify-center text-sm font-bold text-brand-300 flex-shrink-0">
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  (c.full_name?.[0] ?? c.email[0] ?? "?").toUpperCase()
                )}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm group-hover:text-brand-400 transition-colors truncate">
                    {c.full_name ?? c.email}
                  </span>
                  <ContactTypeBadge type="marketplace" />
                  {c.latest_booking_status && (
                    <StatusBadge status={c.latest_booking_status} />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-white/35 flex-wrap">
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" />
                    {c.booking_count} booking{c.booking_count !== 1 ? "s" : ""}
                  </span>
                  {c.first_contact && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      First: {formatDate(c.first_contact)}
                    </span>
                  )}
                  {c.last_interaction && (
                    <span>Last: {formatDate(c.last_interaction)}</span>
                  )}
                </div>
              </div>

              {/* Spend */}
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                  <DollarSign className="w-3.5 h-3.5" />
                  {formatCurrency(c.total_spend)}
                </div>
                <div className="text-white/30 text-xs mt-0.5">
                  {c.quote_count} quote{c.quote_count !== 1 ? "s" : ""}
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-brand-400 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-white/35 text-xs">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
