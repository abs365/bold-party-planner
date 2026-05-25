"use client";

import { useState } from "react";
import { Sparkles, Loader2, Store, MapPin, FileText } from "lucide-react";
import { VENDOR_CATEGORIES, type VendorCategory } from "@/types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

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

      await supabase.from("profiles").update({ role: "vendor" }).eq("id", user.id);

      const { error } = await supabase.from("vendors").insert({
        user_id: user.id,
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
        status: "pending",
      });

      if (error) throw error;
      toast.success("Application submitted! We'll review and approve it shortly.");
      window.location.href = "/vendor/dashboard";
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4">
            <Store size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join as a Vendor</h1>
          <p className="text-slate-400 text-sm mt-1">
            Free to join · Keep 90% of earnings · Reach thousands of customers
          </p>
        </div>

        <div className="glass-card p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Business Name *</label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => update("business_name", e.target.value)}
                  placeholder="e.g. DJ Maxwell, Luxe Decor by Amara"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">Service Category *</label>
                <div className="grid grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {Object.entries(VENDOR_CATEGORIES).map(([key, { label, icon, description }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update("category", key)}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl text-left text-sm transition-all border",
                        formData.category === key
                          ? "bg-brand-500/20 border-brand-500/40 text-brand-300"
                          : "bg-white/4 border-white/8 text-slate-400 hover:bg-white/8 hover:text-white"
                      )}
                    >
                      <span className="text-xl flex-shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{label}</div>
                        <div className="text-xs text-slate-600 truncate">{description}</div>
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
                className="btn-primary w-full py-3"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">
                  <MapPin size={14} className="inline mr-1 text-brand-400" />City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="e.g. London, Birmingham, Manchester"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Full Address / Area</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="e.g. East London, E1"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Travel Radius (km)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range" min={5} max={200} step={5}
                    value={formData.travel_radius_km}
                    onChange={(e) => update("travel_radius_km", Number(e.target.value))}
                    className="flex-1 accent-brand-500"
                  />
                  <span className="text-white font-bold w-16 text-center glass px-3 py-1.5 rounded-lg">
                    {formData.travel_radius_km}km
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">Min Price (£)</label>
                  <input type="number" value={formData.min_price} onChange={(e) => update("min_price", e.target.value)} placeholder="e.g. 200" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">Max Price (£)</label>
                  <input type="number" value={formData.max_price} onChange={(e) => update("max_price", e.target.value)} placeholder="e.g. 2000" className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Years of Experience</label>
                <input type="number" value={formData.years_experience} onChange={(e) => update("years_experience", e.target.value)} placeholder="e.g. 5" min={0} className="input-field" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">
                  <FileText size={14} className="inline mr-1 text-brand-400" />About Your Business
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  placeholder="Describe your service, experience, what makes you unique, what events you specialise in..."
                  rows={5}
                  className="input-field resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Instagram URL</label>
                <input type="url" value={formData.instagram_url} onChange={(e) => update("instagram_url", e.target.value)} placeholder="https://instagram.com/yourbusiness" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Website URL</label>
                <input type="url" value={formData.website_url} onChange={(e) => update("website_url", e.target.value)} placeholder="https://yourbusiness.com" className="input-field" />
              </div>

              <div className="glass p-4 rounded-xl border border-brand-500/20 text-sm text-slate-400">
                <Sparkles size={14} className="inline text-brand-400 mr-1.5" />
                After submission, our team reviews your application within 24–48 hours. You&apos;ll receive an email once approved.
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
