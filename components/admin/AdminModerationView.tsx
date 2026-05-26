"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Flag, CheckCircle2, XCircle, Eye, AlertTriangle, MessageSquare, Image as ImageIcon, Star, Store, Search } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

interface ContentReport {
  id: string;
  content_type: "vendor_media" | "review" | "vendor" | "message";
  content_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  vendor_id: string | null;
  reporter: { full_name: string | null; email: string } | null;
  vendor: { id: string; business_name: string } | null;
}

interface PendingMedia {
  id: string;
  url: string;
  type: "image" | "video";
  caption: string | null;
  moderation_status: string;
  created_at: string;
  vendor: { id: string; business_name: string } | null;
}

interface AdminModerationViewProps {
  reports: ContentReport[];
  pendingMedia: PendingMedia[];
}

const REASON_LABELS: Record<string, string> = {
  inappropriate: "Inappropriate content",
  spam: "Spam",
  misleading: "Misleading / false",
  offensive: "Offensive",
  copyright: "Copyright violation",
  other: "Other",
};

const CONTENT_ICON: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  vendor_media: ImageIcon,
  review: Star,
  vendor: Store,
  message: MessageSquare,
};

export function AdminModerationView({ reports, pendingMedia }: AdminModerationViewProps) {
  const [activeTab, setActiveTab] = useState<"reports" | "media">("reports");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [processing, setProcessing] = useState<string | null>(null);
  const [localReports, setLocalReports] = useState(reports);
  const [localMedia, setLocalMedia] = useState(pendingMedia);

  const filteredReports = localReports.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.vendor?.business_name?.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      r.reporter?.email?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  async function resolveReport(id: string, action: "resolved" | "dismissed", notes?: string) {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/moderation/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action, resolution_notes: notes }),
      });
      if (!res.ok) throw new Error("Failed");
      setLocalReports((prev) => prev.map((r) => r.id === id ? { ...r, status: action } : r));
      toast.success(action === "resolved" ? "Report resolved" : "Report dismissed");
    } catch {
      toast.error("Failed to update report");
    } finally {
      setProcessing(null);
    }
  }

  async function moderateMedia(id: string, action: "approved" | "rejected") {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/moderation/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moderation_status: action }),
      });
      if (!res.ok) throw new Error("Failed");
      setLocalMedia((prev) => prev.filter((m) => m.id !== id));
      toast.success(action === "approved" ? "Media approved" : "Media rejected and removed");
    } catch {
      toast.error("Failed to moderate media");
    } finally {
      setProcessing(null);
    }
  }

  const openCount  = localReports.filter((r) => r.status === "open").length;
  const mediaCount = localMedia.length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open Reports" value={String(openCount)} urgent={openCount > 0} />
        <StatCard label="Pending Media" value={String(mediaCount)} urgent={mediaCount > 0} />
        <StatCard label="Resolved Today" value={String(localReports.filter((r) => r.status === "resolved").length)} />
        <StatCard label="Total Reports" value={String(localReports.length)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/4 border border-white/6 rounded-xl p-1 w-fit">
        {(["reports", "media"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? "gradient-brand text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {tab === "reports" ? `Reports${openCount > 0 ? ` (${openCount})` : ""}` : `Media Queue${mediaCount > 0 ? ` (${mediaCount})` : ""}`}
          </button>
        ))}
      </div>

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500/60 pointer-events-none" />
              <input className="input-field pl-icon" placeholder="Search by vendor, reason, reporter..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          {filteredReports.length === 0 ? (
            <div className="bg-white/4 border border-white/6 rounded-xl p-12 text-center text-white/40">
              <Flag size={32} className="mx-auto mb-3 text-white/20" />
              <p>{statusFilter === "open" ? "No open reports. Queue is clear." : "No reports found."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => {
                const ContentIcon = CONTENT_ICON[report.content_type] ?? Flag;
                const isOpen = report.status === "open" || report.status === "reviewing";
                return (
                  <div key={report.id} className={`bg-white/4 border rounded-xl p-5 ${isOpen ? "border-amber-500/25" : "border-white/6"}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isOpen ? "bg-amber-500/15" : "bg-white/8"}`}>
                          <ContentIcon size={16} className={isOpen ? "text-amber-400" : "text-white/40"} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-medium text-sm capitalize">{report.content_type.replace("_", " ")}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              report.status === "open" ? "bg-amber-500/20 text-amber-300" :
                              report.status === "resolved" ? "bg-green-500/20 text-green-300" :
                              report.status === "dismissed" ? "bg-white/10 text-white/40" :
                              "bg-blue-500/20 text-blue-300"
                            }`}>
                              {report.status}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs mt-1">
                            <strong className="text-white/70">{REASON_LABELS[report.reason] ?? report.reason}</strong>
                            {report.vendor && <> · Vendor: <span className="text-white/60">{report.vendor.business_name}</span></>}
                          </p>
                          {report.details && (
                            <p className="text-slate-500 text-xs mt-1 italic">&ldquo;{report.details}&rdquo;</p>
                          )}
                          <p className="text-slate-600 text-xs mt-1.5">
                            Reported by {report.reporter?.email ?? "unknown"} · {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => resolveReport(report.id, "dismissed")}
                            disabled={processing === report.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/6 border border-white/10 text-white/60 hover:text-white text-xs transition-colors"
                          >
                            <XCircle size={13} /> Dismiss
                          </button>
                          <button
                            onClick={() => resolveReport(report.id, "resolved", "Content reviewed and action taken")}
                            disabled={processing === report.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/25 text-green-300 hover:bg-green-500/25 text-xs transition-colors"
                          >
                            <CheckCircle2 size={13} /> Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Media Queue Tab */}
      {activeTab === "media" && (
        <div className="space-y-4">
          {localMedia.length === 0 ? (
            <div className="bg-white/4 border border-white/6 rounded-xl p-12 text-center text-white/40">
              <CheckCircle2 size={32} className="mx-auto mb-3 text-white/20" />
              <p>No media pending review. Queue is clear.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {localMedia.map((item) => (
                <div key={item.id} className="bg-white/4 border border-white/6 rounded-xl overflow-hidden">
                  <div className="aspect-video relative bg-slate-900">
                    {item.type === "image" ? (
                      <Image src={item.url} alt={item.caption ?? ""} fill className="object-cover" sizes="400px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Eye size={24} className="text-white/30" />
                        <span className="text-white/40 text-xs ml-2">Video</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/80 text-black text-xs font-bold">Pending</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-white/70 text-xs font-medium truncate">{item.vendor?.business_name ?? "Unknown vendor"}</p>
                    {item.caption && <p className="text-white/40 text-xs mt-0.5 truncate">{item.caption}</p>}
                    <p className="text-white/30 text-xs mt-1">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => moderateMedia(item.id, "rejected")}
                        disabled={processing === item.id}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-300 hover:bg-red-500/25 text-xs transition-colors"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                      <button
                        onClick={() => moderateMedia(item.id, "approved")}
                        disabled={processing === item.id}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-500/15 border border-green-500/25 text-green-300 hover:bg-green-500/25 text-xs transition-colors"
                      >
                        <CheckCircle2 size={12} /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Architecture note */}
      <div className="p-4 bg-white/4 border border-white/6 rounded-xl text-slate-500 text-xs flex items-start gap-3">
        <AlertTriangle size={14} className="text-amber-500/60 flex-shrink-0 mt-0.5" />
        <span>
          <strong className="text-white/50">Moderation foundation active.</strong> Media uploaded from this point is queued for review before publishing. Future: OpenAI moderation API, Google Vision SafeSearch, or AWS Rekognition can be wired into <code>/api/uploads</code> to auto-classify content.
        </span>
      </div>
    </div>
  );
}

function StatCard({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div className={`bg-white/4 border rounded-xl p-4 ${urgent ? "border-amber-500/30" : "border-white/6"}`}>
      <div className="flex items-center gap-2 mb-1">
        <Flag className={`w-4 h-4 ${urgent ? "text-amber-400" : "text-slate-500"}`} />
        <span className="text-white/50 text-xs">{label}</span>
      </div>
      <p className={`text-xl font-bold ${urgent ? "text-amber-300" : "text-white"}`}>{value}</p>
    </div>
  );
}
