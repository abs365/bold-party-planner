"use client";

import { useState } from "react";
import { CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Building2, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type PayoutStatus = "scheduled" | "pending" | "paid" | "cancelled" | string;

interface PayoutRecord {
  id: string;
  booking_id: string;
  vendor_id: string;
  amount: number;
  status: PayoutStatus;
  notes: string | null;
  created_at: string;
  booking: {
    id: string;
    total_amount: number;
    commission_amount: number;
    vendor_payout: number;
    payment_status: string;
    status: string;
    event: { title: string; date: string } | null;
    customer: { full_name: string } | null;
  } | null;
  vendor: { id: string; business_name: string; city: string } | null;
}

interface Props {
  payouts: PayoutRecord[];
}

const STATUS_DISPLAY: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: "Due", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/25" },
  pending:   { label: "Pending", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/25" },
  paid:      { label: "Paid", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/25" },
  cancelled: { label: "Cancelled", color: "text-slate-400", bg: "bg-white/8 border-white/12" },
};

export function AdminPayoutsQueue({ payouts }: Props) {
  const [activeTab, setActiveTab] = useState<"due" | "paid" | "all">("due");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isDue = (p: PayoutRecord) => p.status === "scheduled" || p.status === "pending";

  const filtered = payouts.filter((p) => {
    if (activeTab === "due")  return isDue(p);
    if (activeTab === "paid") return p.status === "paid";
    return true;
  });

  const dueCount  = payouts.filter(isDue).length;
  const paidCount = payouts.filter((p) => p.status === "paid").length;

  async function doMarkPaid(payoutId: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payout_id: payoutId, action: "mark_paid", notes }),
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? "Failed");
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { key: "due" as const,  label: `Due Now (${dueCount})` },
          { key: "paid" as const, label: `Paid (${paidCount})` },
          { key: "all" as const,  label: `All (${payouts.length})` },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              activeTab === key
                ? "bg-white/10 text-white border-white/20"
                : "text-slate-500 border-white/8 hover:text-white hover:border-white/15"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/3 border border-white/6 rounded-2xl">
          <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-white font-medium">
            {activeTab === "due" ? "No payouts due" : activeTab === "paid" ? "No paid payouts yet" : "No payout records"}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {activeTab === "due" ? "All vendor payouts are up to date." : "Payouts will appear here once processed."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((payout) => {
            const isExpanded   = expanded === payout.id;
            const isMarkingThis = markingPaid === payout.id;
            const eventData    = payout.booking?.event as { title: string; date: string } | null;
            const eventDate    = eventData?.date ? new Date(eventData.date) : null;
            const isOverdue    = isDue(payout) && eventDate && eventDate < new Date();
            const statusInfo   = STATUS_DISPLAY[payout.status] ?? STATUS_DISPLAY.scheduled;

            return (
              <div
                key={payout.id}
                className={`bg-white/4 border rounded-xl overflow-hidden ${isOverdue ? "border-amber-500/25" : "border-white/6"}`}
              >
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : payout.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0 text-sm font-bold text-brand-400">
                      {payout.vendor?.business_name?.charAt(0) ?? "V"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white truncate">{payout.vendor?.business_name ?? "Unknown vendor"}</p>
                        {isOverdue && (
                          <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle size={10} /> Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {eventData?.title ?? "No event"}{" "}
                        {eventDate && `· ${eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        £{Number(payout.amount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(payout.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/8 p-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Vendor</p>
                        <div className="flex items-center gap-1.5">
                          <Building2 size={11} className="text-slate-500" />
                          <p className="text-white">{payout.vendor?.business_name}</p>
                        </div>
                        <p className="text-xs text-slate-600">{payout.vendor?.city}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Event</p>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={11} className="text-slate-500" />
                          <p className="text-white">{eventData?.title ?? "—"}</p>
                        </div>
                        {eventDate && (
                          <p className="text-xs text-slate-600">
                            {eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Booking total</p>
                        <p className="text-white font-semibold">
                          £{Number(payout.booking?.total_amount ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-600">
                          Commission: £{Number(payout.booking?.commission_amount ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Payout amount</p>
                        <p className="text-emerald-400 font-bold text-base">
                          £{Number(payout.amount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-600">to vendor (90%)</p>
                      </div>
                    </div>

                    {payout.notes && (
                      <div className="bg-white/3 rounded-lg px-3 py-2.5">
                        <p className="text-xs text-slate-400">{payout.notes}</p>
                      </div>
                    )}

                    {isDue(payout) && (
                      <div>
                        {!isMarkingThis ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); setMarkingPaid(payout.id); setNotes(""); setError(""); }}
                            className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle size={14} /> Mark as Paid
                          </button>
                        ) : (
                          <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
                            <p className="text-sm font-semibold text-white">Confirm payout sent</p>
                            <p className="text-xs text-slate-400">
                              Confirm that{" "}
                              <span className="text-white font-medium">
                                £{Number(payout.amount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                              </span>{" "}
                              has been transferred to {payout.vendor?.business_name} via bank transfer.
                            </p>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Payment reference or notes (optional)</label>
                              <input
                                className="input-field text-sm"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Faster Payment ref 12345678"
                              />
                            </div>
                            {error && <p className="text-red-400 text-xs">{error}</p>}
                            <div className="flex gap-2">
                              <button
                                onClick={() => doMarkPaid(payout.id)}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-40 flex items-center gap-2"
                              >
                                {saving ? (
                                  <>
                                    <Clock size={13} /> Saving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={13} /> Confirm Paid
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => setMarkingPaid(null)}
                                className="px-4 py-2 rounded-xl text-sm text-slate-400 border border-white/8 hover:border-white/15 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
