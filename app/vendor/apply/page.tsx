"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MapPin, FileText, ArrowRight, CheckCircle2 } from "lucide-react";
import { VENDOR_CATEGORIES, type VendorCategory } from "@/types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const BENEFITS = [
  { icon: "💰", label: "Keep 90% of every booking" },
  { icon: "🎯", label: "Free to join, no monthly fees" },
  { icon: "📈", label: "Reach thousands of event hosts" },
  { icon: "⭐", label: "Build reviews and reputation" },
];

export default function VendorApplyPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    category: "" as VendorCategory | "",
    bio: "",
    location: "",
    city: "",
    travel_radius_km: 30,
    min_price: "",
    max_price: "",
    years_experience: "",
    instagram_url: "",
    website_url: "",
  });

  function update(key: string, value: string | number) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!formData.business_name || !formData.category || !formData.city) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const res = await fetch("/api/vendor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: formData.business_name,
          category: formData.category,
          bio: formData.bio || null,
          location: formData.location,
          city: formData.city,
          travel_radius_km: formData.travel_radius_km,
          min_price: formData.min_price ? Number(formData.min_price) : null,
          max_price: formData.max_price ? Number(formData.max_price) : null,
          years_experience: formData.years_experience ? Number(formData.years_experience) : null,
          instagram_url: formData.instagram_url || null,
          website_url: formData.website_url || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Submission failed");
      }

      toast.success("Application submitted! Check your email — we'll be in touch within 24–48 hours.");
      window.location.href = "/vendor/dashboard";
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Luxury page header — navy */}
      <div className="pt-16" style={{ background: "#0D1B3E" }}>
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <p
            className="text-xs tracking-[0.3em] font-semibold mb-5 uppercase"
            style={{ color: "rgba(201,168,76,0.65)" }}
          >
            Vendor Application
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light tracking-tight mb-4"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Join ELBOLD Events as a Vendor
          </h1>
          <p
            className="max-w-lg mx-auto text-base font-light leading-relaxed"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Reach event hosts across the UK. Free to join, no monthly fees, and you keep 90% of every booking.
          </p>
        </div>
      </div>

      <div className="pb-20 px-4">
        <div className="max-w-5xl mx-auto -mt-0 pt-12">

          <div className="grid lg:grid-cols-5 gap-10">

            {/* Left sidebar — benefits */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Why join ELBOLD?</h2>
                <div className="space-y-3">
                  {BENEFITS.map((b) => (
                    <div key={b.label} className="flex items-center gap-3">
                      <span className="text-lg">{b.icon}</span>
                      <span className="text-sm text-gray-600">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">What happens next?</h2>
                <div className="space-y-4">
                  {[
                    { n: "1", label: "Submit your application", sub: "Takes about 5 minutes" },
                    { n: "2", label: "We review and approve", sub: "Usually within 24–48 hours" },
                    { n: "3", label: "Set up your profile", sub: "Add photos, packages and pricing" },
                    { n: "4", label: "Start receiving bookings", sub: "Customers discover and book you" },
                  ].map(({ n, label, sub }) => (
                    <div key={n} className="flex gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(13,27,62,0.08)", border: "1px solid rgba(13,27,62,0.15)", color: "#0D1B3E" }}
                      >
                        {n}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Already have an account?{" "}
                <Link href="/login" className="text-gray-600 hover:text-gray-900 underline">Sign in here</Link>
              </p>
            </div>

            {/* Right — form */}
            <div className="lg:col-span-3">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                      style={{
                        background: step > s ? "#22c55e" : step === s ? "#0D1B3E" : "#f3f4f6",
                        color: step > s || step === s ? "white" : "#9ca3af",
                      }}
                    >
                      {step > s ? <CheckCircle2 size={14} /> : s}
                    </div>
                    <span className={cn(
                      "text-xs font-medium hidden sm:block",
                      step === s ? "text-gray-900" : "text-gray-400"
                    )}>
                      {s === 1 ? "Your Business" : s === 2 ? "Location & Pricing" : "About & Links"}
                    </span>
                    {s < 3 && <div className="w-8 h-px bg-gray-200 flex-shrink-0" />}
                  </div>
                ))}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">

                {/* Step 1 — Business basics */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name *</label>
                      <input
                        type="text"
                        value={formData.business_name}
                        onChange={(e) => update("business_name", e.target.value)}
                        placeholder="e.g. DJ Maxwell, Luxe Decor by Amara"
                        className="input-light"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Service Category *</label>
                      <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                        {Object.entries(VENDOR_CATEGORIES).map(([key, { label, icon, description }]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => update("category", key)}
                            className="flex items-center gap-2.5 p-3 rounded-xl text-left text-sm transition-all border"
                            style={formData.category === key
                              ? { background: "rgba(13,27,62,0.06)", borderColor: "rgba(13,27,62,0.25)", color: "#0D1B3E" }
                              : { background: "white", borderColor: "#e5e7eb", color: "#374151" }}
                          >
                            <span className="text-lg flex-shrink-0">{icon}</span>
                            <div className="min-w-0">
                              <div className="font-medium truncate text-xs">{label}</div>
                              <div className="text-xs text-gray-400 truncate">{description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!formData.business_name || !formData.category) {
                          toast.error("Please fill in all required fields");
                          return;
                        }
                        setStep(2);
                      }}
                      className="btn-luxury-dark w-full"
                    >
                      Continue <ArrowRight size={15} />
                    </button>
                  </div>
                )}

                {/* Step 2 — Location & pricing */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        <MapPin size={13} className="inline mr-1 text-gray-400" />City *
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => update("city", e.target.value)}
                        placeholder="e.g. London, Birmingham, Manchester"
                        className="input-light"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Area / Address</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => update("location", e.target.value)}
                        placeholder="e.g. East London, E1"
                        className="input-light"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Travel Radius (km)</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range" min={5} max={200} step={5}
                          value={formData.travel_radius_km}
                          onChange={(e) => update("travel_radius_km", Number(e.target.value))}
                          className="flex-1 accent-gray-700"
                        />
                        <span className="text-sm font-semibold text-gray-700 w-16 text-center bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg flex-shrink-0">
                          {formData.travel_radius_km}km
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Min Price (£)</label>
                        <input type="number" value={formData.min_price} onChange={(e) => update("min_price", e.target.value)} placeholder="e.g. 200" className="input-light" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Price (£)</label>
                        <input type="number" value={formData.max_price} onChange={(e) => update("max_price", e.target.value)} placeholder="e.g. 2000" className="input-light" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Years of Experience</label>
                      <input type="number" value={formData.years_experience} onChange={(e) => update("years_experience", e.target.value)} placeholder="e.g. 5" min={0} className="input-light" />
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep(1)} className="btn-secondary-light flex-1">Back</button>
                      <button onClick={() => setStep(3)} className="btn-luxury-dark flex-1">Continue <ArrowRight size={15} /></button>
                    </div>
                  </div>
                )}

                {/* Step 3 — About & links */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        <FileText size={13} className="inline mr-1 text-gray-400" />About Your Business
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => update("bio", e.target.value)}
                        placeholder="Describe your service, experience, what makes you unique, and the events you specialise in..."
                        rows={5}
                        className="input-light resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Instagram URL</label>
                      <input type="url" value={formData.instagram_url} onChange={(e) => update("instagram_url", e.target.value)} placeholder="https://instagram.com/yourbusiness" className="input-light" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Website URL</label>
                      <input type="url" value={formData.website_url} onChange={(e) => update("website_url", e.target.value)} placeholder="https://yourbusiness.com" className="input-light" />
                    </div>

                    <div
                      className="rounded-xl p-4"
                      style={{ background: "rgba(13,27,62,0.04)", border: "1px solid rgba(13,27,62,0.1)" }}
                    >
                      <p className="text-sm text-gray-600 font-light">
                        Our team reviews your application within 24–48 hours. You will receive a confirmation email immediately and an approval notification once reviewed.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep(2)} className="btn-secondary-light flex-1">Back</button>
                      <button onClick={handleSubmit} disabled={submitting} className="btn-luxury-dark flex-1">
                        {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
                        {submitting ? "Submitting..." : "Submit Application"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
