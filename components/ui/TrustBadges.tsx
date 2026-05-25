import { ShieldCheck, Clock, Star, Award, Zap, Lock, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadgesProps {
  className?: string;
  variant?: "row" | "compact" | "vertical";
}

export function TrustBadges({ className, variant = "row" }: TrustBadgesProps) {
  const badges = [
    { icon: ShieldCheck, label: "Secure Payments",   desc: "256-bit SSL encryption",     color: "text-emerald-400" },
    { icon: Lock,        label: "Protected Deposits", desc: "Money held in escrow",       color: "text-blue-400" },
    { icon: Star,        label: "Verified Reviews",   desc: "Real customers only",        color: "text-gold-400" },
    { icon: Zap,         label: "24h Response",       desc: "Average vendor reply time",  color: "text-brand-400" },
  ];

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {badges.map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-xs text-slate-400">
            <Icon size={11} className={color} />
            {label}
          </div>
        ))}
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={cn("space-y-2", className)}>
        {badges.map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="flex items-start gap-2.5">
            <Icon size={14} className={cn("flex-shrink-0 mt-0.5", color)} />
            <div>
              <div className="text-xs font-semibold text-white">{label}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3", className)}>
      {badges.map(({ icon: Icon, label, desc, color }) => (
        <div key={label} className="glass-card p-4 text-center">
          <Icon size={20} className={cn("mx-auto mb-2", color)} />
          <div className="text-xs font-semibold text-white">{label}</div>
          <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
        </div>
      ))}
    </div>
  );
}

interface VendorTrustBadgeProps {
  verified?: boolean;
  responseTimeHours?: number | null;
  reviewCount?: number;
  yearsExperience?: number | null;
  subscriptionPlan?: "free" | "pro" | "featured";
  className?: string;
}

export function VendorTrustBadge({
  verified,
  responseTimeHours,
  reviewCount,
  yearsExperience,
  subscriptionPlan,
  className,
}: VendorTrustBadgeProps) {
  const badges: { icon: React.ElementType; label: string; color: string }[] = [];

  if (verified) {
    badges.push({ icon: BadgeCheck, label: "Verified",          color: "text-emerald-400" });
  }
  if (subscriptionPlan === "featured") {
    badges.push({ icon: Award,      label: "Featured",          color: "text-gold-400" });
  } else if (subscriptionPlan === "pro") {
    badges.push({ icon: Zap,        label: "Pro Vendor",        color: "text-brand-400" });
  }
  if (reviewCount && reviewCount >= 5) {
    badges.push({ icon: Star,       label: `${reviewCount} Reviews`, color: "text-gold-400" });
  }
  if (responseTimeHours && responseTimeHours <= 4) {
    badges.push({ icon: Clock,      label: `Responds in ${responseTimeHours}h`, color: "text-blue-400" });
  } else if (!responseTimeHours) {
    badges.push({ icon: Clock,      label: "Fast Responder",    color: "text-blue-400" });
  }
  if (yearsExperience && yearsExperience >= 3) {
    badges.push({ icon: Award,      label: `${yearsExperience}+ Years Exp.`, color: "text-purple-400" });
  }

  if (badges.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.map(({ icon: Icon, label, color }) => (
        <span key={label} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/8 text-xs text-slate-400">
          <Icon size={10} className={color} />
          {label}
        </span>
      ))}
    </div>
  );
}

export function PlatformGuaranteeBanner({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card p-5 border border-emerald-500/15", className)}>
      <div className="flex items-start gap-3">
        <ShieldCheck size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-white text-sm mb-1">Bold Party Protection</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            All bookings are protected. Your deposit is held securely until service delivery.
            Full refund available if vendor cancels. Dispute resolution within 48 hours.
          </p>
          <div className="flex gap-3 mt-2">
            <span className="text-xs text-emerald-400">✓ Secure deposits</span>
            <span className="text-xs text-emerald-400">✓ Refund protection</span>
            <span className="text-xs text-emerald-400">✓ 24/7 support</span>
          </div>
        </div>
      </div>
    </div>
  );
}
