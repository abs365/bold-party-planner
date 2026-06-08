"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import { StarRating } from "@/components/ui/StarRating";
import toast from "react-hot-toast";

interface VendorReviewsViewProps {
  reviews: Record<string, unknown>[];
  vendorRating: number;
  totalReviews: number;
}

export function VendorReviewsView({ reviews, vendorRating, totalReviews }: VendorReviewsViewProps) {
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localReviews, setLocalReviews] = useState(reviews);

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Number(r.rating) === star).length,
  }));

  async function submitResponse(reviewId: string) {
    if (!responseText.trim()) { toast.error("Please write a response"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: reviewId, response: responseText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLocalReviews((prev) => prev.map((r) => String(r.id) === reviewId ? { ...r, response: responseText } : r));
      setRespondingTo(null);
      setResponseText("");
      toast.success("Response posted!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to post response");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reviews</h1>
        <p className="text-slate-400 text-sm mt-1">Manage and respond to customer feedback</p>
      </div>

      {/* Rating Summary */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-white">{vendorRating > 0 ? vendorRating.toFixed(1) : "N/A"}</div>
            <StarRating rating={vendorRating} size={18} className="mt-2 justify-center" />
            <div className="text-xs text-slate-400 mt-1">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</div>
          </div>
          <div className="flex-1 space-y-2">
            {ratingCounts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-3">{star}</span>
                <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: totalReviews > 0 ? `${(count / totalReviews) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-5 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {localReviews.length === 0 ? (
        <div className="bg-white/4 border border-white/6 rounded-xl p-16 text-center">
          <Star size={36} className="text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-white mb-1">No reviews yet</h3>
          <p className="text-slate-400 text-sm">Reviews appear here after customers complete bookings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {localReviews.map((review) => {
            const customer = review.customer as Record<string, string> | null;
            const reviewId = String(review.id);
            const hasResponse = !!review.response;
            const isResponding = respondingTo === reviewId;

            return (
              <div key={reviewId} className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-4">
                {/* Review Header */}
                <div className="flex items-start gap-3">
                  {customer?.avatar_url ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <Image src={customer.avatar_url} alt="" fill className="object-cover" sizes="40px" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {getInitials(customer?.full_name ?? "?")}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{customer?.full_name ?? "Customer"}</span>
                      <StarRating rating={Number(review.rating)} size={13} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{formatDate(String(review.created_at))}</div>
                  </div>
                </div>

                {!!review.comment && (
                  <p className="text-slate-300 text-sm italic">&ldquo;{String(review.comment)}&rdquo;</p>
                )}

                {/* Vendor Response */}
                {hasResponse && (
                  <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4">
                    <div className="text-xs text-brand-400 font-semibold mb-1.5">Your Response</div>
                    <p className="text-sm text-slate-300">{String(review.response)}</p>
                  </div>
                )}

                {!hasResponse && !isResponding && (
                  <button
                    onClick={() => { setRespondingTo(reviewId); setResponseText(""); }}
                    className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <MessageSquare size={12} />Reply to Review
                  </button>
                )}

                {isResponding && (
                  <div className="space-y-3">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Write a professional, helpful response..."
                      rows={3}
                      className="input-field resize-none w-full"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setRespondingTo(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
                      <button
                        onClick={() => submitResponse(reviewId)}
                        disabled={submitting}
                        className="btn-primary flex-1 text-sm"
                      >
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Post Response
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
  );
}
