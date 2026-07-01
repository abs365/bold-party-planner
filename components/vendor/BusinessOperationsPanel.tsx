import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { WARNING_SEVERITY_BADGE } from "@/lib/vendor/warnings";
import type { BusinessOperations } from "@/lib/vendor/business-control-centre";

interface Props {
  businessOperations: BusinessOperations;
}

const NEXT_EVENT_COLOUR = (daysUntil: number) =>
  daysUntil <= 3 ? "text-amber-400" : daysUntil <= 7 ? "text-blue-400" : "text-slate-300";

export function BusinessOperationsPanel({ businessOperations: o }: Props) {
  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-3">
      <p className="text-sm font-semibold text-white">Business Operations</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
        <span>{o.pendingBookings} pending</span>
        <span>·</span>
        <span>{o.confirmedBookings} confirmed</span>
        <span>·</span>
        <span>{o.awaitingPaymentBookings} awaiting payment</span>
      </div>

      {o.nextEvent && (
        <p className="text-xs text-slate-300">
          Next event: <span className={`font-semibold ${NEXT_EVENT_COLOUR(o.nextEvent.daysUntil)}`}>{o.nextEvent.daysUntil} day{o.nextEvent.daysUntil === 1 ? "" : "s"}</span>
          {" — "}{o.nextEvent.title} · {formatDate(o.nextEvent.date)}
          {o.nextEvent.totalUpcomingCount > 1 && (
            <span className="text-slate-500"> · and {o.nextEvent.totalUpcomingCount - 1} more upcoming</span>
          )}
        </p>
      )}

      <p className="text-xs text-slate-300">
        Response rate: <span className="font-semibold">{o.responseTracker.responseRate ?? "—"}{o.responseTracker.responseRate != null && "%"}</span>
        {" "}· {o.responseTracker.tierLabel}
        {o.responseTracker.oldestPendingQuoteHoursAgo != null && (
          <span className="text-slate-500"> · oldest unanswered lead: {o.responseTracker.oldestPendingQuoteHoursAgo}h ago</span>
        )}
      </p>

      <p className="text-xs text-slate-300">
        Messages: {o.unreadMessageCount} unread · Calendar: {o.hasAvailability ? "✓ Configured" : (
          <Link href="/vendor/availability" className="text-gold-400 hover:text-gold-300">Not set →</Link>
        )}
      </p>

      <p className="text-xs text-slate-300">
        Payouts: {formatCurrency(o.pendingPayout)} pending · {formatCurrency(o.earned)} earned to date
      </p>

      {o.activeWarnings.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-white/6">
          {o.activeWarnings.map((w) => (
            <div key={w.type} className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${WARNING_SEVERITY_BADGE[w.severity]}`}>
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
              <span>{w.vendorFacingMessage}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4 pt-1">
        <Link href="/vendor/bookings" className="text-xs font-medium text-gold-400 hover:text-gold-300">View Bookings →</Link>
        <Link href="/vendor/payouts" className="text-xs font-medium text-gold-400 hover:text-gold-300">View Payouts →</Link>
      </div>
    </div>
  );
}
