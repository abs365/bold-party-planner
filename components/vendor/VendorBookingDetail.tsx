"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, MapPin, Users, DollarSign, MessageSquare,
  CheckCircle2, XCircle, Loader2, FileText, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import type { Booking } from "@/types";
import toast from "react-hot-toast";

export function VendorBookingDetail({ booking }: { booking: Booking }) {
  const [loading, setLoading] = useState<"accept" | "reject" | "complete" | null>(null);
  const [responseNote, setResponseNote] = useState("");
  const router = useRouter();

  type LooseRecord = Record<string, string | number | boolean | null | undefined>;
  const event = (booking.event ?? {}) as LooseRecord;
  const customer = (booking.customer ?? {}) as LooseRecord;
  const pkg = booking.package ? (booking.package as unknown as LooseRecord) : null;

  async function handleAction(action: "accept" | "reject" | "complete") {
    setLoading(action);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const newStatus =
        action === "accept" ? "accepted" :
        action === "reject" ? "rejected" : "completed";

      const { error } = await supabase
        .from("bookings")
        .update({
          status: newStatus,
          ...(action === "accept" ? { confirmed_at: new Date().toISOString() } : {}),
        })
        .eq("id", booking.id);

      if (error) throw error;

      // Notify customer
      void supabase.rpc("notify_user", {
        p_user_id: booking.customer_id,
        p_title: action === "accept" ? "Booking Accepted!" : action === "reject" ? "Booking Rejected" : "Event Completed",
        p_message: action === "accept"
          ? `Your booking has been accepted. ${responseNote}`
          : action === "reject"
          ? `Your booking request was declined. ${responseNote}`
          : "Your event has been marked as completed.",
        p_type: "booking",
        p_link: `/dashboard/bookings/${booking.id}`,
      });

      toast.success(
        action === "accept" ? "Booking accepted!" :
        action === "reject" ? "Booking rejected" : "Marked as completed"
      );
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/vendor/bookings" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft size={18} className="text-slate-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Booking Request</h1>
          <p className="text-slate-400 text-sm">
            {String(event?.title ?? "Event")} · {formatDate(booking.created_at)}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={booking.status} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Event Details */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />Event Details
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-slate-500">Event</dt>
              <dd className="text-sm font-medium text-white">{String(event?.title ?? "N/A")}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Date</dt>
              <dd className="text-sm text-white flex items-center gap-1.5">
                <Calendar size={12} className="text-brand-400" />
                {event?.date ? formatDate(String(event.date)) : "N/A"}
                {event?.start_time && ` at ${event.start_time}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Location</dt>
              <dd className="text-sm text-white flex items-center gap-1.5">
                <MapPin size={12} className="text-brand-400" />
                {String(event?.city ?? "N/A")}
                {event?.venue_name && ` · ${event.venue_name}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Guests</dt>
              <dd className="text-sm text-white flex items-center gap-1.5">
                <Users size={12} className="text-brand-400" />
                {String(event?.guest_count ?? "N/A")}
              </dd>
            </div>
            {event?.theme && (
              <div>
                <dt className="text-xs text-slate-500">Theme</dt>
                <dd className="text-sm text-white">{String(event.theme)}</dd>
              </div>
            )}
            {event?.notes && (
              <div>
                <dt className="text-xs text-slate-500">Notes</dt>
                <dd className="text-sm text-slate-400 italic">{String(event.notes)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Customer + Payment */}
        <div className="space-y-5">
          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Users size={16} className="text-slate-400" />Customer
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-sm font-bold text-white">
                {String(customer?.full_name ?? "?")[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-white">{String(customer?.full_name ?? "N/A")}</div>
                <div className="text-xs text-slate-500">{String(customer?.email ?? "N/A")}</div>
                {customer?.phone && <div className="text-xs text-slate-500">{String(customer.phone)}</div>}
              </div>
            </div>
          </div>

          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-slate-400" />Payment
            </h3>
            <dl className="space-y-2 text-sm">
              {pkg && <div className="text-slate-400">{String(pkg.name)} package</div>}
              <div className="flex justify-between">
                <span className="text-slate-400">Total</span>
                <span className="font-bold text-white">{formatCurrency(booking.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Your payout (90%)</span>
                <span className="font-semibold text-emerald-400">{formatCurrency(booking.vendor_payout)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deposit</span>
                <span className="text-white">{formatCurrency(booking.deposit_amount)}</span>
              </div>
            </dl>
            <div className="mt-3 pt-3 border-t border-white/8">
              <StatusBadge status={booking.payment_status} />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Notes */}
      {booking.notes && (
        <div className="bg-white/4 border border-white/6 rounded-xl p-5">
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <MessageSquare size={16} className="text-slate-400" />Message from Customer
          </h3>
          <p className="text-slate-400 text-sm italic">{booking.notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      {booking.status === "pending" && (
        <div className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <FileText size={16} className="text-slate-400" />Respond to Request
          </h3>
          <textarea
            value={responseNote}
            onChange={(e) => setResponseNote(e.target.value)}
            placeholder="Optional message to customer..."
            rows={3}
            className="input-field resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => handleAction("reject")}
              disabled={loading !== null}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all",
                "bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25"
              )}
            >
              {loading === "reject" ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
              Decline
            </button>
            <button
              onClick={() => handleAction("accept")}
              disabled={loading !== null}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all",
                "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25"
              )}
            >
              {loading === "accept" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Accept Booking
            </button>
          </div>
        </div>
      )}

      {booking.status === "confirmed" || booking.status === "accepted" ? (
        <button
          onClick={() => handleAction("complete")}
          disabled={loading !== null}
          className="btn-primary w-full py-3"
        >
          {loading === "complete" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          Mark as Completed
        </button>
      ) : null}
    </div>
  );
}
