"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, User, Store, FileText, ExternalLink } from "lucide-react";

interface AuditLog {
  id: string;
  created_at: string;
  user_id: string;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  ip_address: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
}

interface UserResult {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
}

interface VendorResult {
  id: string;
  business_name: string;
  category: string;
  city: string;
  status: string;
  created_at: string;
}

export function AdminSupportView() {
  const [userQuery, setUserQuery]   = useState("");
  const [vendorQuery, setVendorQuery] = useState("");
  const [auditEntityId, setAuditEntityId] = useState("");

  const [userResult, setUserResult]     = useState<UserResult | null | "not_found">(null);
  const [vendorResults, setVendorResults] = useState<VendorResult[]>([]);
  const [auditLogs, setAuditLogs]       = useState<AuditLog[]>([]);

  const [userLoading, setUserLoading]     = useState(false);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [auditLoading, setAuditLoading]   = useState(false);
  const [userError, setUserError]         = useState("");
  const [vendorError, setVendorError]     = useState("");
  const [auditError, setAuditError]       = useState("");

  async function lookupUser(e: React.FormEvent) {
    e.preventDefault();
    if (!userQuery.trim()) return;
    setUserLoading(true);
    setUserError("");
    setUserResult(null);
    try {
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(userQuery.trim())}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as UserResult[];
      setUserResult(data.length > 0 ? data[0] : "not_found");
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Error");
    } finally {
      setUserLoading(false);
    }
  }

  async function lookupVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorQuery.trim()) return;
    setVendorLoading(true);
    setVendorError("");
    setVendorResults([]);
    try {
      const res = await fetch(`/api/admin/vendors?search=${encodeURIComponent(vendorQuery.trim())}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as VendorResult[];
      setVendorResults(data);
    } catch (err) {
      setVendorError(err instanceof Error ? err.message : "Error");
    } finally {
      setVendorLoading(false);
    }
  }

  async function lookupAudit(e: React.FormEvent) {
    e.preventDefault();
    if (!auditEntityId.trim()) return;
    setAuditLoading(true);
    setAuditError("");
    setAuditLogs([]);
    try {
      const res = await fetch(`/api/admin/audit?entity_id=${encodeURIComponent(auditEntityId.trim())}&limit=25`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as AuditLog[];
      setAuditLogs(data);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "Error");
    } finally {
      setAuditLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* User Lookup */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
          <User size={15} className="text-brand-400" /> User Lookup
        </h2>
        <form onSubmit={lookupUser} className="flex gap-2 mb-4">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Search by name..."
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
          />
          <button type="submit" disabled={userLoading} className="px-4 py-2 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/30 transition-colors disabled:opacity-50">
            {userLoading ? "..." : <Search size={15} />}
          </button>
        </form>
        {userError && <p className="text-red-400 text-xs">{userError}</p>}
        {userResult === "not_found" && <p className="text-slate-500 text-sm">No user found.</p>}
        {userResult && userResult !== "not_found" && (
          <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{userResult.full_name ?? "(no name)"}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-slate-300 capitalize">{userResult.role}</span>
            </div>
            <div className="text-xs text-slate-400">{userResult.email}</div>
            <div className="text-xs text-slate-500">Joined {new Date(userResult.created_at).toLocaleDateString()}</div>
            <div className="text-xs text-slate-600 font-mono">ID: {userResult.id}</div>
          </div>
        )}
      </div>

      {/* Vendor Lookup */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
          <Store size={15} className="text-brand-400" /> Vendor Lookup
        </h2>
        <form onSubmit={lookupVendor} className="flex gap-2 mb-4">
          <input
            type="text"
            value={vendorQuery}
            onChange={(e) => setVendorQuery(e.target.value)}
            placeholder="Search by business name..."
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
          />
          <button type="submit" disabled={vendorLoading} className="px-4 py-2 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/30 transition-colors disabled:opacity-50">
            {vendorLoading ? "..." : <Search size={15} />}
          </button>
        </form>
        {vendorError && <p className="text-red-400 text-xs">{vendorError}</p>}
        {vendorResults.length > 0 && (
          <div className="space-y-2">
            {vendorResults.slice(0, 5).map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/8">
                <div>
                  <div className="text-sm font-semibold text-white">{v.business_name}</div>
                  <div className="text-xs text-slate-500">{v.category} · {v.city}</div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5">{v.id}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  v.status === "approved" ? "bg-emerald-500/15 text-emerald-400" :
                  v.status === "pending"  ? "bg-amber-500/15 text-amber-400" :
                  "bg-red-500/15 text-red-400"
                }`}>{v.status}</span>
              </div>
            ))}
          </div>
        )}
        {!vendorLoading && vendorResults.length === 0 && vendorQuery && <p className="text-slate-500 text-sm">No vendors found.</p>}
      </div>

      {/* Audit Log Viewer */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
          <FileText size={15} className="text-brand-400" /> Audit Log Viewer
        </h2>
        <form onSubmit={lookupAudit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={auditEntityId}
            onChange={(e) => setAuditEntityId(e.target.value)}
            placeholder="Entity ID (vendor ID, booking ID, etc.)..."
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
          />
          <button type="submit" disabled={auditLoading} className="px-4 py-2 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/30 transition-colors disabled:opacity-50">
            {auditLoading ? "..." : <Search size={15} />}
          </button>
        </form>
        {auditError && <p className="text-red-400 text-xs">{auditError}</p>}
        {auditLogs.length > 0 && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-white/3 border border-white/8 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-semibold text-brand-400">{log.action}</span>
                  <span className="text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <div className="text-slate-400">
                  {log.entity_type}
                  {log.entity_id && <span className="text-slate-600 font-mono ml-1">:{log.entity_id.slice(0, 8)}</span>}
                  {log.actor_role && <span className="ml-2 px-1.5 py-0.5 rounded bg-white/8 text-slate-300 capitalize">{log.actor_role}</span>}
                  {log.ip_address && <span className="ml-2 text-slate-600">{log.ip_address}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        {!auditLoading && auditLogs.length === 0 && auditEntityId && <p className="text-slate-500 text-sm">No audit logs found for this entity.</p>}
      </div>

      {/* Quick Links */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-3 text-sm">Quick Links</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { href: "/admin/vendors",       label: "Vendor Management",    desc: "Approve, suspend, review vendors" },
            { href: "/admin/verifications", label: "Verifications",        desc: "Pending ID and credential checks" },
            { href: "/admin/moderation",    label: "Content Moderation",   desc: "Reports and media review queue" },
            { href: "/admin/customers",     label: "Customer Accounts",    desc: "User lookups and account info" },
            { href: "/admin/disputes",      label: "Disputes",             desc: "Customer-vendor conflict resolution" },
            { href: "/admin/system",        label: "System Status",        desc: "Environment and migration health" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="flex items-start gap-2.5 p-3 rounded-xl border border-white/8 hover:bg-white/5 hover:border-white/15 transition-all">
              <ExternalLink size={13} className="text-brand-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-white">{link.label}</div>
                <div className="text-xs text-slate-500">{link.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
