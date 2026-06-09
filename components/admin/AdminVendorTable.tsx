"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search, CheckCircle2, XCircle, Star, MapPin, Package,
  Eye, Shield, Sparkles, Users, Building2, TrendingUp,
  Square, CheckSquare, X, Phone, Zap, BadgeCheck,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { computeVendorReadinessScore } from "@/lib/vendor/completion";
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

const REJECTION_TEMPLATES = [
  "Incomplete business description: please write a detailed bio of at least 50 characters",
  "Missing service category or pricing information",
  "Insufficient portfolio photos: please upload at least 3 photos of your work",
  "Contact details not provided: please add a phone number",
  "Business information could not be verified",
  "Profile does not meet our current quality standards: please review our guidelines and reapply",
];

export function AdminVendorTable({ vendors, stats, currentStatus, currentSearch }: AdminVendorTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [pending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectModal, setRejectModal] = useState<{ ids: string[]; label: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalModal, setApprovalModal] = useState<{
    vendorId: string;
    vendorName: string;
    checks: { label: string; pass: boolean; hint: string }[];
    allPass: boolean;
  } | null>(null);

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
        body: JSON.stringify({ vendor_id: vendorId, ...updates }),
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

  async function handleBulkAction(action: "approve" | "reject" | "suspend", reason?: string) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setActionLoading("bulk");
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_ids: ids, action, rejection_reason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Bulk action failed");
      const verb = action === "approve" ? "Approved" : action === "reject" ? "Rejected" : "Suspended";
      toast.success(`${verb} ${data.updated ?? ids.length} vendor(s)`);
      setSelectedIds(new Set());
      setRejectModal(null);
      setRejectionReason("");
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bulk action failed");
    } finally {
      setActionLoading(null);
    }
  }

  function openRejectModal(ids: string[], label: string) {
    setRejectionReason("");
    setRejectModal({ ids, label });
  }

  function openApprovalModal(vendor: Record<string, unknown>) {
    const mediaArr = vendor.media as Array<Record<string, unknown>> | null;
    const pkgArr   = vendor.packages as Array<Record<string, unknown>> | null;
    const bio      = (vendor.bio as string | null | undefined) ?? "";
    const checks = [
      {
        label: "Phone number provided",
        pass:  !!(vendor.phone as string | null),
        hint:  "Vendor must add a contact number before approval",
      },
      {
        label: "Phone verified",
        pass:  !!(vendor.phone_verified as boolean),
        hint:  "Admin should verify the vendor's phone number",
      },
      {
        label: "At least 1 service package",
        pass:  (pkgArr?.length ?? 0) >= 1,
        hint:  "Customers cannot request quotes without a package",
      },
      {
        label: "At least 3 portfolio photos",
        pass:  (mediaArr?.length ?? 0) >= 3,
        hint:  "Vendors with 3+ photos receive significantly more enquiries",
      },
      {
        label: "Profile description complete (50+ chars)",
        pass:  bio.trim().length >= 50,
        hint:  "A detailed bio helps customers choose this vendor",
      },
    ];
    setApprovalModal({
      vendorId:   String(vendor.id),
      vendorName: String(vendor.business_name),
      checks,
      allPass: checks.every((c) => c.pass),
    });
  }

  async function confirmRejection() {
    if (!rejectModal) return;
    if (rejectModal.ids.length === 1) {
      await updateVendor(rejectModal.ids[0], { status: "rejected", rejection_reason: rejectionReason || undefined }, "Rejection");
      setRejectModal(null);
      setRejectionReason("");
    } else {
      await handleBulkAction("reject", rejectionReason || undefined);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const [sortByReadiness, setSortByReadiness] = useState(false);

  function vendorReadiness(vendor: Record<string, unknown>) {
    const media = vendor.media as Array<Record<string, unknown>> | null;
    const packages = vendor.packages as Array<Record<string, unknown>> | null;
    const bio = (vendor.bio as string | null | undefined) ?? "";
    return computeVendorReadinessScore({
      mediaCount:        media?.length ?? 0,
      packageCount:      packages?.length ?? 0,
      verificationLevel: Number(vendor.verification_level ?? 0),
      bioLength:         bio.trim().length,
      hasPhone:          !!(vendor.phone as string | null),
      hasCity:           !!(vendor.city as string | null),
      hasSocial:         !!(vendor.instagram_url || vendor.website_url),
      responseRate:      Number(vendor.response_rate ?? 0),
    });
  }

  const displayVendors = sortByReadiness
    ? [...vendors].sort((a, b) => vendorReadiness(b).total - vendorReadiness(a).total)
    : vendors;

  const allSelected = displayVendors.length > 0 && displayVendors.every((v) => selectedIds.has(String(v.id)));

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(displayVendors.map((v) => String(v.id))));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Vendor Management</h1>
        <p className="text-slate-400 text-sm mt-1">Approve, reject, and manage all platform vendors</p>
      </div>

      {/* Stats — must always reconcile: Total = Approved + Pending + Rejected + Suspended */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: <Building2 size={16} className="text-brand-400" />, label: "Total", value: String(stats?.total_vendors ?? 0), note: null },
          { icon: <CheckCircle2 size={16} className="text-green-400" />, label: "Approved", value: String(stats?.approved_vendors ?? 0), note: null },
          { icon: <Shield size={16} className="text-amber-400" />, label: "Pending", value: String(stats?.pending_vendors ?? 0), note: null },
          { icon: <XCircle size={16} className="text-red-400" />, label: "Rejected", value: String(stats?.rejected_vendors ?? 0), note: null },
          { icon: <X size={16} className="text-orange-400" />, label: "Suspended", value: String(stats?.suspended_vendors ?? 0), note: null },
          { icon: <TrendingUp size={16} className="text-blue-400" />, label: "Revenue", value: formatCurrency(Number(stats?.total_revenue ?? 0)), note: null },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/4 border border-white/6 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">{stat.icon}<span className="text-xs text-slate-400">{stat.label}</span></div>
            <div className="text-xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>
      {/* Integrity check: surface reconciliation gap if Total != sum of statuses */}
      {(() => {
        const total     = Number(stats?.total_vendors ?? 0);
        const approved  = Number(stats?.approved_vendors ?? 0);
        const pending   = Number(stats?.pending_vendors ?? 0);
        const rejected  = Number(stats?.rejected_vendors ?? 0);
        const suspended = Number(stats?.suspended_vendors ?? 0);
        const sum = approved + pending + rejected + suspended;
        if (total !== sum && total > 0) {
          return (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-sm">
              <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-300">
                Integrity gap: Total ({total}) does not equal Approved + Pending + Rejected + Suspended ({sum}).
                {" "}{total - sum} vendor(s) unaccounted for. Check docs/Vendor_Data_Integrity_Audit.md.
              </span>
            </div>
          );
        }
        return null;
      })()}

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
        <>
          {/* Select-all bar */}
          <div className="flex items-center gap-3 px-1">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
              {allSelected
                ? <CheckSquare size={14} className="text-brand-400" />
                : <Square size={14} />}
              {allSelected ? "Deselect all" : `Select all (${vendors.length})`}
            </button>
            {selectedIds.size > 0 && (
              <span className="text-xs text-slate-500">{selectedIds.size} selected</span>
            )}
            <div className="ml-auto">
              <button
                onClick={() => setSortByReadiness((v) => !v)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  sortByReadiness
                    ? "bg-brand-500/15 border-brand-500/40 text-brand-300"
                    : "bg-white/4 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <TrendingUp size={11} />
                {sortByReadiness ? "Sorted: Readiness ↓" : "Sort by Readiness"}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {displayVendors.map((vendor) => {
              const profile = vendor.profile as Record<string, string> | null;
              const media = vendor.media as Array<Record<string, unknown>> | null;
              const packages = vendor.packages as Array<Record<string, unknown>> | null;
              const cover = media?.find((m) => m.is_cover) ?? media?.[0];
              const cat = VENDOR_CATEGORIES[String(vendor.category) as keyof typeof VENDOR_CATEGORIES];
              const vendorId = String(vendor.id);
              const status = String(vendor.status);
              const isSelected = selectedIds.has(vendorId);

              return (
                <div
                  key={vendorId}
                  className={`bg-white/4 border rounded-xl p-5 transition-colors ${isSelected ? "border-brand-500/50 bg-brand-500/5" : "border-white/6"}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(vendorId)}
                      className="mt-1 flex-shrink-0 text-slate-500 hover:text-brand-400 transition-colors"
                    >
                      {isSelected
                        ? <CheckSquare size={16} className="text-brand-400" />
                        : <Square size={16} />}
                    </button>

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
                        <span className="flex items-center gap-1"><MapPin size={10} />{String(vendor.city ?? "N/A")}</span>
                        <span>{vendor.category === "other" && vendor.custom_category_description ? `Other: ${String(vendor.custom_category_description)}` : cat?.label}</span>
                        {Number(vendor.rating) > 0 && (
                          <span className="flex items-center gap-1">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            {Number(vendor.rating).toFixed(1)} ({Number(vendor.total_reviews ?? 0)} reviews)
                          </span>
                        )}
                        <span className={`flex items-center gap-1 ${status === "pending" && (packages?.length ?? 0) === 0 ? "text-amber-400" : ""}`}>
                          <Package size={10} />{packages?.length ?? 0} packages
                          {status === "pending" && (packages?.length ?? 0) === 0 && <span className="text-amber-400 font-semibold">&nbsp;&#x26A0; no packages</span>}
                        </span>
                        <span className="flex items-center gap-1"><Users size={10} />{profile?.full_name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {profile?.email} · Joined {formatDate(String(vendor.created_at))}
                      </div>
                      {(() => {
                        const vendorPhone = vendor.phone as string | null | undefined;
                        const displayPhone = vendorPhone ?? profile?.phone;
                        if (!displayPhone) return null;
                        const phoneVerified = !!vendor.phone_verified;
                        return (
                          <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: phoneVerified ? "#34d399" : "#94a3b8" }}>
                            <Phone size={10} />
                            <span>{displayPhone}</span>
                            {phoneVerified && <span className="text-emerald-400 ml-1">verified</span>}
                          </div>
                        );
                      })()}
                      {!!vendor.tagline && <p className="text-xs text-slate-400 mt-1.5 italic truncate">&ldquo;{String(vendor.tagline)}&rdquo;</p>}
                      {(() => {
                        const rs = vendorReadiness(vendor);
                        const color = rs.total >= 75 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/8"
                          : rs.total >= 50 ? "text-amber-400 border-amber-500/30 bg-amber-500/8"
                          : "text-slate-400 border-white/10 bg-white/4";
                        return (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${color}`}>
                              <TrendingUp size={9} />
                              Readiness {rs.total}% · {rs.label}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Link href={`/vendors/${vendorId}`} target="_blank" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                        <Eye size={12} />View
                      </Link>

                      {status === "pending" && (
                        <>
                          <button
                            onClick={() => openApprovalModal(vendor)}
                            disabled={!!actionLoading}
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} />Approve
                          </button>
                          <button
                            onClick={() => openRejectModal([vendorId], String(vendor.business_name))}
                            disabled={!!actionLoading}
                            className="text-xs py-1.5 px-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors flex items-center gap-1"
                          >
                            <XCircle size={12} />Reject
                          </button>
                        </>
                      )}

                      {status === "approved" && (
                        <>
                          {/* Lifecycle advancement for approved vendors */}
                          {(() => {
                            const lc = String(vendor.lifecycle_state ?? "approved");
                            return (
                              <div className="flex flex-col gap-1">
                                {lc === "approved" && (
                                  <button
                                    onClick={() => updateVendor(vendorId, { lifecycle_state: "profile_setup" }, "Profile Setup")}
                                    disabled={!!actionLoading}
                                    title="Mark profile as set up"
                                    className="text-xs py-1 px-2 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 transition-colors flex items-center gap-1"
                                  >
                                    <Package size={10} />Profile Setup
                                  </button>
                                )}
                                {lc === "profile_setup" && (
                                  <button
                                    onClick={() => updateVendor(vendorId, { lifecycle_state: "verified" }, "Verified")}
                                    disabled={!!actionLoading}
                                    title="Mark as document verified"
                                    className="text-xs py-1 px-2 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/25 hover:bg-purple-500/25 transition-colors flex items-center gap-1"
                                  >
                                    <BadgeCheck size={10} />Verify Docs
                                  </button>
                                )}
                                {lc === "verified" && (
                                  <button
                                    onClick={() => updateVendor(vendorId, { lifecycle_state: "live" }, "Go Live")}
                                    disabled={!!actionLoading}
                                    title="Publish vendor to marketplace"
                                    className="text-xs py-1 px-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
                                  >
                                    <Zap size={10} />Go Live
                                  </button>
                                )}
                                {lc === "live" && (
                                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                                    <Zap size={10} />Live
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                          <button
                            onClick={() => updateVendor(vendorId, { status: "suspended" }, "Suspension")}
                            disabled={!!actionLoading}
                            className="text-xs py-1.5 px-3 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-colors"
                          >
                            Suspend
                          </button>
                        </>
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
                        <button
                          onClick={() => updateVendor(vendorId, { phone_verified: !vendor.phone_verified }, vendor.phone_verified ? "Unverify phone" : "Verify phone")}
                          disabled={!!actionLoading}
                          title={vendor.phone_verified ? "Remove phone verified" : "Mark phone verified"}
                          className={`flex-1 text-xs py-1.5 px-2 rounded-lg border transition-colors ${vendor.phone_verified ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-slate-400 border-white/10 hover:border-emerald-500/30"}`}
                        >
                          <Phone size={11} className="mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3">
          <span className="text-sm text-white font-medium">{selectedIds.size} selected</span>
          <div className="w-px h-5 bg-white/15" />
          <button
            onClick={() => handleBulkAction("approve")}
            disabled={!!actionLoading}
            className="text-xs py-1.5 px-3 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <CheckCircle2 size={12} />Approve All
          </button>
          <button
            onClick={() => openRejectModal(Array.from(selectedIds), `${selectedIds.size} vendor${selectedIds.size > 1 ? "s" : ""}`)}
            disabled={!!actionLoading}
            className="text-xs py-1.5 px-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <XCircle size={12} />Reject All
          </button>
          <button
            onClick={() => handleBulkAction("suspend")}
            disabled={!!actionLoading}
            className="text-xs py-1.5 px-3 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-colors disabled:opacity-50"
          >
            Suspend All
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-slate-500 hover:text-white transition-colors ml-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Approval standards modal */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/6">
              <div>
                <h2 className="text-base font-bold text-white">Approval Standards</h2>
                <p className="text-sm text-slate-400 mt-0.5">{approvalModal.vendorName}</p>
              </div>
              <button onClick={() => setApprovalModal(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-2">
              {approvalModal.checks.map((check) => (
                <div
                  key={check.label}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${
                    check.pass
                      ? "bg-emerald-500/8 border-emerald-500/20"
                      : "bg-red-500/8 border-red-500/20"
                  }`}
                >
                  {check.pass
                    ? <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    : <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${check.pass ? "text-white" : "text-red-300"}`}>{check.label}</p>
                    {!check.pass && <p className="text-xs text-red-400/70 mt-0.5">{check.hint}</p>}
                  </div>
                </div>
              ))}
              {!approvalModal.allPass && (
                <p className="text-xs text-amber-400 pt-1">
                  This vendor does not meet minimum approval standards. You can still approve, but they may receive fewer enquiries.
                </p>
              )}
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setApprovalModal(null)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  void updateVendor(approvalModal.vendorId, { status: "approved" }, "Approval");
                  setApprovalModal(null);
                }}
                disabled={!!actionLoading}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-1 ${
                  approvalModal.allPass
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                }`}
              >
                <CheckCircle2 size={13} />
                {approvalModal.allPass ? "Approve Vendor" : "Approve Anyway"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/6">
              <div>
                <h2 className="text-base font-bold text-white">Reject Vendor</h2>
                <p className="text-sm text-slate-400 mt-0.5">{rejectModal.label}</p>
              </div>
              <button onClick={() => setRejectModal(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Quick templates</p>
                <div className="space-y-2">
                  {REJECTION_TEMPLATES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setRejectionReason(t)}
                      className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                        rejectionReason === t
                          ? "bg-brand-500/15 border-brand-500/40 text-brand-300"
                          : "bg-white/4 border-white/8 text-slate-300 hover:border-white/15"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Custom reason (optional)</p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Leave blank to send a generic rejection email..."
                  rows={3}
                  className="input-field w-full resize-none text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setRejectModal(null)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button
                onClick={confirmRejection}
                disabled={!!actionLoading}
                className="flex-1 py-2 px-4 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {actionLoading ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
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
