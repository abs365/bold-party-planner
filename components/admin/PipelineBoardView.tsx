"use client";

import { useEffect, useState, useRef } from "react";
import { Star, MapPin, RefreshCw, ExternalLink, ArrowRight, Tag } from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

type PipelineStatus =
  | "new" | "researched" | "approved_for_outreach"
  | "outreach_sent" | "responded" | "interested"
  | "registered" | "verified" | "approved" | "active";

interface VendorLead {
  id: string;
  business_name: string;
  category: string;
  city: string | null;
  region: string | null;
  lead_score: number;
  priority: "high" | "medium" | "low";
  status: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  notes: string | null;
}

// ── Pipeline columns ───────────────────────────────────────────────────────────

const PIPELINE_COLUMNS: { status: PipelineStatus; label: string; color: string; bg: string }[] = [
  { status: "new",                   label: "New",                  color: "#6b7280", bg: "#f9fafb" },
  { status: "researched",            label: "Researched",           color: "#3b82f6", bg: "#eff6ff" },
  { status: "approved_for_outreach", label: "Approved for Outreach",color: "#d97706", bg: "#fffbeb" },
  { status: "outreach_sent",         label: "Contacted",            color: "#7c3aed", bg: "#f5f3ff" },
  { status: "responded",             label: "Responded",            color: "#0891b2", bg: "#ecfeff" },
  { status: "interested",            label: "Interested",           color: "#16a34a", bg: "#f0fdf4" },
  { status: "registered",            label: "Registered",           color: "#059669", bg: "#ecfdf5" },
  { status: "verified",              label: "Verified",             color: "#0B1F4D", bg: "#eef2ff" },
  { status: "approved",              label: "Approved",             color: "#0B1F4D", bg: "#dbeafe" },
  { status: "active",                label: "Active",               color: "#047857", bg: "#d1fae5" },
];

const PRIORITY_DOT: Record<string, string> = {
  high:   "bg-green-500",
  medium: "bg-yellow-400",
  low:    "bg-gray-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  dj: "DJ", decorator: "Decorator", photographer: "Photographer",
  videographer: "Videographer", caterer: "Caterer", event_planner: "Event Planner",
  cake_maker: "Cake Maker", balloon_decorator: "Balloon Decorator",
  venue_hire: "Venue", live_band: "Live Band", mc: "MC / Host",
};

// ── View ───────────────────────────────────────────────────────────────────────

export function PipelineBoardView() {
  const [leads, setLeads] = useState<VendorLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);

  async function fetchLeads() {
    setLoading(true);
    const res = await fetch("/api/admin/vendor-leads?limit=500");
    const json = await res.json();
    // Filter out off-pipeline statuses
    const offPipeline = new Set(["rejected", "not_suitable", "follow_up_due"]);
    setLeads((json.leads ?? []).filter((l: VendorLead) => !offPipeline.has(l.status)));
    setLoading(false);
  }

  useEffect(() => { fetchLeads(); }, []);

  async function moveCard(leadId: string, newStatus: PipelineStatus) {
    setUpdating(leadId);
    await fetch(`/api/admin/vendor-leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));
    setUpdating(null);
  }

  // ── DnD handlers ──────────────────────────────────────────────────────────────

  function onDragStart(e: React.DragEvent, leadId: string) {
    dragId.current = leadId;
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDrop(e: React.DragEvent, targetStatus: PipelineStatus) {
    e.preventDefault();
    const id = dragId.current;
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === targetStatus) return;
    moveCard(id, targetStatus);
    dragId.current = null;
  }

  const byStatus = (status: PipelineStatus) => leads.filter((l) => l.status === status);

  const totalInPipeline = leads.length;
  const highPriority = leads.filter((l) => l.priority === "high").length;
  const readyForOutreach = leads.filter((l) => l.status === "approved_for_outreach").length;
  const interested = leads.filter((l) => l.status === "interested").length;
  const activeCount = leads.filter((l) => l.status === "active").length;

  return (
    <div className="h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white flex-shrink-0">
        <div>
          <h1 className="text-xl font-light text-gray-900 tracking-tight">Vendor Pipeline</h1>
          <p className="text-xs text-gray-400 mt-0.5">Drag cards between columns to update status. All changes save immediately.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-xs text-gray-500">
            <span><span className="font-semibold text-gray-900">{totalInPipeline}</span> in pipeline</span>
            <span><span className="font-semibold text-green-600">{highPriority}</span> high priority</span>
            <span><span className="font-semibold text-amber-600">{readyForOutreach}</span> ready for outreach</span>
            <span><span className="font-semibold text-emerald-600">{interested}</span> interested</span>
            <span><span className="font-semibold text-blue-700">{activeCount}</span> active</span>
          </div>
          <button
            onClick={fetchLeads}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <Link
            href="/admin/vendor-acquisition"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            CRM <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading pipeline...</div>
      ) : (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full" style={{ minWidth: `${PIPELINE_COLUMNS.length * 256}px` }}>
            {PIPELINE_COLUMNS.map((col) => {
              const cards = byStatus(col.status);
              return (
                <div
                  key={col.status}
                  className="flex flex-col rounded-2xl border border-gray-100 overflow-hidden flex-shrink-0"
                  style={{ width: 244, background: col.bg }}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, col.status)}
                >
                  {/* Column header */}
                  <div className="px-3 py-3 flex items-center justify-between border-b border-gray-100/80 flex-shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: col.color }}>
                      {col.label}
                    </span>
                    <span className="text-xs font-bold rounded-full px-2 py-0.5"
                      style={{ background: `${col.color}18`, color: col.color }}>
                      {cards.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {cards.length === 0 && (
                      <div className="h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-300">Drop here</span>
                      </div>
                    )}
                    {cards.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, lead.id)}
                        className="bg-white rounded-xl border border-gray-100 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow select-none"
                        style={{ opacity: updating === lead.id ? 0.5 : 1 }}
                      >
                        {/* Priority dot + name */}
                        <div className="flex items-start gap-2 mb-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${PRIORITY_DOT[lead.priority]}`} />
                          <span className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">
                            {lead.business_name}
                          </span>
                        </div>

                        {/* Category */}
                        <div className="flex items-center gap-1 mb-1.5">
                          <Tag size={10} className="text-gray-300 flex-shrink-0" />
                          <span className="text-xs text-gray-500">
                            {CATEGORY_LABELS[lead.category] ?? lead.category}
                          </span>
                        </div>

                        {/* Location */}
                        {(lead.city || lead.region) && (
                          <div className="flex items-center gap-1 mb-2">
                            <MapPin size={10} className="text-gray-300 flex-shrink-0" />
                            <span className="text-xs text-gray-400">
                              {[lead.city, lead.region].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}

                        {/* Score + link */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                          <div className="flex items-center gap-1">
                            <Star size={9} className="text-amber-400" />
                            <span className="text-xs font-bold text-gray-700">{lead.lead_score}</span>
                          </div>
                          <Link
                            href="/admin/vendor-acquisition"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                          >
                            <ExternalLink size={9} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
