"use client";

import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Plus, Search, Globe, Phone, Mail, X, Save, AtSign,
  ChevronDown, ChevronUp, Trash2, ExternalLink,
} from "lucide-react";

const CATEGORIES = [
  "dj","photographer","decorator","caterer","cake_maker","videographer","mc",
  "makeup_artist","balloon_decorator","lighting_stage","marquee_rental",
  "live_band","transport","security","event_planner","other",
];
const SOURCES = ["instagram_dm","email","referral","cold_call","event","website","other"];
const STATUSES = ["prospect","contacted","interested","registered","approved","verified","active","lost"] as const;
type PilotStatus = typeof STATUSES[number];

const STATUS_COLORS: Record<PilotStatus, string> = {
  prospect:   "bg-white/10 text-white/40 border-white/15",
  contacted:  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  interested: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  registered: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  approved:   "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  verified:   "bg-teal-500/20 text-teal-300 border-teal-500/30",
  active:     "bg-green-500/20 text-green-300 border-green-500/30",
  lost:       "bg-red-500/20 text-red-300 border-red-500/30",
};

interface PilotVendor {
  id: string;
  business_name: string;
  category: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  acquisition_source: string | null;
  status: PilotStatus;
  notes: string | null;
  vendor_id: string | null;
  contacted_at: string | null;
  registered_at: string | null;
  created_at: string;
}

type FunnelData = Record<PilotStatus, number>;

const EMPTY_FORM = {
  business_name: "", category: "", contact_name: "", phone: "", email: "",
  instagram: "", facebook: "", website: "", acquisition_source: "",
  status: "prospect" as PilotStatus, notes: "",
};

