"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CheckCircle2, XCircle, Clock, Shield, FileText, User, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Verification {
  id: string;
  vendor_id: string;
  type: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
  document_url: string | null;
  vendor: {
    id: string;
    business_name: string;
    category: string;
    city: string;
    profile: { full_name: string | null; email: string } | null;
  } | null;
}

const TYPE_LABEL: Record<string, string> = {
  identity: "Identity Verification",
  business: "Business Verification",
  insurance: "Insurance Documents",
  portfolio: "Portfolio Review",
};

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  identity: User,
  business: FileText,
  insurance: Shield,
  portfolio: FileText,
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  approved: "bg-green-500/20 text-green-300 border-green-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  not_submitted: "bg-white/10 text-white/40 border-white/20",
};

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [processing, setProcessing] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  // Fake profile for DashboardLayout — admin page always renders in admin context
  const adminProfile = { id: "admin", full_name: "Admin", role: "admin" as const, email: "", phone: null, avatar_url: null, created_at: "" };

  useEffect(() => {
    fetch(`/api/admin/verifications?status=${statusFilter}`)
      .then((r) => r.json())
      .then((d) => { setVerifications(Array.isArray(d) ? (d as Verification[]) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [statusFilter]);

  async function handleDecision(id: string, decision: "approved" | "rejected") {
    setProcessing(id);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: decision, notes: notesMap[id] ?? "" }),
      });
      if (!res.ok) throw new Error("Failed");
      setVerifications((v) => v.filter((x) => x.id !== id));
      toast.success(`Verification ${decision}`);
    } catch {
      toast.error("Action failed. Please try again.");
    }
    setProcessing(null);
  }

  return (
    <DashboardLayout user={adminProfile}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-400" />
            Vendor Verifications
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review and approve vendor identity, business, and portfolio verifications.</p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => { setLoading(true); setStatusFilter(s); }}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors",
                statusFilter === s ? "gradient-brand text-white" : "bg-white/6 text-white/60 hover:text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        ) : verifications.length === 0 ? (
          <div className="bg-white/4 border border-white/6 rounded-xl p-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 text-lg">No {statusFilter} verifications</p>
            <p className="text-white/30 text-sm mt-1">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {verifications.map((v) => {
              const TypeIcon = TYPE_ICON[v.type] ?? FileText;
              const isProcessing = processing === v.id;
              return (
                <div key={v.id} className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="w-5 h-5 text-brand-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-semibold">{v.vendor?.business_name ?? "Unknown Vendor"}</h3>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border", STATUS_COLOR[v.status])}>
                            {v.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">{TYPE_LABEL[v.type] ?? v.type}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                          <span>{v.vendor?.city}</span>
                          <span>{v.vendor?.profile?.email}</span>
                          {v.submitted_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(v.submitted_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {v.document_url && (
                      <a
                        href={v.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
                      >
                        View Document
                      </a>
                    )}
                  </div>

                  {v.notes && (
                    <div className="text-xs text-slate-400 bg-white/4 rounded-lg p-3">
                      <span className="text-white/50 font-medium">Notes: </span>{v.notes}
                    </div>
                  )}

                  {statusFilter === "pending" && (
                    <div className="space-y-2">
                      <input
                        placeholder="Add review notes (optional)"
                        value={notesMap[v.id] ?? ""}
                        onChange={(e) => setNotesMap((m) => ({ ...m, [v.id]: e.target.value }))}
                        className="input-field text-sm py-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => void handleDecision(v.id, "approved")}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/20 text-green-300 hover:bg-green-500/30 text-sm font-medium transition-colors disabled:opacity-40"
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Approve
                        </button>
                        <button
                          onClick={() => void handleDecision(v.id, "rejected")}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 text-sm font-medium transition-colors disabled:opacity-40"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
