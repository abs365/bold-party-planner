"use client";

import { useState } from "react";
import { Star, Flag, CheckCircle, Trash2, AlertTriangle, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewRow {
  id: string;
  vendor_id: string;
  rating: number;
  comment: string | null;
  response: string | null;
  moderation_status: string;
  moderation_notes: string | null;
  is_verified: boolean;
  created_at: string;
  communication_rating:   number | null;
  professionalism_rating: number | null;
  punctuality_rating:     number | null;
  quality_rating:         number | null;
  value_rating:           number | null;
  vendor:    { id: string; business_name: string } | null;
  customer:  { full_name: string | null; email: string } | null;
  reports:   { id: string; reason: string; status: string }[];
}

interface Props {
  initialReviews: ReviewRow[];
}

const STATUS_TAB = ["flagged", "approved", "removed"] as const;
type StatusTab = typeof STATUS_TAB[number];

const SUB_LABELS: Record<string, string> = {
  communication_rating:   "Communication",
  professionalism_rating: "Professionalism",
  punctuality_rating:     "Punctuality",
  quality_rating:         "Quality",
  value_rating:           "Value",
};

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <Star
          key={n}
          size={12}
          className={n <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
        />
      ))}
    </span>
  );
}

export function AdminReviewsView({ initialReviews }: Props) {
  const [reviews, setReviews] = useState<ReviewRow[]>(initialReviews);
  const [activeTab, setActiveTab] = useState<StatusTab>("flagged");
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const filtered = reviews.filter((r) => r.moderation_status === activeTab);

  async function moderate(reviewId: string, action: "approve" | "flag" | "remove") {
    setLoading(reviewId);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, review_id: reviewId, notes: notesMap[reviewId] }),
      });
      if (!res.ok) throw new Error(await res.text());
      const statusMap = { approve: "approved", flag: "flagged", remove: "removed" };
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, moderation_status: statusMap[action] } : r
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-2 border-b border-white/10">
        {STATUS_TAB.map((tab) => {
          const count = reviews.filter((r) => r.moderation_status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors",
                activeTab === tab
                  ? "border-brand-400 text-brand-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              )}
            >
              {tab} <span className="ml-1 text-xs opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          No {activeTab} reviews
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((review) => {
          const isOpen = expanded === review.id;
          const openReports = review.reports?.filter((r) => r.status === "open") ?? [];

          return (
            <div
              key={review.id}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
            >
              {/* Header row */}
              <div className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarRow rating={review.rating} />
                    <span className="text-sm font-medium text-gray-200">
                      {review.vendor?.business_name ?? "Unknown vendor"}
                    </span>
                    {review.is_verified && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Verified booking
                      </span>
                    )}
                    {openReports.length > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
                        <Flag size={10} />
                        {openReports.length} report{openReports.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {review.customer?.full_name ?? review.customer?.email ?? "Anonymous"} ·{" "}
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-gray-300 line-clamp-2">{review.comment}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpanded(isOpen ? null : review.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
                  >
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  {/* Sub-ratings */}
                  {Object.keys(SUB_LABELS).some((k) => review[k as keyof ReviewRow] !== null) && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {Object.entries(SUB_LABELS).map(([key, label]) => {
                        const val = review[key as keyof ReviewRow] as number | null;
                        if (val === null) return null;
                        return (
                          <div key={key} className="bg-white/5 rounded-lg p-2 text-center">
                            <div className="text-xs text-gray-500 mb-1">{label}</div>
                            <StarRow rating={val} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reports */}
                  {review.reports?.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-400 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Reports
                      </div>
                      {review.reports.map((rep) => (
                        <div key={rep.id} className="text-xs text-gray-500 bg-white/5 rounded px-3 py-1.5 flex justify-between">
                          <span className="capitalize">{rep.reason.replace(/_/g, " ")}</span>
                          <span className="capitalize opacity-60">{rep.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Vendor response */}
                  {review.response && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                        <MessageSquare size={12} /> Vendor response
                      </div>
                      <p className="text-sm text-gray-300">{review.response}</p>
                    </div>
                  )}

                  {/* Moderation notes */}
                  <textarea
                    rows={2}
                    placeholder="Moderation notes (optional)…"
                    value={notesMap[review.id] ?? ""}
                    onChange={(e) => setNotesMap((prev) => ({ ...prev, [review.id]: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                  />

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {review.moderation_status !== "approved" && (
                      <button
                        onClick={() => moderate(review.id, "approve")}
                        disabled={loading === review.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-sm hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                    )}
                    {review.moderation_status !== "flagged" && (
                      <button
                        onClick={() => moderate(review.id, "flag")}
                        disabled={loading === review.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 text-sm hover:bg-amber-500/25 disabled:opacity-50"
                      >
                        <Flag size={14} /> Flag
                      </button>
                    )}
                    {review.moderation_status !== "removed" && (
                      <button
                        onClick={() => moderate(review.id, "remove")}
                        disabled={loading === review.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-sm hover:bg-red-500/25 disabled:opacity-50"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
