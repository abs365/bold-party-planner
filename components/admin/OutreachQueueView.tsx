"use client";

import { useEffect, useState } from "react";
import {
  Send, Clock, MessageSquare, RefreshCw, Mail,
  AtSign, Share2, Phone, ChevronDown, ChevronUp, Calendar,
  CheckCircle2, AlertCircle, Star, MapPin, Tag, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { LeadCopyButton } from "@/components/admin/LeadCopyButton";

// ── Types ──────────────────────────────────────────────────────────────────────

type QueueStatus = "approved_for_outreach" | "outreach_sent" | "follow_up_due" | "responded";

interface VendorLead {
  id: string;
  business_name: string;
  category: string;
  city: string | null;
  region: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  lead_score: number;
  priority: "high" | "medium" | "low";
  status: string;
  notes: string | null;
  interest_level: string | null;
  contact_outcome: string | null;
  objections: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  created_at: string;
}

interface OutreachMessages {
  first_contact_email: string;
  instagram_dm: string;
  facebook_message: string;
  follow_up_email: string;
  phone_script: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const QUEUE_STATUSES: QueueStatus[] = ["approved_for_outreach", "outreach_sent", "follow_up_due", "responded"];

const STATUS_CONFIG: Record<QueueStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  approved_for_outreach: { label: "Ready to Contact",  color: "#d97706", bg: "#fffbeb", icon: CheckCircle2 },
  outreach_sent:         { label: "Outreach Sent",     color: "#7c3aed", bg: "#f5f3ff", icon: Send },
  follow_up_due:         { label: "Follow-up Due",     color: "#ea580c", bg: "#fff7ed", icon: Clock },
  responded:             { label: "Responded",         color: "#0891b2", bg: "#ecfeff", icon: MessageSquare },
};

const OUTREACH_TABS = [
  { key: "first_contact_email" as const, label: "First Email",     icon: Mail },
  { key: "instagram_dm"        as const, label: "Instagram DM",    icon: AtSign },
  { key: "facebook_message"    as const, label: "Facebook",        icon: Share2 },
  { key: "follow_up_email"     as const, label: "Follow-up Email", icon: Mail },
  { key: "phone_script"        as const, label: "Phone Script",    icon: Phone },
];

const CATEGORY_LABELS: Record<string, string> = {
  dj: "DJ", decorator: "Decorator", photographer: "Photographer",
  videographer: "Videographer", caterer: "Caterer", event_planner: "Event Planner",
  cake_maker: "Cake Maker", balloon_decorator: "Balloon Decorator",
  venue_hire: "Venue", live_band: "Live Band", mc: "MC / Host",
};

// ── Queue Card ────────────────────────────────────────────────────────────────

function QueueCard({ lead, onUpdate }: { lead: VendorLead; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [outreach, setOutreach] = useState<OutreachMessages | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<keyof OutreachMessages>("first_contact_email");
  const [saving, setSaving] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(lead.next_follow_up_at?.split("T")[0] ?? "");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [contactOutcome, setContactOutcome] = useState(lead.contact_outcome ?? "");
  const [interestLevel, setInterestLevel] = useState(lead.interest_level ?? "");

  const queueStatus = lead.status as QueueStatus;
  const config = STATUS_CONFIG[queueStatus];
  if (!config) return null;

  const Icon = config.icon;

  async function generateOutreach() {
    setGenerating(true);
    const res = await fetch("/api/admin/vendor-leads/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    const json = await res.json();
    setOutreach(json.messages ?? null);
    setActiveTab("first_contact_email");
    setGenerating(false);
  }

  async function markSent() {
    setSaving(true);
    await fetch(`/api/admin/vendor-leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "outreach_sent", last_contacted_at: new Date().toISOString() }),
    });
    setSaving(false);
    onUpdate();
  }

  async function markFollowUp() {
    setSaving(true);
    await fetch(`/api/admin/vendor-leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "follow_up_due" }),
    });
    setSaving(false);
    onUpdate();
  }

  async function markResponded() {
    setSaving(true);
    await fetch(`/api/admin/vendor-leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "responded", interest_level: interestLevel || null }),
    });
    setSaving(false);
    onUpdate();
  }

  async function saveDetails() {
    setSaving(true);
    await fetch(`/api/admin/vendor-leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: notes || null,
        contact_outcome: contactOutcome || null,
        interest_level: interestLevel || null,
        next_follow_up_at: followUpDate || null,
      }),
    });
    setSaving(false);
    onUpdate();
  }

  const daysSinceContact = lead.last_contacted_at
    ? Math.floor((Date.now() - new Date(lead.last_contacted_at).getTime()) / 86400000)
    : null;

  const followUpOverdue = lead.next_follow_up_at
    ? new Date(lead.next_follow_up_at) < new Date()
    : false;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: config.bg }}>
          <Icon size={16} style={{ color: config.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm text-gray-900">{lead.business_name}</span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: config.bg, color: config.color }}
            >
              {config.label}
            </span>
            {lead.priority === "high" && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">High Priority</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Tag size={10} />{CATEGORY_LABELS[lead.category] ?? lead.category}</span>
            {(lead.city || lead.region) && (
              <span className="flex items-center gap-1"><MapPin size={10} />{[lead.city, lead.region].filter(Boolean).join(", ")}</span>
            )}
            <span className="flex items-center gap-1"><Star size={10} />{lead.lead_score}</span>
            {daysSinceContact !== null && (
              <span className={daysSinceContact > 7 ? "text-orange-500" : ""}>
                Last contact: {daysSinceContact === 0 ? "today" : `${daysSinceContact}d ago`}
              </span>
            )}
            {followUpOverdue && (
              <span className="flex items-center gap-1 text-red-500 font-medium">
                <AlertCircle size={10} /> Follow-up overdue
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="text-xs text-blue-500 hover:underline">{lead.email}</a>
          )}
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="text-xs text-gray-500 hover:underline">{lead.phone}</a>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5">

          {/* Outreach messages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Outreach Messages</h4>
              <button
                onClick={generateOutreach}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60 transition-colors"
                style={{ background: "#0B1F4D" }}
              >
                {generating ? <RefreshCw size={11} className="animate-spin" /> : <MessageSquare size={11} />}
                {generating ? "Generating..." : "Generate Messages"}
              </button>
            </div>

            {outreach ? (
              <div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {OUTREACH_TABS.map(({ key, label, icon: TabIcon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <TabIcon size={10} />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <pre className="whitespace-pre-wrap text-xs text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed font-sans border border-gray-100">
                    {outreach[activeTab]}
                  </pre>
                  <div className="absolute top-3 right-3">
                    <LeadCopyButton text={outreach[activeTab]} />
                  </div>
                </div>
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={11} /> Review and personalise before sending. Do not auto-send.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-dashed border-gray-200">
                <MessageSquare size={20} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs text-gray-400">Generate personalised outreach messages for this vendor.</p>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              {lead.status === "approved_for_outreach" && (
                <button
                  onClick={markSent}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: "#7c3aed" }}
                >
                  <Send size={11} /> Mark Outreach Sent
                </button>
              )}
              {(lead.status === "outreach_sent" || lead.status === "approved_for_outreach") && (
                <button
                  onClick={markFollowUp}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 disabled:opacity-60"
                >
                  <Clock size={11} /> Set Follow-up Due
                </button>
              )}
              {(lead.status === "outreach_sent" || lead.status === "follow_up_due") && (
                <button
                  onClick={markResponded}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 disabled:opacity-60"
                >
                  <MessageSquare size={11} /> Mark Responded
                </button>
              )}
              <Link
                href="/admin/vendor-acquisition"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Full Edit <ArrowRight size={11} />
              </Link>
            </div>
          </div>

          {/* Response tracking + details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Interest Level</label>
              <select
                value={interestLevel}
                onChange={(e) => setInterestLevel(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Unknown</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Contact Outcome</label>
              <input
                type="text"
                value={contactOutcome}
                onChange={(e) => setContactOutcome(e.target.value)}
                placeholder="e.g. Left voicemail, emailed"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                <Calendar size={10} className="inline mr-1" /> Next Follow-up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Notes / Response</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What they said, objections, next steps..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveDetails}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: "#0B1F4D" }}
            >
              {saving ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
              {saving ? "Saving..." : "Save Details"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export function OutreachQueueView() {
  const [leads, setLeads] = useState<VendorLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<QueueStatus | "all">("all");

  async function fetchLeads() {
    setLoading(true);
    // Fetch one status at a time and merge (API supports single status filter)
    const results = await Promise.all(
      QUEUE_STATUSES.map((s) =>
        fetch(`/api/admin/vendor-leads?status=${s}`)
          .then((r) => r.json())
          .then((j) => j.leads ?? [])
      )
    );
    const all: VendorLead[] = results.flat();
    // Sort: follow_up_due first, then approved_for_outreach, then outreach_sent, then responded
    const ORDER: Record<string, number> = { follow_up_due: 0, approved_for_outreach: 1, outreach_sent: 2, responded: 3 };
    all.sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9));
    setLeads(all);
    setLoading(false);
  }

  useEffect(() => { fetchLeads(); }, []);

  const counts: Record<string, number> = {};
  for (const l of leads) { counts[l.status] = (counts[l.status] ?? 0) + 1; }

  const filtered = activeFilter === "all" ? leads : leads.filter((l) => l.status === activeFilter);

  const overdueCount = leads.filter((l) =>
    l.next_follow_up_at && new Date(l.next_follow_up_at) < new Date()
  ).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Outreach Queue</h1>
          <p className="text-sm text-gray-400 mt-1">
            Review, personalise and copy messages. Mark sent when delivered. No auto-sending.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-xs font-semibold text-red-600">
              <AlertCircle size={12} /> {overdueCount} overdue
            </div>
          )}
          <button
            onClick={fetchLeads}
            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {QUEUE_STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <div key={s} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
              <Icon size={16} className="mx-auto mb-1.5" style={{ color: cfg.color }} />
              <div className="text-2xl font-light tabular-nums" style={{ color: cfg.color }}>
                {counts[s] ?? 0}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 leading-tight">{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeFilter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({leads.length})
        </button>
        {QUEUE_STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setActiveFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === s ? "text-white" : "text-gray-600 hover:opacity-80"
              }`}
              style={activeFilter === s ? { background: cfg.color } : { background: cfg.bg, color: cfg.color }}
            >
              {cfg.label} ({counts[s] ?? 0})
            </button>
          );
        })}
      </div>

      {/* Compliance reminder */}
      <div className="mb-6 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700 flex items-start gap-2">
        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
        <span>
          All outreach is reviewed and sent manually by the founder. No automatic sending.
          Use only publicly available contact details. Comply with UK GDPR and PECR.
        </span>
      </div>

      {/* Lead queue */}
      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading outreach queue...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Send size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">No leads in this queue section.</p>
          <Link href="/admin/vendor-acquisition" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
            Go to CRM to approve leads for outreach
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <QueueCard key={lead.id} lead={lead} onUpdate={fetchLeads} />
          ))}
        </div>
      )}
    </div>
  );
}
