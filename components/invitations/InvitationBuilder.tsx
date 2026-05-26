"use client";

import { useState, useCallback } from "react";
import { Mail, Share2, Copy, Eye, Plus, Clock, Check, ExternalLink, QrCode, MessageCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { usePolling } from "@/lib/polling";
import toast from "react-hot-toast";
import type { Invitation, InvitationTemplate, RSVPResponse } from "@/types";

interface InvitationBuilderProps {
  eventId: string;
  eventTitle: string;
  initialInvitations: Invitation[];
  initialResponses: RSVPResponse[];
}

const TEMPLATES: { id: InvitationTemplate; label: string; description: string; preview: string }[] = [
  { id: "classic",  label: "Classic",  description: "Timeless elegant design",  preview: "🎉" },
  { id: "elegant",  label: "Elegant",  description: "Luxury serif typography",   preview: "✨" },
  { id: "playful",  label: "Playful",  description: "Fun & colourful style",     preview: "🎈" },
  { id: "minimal",  label: "Minimal",  description: "Clean & modern look",       preview: "◻️" },
  { id: "luxury",   label: "Luxury",   description: "Premium gold accents",      preview: "👑" },
];

const emptyForm = {
  template: "classic" as InvitationTemplate,
  title: "",
  message: "",
  dress_code: "",
  rsvp_deadline: "",
};

export function InvitationBuilder({
  eventId, eventTitle,
  initialInvitations, initialResponses,
}: InvitationBuilderProps) {
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);
  const [responses, setResponses]     = useState<RSVPResponse[]>(initialResponses);
  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm]               = useState(emptyForm);
  const [saving, setSaving]           = useState(false);
  const [activeInv, setActiveInv]     = useState<Invitation | null>(null);
  const [copied, setCopied]           = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/invitations?event_id=${eventId}`);
    if (res.ok) {
      const json = await res.json() as { invitations: Invitation[]; responses: RSVPResponse[] };
      setInvitations(json.invitations);
      setResponses(json.responses);
    }
  }, [eventId]);

  usePolling(refresh, 30_000);

  async function createInvitation() {
    setSaving(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, event_id: eventId, title: form.title || eventTitle }),
      });
      if (!res.ok) { const e = await res.json() as { error: string }; throw new Error(e.error); }
      await refresh();
      setShowCreate(false);
      setForm(emptyForm);
      toast.success("Invitation created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(inv: Invitation) {
    const res = await fetch(`/api/invitations/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !inv.is_active }),
    });
    if (res.ok) {
      setInvitations((prev) => prev.map((i) => i.id === inv.id ? { ...i, is_active: !i.is_active } : i));
    }
  }

  function copyLink(inv: Invitation) {
    const url = `${window.location.origin}/invitation/${inv.rsvp_token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(inv.id);
      toast.success("Link copied!");
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const getRSVPUrl = (inv: Invitation) => `${typeof window !== "undefined" ? window.location.origin : ""}/invitation/${inv.rsvp_token}`;

  const getInvResponses = (invId: string) => responses.filter((r) => r.invitation_id === invId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail size={18} className="text-brand-400" />Digital Invitations
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Create shareable invitations with RSVP tracking</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm py-2 px-4">
          <Plus size={14} />Create Invitation
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white/4 rounded-xl p-6 border border-brand-500/20 animate-fade-in-up">
          <h3 className="font-bold text-white mb-5">New Invitation</h3>

          {/* Template Picker */}
          <div className="mb-5">
            <label className="text-xs text-slate-400 block mb-2">Choose Template</label>
            <div className="grid grid-cols-5 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setForm((p) => ({ ...p, template: t.id }))}
                  className={cn(
                    "p-3 rounded-xl border text-center transition-all",
                    form.template === t.id
                      ? "border-brand-500/60 bg-brand-500/10"
                      : "border-white/8 bg-white/3 hover:border-white/15"
                  )}
                >
                  <div className="text-xl mb-1">{t.preview}</div>
                  <div className="text-xs font-semibold text-white">{t.label}</div>
                  <div className="text-xs text-slate-600 hidden sm:block">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Invitation Title</label>
              <input
                className="input-field"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder={eventTitle}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Personal Message</label>
              <textarea
                className="input-field resize-none h-24"
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                placeholder="We'd love for you to join us to celebrate..."
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Dress Code</label>
              <input
                className="input-field"
                value={form.dress_code}
                onChange={(e) => setForm((p) => ({ ...p, dress_code: e.target.value }))}
                placeholder="e.g. Black Tie, Smart Casual..."
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">RSVP Deadline</label>
              <input
                className="input-field"
                type="date"
                value={form.rsvp_deadline}
                onChange={(e) => setForm((p) => ({ ...p, rsvp_deadline: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5 justify-end">
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm py-2">Cancel</button>
            <button onClick={createInvitation} disabled={saving} className="btn-primary text-sm py-2">
              {saving ? "Creating..." : "Create Invitation"}
            </button>
          </div>
        </div>
      )}

      {/* Invitation Cards */}
      {invitations.length === 0 && !showCreate ? (
        <div className="bg-white/4 border border-white/6 rounded-xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-3xl mx-auto mb-4">
            ✉️
          </div>
          <h3 className="font-bold text-white mb-2">No invitations yet</h3>
          <p className="text-slate-500 text-sm mb-5">
            Create a beautiful digital invitation your guests can RSVP to online
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={15} />Create Your First Invitation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => {
            const invResponses = getInvResponses(inv.id);
            const accepted  = invResponses.filter((r) => r.status === "accepted").length;
            const declined  = invResponses.filter((r) => r.status === "declined").length;
            const tentative = invResponses.filter((r) => r.status === "tentative").length;
            const template  = TEMPLATES.find((t) => t.id === inv.template);
            const isActive  = activeInv?.id === inv.id;

            return (
              <div key={inv.id} className="bg-white/4 border border-white/6 rounded-xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-lg flex-shrink-0">
                        {template?.preview}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{inv.title || eventTitle}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="capitalize">{template?.label} template</span>
                          <span>·</span>
                          <span>{inv.view_count} views</span>
                          <span>·</span>
                          <span>{inv.rsvp_count} RSVPs</span>
                          {inv.rsvp_deadline && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Clock size={10} />Deadline: {formatDate(inv.rsvp_deadline)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn(
                        "badge border text-xs",
                        inv.is_active
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-500/15 text-slate-400 border-slate-500/20"
                      )}>
                        {inv.is_active ? "Active" : "Paused"}
                      </span>
                    </div>
                  </div>

                  {/* RSVP Stats mini bar */}
                  {invResponses.length > 0 && (
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 flex rounded-full overflow-hidden h-1.5">
                        {accepted  > 0 && <div className="bg-emerald-400" style={{ flex: accepted }} />}
                        {tentative > 0 && <div className="bg-blue-400"    style={{ flex: tentative }} />}
                        {declined  > 0 && <div className="bg-red-400"     style={{ flex: declined }} />}
                      </div>
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        <span className="text-emerald-400 font-semibold">{accepted}</span> yes ·{" "}
                        <span className="text-red-400 font-semibold">{declined}</span> no ·{" "}
                        <span className="text-blue-400 font-semibold">{tentative}</span> maybe
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <button
                      onClick={() => copyLink(inv)}
                      className="btn-secondary text-xs py-2 px-3"
                    >
                      {copied === inv.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      Copy Link
                    </button>
                    <a
                      href={getRSVPUrl(inv)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs py-2 px-3"
                    >
                      <Eye size={13} />Preview
                    </a>
                    <button
                      onClick={() => setActiveInv(isActive ? null : inv)}
                      className="btn-secondary text-xs py-2 px-3"
                    >
                      <Share2 size={13} />Share
                    </button>
                    <button
                      onClick={() => toggleActive(inv)}
                      className={cn(
                        "text-xs py-2 px-3 rounded-lg border font-semibold transition-all",
                        inv.is_active
                          ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                          : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                      )}
                    >
                      {inv.is_active ? "Pause" : "Activate"}
                    </button>
                  </div>
                </div>

                {/* Share Panel */}
                {isActive && (
                  <div className="border-t border-white/8 p-5 bg-white/2 animate-fade-in-up">
                    <p className="text-xs text-slate-500 mb-3">Share this invitation link with your guests:</p>
                    <div className="flex gap-2">
                      <input
                        className="input-field text-xs font-mono"
                        readOnly
                        value={getRSVPUrl(inv)}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button onClick={() => copyLink(inv)} className="btn-primary text-xs py-2 px-4 flex-shrink-0">
                        <Copy size={12} />Copy
                      </button>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {[
                        { icon: MessageCircle, label: "WhatsApp", color: "text-emerald-400", href: `https://wa.me/?text=You're invited! ${getRSVPUrl(inv)}` },
                        { icon: ExternalLink, label: "Open Page", color: "text-brand-400", href: getRSVPUrl(inv) },
                        { icon: QrCode, label: "QR (Coming Soon)", color: "text-slate-500", href: null },
                      ].map(({ icon: Icon, label, color, href }) => (
                        href ? (
                          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 transition-colors">
                            <Icon size={12} className={color} />{label}
                          </a>
                        ) : (
                          <span key={label} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/3 opacity-40 cursor-not-allowed">
                            <Icon size={12} className={color} />{label}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* RSVP Responses */}
                {invResponses.length > 0 && (
                  <div className="border-t border-white/8 p-5">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent RSVPs</h4>
                    <div className="space-y-2">
                      {invResponses.slice(0, 5).map((r) => (
                        <div key={r.id} className="flex items-center justify-between py-1.5">
                          <div>
                            <span className="text-sm font-medium text-white">{r.guest_name}</span>
                            {r.email && <span className="text-xs text-slate-500 ml-2">{r.email}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            {r.plus_one && <span className="text-xs text-slate-500">+1</span>}
                            <span className={cn(
                              "badge text-xs border",
                              r.status === "accepted"  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" :
                              r.status === "declined"  ? "bg-red-500/15 text-red-400 border-red-500/20" :
                                                         "bg-blue-500/15 text-blue-400 border-blue-500/20"
                            )}>
                              {r.status === "accepted" ? "Yes" : r.status === "declined" ? "No" : "Maybe"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {invResponses.length > 5 && (
                      <p className="text-xs text-slate-600 mt-2">+{invResponses.length - 5} more responses</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
