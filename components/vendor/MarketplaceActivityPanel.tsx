import Link from "next/link";
import type { MarketplaceActivity } from "@/lib/vendor/business-control-centre";

const TIER_BADGE: Record<MarketplaceActivity["rankTier"], { label: string; badgeClass: string }> = {
  priority: { label: "Top Vendor", badgeClass: "bg-gold-400/15 text-gold-400 border-gold-400/25" },
  standard: { label: "Standard", badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  reduced:  { label: "Building Profile", badgeClass: "bg-slate-500/15 text-slate-400 border-slate-500/25" },
  limited:  { label: "New Vendor", badgeClass: "bg-slate-500/15 text-slate-500 border-slate-500/25" },
};

interface Props {
  marketplaceActivity: MarketplaceActivity;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

export function MarketplaceActivityPanel({ marketplaceActivity: m }: Props) {
  const tier = TIER_BADGE[m.rankTier];

  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-white">Marketplace Activity</p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${tier.badgeClass}`}>{tier.label}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Stat label="Profile views" value={m.profileViews} />
        <Stat label="Quote requests" value={m.quoteRequests} />
        <Stat label="Media views" value={m.mediaViews} />
        <Stat label="Contact clicks" value={m.contactClicks} />
        <Stat label="Package views" value={m.packageViews} />
        <Stat label="Conversion rate" value={m.conversionRate} />
      </div>

      <p className="text-xs text-slate-400 mb-1">
        {m.visibilityReason}
        {m.featured && <span className="text-gold-400"> · Featured</span>}
      </p>

      <Link href="/vendor/analytics" className="text-xs font-medium text-gold-400 hover:text-gold-300">
        View Analytics →
      </Link>
    </div>
  );
}
