import { ShieldCheck, Clock, Star, Award, Zap, Lock, BadgeCheck, Users, TrendingUp, CheckCircle2, Sparkles } from "lucide-react";
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
        <div key={label} className="bg-white/4 border border-white/6 rounded-xl p-4 text-center">
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
    badges.push({ icon: Award,      label: `${yearsExperience}+ Years Exp.`, color: "text-slate-400" });
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
    <div className={cn("bg-white/4 rounded-xl p-5 border border-emerald-500/15", className)}>
      <div className="flex items-start gap-3">
        <ShieldCheck size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-white text-sm mb-1">ELBOLD Events Protection</h4>
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

interface MarketplaceStatsBarProps {
  className?: string;
  vendorCount?: number;
  eventsPlanned?: number;
  avgRating?: number;
}

export function MarketplaceStatsBar({ className, vendorCount = 500, eventsPlanned = 2400, avgRating = 4.9 }: MarketplaceStatsBarProps) {
  const stats = [
    { icon: CheckCircle2, label: `${vendorCount}+ Verified Vendors`, color: "text-brand-400" },
    { icon: Users,        label: `${eventsPlanned.toLocaleString()}+ Events Planned`, color: "text-emerald-400" },
    { icon: Star,         label: `${avgRating}★ Average Rating`, color: "text-amber-400" },
    { icon: ShieldCheck,  label: "Manually Vetted", color: "text-blue-400" },
  ];

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-5 gap-y-2", className)}>
      {stats.map(({ icon: Icon, label, color }, i) => (
        <span key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
          <Icon size={12} className={color} />
          {label}
        </span>
      ))}
    </div>
  );
}

interface BookingProtectionCardProps {
  className?: string;
  depositAmount?: number;
  vendorName?: string;
}

export function BookingProtectionCard({ className, depositAmount, vendorName }: BookingProtectionCardProps) {
  return (
    <div className={cn("rounded-xl overflow-hidden border border-emerald-200 bg-white", className)}>
      <div className="bg-emerald-50 px-5 py-4 flex items-center gap-3 border-b border-emerald-100">
        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={18} className="text-emerald-600" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">Booking Protection</h4>
          <p className="text-emerald-700 text-xs">ELBOLD Events Guarantee</p>
        </div>
        <Sparkles size={13} className="text-emerald-500 ml-auto" />
      </div>

      <div className="px-5 py-4 space-y-3">
        {[
          { icon: Lock,        text: depositAmount ? `£${depositAmount.toFixed(0)} held securely until your event` : "Your deposit held securely in escrow",  color: "text-blue-500" },
          { icon: ShieldCheck, text: "Full refund if vendor cancels or no-shows",   color: "text-emerald-500" },
          { icon: Clock,       text: "Dispute resolution within 48 hours",          color: "text-amber-500" },
          { icon: Star,        text: "Verified reviews from real customers only",   color: "text-amber-500" },
        ].map(({ icon: Icon, text, color }, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Icon size={13} className={cn("flex-shrink-0 mt-0.5", color)} />
            <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          {vendorName ? `Booking with ${vendorName} is fully protected` : "All bookings on ELBOLD Events are protected"}
        </p>
      </div>
    </div>
  );
}

interface ResponseTimeProps {
  avgHours?: number | null;
  className?: string;
}

export function ResponseTimePill({ avgHours, className }: ResponseTimeProps) {
  if (!avgHours && avgHours !== 0) return null;
  const label = avgHours < 1 ? "Under 1 hour" : avgHours <= 4 ? `~${avgHours}h response` : avgHours <= 24 ? `~${avgHours}h response` : "1–3 day response";
  const color = avgHours <= 4 ? "text-emerald-700 border-emerald-200 bg-emerald-50" : avgHours <= 24 ? "text-amber-700 border-amber-200 bg-amber-50" : "text-gray-500 border-gray-200 bg-gray-50";
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium", color, className)}>
      <TrendingUp size={10} />
      {label}
    </span>
  );
}

interface CompletedJobsPillProps {
  reviewCount?: number;
  className?: string;
}

export function CompletedJobsPill({ reviewCount, className }: CompletedJobsPillProps) {
  if (!reviewCount || reviewCount < 1) return null;
  const jobsEstimate = Math.floor(reviewCount * 1.4);
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-[#0B1F4D] text-xs font-medium", className)}>
      <Users size={10} />
      {jobsEstimate}+ events completed
    </span>
  );
}
