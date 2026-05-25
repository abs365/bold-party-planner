"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, MapPin, Users, FileText, Loader2, CheckCircle2, CreditCard } from "lucide-react";
import { cn, formatCurrency, formatDate, calculateCommission, generateInvoiceNumber } from "@/lib/utils";
import { VENDOR_CATEGORIES, COMMISSION_RATE, type Vendor, type VendorPackage, type VendorMedia } from "@/types";
import toast from "react-hot-toast";

interface BookingRequestFormProps {
  vendor: Vendor & { packages: VendorPackage[]; media: VendorMedia[] };
  events: Array<{ id: string; title: string; date: string; city: string; guest_count: number; budget: number }>;
  userId: string;
  preSelectedPackage?: string;
  preSelectedEvent?: string;
}

export function BookingRequestForm({
  vendor,
  events,
  userId,
  preSelectedPackage,
  preSelectedEvent,
}: BookingRequestFormProps) {
  const [selectedPackage, setSelectedPackage] = useState(preSelectedPackage ?? "");
  const [selectedEvent, setSelectedEvent] = useState(preSelectedEvent ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const cat = VENDOR_CATEGORIES[vendor.category];
  const cover = vendor.media?.find((m) => m.is_cover) ?? vendor.media?.[0];
  const pkg = vendor.packages?.find((p) => p.id === selectedPackage);
  const event = events.find((e) => e.id === selectedEvent);

  const totalAmount = pkg?.price ?? vendor.min_price ?? 0;
  const depositAmount = totalAmount * 0.3;
  const commission = calculateCommission(totalAmount, COMMISSION_RATE);
  const vendorPayout = totalAmount - commission;

  async function handleSubmit() {
    if (!selectedEvent || !totalAmount) {
      toast.error("Please select an event and package");
      return;
    }
    setSubmitting(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          event_id: selectedEvent,
          vendor_id: vendor.id,
          package_id: selectedPackage || null,
          customer_id: userId,
          status: "pending",
          payment_status: "pending",
          total_amount: totalAmount,
          deposit_amount: depositAmount,
          commission_amount: commission,
          vendor_payout: vendorPayout,
          notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Create invoice
      await supabase.from("invoices").insert({
        booking_id: booking.id,
        invoice_number: generateInvoiceNumber(),
        customer_id: userId,
        vendor_id: vendor.id,
        line_items: pkg
          ? [{ description: pkg.name, amount: pkg.price }]
          : [{ description: vendor.business_name + " service", amount: totalAmount }],
        subtotal: totalAmount,
        commission,
        total: totalAmount,
        status: "draft",
      });

      // Notify vendor (fire and forget)
      void supabase.rpc("notify_user", {
        p_user_id: vendor.user_id,
        p_title: "New Booking Request",
        p_message: `You have a new booking request for ${event?.title ?? "an event"}`,
        p_type: "booking",
        p_link: `/vendor/bookings/${booking.id}`,
      });

      toast.success("Booking request sent! Waiting for vendor confirmation.");
      router.push(`/dashboard/bookings/${booking.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send booking request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Book a Vendor</h1>
        <p className="text-slate-400 text-sm mt-1">Your request will be sent to the vendor for confirmation</p>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Form */}
        <div className="md:col-span-3 space-y-6">
          {/* Vendor Card */}
          <div className="glass-card p-5 flex items-center gap-4">
            {cover ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={cover.url} alt={vendor.business_name} fill className="object-cover" sizes="64px" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-3xl flex-shrink-0">
                {cat?.icon}
              </div>
            )}
            <div>
              <h3 className="font-bold text-white">{vendor.business_name}</h3>
              <p className="text-sm text-slate-400">{cat?.label} · {vendor.city}</p>
              {vendor.rating > 0 && (
                <p className="text-xs text-amber-400">★ {vendor.rating.toFixed(1)} ({vendor.review_count} reviews)</p>
              )}
            </div>
          </div>

          {/* Select Package */}
          {vendor.packages.length > 0 && (
            <div className="glass-card p-5">
              <label className="block text-sm font-semibold text-white mb-3">Select Package</label>
              <div className="space-y-3">
                {vendor.packages.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPackage(p.id === selectedPackage ? "" : p.id)}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all",
                      selectedPackage === p.id
                        ? "border-brand-500/40 bg-brand-500/10"
                        : "border-white/10 bg-white/4 hover:border-white/20"
                    )}
                  >
                    <div className="flex justify-between mb-1">
                      <div className="font-semibold text-white text-sm">{p.name}</div>
                      <div className="font-bold text-white">{formatCurrency(p.price)}</div>
                    </div>
                    <p className="text-xs text-slate-500">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Select Event */}
          <div className="glass-card p-5">
            <label className="block text-sm font-semibold text-white mb-3">
              <Calendar size={14} className="inline mr-1.5 text-brand-400" />Select Event *
            </label>
            {events.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm mb-3">No events found. Create an event first.</p>
                <a href="/dashboard/create-event" className="btn-primary text-xs py-2 px-4">Create Event</a>
              </div>
            ) : (
              <div className="space-y-2.5">
                {events.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => setSelectedEvent(e.id === selectedEvent ? "" : e.id)}
                    className={cn(
                      "p-3.5 rounded-xl border cursor-pointer transition-all",
                      selectedEvent === e.id
                        ? "border-brand-500/40 bg-brand-500/10"
                        : "border-white/10 bg-white/4 hover:border-white/20"
                    )}
                  >
                    <div className="font-medium text-white text-sm">{e.title}</div>
                    <div className="flex gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(e.date)}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{e.city}</span>
                      <span className="flex items-center gap-1"><Users size={11} />{e.guest_count} guests</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="glass-card p-5">
            <label className="block text-sm font-semibold text-white mb-2">
              <FileText size={14} className="inline mr-1.5 text-brand-400" />Message to Vendor
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific requirements, timing details, special requests..."
              rows={4}
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="md:col-span-2">
          <div className="glass-card p-5 sticky top-24 space-y-5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <CreditCard size={16} className="text-brand-400" />
              Booking Summary
            </h3>

            {pkg ? (
              <div>
                <div className="text-sm text-slate-400 mb-1">Selected Package</div>
                <div className="font-semibold text-white">{pkg.name}</div>
                <div className="text-brand-400 font-bold">{formatCurrency(pkg.price)}</div>
              </div>
            ) : vendor.min_price ? (
              <div>
                <div className="text-sm text-slate-400 mb-1">Starting from</div>
                <div className="text-2xl font-bold text-white">{formatCurrency(vendor.min_price)}</div>
              </div>
            ) : null}

            {totalAmount > 0 && (
              <div className="space-y-2 pt-3 border-t border-white/8 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Service total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Deposit (30%)</span>
                  <span>{formatCurrency(depositAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Platform fee ({Math.round(COMMISSION_RATE * 100)}%)</span>
                  <span>{formatCurrency(commission)}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2 border-t border-white/8">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            )}

            {event && (
              <div className="glass p-3 rounded-xl text-xs text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1.5"><Calendar size={12} />{formatDate(event.date)}</div>
                <div className="flex items-center gap-1.5"><MapPin size={12} />{event.city}</div>
                <div className="flex items-center gap-1.5"><Users size={12} />{event.guest_count} guests</div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedEvent || !totalAmount}
              className="btn-primary w-full py-3.5"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {submitting ? "Sending Request..." : "Send Booking Request"}
            </button>

            <p className="text-center text-xs text-slate-600">
              No payment charged until vendor confirms
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
