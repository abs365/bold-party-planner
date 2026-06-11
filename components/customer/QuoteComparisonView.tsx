"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Star, MapPin, BadgeCheck, Zap, Briefcase, CheckCircle, AlertCircle,
  ArrowLeft, Clock, ThumbsUp, X,
} from "lucide-react";

interface QuoteResponse {
  id: string;
  price: number;
  deposit_amount: number | null;
  message: string | null;
  title: string | null;
  description: string | null;
  services: string[] | null;
  terms: string | null;
  duration_hours: number | null;
  valid_until: string | null;
  includes: string[] | null;
}

interface ComparisonQuote {
  id: string;
  status: string;
  shortlisted_at: string | null;
  vendor: {
    id: string;
    business_name: string;
    category: string;
    city: string;
    rating: number | null;
    review_count: number | null;
    verification_level: number | null;
    response_rate: number | null;
    completed_jobs_count: number | null;
    media: Array<{ url: string; is_cover: boolean }> | null;
  } | null;
  response: QuoteResponse[] | null;
}

interface QuoteComparisonViewProps {
  quotes: ComparisonQuote[];
  eventTitle: string;
  eventId: string;
}

const MAX_COLS = 4;

export function QuoteComparisonView({ quotes, eventTitle, eventId }: QuoteComparisonViewProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState<string | null>(null);
  const [shortlisting, setShortlisting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const responded = quotes.filter((q) =>
    ["responded", "viewed", "shortlisted"].includes(q.status) && q.response?.[0]
  );

  if (responded.length === 0) {
    return (
      <div className="text-center py-20">
        <Clock className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <h3 className="text-white/60 text-lg">No vendor quotes to compare yet</h3>
        <p className="text-white/40 text-sm mt-1">
          Quotes will appear here once vendors respond to your requests.
        </p>
        <Link href="/dashboard/quotes" className="btn-secondary mt-5 inline-block">
          View Quote Requests
        </Link>
      </div>
    );
  }

  const cols = Math.min(responded.length, MAX_COLS);
  const lowestPrice = Math.min(...responded.map((q) => q.response![0].price));

  async function toggleShortlist(quoteId: string, isCurrentlyShortlisted: boolean) {
    setShortlisting(quoteId);
    try {
      await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "shortlist", shortlisted: !isCurrentlyShortlisted }),
      });
      router.refresh();
    } finally {
      setShortlisting(null);
    }
  }

  async function acceptQuote(quoteId: string) {
    setAccepting(quoteId);
    setError("");
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const data = (await res.json()) as { booking?: { id: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to accept");
      router.push("/dashboard/bookings");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept quote");
      setAccepting(null);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/quotes"
        className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Quotes
      </Link>

      <div>
        <h2 className="text-white font-bold text-xl">{eventTitle}</h2>
        <p className="text-white/50 text-sm mt-0.5">
          Comparing {responded.length} vendor{responded.length === 1 ? "" : "s"} · choose the best fit for your event
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Comparison grid */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {responded.map((quote) => {
          const r = quote.response![0];
          const cover = quote.vendor?.media?.find((m) => m.is_cover);
          const isShortlisted = quote.status === "shortlisted";
          const isCheapest = r.price === lowestPrice && responded.length > 1;
          const isAccepting = accepting === quote.id;
          const isShortlisting = shortlisting === quote.id;

          return (
            <div
              key={quote.id}
              className={`bg-white/4 border rounded-2xl overflow-hidden flex flex-col transition-colors ${
                isShortlisted ? "border-brand-500/40" : "border-white/6"
              }`}
            >
              {/* Vendor header */}
              <div className="p-4 space-y-3">
                {cover ? (
                  <Image
                    src={cover.url}
                    alt={quote.vendor?.business_name ?? ""}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-xl object-cover"
                    style={{ width: 56, height: 56 }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-lg">
                    {quote.vendor?.business_name?.[0] ?? "V"}
                  </div>
                )}

                <div>
                  <h3 className="text-white font-semibold leading-tight">
                    {quote.vendor?.business_name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap text-xs text-white/50">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {quote.vendor?.city}
                  </div>
                </div>

                {/* Rating + reviews */}
                <div className="flex items-center gap-1.5 text-sm">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-medium">
                    {(quote.vendor?.rating ?? 0).toFixed(1)}
                  </span>
                  <span className="text-white/40 text-xs">
                    ({quote.vendor?.review_count ?? 0})
                  </span>
                </div>

                {/* Trust badges: level 2+ only; level 1 has no document verification */}
                <div className="flex flex-wrap gap-1">
                  {(quote.vendor?.verification_level ?? 0) >= 4 && (
                    <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300">
                      <BadgeCheck className="w-3 h-3" /> Business Verified
                    </span>
                  )}
                  {(quote.vendor?.verification_level ?? 0) === 3 && (
                    <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300">
                      <BadgeCheck className="w-3 h-3" /> Address Verified
                    </span>
                  )}
                  {(quote.vendor?.verification_level ?? 0) === 2 && (
                    <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300">
                      <BadgeCheck className="w-3 h-3" /> ID Verified
                    </span>
                  )}
                  {(quote.vendor?.response_rate ?? 0) >= 80 && (
                    <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-[#0B1F4D]/10 border border-[#0B1F4D]/12 text-slate-300">
                      <Zap className="w-3 h-3" /> Fast
                    </span>
                  )}
                  {(quote.vendor?.completed_jobs_count ?? 0) >= 5 && (
                    <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-white/8 border border-white/12 text-white/60">
                      <Briefcase className="w-3 h-3" /> {quote.vendor?.completed_jobs_count}+ jobs
                    </span>
                  )}
                </div>
              </div>

              <hr className="border-white/8" />

              {/* Price */}
              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-3xl font-bold text-white">
                    £{r.price.toLocaleString("en-GB")}
                  </span>
                  {isCheapest && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/25 whitespace-nowrap">
                      Lowest price
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-xs">
                  Deposit: £{(r.deposit_amount ?? Math.round(r.price * 0.3)).toLocaleString("en-GB")}
                </p>
                {r.duration_hours != null && (
                  <p className="text-white/40 text-xs">{r.duration_hours}h service</p>
                )}
                {r.valid_until && (
                  <p className="flex items-center gap-1 text-white/30 text-xs">
                    <Clock className="w-3 h-3" />
                    Valid until {new Date(r.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>

              {/* Quote title + description */}
              {(r.title || r.description) && (
                <>
                  <hr className="border-white/8" />
                  <div className="p-4 space-y-1">
                    {r.title && <p className="text-white font-medium text-sm">{r.title}</p>}
                    {r.description && (
                      <p className="text-white/60 text-xs leading-relaxed line-clamp-3">{r.description}</p>
                    )}
                  </div>
                </>
              )}

              {/* What's included */}
              {(r.services?.length || r.includes?.length) ? (
                <>
                  <hr className="border-white/8" />
                  <div className="p-4 flex-1">
                    <p className="text-white/40 text-xs mb-2">What&apos;s included</p>
                    <ul className="space-y-1.5">
                      {(r.services ?? r.includes ?? []).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-white/70">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="flex-1" />
              )}

              {/* Vendor message */}
              {r.message && (
                <>
                  <hr className="border-white/8" />
                  <div className="p-4">
                    <p className="text-white/40 text-xs mb-1">Message from vendor</p>
                    <p className="text-white/70 text-xs leading-relaxed italic line-clamp-4">&ldquo;{r.message}&rdquo;</p>
                  </div>
                </>
              )}

              <hr className="border-white/8" />

              {/* Actions */}
              <div className="p-4 space-y-2">
                <button
                  onClick={() => acceptQuote(quote.id)}
                  disabled={isAccepting || !!accepting}
                  className="w-full btn-primary flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-40"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isAccepting ? "Creating booking…" : "Accept & Book"}
                </button>
                <button
                  onClick={() => toggleShortlist(quote.id, isShortlisted)}
                  disabled={isShortlisting}
                  className={`w-full flex items-center justify-center gap-2 text-sm py-2 rounded-xl border transition-colors disabled:opacity-40 ${
                    isShortlisted
                      ? "bg-brand-500/20 border-brand-500/40 text-brand-300"
                      : "bg-white/4 border-white/10 text-white/60 hover:bg-white/8"
                  }`}
                >
                  {isShortlisted ? (
                    <><X className="w-3.5 h-3.5" /> Remove from shortlist</>
                  ) : (
                    <><ThumbsUp className="w-3.5 h-3.5" /> Shortlist</>
                  )}
                </button>
                <Link
                  href={`/dashboard/quotes/${quote.id}`}
                  className="w-full flex items-center justify-center text-sm text-white/40 hover:text-white/70 transition-colors py-1"
                >
                  Full details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips section */}
      <div className="bg-white/3 border border-white/6 rounded-xl p-4 text-sm text-white/50 space-y-1">
        <p className="text-white/70 font-medium">Tips for comparing quotes</p>
        <ul className="space-y-1 text-xs list-disc list-inside">
          <li>Price isn&apos;t everything. Check what&apos;s included before choosing.</li>
          <li>Business Verified vendors have had their credentials checked by Elbold.</li>
          <li>Shortlist your top picks and sleep on it before accepting.</li>
          <li>Once you accept, a booking is created and other requests are closed.</li>
        </ul>
      </div>

      <div className="flex justify-center">
        <Link href={`/dashboard/events/${eventId}`} className="text-white/40 hover:text-white/70 text-sm transition-colors">
          Back to event
        </Link>
      </div>
    </div>
  );
}
