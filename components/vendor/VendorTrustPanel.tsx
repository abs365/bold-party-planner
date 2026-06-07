import { BadgeCheck, Calendar, Star, MessageSquare, Clock, Shield, TrendingUp, Phone, CheckCircle2, Award, Zap } from "lucide-react";
import type { Vendor } from "@/types";

interface Props {
  vendor: Pick<
    Vendor,
    | "created_at"
    | "completed_jobs_count"
    | "review_count"
    | "rating"
    | "response_rate"
    | "verification_level"
    | "last_active_at"
    | "verified"
    | "subscription_plan"
  > & {
    phone_verified?: boolean;
  };
}

function verificationLabel(level: number): string {
  if (level >= 4) return "Premium Partner";
  if (level >= 3) return "Trusted Pro";
  if (level >= 2) return "ID Verified";
  if (level >= 1) return "ELBOLD Approved";
  return "Pending Review";
}

function verificationDescription(level: number): string {
  if (level >= 4) return "Invite-only status. Highest trust tier with full business verification.";
  if (level >= 3) return "5+ completed events, 4.5+ rating, and 80%+ response rate verified.";
  if (level >= 2) return "Government ID reviewed and verified by the ELBOLD team.";
  if (level >= 1) return "Email confirmed and vendor application reviewed by ELBOLD.";
  return "This vendor is under review.";
}

function verificationColor(level: number): { bg: string; border: string; text: string; icon: string } {
  if (level >= 4) return { bg: "rgba(212,175,55,0.1)", border: "rgba(212,175,55,0.3)", text: "#8B6914", icon: "#D4AF37" };
  if (level >= 3) return { bg: "rgba(11,31,77,0.07)", border: "rgba(11,31,77,0.15)", text: "#0B1F4D", icon: "#0B1F4D" };
  if (level >= 2) return { bg: "rgba(5,150,105,0.07)", border: "rgba(5,150,105,0.2)", text: "#065f46", icon: "#059669" };
  return { bg: "#f9fafb", border: "#e5e7eb", text: "#374151", icon: "#6b7280" };
}

function memberSince(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB", { month: "long", year: "numeric" });
}

function lastActiveSince(dateStr: string | null | undefined): string {
  if (!dateStr) return "Recently";
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function VendorTrustPanel({ vendor }: Props) {
  const level = vendor.verification_level ?? 0;
  const isVerified = level >= 1;
  const colors = verificationColor(level);

  const trustBadges: Array<{
    show: boolean;
    icon: React.ElementType;
    label: string;
    sublabel: string;
    active: boolean;
  }> = [
    {
      show: isVerified,
      icon: CheckCircle2,
      label: "ELBOLD Approved",
      sublabel: "Application reviewed by our team",
      active: true,
    },
    {
      show: level >= 2,
      icon: BadgeCheck,
      label: "Identity Verified",
      sublabel: "Government ID confirmed",
      active: level >= 2,
    },
    {
      show: true,
      icon: Phone,
      label: "Phone Confirmed",
      sublabel: vendor.phone_verified ? "Phone number verified" : "Phone on file",
      active: !!vendor.phone_verified,
    },
    {
      show: level >= 4,
      icon: Award,
      label: "Document Verified",
      sublabel: "Business registration confirmed",
      active: level >= 4,
    },
    {
      show: vendor.subscription_plan === "featured" || vendor.subscription_plan === "premium" || vendor.subscription_plan === "elite",
      icon: Zap,
      label: "Featured Vendor",
      sublabel: "Selected for premium placement",
      active: true,
    },
    {
      show: (vendor.rating ?? 0) >= 4.5 && (vendor.review_count ?? 0) >= 5,
      icon: Star,
      label: "Top Rated",
      sublabel: `${(vendor.rating ?? 0).toFixed(1)} avg from ${vendor.review_count} reviews`,
      active: true,
    },
  ].filter((b) => b.show);

  return (
    <div className="space-y-4">

      {/* Primary verification badge */}
      {isVerified && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: colors.bg,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "white", border: `1px solid ${colors.border}` }}
            >
              <Shield size={18} style={{ color: colors.icon }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold" style={{ color: colors.text }}>
                  {verificationLabel(level)}
                </span>
                {level >= 2 && (
                  <BadgeCheck size={14} style={{ color: colors.icon }} />
                )}
              </div>
              <p className="text-xs font-light leading-relaxed" style={{ color: colors.text, opacity: 0.75 }}>
                {verificationDescription(level)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trust badge grid */}
      {trustBadges.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Trust Signals
          </p>
          <div className="space-y-3">
            {trustBadges.map(({ icon: Icon, label, sublabel, active }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: active ? "rgba(11,31,77,0.06)" : "#f9fafb",
                  }}
                >
                  <Icon
                    size={13}
                    style={{ color: active ? "#0B1F4D" : "#d1d5db" }}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 leading-none mb-0.5">
                    {label}
                  </p>
                  <p className="text-xs text-gray-400 font-light">{sublabel}</p>
                </div>
                {active && (
                  <CheckCircle2
                    size={12}
                    className="ml-auto flex-shrink-0"
                    style={{ color: "#059669" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats panel */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Vendor Stats
        </p>

        <div className="grid grid-cols-2 gap-3">
          {(vendor.completed_jobs_count ?? 0) > 0 && (
            <div className="rounded-xl p-3" style={{ background: "#f8f7f5" }}>
              <div className="text-xl font-light text-gray-900">
                {vendor.completed_jobs_count}
              </div>
              <div className="text-xs text-gray-400 font-light">Events Done</div>
            </div>
          )}
          {(vendor.rating ?? 0) > 0 && (
            <div className="rounded-xl p-3" style={{ background: "#f8f7f5" }}>
              <div className="text-xl font-light text-gray-900 flex items-baseline gap-1">
                {(vendor.rating ?? 0).toFixed(1)}
                <Star size={12} className="fill-amber-400 text-amber-400 mb-0.5" />
              </div>
              <div className="text-xs text-gray-400 font-light">Avg Rating</div>
            </div>
          )}
          {vendor.response_rate != null && vendor.response_rate > 0 && (
            <div className="rounded-xl p-3" style={{ background: "#f8f7f5" }}>
              <div className="text-xl font-light text-gray-900">
                {Math.round(vendor.response_rate)}%
              </div>
              <div className="text-xs text-gray-400 font-light">Response Rate</div>
            </div>
          )}
          <div className="rounded-xl p-3" style={{ background: "#f8f7f5" }}>
            <div className="text-sm font-semibold text-gray-900">
              {lastActiveSince(vendor.last_active_at)}
            </div>
            <div className="text-xs text-gray-400 font-light">Last Active</div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Calendar size={11} className="text-gray-300" />
          <span className="text-xs text-gray-400 font-light">
            Member since {memberSince(vendor.created_at)}
          </span>
        </div>
      </div>

      {/* Guarantee note */}
      <div
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: "rgba(11,31,77,0.04)", border: "1px solid rgba(11,31,77,0.08)" }}
      >
        <Shield size={14} style={{ color: "#0B1F4D", flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs font-light leading-relaxed text-gray-600">
          Every vendor on ELBOLD is manually reviewed. Verified badges require
          identity or business documentation submitted to and approved by our team.
          All payments are secured by Stripe.
        </p>
      </div>

    </div>
  );
}
