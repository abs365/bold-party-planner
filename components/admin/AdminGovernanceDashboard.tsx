"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle, CheckCircle2, Shield, Activity, Users, TrendingDown,
  X, ChevronDown, ChevronUp, RefreshCw, Flag, FlagOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import type { WarningType, WarningSeverity, StoredWarning } from "@/lib/vendor/warnings";
import { WARNING_SEVERITY_BADGE, WARNING_TYPE_LABEL } from "@/lib/vendor/warnings";
import type { VendorHealthScore } from "@/lib/vendor/health";
import type { ComputedWarning } from "@/lib/vendor/warnings";
import { LIFECYCLE_STATE_META } from "@/lib/vendor/governance";
import type { VendorLifecycleState } from "@/lib/vendor/governance";

interface AtRiskVendor {
  id: string;
  business_name: string;
  city: string | null;
  category: string;
  status: string;
  suspicious_flag: boolean;
  suspicious_reason: string | null;
  health: VendorHealthScore;
  warnings: ComputedWarning[];
  profile: { full_name: string; email: string } | null;
}

interface ActiveWarning extends StoredWarning {
  vendor: { id: string; business_name: string; status: string } | null;
}

interface HealthDistribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  critical: number;
}

interface Props {
  atRiskVendors: AtRiskVendor[];
  activeWarnings: ActiveWarning[];
  healthDistribution: HealthDistribution;
  totalApproved: number;
}

const WARN_TYPES: { value: WarningType; label: string }[] = [
  { value: "low_response_rate",       label: "Low Response Rate" },
  { value: "inactivity",              label: "Inactivity" },
  { value: "excessive_cancellations", label: "Excessive Cancellations" },
  { value: "dispute_frequency",       label: "Dispute Frequency" },
  { value: "moderation_flags",        label: "Moderation Flag" },
  { value: "poor_reviews",            label: "Poor Reviews" },
  { value: "custom",                  label: "Custom Warning" },
];

const SEVERITIES: { value: WarningSeverity; label: string }[] = [
  { value: "low",      label: "Low" },
  { value: "medium",   label: "Medium" },
  { value: "high",     label: "High" },
  { value: "critical", label: "Critical" },
];

function HealthBar({ score, tier }: { score: number; tier: string }) {
  const color =
    tier === "excellent" ? "bg-emerald-500" :
    tier === "good"      ? "bg-green-500"   :
    tier === "fair"      ? "bg-amber-500"   :
    tier === "poor"      ? "bg-orange-500"  :
                           "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs tabular-nums text-slate-400 w-8 text-right">{score}</span>
    </div>
  );
}

