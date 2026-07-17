"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Light-themed copy-to-clipboard button used across the vendor-acquisition
 * views (CRM, Outreach Queue). Distinct from components/ui/CopyButton.tsx,
 * which is dark-themed for a different context — not a redundant duplicate.
 */
export function LeadCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
      style={{ background: copied ? "#d1fae5" : "#f3f4f6", color: copied ? "#065f46" : "#374151" }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
