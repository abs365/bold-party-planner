"use client";

import { useState, useEffect } from "react";
import { Sparkles, Zap, Star, Crown, CheckCircle, ArrowRight, Loader2, ExternalLink, AlertTriangle, Lock, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanRow {
  slug: string;
  name: string;
  monthly_price: number;
  annual_price: number;
  visibility_boost: number;
  max_images: number;
  max_packages: number;
  analytics_tier: string;
  featured_eligible: boolean;
  priority_support: boolean;
  features_json: { tagline?: string; highlights?: string[] };
  sort_order: number;
}

interface Subscription {
  plan: string;
  status: string;
  billing_cycle?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  stripe_customer_id?: string;
  failed_payment_count?: number;
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  free:     Star,
  pro:      Zap,
  premium:  Sparkles,
  featured: Sparkles,
  elite:    Crown,
};

const PLAN_COLORS: Record<string, { border: string; icon: string; bg: string; badge?: string; badgeText?: string }> = {
  free:     { border: "border-white/20",      icon: "text-white/60",   bg: "bg-white/10" },
  pro:      { border: "border-[#0B1F4D]/25", icon: "text-slate-400", bg: "bg-slate-500/20", badge: "Most Popular",       badgeText: "gradient-brand text-white" },
  premium:  { border: "border-amber-500/50",  icon: "text-amber-400",  bg: "bg-amber-500/20",  badge: "Maximum Visibility", badgeText: "bg-amber-500 text-white" },
  featured: { border: "border-amber-500/50",  icon: "text-amber-400",  bg: "bg-amber-500/20" },
  elite:    { border: "border-rose-500/50",   icon: "text-rose-400",   bg: "bg-rose-500/20",   badge: "Elite",              badgeText: "bg-gradient-to-r from-[#D4AF37] to-[#b8932a] text-white" },
};

function renderFeatureCell(value: string) {
  if (value === "✓") return <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />;
  return <>{value}</>;
}

const FEATURE_COMPARISON = [
  { feature: "Portfolio photos", free: "5", pro: "20", premium: "50", elite: "Unlimited" },
  { feature: "Video portfolio",  free: "-", pro: "✓",  premium: "✓",  elite: "✓" },
  { feature: "Service packages", free: "1", pro: "Unlimited", premium: "Unlimited", elite: "Unlimited" },
  { feature: "CRM contacts",     free: "25", pro: "Unlimited", premium: "Unlimited", elite: "Unlimited" },
  { feature: "Automatic follow-up reminders", free: "-", pro: "✓", premium: "✓", elite: "✓" },
  { feature: "Analytics dashboard", free: "Basic", pro: "Full", premium: "Advanced", elite: "Advanced" },
  { feature: "Search ranking boost", free: "-", pro: "+3", premium: "+6", elite: "+10" },
  { feature: "Smart lead boosts",   free: "-", pro: "✓", premium: "✓", elite: "✓" },
  { feature: "Category featured",   free: "-", pro: "-", premium: "✓", elite: "✓" },
  { feature: "Homepage featured",   free: "-", pro: "-", premium: "✓", elite: "✓" },
  { feature: "Priority support",    free: "-", pro: "-", premium: "-", elite: "✓" },
  { feature: "Business insights",   free: "-", pro: "-", premium: "-", elite: "✓" },
];

interface VendorSubscriptionViewProps {
  isFoundingVendor?: boolean;
  vendorStatus?: string;
  source?: string; // Phase 72 Priority 4 - attributes which nudge sent the vendor here
}

export function VendorSubscriptionView({ isFoundingVendor, vendorStatus, source }: VendorSubscriptionViewProps = {}) {
  const [data, setData] = useState<{ subscription: Subscription | null; plans: PlanRow[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/vendor/subscription")
      .then((r) => r.json())
      .then((d) => { setData(d as typeof data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function choosePlan(slug: string) {
    const currentPlan = data?.subscription?.plan ?? "free";
    if (slug === currentPlan) return;
    setUpgrading(slug);
    try {
      const res = await fetch("/api/vendor/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: slug, billing_cycle: annual ? "annual" : "monthly", source: source ?? "direct" }),
      });
      const result = await res.json() as { checkout_url?: string; success?: boolean; plan?: string; error?: string };
      if (result.error) {
        const { default: toast } = await import("react-hot-toast");
        toast.error(result.error.includes("price ID not configured")
          ? "Stripe is not configured yet. Contact support."
          : result.error);
      } else if (result.checkout_url) {
        window.location.assign(result.checkout_url);
      } else if (result.success) {
        setData((prev) => prev ? { ...prev, subscription: { ...prev.subscription!, plan: result.plan ?? "free" } } : prev);
      }
    } catch (err) {
      const { default: toast } = await import("react-hot-toast");
      toast.error(err instanceof Error ? err.message : "Upgrade failed. Please try again.");
    }
    setUpgrading(null);
  }

  async function cancelSubscription() {
    setCancelling(true);
    try {
      const res = await fetch("/api/vendor/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const result = await res.json() as { success?: boolean; error?: string };
      const { default: toast } = await import("react-hot-toast");
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Subscription set to cancel at the end of your current billing period.");
        setData((prev) => prev ? { ...prev, subscription: { ...prev.subscription!, cancel_at_period_end: true } } : prev);
        setShowCancelConfirm(false);
      }
    } catch (err) {
      const { default: toast } = await import("react-hot-toast");
      toast.error(err instanceof Error ? err.message : "Could not cancel subscription. Please try again.");
    }
    setCancelling(false);
  }

  async function openPortal() {
    setOpeningPortal(true);
    try {
      const res = await fetch("/api/subscriptions/portal", { method: "POST" });
      const result = await res.json() as { url?: string; error?: string };
      if (result.url) {
        window.location.assign(result.url);
      } else if (result.error) {
        const { default: toast } = await import("react-hot-toast");
        toast.error(result.error);
      }
    } catch (err) {
      const { default: toast } = await import("react-hot-toast");
      toast.error(err instanceof Error ? err.message : "Could not open billing portal.");
    }
    setOpeningPortal(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  const sub         = data?.subscription;
  const plans       = data?.plans ?? [];
  const currentPlan = sub?.plan ?? "free";
  const hasPaidPlan = currentPlan !== "free" && sub?.status === "active";
  const isPastDue   = sub?.status === "past_due";

  return (
    <div className="space-y-6">
      {/* Free plan: explain what a subscription gives */}
      {currentPlan === "free" && !hasPaidPlan && (
        <div className="bg-white/3 border border-white/6 rounded-xl p-4">
          <p className="text-white font-medium text-sm mb-1">You&apos;re on the Free plan</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            Your profile is live and visible to customers. Upgrading gives you priority search placement, more photos, analytics, and a Pro or Elite badge that builds customer confidence.
          </p>
        </div>
      )}

      {/* Current plan status bar */}
      {sub && sub.plan !== "free" && (
        <div className={cn(
          "border rounded-xl p-4 flex items-center justify-between",
          isPastDue ? "bg-red-500/10 border-red-500/30" : "bg-white/4 border-[#0B1F4D]/15"
        )}>
          <div>
            <p className="text-white font-medium">
              Current plan: <span className="text-slate-300 capitalize">{sub.plan}</span>
              {sub.billing_cycle && <span className="text-white/40 text-sm ml-2">({sub.billing_cycle})</span>}
            </p>
            {sub.current_period_end && (
              <p className="text-white/50 text-sm mt-0.5">
                {sub.cancel_at_period_end ? "Cancels on" : "Renews on"}{" "}
                {new Date(sub.current_period_end).toLocaleDateString("en-GB")}
              </p>
            )}
            {isPastDue && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertTriangle size={12} /> Payment failed. Update your payment method.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs border",
              sub.status === "active"   ? "bg-green-500/20 text-green-300 border-green-500/30" :
              sub.status === "past_due" ? "bg-red-500/20 text-red-300 border-red-500/30" :
              "bg-amber-500/20 text-amber-300 border-amber-500/30"
            )}>
              {sub.status}
            </span>
            {sub.stripe_customer_id && (
              <button
                onClick={() => void openPortal()}
                disabled={openingPortal}
                className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white border border-white/20 rounded-lg px-3 py-1.5 disabled:opacity-40"
              >
                {openingPortal ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                Manage billing
              </button>
            )}
            {!sub.cancel_at_period_end && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-sm text-white/40 hover:text-white/70 underline"
              >
                Cancel subscription
              </button>
            )}
          </div>
        </div>
      )}

      {/* Retention moment: cancelling only ever happened via Stripe's own
          portal before, giving Elbold no in-app touchpoint at the highest-
          risk moment. Shows what they'd lose before confirming - reuses the
          same plan.highlights already rendered on the plan cards below,
          rather than inventing new copy. */}
      {showCancelConfirm && sub && (
        <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-5">
          <p className="text-white font-medium mb-2">Before you cancel...</p>
          <p className="text-white/60 text-sm mb-3">
            You&apos;ll keep {sub.plan} access until {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("en-GB") : "the end of your billing period"}, then lose:
          </p>
          <div className="space-y-1.5 mb-4">
            {(plans.find((p) => p.slug === sub.plan)?.features_json.highlights ?? []).map((h) => (
              <div key={h} className="flex gap-2 text-sm text-white/70">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                {h}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="btn-primary text-sm py-2 px-4"
            >
              Keep my plan
            </button>
            <button
              onClick={() => void cancelSubscription()}
              disabled={cancelling}
              className="text-sm text-white/50 hover:text-white/80 disabled:opacity-40 px-4"
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Yes, cancel anyway"}
            </button>
          </div>
        </div>
      )}

      {/* Annual toggle */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-1">
          <button
            onClick={() => setAnnual(false)}
            className={cn("px-4 py-1.5 rounded-full text-sm transition-colors", !annual ? "bg-white/15 text-white font-medium" : "text-white/50")}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn("px-4 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5", annual ? "bg-white/15 text-white font-medium" : "text-white/50")}
          >
            Annual
            <span className="text-xs text-emerald-400 font-semibold">Save ~17%</span>
          </button>
        </div>
      </div>

      {/* Founding Vendor Benefit Banner */}
      {isFoundingVendor && (
        <div className="bg-[#0d1b3e] border border-[rgba(201,168,76,0.3)] rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,168,76,0.12)" }}>
              <Crown className="w-5 h-5" style={{ color: "#C9A84C" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-white">Founding Vendor Benefit Active</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)" }}>
                  Founding Vendor
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Your first 6 months of Pro membership are included at no cost.{" "}
                <span className="text-slate-500">Value: £174</span>
              </p>
              <p className="text-xs text-slate-500 mb-2 font-medium">Your founding benefits include:</p>
              <ul className="space-y-1">
                {[
                  "Priority placement",
                  "Founding Vendor badge",
                  "Early feature access",
                  "Reduced future pricing eligibility",
                ].map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle className="w-3 h-3 flex-shrink-0" style={{ color: "#C9A84C" }} />
                    {b}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-600 mt-3">Subscription billing begins after your founding period ends.</p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Vendor Guard */}
      {vendorStatus === "pending" && (
        <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-4 flex items-start gap-3">
          <Lock size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-0.5">Plans available after approval</p>
            <p className="text-xs text-slate-400">
              You can view and compare plans, but paid plans become available once your application is approved.
            </p>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {(plans.length > 0 ? plans : FALLBACK_PLANS).map((plan) => {
          const slug    = plan.slug;
          const colors  = PLAN_COLORS[slug] ?? PLAN_COLORS.free;
          const Icon    = PLAN_ICONS[slug] ?? Star;
          const isCurrent  = currentPlan === slug;
          const isUpgrading = upgrading === slug;
          const price   = annual ? plan.annual_price : plan.monthly_price;
          const period  = price === 0 ? "forever" : annual ? "/yr" : "/mo";
          const highlights = (plan.features_json as { highlights?: string[] })?.highlights ?? [];

          return (
            <div
              key={slug}
              className={cn(
                "bg-white/4 border rounded-xl p-5 flex flex-col relative",
                colors.border,
                isCurrent && "ring-2 ring-brand-500/50"
              )}
            >
              {colors.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={cn("text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap", colors.badgeText)}>
                    {colors.badge}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2.5 mb-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colors.bg)}>
                  <Icon className={cn("w-5 h-5", colors.icon)} />
                </div>
                <div>
                  <h3 className="text-white font-bold capitalize">{plan.name}</h3>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-bold text-white">
                      {price === 0 ? "£0" : `£${price}`}
                    </span>
                    <span className="text-white/40 text-xs">{period}</span>
                  </div>
                </div>
              </div>

              <p className="text-white/40 text-xs mb-3">
                {(plan.features_json as { tagline?: string })?.tagline ?? ""}
              </p>

              <div className="space-y-1.5 flex-1 mb-5">
                {highlights.map((h) => (
                  <div key={h} className="flex gap-2 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/75">{h}</span>
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <div className="btn-secondary text-center cursor-default opacity-60 text-sm py-2">Current Plan</div>
              ) : (
                <button
                  onClick={() => void choosePlan(slug)}
                  disabled={!!upgrading || (hasPaidPlan && slug === "free")}
                  className={cn(
                    "btn-primary flex items-center justify-center gap-2 text-sm py-2 disabled:opacity-40",
                    slug === "elite"   ? "bg-gradient-to-r from-[#D4AF37] to-[#b8932a] hover:from-[#E8C96A] hover:to-[#C9A84C]" :
                    slug === "premium" ? "bg-amber-500 hover:bg-amber-600" : ""
                  )}
                >
                  {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <ArrowRight className="w-3.5 h-3.5" />
                      {slug === "free" ? "Downgrade" :
                       slug === "pro" ? "Grow My Bookings" :
                       slug === "premium" || slug === "featured" ? "Get Featured" :
                       slug === "elite" ? "Go Elite" : "Upgrade"}
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-white/30 text-xs text-center">
        Subscriptions billed {annual ? "annually" : "monthly"}. Cancel anytime. Secure payments via Stripe.
        {annual && <> Annual plans save approximately 17% vs monthly billing.</>}
      </p>

      {/* Feature comparison table */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-white font-semibold mb-4">Plan Comparison</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-slate-400 font-normal py-2 pr-4">Feature</th>
              <th className="text-center text-slate-400 font-normal py-2 px-3">Free</th>
              <th className="text-center text-slate-400 font-semibold py-2 px-3">Pro</th>
              <th className="text-center text-amber-400 font-semibold py-2 px-3">Premium</th>
              <th className="text-center text-rose-400 font-semibold py-2 px-3">Elite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {FEATURE_COMPARISON.map((row) => (
              <tr key={row.feature}>
                <td className="py-2.5 pr-4 text-slate-400">{row.feature}</td>
                <td className="py-2.5 px-3 text-center text-slate-500">{renderFeatureCell(row.free)}</td>
                <td className="py-2.5 px-3 text-center text-slate-300">{renderFeatureCell(row.pro)}</td>
                <td className="py-2.5 px-3 text-center text-amber-300">{renderFeatureCell(row.premium)}</td>
                <td className="py-2.5 px-3 text-center text-rose-300">{renderFeatureCell(row.elite)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Fallback plan shapes for when DB isn't available (SSR race etc.)
const FALLBACK_PLANS: PlanRow[] = [
  { slug: "free",    name: "Free",    monthly_price: 0,   annual_price: 0,    visibility_boost: 0,  max_images: 5,  max_packages: 1,  analytics_tier: "basic",    featured_eligible: false, priority_support: false, features_json: { tagline: "Get started", highlights: ["Basic vendor profile","5 portfolio photos","1 service package"] }, sort_order: 0 },
  { slug: "pro",     name: "Pro",     monthly_price: 29,  annual_price: 279,  visibility_boost: 3,  max_images: 20, max_packages: -1, analytics_tier: "standard", featured_eligible: false, priority_support: false, features_json: { tagline: "Grow your bookings", highlights: ["Everything in Free","20 portfolio photos","Full analytics","+3 search boost"] }, sort_order: 1 },
  { slug: "premium", name: "Premium", monthly_price: 79,  annual_price: 759,  visibility_boost: 6,  max_images: 50, max_packages: -1, analytics_tier: "advanced", featured_eligible: true,  priority_support: false, features_json: { tagline: "Maximum visibility", highlights: ["Everything in Pro","50 portfolio photos","Featured placement","+6 search boost"] }, sort_order: 2 },
  { slug: "elite",   name: "Elite",   monthly_price: 149, annual_price: 1428, visibility_boost: 10, max_images: -1, max_packages: -1, analytics_tier: "advanced", featured_eligible: true,  priority_support: true,  features_json: { tagline: "Dominate your market", highlights: ["Everything in Premium","Unlimited media","Homepage featured","+10 search boost","Priority support"] }, sort_order: 3 },
];
