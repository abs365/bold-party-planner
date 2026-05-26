"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Scale } from "lucide-react";

interface Dispute {
  id: string;
  status: string;
  reason: string;
  description: string;
  customer_evidence: string | null;
  vendor_response_text: string | null;
  refund_amount: number | null;
  refund_status: string | null;
  admin_notes: string | null;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  booking: {
    id: string;
    total_amount: number;
    event: { title: string; date: string } | null;
  } | null;
  customer: { id: string; full_name: string; email: string } | null;
  vendor: { id: string; business_name: string } | null;
}

interface AdminDisputesViewProps {
  disputes: Dispute[];
}

const STATUS_COLOR: Record<string, string> = {
  open: "bg-red-500/20 text-red-300 border-red-500/30",
  investigating: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-300 border-green-500/30",
  closed: "bg-white/10 text-white/40 border-white/20",
};

export function AdminDisputesView({ disputes }: AdminDisputesViewProps) {
  const [activeTab, setActiveTab] = useState<"open" | "investigating" | "resolved" | "all">("open");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = disputes.filter((d) => activeTab === "all" ? true : d.status === activeTab);

  const counts = {
    open: disputes.filter((d) => d.status === "open").length,
    investigating: disputes.filter((d) => d.status === "investigating").length,
    resolved: disputes.filter((d) => d.status === "resolved").length,
    all: disputes.length,
  };

  async function doAction(disputeId: string, action: "resolve" | "close") {
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = { dispute_id: disputeId, action };
      if (action === "resolve") {
        body.resolution = resolution;
        body.admin_notes = adminNotes;
        if (refundAmount) body.refund_amount = Number(refundAmount);
      }
      const res = await fetch("/api/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update dispute");
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
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["open", "investigating", "resolved", "all"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? "bg-purple-500/30 text-purple-300 border border-purple-500/50" : "text-white/60 hover:text-white border border-white/10"}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Scale className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No {activeTab === "all" ? "" : activeTab} disputes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((dispute) => {
            const isExpanded = expanded === dispute.id;
            const isResolving = resolving === dispute.id;
            return (
              <div key={dispute.id} className="bg-white/4 border border-white/6 rounded-xl overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5"
                  onClick={() => setExpanded(isExpanded ? null : dispute.id)}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${dispute.status === "open" ? "text-red-400" : dispute.status === "resolved" ? "text-green-400" : "text-yellow-400"}`} />
                    <div>
                      <p className="text-white font-medium">{dispute.reason}</p>
                      <p className="text-white/50 text-sm">
                        {dispute.customer?.full_name} vs {dispute.vendor?.business_name} ·{" "}
                        {dispute.booking?.event?.title ?? "Unknown event"} ·{" "}
                        {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs border ${STATUS_COLOR[dispute.status] ?? STATUS_COLOR.closed}`}>
                      {dispute.status}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <InfoBlock label="Customer" value={`${dispute.customer?.full_name} (${dispute.customer?.email})`} />
                      <InfoBlock label="Vendor" value={dispute.vendor?.business_name ?? "—"} />
                      <InfoBlock label="Booking Total" value={`£${(dispute.booking?.total_amount ?? 0).toFixed(2)}`} />
                      <InfoBlock label="Refund Requested" value={dispute.refund_amount ? `£${dispute.refund_amount.toFixed(2)}` : "None"} />
                    </div>

                    <div>
                      <p className="text-white/40 text-xs mb-1">Description</p>
                      <p className="text-white/80 text-sm">{dispute.description}</p>
                    </div>

                    {dispute.customer_evidence && (
                      <div>
                        <p className="text-white/40 text-xs mb-1">Customer Evidence</p>
                        <p className="text-white/70 text-sm">{dispute.customer_evidence}</p>
                      </div>
                    )}

                    {dispute.vendor_response_text && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-blue-300 text-xs font-medium mb-1">Vendor Response</p>
                        <p className="text-white/70 text-sm">{dispute.vendor_response_text}</p>
                      </div>
                    )}

                    {dispute.resolution && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <p className="text-green-300 text-xs font-medium mb-1">Resolution</p>
                        <p className="text-white/70 text-sm">{dispute.resolution}</p>
                        {dispute.admin_notes && <p className="text-white/40 text-xs mt-1">{dispute.admin_notes}</p>}
                        {dispute.refund_status === "approved" && <p className="text-green-400 text-xs mt-1">Refund approved: £{dispute.refund_amount?.toFixed(2)}</p>}
                      </div>
                    )}

                    {(dispute.status === "open" || dispute.status === "investigating") && (
                      <div>
                        {!isResolving ? (
                          <div className="flex gap-2">
                            <button onClick={() => { setResolving(dispute.id); setResolution(""); setAdminNotes(""); setRefundAmount(""); setError(""); }}
                              className="btn-primary flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" /> Resolve Dispute
                            </button>
                            <button onClick={() => doAction(dispute.id, "close")} disabled={saving}
                              className="btn-secondary">Close Without Resolution</button>
                          </div>
                        ) : (
                          <div className="border border-purple-500/30 rounded-lg p-4 space-y-3 bg-purple-500/5">
                            <h4 className="text-white font-medium text-sm">Resolve Dispute</h4>
                            <div>
                              <label className="block text-white/60 text-xs mb-1">Resolution *</label>
                              <textarea className="input-field" rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Explain the resolution decision..." />
                            </div>
                            <div>
                              <label className="block text-white/60 text-xs mb-1">Admin Notes (internal)</label>
                              <input className="input-field" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Internal notes..." />
                            </div>
                            <div>
                              <label className="block text-white/60 text-xs mb-1">Refund Amount (£, optional)</label>
                              <input className="input-field" type="number" min="0" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="0.00" />
                            </div>
                            {error && <p className="text-red-400 text-xs">{error}</p>}
                            <div className="flex gap-2">
                              <button onClick={() => doAction(dispute.id, "resolve")} disabled={saving || !resolution}
                                className="btn-primary disabled:opacity-40">
                                {saving ? "Saving..." : "Confirm Resolution"}
                              </button>
                              <button onClick={() => setResolving(null)} className="btn-secondary">Cancel</button>
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/40 text-xs">{label}</p>
      <p className="text-white text-sm">{value}</p>
    </div>
  );
}
