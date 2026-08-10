"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, MapPin, Users, FileText, Loader2, CheckCircle2, CreditCard } from "lucide-react";
import { cn, formatCurrency, formatPackagePrice, formatDate, calculateCommission } from "@/lib/utils";
import { VENDOR_CATEGORIES, type Vendor, type VendorPackage, type VendorMedia } from "@/types";
import toast from "react-hot-toast";

interface BookingRequestFormProps {
  vendor: Vendor & { packages: VendorPackage[]; media: VendorMedia[] };
  events: Array<{ id: string; title: string; date: string; city: string; guest_count: number; budget: number }>;
  preSelectedPackage?: string;
  preSelectedEvent?: string;
}

export function BookingRequestForm({
  vendor,
  events,
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

  // Display-only — the actual figures used to create the booking are
  // recomputed server-side in POST /api/bookings from the real package
  // price, never trusted from the client (REG-05).
  const totalAmount = pkg?.price ?? vendor.min_price ?? 0;
  const depositAmount = totalAmount * 0.3;
  const commission = calculateCommission(totalAmount, vendor);
  // Display-only percentage derived from the actual computed commission
  // (which already reflects any active founding-vendor waiver), rather than
  // a separately hardcoded rate that could drift from what the server
  // actually charges.
  const commissionRatePercent = totalAmount > 0 ? Math.round((commission / totalAmount) * 100) : 0;

  async function handleSubmit() {
    if (!selectedEvent || !totalAmount) {
      toast.error("Please select an event and package");
      return;
    }
    setSubmitting(true);
    try {
      // REG-05: price/commission/payout are computed server-side (from the
      // real package price and availability) — this only sends identifiers,
      // never the amounts shown above (those are display-only, computed
      // client-side purely so the summary panel renders before submit).
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: selectedEvent,
          vendor_id: vendor.id,
          package_id: selectedPackage || null,
          notes,
        }),
      });
      const booking = await res.json();
      if (!res.ok) throw new Error(booking.error ?? "Failed to send booking request");

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
          <div className="bg-white/4 border border-white/6 rounded-xl p-5 flex items-center gap-4">
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
            <div className="bg-white/4 border border-white/6 rounded-xl p-5">
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
                      <div className="font-bold text-white">{formatPackagePrice(p.price, p.pricing_type)}</div>
                    </div>
                    <p className="text-xs text-slate-500">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Select Event */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
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
          <div className="bg-white/4 border border-white/6 rounded-xl p-5">
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
          <div className="bg-white/4 border border-white/6 rounded-xl p-5 sticky top-24 space-y-5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <CreditCard size={16} className="text-brand-400" />
              Booking Summary
            </h3>

            {pkg ? (
              <div>
                <div className="text-sm text-slate-400 mb-1">Selected Package</div>
                <div className="font-semibold text-white">{pkg.name}</div>
                <div className="text-brand-400 font-bold">
                  {formatPackagePrice(pkg.price, pkg.pricing_type)}
                </div>
                {pkg.pricing_type === "price_on_request" && (
                  <p className="text-xs text-slate-500 mt-1">
                    Price confirmed by vendor after enquiry.
                  </p>
                )}
              </div>
            ) : vendor.min_price ? (
              <div>
                <div className="text-sm text-slate-400 mb-1">Starting from</div>
                <div className="text-2xl font-bold text-white">{formatCurrency(vendor.min_price)}</div>
              </div>
            ) : null}

            {totalAmount > 0 && pkg?.pricing_type !== "price_on_request" && (
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
                  <span>Platform fee ({commissionRatePercent}%)</span>
                  <span>{formatCurrency(commission)}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2 border-t border-white/8">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            )}

            {event && (
              <div className="bg-white/4 border border-white/6 p-3 rounded-xl text-xs text-slate-400 space-y-1.5">
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
