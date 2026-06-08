"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { differenceInHours, differenceInDays } from "date-fns";
import {
  Star,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  CalendarCheck,
  Zap,
  BadgeCheck,
  Briefcase,
} from "lucide-react";

interface QuoteResponse {
  id: string;
  price: number;
  deposit_amount: number;
  message: string | null;
  status: string;
  valid_until: string | null;
  includes: string[] | null;
}

interface Quote {
  id: string;
  status: string;
  created_at: string;
  requirements: string | null;
  message: string | null;
  event_date: string | null;
  event_type: string | null;
  guest_count: number | null;
  budget_min: number | null;
  budget_max: number | null;
  expires_at: string | null;
  converted_booking_id: string | null;
  vendor: {
    id: string;
    business_name: string;
    category: string;
    city: string;
    rating: number;
    review_count: number;
    bio: string | null;
    verification_level?: number;
    response_rate?: number | null;
    completed_jobs_count?: number;
    media: { url: string; is_cover: boolean; type: string }[] | null;
    packages: { id: string; name: string; price: number; includes: string[] | null }[] | null;
  } | null;
  customer: { id: string; full_name: string } | null;
  event: { id: string; title: string; date: string; city: string; guest_count: number | null } | null;
  response: QuoteResponse[] | null;
}

interface QuoteDetailViewProps {
  quote: Quote;
}

const TIMELINE_STEPS = [
  { key: "pending", label: "Request Sent" },
  { key: "responded", label: "Vendor Responded" },
  { key: "converted", label: "Booking Created" },
] as const;

function getTimelineStep(status: string): number {
  if (status === "pending") return 0;
  if (status === "responded") return 1;
  if (status === "converted") return 2;
  return 0;
}

function ExpiresCountdown({ expiresAt }: { expiresAt: string }) {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const days = differenceInDays(expiry, now);
  const hours = differenceInHours(expiry, now);

  if (hours <= 0) return <span className="text-red-400 text-xs">Expired</span>;
  const label = days >= 1 ? `${days}d ${hours % 24}h` : `${hours}h`;
  return (
    <span className="text-yellow-300 text-xs flex items-center gap-1">
      <Clock className="w-3 h-3" />
      Expires in {label}
    </span>
  );
}

