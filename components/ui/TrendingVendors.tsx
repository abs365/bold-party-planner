"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, TrendingUp, Zap, CheckCircle2 } from "lucide-react";
import { VENDOR_CATEGORIES, type Vendor, type VendorCategory } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface TrendingVendorsProps {
  vendors: Vendor[];
  title?: string;
  subtitle?: string;
}

export function TrendingVendors({ vendors, title = "Trending This Week", subtitle = "Top-rated vendors getting booked right now" }: TrendingVendorsProps) {
  if (vendors.length === 0) return null;

  return (
    <section className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
            <TrendingUp size={13} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
          {vendors.slice(0, 4).map((vendor, i) => (
            <TrendingVendorCard key={vendor.id} vendor={vendor} rank={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TrendingVendorCard({ vendor, rank }: { vendor: Vendor; rank: number }) {
  const cat = VENDOR_CATEGORIES[vendor.category as VendorCategory];
  const coverMedia = vendor.media?.find((m) => m.is_cover) ?? vendor.media?.[0];
  const minPrice = vendor.min_price ?? vendor.packages?.[0]?.price;

  return (
    <Link href={`/vendors/${vendor.id}`} className="flex-shrink-0 w-60 sm:w-auto block group">
      <div className="glass-card overflow-hidden card-hover border border-white/8 hover:border-brand-500/30 relative">
        {/* Rank badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
            rank === 1 ? "bg-amber-500 text-black" :
            rank === 2 ? "bg-slate-300 text-black" :
            rank === 3 ? "bg-amber-700 text-white" :
            "bg-white/20 text-white"
          }`}>
            {rank}
          </div>
        </div>

        {/* Media */}
        <div className="relative h-44 bg-white/5 overflow-hidden">
          {coverMedia?.type === "image" ? (
            <Image
              src={coverMedia.url}
              alt={vendor.business_name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 240px, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-900/40 to-violet-900/40">
              <span className="text-5xl">{cat?.icon}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Trending badge */}
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-500/80 text-white font-medium">
              <Zap size={9} className="fill-white" /> Hot
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-white text-sm truncate group-hover:text-brand-400 transition-colors mb-0.5">
            {vendor.business_name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
            <span>{cat?.icon}</span> {cat?.label}
            {vendor.verified && <CheckCircle2 size={10} className="text-brand-400 ml-1" />}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {vendor.city && (
                <span className="flex items-center gap-0.5 text-xs text-slate-500">
                  <MapPin size={10} /> {vendor.city}
                </span>
              )}
            </div>
            {vendor.rating > 0 && (
              <div className="flex items-center gap-0.5">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-white">{vendor.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          {minPrice && (
            <div className="mt-2 pt-2 border-t border-white/8 flex items-center justify-between">
              <span className="text-xs text-slate-500">From</span>
              <span className="text-sm font-bold text-white">{formatCurrency(minPrice)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Compact activity feed item
export function ActivityFeedItem({
  type,
  name,
  action,
  location,
  timeAgo,
}: {
  type: string;
  name: string;
  action: string;
  location: string;
  timeAgo: string;
}) {
  const icons: Record<string, string> = {
    booking: "🎉",
    review: "⭐",
    join: "✨",
    event: "📅",
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/6 last:border-0">
      <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-base flex-shrink-0">
        {icons[type] ?? "🎉"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">
          <span className="font-semibold">{name}</span>{" "}
          <span className="text-slate-400">{action}</span>
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <MapPin size={9} /> {location}
          </span>
          <span className="text-xs text-slate-600">· {timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

export function LiveActivityWidget() {
  const activities = [
    { type: "booking", name: "Sarah M.", action: "just booked a DJ in", location: "London", timeAgo: "2m ago" },
    { type: "review", name: "James K.", action: "left a 5★ review for a decorator in", location: "Manchester", timeAgo: "8m ago" },
    { type: "booking", name: "Priya S.", action: "requested a quote from a caterer in", location: "Birmingham", timeAgo: "12m ago" },
    { type: "join", name: "Marcus T.", action: "just joined as a verified vendor in", location: "Leeds", timeAgo: "18m ago" },
    { type: "event", name: "Emily C.", action: "planned a wedding event in", location: "Surrey", timeAgo: "24m ago" },
  ];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-sm font-bold text-white">Live Activity</span>
        <span className="text-xs text-slate-500 ml-auto">Real-time</span>
      </div>
      {activities.map((a, i) => (
        <ActivityFeedItem key={i} {...a} />
      ))}
    </div>
  );
}
