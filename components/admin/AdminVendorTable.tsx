"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search, CheckCircle2, XCircle, Star, MapPin, Package,
  Eye, Shield, Sparkles, Users, Building2, TrendingUp,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { VENDOR_CATEGORIES } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface AdminVendorTableProps {
  vendors: Record<string, unknown>[];
  stats: Record<string, unknown> | null;
  currentStatus: string;
  currentSearch: string;
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

export function AdminVendorTable({ vendors, stats, currentStatus, currentSearch }: AdminVendorTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [pending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  function applyFilters(status?: string, s?: string) {
    const params = new URLSearchParams();
    params.set("status", status ?? currentStatus);
    if (s !== undefined ? s : search) params.set("search", s !== undefined ? s : search);
    startTransition(() => router.push(`/admin/vendors?${params.toString()}`));
  }

  async function updateVendor(vendorId: string, updates: Record<string, unknown>, label: string) {
    setActionLoading(vendorId + label);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, ...updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`${label} successful`);
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Vendor Management</h1>
        <p className="text-slate-400 text-sm mt-1">Approve, reject, and manage all platform vendors</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Building2 size={18} className="text-brand-400" />, label: "Total Vendors", value: String(stats?.total_vendors ?? stats?.approved_vendors ?? 0) },
          { icon: <CheckCircle2 size={18} className="text-green-400" />, label: "Approved", value: String(vendors.filter(v => v.status === "approved").length) },
          { icon: <Shield size={18} className="text-amber-400" />, label: "Pending Review", value: String(stats?.pending_vendors ?? 0) },
          { icon: <TrendingUp size={18} className="text-blue-400" />, label: "Platform Revenue", value: formatCurrency(Number(stats?.total_revenue ?? 0)) },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/4 border border-white/6 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">{stat.icon}<span className="text-xs text-slate-400">{stat.label}</span></div>
            <div className="text-xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500/60 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters(undefined, search)}
            placeholder="Search by name or city..."
            className="input-field pl-icon w-full"
          />
        </div>
        <button onClick={() => applyFilters(undefined, search)} className="btn-secondary">Search</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => applyFilters(tab.value)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${currentStatus === tab.value ? "bg-brand-500 text-white" : "text-slate-400 hover:text-white"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {vendors.length === 0 ? (
        <div className="bg-white/4 border border-white/6 rounded-xl p-12 text-center">
          <Building2 size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No vendors found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map((vendor) => {
            const profile = vendor.profile as Record<string, string> | null;
            const media = vendor.media as Array<Record<string, unknown>> | null;
            const packages = vendor.packages as Array<Record<string, unknown>> | null;
            const cover = media?.find((m) => m.is_cover) ?? media?.[0];
            const cat = VENDOR_CATEGORIES[String(vendor.category) as keyof typeof VENDOR_CATEGORIES];
            const vendorId = String(vendor.id);
            const status = String(vendor.status);

            return (
              <div key={vendorId} className="bg-white/4 border border-white/6 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  {/* Media */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                    {cover ? (
                      <Image src={String(cover.url)} alt="" fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-2xl">
                        {cat?.icon}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white">{String(vendor.business_name)}</h3>
                      {!!vendor.featured && <Sparkles size={12} className="text-amber-400" />}
                      {!!vendor.verified && <Shield size={12} className="text-blue-400" />}
                      <StatusBadge status={status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin size={10} />{String(vendor.city ?? "—")}</span>
                      <span>{cat?.label}</span>
                      {Number(vendor.rating) > 0 && (
                        <span className="flex items-center gap-1">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          {Number(vendor.rating).toFixed(1)} ({Number(vendor.total_reviews ?? 0)} reviews)
                        </span>
                      )}
                      <span className="flex items-center gap-1"><Package size={10} />{packages?.length ?? 0} packages</span>
                      <span className="flex items-center gap-1"><Users size={10} />{profile?.full_name}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {profile?.email} · Joined {formatDate(String(vendor.created_at))}
                    </div>
                    {!!vendor.tagline && <p className="text-xs text-slate-400 mt-1.5 italic truncate">&ldquo;{String(vendor.tagline)}&rdquo;</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link href={`/vendors/${vendorId}`} target="_blank" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                      <Eye size={12} />View
                    </Link>

                    {status === "pending" && (
                      <>
                        <button
                          onClick={() => updateVendor(vendorId, { status: "approved" }, "Approval")}
                          disabled={!!actionLoading}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} />Approve
                        </button>
                        <button
                          onClick={() => updateVendor(vendorId, { status: "rejected" }, "Rejection")}
                          disabled={!!actionLoading}
                          className="text-xs py-1.5 px-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors flex items-center gap-1"
                        >
                          <XCircle size={12} />Reject
                        </button>
                      </>
                    )}

                    {status === "approved" && (
                      <button
                        onClick={() => updateVendor(vendorId, { status: "suspended" }, "Suspension")}
                        disabled={!!actionLoading}
                        className="text-xs py-1.5 px-3 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-colors"
                      >
                        Suspend
                      </button>
                    )}

                    {(status === "rejected" || status === "suspended") && (
                      <button
                        onClick={() => updateVendor(vendorId, { status: "approved" }, "Reactivation")}
                        disabled={!!actionLoading}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        Reactivate
                      </button>
                    )}

                    <div className="flex gap-1">
                      <button
                        onClick={() => updateVendor(vendorId, { featured: !vendor.featured }, vendor.featured ? "Unfeature" : "Feature")}
                        disabled={!!actionLoading}
                        title={vendor.featured ? "Remove featured" : "Mark featured"}
                        className={`flex-1 text-xs py-1.5 px-2 rounded-lg border transition-colors ${vendor.featured ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-white/5 text-slate-400 border-white/10 hover:border-amber-500/30"}`}
                      >
                        <Sparkles size={11} className="mx-auto" />
                      </button>
                      <button
                        onClick={() => updateVendor(vendorId, { verified: !vendor.verified }, vendor.verified ? "Unverify" : "Verify")}
                        disabled={!!actionLoading}
                        title={vendor.verified ? "Remove verified" : "Mark verified"}
                        className={`flex-1 text-xs py-1.5 px-2 rounded-lg border transition-colors ${vendor.verified ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-white/5 text-slate-400 border-white/10 hover:border-blue-500/30"}`}
                      >
                        <Shield size={11} className="mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pending && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-white/4 border border-white/6 rounded-xl px-6 py-3 text-sm text-white">Loading...</div>
        </div>
      )}
    </div>
  );
}
