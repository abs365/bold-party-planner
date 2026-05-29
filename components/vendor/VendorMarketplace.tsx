"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, MapPin, Star, CheckCircle2, Play, X, Clock,
  BadgeCheck, TrendingUp, Filter, Heart, Zap, Quote, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { VENDOR_CATEGORIES, type Vendor, type VendorCategory } from "@/types";
import { calculateVendorScore } from "@/lib/vendor/ranking";
import { VendorBadgesRow } from "@/components/vendor/VendorTrustBadges";

const VENDOR_PAGE_SIZE = 20;

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
  const [sortBy, setSortBy] = useState<"smart" | "rating" | "price_low" | "price_high" | "popular" | "fastest_responder" | "newest" | "most_active">("smart");
  const [showFilters, setShowFilters] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);
  const [budgetMin, setBudgetMin] = useState(initialBudgetMin ?? 0);
  const [budgetMax, setBudgetMax] = useState(initialBudgetMax ?? 10000);
  const [minRating, setMinRating] = useState(initialMinRating ?? 0);
  const [verifiedOnly, setVerifiedOnly] = useState(initialVerifiedOnly ?? false);
  const [eventType, setEventType] = useState(initialEventType ?? "");
  const [displayCount, setDisplayCount] = useState(VENDOR_PAGE_SIZE);

  // Reset pagination when filters change — React's "detect changes in render" pattern
  // (avoids setState-in-effect; see react.dev/learn/you-might-not-need-an-effect)
  const filtersKey = `${search}|${category}|${city}|${sortBy}|${budgetMin}|${budgetMax}|${minRating}|${verifiedOnly}|${eventType}`;
  const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey);
  if (prevFiltersKey !== filtersKey) {
    setPrevFiltersKey(filtersKey);
    setDisplayCount(VENDOR_PAGE_SIZE);
  }

  const smartPicks = useMemo(() =>
    vendors
      .filter((v) => calculateVendorScore(v).tier !== "limited")
      .sort((a, b) => {
        const sa = calculateVendorScore(a).total + (a.featured ? 10 : 0);
        const sb = calculateVendorScore(b).total + (b.featured ? 10 : 0);
        return sb - sa;
      })
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
          const sa = calculateVendorScore(a).total + (a.featured ? 10 : 0);
          const sb = calculateVendorScore(b).total + (b.featured ? 10 : 0);
          return sb - sa;
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
      case "fastest_responder":
        result.sort((a, b) => (b.response_rate ?? -1) - (a.response_rate ?? -1));
        break;
      case "most_active":
        result.sort((a, b) => (b.completed_jobs_count ?? 0) - (a.completed_jobs_count ?? 0));
        break;
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
    setDisplayCount(VENDOR_PAGE_SIZE);
  };

  const activeFilterCount = [
    search, category, city, verifiedOnly,
    minRating > 0, budgetMax < 10000, eventType,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="pt-10 pb-8 px-4 text-center border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Find your event vendors
          </h1>
          <p className="text-gray-500 mb-8">
            Browse verified professionals across 19 categories. Real photos, real reviews.
          </p>

          <div className="flex gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendors, categories, cities..."
                className="input-light pl-icon h-12 rounded-xl"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-4 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium",
                showFilters || activeFilterCount > 0
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
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

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <CheckCircle2 size={12} className="text-gray-400" />
              Verified vendors only
            </span>
            <span className="hidden sm:block w-px h-3 bg-gray-200" />
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              Rated by real customers
            </span>
            <span className="hidden sm:block w-px h-3 bg-gray-200" />
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <BadgeCheck size={12} className="text-gray-400" />
              Manually vetted
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="px-4 py-5 border-b border-gray-100 bg-gray-50 max-w-6xl mx-auto w-full">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-44">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">City / Area</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. London"
                    className="input-light pl-8 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-44">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="input-light py-2 text-sm"
                >
                  <option value="">Any Event Type</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-44">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="input-light py-2 text-sm"
                >
                  <option value="smart">Recommended</option>
                  <option value="rating">Top Rated</option>
                  <option value="fastest_responder">Fastest Responder</option>
                  <option value="most_active">Most Active</option>
                  <option value="popular">Most Reviews</option>
                  <option value="newest">Newest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-56">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Budget: {formatCurrency(budgetMin)} to {budgetMax >= 10000 ? "Any" : formatCurrency(budgetMax)}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={budgetMin || ""}
                    onChange={(e) => setBudgetMin(Number(e.target.value) || 0)}
                    placeholder="Min £"
                    className="input-light py-2 text-sm w-28"
                    min={0}
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="number"
                    value={budgetMax >= 10000 ? "" : budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value) || 10000)}
                    placeholder="Max £"
                    className="input-light py-2 text-sm w-28"
                    min={0}
                  />
                </div>
              </div>

              <div className="min-w-40">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Minimum Rating</label>
                <div className="flex gap-1">
                  {[0, 3, 4, 4.5, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        minRating === r
                          ? "bg-amber-50 border-amber-300 text-amber-700"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {r === 0 ? "Any" : `${r}★`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                    verifiedOnly
                      ? "bg-brand-50 border-brand-300 text-brand-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <BadgeCheck size={15} />
                  Verified Only
                </button>

                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="btn-secondary-light py-2 px-3 text-xs flex items-center gap-1.5">
                    <X size={13} />
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="px-4 py-5 border-b border-gray-100 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-2">
          <button
            onClick={() => setCategory("")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              !category
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            All
          </button>
          {(["dj", "photographer", "caterer", "decorator", "mc", "live_band", "cake_maker", "balloon_decorator"] as VendorCategory[]).map((key) => {
            const { label, icon } = VENDOR_CATEGORIES[key];
            return (
              <button
                key={key}
                onClick={() => setCategory(category === key ? "" : key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  category === key
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
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
                ? "bg-gray-100 text-gray-700 border-gray-300"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            )}
          >
            {showAllCats ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showAllCats ? "Less" : "All 20 categories"}
          </button>
        </div>

        {showAllCats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-3 border-t border-gray-100 mt-2">
            {Object.entries(VENDOR_CATEGORIES).map(([key, { label, icon, description }]) => (
              <button
                key={key}
                onClick={() => { setCategory(category === key ? "" : key as VendorCategory); setShowAllCats(false); }}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all border",
                  category === key
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                )}
              >
                <span className="text-base flex-shrink-0">{icon}</span>
                <div className="min-w-0">
                  <div className="font-medium truncate text-xs">{label}</div>
                  <div className="text-xs text-gray-400 truncate hidden sm:block">{description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Smart Picks */}
      {activeFilterCount === 0 && smartPicks.length > 0 && (
        <div className="px-4 pt-8 pb-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Top Picks</h2>
            <span className="text-xs text-gray-400">Highest-rated verified vendors</span>
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
        <div className="flex items-center justify-between mb-5 pt-4 border-t border-gray-100">
          <p className="text-gray-500 text-sm">
            <span className="text-gray-900 font-semibold">{filtered.length}</span> vendors
            {category && ` in ${VENDOR_CATEGORIES[category]?.label ?? category}`}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <TrendingUp size={13} />
            {sortBy === "smart" ? "Recommended" : "Custom sort"}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-500 text-sm mb-4">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="btn-secondary-light">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.slice(0, displayCount).map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
            {filtered.length > displayCount && (
              <div className="flex flex-col items-center gap-2 mt-10">
                <button
                  onClick={() => setDisplayCount((c) => c + VENDOR_PAGE_SIZE)}
                  className="btn-secondary-light px-8 py-3 text-sm"
                >
                  Show more vendors
                </button>
                <p className="text-xs text-gray-400">
                  Showing {displayCount} of {filtered.length}
                </p>
              </div>
            )}
          </>
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
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-200 transition-all">
        <div className="relative h-32 bg-gray-100 overflow-hidden">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
        <div className="p-3">
          <div className="font-semibold text-gray-900 text-xs truncate">{vendor.business_name}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-400">{cat?.label}</span>
            {vendor.rating > 0 && (
              <span className="text-xs text-gray-700 flex items-center gap-0.5">
                <Star size={10} className="fill-amber-400 text-amber-400" />{vendor.rating.toFixed(1)}
              </span>
            )}
          </div>
          {minPrice && (
            <div className="text-xs text-gray-700 font-semibold mt-1">From {formatCurrency(minPrice)}</div>
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
  const hasInstantQuote = vendor.packages && vendor.packages.length > 0;
  const responseRate = vendor.response_rate ?? 0;
  const responseTime = responseRate >= 90 ? "~1h" : responseRate >= 70 ? "~2h" : responseRate >= 50 ? "~4h" : "24h";
  const isFastResponder = responseRate >= 80;
  const completedJobs = vendor.completed_jobs_count ?? 0;

  return (
    <div className="group relative">
      <Link href={`/vendors/${vendor.id}`} className="block">
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-200 transition-all">
          {/* Media */}
          <div className="relative h-52 bg-gray-100 overflow-hidden">
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
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <span className="text-5xl">{cat?.icon}</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Top badges */}
            <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
              {vendor.featured && (
                <span className="badge bg-amber-500/90 text-amber-900 text-xs font-bold">Featured</span>
              )}
              {vendor.verification_level >= 3 ? (
                <span className="badge bg-amber-500/80 border border-amber-400/40 text-amber-100 text-xs flex items-center gap-1 backdrop-blur-sm">
                  <Star size={9} className="fill-amber-100" /> Trusted Pro
                </span>
              ) : vendor.verification_level >= 2 ? (
                <span className="badge bg-black/50 border border-white/30 text-white text-xs flex items-center gap-1 backdrop-blur-sm">
                  <CheckCircle2 size={10} /> Business Verified
                </span>
              ) : vendor.verified ? (
                <span className="badge bg-black/50 border border-white/30 text-white text-xs flex items-center gap-1 backdrop-blur-sm">
                  <CheckCircle2 size={10} /> Verified
                </span>
              ) : null}
              {isHot && !vendor.featured && vendor.verification_level < 3 && (
                <span className="badge bg-red-500/80 text-white text-xs flex items-center gap-1">
                  <Zap size={9} className="fill-white" /> Hot
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
                <h3 className="font-semibold text-gray-900 text-sm truncate">{vendor.business_name}</h3>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <span>{cat?.icon}</span> {cat?.label}
                </p>
              </div>
              {vendor.rating > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-gray-900">{vendor.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
              <MapPin size={10} />
              {vendor.city}
              {vendor.review_count > 0 && (
                <span className="ml-auto text-gray-400 flex items-center gap-0.5">
                  <Quote size={9} /> {vendor.review_count} reviews
                </span>
              )}
            </div>

            <VendorBadgesRow
              vendor={{
                verification_level: vendor.verification_level,
                verified: vendor.verified,
                response_rate: vendor.response_rate,
                rating: vendor.rating,
                review_count: vendor.review_count,
                completed_jobs_count: vendor.completed_jobs_count,
                cancellation_rate: vendor.cancellation_rate,
              }}
              max={2}
              className="mb-2"
            />

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={cn(
                "text-xs flex items-center gap-1",
                isFastResponder ? "text-emerald-600" : "text-gray-400"
              )}>
                {isFastResponder ? <Zap size={9} className="fill-emerald-600 text-emerald-600" /> : <Clock size={9} />}
                {isFastResponder ? "Fast responder" : `Replies ${responseTime}`}
              </span>
              {completedJobs >= 5 && (
                <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                  {completedJobs}+ events
                </span>
              )}
              {hasInstantQuote && completedJobs < 5 && (
                <span className="text-xs text-emerald-600 flex items-center gap-1 ml-auto">
                  <Zap size={9} className="fill-emerald-600" /> Instant Quote
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              {minPrice ? (
                <div>
                  <span className="text-xs text-gray-400">From </span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(minPrice)}</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400">Contact for pricing</span>
              )}
              <span className="text-xs text-gray-500 group-hover:text-gray-900 font-medium transition-colors">
                View &amp; Quote →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
