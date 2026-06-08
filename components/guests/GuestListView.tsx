"use client";

import { useState, useCallback } from "react";
import { Users, Plus, Crown, ChevronDown, Trash2, Mail, Phone, Check, X, Clock, HelpCircle, Download, Search, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePolling } from "@/lib/polling";
import toast from "react-hot-toast";
import type { Guest, RSVPStatus, EventGuestStats } from "@/types";

interface GuestListViewProps {
  eventId: string;
  initialGuests: Guest[];
  initialStats: EventGuestStats | null;
}

const RSVP_CONFIG: Record<RSVPStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "Pending",   color: "bg-amber-500/15 text-amber-400 border-amber-500/20",    icon: Clock },
  accepted:  { label: "Accepted",  color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", icon: Check },
  declined:  { label: "Declined",  color: "bg-red-500/15 text-red-400 border-red-500/20",          icon: X },
  tentative: { label: "Tentative", color: "bg-blue-500/15 text-blue-400 border-blue-500/20",        icon: HelpCircle },
};

const MEAL_OPTIONS = ["No preference", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Nut-free", "Dairy-free"];

const emptyForm = {
  full_name: "", email: "", phone: "", is_vip: false,
  plus_one_allowed: false, meal_preference: "", dietary_notes: "", notes: "",
};

export function GuestListView({ eventId, initialGuests, initialStats }: GuestListViewProps) {
  const [guests, setGuests]     = useState<Guest[]>(initialGuests);
  const [stats, setStats]       = useState<EventGuestStats | null>(initialStats);
  const [filter, setFilter]     = useState<RSVPStatus | "all">("all");
  const [search, setSearch]     = useState("");
  const [showAdd, setShowAdd]   = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/guests?event_id=${eventId}`);
    if (res.ok) {
      const json = await res.json() as { guests: Guest[]; stats: EventGuestStats | null };
      setGuests(json.guests);
      setStats(json.stats);
    }
  }, [eventId]);

  usePolling(refresh, 30_000);

  const filtered = guests.filter((g) => {
    if (filter !== "all" && g.rsvp_status !== filter) return false;
    if (search && !g.full_name.toLowerCase().includes(search.toLowerCase()) &&
        !g.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setShowAdd(true);
  }

  function openEdit(g: Guest) {
    setEditId(g.id);
    setForm({
      full_name: g.full_name, email: g.email ?? "", phone: g.phone ?? "",
      is_vip: g.is_vip, plus_one_allowed: g.plus_one_allowed,
      meal_preference: g.meal_preference ?? "", dietary_notes: g.dietary_notes ?? "",
      notes: g.notes ?? "",
    });
    setShowAdd(true);
  }

  async function saveGuest() {
    if (!form.full_name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const url  = editId ? `/api/guests/${editId}` : "/api/guests";
      const method = editId ? "PATCH" : "POST";
      const body = editId ? form : { ...form, event_id: eventId };
      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.json() as { error: string }; throw new Error(e.error); }
      await refresh();
      setShowAdd(false);
      toast.success(editId ? "Guest updated" : "Guest added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGuest(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/guests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setGuests((prev) => prev.filter((g) => g.id !== id));
      await refresh();
      toast.success("Guest removed");
    } catch {
      toast.error("Failed to remove guest");
    } finally {
      setDeletingId(null);
    }
  }

  async function updateRSVP(id: string, rsvp_status: RSVPStatus) {
    setGuests((prev) => prev.map((g) => g.id === id ? { ...g, rsvp_status } : g));
    const res = await fetch(`/api/guests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rsvp_status }),
    });
    if (!res.ok) {
      await refresh();
      toast.error("Update failed");
    }
  }

  const exportCSV = () => {
    const rows = [
      ["Name", "Email", "Phone", "RSVP Status", "VIP", "Plus One", "Meal Preference"],
      ...guests.map((g) => [
        g.full_name, g.email ?? "", g.phone ?? "", g.rsvp_status,
        g.is_vip ? "Yes" : "No", g.plus_one_allowed ? "Yes" : "No", g.meal_preference ?? "",
      ]),
    ];
    const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "guest-list.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stats Banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Guests", value: stats.total_guests, color: "text-white" },
            { label: "Accepted",     value: stats.accepted,     color: "text-emerald-400" },
            { label: "Declined",     value: stats.declined,     color: "text-red-400" },
            { label: "Tentative",    value: stats.tentative,    color: "text-blue-400" },
            { label: "Pending",      value: stats.pending,      color: "text-amber-400" },
            { label: "VIPs",         value: stats.vip_count,    color: "text-gold-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/4 border border-white/6 rounded-xl p-4 text-center">
              <div className={cn("text-2xl font-bold", color)}>{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500/60 pointer-events-none" />
          <input
            className="input-field pl-icon text-sm"
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "accepted", "declined", "tentative"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize",
                filter === f
                  ? "gradient-brand text-white border-transparent"
                  : "border-white/10 text-slate-400 hover:border-white/20"
              )}
            >
              {f === "all" ? "All" : RSVP_CONFIG[f].label}
              {f !== "all" && stats && (
                <span className="ml-1.5 opacity-70">
                  {f === "accepted" ? stats.accepted : f === "declined" ? stats.declined : f === "tentative" ? stats.tentative : stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary text-xs py-2 px-3">
            <Download size={13} />Export CSV
          </button>
          <button onClick={openAdd} className="btn-primary text-xs py-2 px-4">
            <Plus size={13} />Add Guest
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <div className="bg-white/4 border border-brand-500/20 rounded-xl p-6 animate-fade-in-up">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <UserCheck size={16} className="text-brand-400" />
            {editId ? "Edit Guest" : "Add Guest"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Full Name *</label>
              <input className="input-field" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Jane Smith" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Email</label>
              <input className="input-field" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="jane@example.com" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+44 7700 900000" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Meal Preference</label>
              <select className="input-field" value={form.meal_preference} onChange={(e) => setForm((p) => ({ ...p, meal_preference: e.target.value }))}>
                <option value="">Not specified</option>
                {MEAL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Dietary Notes</label>
              <input className="input-field" value={form.dietary_notes} onChange={(e) => setForm((p) => ({ ...p, dietary_notes: e.target.value }))} placeholder="e.g. nut allergy" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Notes</label>
              <input className="input-field" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Seating preference..." />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_vip} onChange={(e) => setForm((p) => ({ ...p, is_vip: e.target.checked }))} className="rounded" />
                <span className="text-sm text-slate-300 flex items-center gap-1"><Crown size={13} className="text-gold-400" /> VIP Guest</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.plus_one_allowed} onChange={(e) => setForm((p) => ({ ...p, plus_one_allowed: e.target.checked }))} className="rounded" />
                <span className="text-sm text-slate-300">Allow Plus One</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-5 justify-end">
            <button onClick={() => setShowAdd(false)} className="btn-secondary text-sm py-2">Cancel</button>
            <button onClick={saveGuest} disabled={saving} className="btn-primary text-sm py-2">
              {saving ? "Saving..." : editId ? "Save Changes" : "Add Guest"}
            </button>
          </div>
        </div>
      )}

      {/* Guest Table */}
      <div className="bg-white/4 border border-white/6 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users size={40} className="mx-auto mb-3 text-slate-700" />
            <p className="text-slate-400 text-sm mb-1">
              {guests.length === 0 ? "No guests yet" : "No guests match your filter"}
            </p>
            {guests.length === 0 && (
              <p className="text-slate-600 text-xs mb-4">Start building your guest list for this event</p>
            )}
            {guests.length === 0 && (
              <button onClick={openAdd} className="btn-primary text-sm py-2.5 px-5 mt-2">
                <Plus size={14} />Add First Guest
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Guest</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">RSVP</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Meal</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((guest) => {
                  const rsvp = RSVP_CONFIG[guest.rsvp_status];
                  const RsvpIcon = rsvp.icon;
                  return (
                    <tr key={guest.id} className="hover:bg-white/3 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                            guest.is_vip ? "bg-gold-500/20 text-gold-400 ring-1 ring-gold-500/30" : "bg-brand-500/15 text-brand-400"
                          )}>
                            {guest.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              {guest.full_name}
                              {guest.is_vip && <Crown size={11} className="text-gold-400" />}
                              {guest.plus_one_allowed && <span className="text-xs text-slate-500">+1</span>}
                            </div>
                            {guest.tags?.length > 0 && (
                              <div className="flex gap-1 mt-0.5 flex-wrap">
                                {guest.tags.map((tag) => (
                                  <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-slate-500">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="space-y-0.5">
                          {guest.email && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Mail size={11} className="text-slate-600" />{guest.email}
                            </div>
                          )}
                          {guest.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Phone size={11} className="text-slate-600" />{guest.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative group/rsvp">
                          <button className={cn("badge border text-xs flex items-center gap-1", rsvp.color)}>
                            <RsvpIcon size={10} />
                            {rsvp.label}
                            <ChevronDown size={10} className="opacity-60" />
                          </button>
                          <div className="absolute top-full left-0 mt-1 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl z-10 py-1 min-w-[130px] hidden group-hover/rsvp:block">
                            {(["pending", "accepted", "declined", "tentative"] as RSVPStatus[]).map((s) => {
                              const cfg = RSVP_CONFIG[s];
                              const SIcon = cfg.icon;
                              return (
                                <button
                                  key={s}
                                  onClick={() => updateRSVP(guest.id, s)}
                                  className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors", cfg.color.split(" ").slice(1).join(" "))}
                                >
                                  <SIcon size={11} />{cfg.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-xs text-slate-500">{guest.meal_preference || "N/A"}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(guest)}
                            className="p-1.5 rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition-colors text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteGuest(guest.id)}
                            disabled={deletingId === guest.id}
                            className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-slate-600 text-center">
          Showing {filtered.length} of {guests.length} guests
        </p>
      )}
    </div>
  );
}
