"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar, MapPin, CreditCard, CheckCircle2, Loader2,
  ArrowLeft, Star, FileText, Package, AlertTriangle, XCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { VENDOR_CATEGORIES, type Payment } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import toast from "react-hot-toast";

interface CustomerBookingDetailProps {
  booking: Record<string, unknown>;
  payments: Payment[];
  existingReview: Record<string, unknown> | null;
  showReviewForm: boolean;
  userId: string;
}

export function CustomerBookingDetail({
  booking,
  payments,
  existingReview,
  showReviewForm,
}: CustomerBookingDetailProps) {
  const [payingType, setPayingType] = useState<"deposit" | "full" | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [review, setReview] = useState(existingReview);
  const [showReview, setShowReview] = useState(showReviewForm);

  const event = booking.event as Record<string, string>;
  const vendor = booking.vendor as Record<string, unknown>;
  const pkg = booking.package as Record<string, unknown> | null;
  const invoice = booking.invoice as Record<string, unknown> | null;
  const vendorMedia = (vendor?.media as Array<Record<string, string>>)?.find((m) => m.is_cover) ??
    (vendor?.media as Array<Record<string, string>>)?.[0];
  const cat = VENDOR_CATEGORIES[String(vendor?.category ?? "") as keyof typeof VENDOR_CATEGORIES];

  const status = String(booking.status);
  const paymentStatus = String(booking.payment_status);
  const totalAmount = Number(booking.total_amount ?? 0);
  const depositAmount = Number(booking.deposit_amount ?? 0);
  const vendorId = String(vendor?.id ?? "");

  const canPayDeposit = ["accepted", "confirmed", "pending_payment"].includes(status) && paymentStatus === "pending";
  const canPayFull = ["accepted", "confirmed", "pending_payment"].includes(status) && paymentStatus === "deposit_paid";
  const isCompleted = status === "completed";

  async function handlePayment(type: "deposit" | "full") {
    setPayingType(type);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, paymentType: type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed");
      window.location.href = data.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
      setPayingType(null);
    }
  }

  async function handleReview() {
    if (reviewRating < 1) { toast.error("Please select a rating"); return; }
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          vendor_id: vendorId,
          rating: reviewRating,
          comment: reviewComment || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReview(data);
      setShowReview(false);
      toast.success("Review submitted! Thank you.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/dashboard/bookings" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
        <ArrowLeft size={15} />Back to Bookings
      </Link>

      {/* Vendor Header */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-6">
        <div className="flex items-start gap-5">
          {vendorMedia ? (
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
              <Image src={vendorMedia.url} alt="" fill className="object-cover" sizes="80px" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-4xl flex-shrink-0">
              {cat?.icon}
            </div>
          )}
          <div className="flex-1">
            <div className="text-xs text-brand-400 mb-1">{cat?.label}</div>
            <h1 className="text-xl font-bold text-white">{String(vendor?.business_name ?? "Vendor")}</h1>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-400">
              <span className="flex items-center gap-1"><MapPin size={12} />{String(vendor?.city ?? "")}</span>
              {Number(vendor?.rating) > 0 && (
                <span className="flex items-center gap-1">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {Number(vendor.rating).toFixed(1)}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <StatusBadge status={status} />
              <StatusBadge status={paymentStatus} />
            </div>
          </div>
          <Link href={`/vendors/${vendorId}`} className="btn-secondary text-xs py-1.5 px-3">View Profile</Link>
        </div>
      </div>

      {/* Alerts */}
      {canPayDeposit && (
        <div className="bg-white/4 border border-amber-500/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Pay deposit to confirm your booking</p>
              <p className="text-xs text-slate-400 mt-1">Your booking is accepted. Pay the 30% deposit to secure your vendor.</p>
            </div>
          </div>
        </div>
      )}

      {status === "rejected" ? (
        <div className="bg-white/4 border border-red-500/30 rounded-xl p-5 flex items-center gap-3">
          <XCircle size={18} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Booking was declined</p>
            <p className="text-xs text-slate-400 mt-0.5">Browse other vendors for this category.</p>
          </div>
          <Link href={`/browse?category=${String(vendor?.category ?? "")}`} className="ml-auto btn-secondary text-xs py-1.5 px-3">
            Find Alternatives
          </Link>
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Event Details */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />Event
          </h3>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Event</span>
              <span className="text-white font-medium">{event?.title ?? "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date</span>
              <span className="text-white">{event?.date ? formatDate(event.date) : "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Location</span>
              <span className="text-white">{event?.city ?? "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Guests</span>
              <span className="text-white">{event?.guest_count ?? "N/A"}</span>
            </div>
            {event?.venue_name && (
              <div className="flex justify-between">
                <span className="text-slate-400">Venue</span>
                <span className="text-white">{event.venue_name}</span>
              </div>
            )}
          </dl>
          <Link href={`/dashboard/events/${event?.id}`} className="btn-secondary text-xs py-1.5 px-3 mt-4 inline-flex">
            View Event <ArrowLeft size={12} className="rotate-180" />
          </Link>
        </div>

        {/* Payment Summary */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard size={16} className="text-slate-400" />Payment
          </h3>
          <dl className="space-y-2.5 text-sm mb-5">
            {pkg && (
              <div>
                <span className="text-slate-400 block">Package</span>
                <span className="text-white font-medium">{String(pkg.name)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Total</span>
              <span className="text-white font-bold text-base">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Deposit (30%)</span>
              <span className="text-white">{formatCurrency(depositAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-white/8 pt-2.5">
              <span className="text-slate-400">Balance due</span>
              <span className="text-white font-semibold">
                {formatCurrency(paymentStatus === "deposit_paid" ? totalAmount - depositAmount : totalAmount)}
              </span>
            </div>
          </dl>

          {canPayDeposit && (
            <button
              onClick={() => handlePayment("deposit")}
              disabled={!!payingType}
              className="btn-primary w-full py-3 mb-2"
            >
              {payingType === "deposit" ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
              Pay Deposit · {formatCurrency(depositAmount)}
            </button>
          )}

          {canPayFull && (
            <button
              onClick={() => handlePayment("full")}
              disabled={!!payingType}
              className="btn-primary w-full py-3 mb-2"
            >
              {payingType === "full" ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
              Pay Balance · {formatCurrency(totalAmount - depositAmount)}
            </button>
          )}

          {invoice && (
            <div className="mt-3 p-3 rounded-xl bg-white/4 border border-white/8 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-brand-400" />
                <span className="text-slate-400">Invoice {String(invoice.invoice_number)}</span>
              </div>
              <StatusBadge status={String(invoice.status)} />
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <FileText size={16} className="text-slate-400" />Payment History
          </h3>
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/4">
                <div>
                  <div className="text-sm font-medium text-white capitalize">{p.type} payment</div>
                  <div className="text-xs text-slate-500">{formatDate(p.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{formatCurrency(p.amount)}</div>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Package Includes */}
      {Array.isArray(pkg?.includes) && (pkg.includes as unknown[]).length > 0 && (
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Package size={16} className="text-slate-400" />Package Includes
          </h3>
          <ul className="space-y-2">
            {(pkg.includes as string[]).map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 size={14} className="text-brand-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Review Section */}
      {isCompleted && (
        <div className="bg-white/4 border border-white/6 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Star size={16} className="text-slate-400" />
            {review ? "Your Review" : "Leave a Review"}
          </h3>

          {review ? (
            <div>
              <StarRating rating={Number(review.rating)} size={20} className="mb-3" />
              {!!review.comment && <p className="text-slate-400 text-sm italic">&ldquo;{String(review.comment)}&rdquo;</p>}
              <p className="text-xs text-slate-600 mt-2">Review submitted. Thank you!</p>
            </div>
          ) : showReview ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Rating *</label>
                <StarRating
                  rating={reviewRating}
                  size={28}
                  interactive
                  onChange={setReviewRating}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Comment (optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this vendor..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowReview(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleReview} disabled={submittingReview} className="btn-primary flex-1">
                  {submittingReview ? <Loader2 size={15} className="animate-spin" /> : <Star size={15} />}
                  Submit Review
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-400 text-sm mb-4">Share your experience to help other customers.</p>
              <button onClick={() => setShowReview(true)} className="btn-primary">
                <Star size={15} />Write a Review
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
