"use client";

import Link from "next/link";
import {
  AlertTriangle, CheckCircle2, Shield, Activity, TrendingDown,
  ArrowRight, Info, XCircle, Zap,
} from "lucide-react";
import type { VendorHealthScore } from "@/lib/vendor/health";
import type { ComputedWarning } from "@/lib/vendor/warnings";
import { WARNING_SEVERITY_BADGE } from "@/lib/vendor/warnings";
import type { GovernanceResult } from "@/lib/vendor/governance";
import { LIFECYCLE_STATE_META } from "@/lib/vendor/governance";

interface Props {
  governance: GovernanceResult;
  health: VendorHealthScore;
  computedWarnings: ComputedWarning[];
}

const HEALTH_BAR_COLOR = (score: number) =>
  score >= 80 ? "from-emerald-500 to-emerald-400" :
  score >= 60 ? "from-green-500 to-green-400"    :
  score >= 40 ? "from-amber-500 to-amber-400"    :
  score >= 20 ? "from-orange-500 to-orange-400"  :
                "from-red-500 to-red-400";

const HEALTH_TEXT_COLOR = (score: number) =>
  score >= 80 ? "text-emerald-400" :
  score >= 60 ? "text-green-400"   :
  score >= 40 ? "text-amber-400"   :
  score >= 20 ? "text-orange-400"  :
                "text-red-400";

function LifecycleIcon({ state }: { state: string }) {
  if (state === "optimised")          return <Zap size={14} className="text-brand-400" />;
  if (state === "marketplace_ready")  return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (state === "at_risk")            return <AlertTriangle size={14} className="text-orange-400" />;
  if (state === "setup")              return <Info size={14} className="text-slate-400" />;
  if (state === "suspended")          return <XCircle size={14} className="text-red-400" />;
  return <Shield size={14} className="text-slate-400" />;
}

export function VendorGovernanceWidget({ governance, health, computedWarnings }: Props) {
  const { lifecycleState, capabilities, visibilityReason } = governance;
  const meta = LIFECYCLE_STATE_META[lifecycleState];
  const activeWarnings = computedWarnings.filter((w) => w.severity !== "low");
  const showWarnings = activeWarnings.length > 0;

  return (
    <div className="bg-white/4 border border-white/6 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-slate-400" />
          <span className="text-sm font-semibold text-white">Marketplace Status</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${meta.badgeClass}`}>
          {meta.label}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Visibility */}
        <div className="flex items-start gap-2.5">
          <LifecycleIcon state={lifecycleState} />
          <p className="text-xs text-slate-300 leading-relaxed">{visibilityReason}</p>
        </div>

        {/* Health score */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 font-medium">Health Score</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold ${HEALTH_TEXT_COLOR(health.total)}`}>
                {health.total}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full border ${health.tierBadgeClass}`}>
                {health.tierLabel}
              </span>
            </div>
          </div>
          <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full bg-gradient-to-r transition-all duration-500 ${HEALTH_BAR_COLOR(health.total)}`}
              style={{ width: `${health.total}%` }}
            />
          </div>
        </div>

        {/* Active warnings */}
        {showWarnings && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400">
              {activeWarnings.length === 1 ? "1 active concern" : `${activeWarnings.length} active concerns`}
            </p>
            {activeWarnings.slice(0, 3).map((w) => (
              <div
                key={w.type}
                className={`flex items-start gap-2 p-2.5 rounded-lg border ${WARNING_SEVERITY_BADGE[w.severity]}`}
              >
                <TrendingDown size={12} className="flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium">{w.title}</p>
                  <p className="text-xs opacity-80 mt-0.5 leading-snug">{w.vendorFacingMessage}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Healthy state */}
        {!showWarnings && lifecycleState === "optimised" && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 size={12} />
            <span>Top-tier vendor — priority placement active</span>
          </div>
        )}

        {!showWarnings && lifecycleState === "marketplace_ready" && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 size={12} />
            <span>Account in good standing</span>
          </div>
        )}

        {/* Capability flags — only show what's restricted */}
        {(!capabilities.canReceiveQuotes || !capabilities.canBeFeatured) && (
          <div className="border-t border-white/5 pt-3 space-y-1.5">
            <p className="text-xs font-medium text-slate-500">Current restrictions</p>
            {!capabilities.canReceiveQuotes && (
              <div className="flex items-center gap-1.5 text-xs text-orange-400">
                <XCircle size={10} />
                <span>Quote requests paused</span>
              </div>
            )}
            {!capabilities.canReceiveBookings && (
              <div className="flex items-center gap-1.5 text-xs text-orange-400">
                <XCircle size={10} />
                <span>New bookings paused</span>
              </div>
            )}
            {!capabilities.canBeFeatured && capabilities.canAppearInMarketplace && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <XCircle size={10} />
                <span>Not eligible for featured placement</span>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        {(showWarnings || lifecycleState === "setup" || lifecycleState === "at_risk") && (
          <Link
            href="/vendor/onboarding"
            className="flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors pt-1 border-t border-white/5"
          >
            <span>View improvement checklist</span>
            <ArrowRight size={11} />
          </Link>
        )}
      </div>
    </div>
  );
}
