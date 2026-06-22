"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import type { ManualContactSource } from "@/types";

const SOURCE_OPTIONS: { value: ManualContactSource; label: string }[] = [
  { value: "instagram",         label: "Instagram" },
  { value: "facebook",          label: "Facebook" },
  { value: "tiktok",            label: "TikTok" },
  { value: "whatsapp",          label: "WhatsApp" },
  { value: "referral",          label: "Referral" },
  { value: "existing_customer", label: "Existing Customer" },
  { value: "direct",            label: "Direct Enquiry" },
  { value: "other",             label: "Other" },
];

export function CreateContactForm() {
  const router = useRouter();
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [form, setForm] = useState({
    display_name:  "",
    display_email: "",
    display_phone: "",
    source:        "direct" as ManualContactSource,
    source_detail: "",
    notes:         "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.display_name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError(null);

    const res = await fetch("/api/vendor/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name:  form.display_name.trim(),
        display_email: form.display_email.trim() || null,
        display_phone: form.display_phone.trim() || null,
        source:        form.source,
        source_detail: form.source_detail.trim() || null,
        notes:         form.notes.trim() || null,
      }),
    });

    if (res.ok) {
      const json = await res.json() as { contact: { id: string } };
      router.push(`/vendor/contacts/${json.contact.id}`);
    } else {
      const json = await res.json() as { error?: string };
      setError(json.error ?? "Failed to create contact.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/vendor/contacts"
        className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Contacts
      </Link>

      <div className="bg-white/4 border border-white/6 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Add Direct Contact</h1>
            <p className="text-white/40 text-sm">Record a contact from an off-platform channel</p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => set("display_name", e.target.value)}
              placeholder="e.g. Sarah Johnson"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={form.display_email}
                onChange={(e) => set("display_email", e.target.value)}
                placeholder="sarah@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.display_phone}
                onChange={(e) => set("display_phone", e.target.value)}
                placeholder="07700 900000"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5">How did you meet?</label>
              <select
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 appearance-none cursor-pointer"
              >
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#0d0d18]">{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5">
                Detail <span className="text-white/30 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.source_detail}
                onChange={(e) => set("source_detail", e.target.value)}
                placeholder={form.source === "instagram" ? "@username" : form.source === "referral" ? "Referred by…" : "Additional detail"}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5">
              Notes <span className="text-white/30 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="E.g. Wedding on 15 Aug, budget ~£2,000, needs DJ and décor…"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/vendor/contacts"
              className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !form.display_name.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {saving ? "Saving…" : "Add Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