export function PilotCRM({ initialVendors, funnel }: { initialVendors: PilotVendor[]; funnel: FunnelData }) {
  const [vendors, setVendors]       = useState<PilotVendor[]>(initialVendors);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<string>("all");
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [editId, setEditId]         = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  const filtered = useMemo(() => {
    let rows = vendors;
    if (statusFilter !== "all") rows = rows.filter((v) => v.status === statusFilter);
    if (search.trim()) {
      const t = search.toLowerCase();
      rows = rows.filter((v) =>
        v.business_name.toLowerCase().includes(t) ||
        (v.contact_name ?? "").toLowerCase().includes(t) ||
        (v.category ?? "").toLowerCase().includes(t)
      );
    }
    return rows;
  }, [vendors, statusFilter, search]);

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
  }

  function openEdit(v: PilotVendor) {
    setEditId(v.id);
    setForm({
      business_name: v.business_name, category: v.category ?? "", contact_name: v.contact_name ?? "",
      phone: v.phone ?? "", email: v.email ?? "", instagram: v.instagram ?? "",
      facebook: v.facebook ?? "", website: v.website ?? "",
      acquisition_source: v.acquisition_source ?? "", status: v.status, notes: v.notes ?? "",
    });
    setShowForm(true);
    setError("");
  }

  async function handleSave() {
    if (!form.business_name.trim()) { setError("Business name is required"); return; }
    setSaving(true); setError("");
    try {
      if (editId) {
        const res = await fetch(`/api/admin/pilot/vendors?id=${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const updated = await res.json() as PilotVendor;
        if (!res.ok) throw new Error((updated as { error?: string }).error ?? "Failed");
        setVendors((v) => v.map((x) => x.id === editId ? updated : x));
      } else {
        const res = await fetch("/api/admin/pilot/vendors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const created = await res.json() as PilotVendor;
        if (!res.ok) throw new Error((created as { error?: string }).error ?? "Failed");
        setVendors((v) => [created, ...v]);
      }
      setShowForm(false);
      setEditId(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this CRM record?")) return;
    await fetch(`/api/admin/pilot/vendors?id=${id}`, { method: "DELETE" });
    setVendors((v) => v.filter((x) => x.id !== id));
  }

  async function quickStatus(id: string, status: PilotStatus) {
    await fetch(`/api/admin/pilot/vendors?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setVendors((v) => v.map((x) => x.id === id ? { ...x, status } : x));
  }

  const total = vendors.length;

  return (
    <div className="space-y-6">
      {/* Acquisition Funnel */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-5">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Acquisition Funnel</p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {STATUSES.map((s) => {
            const count = (funnel[s] ?? 0) + vendors.filter((v) => v.status === s).length - (initialVendors.filter((v) => v.status === s).length);
            const live  = vendors.filter((v) => v.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatus(statusFilter === s ? "all" : s)}
                className={`rounded-xl p-3 border text-center transition-colors ${
                  statusFilter === s ? STATUS_COLORS[s] : "bg-white/3 border-white/8 hover:bg-white/6"
                }`}
              >
                <p className="text-xl font-bold text-white">{live}</p>
                <p className="text-xs text-white/40 capitalize mt-0.5">{s}</p>
              </button>
            );
          })}
        </div>
        <div className="mt-3 text-xs text-white/30 flex items-center justify-between">
          <span>{total} total prospects tracked</span>
          <span>Target: 10 active vendors</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors..."
            className="input-field pl-8 text-sm w-full"
          />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <Plus size={14} /> Add Prospect
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white/4 border border-brand-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold text-sm">{editId ? "Edit Record" : "New Prospect"}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-white/30 hover:text-white/70">
              <X size={16} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 block mb-1">Business Name *</label>
              <input className="input-field text-sm" value={form.business_name} onChange={(e) => setForm({...form, business_name: e.target.value})} placeholder="e.g. Rhythm DJs London" />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Category</label>
              <select className="input-field text-sm" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Contact Name</label>
              <input className="input-field text-sm" value={form.contact_name} onChange={(e) => setForm({...form, contact_name: e.target.value})} placeholder="First Last" />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Phone</label>
              <input className="input-field text-sm" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="+44 7700 000000" />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Email</label>
              <input className="input-field text-sm" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="contact@business.co.uk" />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Instagram</label>
              <input className="input-field text-sm" value={form.instagram} onChange={(e) => setForm({...form, instagram: e.target.value})} placeholder="@handle" />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Acquisition Source</label>
              <select className="input-field text-sm" value={form.acquisition_source} onChange={(e) => setForm({...form, acquisition_source: e.target.value})}>
                <option value="">Select source</option>
                {SOURCES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Status</label>
              <select className="input-field text-sm" value={form.status} onChange={(e) => setForm({...form, status: e.target.value as PilotStatus})}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-1">Notes</label>
            <textarea className="input-field text-sm resize-none" rows={3} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Any notes about this prospect..." />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm py-2.5 disabled:opacity-40">
              <Save size={13} /> {saving ? "Saving..." : editId ? "Update" : "Add Prospect"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary text-sm py-2.5">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/3 border border-white/6 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-white/40 text-xs">
                <th className="text-left px-4 py-3 font-medium">Business</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Contact</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-14">
                    {total === 0 ? (
                      <>
                        <div className="text-3xl mb-3">🚀</div>
                        <p className="text-white/50 font-medium">No pilot records yet</p>
                        <p className="text-white/30 text-sm mt-1">
                          Add vendors and testers before launch — click Add Prospect to get started.
                        </p>
                      </>
                    ) : (
                      <p className="text-white/30">No matches for this filter.</p>
                    )}
                  </td>
                </tr>
              )}
              {filtered.map((v) => (
                <>
                  <tr key={v.id} className="hover:bg-white/3 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-xs">{v.business_name}</p>
                      {v.vendor_id && <p className="text-emerald-400 text-xs">On platform</p>}
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs capitalize">{v.category?.replace(/_/g," ") ?? "—"}</td>
                    <td className="px-4 py-3">
                      <p className="text-white/70 text-xs">{v.contact_name ?? "—"}</p>
                      {v.email && <p className="text-white/30 text-xs">{v.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs capitalize">{v.acquisition_source?.replace(/_/g," ") ?? "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={v.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => void quickStatus(v.id, e.target.value as PilotStatus)}
                        className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer bg-transparent ${STATUS_COLORS[v.status]}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s} className="bg-[#0a0a0f] text-white">{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {expandedId === v.id
                          ? <ChevronUp size={13} className="text-white/40" />
                          : <ChevronDown size={13} className="text-white/40" />}
                      </div>
                    </td>
                  </tr>
                  {expandedId === v.id && (
                    <tr key={`${v.id}-expanded`} className="bg-white/2">
                      <td colSpan={7} className="px-4 pb-4 pt-2">
                        <div className="grid sm:grid-cols-3 gap-4 text-xs mb-3">
                          <div className="space-y-1">
                            {v.phone && <div className="flex items-center gap-1.5 text-white/50"><Phone size={11}/>{v.phone}</div>}
                            {v.email && <div className="flex items-center gap-1.5 text-white/50"><Mail size={11}/>{v.email}</div>}
                            {v.instagram && <div className="flex items-center gap-1.5 text-white/50"><AtSign size={11}/>{v.instagram}</div>}
                            {v.website && <a href={v.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300"><Globe size={11}/>{v.website} <ExternalLink size={9}/></a>}
                          </div>
                          <div>
                            {v.notes && (
                              <div>
                                <p className="text-white/30 mb-1">Notes</p>
                                <p className="text-white/60 leading-relaxed">{v.notes}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end gap-2 items-start">
                            <button onClick={(e) => { e.stopPropagation(); openEdit(v); }} className="px-3 py-1.5 rounded-lg bg-white/6 border border-white/10 text-white/60 hover:text-white text-xs transition-colors">Edit</button>
                            <button onClick={(e) => { e.stopPropagation(); void handleDelete(v.id); }} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 text-xs transition-colors"><Trash2 size={11}/></button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-white/6 px-4 py-2 text-xs text-white/30">
            {filtered.length} of {vendors.length} prospects
          </div>
        )}
      </div>
    </div>
  );
}
