"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Send, Flame, TrendingUp, PoundSterling, Calendar, Users, MapPin,
  AlertTriangle, Edit3, X, Camera, ShieldCheck,
} from "lucide-react";
import { scoreLead } from "@/lib/ai/scoring";
import type { Quote, QuoteResponse } from "@/types";

interface VendorQuotesViewProps {
  quotes: Quote[];
}

const STATUS_COLORS: Record<string, string> = {
  pending:     "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  responded:   "bg-blue-500/20 text-blue-300 border-blue-500/30",
  viewed:      "bg-blue-500/20 text-blue-300 border-blue-500/30",
  shortlisted: "bg-[#0B1F4D]/12 text-slate-300 border-[#0B1F4D]/15",
  converted:   "bg-green-500/20 text-green-300 border-green-500/30",
  accepted:    "bg-green-500/20 text-green-300 border-green-500/30",
  declined:    "bg-red-500/20 text-red-300 border-red-500/30",
  rejected:    "bg-red-500/20 text-red-300 border-red-500/30",
  withdrawn:   "bg-white/10 text-white/40 border-white/20",
  expired:     "bg-white/10 text-white/40 border-white/20",
};

const STATUS_LABEL: Record<string, string> = {
  pending:     "Awaiting Response",
  responded:   "Quoted",
  viewed:      "Quote Viewed",
  shortlisted: "Shortlisted",
  converted:   "Booking Created",
  accepted:    "Accepted",
  declined:    "Declined",
  rejected:    "Not Selected",
  withdrawn:   "Withdrawn",
  expired:     "Expired",
};

type FormState = {
  title:          string;
  price:          string;
  deposit_amount: string;
  description:    string;
  services:       string;   // newline-separated, split on submit
  message:        string;
  terms:          string;
  duration_hours: string;
  valid_until:    string;
  decline_reason: string;
};

const EMPTY_FORM: FormState = {
  title: "", price: "", deposit_amount: "", description: "",
  services: "", message: "", terms: "", duration_hours: "", valid_until: "", decline_reason: "",
};

function formFromResponse(r: QuoteResponse): FormState {
  return {
    title:          r.title ?? "",
    price:          String(r.price),
    deposit_amount: r.deposit_amount != null ? String(r.deposit_amount) : "",
    description:    r.description ?? "",
    services:       (r.services ?? []).join("\n"),
    message:        r.message ?? "",
    terms:          r.terms ?? "",
    duration_hours: r.duration_hours != null ? String(r.duration_hours) : "",
    valid_until:    r.valid_until ? r.valid_until.split("T")[0] : "",
    decline_reason: "",
  };
}

