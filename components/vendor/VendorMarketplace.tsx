"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, MapPin, Star, CheckCircle2, Play, X, Clock,
  Sparkles, BadgeCheck, TrendingUp, Filter, Heart, Zap, Quote, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { VENDOR_CATEGORIES, type Vendor, type VendorCategory } from "@/types";

const EVENT_TYPES = [
  "wedding", "birthday", "corporate", "anniversary", "graduation",
  "baby_shower", "hen_party", "engagement", "christmas", "other",
];

interface VendorMarketplaceProps {
  vendors: Vendor[];
  initialCategory?: string;
  initialCity?: string;
  initialSearch?: string;
  initialBudgetMin?: number;
  initialBudgetMax?: number;
  initialMinRating?: number;
  initialVerifiedOnly?: boolean;
  initialEventType?: string;
}

export function VendorMarketplace({
  vendors,
  initialCategory,
  initialCity,
  initialSearch,
  initialBudgetMin,
  initialBudgetMax,
  initialMinRating,
  initialVerifiedOnly,
  initialEventType,
}: VendorMarketplaceProps) {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [category, setCategory] = useState<VendorCategory | "">(
    (initialCategory as VendorCategory) ?? ""
  );
  const [city, setCity] = useState(initialCity ?? "");
  const [sortBy, setSortBy] = useState<"rating" | "price_low" | "price_high" | "popular" | "smart">("smart");
  const [showFilters, setShowFilters] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);
  const [budgetMin, setBudgetMin] = useState(initialBudgetMin ?? 0);
  const [budgetMax, setBudgetMax] = useState(initialBudgetMax ?? 10000);
  const [minRating, setMinRating] = useState(initialMinRating ?? 0);
  const [verifiedOnly, setVerifiedOnly] = useState(initialVerifiedOnly ?? false);
  const [eventType, setEventType] = useState(initialEventType ?? "");

  const smartPicks = useMemo(() =>
    vendors
      .filter((v) => v.featured || (v.verified && v.rating >= 4.5))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 4),
    [vendors]
  );

  const filtered = useMemo(() => {
    let result = [...vendors];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((v) =>
        v.business_name.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q)
      );
    }

    if (category) result = result.filter((v) => v.category === category);
    if (city) result = result.filter((v) => v.city.toLowerCase().includes(city.toLowerCase()));
    if (verifiedOnly) result = result.filter((v) => v.verified);
    if (minRating > 0) result = result.filter((v) => (v.rating ?? 0) >= minRating);

    if (budgetMax < 10000) {
      result = result.filter((v) => {
        const min = v.min_price ?? 0;
        const max = v.max_price ?? v.min_price ?? 99999;
        return min <= budgetMax && max >= budgetMin;
      });
    }

    switch (sortBy) {
      case "smart":
        result.sort((a, b) => {
          const scoreA = (a.rating ?? 0) * 6 + (a.featured ? 10 : 0) + (a.verified ? 5 : 0) + (a.review_count ?? 0) * 0.1;
          const scoreB = (b.rating ?? 0) * 6 + (b.featured ? 10 : 0) + (b.verified ? 5 : 0) + (b.review_count ?? 0) * 0.1;
          return scoreB - scoreA;
        });
        break;
      case "rating":
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "price_low":
        result.sort((a, b) => (a.min_price ?? 0) - (b.min_price ?? 0));
        break;
      case "price_high":
        result.sort((a, b) => (b.max_price ?? 0) - (a.max_price ?? 0));
        break;
      case "popular":
        result.sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0));
        break;
    }

    return result;
  }, [vendors, search, category, city, sortBy, budgetMin, budgetMax, minRating, verifiedOnly]);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setCity("");
    setBudgetMin(0);
    setBudgetMax(10000);
    setMinRating(0);
    setVerifiedOnly(false);
    setEventType("");
  };

  const activeFilterCount = [
    search, category, city, verifiedOnly,
    minRating > 0, budgetMax < 10000, eventType,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="pt-10 pb-8 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-brand-600/15 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Vendor Marketplace</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Find Your Perfect <span className="gradient-brand-text">Event Vendors</span>
          </h1>
          <p className="text-slate-400 mb-8">
            Browse verified vendors across 19 categories. Real photos, real reviews, real results.
          </p>

          <div className="flex gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500/60 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendors, categories, cities..."
                className="input-field pl-icon h-12 rounded-xl"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-4 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium",
                showFilters || activeFilterCount > 0
                  ? "border-brand-500/40 bg-brand-500/15 text-brand-400"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/8"
              )}
            >
              <Filter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Social proof strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <CheckCircle2 size={12} className="text-brand-400" />
              500+ verified vendors
            </span>
            <span className="hidden sm:block w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              4.9 avg rating
            </span>
            <span className="hidden sm:block w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <TrendingUp size={12} className="text-brand-400" />
              2,400+ events planned
            </span>
            <span className="hidden sm:block w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <BadgeCheck size={12} className="text-brand-400" />
              Manually vetted
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="px-4 pb-6 max-w-6xl mx-auto">
          <div className="glass-card p-5 space-y-5">
            <div className="flex flex-wrap gap-4">
              {/* City */}
              <div className="flex-1 min-w-44">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">City / Area</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. London"
                    className="input-field pl-8 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Event Type */}
              <div className="flex-1 min-w-44">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="input-field py-2 text-sm"
                >
                  <option value="">Any Event Type</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="flex-1 min-w-44">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="input-field py-2 text-sm"
                >
                  <option value="smart">Smart Match</option>
                  <option value="rating">Highest Rated</option>
                  <option value="popular">Most Reviews</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-end">
              {/* Budget Range */}
              <div className="flex-1 min-w-56">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Budget Range: {formatCurrency(budgetMin)} — {budgetMax >= 10000 ? "Any" : formatCurrency(budgetMax)}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={budgetMin || ""}
                    onChange={(e) => setBudgetMin(Number(e.target.value) || 0)}
                    placeholder="Min £"
                    className="input-field py-2 text-sm w-28"
                    min={0}
                  />
                  <span className="flex items-center text-slate-500 text-sm">—</span>
                  <input
                    type="number"
                    value={budgetMax >= 10000 ? "" : budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value) || 10000)}
                    placeholder="Max £"
                    className="input-field py-2 text-sm w-28"
                    min={0}
                  />
                </div>
              </div>

              {/* Min Rating */}
              <div className="min-w-40">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Minimum Rating</label>
                <div className="flex gap-1">
                  {[0, 3, 4, 4.5, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        minRating === r
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/8"
                      )}
                    >
                      {r === 0 ? "Any" : `${r}★`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                    verifiedOnly
                      ? "bg-brand-500/20 border-brand-500/40 text-brand-400"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/8"
                  )}
                >
                  <BadgeCheck size={15} />
                  Verified Only
                </button>

                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5">
                    <X size={13} />
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Grid — fully discoverable, no clipping */}
      <div className="px-4 pb-6 max-w-7xl mx-auto">
        {/* Top row: All + popular categories + toggle button */}
        <div className="flex flex-wrap gap-2 mb-2">
          <button
            onClick={() => setCategory("")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              !category ? "gradient-brand text-white shadow-md" : "bg-white/5 text-slate-400 hover:bg-white/8 border border-white/10"
            )}
          >
            All
          </button>
          {/* Always-visible popular categories */}
          {(["dj", "photographer", "caterer", "decorator", "mc", "live_band", "cake_maker", "balloon_decorator"] as VendorCategory[]).map((key) => {
            const { label, icon } = VENDOR_CATEGORIES[key];
            return (
              <button
                key={key}
                onClick={() => setCategory(category === key ? "" : key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  category === key
                    ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                    : "bg-white/5 text-slate-400 hover:bg-white/8 border border-white/10"
                )}
              >
                <span>{icon}</span> {label}
              </button>
            );
          })}
          <button
            onClick={() => setShowAllCats((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border",
              showAllCats
                ? "bg-brand-500/10 text-brand-400 border-brand-500/30"
                : "bg-white/5 text-slate-400 hover:bg-white/8 border-white/10"
            )}
          >
            {showAllCats ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showAllCats ? "Less" : `All 20 categories`}
          </button>
        </div>

        {/* Expanded grid — all 20 categories */}
        {showAllCats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-3 border-t border-white/6 mt-2">
            {Object.entries(VENDOR_CATEGORIES).map(([key, { label, icon, description }]) => (
              <button
                key={key}
                onClick={() => { setCategory(category === key ? "" : key as VendorCategory); setShowAllCats(false); }}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all border",
                  category === key
                    ? "bg-brand-500/20 text-brand-300 border-brand-500/30"
                    : "bg-white/4 text-slate-400 hover:bg-white/8 hover:text-white border-white/8"
                )}
              >
                <span className="text-base flex-shrink-0">{icon}</span>
                <div className="min-w-0">
                  <div className="font-medium truncate text-xs">{label}</div>
                  <div className="text-xs text-slate-600 truncate hidden sm:block">{description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Smart Picks — shown when no active filters */}
      {activeFilterCount === 0 && smartPicks.length > 0 && (
        <div className="px-4 pb-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg gradient-brand flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-white">Smart Picks</h2>
            <span className="text-xs text-slate-500 ml-1">Top-rated, verified vendors</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {smartPicks.map((vendor) => (
              <SmartPickCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="px-4 pb-16 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <p className="text-slate-400 text-sm">
            <span className="text-white font-semibold">{filtered.length}</span> vendors found
            {category && ` in ${VENDOR_CATEGORIES[category]?.label ?? category}`}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <TrendingUp size={13} className="text-brand-400" />
            {sortBy === "smart" ? "Smart Match order" : "Sorted by preference"}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-white mb-2">No vendors found</h3>
            <p className="text-slate-400 text-sm mb-4">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SmartPickCard({ vendor }: { vendor: Vendor }) {
  const cat = VENDOR_CATEGORIES[vendor.category];
  const coverMedia = vendor.media?.find((m) => m.is_cover) ?? vendor.media?.[0];
  const minPrice = vendor.min_price ?? vendor.packages?.[0]?.price;

  return (
    <Link href={`/vendors/${vendor.id}`} className="block group">
      <div className="glass-card overflow-hidden border border-brand-500/20 hover:border-brand-500/40 transition-all card-hover">
        <div className="relative h-32 bg-white/5 overflow-hidden">
          {coverMedia?.type === "image" ? (
            <Image
              src={coverMedia.url}
              alt={vendor.business_name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">{cat?.icon}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-2 left-2">
            <span className="badge bg-brand-500/90 text-white text-xs flex items-center gap-1">
              <Sparkles size={9} /> Smart Pick
            </span>
          </div>
        </div>
        <div className="p-3">
          <div className="font-semibold text-white text-xs truncate group-hover:text-brand-400 transition-colors">
            {vendor.business_name}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-500">{cat?.label}</span>
            {vendor.rating > 0 && (
              <span className="text-xs text-amber-400 flex items-center gap-0.5">
                <Star size={10} className="fill-amber-400" />{vendor.rating.toFixed(1)}
              </span>
            )}
          </div>
          {minPrice && (
            <div className="text-xs text-white font-semibold mt-1">From {formatCurrency(minPrice)}</div>
          )}
        </div>
      </div>
    </Link>
  );
}

function VendorCard({ vendor }: { vendor: Vendor }) {
  const [saved, setSaved] = useState(false);
  const cat = VENDOR_CATEGORIES[vendor.category];
  const coverMedia = vendor.media?.find((m) => m.is_cover) ?? vendor.media?.[0];
  const hasVideo = vendor.media?.some((m) => m.type === "video");
  const minPrice = vendor.min_price ?? vendor.packages?.[0]?.price;
  const isHot = (vendor.rating ?? 0) >= 4.7 && (vendor.review_count ?? 0) >= 30;
  const isPopularThisWeek = (vendor.review_count ?? 0) >= 15 && (vendor.rating ?? 0) >= 4.5;
  const hasInstantQuote = vendor.packages && vendor.packages.length > 0;
  const responseTime = (vendor.rating ?? 0) >= 4.8 ? "1h" : (vendor.rating ?? 0) >= 4.5 ? "2h" : "24h";

  return (
    <div className="group relative">
      <Link href={`/vendors/${vendor.id}`} className="block">
        <div className="glass-card overflow-hidden card-hover border border-white/7 hover:border-brand-500/30">
          {/* Media */}
          <div className="relative h-52 bg-white/5 overflow-hidden">
            {coverMedia ? (
              coverMedia.type === "image" ? (
                <Image
                  src={coverMedia.url}
                  alt={vendor.business_name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              ) : (
                <video
                  src={coverMedia.url}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-900/30 to-violet-900/30">
                <span className="text-5xl">{cat?.icon}</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {/* Top badges */}
            <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
              {vendor.featured && (
                <span className="badge bg-amber-500/90 text-amber-900 text-xs font-bold">⭐ Featured</span>
              )}
              {vendor.verified && (
                <span className="badge bg-brand-500/90 text-white text-xs flex items-center gap-1">
                  <CheckCircle2 size={10} /> Verified
                </span>
              )}
              {isHot && !vendor.featured && (
                <span className="badge bg-red-500/80 text-white text-xs flex items-center gap-1">
                  <Zap size={9} className="fill-white" /> Hot
                </span>
              )}
              {isPopularThisWeek && !isHot && !vendor.featured && (
                <span className="badge bg-violet-500/80 text-white text-xs flex items-center gap-1">
                  <TrendingUp size={9} /> Popular
                </span>
              )}
            </div>

            {/* Save button */}
            <button
              onClick={(e) => { e.preventDefault(); setSaved((s) => !s); }}
              className={cn(
                "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border transition-all opacity-0 group-hover:opacity-100",
                saved ? "bg-red-500/80 border-red-500/50" : "bg-black/50 border-white/20 hover:bg-black/70"
              )}
            >
              <Heart size={13} className={saved ? "fill-white text-white" : "text-white"} />
            </button>

            {hasVideo && (
              <div className="absolute bottom-3 left-3">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-xs backdrop-blur-sm">
                  <Play size={10} className="fill-white" /> Video
                </div>
              </div>
            )}

            {vendor.media && vendor.media.length > 1 && (
              <div className="absolute bottom-3 right-3 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                {vendor.media.length} photos
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-1.5">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-sm truncate group-hover:text-brand-400 transition-colors">
                  {vendor.business_name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <span>{cat?.icon}</span> {cat?.label}
                </p>
              </div>
              {vendor.rating > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-white">{vendor.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-500 mb-2.5">
              <MapPin size={10} />
              {vendor.city}
              {vendor.review_count > 0 && (
                <span className="ml-auto text-slate-600 flex items-center gap-0.5">
                  <Quote size={9} /> {vendor.review_count} reviews
                </span>
              )}
            </div>

            {/* Response time + instant quote */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-600 flex items-center gap-1">
                <Clock size={9} className="text-slate-500" /> Replies {responseTime}
              </span>
              {hasInstantQuote && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 ml-auto">
                  <Zap size={9} className="fill-emerald-400" /> Instant Quote
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/6">
              {minPrice ? (
                <div>
                  <span className="text-xs text-slate-500">From </span>
                  <span className="text-sm font-bold text-white">{formatCurrency(minPrice)}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500">Contact for pricing</span>
              )}
              <span className="text-xs text-brand-400 font-semibold group-hover:text-brand-300 flex items-center gap-0.5 transition-colors">
                View & Quote →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

// Need useState import - already imported above via "useState, useMemo"
