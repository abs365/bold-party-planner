"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Send, Flame, TrendingUp } from "lucide-react";
import { scoreLead } from "@/lib/ai/scoring";

interface QuoteResponse {
  id: string;
  price: number;
  deposit_amount: number;
  message: string;
  status: string;
  valid_until: string | null;
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
  customer: { id: string; full_name: string; avatar_url: string | null } | null;
  event: { id: string; title: string; date: string; city: string; guest_count: number | null } | null;
  response: QuoteResponse[] | null;
}

interface VendorQuotesViewProps {
  quotes: Quote[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  responded: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  converted: "bg-green-500/20 text-green-300 border-green-500/30",
  declined: "bg-red-500/20 text-red-300 border-red-500/30",
  expired: "bg-white/10 text-white/40 border-white/20",
};

export function VendorQuotesView({ quotes }: VendorQuotesViewProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submitResponse(quoteId: string) {
    if (!price || Number(price) <= 0) { setError("Please enter a valid price"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond", price: Number(price), message, valid_until: validUntil || null }),
      });
      if (!res.ok) throw new Error("Failed to submit response");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to respond");
    } finally {
      setSaving(false);
    }
  }

  const pending = quotes.filter((q) => q.status === "pending");
  const responded = quotes.filter((q) => q.status === "responded");
  const converted = quotes.filter((q) => q.status === "converted");
  const other = quotes.filter((q) => !["pending", "responded", "converted"].includes(q.status));

  function renderSection(label: string, items: Quote[]) {
    if (!items.length) return null;
    return (
      <div className="mb-8">
        <h3 className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wider">{label} ({items.length})</h3>
        <div className="space-y-4">
          {items.map((quote) => {
            const existingResponse = quote.response?.[0];
            const isExpanded = expanded === quote.id;
            const isResponding = responding === quote.id;
            return (
              <div key={quote.id} className="bg-white/4 border border-white/6 rounded-xl overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : quote.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-white font-semibold">
                        {quote.customer?.full_name?.[0] ?? "?"}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{quote.customer?.full_name ?? "Unknown"}</p>
                        <LeadScorePill score={scoreLead({ budget_max: quote.budget_max, guest_count: quote.guest_count, event_date: quote.event_date })} />
                      </div>
                      <p className="text-white/50 text-sm">
                        {quote.event?.title ?? quote.event_type ?? "Event"} · {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                        {quote.budget_min != null && ` · £${quote.budget_min}–£${quote.budget_max ?? "open"}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {quote.status === "pending" && (
                      <ExpiryBadge expiresAt={quote.expires_at ?? null} />
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs border ${STATUS_COLORS[quote.status] ?? "bg-white/10 text-white/60"}`}>
                      {quote.status}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {quote.event && (
                        <>
                          <InfoBlock label="Event" value={quote.event.title} />
                          <InfoBlock label="Date" value={quote.event.date} />
                          <InfoBlock label="Location" value={quote.event.city} />
                          <InfoBlock label="Guests" value={String(quote.event.guest_count ?? quote.guest_count ?? "—")} />
                        </>
                      )}
                      {quote.budget_min != null && (
                        <InfoBlock label="Budget" value={`£${quote.budget_min}–£${quote.budget_max ?? "open"}`} />
                      )}
                    </div>

                    {quote.requirements && (
                      <div>
                        <p className="text-white/50 text-xs mb-1">Requirements</p>
                        <p className="text-white/80 text-sm">{quote.requirements}</p>
                      </div>
                    )}
                    {quote.message && (
                      <div>
                        <p className="text-white/50 text-xs mb-1">Message</p>
                        <p className="text-white/80 text-sm">{quote.message}</p>
                      </div>
                    )}

                    {existingResponse && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-blue-300 text-xs font-medium mb-1">Your Response</p>
                        <p className="text-white font-semibold">£{existingResponse.price.toFixed(2)}</p>
                        {existingResponse.message && <p className="text-white/70 text-sm mt-1">{existingResponse.message}</p>}
                        {existingResponse.valid_until && (
                          <p className="text-white/40 text-xs mt-1">Valid until {new Date(existingResponse.valid_until).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}

                    {quote.status === "pending" && !existingResponse && (
                      <div>
                        {!isResponding ? (
                          <button
                            onClick={() => { setResponding(quote.id); setError(""); }}
                            className="btn-primary flex items-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" /> Respond to Quote
                          </button>
                        ) : (
                          <div className="space-y-3 border border-purple-500/30 rounded-lg p-4 bg-purple-500/5">
                            <h4 className="text-white font-medium text-sm">Send Your Quote</h4>
                            <div>
                              <label className="block text-white/60 text-xs mb-1">Your Price (£) *</label>
                              <input className="input-field" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 800" />
                            </div>
                            <div>
                              <label className="block text-white/60 text-xs mb-1">Message to Customer</label>
                              <textarea className="input-field" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe what's included, your availability, any questions..." />
                            </div>
                            <div>
                              <label className="block text-white/60 text-xs mb-1">Valid Until (optional)</label>
                              <input className="input-field" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                            </div>
                            {error && <p className="text-red-400 text-xs">{error}</p>}
                            <div className="flex gap-2">
                              <button onClick={() => submitResponse(quote.id)} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-40">
                                <Send className="w-4 h-4" /> {saving ? "Sending..." : "Send Quote"}
                              </button>
                              <button onClick={() => setResponding(null)} className="btn-secondary">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-20">
        <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <h3 className="text-white/60 text-lg">No quotes yet</h3>
        <p className="text-white/40 text-sm mt-1">Quote requests from customers will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-6 mb-6 flex-wrap">
        <StatChip icon={Clock} label="Pending" count={pending.length} color="text-yellow-400" />
        <StatChip icon={Send} label="Responded" count={responded.length} color="text-blue-400" />
        <StatChip icon={CheckCircle} label="Converted" count={converted.length} color="text-green-400" />
        <StatChip icon={XCircle} label="Other" count={other.length} color="text-white/40" />
      </div>
      {renderSection("Awaiting Response", pending)}
      {renderSection("Responded", responded)}
      {renderSection("Converted to Booking", converted)}
      {renderSection("Other", other)}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/40 text-xs">{label}</p>
      <p className="text-white text-sm">{value}</p>
    </div>
  );
}

function StatChip({ icon: Icon, label, count, color }: { icon: React.ComponentType<{ className?: string }>; label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-white font-semibold">{count}</span>
      <span className="text-white/50 text-sm">{label}</span>
    </div>
  );
}

function LeadScorePill({ score }: { score: number }) {
  if (score < 30) return null;
  const isHot = score >= 70;
  const isMedium = score >= 45;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
      isHot ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" :
      isMedium ? "bg-yellow-500/15 text-yellow-300 border border-yellow-500/25" :
      "bg-blue-500/15 text-blue-300 border border-blue-500/25"
    }`}>
      {isHot ? <Flame className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
      {isHot ? "Hot lead" : isMedium ? "Good lead" : "Lead"}
    </span>
  );
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return null;
  const now = new Date();
  const hoursLeft = Math.max(0, (new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60));
  if (hoursLeft > 48) return null;
  const isUrgent = hoursLeft <= 24;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${
      isUrgent ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-amber-500/15 text-amber-300 border border-amber-500/25"
    }`}>
      <Clock className="w-3 h-3" />
      {isUrgent ? `${Math.round(hoursLeft)}h left` : `${Math.round(hoursLeft / 24)}d left`}
    </span>
  );
}
