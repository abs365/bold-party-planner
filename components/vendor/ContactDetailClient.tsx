"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Archive, ArchiveRestore, Loader2, Check, X, Clock } from "lucide-react";
import type { ManualContact, ManualContactSource, ManualContactStage } from "@/types";

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

const STAGE_OPTIONS: { value: ManualContactStage; label: string }[] = [
  { value: "lead",      label: "Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted",    label: "Quoted" },
  { value: "won",       label: "Won" },
  { value: "lost",      label: "Lost" },
];

function PipelineControls({ contact }: { contact: ManualContact }) {
  const router = useRouter();
  const [stage, setStage] = useState<ManualContactStage>(contact.stage);
  const [followUpAt, setFollowUpAt] = useState(contact.follow_up_at?.slice(0, 10) ?? "");
  const [saving, setSaving] = useState(false);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/vendor/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    router.refresh();
    window.dispatchEvent(new CustomEvent("contact-activity-updated"));
    setSaving(false);
  }

  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm">Pipeline</h2>
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/60 text-xs font-medium mb-1.5">Stage</label>
          <select
            value={stage}
            onChange={(e) => { const v = e.target.value as ManualContactStage; setStage(v); void save({ stage: v }); }}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 appearance-none cursor-pointer"
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#0d0d18]">{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-white/60 text-xs font-medium mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Follow up on
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={followUpAt}
              onChange={(e) => { setFollowUpAt(e.target.value); void save({ follow_up_at: e.target.value ? new Date(e.target.value).toISOString() : null }); }}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50"
            />
            {followUpAt && (
              <button
                onClick={() => { setFollowUpAt(""); void save({ follow_up_at: null }); }}
                className="px-3 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactDetailClient({ contact }: { contact: ManualContact }) {
  const router   = useRouter();
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const [form, setForm] = useState({
    display_name:  contact.display_name,
    display_email: contact.display_email ?? "",
    display_phone: contact.display_phone ?? "",
    source:        contact.source,
    source_detail: contact.source_detail ?? "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSave() {
    if (!form.display_name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const res = await fetch(`/api/vendor/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name:  form.display_name.trim(),
        display_email: form.display_email.trim() || null,
        display_phone: form.display_phone.trim() || null,
        source:        form.source,
        source_detail: form.source_detail.trim() || null,
      }),
    });
    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      const json = await res.json() as { error?: string };
      setError(json.error ?? "Failed to save.");
    }
    setSaving(false);
  }

  async function handleArchiveToggle() {
    setArchiving(true);
    await fetch(`/api/vendor/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_archived: !contact.is_archived }),
    });
    router.push("/vendor/contacts");
  }

  if (!editing) {
    return (
      <div className="space-y-4">
        <PipelineControls contact={contact} />
        <div className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Contact Details</h2>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name" value={contact.display_name} />
          <Field label="Source" value={SOURCE_OPTIONS.find((o) => o.value === contact.source)?.label ?? contact.source} />
          <Field label="Email" value={contact.display_email ?? "—"} />
          <Field label="Phone" value={contact.display_phone ?? "—"} />
          {contact.source_detail && <Field label="Source detail" value={contact.source_detail} />}
        </div>

        <div className="pt-2 border-t border-white/6">
          <button
            onClick={() => void handleArchiveToggle()}
            disabled={archiving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              contact.is_archived
                ? "text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10"
                : "text-white/40 border border-white/10 hover:text-amber-300 hover:border-amber-500/20"
            }`}
          >
            {archiving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : contact.is_archived
                ? <ArchiveRestore className="w-4 h-4" />
                : <Archive className="w-4 h-4" />
            }
            {contact.is_archived ? "Restore contact" : "Archive contact"}
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm">Edit Contact</h2>
        <button
          onClick={() => { setEditing(false); setError(null); }}
          className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-white/60 text-xs font-medium mb-1.5">Full Name *</label>
        <input
          type="text"
          value={form.display_name}
          onChange={(e) => set("display_name", e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/60 text-xs font-medium mb-1.5">Email</label>
          <input
            type="email"
            value={form.display_email}
            onChange={(e) => set("display_email", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs font-medium mb-1.5">Phone</label>
          <input
            type="tel"
            value={form.display_phone}
            onChange={(e) => set("display_phone", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
          />
        </div>
      </div>

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
          <label className="block text-white/60 text-xs font-medium mb-1.5">Source detail</label>
          <input
            type="text"
            value={form.source_detail}
            onChange={(e) => set("source_detail", e.target.value)}
            placeholder={form.source === "instagram" ? "@username" : form.source === "referral" ? "Referred by…" : "Optional"}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          onClick={() => { setEditing(false); setError(null); }}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => void handleSave()}
          disabled={saving || !form.display_name.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <p className="text-white text-sm font-medium">{value}</p>
    </div>
  );
}
