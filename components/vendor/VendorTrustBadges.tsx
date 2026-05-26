import { BadgeCheck, Shield, Star, Zap, Clock, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { VERIFICATION_LEVELS } from "@/lib/verification-requirements";

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