export function VendorQuotesView({ quotes }: VendorQuotesViewProps) {
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [formMode,   setFormMode]   = useState<"respond" | "decline" | null>(null);
  const [activeId,   setActiveId]   = useState<string | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  const actionable = quotes.filter((q) => ["pending", "responded", "viewed"].includes(q.status));
  const shortlisted = quotes.filter((q) => q.status === "shortlisted");
  const historical  = quotes.filter((q) => ["converted", "accepted", "declined", "rejected", "withdrawn", "expired"].includes(q.status));

  function openRespond(quote: Quote) {
    const existing = Array.isArray(quote.response) ? quote.response[0] : quote.response;
    setForm(existing ? formFromResponse(existing as QuoteResponse) : EMPTY_FORM);
    setFormMode("respond");
    setActiveId(quote.id);
    setError("");
  }

  function openDecline(quote: Quote) {
    setForm({ ...EMPTY_FORM, decline_reason: "" });
    setFormMode("decline");
    setActiveId(quote.id);
    setError("");
  }

  function closeForm() { setFormMode(null); setActiveId(null); setError(""); }

  async function submitQuote(quoteId: string) {
    const price = Number(form.price);
    if (!price || price <= 0) { setError("Please enter a valid price"); return; }
    setSaving(true); setError("");
    try {
      const services = form.services.split("\n").map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:         "respond",
          price,
          deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : undefined,
          title:          form.title         || undefined,
          description:    form.description   || undefined,
          services:       services.length     ? services : undefined,
          message:        form.message        || undefined,
          terms:          form.terms          || undefined,
          duration_hours: form.duration_hours ? Number(form.duration_hours) : undefined,
          valid_until:    form.valid_until    || undefined,
        }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "Failed"); }
      window.location.reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to submit quote"); }
    finally { setSaving(false); }
  }

  async function submitDecline(quoteId: string) {
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vendor_decline", reason: form.decline_reason || undefined }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "Failed"); }
      window.location.reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to decline"); }
    finally { setSaving(false); }
  }

  function renderQuoteCard(quote: Quote) {
    const existing      = Array.isArray(quote.response) ? quote.response[0] : quote.response;
    const isExpanded    = expanded === quote.id;
    const isActiveForm  = activeId === quote.id;
    const leadScore     = scoreLead({ budget_max: quote.budget_max, guest_count: quote.guest_count, event_date: quote.event_date });
    const canRespond    = ["pending", "responded", "viewed"].includes(quote.status);

    return (
      <div key={quote.id} className="bg-white/4 border border-white/6 rounded-xl overflow-hidden">
        {/* Card header */}
        <div
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setExpanded(isExpanded ? null : quote.id)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {quote.customer?.full_name?.[0] ?? "?"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-medium text-sm">{quote.customer?.full_name ?? "Customer"}</p>
                <LeadScorePill score={leadScore} />
              </div>
              <p className="text-white/50 text-xs truncate">
                {quote.event?.title ?? (quote.event_type ? quote.event_type.replace("_", " ") : "Event")}
                {" · "}{formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                {quote.budget_max != null && ` · up to £${quote.budget_max.toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {canRespond && <ExpiryBadge expiresAt={quote.expires_at ?? null} />}
            <span className={`px-2 py-0.5 rounded-full text-xs border whitespace-nowrap ${STATUS_COLORS[quote.status] ?? "bg-white/10 text-white/40"}`}>
              {STATUS_LABEL[quote.status] ?? quote.status}
            </span>
            {isExpanded ? <ChevronUp size={15} className="text-white/40" /> : <ChevronDown size={15} className="text-white/40" />}
          </div>
        </div>

        {/* Expanded detail */}
        {isExpanded && (
          <div className="border-t border-white/8 p-4 space-y-4">

            {/* Event details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {(quote.event?.date || quote.event_date) && (
                <InfoBlock icon={Calendar} label="Event Date" value={new Date(quote.event?.date ?? quote.event_date!).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
              )}
              {(quote.event?.city || quote.city) && (
                <InfoBlock icon={MapPin} label="Location" value={quote.event?.city ?? quote.city!} />
              )}
              {(quote.event?.guest_count || quote.guest_count) && (
                <InfoBlock icon={Users} label="Guests" value={String(quote.event?.guest_count ?? quote.guest_count)} />
              )}
              {(quote.budget_min != null || quote.budget_max != null) && (
                <InfoBlock icon={PoundSterling} label="Budget" value={`£${quote.budget_min ?? 0}–${quote.budget_max != null ? `£${quote.budget_max.toLocaleString()}` : "open"}`} />
              )}
            </div>

            {/* Customer's message and requirements */}
            {quote.message && (
              <div>
                <p className="text-white/40 text-xs mb-1">Customer message</p>
                <p className="text-white/80 text-sm leading-relaxed">{quote.message}</p>
              </div>
            )}
            {quote.requirements && (
              <div>
                <p className="text-white/40 text-xs mb-1">Specific requirements</p>
                <p className="text-white/80 text-sm leading-relaxed">{quote.requirements}</p>
              </div>
            )}
            {quote.notes && (
              <div>
                <p className="text-white/40 text-xs mb-1">Additional notes</p>
                <p className="text-white/80 text-sm leading-relaxed">{quote.notes}</p>
              </div>
            )}

            {/* Existing quote response summary */}
            {existing && (
              <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">Your Quote</p>
                  {canRespond && (
                    <button
                      onClick={() => openRespond(quote)}
                      className="flex items-center gap-1 text-xs text-blue-300 hover:text-white transition-colors"
                    >
                      <Edit3 size={11} /> Edit
                    </button>
                  )}
                </div>
                {(existing as QuoteResponse).title && (
                  <p className="text-white font-semibold mb-1">{(existing as QuoteResponse).title}</p>
                )}
                <p className="text-2xl font-bold text-white">
                  £{(existing as QuoteResponse).price.toLocaleString()}
                </p>
                {(existing as QuoteResponse).deposit_amount != null && (
                  <p className="text-white/50 text-xs mt-0.5">
                    Deposit: £{(existing as QuoteResponse).deposit_amount!.toLocaleString()}
                  </p>
                )}
                {(existing as QuoteResponse).message && (
                  <p className="text-white/70 text-sm mt-2 leading-relaxed">{(existing as QuoteResponse).message}</p>
                )}
                {(existing as QuoteResponse).services && (existing as QuoteResponse).services!.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {(existing as QuoteResponse).services!.map((s) => (
                      <li key={s} className="text-white/60 text-xs flex items-center gap-1.5">
                        <span className="text-green-400">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                )}
                {(existing as QuoteResponse).valid_until && (
                  <p className="text-white/30 text-xs mt-2">
                    Valid until {new Date((existing as QuoteResponse).valid_until!).toLocaleDateString("en-GB")}
                  </p>
                )}
              </div>
            )}

            {/* Decline reason (if declined) */}
            {quote.status === "declined" && quote.vendor_decline_reason && (
              <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-300 text-xs font-medium mb-1">Decline reason</p>
                <p className="text-white/60 text-sm">{quote.vendor_decline_reason}</p>
              </div>
            )}

            {/* Action buttons */}
            {canRespond && !isActiveForm && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => openRespond(quote)}
                  className="btn-primary flex items-center gap-2 text-sm py-2"
                >
                  <Send size={14} />
                  {existing ? "Update Quote" : "Submit Quote"}
                </button>
                {!existing && (
                  <button
                    onClick={() => openDecline(quote)}
                    className="btn-secondary flex items-center gap-2 text-sm py-2 text-red-300 border-red-500/20 hover:bg-red-500/10"
                  >
                    <X size={14} /> Not Available
                  </button>
                )}
              </div>
            )}

            {/* Quote form — respond */}
            {isActiveForm && formMode === "respond" && (
              <QuoteForm
                form={form}
                setForm={setForm}
                saving={saving}
                error={error}
                onSubmit={() => submitQuote(quote.id)}
                onCancel={closeForm}
                isEdit={!!existing}
              />
            )}

            {/* Decline form */}
            {isActiveForm && formMode === "decline" && (
              <div className="border border-red-500/25 bg-red-500/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-red-400" />
                  <h4 className="text-white font-medium text-sm">Not Available for This Request</h4>
                </div>
                <p className="text-white/50 text-xs">
                  The customer will be notified that you cannot quote for this request.
                </p>
                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Reason (optional but helpful)</label>
                  <textarea
                    className="input-field resize-none text-sm"
                    rows={3}
                    value={form.decline_reason}
                    onChange={(e) => setForm({ ...form, decline_reason: e.target.value })}
                    placeholder="e.g. Fully booked on that date, or this event is outside my service area."
                    maxLength={500}
                  />
                </div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => submitDecline(quote.id)}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-40"
                  >
                    {saving ? "Declining…" : "Confirm Decline"}
                  </button>
                  <button onClick={closeForm} className="btn-secondary text-sm py-2">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-14 bg-white/3 border border-white/6 rounded-xl">
          <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <h3 className="text-white/70 text-lg font-semibold mb-1">No enquiries yet</h3>
          <p className="text-white/40 text-sm max-w-xs mx-auto">
            When customers request a quote, it appears here. Respond quickly — vendors who reply within 2 hours win more bookings.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: Camera,      title: "Upload 5+ photos",         desc: "Profiles with more photos receive 3x more enquiries",  href: "/vendor/media" },
            { icon: ShieldCheck, title: "Complete verification",     desc: "Verified vendors appear higher in search results",      href: "/vendor/verification" },
            { icon: Calendar,    title: "Set your availability",     desc: "Customers check dates before enquiring — be bookable", href: "/vendor/availability" },
          ].map(({ icon: Icon, title, desc, href }) => (
            <a key={title} href={href} className="p-4 bg-white/3 border border-white/6 rounded-xl hover:bg-white/5 transition-colors block group">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center mb-3">
                <Icon size={16} className="text-brand-400 group-hover:text-brand-300 transition-colors" />
              </div>
              <div className="text-sm font-semibold text-white mb-1">{title}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{desc}</div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6 flex-wrap text-sm">
        <Stat icon={Clock}       label="Needs Response" count={actionable.length}  color="text-yellow-400" />
        <Stat icon={MessageSquare} label="Shortlisted"   count={shortlisted.length} color="text-slate-400" />
        <Stat icon={CheckCircle} label="Won"             count={historical.filter(q => ["converted","accepted"].includes(q.status)).length} color="text-green-400" />
        <Stat icon={XCircle}     label="Lost"            count={historical.filter(q => !["converted","accepted"].includes(q.status)).length} color="text-white/30" />
      </div>

      {actionable.length > 0 && (
        <Section title="Needs Your Response" count={actionable.length}>
          {actionable.map(renderQuoteCard)}
        </Section>
      )}
      {shortlisted.length > 0 && (
        <Section title="Shortlisted by Customer" count={shortlisted.length}>
          {shortlisted.map(renderQuoteCard)}
        </Section>
      )}
      {historical.length > 0 && (
        <Section title="History" count={historical.length}>
          {historical.map(renderQuoteCard)}
        </Section>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">{title} ({count})</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoBlock({ icon: Icon, label, value }: { icon: React.ComponentType<{size?: number; className?: string}>; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-white/40 mb-0.5">
        <Icon size={11} /><span className="text-xs">{label}</span>
      </div>
      <p className="text-white text-sm font-medium">{value}</p>
    </div>
  );
}

function Stat({ icon: Icon, label, count, color }: { icon: React.ComponentType<{size?: number; className?: string}>; label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={14} className={color} />
      <span className="text-white font-semibold">{count}</span>
      <span className="text-white/40">{label}</span>
    </div>
  );
}

function LeadScorePill({ score }: { score: number }) {
  if (score < 30) return null;
  const isHot = score >= 70;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
      isHot ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
             : "bg-yellow-500/15 text-yellow-300 border border-yellow-500/25"
    }`}>
      {isHot ? <Flame size={10} /> : <TrendingUp size={10} />}
      {isHot ? "Hot" : "Good"}
    </span>
  );
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return null;
  const now = new Date();
  const hours = Math.max(0, (new Date(expiresAt).getTime() - now.getTime()) / 3_600_000);
  if (hours > 48) return null;
  const urgent = hours <= 24;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${
      urgent ? "bg-red-500/20 text-red-300 border border-red-500/30"
              : "bg-amber-500/15 text-amber-300 border border-amber-500/25"
    }`}>
      <Clock size={10} />
      {urgent ? `${Math.round(hours)}h left` : `${Math.round(hours / 24)}d left`}
    </span>
  );
}

function QuoteForm({
  form, setForm, saving, error, onSubmit, onCancel, isEdit,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  saving: boolean;
  error: string;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit: boolean;
}) {
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="border border-brand-500/30 bg-brand-500/5 rounded-xl p-5 space-y-4">
      <h4 className="text-white font-semibold text-sm">{isEdit ? "Update Your Quote" : "Submit Your Quote"}</h4>

      <div>
        <label className="label-xs">Quote Title (optional)</label>
        <input className="input-field text-sm" value={form.title} onChange={set("title")}
          placeholder="e.g. Full Day Wedding Photography Package" maxLength={150} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label-xs">Your Price (£) *</label>
          <input className="input-field text-sm" type="number" min="1" value={form.price} onChange={set("price")}
            placeholder="e.g. 1200" />
        </div>
        <div>
          <label className="label-xs">Deposit Required (£) <span className="text-white/30">— leave blank for 30%</span></label>
          <input className="input-field text-sm" type="number" min="0" value={form.deposit_amount} onChange={set("deposit_amount")}
            placeholder={form.price ? `Auto: £${Math.round(Number(form.price) * 0.3)}` : "e.g. 360"} />
        </div>
      </div>

      <div>
        <label className="label-xs">Description</label>
        <textarea className="input-field text-sm resize-none" rows={3} value={form.description} onChange={set("description")}
          placeholder="Describe your service in detail — what you bring, how the day works, what makes you different." />
      </div>

      <div>
        <label className="label-xs">What&apos;s Included <span className="text-white/30">— one item per line</span></label>
        <textarea className="input-field text-sm resize-none font-mono" rows={4} value={form.services} onChange={set("services")}
          placeholder={`e.g.\n8 hours of coverage\n500+ edited photos\nOnline gallery\nPrinting rights`} />
      </div>

      <div>
        <label className="label-xs">Message to Customer</label>
        <textarea className="input-field text-sm resize-none" rows={3} value={form.message} onChange={set("message")}
          placeholder="Any personal note, questions, or things to discuss before booking." />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label-xs">Estimated Duration (hours)</label>
          <input className="input-field text-sm" type="number" min="0.5" step="0.5" value={form.duration_hours} onChange={set("duration_hours")}
            placeholder="e.g. 8" />
        </div>
        <div>
          <label className="label-xs">Quote Valid Until</label>
          <input className="input-field text-sm" type="date" value={form.valid_until} onChange={set("valid_until")}
            min={new Date().toISOString().split("T")[0]} />
        </div>
      </div>

      <div>
        <label className="label-xs">Payment & Cancellation Terms <span className="text-white/30">(optional)</span></label>
        <textarea className="input-field text-sm resize-none" rows={2} value={form.terms} onChange={set("terms")}
          placeholder="e.g. 30% deposit to secure date. Balance due 14 days before event. Deposit non-refundable within 60 days." />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertTriangle size={14} />{error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onSubmit} disabled={saving}
          className="btn-primary flex items-center gap-2 text-sm py-2.5 disabled:opacity-40">
          <Send size={14} />
          {saving ? "Sending…" : isEdit ? "Update Quote" : "Send Quote"}
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm py-2.5">Cancel</button>
      </div>
    </div>
  );
}
