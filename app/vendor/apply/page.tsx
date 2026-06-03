"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MapPin, FileText, ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { VENDOR_CATEGORIES, type VendorCategory } from "@/types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const BENEFITS = [
  { icon: "🔍", label: "Get found by customers searching for your category and location" },
  { icon: "📅", label: "Manage enquiries, bookings and availability in one place" },
  { icon: "⭐", label: "Build your reputation with verified reviews from real clients" },
  { icon: "💳", label: "Secure Stripe payments — no invoicing, no chasing, no disputes" },
];

const UK_PHONE_RE = /^(\+44\s?|0)[0-9]{9,10}$/;

const FORM_DEFAULTS = {
  business_name: "",
  category: "" as VendorCategory | "",
  custom_category_description: "",
  bio: "",
  city: "",
  phone: "",
  travel_radius_km: 30,
  min_price: "",
  max_price: "",
  years_experience: "",
  instagram_url: "",
  website_url: "",
};

function readDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("vendor_apply_draft");
    return raw ? (JSON.parse(raw) as typeof FORM_DEFAULTS) : null;
  } catch { return null; }
}

export default function VendorApplyPage() {
  const [formData, setFormData] = useState<typeof FORM_DEFAULTS>(() => {
    const draft = readDraft();
    return draft ? { ...FORM_DEFAULTS, ...draft } : FORM_DEFAULTS;
  });

  const [step, setStep] = useState<number>(() => {
    const draft = readDraft();
    if (!draft) return 1;
    if (draft.city) return 3;
    if (draft.business_name || draft.category) return 2;
    return 1;
  });

  const [submitting, setSubmitting] = useState(false);

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
      if (!user) {
        // Save draft so it can be restored after signup
        sessionStorage.setItem("vendor_apply_draft", JSON.stringify(formData));
        window.location.assign("/signup?role=vendor");
        return;
      }

      const res = await fetch("/api/vendor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: formData.business_name,
          category: formData.category,
          custom_category_description: formData.category === "other" ? formData.custom_category_description || null : null,
          bio: formData.bio || null,
          city: formData.city,
          phone: formData.phone || null,
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

      sessionStorage.removeItem("vendor_apply_draft");
      toast.success("Application submitted! Check your email — we'll be in touch within 24–48 hours.");
      window.location.assign("/vendor/dashboard");
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
            Get your business in front of customers searching for vendors like you.
          </h1>
          <p
            className="max-w-lg mx-auto text-base font-light leading-relaxed"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            List your services free. Receive verified enquiries. Grow your bookings with a platform built for UK event professionals.
          </p>
        </div>
      </div>

      <div className="pb-20 px-4">
        <div className="max-w-5xl mx-auto -mt-0 pt-12">

          <div className="grid lg:grid-cols-5 gap-10">

            {/* Left sidebar — benefits */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">What you get</h2>
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
                    { n: "1", label: "Submit your application", sub: "Takes about 5 minutes — nothing complicated" },
                    { n: "2", label: "We verify and activate you", sub: "Usually within 24–48 hours" },
                    { n: "3", label: "Complete your profile", sub: "Photos, packages and pricing — better profiles get more enquiries" },
                    { n: "4", label: "Start receiving enquiries", sub: "Customers searching in your category find and contact you" },
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

                      {/* Custom description — shown only when Other is selected */}
                      {formData.category === "other" && (
                        <div className="mt-4">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Describe your service *
                          </label>
                          <p className="text-xs text-gray-400 mb-2">
                            Tell us exactly what you offer. Be specific — our admin team uses this to decide the best way to list your business.
                          </p>
                          <textarea
                            value={formData.custom_category_description}
                            onChange={(e) => update("custom_category_description", e.target.value)}
                            placeholder="e.g. Drone Light Show — synchronised indoor & outdoor drone displays for weddings and corporate events, 50–200 drones, fully CAA-licensed."
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
                            maxLength={300}
                          />
                          <p className="text-xs text-gray-400 mt-1 text-right">
                            {formData.custom_category_description.length}/300
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (!formData.business_name || !formData.category) {
                          toast.error("Please fill in all required fields");
                          return;
                        }
                        if (formData.category === "other" && !formData.custom_category_description.trim()) {
                          toast.error("Please describe your service so we can list you correctly");
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

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-0.5">Price Range (£)</label>
                      <p className="text-xs text-gray-400 mb-2 font-light">Used to match you with relevant customer budgets. Not shown publicly — you set exact prices in your packages later.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input type="number" value={formData.min_price} onChange={(e) => update("min_price", e.target.value)} placeholder="From, e.g. 200" className="input-light" />
                        </div>
                        <div>
                          <input type="number" value={formData.max_price} onChange={(e) => update("max_price", e.target.value)} placeholder="Up to, e.g. 2000" className="input-light" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Years of Experience</label>
                      <input type="number" value={formData.years_experience} onChange={(e) => update("years_experience", e.target.value)} placeholder="e.g. 5" min={0} className="input-light" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        <Phone size={13} className="inline mr-1 text-gray-400" />Contact Phone *
                      </label>
                      <p className="text-xs text-gray-400 mb-1.5 font-light">
                        UK number. Admin-only — not shown publicly to customers.
                      </p>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="07700 900000 or +44 7700 900000"
                        className="input-light"
                        required
                      />
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep(1)} className="btn-secondary-light flex-1">Back</button>
                      <button
                        onClick={() => {
                          if (!formData.city) { toast.error("Please enter your city"); return; }
                          if (formData.phone && !UK_PHONE_RE.test(formData.phone.replace(/\s/g, ""))) {
                            toast.error("Please enter a valid UK phone number");
                            return;
                          }
                          setStep(3);
                        }}
                        className="btn-luxury-dark flex-1"
                      >
                        Continue <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3 — About & links */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        <FileText size={13} className="inline mr-1 text-gray-400" />About Your Business
                      </label>
                      <p className="text-xs text-gray-400 mb-1.5 font-light">
                        Tell customers what makes your service worth booking. Include your specialisation, experience, awards, and the events you work best for. Profiles with detailed bios receive significantly more enquiries.
                      </p>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => update("bio", e.target.value)}
                        placeholder="Example: Award-winning DJ with 8 years of experience across weddings, birthday parties and corporate events. Specialist in live mixing and personalised playlists. Full PA and lighting rig included in all packages. Covered 200+ events across London and the South East."
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
