"use client";

import { useState } from "react";
import Link from "next/link";
import { BookUser, Search, ArrowRight, Calendar, Mail, Phone, Archive, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { SourceBadge } from "@/components/vendor/SourceBadge";
import type { ManualContact, ManualContactStage } from "@/types";

const PAGE_SIZE = 20;

const STAGE_META: Record<ManualContactStage, { label: string; className: string }> = {
  lead:       { label: "Lead",       className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  contacted:  { label: "Contacted",  className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  quoted:     { label: "Quoted",     className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  won:        { label: "Won",        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  lost:       { label: "Lost",       className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

function isOverdue(contact: ManualContact): boolean {
  return !!contact.follow_up_at && new Date(contact.follow_up_at).getTime() <= Date.now();
}

const SOURCE_OPTIONS = [
  { value: "", label: "All sources" },
  { value: "instagram",         label: "Instagram" },
  { value: "facebook",          label: "Facebook" },
  { value: "tiktok",            label: "TikTok" },
  { value: "whatsapp",          label: "WhatsApp" },
  { value: "referral",          label: "Referral" },
  { value: "existing_customer", label: "Existing Customer" },
  { value: "direct",            label: "Direct" },
  { value: "other",             label: "Other" },
];

interface Props {
  contacts: ManualContact[];
  showArchived?: boolean;
  maxContacts?: number;         // -1 = unlimited
  activeContactCount?: number;
}

export function ContactListView({ contacts, showArchived = false, maxContacts = -1, activeContactCount = 0 }: Props) {
  const [query,     setQuery]     = useState("");
  const [source,    setSource]    = useState("");
  const [page,      setPage]      = useState(1);
  const [followUpOnly, setFollowUpOnly] = useState(false);

  const overdueCount = contacts.filter(isOverdue).length;

  const filtered = contacts.filter((c) => {
    const matchesSearch = !query.trim() || [
      c.display_name,
      c.display_email ?? "",
      c.display_phone ?? "",
    ].some((v) => v.toLowerCase().includes(query.toLowerCase()));

    const matchesSource = !source || c.source === source;
    const matchesFollowUp = !followUpOnly || isOverdue(c);
    return matchesSearch && matchesSource && matchesFollowUp;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const slice      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {showArchived ? "Archived Contacts" : "Direct Contacts"}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""} from off-platform channels
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!showArchived && (
            <Link
              href="/vendor/contacts?archived=true"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              Archived
            </Link>
          )}
          {showArchived && (
            <Link
              href="/vendor/contacts"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
            >
              ← Active
            </Link>
          )}
          <Link
            href="/vendor/contacts/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-colors"
          >
            + New Contact
          </Link>
        </div>
      </div>

      {/* Contextual subscription nudge - only shown when approaching/at the
          Free plan contact limit, i.e. tied to real CRM usage rather than a
          generic upsell */}
      {!showArchived && maxContacts !== -1 && activeContactCount >= Math.floor(maxContacts * 0.8) && (
        <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-4 ${
          activeContactCount >= maxContacts
            ? "bg-amber-500/10 border-amber-500/25"
            : "bg-white/4 border-white/8"
        }`}>
          <p className="text-sm text-white/70">
            {activeContactCount >= maxContacts
              ? `You've reached the ${maxContacts}-contact limit on the Free plan.`
              : `You're using ${activeContactCount} of ${maxContacts} contacts on the Free plan.`}
            {" "}Upgrade to Pro for unlimited contacts and automatic follow-up reminders.
          </p>
          <Link
            href="/vendor/subscription"
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-gold-400/15 text-gold-400 border border-gold-400/30 hover:bg-gold-400/25 transition-colors whitespace-nowrap"
          >
            Upgrade to Pro
          </Link>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, email, or phone…"
            className="w-full bg-white/4 border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20"
          />
        </div>
        <select
          value={source}
          onChange={(e) => { setSource(e.target.value); setPage(1); }}
          className="bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white/70 focus:outline-none focus:border-brand-500/40 appearance-none cursor-pointer"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#0d0d18]">{o.label}</option>
          ))}
        </select>
        {overdueCount > 0 && (
          <button
            onClick={() => { setFollowUpOnly((v) => !v); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              followUpOnly
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "bg-white/4 border-white/8 text-white/50 hover:text-white/80"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {overdueCount} need{overdueCount === 1 ? "s" : ""} follow-up
          </button>
        )}
      </div>

      {/* List */}
      {contacts.length === 0 ? (
        <div className="bg-white/4 border border-white/6 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-4">
            <BookUser className="w-6 h-6 text-white/30" />
          </div>
          <h3 className="font-bold text-white mb-2">
            {showArchived ? "No archived contacts" : "No direct contacts yet"}
          </h3>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            {showArchived
              ? "Archived contacts will appear here."
              : "Add contacts from Instagram, WhatsApp, referrals, and other off-platform channels."}
          </p>
          {!showArchived && (
            <Link
              href="/vendor/contacts/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-colors"
            >
              + Add first contact
            </Link>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/4 border border-white/6 rounded-xl p-8 text-center">
          <p className="text-white/40 text-sm">No contacts match your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {slice.map((c) => (
            <Link
              key={c.id}
              href={`/vendor/contacts/${c.id}`}
              className="bg-white/4 border border-white/6 rounded-xl p-4 flex items-center gap-4 hover:border-brand-500/30 transition-all group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-700/20 border border-orange-500/20 flex items-center justify-center text-sm font-bold text-orange-300 flex-shrink-0">
                {c.display_name[0]?.toUpperCase() ?? "?"}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white text-sm group-hover:text-brand-400 transition-colors truncate">
                    {c.display_name}
                  </span>
                  <SourceBadge source={c.source} />
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${STAGE_META[c.stage].className}`}>
                    {STAGE_META[c.stage].label}
                  </span>
                  {isOverdue(c) && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock className="w-2.5 h-2.5" /> Follow up
                    </span>
                  )}
                  {c.linked_profile_id && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Converted
                    </span>
                  )}
                  {c.is_archived && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      Archived
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-white/35 flex-wrap">
                  {c.display_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {c.display_email}
                    </span>
                  )}
                  {c.display_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {c.display_phone}
                    </span>
                  )}
                  {c.source_detail && (
                    <span className="text-white/25">{c.source_detail}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Added {formatDate(c.created_at)}
                  </span>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-brand-400 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-white/35 text-xs">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
