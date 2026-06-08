"use client";

import { useState } from "react";
import {
  Shield, CheckCircle2, XCircle, Clock, BadgeCheck, AlertTriangle,
  User, Loader2, Search, Flag, RefreshCcw,
  ExternalLink, ChevronDown, Ban,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { DOCUMENT_LABELS, VERIFICATION_LEVELS, type DocumentType } from "@/lib/verification-requirements";
import { VENDOR_CATEGORIES, type VendorCategory } from "@/types";
import toast from "react-hot-toast";

interface Verification {
  id: string;
  vendor_id: string;
  type: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  resubmission_allowed: boolean;
  resubmit_count: number;
  document_url: string | null;
  vendor: {
    id: string;
    business_name: string;
    category: string;
    city: string;
    verified: boolean;
    verification_level: number;
    suspicious_flag: boolean;
    status?: string | null;
    profile: { full_name: string | null; email: string } | null;
  } | null;
}

interface AdminVerificationsViewProps {
  initialVerifications: Verification[];
  stats: { pending: number; approved: number; flagged: number; suspended: number };
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  approved: "bg-green-500/15 text-green-300 border-green-500/25",
  rejected: "bg-red-500/15 text-red-300 border-red-500/25",
  not_submitted: "bg-white/8 text-white/40 border-white/15",
};

function docLabel(type: string) {
  return DOCUMENT_LABELS[type as DocumentType] ?? type.replace(/_/g, " ");
}

export function AdminVerificationsView({ initialVerifications, stats }: AdminVerificationsViewProps) {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [verifications, setVerifications] = useState<Verification[]>(initialVerifications);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [rejectionMap, setRejectionMap] = useState<Record<string, string>>({});
  const [flagReasonMap, setFlagReasonMap] = useState<Record<string, string>>({});
  const [viewingDocPath, setViewingDocPath] = useState<string | null>(null);

  async function loadVerifications(status: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/verifications?${params}`);
      const data = await res.json() as Verification[];
      setVerifications(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load verifications");
    } finally {
      setLoading(false);
    }
  }

  function switchStatus(s: string) {
    setStatusFilter(s);
    void loadVerifications(s);
  }

  async function act(id: string, action: string, extra: Record<string, unknown> = {}) {
    setProcessing(id);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      });
      if (!res.ok) throw new Error("Action failed");
      setVerifications((prev) => prev.filter((v) => v.id !== id));
      toast.success(`Done: ${action}`);
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function viewDocument(path: string) {
    setViewingDocPath(path);
    try {
      const res = await fetch(`/api/verification/document?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error("Could not load document");
      const { url } = await res.json() as { url: string };
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not load document. Please try again.");
    } finally {
      setViewingDocPath(null);
    }
  }

  const filtered = verifications.filter((v) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (v.vendor?.business_name ?? "").toLowerCase().includes(s) ||
      (v.vendor?.profile?.email ?? "").toLowerCase().includes(s) ||
      (v.vendor?.city ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BadgeCheck className="text-brand-400" size={24} />
          Vendor Verifications
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review submitted documents and manage vendor trust levels.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pending Review", value: stats.pending, color: "text-amber-400", icon: Clock },
          { label: "Approved", value: stats.approved, color: "text-green-400", icon: CheckCircle2 },
          { label: "Suspended", value: stats.suspended, color: "text-orange-400", icon: Ban },
          { label: "Flagged Vendors", value: stats.flagged, color: "text-red-400", icon: Flag },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white/4 border border-white/6 rounded-xl p-4">
            <Icon size={18} className={cn(color, "mb-2")} />
            <div className={cn("text-2xl font-bold", color)}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-white/4 p-1 rounded-xl flex-1 flex-wrap">
          {["pending", "approved", "rejected", "suspended", "expired", "all"].map((s) => (
            <button
              key={s}
              onClick={() => switchStatus(s)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors min-w-[5rem]",
                statusFilter === s ? "bg-white/12 text-white" : "text-slate-500 hover:text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor..."
            className="input-field pl-9 py-2 text-sm w-full sm:w-56"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-white/30" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/4 border border-white/6 rounded-xl p-16 text-center">
          <CheckCircle2 size={40} className="text-white/15 mx-auto mb-3" />
          <p className="text-white font-medium">
            {statusFilter === "pending" ? "No pending verifications" :
             statusFilter === "expired" ? "Document expiry tracking" :
             statusFilter === "suspended" ? "No suspended vendors" :
             `No ${statusFilter} verifications`}
          </p>
          <p className="text-white/40 text-sm mt-1 max-w-sm mx-auto">
            {statusFilter === "pending"
              ? "Business document and ID checks will appear here when vendors submit for review."
              : statusFilter === "expired"
              ? "Document expiry tracking requires an expires_at column on vendor_verifications. Add it via migration to enable this filter."
              : statusFilter === "suspended"
              ? "No vendors are currently suspended. Suspended vendor accounts will surface their verification records here."
              : "No verification records match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => {
            const cat = VENDOR_CATEGORIES[v.vendor?.category as VendorCategory];
            const isExpanded = expanded === v.id;
            const isProcessing = processing === v.id;
            const levelConfig = VERIFICATION_LEVELS[v.vendor?.verification_level ?? 0];

            return (
              <div
                key={v.id}
                className={cn(
                  "bg-white/4 border rounded-2xl overflow-hidden transition-all",
                  v.vendor?.suspicious_flag ? "border-red-500/30" : "border-white/8",
                  isExpanded && "border-brand-500/30"
                )}
              >
                {/* Card header */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Category icon */}
                    <div className="w-11 h-11 rounded-xl bg-brand-500/15 flex items-center justify-center text-xl flex-shrink-0">
                      {cat?.icon ?? "🏢"}
                    </div>

                    {/* Vendor info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="font-bold text-white">
                          {v.vendor?.business_name ?? "Unknown Vendor"}
                        </span>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border capitalize", STATUS_STYLE[v.status])}>
                          {v.status}
                        </span>
                        {v.vendor?.status === "suspended" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/25 flex items-center gap-1">
                            <Ban size={9} /> Suspended
                          </span>
                        )}
                        {v.vendor?.suspicious_flag && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/25 flex items-center gap-1">
                            <Flag size={9} /> Flagged
                          </span>
                        )}
                        {(v.vendor?.verification_level ?? 0) > 0 && (
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border", levelConfig.bg, levelConfig.border, levelConfig.color)}>
                            {levelConfig.label}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><User size={10} /> {v.vendor?.profile?.email}</span>
                        <span>{cat?.label}</span>
                        <span>{v.vendor?.city}</span>
                        {v.submitted_at && (
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {formatDistanceToNow(new Date(v.submitted_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Document type + expand */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm text-white font-medium">{docLabel(v.type)}</div>
                        {v.resubmit_count > 0 && (
                          <div className="text-xs text-amber-500">{v.resubmit_count}x resubmitted</div>
                        )}
                      </div>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : v.id)}
                        className="p-2 rounded-lg hover:bg-white/8 transition-colors"
                      >
                        <ChevronDown size={16} className={cn("text-slate-400 transition-transform", isExpanded && "rotate-180")} />
                      </button>
                    </div>
                  </div>

                  {/* Document link */}
                  {v.document_url && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => void viewDocument(v.document_url!)}
                        disabled={viewingDocPath === v.document_url}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {viewingDocPath === v.document_url
                          ? <Loader2 size={12} className="animate-spin" />
                          : <ExternalLink size={12} />}
                        View Document
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded actions */}
                {isExpanded && (
                  <div className="border-t border-white/8 p-5 space-y-4 bg-white/2">
                    {/* Notes from previous review */}
                    {v.notes && (
                      <div className="text-xs bg-white/6 rounded-xl p-3">
                        <span className="text-white/40 font-medium">Previous notes: </span>
                        <span className="text-slate-300">{v.notes}</span>
                      </div>
                    )}

                    {/* Review form */}
                    {v.status === "pending" && (
                      <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1.5">Admin notes (optional)</label>
                            <input
                              placeholder="Internal notes..."
                              value={notesMap[v.id] ?? ""}
                              onChange={(e) => setNotesMap((m) => ({ ...m, [v.id]: e.target.value }))}
                              className="input-field text-sm py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1.5">Rejection reason (if rejecting)</label>
                            <input
                              placeholder="e.g. Document expired, image too blurry..."
                              value={rejectionMap[v.id] ?? ""}
                              onChange={(e) => setRejectionMap((m) => ({ ...m, [v.id]: e.target.value }))}
                              className="input-field text-sm py-2"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => void act(v.id, "approve", { notes: notesMap[v.id] })}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/20 text-green-300 hover:bg-green-500/30 text-sm font-medium transition-colors disabled:opacity-40"
                          >
                            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            Approve
                          </button>
                          <button
                            onClick={() => void act(v.id, "reject", {
                              notes: notesMap[v.id],
                              rejection_reason: rejectionMap[v.id] || "Document rejected",
                              resubmission_allowed: true,
                            })}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 text-sm font-medium transition-colors disabled:opacity-40"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                          <button
                            onClick={() => void act(v.id, "request_resubmission", {
                              rejection_reason: rejectionMap[v.id] || "Please resubmit with a clearer document",
                            })}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-sm font-medium transition-colors disabled:opacity-40"
                          >
                            <RefreshCcw size={14} /> Request Resubmission
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Vendor trust management */}
                    <div className="border-t border-white/8 pt-4">
                      <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                        <Shield size={11} /> Vendor Trust Management
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {/* Manual level set */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">Set level:</span>
                          {[0, 1, 2, 3, 4].map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => void act(v.id, "set_level", { level: lvl })}
                              disabled={isProcessing}
                              className={cn(
                                "w-7 h-7 rounded-lg text-xs font-bold transition-colors",
                                (v.vendor?.verification_level ?? 0) === lvl
                                  ? "bg-brand-500/40 text-brand-300"
                                  : "bg-white/6 text-slate-400 hover:bg-white/12"
                              )}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>

                        {/* Flag / Unflag */}
                        {v.vendor?.suspicious_flag ? (
                          <button
                            onClick={() => void act(v.id, "unflag")}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/8 text-slate-300 hover:bg-white/12 text-xs transition-colors"
                          >
                            <Flag size={12} /> Remove Flag
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input
                              placeholder="Flag reason..."
                              value={flagReasonMap[v.id] ?? ""}
                              onChange={(e) => setFlagReasonMap((m) => ({ ...m, [v.id]: e.target.value }))}
                              className="input-field text-xs py-1.5 px-2.5 w-36"
                            />
                            <button
                              onClick={() => void act(v.id, "flag", { suspicious_reason: flagReasonMap[v.id] })}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs transition-colors"
                            >
                              <AlertTriangle size={12} /> Flag
                            </button>
                          </div>
                        )}

                        {/* View vendor profile */}
                        <a
                          href={`/vendors/${v.vendor?.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/6 text-slate-400 hover:text-white text-xs transition-colors"
                        >
                          <ExternalLink size={11} /> View Profile
                        </a>
                      </div>
                    </div>

                    {v.status !== "pending" && (
                      <div className="text-xs text-slate-600">
                        {v.status === "approved" ? "Approved" : "Reviewed"}{" "}
                        {v.reviewed_at ? formatDistanceToNow(new Date(v.reviewed_at), { addSuffix: true }) : ""}
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
