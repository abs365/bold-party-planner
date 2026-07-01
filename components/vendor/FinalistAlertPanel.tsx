import Link from "next/link";
import { Trophy } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ControlCentreQuote } from "@/lib/vendor/business-control-centre";

interface Props {
  shortlisted: ControlCentreQuote[];
}

export function FinalistAlertPanel({ shortlisted }: Props) {
  if (shortlisted.length === 0) return null;

  if (shortlisted.length === 1) {
    const q = shortlisted[0];
    return (
      <div className="rounded-xl border border-gold-400/30 bg-brand-500/12 px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={16} className="text-gold-400" />
          <span className="text-sm font-semibold text-gold-400">You&apos;re a finalist</span>
        </div>
        <p className="text-sm text-white">
          {q.customer?.full_name ?? "A customer"} has shortlisted your quote for{" "}
          <span className="font-medium">{q.event?.title ?? "their event"}</span>
          {q.event?.date && <> · {formatDate(q.event.date)}</>}
          {q.event?.city && <> · {q.event.city}</>}
        </p>
        {q.budget_max != null && (
          <p className="text-xs text-slate-400 mt-1">Budget: up to {formatCurrency(q.budget_max)}</p>
        )}
        <div className="flex gap-4 mt-3">
          <Link href="/vendor/availability" className="text-xs font-medium text-gold-400 hover:text-gold-300">
            Confirm Availability →
          </Link>
          <Link href="/vendor/quotes" className="text-xs font-medium text-gold-400 hover:text-gold-300">
            View Full Quote →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gold-400/30 bg-brand-500/12 px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <Trophy size={16} className="text-gold-400" />
        <span className="text-sm font-semibold text-gold-400">
          You&apos;re a finalist in {shortlisted.length} quote requests
        </span>
      </div>
      <ul className="space-y-1 mb-2">
        {shortlisted.slice(0, 3).map((q) => (
          <li key={q.id} className="text-sm text-white">
            {q.event?.title ?? "Untitled event"}
            {q.event?.date && <span className="text-slate-400"> · {formatDate(q.event.date)}</span>}
          </li>
        ))}
      </ul>
      <Link href="/vendor/quotes" className="text-xs font-medium text-gold-400 hover:text-gold-300">
        View all finalists →
      </Link>
    </div>
  );
}
