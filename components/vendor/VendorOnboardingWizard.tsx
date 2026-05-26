"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronRight, ChevronLeft, Building2, MapPin, Camera, Package, FileText } from "lucide-react";

const STEPS = [
  { id: "business", label: "Business Info", icon: Building2 },
  { id: "location", label: "Location & Contact", icon: MapPin },
  { id: "packages", label: "Packages", icon: Package },
  { id: "media", label: "Photos & Videos", icon: Camera },
  { id: "review", label: "Submit for Review", icon: FileText },
];

const CATEGORIES = [
  "photographer", "videographer", "caterer", "venue", "florist",
  "musician", "dj", "decorator", "makeup_artist", "entertainer", "other",
];

const EVENT_TYPES = [
  "wedding", "birthday", "corporate", "anniversary", "baby_shower",
  "graduation", "christmas_party", "hen_party", "kids_party", "other",
];

interface PackageRow { name: string; price: string; includes: string }

export function VendorOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const [form, setForm] = useState({
    business_name: "",
    category: "",
    tagline: "",
    bio: "",
    years_experience: "",
    instagram_url: "",
    website_url: "",
    city: "",
    address: "",
    phone: "",
    travel_radius_km: "30",
    event_types: [] as string[],
    min_price: "",
    max_price: "",
  });
  const [packages, setPackages] = useState<PackageRow[]>([{ name: "", price: "", includes: "" }]);

  function setField(key: keyof typeof form, value: string | string[]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleEventType(et: string) {
    setForm((f) => {
      const current = f.event_types;
      if (current.includes(et)) return { ...f, event_types: current.filter((x) => x !== et) };
      return { ...f, event_types: [...current, et] };
    });
  }

  function addPackage() {
    setPackages((p) => [...p, { name: "", price: "", includes: "" }]);
  }

  function updatePackage(i: number, key: keyof PackageRow, value: string) {
    setPackages((p) => p.map((pkg, idx) => idx === i ? { ...pkg, [key]: value } : pkg));
  }

  function removePackage(i: number) {
    setPackages((p) => p.filter((_, idx) => idx !== i));
  }

  async function saveProfile() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          years_experience: form.years_experience ? Number(form.years_experience) : null,
          travel_radius_km: Number(form.travel_radius_km),
          min_price: form.min_price ? Number(form.min_price) : null,
          max_price: form.max_price ? Number(form.max_price) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile");

      // Save packages
      const pkgsToSave = packages.filter((p) => p.name && p.price);
      if (pkgsToSave.length > 0) {
        await fetch("/api/vendor/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packages: pkgsToSave.map((p) => ({ ...p, price: Number(p.price), includes: p.includes.split(",").map((s) => s.trim()).filter(Boolean) })) }),
        });
      }

      await fetch("/api/vendor/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "submitted" }),
      });

      setCompleted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (completed) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
        <p className="text-white/70 mb-6">Our team will review your profile within 2-3 business days. We&apos;ll notify you once approved.</p>
        <button onClick={() => router.push("/vendor/dashboard")} className="btn-primary">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.id} className="flex items-center">
              <div className={`flex flex-col items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isDone ? "bg-green-500 border-green-500" : isActive ? "border-purple-400 bg-purple-500/20" : "border-white/20 bg-white/5"
                }`}>
                  {isDone ? <CheckCircle className="w-5 h-5 text-white" /> : <Icon className={`w-5 h-5 ${isActive ? "text-purple-400" : "text-white/40"}`} />}
                </div>
                <span className={`text-xs mt-1 ${isActive ? "text-purple-400" : isDone ? "text-green-400" : "text-white/40"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 mb-4 ${isDone ? "bg-green-500" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white/4 border border-white/6 rounded-xl p-6">
        {/* Step 0: Business Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Business Information</h2>
            <div>
              <label className="block text-sm text-white/70 mb-1">Business Name *</label>
              <input className="input-field" value={form.business_name} onChange={(e) => setField("business_name", e.target.value)} placeholder="e.g. Sparkle Photography" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Category *</label>
              <select className="input-field" value={form.category} onChange={(e) => setField("category", e.target.value)}>
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Tagline</label>
              <input className="input-field" value={form.tagline} onChange={(e) => setField("tagline", e.target.value)} placeholder="A short memorable description" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">About Your Business *</label>
              <textarea className="input-field" rows={4} value={form.bio} onChange={(e) => setField("bio", e.target.value)} placeholder="Describe your services, style, and what makes you special..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Years of Experience</label>
                <input className="input-field" type="number" min="0" max="50" value={form.years_experience} onChange={(e) => setField("years_experience", e.target.value)} placeholder="e.g. 5" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Price Range (from £)</label>
                <input className="input-field" type="number" min="0" value={form.min_price} onChange={(e) => setField("min_price", e.target.value)} placeholder="500" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Event Types You Cover</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((et) => (
                  <button key={et} type="button" onClick={() => toggleEventType(et)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${form.event_types.includes(et) ? "bg-purple-500/30 border-purple-400 text-purple-300" : "border-white/20 text-white/60 hover:border-white/40"}`}>
                    {et.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Location & Contact */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Location & Contact</h2>
            <div>
              <label className="block text-sm text-white/70 mb-1">City *</label>
              <input className="input-field" value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="e.g. London" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Business Address</label>
              <input className="input-field" value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="Street address (optional)" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Phone Number</label>
              <input className="input-field" type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+44 7700 900000" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Travel Radius (km)</label>
              <input className="input-field" type="number" min="0" max="500" value={form.travel_radius_km} onChange={(e) => setField("travel_radius_km", e.target.value)} />
              <p className="text-xs text-white/40 mt-1">How far are you willing to travel for events?</p>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Instagram URL</label>
              <input className="input-field" value={form.instagram_url} onChange={(e) => setField("instagram_url", e.target.value)} placeholder="https://instagram.com/youraccount" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Website URL</label>
              <input className="input-field" value={form.website_url} onChange={(e) => setField("website_url", e.target.value)} placeholder="https://yourwebsite.co.uk" />
            </div>
          </div>
        )}

        {/* Step 2: Packages */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Service Packages</h2>
            <p className="text-white/60 text-sm">Add the packages you offer. Customers will see these when browsing your profile.</p>
            {packages.map((pkg, i) => (
              <div key={i} className="border border-white/10 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm font-medium">Package {i + 1}</span>
                  {packages.length > 1 && (
                    <button type="button" onClick={() => removePackage(i)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                  )}
                </div>
                <input className="input-field" value={pkg.name} onChange={(e) => updatePackage(i, "name", e.target.value)} placeholder="Package name (e.g. Basic, Premium)" />
                <input className="input-field" type="number" value={pkg.price} onChange={(e) => updatePackage(i, "price", e.target.value)} placeholder="Price (£)" />
                <input className="input-field" value={pkg.includes} onChange={(e) => updatePackage(i, "includes", e.target.value)} placeholder="What's included (comma-separated)" />
              </div>
            ))}
            <button type="button" onClick={addPackage} className="btn-secondary w-full">+ Add Another Package</button>
          </div>
        )}

        {/* Step 3: Media */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Photos & Videos</h2>
            <p className="text-white/60 text-sm mb-4">
              After your profile is approved, you can upload photos and videos from your{" "}
              <span className="text-purple-400">Vendor Dashboard → Photos & Videos</span> page.
              For now, proceed to submit your profile for review.
            </p>
            <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center">
              <Camera className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">Media upload available after approval</p>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Review & Submit</h2>
            <div className="space-y-3">
              <ReviewRow label="Business Name" value={form.business_name} />
              <ReviewRow label="Category" value={form.category} />
              <ReviewRow label="City" value={form.city} />
              <ReviewRow label="Bio" value={form.bio ? `${form.bio.slice(0, 80)}...` : ""} />
              <ReviewRow label="Packages" value={`${packages.filter((p) => p.name && p.price).length} added`} />
              <ReviewRow label="Event Types" value={form.event_types.join(", ") || "None"} />
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-yellow-300 mt-4">
              <strong>What happens next?</strong> Our admin team will review your profile within 2–3 business days. You&apos;ll receive a notification once approved and your profile goes live.
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="btn-secondary disabled:opacity-40 flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep((s) => s + 1)} className="btn-primary flex items-center gap-2">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={saveProfile} disabled={saving || !form.business_name || !form.category} className="btn-primary disabled:opacity-40">
            {saving ? "Submitting..." : "Submit for Review"}
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-white/10">
      <span className="text-white/60 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value || "—"}</span>
    </div>
  );
}
