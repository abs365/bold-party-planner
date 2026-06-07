"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, MessageCircle, CalendarDays, Users, Banknote, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
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
    if (!vendorId) { toast.error("No vendor selected"); return; }
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
      toast.success("Quote sent! The vendor will respond within 24 hours.");
      router.push("/dashboard/quotes");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send quote");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-16" style={{ background: "#07111e" }}>
      <div className="max-w-lg mx-auto">
        <Link
          href={vendorId ? `/vendors/${vendorId}` : "/browse"}
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <ArrowLeft size={15} />
          Back to vendor
        </Link>

        {/* Heading */}
        <div className="mb-7">
          <p
            className="text-xs tracking-[0.3em] font-semibold uppercase mb-3"
            style={{ color: "rgba(212,175,55,0.65)" }}
          >
            Free &middot; No Obligation &middot; No Payment Required
          </p>
          <h1 className="text-2xl font-bold text-white">Request a Free Quote</h1>
          {vendorName && (
            <p className="mt-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              You&apos;re requesting a quote from{" "}
              <span className="text-white font-medium">{vendorName}</span>
            </p>
          )}
        </div>

        {/* Reassurance strip */}
        <div
          className="grid grid-cols-3 gap-3 mb-7 p-4 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {[
            { icon: ShieldCheck, label: "Secure platform", sub: "Verified vendors only" },
            { icon: Clock, label: "Responds in 24h", sub: "Or we follow up" },
            { icon: CheckCircle2, label: "No obligation", sub: "Free to request" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="text-center">
              <Icon size={18} className="mx-auto mb-1.5" style={{ color: "#D4AF37" }} />
              <div className="text-xs font-semibold text-white">{label}</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Message */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                <MessageCircle size={14} style={{ color: "#D4AF37" }} />
                Tell us about your celebration
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. I am planning a 30th birthday party for around 80 guests in Chelmsford this September..."
                rows={4}
                className="input-field resize-none"
                required
              />
              <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                The more detail you share, the more accurate your quote will be.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Event Date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <CalendarDays size={14} style={{ color: "#D4AF37" }} />
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
                <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Event Type
                </label>
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
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <Users size={14} style={{ color: "#D4AF37" }} />
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
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <Banknote size={14} style={{ color: "#D4AF37" }} />
                  Budget Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    placeholder="Min"
                    className="input-field w-1/2"
                    min={0}
                  />
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="Max"
                    className="input-field w-1/2"
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Specific Requirements */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                Specific Requirements{" "}
                <span style={{ color: "rgba(255,255,255,0.3)" }}>(optional)</span>
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Any specific questions, preferences or themes the vendor should know about..."
                rows={3}
                className="input-field resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            style={{ background: "#D4AF37", color: "#0B1F4D" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
            {loading ? "Sending your request..." : "Send Quote Request"}
          </button>

          {/* What happens next */}
          <div
            className="p-4 rounded-xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(212,175,55,0.5)" }}>
              What happens next
            </p>
            <ol className="space-y-2">
              {[
                "Your request is sent securely to the vendor.",
                "The vendor reviews your details and responds within 24 hours.",
                "You receive their quote and can ask questions or confirm a booking.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <span
                    className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07111e" }}>
        <Loader2 size={20} className="animate-spin" style={{ color: "#D4AF37" }} />
      </div>
    }>
      <NewQuoteForm />
    </Suspense>
  );
}
