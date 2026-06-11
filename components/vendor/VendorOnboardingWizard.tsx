"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, ChevronRight, ChevronLeft,
  Building2, MapPin, Camera, Package, FileText,
} from "lucide-react";
import { VENDOR_CATEGORIES, type VendorCategory, type EventType } from "@/types";

const STEPS = [
  { id: "business", label: "Business Info",      icon: Building2 },
  { id: "location", label: "Location & Contact", icon: MapPin },
  { id: "packages", label: "Packages",           icon: Package },
  { id: "media",    label: "Photos & Videos",    icon: Camera },
  { id: "review",   label: "Submit for Review",  icon: FileText },
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday:        "Birthday",
  wedding:         "Wedding",
  corporate:       "Corporate",
  baby_shower:     "Baby Shower",
  anniversary:     "Anniversary",
  graduation:      "Graduation",
  naming_ceremony: "Naming Ceremony",
  funeral:         "Funeral",
  charity:         "Charity Event",
  conference:      "Conference",
  engagement:      "Engagement",
  gender_reveal:   "Gender Reveal",
  hen_party:       "Hen Party",
  other:           "Other",
};

const EVENT_TYPES = [
  "birthday", "wedding", "corporate", "anniversary", "baby_shower",
  "graduation", "naming_ceremony", "engagement", "hen_party",
  "gender_reveal", "charity", "conference", "funeral", "other",
];

interface PackageRow { name: string; price: string; includes: string }

