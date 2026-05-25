"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, FileText, CheckCircle2, Clock, XCircle, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { VENDOR_CATEGORIES } from "@/types";

interface CustomerPaymentsViewProps {
  payments: Record<string, unknown>[];
  invoices: Record<string, unknown>[];
}

export function CustomerPaymentsView({ payments, invoices }: CustomerPaymentsViewProps) {
  const [tab, setTab] = useState<"payments" | "invoices">("payments");

  const totalSpent = payments
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  const pendingAmount = invoices
    .filter((inv) => ["draft", "sent"].includes(String(inv.status)))
    .reduce((sum, inv) => sum + Number(inv.total ?? 0), 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payments & Invoices</h1>
        <p className="text-slate-400 text-sm mt-1">Track your spending and invoice history</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <TrendingUp size={18} className="text-brand-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{formatCurrency(totalSpent)}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total Spent</div>
        </div>
        <div className="glass-card p-4 text-center">
          <CreditCard size={18} className="text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{payments.filter((p) => p.status === "succeeded").length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Payments</div>
        </div>
        <div className="glass-card p-4 text-center">
          <Clock size={18} className="text-amber-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{formatCurrency(pendingAmount)}</div>
          <div className="text-xs text-slate-400 mt-0.5">Outstanding</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {(["payments", "invoices"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? "bg-brand-500 text-white" : "text-slate-400 hover:text-white"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "payments" && (
        <div className="space-y-3">
          {payments.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <CreditCard size={36} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No payments yet</p>
            </div>
          ) : (
            payments.map((payment) => {
              const booking = payment.booking as Record<string, unknown> | null;
              const vendor = booking?.vendor as Record<string, unknown> | null;
              const event = booking?.event as Record<string, string> | null;
              const cat = VENDOR_CATEGORIES[String(vendor?.category ?? "") as keyof typeof VENDOR_CATEGORIES];
              const status = String(payment.status);

              return (
                <div key={String(payment.id)} className="glass-card p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${status === "succeeded" ? "bg-green-500/15" : status === "pending" ? "bg-amber-500/15" : "bg-red-500/15"}`}>
                    {status === "succeeded" ? (
                      <CheckCircle2 size={18} className="text-green-400" />
                    ) : status === "pending" ? (
                      <Clock size={18} className="text-amber-400" />
                    ) : (
                      <XCircle size={18} className="text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white capitalize">
                      {String(payment.type)} Payment — {cat?.icon} {String(vendor?.business_name ?? "Vendor")}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {event?.title ?? "Event"} · {formatDate(String(payment.created_at))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-bold text-white">{formatCurrency(Number(payment.amount))}</div>
                    <StatusBadge status={status} />
                  </div>
                  {booking && (
                    <Link href={`/dashboard/bookings/${String(booking.id)}`} className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0">
                      View
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "invoices" && (
        <div className="space-y-3">
          {invoices.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <FileText size={36} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No invoices yet</p>
            </div>
          ) : (
            invoices.map((invoice) => {
              const booking = invoice.booking as Record<string, unknown> | null;
              const vendor = booking?.vendor as Record<string, unknown> | null;
              const event = booking?.event as Record<string, string> | null;

              return (
                <div key={String(invoice.id)} className="glass-card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">
                      Invoice #{String(invoice.invoice_number)} — {String(vendor?.business_name ?? "Vendor")}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {event?.title ?? "Event"} · {formatDate(String(invoice.created_at))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-bold text-white">{formatCurrency(Number(invoice.total))}</div>
                    <StatusBadge status={String(invoice.status)} />
                  </div>
                  {booking && (
                    <Link href={`/dashboard/bookings/${String(booking.id)}`} className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0">
                      View
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
