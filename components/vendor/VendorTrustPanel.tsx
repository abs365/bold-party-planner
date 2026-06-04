import { BadgeCheck, Calendar, Star, MessageSquare, Clock, Shield, TrendingUp } from "lucide-react";
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
  >;
}

function TrustStat({ icon: Icon, label, value, highlight }: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: highlight ? "rgba(11,31,77,0.07)" : "#f9fafb" }}
      >
        <Icon size={14} style={{ color: highlight ? "#0B1F4D" : "#9ca3af" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-light">{label}</p>
        <p className="text-sm font-semibold text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}

function verificationLabel(level: number): string {
  if (level >= 4) return "Business Verified";
  if (level >= 3) return "Address Verified";
  if (level >= 2) return "ID Verified";
  if (level >= 1) return "Email Verified";
  return "Unverified";
}

function memberSince(dateStr: string): string {
  const year = new Date(dateStr).getFullYear();
  const month = new Date(dateStr).toLocaleString("en-GB", { month: "short" });
  return `${month} ${year}`;
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
  const isVerified = level >= 2;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Shield size={14} style={{ color: "#0B1F4D" }} />
        <span className="text-sm font-semibold text-gray-900">Trust &amp; Credibility</span>
        {isVerified && (
          <span
            className="ml-auto flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(212,175,55,0.12)", color: "#0B1F4D" }}
          >
            <BadgeCheck size={10} style={{ color: "#D4AF37" }} />
            {verificationLabel(level)}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="px-5">
        <TrustStat
          icon={Calendar}
          label="Member Since"
          value={memberSince(vendor.created_at)}
        />
        {(vendor.completed_jobs_count ?? 0) > 0 && (
          <TrustStat
            icon={TrendingUp}
            label="Events Completed"
            value={String(vendor.completed_jobs_count)}
            highlight
          />
        )}
        {(vendor.review_count ?? 0) > 0 && (
          <TrustStat
            icon={Star}
            label="Reviews"
            value={`${vendor.review_count} reviews · ${(vendor.rating ?? 0).toFixed(1)} avg`}
            highlight={(vendor.rating ?? 0) >= 4.5}
          />
        )}
        {vendor.response_rate != null && vendor.response_rate > 0 && (
          <TrustStat
            icon={MessageSquare}
            label="Response Rate"
            value={`${Math.round(vendor.response_rate)}%`}
            highlight={(vendor.response_rate ?? 0) >= 80}
          />
        )}
        <TrustStat
          icon={Clock}
          label="Last Active"
          value={lastActiveSince(vendor.last_active_at)}
        />
      </div>

      {/* Footer note */}
      <div className="px-5 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 font-light">
          All vendors are manually reviewed before joining ELBOLD.
          Verified badges require identity or business documentation.
        </p>
      </div>
    </div>
  );
}