export function AdminGovernanceDashboard({ atRiskVendors, activeWarnings, healthDistribution, totalApproved }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<"at_risk" | "warnings">("at_risk");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [warnModal, setWarnModal] = useState<{ vendorId: string; name: string } | null>(null);
  const [warnForm, setWarnForm] = useState<{ type: WarningType; severity: WarningSeverity; title: string; message: string; adminNotes: string }>({
    type: "custom", severity: "medium", title: "", message: "", adminNotes: "",
  });
  const [loading, setLoading] = useState(false);

  async function govAction(body: Record<string, unknown>, successMsg: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      toast.success(successMsg);
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  async function issueWarning() {
    if (!warnModal || !warnForm.title || !warnForm.message) {
      toast.error("Title and message are required");
      return;
    }
    await govAction(
      { action: "warn", vendor_id: warnModal.vendorId, ...warnForm, admin_notes: warnForm.adminNotes || undefined },
      "Warning issued"
    );
    setWarnModal(null);
    setWarnForm({ type: "custom", severity: "medium", title: "", message: "", adminNotes: "" });
  }

  async function resolveWarning(id: string) {
    await govAction({ action: "resolve_warning", warning_id: id }, "Warning resolved");
  }

  const atRisk = totalApproved > 0 ? atRiskVendors.length : 0;
  const criticalCount = atRiskVendors.filter((v) => v.health.tier === "critical").length;
  const totalWarnings = activeWarnings.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Vendor Governance</h1>
        <p className="text-slate-400 text-sm mt-1">Marketplace quality management and vendor health monitoring</p>
      </div>

      {/* Health distribution */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["excellent", "good", "fair", "poor", "critical"] as const).map((tier) => {
          const colors: Record<string, string> = {
            excellent: "text-emerald-400", good: "text-green-400",
            fair: "text-amber-400", poor: "text-orange-400", critical: "text-red-400",
          };
          const labels: Record<string, string> = {
            excellent: "Excellent", good: "Good", fair: "Fair", poor: "Poor", critical: "Critical",
          };
          return (
            <div key={tier} className="bg-white/4 border border-white/6 rounded-xl p-4">
              <div className={`text-2xl font-bold ${colors[tier]}`}>{healthDistribution[tier]}</div>
              <div className="text-xs text-slate-400 mt-0.5">{labels[tier]}</div>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-orange-400" />
            <span className="text-xs text-slate-400">At Risk</span>
          </div>
          <div className="text-xl font-bold text-orange-400">{atRisk}</div>
        </div>
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={14} className="text-red-400" />
            <span className="text-xs text-slate-400">Critical Health</span>
          </div>
          <div className="text-xl font-bold text-red-400">{criticalCount}</div>
        </div>
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className="text-amber-400" />
            <span className="text-xs text-slate-400">Active Warnings</span>
          </div>
          <div className="text-xl font-bold text-amber-400">{totalWarnings}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {(["at_risk", "warnings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${tab === t ? "bg-brand-500 text-white" : "text-slate-400 hover:text-white"}`}
          >
            {t === "at_risk" ? `At Risk (${atRisk})` : `Active Warnings (${totalWarnings})`}
          </button>
        ))}
      </div>

      {/* At-risk vendor list */}
      {tab === "at_risk" && (
        <div className="space-y-3">
          {atRiskVendors.length === 0 ? (
            <div className="bg-white/4 border border-white/6 rounded-xl p-12 text-center">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-400">No at-risk vendors. Marketplace is healthy.</p>
            </div>
          ) : (
            atRiskVendors.map((vendor) => {
              const isExpanded = expandedId === vendor.id;
              const topWarning = vendor.warnings[0];
              const lifecycleState = (vendor.health.isAtRisk || vendor.suspicious_flag ? "at_risk" : "marketplace_ready") as VendorLifecycleState;
              const meta = LIFECYCLE_STATE_META[lifecycleState];

              return (
                <div key={vendor.id} className="bg-white/4 border border-white/6 rounded-xl overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/vendors/${vendor.id}`} target="_blank" className="font-semibold text-white hover:text-brand-300 transition-colors text-sm">
                            {vendor.business_name}
                          </Link>
                          {vendor.suspicious_flag && (
                            <span className="text-xs px-1.5 py-0.5 rounded border bg-red-500/15 text-red-400 border-red-500/30">Flagged</span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${meta.badgeClass}`}>{meta.label}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {vendor.city} · {vendor.profile?.email}
                        </div>
                        <div className="mt-2 max-w-sm">
                          <HealthBar score={vendor.health.total} tier={vendor.health.tier} />
                        </div>
                        {topWarning && !isExpanded && (
                          <div className={`mt-2 inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${WARNING_SEVERITY_BADGE[topWarning.severity]}`}>
                            <AlertTriangle size={10} />
                            {topWarning.title}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setWarnModal({ vendorId: vendor.id, name: vendor.business_name })}
                          className="text-xs py-1.5 px-2.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-colors"
                        >
                          Issue Warning
                        </button>
                        {vendor.suspicious_flag ? (
                          <button
                            onClick={() => govAction({ action: "unflag", vendor_id: vendor.id }, "Flag removed")}
                            disabled={loading}
                            className="text-xs py-1.5 px-2.5 rounded-lg bg-slate-500/15 text-slate-400 border border-slate-500/25 hover:bg-slate-500/25 transition-colors flex items-center gap-1"
                          >
                            <FlagOff size={11} />Unflag
                          </button>
                        ) : (
                          <button
                            onClick={() => govAction({ action: "flag", vendor_id: vendor.id, reason: "Admin review" }, "Vendor flagged")}
                            disabled={loading}
                            className="text-xs py-1.5 px-2.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-colors flex items-center gap-1"
                          >
                            <Flag size={11} />Flag
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : vendor.id)}
                          className="text-xs py-1 px-2.5 text-slate-500 hover:text-white transition-colors flex items-center gap-1"
                        >
                          {isExpanded ? <><ChevronUp size={11} />Less</> : <><ChevronDown size={11} />Details</>}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-white/6 p-4 bg-white/2 space-y-4">
                      {/* Health factors */}
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-2">Health breakdown</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                          {Object.entries(vendor.health.factors).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between gap-2">
                              <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                              <span className={val < 0 ? "text-red-400" : "text-slate-300"}>{val > 0 ? "+" : ""}{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risk flags */}
                      {vendor.health.riskFlags.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-400 mb-2">Risk flags</p>
                          <div className="flex flex-wrap gap-1.5">
                            {vendor.health.riskFlags.map((flag) => (
                              <span key={flag} className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                {flag.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Active computed warnings */}
                      {vendor.warnings.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-400 mb-2">Computed warnings</p>
                          <div className="space-y-1.5">
                            {vendor.warnings.map((w) => (
                              <div key={w.type} className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${WARNING_SEVERITY_BADGE[w.severity]}`}>
                                <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-medium">{w.title}</span>
                                  <span className="text-opacity-70 ml-1">: {w.message}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Link href={`/admin/vendors?search=${encodeURIComponent(vendor.business_name)}`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
                        <Users size={10} />View in vendor management
                      </Link>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Active warnings list */}
      {tab === "warnings" && (
        <div className="space-y-3">
          {activeWarnings.length === 0 ? (
            <div className="bg-white/4 border border-white/6 rounded-xl p-12 text-center">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-400">No active warnings</p>
            </div>
          ) : (
            activeWarnings.map((w) => (
              <div key={w.id} className="bg-white/4 border border-white/6 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${WARNING_SEVERITY_BADGE[w.severity]}`}>
                        {w.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500">{WARNING_TYPE_LABEL[w.type]}</span>
                      {w.autoGenerated && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-slate-500 border border-white/8">Auto</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-white">{w.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{w.message}</p>
                    {w.vendor && (
                      <Link href={`/admin/vendors?search=${encodeURIComponent(w.vendor.business_name)}`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors mt-1 block">
                        {w.vendor.business_name}
                      </Link>
                    )}
                    <p className="text-xs text-slate-600 mt-1">{new Date(w.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => resolveWarning(w.id)}
                    disabled={loading}
                    className="text-xs py-1.5 px-3 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors flex items-center gap-1 flex-shrink-0"
                  >
                    <CheckCircle2 size={11} />Resolve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Issue warning modal */}
      {warnModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/6">
              <div>
                <h2 className="text-base font-bold text-white">Issue Warning</h2>
                <p className="text-sm text-slate-400 mt-0.5">{warnModal.name}</p>
              </div>
              <button onClick={() => setWarnModal(null)} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Warning Type</label>
                  <select
                    value={warnForm.type}
                    onChange={(e) => setWarnForm((f) => ({ ...f, type: e.target.value as WarningType }))}
                    className="input-field w-full text-sm"
                  >
                    {WARN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Severity</label>
                  <select
                    value={warnForm.severity}
                    onChange={(e) => setWarnForm((f) => ({ ...f, severity: e.target.value as WarningSeverity }))}
                    className="input-field w-full text-sm"
                  >
                    {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Title</label>
                <input
                  type="text"
                  value={warnForm.title}
                  onChange={(e) => setWarnForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Warning title..."
                  className="input-field w-full text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Message (visible to vendor)</label>
                <textarea
                  value={warnForm.message}
                  onChange={(e) => setWarnForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Explain what needs to be resolved..."
                  rows={3}
                  className="input-field w-full resize-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Admin notes (internal)</label>
                <textarea
                  value={warnForm.adminNotes}
                  onChange={(e) => setWarnForm((f) => ({ ...f, adminNotes: e.target.value }))}
                  placeholder="Internal context..."
                  rows={2}
                  className="input-field w-full resize-none text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setWarnModal(null)} className="flex-1 btn-secondary">Cancel</button>
              <button
                onClick={issueWarning}
                disabled={loading || !warnForm.title || !warnForm.message}
                className="flex-1 py-2 px-4 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {loading ? "Issuing…" : "Issue Warning"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
