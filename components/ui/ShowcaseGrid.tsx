"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, BadgeCheck, Star, MapPin, ArrowRight, SlidersHorizontal, Heart, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { VENDOR_CATEGORIES, type VendorCategory } from "@/types";
import toast from "react-hot-toast";

export interface ShowcaseItem {
  id: string;
  url: string;
  type: "image" | "video";
  caption: string | null;
  vendor: {
    id: string;
    business_name: string;
    category: string;
    city: string;
    rating: number;
    review_count: number;
    verification_level: number;
  };
}

interface ShowcaseGridProps {
  items: ShowcaseItem[];
}

const CATEGORY_FILTERS = [
  { key: "all",               label: "All Work"      },
  { key: "photographer",      label: "Photography"   },
  { key: "videographer",      label: "Videography"   },
  { key: "decorator",         label: "Decoration"    },
  { key: "balloon_decorator", label: "Balloons"      },
  { key: "dj",                label: "DJ & Music"    },
  { key: "live_band",         label: "Live Music"    },
  { key: "lighting_stage",    label: "Lighting"      },
  { key: "caterer",           label: "Catering"      },
  { key: "cake_maker",        label: "Cakes"         },
  { key: "makeup_artist",     label: "Makeup"        },
  { key: "marquee_rental",    label: "Marquees"      },
];

export function ShowcaseGrid({ items }: ShowcaseGridProps) {
  const [active, setActive] = useState("all");
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => active === "all" ? items : items.filter((i) => i.vendor.category === active),
    [items, active]
  );

  const available = useMemo(() => {
    const cats = new Set(items.map((i) => i.vendor.category));
    return new Set(["all", ...Array.from(cats)]);
  }, [items]);

  const toggleSave = useCallback(async (vendorId: string, vendorName: string) => {
    const isSaved = saved.has(vendorId);
    const next = new Set(saved);
    if (isSaved) { next.delete(vendorId); } else { next.add(vendorId); }
    setSaved(next);

    try {
      const res = await fetch("/api/saved-vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendorId }),
      });
      if (res.status === 401) {
        // Not logged in: undo optimistic update and redirect
        setSaved(saved);
        toast.error("Sign in to save vendors");
        return;
      }
      toast.success(isSaved ? `Removed ${vendorName}` : `Saved ${vendorName}`);
    } catch {
      setSaved(saved);
      toast.error("Could not save vendor");
    }
  }, [saved]);

  // Fire showcase_view analytics on mount (non-blocking)
  // Tracked per-page-load to measure discovery touchpoints
  const trackShowcaseView = useCallback(async (vendorId: string) => {
    try {
      await fetch("/api/vendor/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendorId, event_type: "showcase_view" }),
      });
    } catch { /* non-critical */ }
  }, []);

  return (
    <div>
      {/* Sticky category filter tabs */}
      <div className="sticky top-16 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
            <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0 mr-1" />
            {CATEGORY_FILTERS.filter((f) => available.has(f.key)).map((f) => (
              <button
                key={f.key}
                onClick={() => setActive(f.key)}
                className={cn(
                  "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  active === f.key
                    ? "bg-[#0B1F4D] text-[#D4AF37]"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Masonry grid */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#f0f4ff" }}>
              <Star size={24} style={{ color: "#0B1F4D" }} />
            </div>
            <p className="text-gray-900 font-semibold mb-1">No work yet in this category</p>
            <p className="text-gray-400 text-sm">Vendors in this category will showcase their work here soon.</p>
            <Link href="/browse" className="inline-flex items-center gap-2 mt-6 text-sm font-medium" style={{ color: "#0B1F4D" }}>
              Browse vendors directly <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-gap:1rem]">
            {filtered.map((item) => (
              <ShowcaseTile
                key={item.id}
                item={item}
                isSaved={saved.has(item.vendor.id)}
                onSave={toggleSave}
                onView={trackShowcaseView}
              />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="text-center mt-16">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-sm transition-all"
              style={{ background: "#0B1F4D", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.3)" }}
            >
              Browse All Vendors
              <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface ShowcaseTileProps {
  item: ShowcaseItem;
  isSaved: boolean;
  onSave: (vendorId: string, vendorName: string) => void;
  onView: (vendorId: string) => void;
}

function ShowcaseTile({ item, isSaved, onSave, onView }: ShowcaseTileProps) {
  const cat = VENDOR_CATEGORIES[item.vendor.category as VendorCategory];
  const isVerified = item.vendor.verification_level >= 2;

  return (
    <div
      className="break-inside-avoid block mb-4 group rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-gray-300 hover:shadow-xl transition-all duration-300"
      onClick={() => onView(item.vendor.id)}
    >
      {/* Media: links to vendor profile */}
      <Link href={`/vendors/${item.vendor.id}`} className="block">
        <div className="relative overflow-hidden bg-gray-100">
          {item.type === "video" ? (
            <div className="relative aspect-[4/5] bg-gray-900 flex items-center justify-center">
              <video
                src={item.url}
                className="w-full h-full object-cover opacity-70"
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play size={16} className="text-white ml-0.5" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <Image
              src={item.url}
              alt={item.caption ?? item.vendor.business_name}
              width={400}
              height={500}
              style={{ height: "auto", width: "100%" }}
              className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}

          {/* Verified badge */}
          {isVerified && (
            <div
              className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(255,255,255,0.92)", color: "#0B1F4D" }}
            >
              <BadgeCheck size={10} style={{ color: "#D4AF37" }} />
              Verified
            </div>
          )}

          {/* Category tag */}
          <div className="absolute top-2.5 right-2.5">
            <span className="text-xs px-2 py-0.5 rounded-full bg-black/50 text-white/90 backdrop-blur-sm">
              {cat?.label ?? item.vendor.category.replace(/_/g, " ")}
            </span>
          </div>

          {/* Save button: overlaid, prevents link navigation */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(item.vendor.id, item.vendor.business_name); }}
            aria-label={isSaved ? "Remove from saved" : "Save vendor"}
            className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border transition-all opacity-0 group-hover:opacity-100"
            style={{
              background: isSaved ? "rgba(220,38,38,0.85)" : "rgba(255,255,255,0.85)",
              borderColor: isSaved ? "transparent" : "rgba(0,0,0,0.08)",
            }}
          >
            <Heart size={13} className={isSaved ? "fill-white text-white" : "text-gray-700"} />
          </button>
        </div>
      </Link>

      {/* Vendor info + CTA */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            <Link href={`/vendors/${item.vendor.id}`}>
              <p className="text-sm font-semibold text-gray-900 truncate hover:text-[#0B1F4D] transition-colors">
                {item.vendor.business_name}
              </p>
            </Link>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
              <MapPin size={9} className="flex-shrink-0" />
              <span className="truncate">{item.vendor.city}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star size={10} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-gray-900">
              {(item.vendor.rating ?? 0).toFixed(1)}
            </span>
          </div>
        </div>

        {/* CTA row */}
        <Link
          href={`/dashboard/quotes/new?vendor=${item.vendor.id}&name=${encodeURIComponent(item.vendor.business_name)}`}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold transition-all"
          style={{ background: "#0B1F4D", color: "#D4AF37" }}
          onClick={(e) => e.stopPropagation()}
        >
          <MessageSquare size={11} />
          Get a Quote
        </Link>
      </div>
    </div>
  );
}
