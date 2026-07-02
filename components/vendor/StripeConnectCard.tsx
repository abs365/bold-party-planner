"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck, Lock, Zap, TrendingUp, Building2,
  Loader2, ExternalLink, AlertTriangle, CheckCircle2, RefreshCw,
} from "lucide-react";

// Positioned as "Secure Business Verification" per Wave 3A - deliberately
// not framed as "Payout Setup". The commercial story: verification through
// Stripe increases customer confidence in the vendor and unlocks faster,
// more professional payment infrastructure - payouts are the mechanism,
// trust is the point.
const BENEFITS = [
  { icon: Lock,        label: "Secure, bank-grade payouts" },
  { icon: Zap,         label: "Faster payment processing" },
  { icon: ShieldCheck, label: "Trusted business verification" },
  { icon: TrendingUp,  label: "Increased customer confidence" },
  { icon: Building2,   label: "Professional payment infrastructure" },
];

interface ConnectStatus {
  status: "pending" | "restricted" | "active" | "disabled" | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  onboardedAt: string | null;
  latestOnboarding: {
    status: string;
    onboardingUrl: string | null;
    onboardingUrlExpiresAt: string | null;
    urlExpired: boolean;
  } | null;
}

type LoadState = "loading" | "unavailable" | "ready" | "error";

export function StripeConnectCard({ justConnected }: { justConnected?: boolean }) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const res = await fetch("/api/vendor/connect/status");
      if (res.status === 503) { setLoadState("unavailable"); return; }
      if (!res.ok) { setLoadState("error"); return; }
      const json = await res.json() as ConnectStatus;
      setStatus(json);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function startVerification() {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/vendor/connect/onboard", { method: "POST" });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) { setActionError(json.error ?? "Couldn't start verification. Please try again."); return; }
      window.location.href = json.url;
    } catch {
      setActionError("Couldn't start verification. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function refreshVerification() {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/vendor/connect/refresh", { method: "POST" });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) { setActionError(json.error ?? "Couldn't refresh your verification link."); return; }
      window.location.href = json.url;
    } catch {
      setActionError("Couldn't refresh your verification link.");
    } finally {
      setActionLoading(false);
    }
  }

  async function openDashboard() {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/vendor/connect/dashboard", { method: "POST" });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) { setActionError(json.error ?? "Couldn't open your payment dashboard."); return; }
      window.open(json.url, "_blank", "noopener,noreferrer");
    } catch {
      setActionError("Couldn't open your payment dashboard.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loadState === "loading") {
    return <div className="bg-white/4 border border-white/6 rounded-xl p-5 h-40 animate-pulse" />;
  }

  if (loadState === "error") return null; // fail quietly - the rest of the payouts page still works

  // Kill switch is off in this environment - show the positioning without
  // any interactive/broken elements, so this ships safely ahead of activation.
  if (loadState === "unavailable") {
    return (
      <div className="bg-gradient-to-br from-brand-500/10 to-transparent border border-brand-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={18} className="text-gold-400" />
          <h2 className="font-bold text-white">Secure Business Verification</h2>
          <span className="text-xs bg-white/8 text-white/50 px-2 py-0.5 rounded-full border border-white/10">Coming Soon</span>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Elbold is rolling out bank-grade business verification, powered by Stripe. Once live, verified vendors get faster, more secure payouts and a stronger trust signal with customers.
        </p>
        <BenefitsList />
      </div>
    );
  }

  const s = status!;
  const justSubmitted = justConnected && s.status === "pending";

  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={18} className={s.status === "active" ? "text-emerald-400" : "text-gold-400"} />
        <h2 className="font-bold text-white">Secure Business Verification</h2>
        <StatusBadge status={s.status} />
      </div>

      {s.status === "active" ? (
        <>
          <p className="text-sm text-slate-400 mb-4">
            Your business is verified. Payouts are processed securely through Stripe&apos;s professional payment infrastructure.
          </p>
          <button
            onClick={() => void openDashboard()}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
            Open Payment Dashboard
          </button>
        </>
      ) : justSubmitted ? (
        <div className="flex items-start gap-2.5 bg-emerald-500/8 border border-emerald-500/20 rounded-lg p-3 mb-2">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-300">
            Verification details submitted. Stripe is reviewing your information — this usually takes a few minutes to a couple of days. We&apos;ll email you once it&apos;s complete.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-400 mb-4">
            {s.status === null
              ? "Verify your business through Stripe's secure infrastructure to unlock faster payouts and build customer confidence."
              : s.status === "restricted"
              ? "Stripe needs a bit more information to complete your verification."
              : "Your verification needs attention before payouts can resume."}
          </p>
          <BenefitsList />
          <button
            onClick={() => void (s.status === null ? startVerification() : refreshVerification())}
            disabled={actionLoading}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-gold-400/15 text-gold-400 border border-gold-400/30 hover:bg-gold-400/25 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : s.status === null ? <ShieldCheck size={14} /> : <RefreshCw size={14} />}
            {s.status === null ? "Start Secure Verification" : "Continue Verification"}
          </button>
        </>
      )}

      {actionError && (
        <div className="flex items-start gap-2 mt-3 text-sm text-red-400">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          {actionError}
        </div>
      )}
    </div>
  );
}

function BenefitsList() {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
      {BENEFITS.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2 text-xs text-slate-400">
          <Icon size={12} className="text-slate-500 flex-shrink-0" />
          {label}
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ status }: { status: ConnectStatus["status"] }) {
  if (status === "active") {
    return <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 size={10} />Verified</span>;
  }
  if (status === "pending") {
    return <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">In progress</span>;
  }
  if (status === "restricted" || status === "disabled") {
    return <span className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">Action needed</span>;
  }
  return null;
}
