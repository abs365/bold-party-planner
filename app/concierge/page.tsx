"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle2, ArrowRight, Calendar, MapPin, Users, Sparkles } from "lucide-react";

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Corporate",
  "Anniversary",
  "Baby Shower",
  "Cultural Celebration",
  "Graduation",
  "Engagement",
  "Christening",
  "Other",
];

const BUDGET_OPTIONS = [
  "Under £500",
  "£500 to £1,000",
  "£1,000 to £2,500",
  "£2,500 to £5,000",
  "£5,000 to £10,000",
  "Over £10,000",
  "Not sure yet",
];

export default function ConciergePage() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    event_type: "",
    event_date: "",
    location: "",
    guest_count: "",
    budget: "",
    notes: "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.event_type) {
      setError("Please fill in your name, email address and event type.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guest_count: form.guest_count ? parseInt(form.guest_count, 10) : null,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStep("success");
    } catch {
      setError("Something went wrong. Please try again or email us at support@elbold.com.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={null} />

      {step === "success" ? (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="max-w-lg w-full text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8"
              style={{ background: "#0D1B3E" }}
            >
              <CheckCircle2 size={28} style={{ color: "#C9A84C" }} />
            </div>
            <h1 className="text-3xl font-light text-gray-900 tracking-tight mb-4">
              We have your request.
            </h1>
            <p className="text-gray-500 font-light leading-relaxed mb-3">
              Thank you for reaching out. We will personally review your event details and match you with suitable verified vendors within <strong className="text-gray-900">24 hours</strong>.
            </p>
            <p className="text-gray-400 font-light text-sm leading-relaxed mb-10">
              Check your inbox for a confirmation. You are welcome to browse the marketplace in the meantime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/browse" className="btn-luxury">
                Browse Vendors
              </Link>
              <Link href="/" className="btn-luxury-outline">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Hero */}
          <section className="pt-16 pb-16 px-4" style={{ background: "#0D1B3E" }}>
            <div className="max-w-3xl mx-auto text-center pt-16">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 tracking-[0.2em] uppercase"
                style={{
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  color: "rgba(201,168,76,0.8)",
                }}
              >
                <Sparkles size={11} />
                Concierge Planning Service
              </div>
              <h1
                className="text-4xl sm:text-5xl font-light tracking-tight mb-6 leading-tight"
                style={{ color: "rgba(255,255,255,0.92)" }}
              >
                Tell us about your event.
                <br />
                <span style={{ color: "#C9A84C" }}>We will find the right vendors for you.</span>
              </h1>
              <p
                className="text-base font-light max-w-xl mx-auto leading-relaxed"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                Not sure where to start? Fill in the form below and a member of the Elbold team will personally match you with verified professionals who are right for your event.
              </p>
            </div>
          </section>

          {/* How it works strip */}
          <div className="border-b border-gray-100 bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 py-6 grid grid-cols-3 gap-4">
              {[
                { icon: Calendar, label: "Tell us what you need", sub: "A few details about your event" },
                { icon: Sparkles, label: "We match suitable vendors", sub: "Vetted professionals in your area" },
                { icon: CheckCircle2, label: "You choose who to book", sub: "No obligation, no pressure" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="text-center">
                  <Icon size={18} className="mx-auto mb-2 text-gray-400" />
                  <div className="text-xs font-semibold text-gray-900">{label}</div>
                  <div className="text-xs text-gray-400 font-light mt-0.5">{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <section className="py-16 px-4">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={(e) => { void submit(e); }} className="space-y-6">

                {/* Your details */}
                <div>
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Your details</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Full name <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="Sarah Johnson"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Email address <span className="text-red-400">*</span></label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="sarah@example.com"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone number <span className="text-gray-400 font-light">(optional)</span></label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+44 7700 900000"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Event details */}
                <div>
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Event details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Type of event <span className="text-red-400">*</span></label>
                      <select
                        value={form.event_type}
                        onChange={(e) => set("event_type", e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors bg-white"
                      >
                        <option value="">Select event type</option>
                        {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          <Calendar size={11} className="inline mr-1" />
                          Event date <span className="text-gray-400 font-light">(approx)</span>
                        </label>
                        <input
                          type="date"
                          value={form.event_date}
                          onChange={(e) => set("event_date", e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          <MapPin size={11} className="inline mr-1" />
                          Location or city
                        </label>
                        <input
                          type="text"
                          value={form.location}
                          onChange={(e) => set("location", e.target.value)}
                          placeholder="e.g. Chelmsford, Essex"
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          <Users size={11} className="inline mr-1" />
                          Approximate guest count
                        </label>
                        <input
                          type="number"
                          value={form.guest_count}
                          onChange={(e) => set("guest_count", e.target.value)}
                          placeholder="e.g. 80"
                          min="1"
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Budget</label>
                        <select
                          value={form.budget}
                          onChange={(e) => set("budget", e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors bg-white"
                        >
                          <option value="">Select a range</option>
                          {BUDGET_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Anything else we should know</label>
                      <textarea
                        value={form.notes}
                        onChange={(e) => set("notes", e.target.value)}
                        placeholder="Tell us about the vibe, any specific requirements, vendors you are already considering, or anything else that would help us match you well."
                        rows={4}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "#0D1B3E", color: "#C9A84C", border: "2px solid #C9A84C" }}
                >
                  {loading ? "Sending..." : (
                    <>Send My Request <ArrowRight size={14} /></>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center font-light">
                  We respond within 24 hours. No obligation. No spam.
                </p>
              </form>
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}
