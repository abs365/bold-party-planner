"use client";

import type { BookingSource, ManualContactSource } from "@/types";

interface SourceMeta { label: string; color: string; bg: string; border: string }

const SOURCE_META: Record<ManualContactSource, SourceMeta> = {
  instagram:         { label: "Instagram",         color: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/25" },
  facebook:          { label: "Facebook",          color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/25" },
  tiktok:            { label: "TikTok",            color: "text-teal-400",   bg: "bg-teal-500/10",   border: "border-teal-500/25" },
  whatsapp:          { label: "WhatsApp",          color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/25" },
  referral:          { label: "Referral",          color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/25" },
  existing_customer: { label: "Existing Customer", color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/25" },
  direct:            { label: "Direct",            color: "text-slate-400",  bg: "bg-slate-500/10",  border: "border-slate-500/25" },
  other:             { label: "Other",             color: "text-slate-400",  bg: "bg-slate-500/10",  border: "border-slate-500/25" },
};

const MARKETPLACE_META: SourceMeta = {
  label: "Marketplace", color: "text-brand-400", bg: "bg-brand-500/10", border: "border-brand-500/25",
};

export function SourceBadge({ source }: { source: BookingSource }) {
  const meta = source === "elbold_marketplace" ? MARKETPLACE_META : SOURCE_META[source as ManualContactSource];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${meta.bg} ${meta.color} ${meta.border}`}>
      {meta.label}
    </span>
  );
}

export function ContactTypeBadge({ type }: { type: "marketplace" | "direct" }) {
  if (type === "marketplace") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-brand-500/10 text-brand-400 border-brand-500/25">
        Marketplace
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-orange-500/10 text-orange-400 border-orange-500/25">
      Direct Contact
    </span>
  );
}

export function getSourceLabel(source: BookingSource): string {
  if (source === "elbold_marketplace") return "Marketplace";
  return SOURCE_META[source as ManualContactSource]?.label ?? source;
}