export function QuoteDetailView({ quote }: QuoteDetailViewProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState("");

  const response = quote.response?.[0];
  const cover = quote.vendor?.media?.find((m) => m.is_cover);
  const canAct = quote.status === "responded" && response;
  const activeStep = getTimelineStep(quote.status);

  async function acceptQuote() {
    setAccepting(true);
    setError("");
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const data = (await res.json()) as { booking?: { id: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to accept");
      router.push("/dashboard/bookings");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept quote");
    } finally {
      setAccepting(false);
    }
  }

  async function declineQuote() {
    setDeclining(true);
    setError("");
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
      if (!res.ok) throw new Error("Failed to decline");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to decline");
    } finally {
      setDeclining(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/quotes"
        className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Quotes
      </Link>

      {/* Vendor header */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-5 flex items-start gap-4">
        {cover ? (
          <Image
            src={cover.url}
            alt={quote.vendor?.business_name ?? "Vendor"}
            width={72}
            height={72}
            className="w-18 h-18 rounded-xl object-cover flex-shrink-0"
            style={{ width: 72, height: 72 }}
          />
        ) : (
          <div className="w-[72px] h-[72px] rounded-xl bg-slate-500/20 flex items-center justify-center flex-shrink-0">
            <CalendarCheck className="w-7 h-7 text-slate-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate">
            {quote.vendor?.business_name ?? "Unknown Vendor"}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-white/60">
            <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-xs capitalize border border-brand-500/30">
              {quote.vendor?.category?.replace(/_/g, " ")}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {quote.vendor?.city}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              {quote.vendor?.rating.toFixed(1)}
            </span>
          </div>
          {/* Vendor trust signals: only show document-verified badges (level 2+) */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(quote.vendor?.verification_level ?? 0) >= 4 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300">
                <BadgeCheck className="w-3 h-3" /> Business Verified
              </span>
            )}
            {(quote.vendor?.verification_level ?? 0) === 3 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300">
                <BadgeCheck className="w-3 h-3" /> Address Verified
              </span>
            )}
            {(quote.vendor?.verification_level ?? 0) === 2 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300">
                <BadgeCheck className="w-3 h-3" /> ID Verified
              </span>
            )}
            {(quote.vendor?.response_rate ?? 0) >= 80 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#0B1F4D]/10 border border-[#0B1F4D]/12 text-slate-300">
                <Zap className="w-3 h-3" /> Fast Responder
              </span>
            )}
            {(quote.vendor?.completed_jobs_count ?? 0) >= 5 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/8 border border-white/12 text-white/60">
                <Briefcase className="w-3 h-3" /> {quote.vendor?.completed_jobs_count}+ events
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-4">
        <div className="flex items-center gap-0">
          {TIMELINE_STEPS.map((step, index) => {
            const isActive = index === activeStep;
            const isDone = index < activeStep;
            const isLast = index === TIMELINE_STEPS.length - 1;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      isDone
                        ? "bg-brand-500 border-brand-500 text-white"
                        : isActive
                        ? "border-brand-500 text-brand-400 bg-brand-500/10"
                        : "border-white/20 text-white/30 bg-transparent"
                    }`}
                  >
                    {isDone ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  <span
                    className={`text-xs text-center leading-tight ${
                      isActive ? "text-brand-400 font-medium" : isDone ? "text-white/70" : "text-white/30"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 mb-4 ${
                      index < activeStep ? "text-brand-500" : "text-white/20"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Left: Your Request */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Your Request</h3>
          <div className="space-y-3 text-sm">
            {quote.event?.title && <InfoRow label="Event" value={quote.event.title} />}
            {(quote.event?.date ?? quote.event_date) && (
              <InfoRow
                label="Date"
                value={new Date(
                  quote.event?.date ?? quote.event_date ?? ""
                ).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              />
            )}
            {quote.event?.city && <InfoRow label="Location" value={quote.event.city} />}
            {(quote.event?.guest_count ?? quote.guest_count) != null && (
              <InfoRow
                label="Guests"
                value={String(quote.event?.guest_count ?? quote.guest_count)}
              />
            )}
            {quote.budget_min != null && (
              <InfoRow
                label="Budget"
                value={`£${quote.budget_min.toLocaleString()}–£${
                  quote.budget_max != null ? quote.budget_max.toLocaleString() : "open"
                }`}
              />
            )}
          </div>
          {quote.requirements && (
            <div>
              <p className="text-white/40 text-xs mb-1">Requirements</p>
              <p className="text-white/80 text-sm leading-relaxed">{quote.requirements}</p>
            </div>
          )}
          {quote.message && (
            <div>
              <p className="text-white/40 text-xs mb-1">Your message</p>
              <p className="text-white/80 text-sm leading-relaxed">{quote.message}</p>
            </div>
          )}
        </div>

        {/* Right: Vendor Response */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Vendor Response</h3>

          {/* Converted */}
          {quote.status === "converted" && (
            <div className="rounded-lg bg-green-500/15 border border-green-500/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                <CheckCircle className="w-4 h-4" />
                Booking Created
              </div>
              <p className="text-white/60 text-xs">
                This quote has been converted to a confirmed booking.
              </p>
              <Link
                href="/dashboard/bookings"
                className="btn-primary text-sm inline-block mt-1 text-center w-full"
              >
                View Booking
              </Link>
            </div>
          )}

          {/* Declined or Expired */}
          {(quote.status === "declined" || quote.status === "expired") && (
            <div className="rounded-lg bg-white/5 border border-white/10 p-4">
              <p className="text-white/40 text-sm text-center">
                {quote.status === "declined" ? "This quote was declined." : "This quote has expired."}
              </p>
            </div>
          )}

          {/* Pending */}
          {quote.status === "pending" && (
            <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
              <Clock className="w-10 h-10 text-white/20" />
              <p className="text-white/60 text-sm">Awaiting vendor response...</p>
              <p className="text-white/40 text-xs">
                Vendors typically respond within 1–2 business days
              </p>
              {quote.expires_at && <ExpiresCountdown expiresAt={quote.expires_at} />}
            </div>
          )}

          {/* Responded / accepted: show price + details */}
          {(quote.status === "responded" || (quote.status === "accepted" && response)) &&
            response && (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-bold text-white">
                      £{response.price.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-white/50 text-sm ml-2">total</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white/50 text-xs">Deposit (30%)</p>
                    <p className="text-brand-400 font-semibold">
                      £
                      {(response.deposit_amount ?? response.price * 0.3).toLocaleString("en-GB", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                {response.message && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/70 text-sm leading-relaxed">{response.message}</p>
                  </div>
                )}

                {Array.isArray(response.includes) && response.includes.length > 0 && (
                  <div>
                    <p className="text-white/40 text-xs mb-2">What&apos;s included</p>
                    <ul className="space-y-1.5">
                      {(response.includes as string[]).map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-white/80">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {response.valid_until && (
                  <p className="flex items-center gap-1.5 text-white/40 text-xs">
                    <Clock className="w-3 h-3" />
                    Valid until{" "}
                    {new Date(response.valid_until).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Action buttons (only when status=responded) */}
      {canAct && (
        <div className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-3">
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-yellow-300 text-sm">
            Accepting will create a confirmed booking. You&apos;ll need to pay the{" "}
            £
            {(response!.deposit_amount ?? response!.price * 0.3).toLocaleString("en-GB", {
              minimumFractionDigits: 2,
            })}{" "}
            deposit to secure the date.
          </div>
          <div className="flex gap-3">
            <button
              onClick={acceptQuote}
              disabled={accepting}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <CheckCircle className="w-4 h-4" />
              {accepting ? "Creating booking..." : "Accept & Book"}
            </button>
            <button
              onClick={declineQuote}
              disabled={declining}
              className="btn-secondary flex items-center gap-2 disabled:opacity-40"
            >
              {declining ? "..." : "Decline"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-white/40 text-xs shrink-0">{label}</span>
      <span className="text-white text-xs text-right">{value}</span>
    </div>
  );
}