export function VendorOnboardingWizard() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [completed, setCompleted] = useState(false);

  const [form, setForm] = useState({
    business_name:    "",
    category:         "" as VendorCategory | "",
    tagline:          "",
    bio:              "",
    years_experience: "",
    instagram_url:    "",
    website_url:      "",
    city:             "",
    address:          "",
    phone:            "",
    travel_radius_km: "30",
    event_types:      [] as string[],
    other_event_type: "",
    min_price:        "",
    max_price:        "",
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

  function addPackage()  { setPackages((p) => [...p, { name: "", price: "", includes: "" }]); }
  function removePackage(i: number) { setPackages((p) => p.filter((_, idx) => idx !== i)); }
  function updatePackage(i: number, key: keyof PackageRow, value: string) {
    setPackages((p) => p.map((pkg, idx) => idx === i ? { ...pkg, [key]: value } : pkg));
  }

  function canAdvance(): boolean {
    if (step === 0) return !!(form.business_name.trim() && form.category);
    if (step === 1) return !!form.city.trim();
    return true;
  }

  async function saveProfile() {
    setSaving(true);
    setError("");
    try {
      // 1. Update vendor profile
      const profileRes = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name:    form.business_name,
          category:         form.category,
          tagline:          form.tagline || null,
          bio:              form.bio || null,
          city:             form.city,
          address:          form.address || null,
          phone:            form.phone || null,
          travel_radius_km: Number(form.travel_radius_km),
          instagram_url:    form.instagram_url || null,
          website_url:      form.website_url || null,
          years_experience: form.years_experience ? Number(form.years_experience) : null,
          min_price:        form.min_price ? Number(form.min_price) : null,
          max_price:        form.max_price ? Number(form.max_price) : null,
          event_types:      form.event_types,
        }),
      });
      if (!profileRes.ok) {
        const body = await profileRes.json() as { error?: string };
        throw new Error(body.error ?? "Failed to save profile");
      }

      // 2. Save packages (skip empty rows)
      const pkgsToSave = packages.filter((p) => p.name && p.price);
      if (pkgsToSave.length > 0) {
        await fetch("/api/vendor/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            packages: pkgsToSave.map((p) => ({
              name:     p.name,
              price:    Number(p.price),
              includes: p.includes.split(",").map((s) => s.trim()).filter(Boolean),
            })),
          }),
        });
      }

      // 3. Mark onboarding submitted
      const onboardRes = await fetch("/api/vendor/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "submitted" }),
      });
      if (!onboardRes.ok) {
        const body = await onboardRes.json() as { error?: string };
        throw new Error(body.error ?? "Failed to submit for review");
      }

      setCompleted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Completion screen ───────────────────────────────────────────────────────
  if (completed) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Profile Submitted for Review</h2>
        <p className="text-white/70 mb-6 leading-relaxed">
          Our team will review your profile within 24–48 hours.
          You&apos;ll receive an email once approved and your profile goes live.
        </p>
        <button onClick={() => router.push("/vendor/dashboard")} className="btn-primary">
          Go to Dashboard
        </button>
      </div>
    );
  }

  // ── Wizard ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">

      {/* Step progress */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => {
          const Icon     = s.icon;
          const isActive = i === step;
          const isDone   = i < step;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isDone   ? "bg-emerald-500 border-emerald-500" :
                  isActive ? "border-brand-400 bg-brand-500/20"  :
                             "border-white/20 bg-white/5"
                }`}>
                  {isDone
                    ? <CheckCircle className="w-5 h-5 text-white" />
                    : <Icon className={`w-5 h-5 ${isActive ? "text-brand-400" : "text-white/40"}`} />
                  }
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${
                  isActive ? "text-brand-400" : isDone ? "text-emerald-400" : "text-white/40"
                }`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 mb-4 ${isDone ? "bg-emerald-500" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white/4 border border-white/6 rounded-xl p-6">

        {/* ── Step 0: Business Info ────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-white">Business Information</h2>

            <div>
              <label className="block text-sm text-white/70 mb-1">Business Name *</label>
              <input
                className="input-field"
                value={form.business_name}
                onChange={(e) => setField("business_name", e.target.value)}
                placeholder="e.g. Rhythm DJs London"
              />
            </div>

            {/* Category: uses the platform's full VENDOR_CATEGORIES (21 categories) */}
            <div>
              <label className="block text-sm text-white/70 mb-2">Service Category *</label>
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {(Object.entries(VENDOR_CATEGORIES) as [VendorCategory, { label: string; icon: string; description: string }][]).map(
                  ([key, { label, icon, description }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setField("category", key)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl text-left text-sm transition-all border ${
                        form.category === key
                          ? "bg-brand-500/15 border-brand-500/40 text-white"
                          : "bg-white/3 border-white/10 text-white/60 hover:border-white/20 hover:text-white/80"
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <div className="font-medium text-xs truncate">{label}</div>
                        <div className="text-xs text-white/35 truncate">{description}</div>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Tagline</label>
              <input
                className="input-field"
                value={form.tagline}
                onChange={(e) => setField("tagline", e.target.value)}
                placeholder="A short memorable description"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">About Your Business *</label>
              <textarea
                className="input-field"
                rows={4}
                value={form.bio}
                onChange={(e) => setField("bio", e.target.value)}
                placeholder="Describe your services, style, and what makes you stand out…"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Years of Experience</label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  max="50"
                  value={form.years_experience}
                  onChange={(e) => setField("years_experience", e.target.value)}
                  placeholder="e.g. 5"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Starting Price</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm font-semibold pointer-events-none">£</span>
                  <input
                    className="input-field pl-8"
                    type="number"
                    min="0"
                    value={form.min_price}
                    onChange={(e) => setField("min_price", e.target.value)}
                    placeholder="500"
                  />
                </div>
              </div>
            </div>

            {/* Event types */}
            <div>
              <label className="block text-sm text-white/70 mb-2">Event Types You Cover</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((et) => (
                  <button
                    key={et}
                    type="button"
                    onClick={() => toggleEventType(et)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      form.event_types.includes(et)
                        ? "bg-brand-500/20 border-brand-400/50 text-brand-300"
                        : "border-white/20 text-white/60 hover:border-white/40"
                    }`}
                  >
                    {EVENT_TYPE_LABELS[et] ?? et.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
              {form.event_types.includes("other") && (
                <div className="mt-3">
                  <input
                    className="input-field text-sm"
                    value={form.other_event_type}
                    onChange={(e) => setField("other_event_type", e.target.value)}
                    placeholder="Please describe the event type…"
                    maxLength={100}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 1: Location & Contact ───────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Location & Contact</h2>

            <div>
              <label className="block text-sm text-white/70 mb-1">City *</label>
              <input
                className="input-field"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                placeholder="e.g. London, Birmingham, Manchester"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Phone Number</label>
              <input
                className="input-field"
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+44 7700 900000"
              />
              <p className="text-xs text-white/35 mt-1">Admin-only, not shown publicly to customers.</p>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Travel Radius</label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min={5} max={200} step={5}
                  value={form.travel_radius_km}
                  onChange={(e) => setField("travel_radius_km", e.target.value)}
                  className="flex-1 accent-brand-500"
                />
                <span className="text-sm font-semibold text-white w-16 text-center bg-white/8 border border-white/12 px-3 py-1.5 rounded-lg flex-shrink-0">
                  {form.travel_radius_km}km
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Instagram</label>
              <input
                className="input-field"
                value={form.instagram_url}
                onChange={(e) => setField("instagram_url", e.target.value)}
                placeholder="https://instagram.com/youraccount"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Website</label>
              <input
                className="input-field"
                value={form.website_url}
                onChange={(e) => setField("website_url", e.target.value)}
                placeholder="https://yourwebsite.co.uk"
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Packages ─────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Service Packages</h2>
            <p className="text-white/50 text-sm">Add the packages you offer. You can always add more from your dashboard after approval.</p>
            {packages.map((pkg, i) => (
              <div key={i} className="border border-white/10 rounded-xl p-4 space-y-3 bg-white/3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm font-medium">Package {i + 1}</span>
                  {packages.length > 1 && (
                    <button type="button" onClick={() => removePackage(i)} className="text-red-400 text-xs hover:text-red-300 transition-colors">
                      Remove
                    </button>
                  )}
                </div>
                <input
                  className="input-field"
                  value={pkg.name}
                  onChange={(e) => updatePackage(i, "name", e.target.value)}
                  placeholder="Package name (e.g. Standard, Premium, Full Day)"
                />
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm font-semibold pointer-events-none">£</span>
                  <input
                    className="input-field pl-8"
                    type="number"
                    min="0"
                    value={pkg.price}
                    onChange={(e) => updatePackage(i, "price", e.target.value)}
                    placeholder="Price"
                  />
                </div>
                <input
                  className="input-field"
                  value={pkg.includes}
                  onChange={(e) => updatePackage(i, "includes", e.target.value)}
                  placeholder="What's included, comma-separated (e.g. 4 hours, equipment, travel)"
                />
              </div>
            ))}
            <button type="button" onClick={addPackage} className="btn-secondary w-full text-sm">
              + Add Another Package
            </button>
          </div>
        )}

        {/* ── Step 3: Media (deferred until post-approval) ─────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Photos & Videos</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Upload photos and videos from your dashboard after your profile is approved.
              Profiles with 6+ photos receive significantly more customer enquiries.
            </p>
            <div className="border-2 border-dashed border-white/12 rounded-xl p-14 text-center">
              <Camera className="w-12 h-12 text-white/15 mx-auto mb-3" />
              <p className="text-white/35 text-sm">Available from Dashboard → Photos & Videos after approval</p>
            </div>
          </div>
        )}

        {/* ── Step 4: Review & Submit ──────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Review & Submit</h2>
            <div className="divide-y divide-white/8">
              {[
                { label: "Business Name", value: form.business_name },
                { label: "Category",      value: VENDOR_CATEGORIES[form.category as VendorCategory]?.label ?? form.category },
                { label: "City",          value: form.city },
                { label: "Bio",           value: form.bio ? `${form.bio.slice(0, 80)}${form.bio.length > 80 ? "…" : ""}` : "N/A" },
                { label: "Starting From", value: form.min_price ? `£${Number(form.min_price).toLocaleString("en-GB")}` : "N/A" },
                { label: "Packages",      value: `${packages.filter((p) => p.name && p.price).length} added` },
                { label: "Event Types",   value: form.event_types.length
                    ? form.event_types.map((et) => EVENT_TYPE_LABELS[et] ?? et).join(", ")
                    : "None selected" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2.5">
                  <span className="text-white/50 text-sm">{label}</span>
                  <span className="text-white text-sm font-medium max-w-xs text-right truncate">{value || "N/A"}</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 text-sm text-amber-300 mt-2">
              <strong className="text-amber-200">What happens next:</strong>{" "}
              Our team reviews profiles within 24–48 hours. You&apos;ll receive an email once approved and your profile goes live on the Elbold marketplace.
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="btn-secondary disabled:opacity-40 flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => { if (canAdvance()) setStep((s) => s + 1); }}
            disabled={!canAdvance()}
            className="btn-primary flex items-center gap-2 disabled:opacity-40"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={saveProfile}
            disabled={saving || !form.business_name.trim() || !form.category || !form.city.trim()}
            className="btn-primary disabled:opacity-40 min-w-[160px]"
          >
            {saving ? "Submitting…" : "Submit for Review"}
          </button>
        )}
      </div>
    </div>
  );
}
