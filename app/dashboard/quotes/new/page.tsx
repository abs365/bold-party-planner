"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, MessageCircle, CalendarDays, Users, Banknote } from "lucide-react";
import toast from "react-hot-toast";
import { EVENT_TYPES } from "@/types";

const EVENT_TYPE_LIST = Object.entries(EVENT_TYPES).map(([value, { label }]) => ({ value, label }));

function NewQuoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = searchParams.get("vendor") ?? "";
  const vendorName = searchParams.get("name") ?? "";

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [requirements, setRequirements] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorId) {
      toast.error("No vendor selected");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          message: message || undefined,
          requirements: requirements || undefined,
          event_date: eventDate || undefined,
          event_type: eventType || undefined,
          guest_count: guestCount ? parseInt(guestCount) : undefined,
          budget_min: budgetMin ? parseFloat(budgetMin) : undefined,
          budget_max: budgetMax ? parseFloat(budgetMax) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send quote");
      toast.success("Quote request sent! The vendor will respond shortly.");
      router.push("/dashboard/quotes");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send quote");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-xl mx-auto">
        <Link href={vendorId ? `/vendors/${vendorId}` : "/browse"} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft size={15} />
          Back to vendor
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Request a Free Quote</h1>
          {vendorName && (
            <p className="text-slate-400 mt-1">You&apos;re requesting a quote from <span className="text-white font-medium">{vendorName}</span></p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
              <MessageCircle size={14} className="text-brand-400" />
              Tell the vendor about your event
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. I'm planning a 30th birthday party for around 80 guests..."
              rows={4}
              className="input-field resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                <CalendarDays size={14} className="text-brand-400" />
                Event Date
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="input-field"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="input-field"
              >
                <option value="">Select type</option>
                {EVENT_TYPE_LIST.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Guest Count */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                <Users size={14} className="text-brand-400" />
                Guest Count
              </label>
              <input
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                placeholder="e.g. 80"
                className="input-field"
                min={1}
                max={10000}
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                <Banknote size={14} className="text-brand-400" />
                Budget Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="Min £"
                  className="input-field w-1/2"
                  min={0}
                />
                <input
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="Max £"
                  className="input-field w-1/2"
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Specific Requirements <span className="text-slate-500">(optional)</span></label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Any specific requirements, preferences, or questions for the vendor..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              {loading ? "Sending..." : "Send Quote Request"}
            </button>
            <p className="text-center text-xs text-slate-500 mt-3">
              Free to request · No payment required · Vendor responds within 24 hours
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-brand-400" />
      </div>
    }>
      <NewQuoteForm />
    </Suspense>
  );
}
