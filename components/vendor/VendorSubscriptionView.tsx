"use client";

import { useState, useEffect } from "react";
import { Sparkles, Zap, Star, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subscription {
  plan: "free" | "pro" | "featured";
  status: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "£0",
    period: "forever",
    icon: Star,
    color: "border-white/20",
    badge: "",
    features: [
      "Basic vendor profile",
      "Up to 5 portfolio photos",
      "Standard search listing",
      "Quote requests",
      "1 service package",
    ],
    missing: ["Featured placement", "Priority search ranking", "Smart lead boosts", "Analytics dashboard", "Unlimited media"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "£29",
    period: "/month",
    icon: Zap,
    color: "border-purple-500/50",
    badge: "Most Popular",
    features: [
      "Everything in Free",
      "Up to 20 portfolio photos & videos",
      "Priority search ranking",
      "Full analytics dashboard",
      "Unlimited service packages",
      "Smart lead boosts",
      "Pro badge on profile",
      "Booking performance insights",
    ],
    missing: ["Featured listing placement", "Homepage showcase"],
  },
  {
    id: "featured",
    name: "Featured",
    price: "£79",
    period: "/month",
    icon: Sparkles,
    color: "border-amber-500/50",
    badge: "Maximum Visibility",
    features: [
      "Everything in Pro",
      "Featured listing on homepage",
      "Top placement in category search",
      "Featured badge on profile",
      "Priority customer support",
      "Quarterly business review",
      "Custom profile URL",
    ],
    missing: [],
  },
];

export function VendorSubscriptionView() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vendor/subscription")
      .then((r) => r.json())
      .then((d) => { setSubscription(d as Subscription); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function choosePlan(planId: string) {
    if (planId === subscription?.plan) return;
    setUpgrading(planId);
    try {
      const res = await fetch("/api/vendor/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json() as { checkout_url?: string; success?: boolean; plan?: string };
      if (data.checkout_url) window.location.assign(data.checkout_url);
      else if (data.success) setSubscription((s) => ({ ...s!, plan: data.plan as "free" | "pro" | "featured" }));
    } catch { /* empty */ }
    setUpgrading(null);
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-white/40" /></div>;

  const currentPlan = subscription?.plan ?? "free";

  return (
    <div className="space-y-6">
      {subscription?.plan !== "free" && (
        <div className="bg-white/4 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Current plan: <span className="text-purple-300 capitalize">{currentPlan}</span></p>
            {subscription?.current_period_end && (
              <p className="text-white/50 text-sm mt-0.5">
                {subscription.cancel_at_period_end ? "Cancels on" : "Renews on"}{" "}
                {new Date(subscription.current_period_end).toLocaleDateString("en-GB")}
              </p>
            )}
          </div>
          <span className={cn("px-2 py-1 rounded-full text-xs border", subscription?.status === "active" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30")}>
            {subscription?.status ?? "active"}
          </span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          const isUpgrading = upgrading === plan.id;
          return (
            <div key={plan.id} className={cn("bg-white/4 border rounded-xl p-6 flex flex-col relative", plan.color, isCurrent && "ring-2 ring-brand-500/50")}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="gradient-brand text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">{plan.badge}</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", plan.id === "featured" ? "bg-amber-500/20" : plan.id === "pro" ? "bg-purple-500/20" : "bg-white/10")}>
                  <Icon className={cn("w-5 h-5", plan.id === "featured" ? "text-amber-400" : plan.id === "pro" ? "text-purple-400" : "text-white/60")} />
                </div>
                <div>
                  <h3 className="text-white font-bold">{plan.name}</h3>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/40 text-xs">{plan.period}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 flex-1 mb-5">
                {plan.features.map((f) => (
                  <div key={f} className="flex gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80">{f}</span>
                  </div>
                ))}
                {plan.missing.map((f) => (
                  <div key={f} className="flex gap-2 text-sm opacity-30">
                    <CheckCircle className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                    <span className="text-white/40 line-through">{f}</span>
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <div className="btn-secondary text-center cursor-default opacity-60">Current Plan</div>
              ) : (
                <button onClick={() => void choosePlan(plan.id)} disabled={!!upgrading}
                  className={cn("btn-primary flex items-center justify-center gap-2 disabled:opacity-40", plan.id === "featured" ? "bg-amber-500 hover:bg-amber-600" : "")}>
                  {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" />{plan.id === "free" ? "Downgrade" : "Upgrade"}</>}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-white/30 text-xs text-center">Subscriptions are billed monthly. Cancel anytime. Secure payments via Stripe.</p>

      {/* Plan comparison table */}
      <div className="bg-white/4 border border-white/6 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-white font-semibold mb-4">Plan Feature Comparison</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-slate-400 font-normal py-2 pr-4">Feature</th>
              <th className="text-center text-slate-400 font-normal py-2 px-4">Free</th>
              <th className="text-center text-purple-400 font-semibold py-2 px-4">Pro</th>
              <th className="text-center text-amber-400 font-semibold py-2 px-4">Featured</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              { feature: "Profile photos", free: "5", pro: "20", featured: "Unlimited" },
              { feature: "Video portfolio", free: "—", pro: "✓", featured: "✓" },
              { feature: "Service packages", free: "1", pro: "Unlimited", featured: "Unlimited" },
              { feature: "Analytics dashboard", free: "—", pro: "✓", featured: "✓" },
              { feature: "Priority search ranking", free: "—", pro: "✓", featured: "✓" },
              { feature: "Smart lead boosts", free: "—", pro: "✓", featured: "✓" },
              { feature: "Pro badge", free: "—", pro: "✓", featured: "✓" },
              { feature: "Homepage featured", free: "—", pro: "—", featured: "✓" },
              { feature: "Top category placement", free: "—", pro: "—", featured: "✓" },
              { feature: "Featured badge", free: "—", pro: "—", featured: "✓" },
              { feature: "Priority support", free: "—", pro: "—", featured: "✓" },
            ].map((row) => (
              <tr key={row.feature}>
                <td className="py-2.5 pr-4 text-slate-400">{row.feature}</td>
                <td className="py-2.5 px-4 text-center text-slate-500">{row.free}</td>
                <td className="py-2.5 px-4 text-center text-purple-300">{row.pro}</td>
                <td className="py-2.5 px-4 text-center text-amber-300">{row.featured}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
