"use client";

import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Users, Plus, Upload, Search, Filter, Star, Globe, AtSign,
  Mail, Phone, MapPin, Tag, ChevronDown, ChevronUp, Copy, Check,
  Send, RefreshCw, X, ExternalLink, BarChart3, Target, Clock,
  TrendingUp, CheckCircle2, AlertCircle, Edit3, Trash2, MessageSquare,
  Share2, Download,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type LeadStatus =
  | "new" | "researched" | "approved_for_outreach"
  | "outreach_sent" | "follow_up_due" | "responded"
  | "interested" | "registered" | "verified" | "approved" | "active"
  | "rejected" | "not_suitable";

type Priority = "high" | "medium" | "low";

interface VendorLead {
  id: string;
  business_name: string;
  category: string;
  location: string | null;
  city: string | null;
  region: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  email: string | null;
  phone: string | null;
  google_maps_url: string | null;
  source: string | null;
  rating: number | null;
  review_count: number | null;
  follower_count: number | null;
  priority: Priority;
  lead_score: number;
  status: LeadStatus;
  notes: string | null;
  objections: string | null;
  interest_level: string | null;
  contact_outcome: string | null;
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

const CATEGORIES = [
  { value: "dj",               label: "DJ" },
  { value: "decorator",        label: "Decorator" },
  { value: "photographer",     label: "Photographer" },
  { value: "videographer",     label: "Videographer" },
  { value: "caterer",          label: "Caterer" },
  { value: "event_planner",    label: "Event Planner" },
  { value: "cake_maker",       label: "Cake Maker" },
  { value: "balloon_decorator",label: "Balloon Decorator" },
  { value: "venue_hire",       label: "Venue Hire" },
  { value: "live_band",        label: "Live Band" },
  { value: "mc",               label: "MC / Host" },
];

const REGIONS = ["London", "Kent", "Essex"];

const STATUS_LABELS: Record<LeadStatus, string> = {
  new:                  "New",
  researched:           "Researched",
  approved_for_outreach:"Approved for Outreach",
  outreach_sent:        "Contacted",
  follow_up_due:        "Follow-up Due",
  responded:            "Responded",
  interested:           "Interested",
  registered:           "Registered",
  verified:             "Verified",
  approved:             "Approved",
  active:               "Active",
  rejected:             "Rejected",
  not_suitable:         "Not Suitable",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  new:                  "bg-gray-100 text-gray-600",
  researched:           "bg-blue-50 text-blue-700",
  approved_for_outreach:"bg-yellow-50 text-yellow-700",
  outreach_sent:        "bg-purple-50 text-purple-700",
  follow_up_due:        "bg-orange-50 text-orange-700",
  responded:            "bg-cyan-50 text-cyan-700",
  interested:           "bg-green-50 text-green-700",
  registered:           "bg-emerald-50 text-emerald-700",
  verified:             "bg-indigo-50 text-indigo-700",
  approved:             "bg-blue-100 text-blue-800",
  active:               "bg-emerald-100 text-emerald-800",
  rejected:             "bg-red-50 text-red-600",
  not_suitable:         "bg-gray-100 text-gray-400",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  high:   "text-green-700 bg-green-50 border-green-200",
  medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  low:    "text-gray-500 bg-gray-50 border-gray-200",
};

const EMPTY_FORM = {
  business_name: "", category: "dj", location: "", city: "",
  region: "", website: "", instagram: "", facebook: "",
  email: "", phone: "", google_maps_url: "", source: "",
  rating: "", review_count: "", follower_count: "", notes: "",
};

// ── Copy Button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
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

// ── Score Bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "#16a34a" : score >= 45 ? "#d97706" : "#9ca3af";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function VendorAcquisitionPage() {
  const [leads, setLeads] = useState<VendorLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedLead, setSelectedLead] = useState<VendorLead | null>(null);
  const [outreach, setOutreach] = useState<OutreachMessages | null>(null);
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [activeOutreachTab, setActiveOutreachTab] = useState<keyof OutreachMessages>("first_contact_email");
  const [editingLead, setEditingLead] = useState<VendorLead | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Data fetching ────────────────────────────────────────────────────────────

  async function fetchLeads() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus)   params.set("status",   filterStatus);
    if (filterCategory) params.set("category", filterCategory);
    if (filterRegion)   params.set("region",   filterRegion);
    if (filterPriority) params.set("priority", filterPriority);
    if (search)         params.set("search",   search);
    const res = await fetch(`/api/admin/vendor-leads?${params}`);
    const json = await res.json();
    setLeads(json.leads ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchLeads(); }, [filterStatus, filterCategory, filterRegion, filterPriority]);

  // ── Add lead ─────────────────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/vendor-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        rating:       form.rating       ? parseFloat(form.rating)       : null,
        review_count: form.review_count ? parseInt(form.review_count)   : null,
        follower_count: form.follower_count ? parseInt(form.follower_count) : null,
      }),
    });
    setForm(EMPTY_FORM);
    setShowAddForm(false);
    setSaving(false);
    await fetchLeads();
  }

  // ── Edit lead ─────────────────────────────────────────────────────────────────

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLead) return;
    setSaving(true);
    const patch = { ...editingLead };
    await fetch(`/api/admin/vendor-leads/${editingLead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setEditingLead(null);
    setSaving(false);
    await fetchLeads();
  }

  // ── Status quick-update ───────────────────────────────────────────────────────

  async function updateStatus(id: string, status: LeadStatus, extra?: object) {
    await fetch(`/api/admin/vendor-leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    });
    await fetchLeads();
    if (selectedLead?.id === id) {
      setSelectedLead((prev) => prev ? { ...prev, status, ...extra } : prev);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (!confirm("Remove this lead? This cannot be undone.")) return;
    await fetch(`/api/admin/vendor-leads/${id}`, { method: "DELETE" });
    setSelectedLead(null);
    await fetchLeads();
  }

  // ── Outreach generation ───────────────────────────────────────────────────────

  async function generateOutreach(lead: VendorLead) {
    setGeneratingOutreach(true);
    setOutreach(null);
    const res = await fetch("/api/admin/vendor-leads/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    const json = await res.json();
    setOutreach(json.messages ?? null);
    setActiveOutreachTab("first_contact_email");
    setGeneratingOutreach(false);
  }

  // ── CSV import ────────────────────────────────────────────────────────────────

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/vendor-leads/import", { method: "POST", body: fd });
    const json = await res.json();
    if (json.error) {
      setImportResult(`Error: ${json.error}`);
    } else {
      setImportResult(`Imported ${json.inserted} leads. Skipped ${json.skipped} duplicates.`);
      await fetchLeads();
    }
    e.target.value = "";
  }

  // ── CSV template download ─────────────────────────────────────────────────────

  function downloadTemplate() {
    const headers = "business_name,category,location,city,region,instagram,facebook,website,email,phone,source,notes,rating,review_count";
    const example = "The Essex DJ,dj,Chelmsford,Chelmsford,Essex,@theessexdj,,theessexdj.co.uk,hello@theessexdj.co.uk,07700900123,Google Maps,Great reviews,4.8,45";
    const blob = new Blob([`${headers}\n${example}\n`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "elbold_leads_import.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Computed stats ────────────────────────────────────────────────────────────

  const today = new Date().toISOString().split("T")[0];
  const stats = {
    total:       leads.length,
    new_today:   leads.filter((l) => l.created_at.startsWith(today)).length,
    high:        leads.filter((l) => l.priority === "high").length,
    outreach_sent: leads.filter((l) => l.status === "outreach_sent").length,
    follow_up_due: leads.filter((l) => l.status === "follow_up_due").length,
    interested:  leads.filter((l) => l.status === "interested").length,
    registered:  leads.filter((l) => l.status === "registered").length,
    approved:    leads.filter((l) => l.status === "approved_for_outreach").length,
    conversion:  leads.length > 0 ? Math.round((leads.filter((l) => ["interested","registered"].includes(l.status)).length / leads.length) * 100) : 0,
  };

  const filteredLeads = leads.filter((l) =>
    !search || l.business_name.toLowerCase().includes(search.toLowerCase())
  );

  const OUTREACH_TABS: { key: keyof OutreachMessages; label: string }[] = [
    { key: "first_contact_email", label: "First Email" },
    { key: "instagram_dm",        label: "Instagram DM" },
    { key: "facebook_message",    label: "Facebook" },
    { key: "follow_up_email",     label: "Follow-up" },
    { key: "phone_script",        label: "Phone Script" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-screen-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light text-gray-900 tracking-tight">Vendor Acquisition</h1>
            <p className="text-sm text-gray-400 mt-1">Find, score and contact real event vendors across London, Kent and Essex.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download size={14} /> CSV Template
            </button>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
              <Upload size={14} /> Import CSV
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#0B1F4D" }}
            >
              <Plus size={14} /> Add Lead
            </button>
          </div>
        </div>

        {importResult && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-between">
            {importResult}
            <button onClick={() => setImportResult(null)}><X size={14} /></button>
          </div>
        )}

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3 mb-8">
          {[
            { label: "Total Leads",    value: stats.total,         color: "#0B1F4D", icon: Users },
            { label: "New Today",      value: stats.new_today,     color: "#6366f1", icon: Plus },
            { label: "High Priority",  value: stats.high,          color: "#16a34a", icon: Star },
            { label: "For Outreach",   value: stats.approved,      color: "#d97706", icon: Target },
            { label: "Outreach Sent",  value: stats.outreach_sent, color: "#7c3aed", icon: Send },
            { label: "Follow-ups Due", value: stats.follow_up_due, color: "#ea580c", icon: Clock },
            { label: "Interested",     value: stats.interested,    color: "#059669", icon: TrendingUp },
            { label: "Registered",     value: stats.registered,    color: "#0891b2", icon: CheckCircle2 },
            { label: "Conversion %",   value: `${stats.conversion}%`, color: "#0B1F4D", icon: BarChart3 },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
              <Icon size={16} className="mx-auto mb-1" style={{ color }} />
              <div className="text-2xl font-light tabular-nums" style={{ color }}>{value}</div>
              <div className="text-xs text-gray-400 mt-0.5 leading-tight">{label}</div>
            </div>
          ))}
        </div>

        {/* Daily Targets */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Daily Targets</h3>
            {[
              { label: "New leads added",    target: 10, actual: stats.new_today },
              { label: "Outreach messages",  target: 5,  actual: stats.outreach_sent },
              { label: "Follow-ups actioned",target: 2,  actual: stats.follow_up_due },
            ].map(({ label, target, actual }) => {
              const pct = Math.min(100, Math.round((actual / target) * 100));
              return (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-gray-900">{actual} / {target}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Weekly Targets</h3>
            {[
              { label: "New leads",         target: 50, actual: stats.total },
              { label: "Outreach messages", target: 25, actual: stats.outreach_sent },
              { label: "Interested vendors",target: 5,  actual: stats.interested },
              { label: "Approved vendors",  target: 2,  actual: stats.registered },
            ].map(({ label, target, actual }) => {
              const pct = Math.min(100, Math.round((actual / target) * 100));
              return (
                <div key={label} className="mb-2.5">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-gray-900">{actual} / {target}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchLeads()}
              placeholder="Search business name..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          {[
            { label: "Status",   value: filterStatus,   setter: setFilterStatus,   opts: Object.entries(STATUS_LABELS) },
            { label: "Category", value: filterCategory, setter: setFilterCategory, opts: CATEGORIES.map((c) => [c.value, c.label]) },
            { label: "Region",   value: filterRegion,   setter: setFilterRegion,   opts: REGIONS.map((r) => [r, r]) },
            { label: "Priority", value: filterPriority, setter: setFilterPriority, opts: [["high","High"],["medium","Medium"],["low","Low"]] },
          ].map(({ label, value, setter, opts }) => (
            <select
              key={label}
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
            >
              <option value="">All {label}s</option>
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <button
            onClick={fetchLeads}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
          >
            <Filter size={13} /> Apply
          </button>
        </div>

        {/* Main table + detail panel */}
        <div className="flex gap-4">
          {/* Table */}
          <div className="flex-1 bg-white border border-gray-100 rounded-xl overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-sm text-gray-400">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="py-16 text-center">
                <Users size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">No leads yet. Add your first lead or import a CSV.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                      <th className="text-left px-4 py-3">Business</th>
                      <th className="text-left px-4 py-3">Category</th>
                      <th className="text-left px-4 py-3">Region</th>
                      <th className="text-left px-4 py-3">Score</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Contact</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => { setSelectedLead(lead); setOutreach(null); }}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${selectedLead?.id === lead.id ? "bg-blue-50/40" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 leading-tight">{lead.business_name}</div>
                          {lead.city && <div className="text-xs text-gray-400">{lead.city}</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {CATEGORIES.find((c) => c.value === lead.category)?.label ?? lead.category}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{lead.region ?? "—"}</td>
                        <td className="px-4 py-3 min-w-[100px]">
                          <ScoreBar score={lead.lead_score} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
                            {STATUS_LABELS[lead.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {lead.email    && <Mail     size={13} className="text-gray-400" />}
                            {lead.phone    && <Phone    size={13} className="text-gray-400" />}
                            {lead.website  && <Globe    size={13} className="text-gray-400" />}
                            {lead.instagram && <AtSign size={13} className="text-gray-400" />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[lead.priority]}`}>
                            {lead.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedLead && (
            <div className="w-[400px] flex-shrink-0 bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col" style={{ maxHeight: "80vh" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">{selectedLead.business_name}</h3>
                <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-5">
                {/* Score */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead Score</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[selectedLead.priority]}`}>
                      {selectedLead.priority}
                    </span>
                  </div>
                  <ScoreBar score={selectedLead.lead_score} />
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  {[
                    { icon: Tag,     label: CATEGORIES.find((c) => c.value === selectedLead.category)?.label ?? selectedLead.category },
                    { icon: MapPin,  label: [selectedLead.city, selectedLead.region].filter(Boolean).join(", ") },
                    { icon: Star,    label: selectedLead.rating ? `${selectedLead.rating} stars (${selectedLead.review_count ?? 0} reviews)` : null },
                    { icon: Mail,    label: selectedLead.email,   href: selectedLead.email ? `mailto:${selectedLead.email}` : undefined },
                    { icon: Phone,   label: selectedLead.phone,   href: selectedLead.phone ? `tel:${selectedLead.phone}` : undefined },
                    { icon: Globe,   label: selectedLead.website, href: selectedLead.website ? (selectedLead.website.startsWith("http") ? selectedLead.website : `https://${selectedLead.website}`) : undefined },
                    { icon: AtSign,  label: selectedLead.instagram, href: selectedLead.instagram ? `https://instagram.com/${selectedLead.instagram.replace("@","")}` : undefined },
                    { icon: Share2, label: selectedLead.facebook,  href: selectedLead.facebook ?? undefined },
                    { icon: MapPin,    label: selectedLead.google_maps_url ? "Google Maps" : null, href: selectedLead.google_maps_url ?? undefined },
                  ].filter((r) => r.label).map(({ icon: Icon, label, href }) => (
                    <div key={label} className="flex items-center gap-2 text-gray-600">
                      <Icon size={14} className="flex-shrink-0 text-gray-400" />
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex-1">
                          {label}
                        </a>
                      ) : (
                        <span className="truncate flex-1">{label}</span>
                      )}
                    </div>
                  ))}
                  {selectedLead.source && (
                    <div className="text-xs text-gray-400">Source: {selectedLead.source}</div>
                  )}
                  {selectedLead.notes && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mt-2">{selectedLead.notes}</div>
                  )}
                  {selectedLead.contact_outcome && (
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold text-gray-400">Outcome: </span>{selectedLead.contact_outcome}
                    </div>
                  )}
                  {selectedLead.interest_level && (
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold text-gray-400">Interest: </span>
                      <span className={
                        selectedLead.interest_level === "high" ? "text-green-600 font-semibold" :
                        selectedLead.interest_level === "medium" ? "text-amber-600 font-semibold" :
                        "text-gray-400"
                      }>{selectedLead.interest_level}</span>
                    </div>
                  )}
                  {selectedLead.objections && (
                    <div className="text-xs text-orange-600 bg-orange-50 rounded-lg p-3 mt-2">
                      <span className="font-semibold">Objections: </span>{selectedLead.objections}
                    </div>
                  )}
                </div>

                {/* Status Actions */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(["approved_for_outreach","outreach_sent","follow_up_due","responded","interested","registered","verified","approved","active","rejected","not_suitable"] as LeadStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(selectedLead.id, s, s === "outreach_sent" ? { last_contacted_at: new Date().toISOString() } : {})}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${selectedLead.status === s ? STATUS_COLORS[s] + " border-current" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Outreach generator */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outreach Messages</div>
                    <button
                      onClick={() => generateOutreach(selectedLead)}
                      disabled={generatingOutreach}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-colors"
                      style={{ background: "#0B1F4D" }}
                    >
                      {generatingOutreach ? <RefreshCw size={11} className="animate-spin" /> : <MessageSquare size={11} />}
                      {generatingOutreach ? "Generating..." : "Generate"}
                    </button>
                  </div>

                  {outreach && (
                    <div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {OUTREACH_TABS.map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setActiveOutreachTab(key)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${activeOutreachTab === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <pre className="whitespace-pre-wrap text-xs text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed max-h-64 overflow-y-auto font-sans">
                          {outreach[activeOutreachTab]}
                        </pre>
                        <div className="absolute top-2 right-2">
                          <CopyButton text={outreach[activeOutreachTab]} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Review and personalise before sending. Do not auto-send.</p>
                    </div>
                  )}
                </div>

                {/* Follow-up date */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Next Follow-up</label>
                  <input
                    type="date"
                    defaultValue={selectedLead.next_follow_up_at?.split("T")[0] ?? ""}
                    onChange={async (e) => {
                      await fetch(`/api/admin/vendor-leads/${selectedLead.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ next_follow_up_at: e.target.value || null }),
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 px-5 py-3 flex gap-2">
                <button
                  onClick={() => setEditingLead({ ...selectedLead })}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Edit3 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(selectedLead.id)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Lead Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Add Vendor Lead</h2>
              <button onClick={() => setShowAddForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Business Name *</label>
                  <input required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Category *</label>
                  <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Region</label>
                  <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
                    <option value="">Select region</option>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {[
                  { key: "city",      label: "City",      type: "text" },
                  { key: "email",     label: "Email",     type: "email" },
                  { key: "phone",     label: "Phone",     type: "tel" },
                  { key: "website",   label: "Website",   type: "text" },
                  { key: "instagram", label: "Instagram", type: "text" },
                  { key: "facebook",  label: "Facebook",  type: "text" },
                  { key: "rating",    label: "Google Rating", type: "number" },
                  { key: "review_count", label: "Review Count", type: "number" },
                  { key: "google_maps_url", label: "Google Maps URL", type: "text" },
                  { key: "source",    label: "Source",    type: "text" },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                    <input
                      type={type}
                      step={type === "number" ? "0.1" : undefined}
                      value={(form as Record<string,string>)[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Notes</label>
                  <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-50"
                  style={{ background: "#0B1F4D" }}>
                  {saving ? "Saving..." : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Edit Lead</h2>
              <button onClick={() => setEditingLead(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "business_name", label: "Business Name", type: "text", col2: true },
                  { key: "email",     label: "Email",          type: "email" },
                  { key: "phone",     label: "Phone",          type: "tel" },
                  { key: "website",   label: "Website",        type: "text" },
                  { key: "instagram", label: "Instagram",      type: "text" },
                  { key: "facebook",  label: "Facebook",       type: "text" },
                  { key: "rating",    label: "Google Rating",  type: "number" },
                  { key: "review_count", label: "Review Count", type: "number" },
                  { key: "google_maps_url", label: "Google Maps URL", type: "text" },
                  { key: "source",    label: "Source",         type: "text" },
                ].map(({ key, label, type, col2 }) => (
                  <div key={key} className={col2 ? "col-span-2" : ""}>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                    <input
                      type={type}
                      step={type === "number" ? "0.1" : undefined}
                      value={(editingLead as unknown as Record<string, string>)[key] ?? ""}
                      onChange={(e) => setEditingLead({ ...editingLead, [key]: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Notes</label>
                  <textarea rows={3} value={editingLead.notes ?? ""}
                    onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Interest Level</label>
                  <select value={editingLead.interest_level ?? ""} onChange={(e) => setEditingLead({ ...editingLead, interest_level: e.target.value || null })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="">Unknown</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Contact Outcome</label>
                  <input type="text" value={editingLead.contact_outcome ?? ""}
                    onChange={(e) => setEditingLead({ ...editingLead, contact_outcome: e.target.value || null })}
                    placeholder="e.g. Left voicemail, emailed back"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Objections</label>
                  <input type="text" value={editingLead.objections ?? ""}
                    onChange={(e) => setEditingLead({ ...editingLead, objections: e.target.value || null })}
                    placeholder="e.g. Wants proof of demand, concerned about fees"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingLead(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-50"
                  style={{ background: "#0B1F4D" }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
