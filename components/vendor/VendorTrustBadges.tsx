import { BadgeCheck, Shield, Star, Zap, Clock, Briefcase, ShieldCheck, Heart, Award, CheckCircle2, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { VERIFICATION_LEVELS } from "@/lib/verification-requirements";

// ── Named trust badges ────────────────────────────────────────────────────────

export interface TrustBadgeSpec {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export function getVendorBadges(vendor: {
  verification_level?: number;
  verified?: boolean;
  response_rate?: number | null;
  rating?: number;
  review_count?: number;
  completed_jobs_count?: number;
  cancellation_rate?: number | null;
  trust_tier?: string | null;
  repeat_customer_count?: number;
}): TrustBadgeSpec[] {
  const badges: TrustBadgeSpec[] = [];
  const level = vendor.verification_level ?? (vendor.verified ? 1 : 0);

  // Level 4 = Business Verified (admin-approved business registration documents)
  // Level 3 = Address Verified (admin-approved proof of address)
  // Level 2 = ID Verified (admin-approved government ID)
  // Level 1 = Email Verified (auto-granted, no documents checked)
  // Level 0 = Unverified (no badge shown to customers)

  // Trusted Professional: dynamically computed from track record (requires Level 2+)
  const tpRespRate  = vendor.response_rate ?? 0;
  const tpJobs      = vendor.completed_jobs_count ?? 0;
  const tpRating    = vendor.rating ?? 0;
  const isTrustedPro = level >= 2 && tpJobs >= 5 && tpRating >= 4.5 && tpRespRate >= 80;

  if (isTrustedPro) badges.push({
    id: "trusted_pro",
    label: "Trusted Professional",
    description: `${tpJobs}+ completed events, ${tpRating.toFixed(1)}★, ${Math.round(tpRespRate)}% response rate`,
    icon: Star,
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    textClass: "text-amber-700",
  });
  else if (level >= 4) badges.push({
    id: "business_verified",
    label: "Business Verified",
    description: "Business registration documents verified by ELBOLD",
    icon: ShieldCheck,
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    textClass: "text-blue-700",
  });
  else if (level >= 3) badges.push({
    id: "address_verified",
    label: "Address Verified",
    description: "Proof of address verified by ELBOLD",
    icon: ShieldCheck,
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    textClass: "text-blue-700",
  });
  else if (level >= 2) badges.push({
    id: "id_verified",
    label: "ID Verified",
    description: "Government ID verified by ELBOLD",
    icon: BadgeCheck,
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    textClass: "text-emerald-700",
  });
  // Level 1 (email verified) intentionally shows no customer-facing badge —
  // no documents were checked so no "Verified" claim should appear to customers.

  const responseRate = vendor.response_rate ?? 0;
  if (responseRate >= 80) badges.push({
    id: "fast_responder",
    label: "Fast Responder",
    description: `${Math.round(responseRate)}% quote response rate`,
    icon: Zap,
    bgClass: "bg-purple-50",
    borderClass: "border-purple-200",
    textClass: "text-purple-700",
  });

  const rating = vendor.rating ?? 0;
  const reviewCount = vendor.review_count ?? 0;
  if (rating >= 4.8 && reviewCount >= 10) badges.push({
    id: "top_rated",
    label: "Top Rated",
    description: `${rating.toFixed(1)}★ from ${reviewCount} reviews`,
    icon: Star,
    bgClass: "bg-yellow-50",
    borderClass: "border-yellow-200",
    textClass: "text-yellow-700",
  });

  const jobs = vendor.completed_jobs_count ?? 0;
  const cancelRate = vendor.cancellation_rate ?? 0;
  if (jobs >= 20 && cancelRate < 5) badges.push({
    id: "reliable",
    label: "Reliable",
    description: `${jobs} completed events, low cancellation`,
    icon: Shield,
    bgClass: "bg-gray-50",
    borderClass: "border-gray-200",
    textClass: "text-gray-700",
  });
  else if (jobs >= 10) badges.push({
    id: "highly_active",
    label: "Highly Active",
    description: `${jobs}+ completed events`,
    icon: Briefcase,
    bgClass: "bg-slate-50",
    borderClass: "border-slate-200",
    textClass: "text-slate-600",
  });

  // ── Reputation-driven badges ────────────────────────────────────────────────
  const tier    = vendor.trust_tier ?? "new";
  const repeats = vendor.repeat_customer_count ?? 0;

  if (tier === "exceptional") {
    badges.push({
      id: "exceptional_service",
      label: "Exceptional Service",
      description: "Elite vendor with outstanding verified review record",
      icon: Award,
      bgClass: "bg-rose-50",
      borderClass: "border-rose-200",
      textClass: "text-rose-700",
    });
  }

  if (repeats >= 3) {
    badges.push({
      id: "customer_favourite",
      label: "Customer Favourite",
      description: `${repeats} repeat customers`,
      icon: Heart,
      bgClass: "bg-pink-50",
      borderClass: "border-pink-200",
      textClass: "text-pink-700",
    });
  }

  if (jobs >= 15 && cancelRate < 5) {
    badges.push({
      id: "consistently_reliable",
      label: "Consistently Reliable",
      description: "Low cancellation rate across 15+ events",
      icon: CheckCircle2,
      bgClass: "bg-emerald-50",
      borderClass: "border-emerald-200",
      textClass: "text-emerald-700",
    });
  }

  if (tier === "top_rated" || tier === "exceptional") {
    badges.push({
      id: "highly_recommended",
      label: "Highly Recommended",
      description: "Consistently top-rated by verified customers",
      icon: ThumbsUp,
      bgClass: "bg-indigo-50",
      borderClass: "border-indigo-200",
      textClass: "text-indigo-700",
    });
  }

  return badges;
}

interface VendorBadgesRowProps {
  vendor: Parameters<typeof getVendorBadges>[0];
  className?: string;
  max?: number;
}

export function VendorBadgesRow({ vendor, className, max = 4 }: VendorBadgesRowProps) {
  const badges = getVendorBadges(vendor).slice(0, max);
  if (badges.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <span
            key={badge.id}
            title={badge.description}
            className={cn(
              "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium",
              badge.bgClass, badge.borderClass, badge.textClass
            )}
          >
            <Icon size={10} />
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}

interface VendorTrustBadgesProps {
  verificationLevel?: number;
  verified?: boolean;
  responseRate?: number | null;
  completedJobsCount?: number;
  yearsExperience?: number | null;
  cancellationRate?: number | null;
  className?: string;
  compact?: boolean;
}

export function VendorTrustBadges({
  verificationLevel = 0,
  verified = false,
  responseRate,
  completedJobsCount = 0,
  yearsExperience,
  cancellationRate,
  className,
  compact = false,
}: VendorTrustBadgesProps) {
  const level = Math.max(verificationLevel, verified ? 1 : 0);
  const levelConfig = VERIFICATION_LEVELS[level];

  if (level === 0 && !responseRate && !completedJobsCount && !yearsExperience) return null;

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        {level >= 1 && (
          <span className={cn(
            "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium",
            levelConfig.bg, levelConfig.border, levelConfig.color
          )}>
            <BadgeCheck size={10} />
            {levelConfig.label}
          </span>
        )}
        {completedJobsCount >= 5 && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <Briefcase size={10} />
            {completedJobsCount}+ jobs
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Verification level */}
      {level >= 1 && (
        <div className={cn(
          "flex items-center gap-2 rounded-xl border p-3",
          levelConfig.bg, levelConfig.border
        )}>
          {level >= 3 ? (
            <Star size={15} className={levelConfig.color} fill="currentColor" />
          ) : (
            <BadgeCheck size={15} className={levelConfig.color} />
          )}
          <div>
            <div className={cn("text-sm font-semibold", levelConfig.color)}>
              {levelConfig.label}
            </div>
            {"description" in levelConfig && (
              <div className="text-xs text-gray-500">{levelConfig.description}</div>
            )}
          </div>
        </div>
      )}

      {/* Trust metrics */}
      <div className="grid grid-cols-2 gap-2">
        {responseRate !== null && responseRate !== undefined && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
            <Zap size={14} className="text-amber-500 mx-auto mb-1" />
            <div className="text-base font-bold text-gray-900">{Math.round(responseRate)}%</div>
            <div className="text-xs text-gray-500">Response rate</div>
          </div>
        )}

        {completedJobsCount > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
            <Briefcase size={14} className="text-brand-600 mx-auto mb-1" />
            <div className="text-base font-bold text-gray-900">{completedJobsCount}+</div>
            <div className="text-xs text-gray-500">Completed jobs</div>
          </div>
        )}

        {yearsExperience !== null && yearsExperience !== undefined && yearsExperience > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
            <Clock size={14} className="text-slate-500 mx-auto mb-1" />
            <div className="text-base font-bold text-gray-900">{yearsExperience}</div>
            <div className="text-xs text-gray-500">Years active</div>
          </div>
        )}

        {level >= 2 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
            <Shield size={14} className="text-blue-500 mx-auto mb-1" />
            <div className="text-sm font-bold text-gray-900">Verified</div>
            <div className="text-xs text-gray-500">ID &amp; docs checked</div>
          </div>
        )}
      </div>

      {cancellationRate !== null && cancellationRate !== undefined && cancellationRate <= 5 && completedJobsCount >= 5 && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <BadgeCheck size={12} className="text-green-600" />
          Low cancellation rate · Reliable vendor
        </div>
      )}
    </div>
  );
}
