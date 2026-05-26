"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { MessageSquare, Clock, CheckCircle, ArrowRight, Zap, AlertCircle } from "lucide-react";

interface QuoteResponse {
  id: string;
  price: number;
  deposit_amount: number;
  message: string | null;
  status: string;
  valid_until: string | null;
}

interface Quote {
  id: string;
  status: string;
  created_at: string;
  requirements: string | null;
  event_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  vendor: { id: string; business_name: string; category: string; city: string; rating: number; media: { url: string; is_cover: boolean }[] | null } | null;
  event: { id: string; title: string; date: string } | null;
  response: QuoteResponse[] | null;
}

interface CustomerQuotesViewProps {
  quotes: Quote[];
}

const STATUS_BADGE: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Awaiting Response", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", icon: Clock },
  responded: { label: "Response Received", color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: MessageSquare },
  converted: { label: "Booking Created", color: "bg-green-500/20 text-green-300 border-green-500/30", icon: CheckCircle },
  declined: { label: "Declined", color: "bg-red-500/20 text-red-300 border-red-500/30", icon: MessageSquare },
  expired: { label: "Expired", color: "bg-white/10 text-white/40 border-white/20", icon: Clock },
};

export function CustomerQuotesView({ quotes }: CustomerQuotesViewProps) {
  if (quotes.length === 0) {
    return (
      <div className="text-center py-20">
        <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <h3 className="text-white/60 text-lg">No quote requests yet</h3>
        <p className="text-white/40 text-sm mt-1">Browse vendors and request quotes to get started</p>
        <Link href="/browse" className="btn-primary mt-4 inline-block">Browse Vendors</Link>
      </div>
    );
  }

  const respondedCount = quotes.filter((q) => q.status === "responded").length;

  return (
    <div className="space-y-4">
      {/* Urgency banner if there are unread responses */}
      {respondedCount > 0 && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25">
          <Zap size={15} className="text-blue-400 flex-shrink-0" />
          <p className="text-blue-300 text-sm font-medium">
            {respondedCount === 1
              ? "1 vendor has responded to your quote request!"
              : `${respondedCount} vendors have responded to your quote requests!`}
          </p>
          <span className="ml-auto text-xs text-blue-400 font-semibold">Review below ↓</span>
        </div>
      )}

      {quotes.map((quote) => {
        const badge = STATUS_BADGE[quote.status] ?? STATUS_BADGE.pending;
        const BadgeIcon = badge.icon;
        const cover = quote.vendor?.media?.find((m) => m.is_cover);
        const response = quote.response?.[0];
        const hoursWaiting = differenceInHours(new Date(), new Date(quote.created_at));
        const isNewResponse = quote.status === "responded";
        const isSlowPending = quote.status === "pending" && hoursWaiting > 24;

        return (
          <Link
            key={quote.id}
            href={`/dashboard/quotes/${quote.id}`}
            className={`bg-white/4 border rounded-xl p-4 flex gap-4 card-hover block relative overflow-hidden${isNewResponse ? " border-blue-500/30" : " border-white/6"}`}
          >
            {/* New response highlight bar */}
            {isNewResponse && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl" />
            )}

            {cover ? (
              <Image src={cover.url} alt="" width={64} height={64} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-purple-400" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold truncate">{quote.vendor?.business_name ?? "Unknown Vendor"}</h3>
                    {isNewResponse && (
                      <span className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                        <Zap size={9} /> New!
                      </span>
                    )}
                  </div>
                  <p className="text-white/50 text-sm truncate">{quote.event?.title ?? quote.event_type ?? "Event"}</p>
                </div>
                <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs border flex items-center gap-1 ${badge.color}`}>
                  <BadgeIcon className="w-3 h-3" /> {badge.label}
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 flex-wrap gap-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white/40 text-xs">
                    {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                  </p>
                  {quote.budget_min != null && (
                    <p className="text-white/30 text-xs">· Budget £{quote.budget_min}–£{quote.budget_max ?? "open"}</p>
                  )}
                  {isSlowPending && (
                    <span className="flex items-center gap-1 text-amber-400 text-xs">
                      <AlertCircle size={10} />
                      Awaiting {hoursWaiting}h
                    </span>
                  )}
                </div>
                {response && (
                  <span className="text-emerald-400 text-sm font-bold">£{response.price.toFixed(0)}</span>
                )}
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-white/30 self-center flex-shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}
