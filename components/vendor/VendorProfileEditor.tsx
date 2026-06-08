"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, MapPin, Globe, Link2, Phone, Loader2, CheckCircle2 } from "lucide-react";
import { VENDOR_CATEGORIES, EVENT_TYPES, type Vendor } from "@/types";
import toast from "react-hot-toast";

interface VendorProfileEditorProps {
  vendor: Vendor;
}

export function VendorProfileEditor({ vendor }: VendorProfileEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    business_name: vendor.business_name ?? "",
    tagline: vendor.tagline ?? "",
    bio: vendor.bio ?? "",
    category: vendor.category ?? "",
    city: vendor.city ?? "",
    address: vendor.address ?? "",
    phone: vendor.phone ?? "",
    website_url: vendor.website_url ?? "",
    instagram_url: vendor.instagram_url ?? "",
    min_price: vendor.min_price ?? "",
    max_price: vendor.max_price ?? "",
    years_experience: vendor.years_experience ?? "",
    event_types: (vendor.event_types as string[] | null) ?? [],
  });

  function set(field: string, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function toggleEventType(type: string) {
    set("event_types", form.event_types.includes(type)
      ? form.event_types.filter((t) => t !== type)
      : [...form.event_types, type]);
  }

  async function handleSave() {
    if (!form.business_name.trim()) { toast.error("Business name is required"); return; }
    if (!form.category) { toast.error("Please select a category"); return; }
    if (!form.city.trim()) { toast.error("City is required"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          min_price: form.min_price ? Number(form.min_price) : null,
          max_price: form.max_price ? Number(form.max_price) : null,
          years_experience: form.years_experience ? Number(form.years_experience) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaved(true);
      toast.success("Profile saved!");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Sticky header: always visible while scrolling the form */}
      <div className="sticky top-0 z-10 bg-[#0a0a0f] pt-2 pb-5 -mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Keep your profile up to date to attract more customers</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="space-y-6">

      {/* Basic Info */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-6 space-y-4">
        <h2 className="font-bold text-white">Basic Information</h2>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Business Name *</label>
          <input type="text" value={form.business_name} onChange={(e) => set("business_name", e.target.value)} className="input-field w-full" />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Tagline</label>
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            placeholder="A short catchy description"
            maxLength={120}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Bio / About</label>
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Tell customers about your business, experience, and what makes you unique..."
            rows={5}
            className="input-field w-full resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Category *</label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className="input-field w-full">
            <option value="">Select a category</option>
            {Object.entries(VENDOR_CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>{cat.icon} {cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Location & Contact */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-6 space-y-4">
        <h2 className="font-bold text-white">Location & Contact</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5 flex items-center gap-1"><MapPin size={12} />City *</label>
            <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5 flex items-center gap-1"><Phone size={12} />Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+44..." className="input-field w-full" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Address</label>
          <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} className="input-field w-full" />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5 flex items-center gap-1"><Globe size={12} />Website</label>
          <input type="url" value={form.website_url} onChange={(e) => set("website_url", e.target.value)} placeholder="https://..." className="input-field w-full" />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5 flex items-center gap-1"><Link2 size={12} />Instagram</label>
          <input type="url" value={form.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} placeholder="https://instagram.com/..." className="input-field w-full" />
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-6 space-y-4">
        <h2 className="font-bold text-white">Pricing & Experience</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Min Price (£)</label>
            <input
              type="number"
              value={form.min_price}
              onChange={(e) => set("min_price", e.target.value)}
              min={0}
              placeholder="0"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Max Price (£)</label>
            <input
              type="number"
              value={form.max_price}
              onChange={(e) => set("max_price", e.target.value)}
              min={0}
              placeholder="0"
              className="input-field w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Years of Experience</label>
          <input
            type="number"
            value={form.years_experience}
            onChange={(e) => set("years_experience", e.target.value)}
            min={0}
            max={50}
            placeholder="0"
            className="input-field w-full"
          />
        </div>
      </div>

      {/* Event Types */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-6">
        <h2 className="font-bold text-white mb-4">Event Types You Cover</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(EVENT_TYPES).map(([key, type]) => {
            const selected = form.event_types.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleEventType(key)}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition-all border ${
                  selected
                    ? "bg-brand-500/20 text-brand-300 border-brand-500/40"
                    : "bg-white/3 text-slate-400 border-white/8 hover:border-white/20"
                }`}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pb-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary px-8">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
      </div>{/* end space-y-6 */}
    </div>
  );
}
