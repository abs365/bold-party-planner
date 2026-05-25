"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Bookmark, Share2, ArrowRight, Sparkles, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { VENDOR_CATEGORIES } from "@/types";
import type { VendorCategory } from "@/types";
import toast from "react-hot-toast";

interface MediaItem {
  url: string;
  type: string;
  is_cover: boolean;
  caption: string | null;
}

interface VendorItem {
  id: string;
  business_name: string;
  category: string;
  city: string;
  rating: number;
  review_count: number;
  media: MediaItem[] | null;
}

interface InspirationFeedProps {
  vendors: VendorItem[];
}

// Static inspiration tiles to fill out the feed
const STATIC_TILES = [
  { id: "s1", title: "Floral Arch Dream", tag: "Wedding", emoji: "🌸", gradient: "from-rose-900/60 to-pink-900/60", saves: 847, link: "/browse?category=decorator" },
  { id: "s2", title: "Golden Hour Reception", tag: "Wedding", emoji: "✨", gradient: "from-amber-900/60 to-orange-900/60", saves: 1203, link: "/browse?event=wedding" },
  { id: "s3", title: "Neon Dance Floor", tag: "Birthday", emoji: "🎉", gradient: "from-purple-900/60 to-violet-900/60", saves: 934, link: "/browse?category=dj" },
  { id: "s4", title: "Balloon Cloud Ceiling", tag: "Birthday", emoji: "🎈", gradient: "from-blue-900/60 to-cyan-900/60", saves: 1567, link: "/browse?category=balloon_decorator" },
  { id: "s5", title: "Candlelit Table Setup", tag: "Anniversary", emoji: "🕯️", gradient: "from-amber-900/60 to-red-900/60", saves: 723, link: "/browse?category=decorator" },
  { id: "s6", title: "Pastel Baby Shower", tag: "Baby Shower", emoji: "👶", gradient: "from-pink-900/60 to-purple-900/60", saves: 891, link: "/browse?event=baby_shower" },
  { id: "s7", title: "Corporate Gala Setup", tag: "Corporate", emoji: "🏢", gradient: "from-slate-800/80 to-blue-900/60", saves: 445, link: "/browse?event=corporate" },
  { id: "s8", title: "Marquee Fairy Lights", tag: "Wedding", emoji: "💡", gradient: "from-indigo-900/60 to-purple-900/60", saves: 1089, link: "/browse?category=marquee_rental" },
];

interface SaveState {
  [key: string]: boolean;
}

export function InspirationFeed({ vendors }: InspirationFeedProps) {
  const [saves, setSaves] = useState<SaveState>({});

  function toggleSave(id: string) {
    setSaves((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      toast.success(next[id] ? "Saved to inspiration board!" : "Removed from board");
      return next;
    });
  }

  function handleShare(title: string) {
    if (navigator.share) {
      navigator.share({ title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  }

  // Build tiles from real vendor photos + static tiles
  const vendorTiles = vendors
    .filter((v) => v.media && v.media.length > 0)
    .flatMap((v) => {
      const cat = VENDOR_CATEGORIES[v.category as VendorCategory];
      return (v.media ?? [])
        .filter((m) => m.type === "image")
        .slice(0, 2)
        .map((m, idx) => ({
          id: `${v.id}_${idx}`,
          type: "vendor" as const,
          url: m.url,
          caption: m.caption ?? v.business_name,
          vendorName: v.business_name,
          vendorId: v.id,
          tag: cat?.label ?? v.category,
          city: v.city,
          rating: v.rating,
          saves: Math.floor(v.rating * 100 + v.review_count * 5 + Math.random() * 300),
        }));
    });

  const staticTiles = STATIC_TILES.map((t) => ({ ...t, type: "static" as const }));

  // Interleave real and static tiles
  const allTiles = vendorTiles.length > 0
    ? [...vendorTiles.slice(0, 4), staticTiles[0], staticTiles[1], ...vendorTiles.slice(4, 8), staticTiles[2], staticTiles[3], ...vendorTiles.slice(8), ...staticTiles.slice(4)]
    : staticTiles;

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-brand-400" />
              <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest">From Our Vendors</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">Real Event Moments</h2>
          </div>
          <Link href="/browse" className="btn-secondary text-sm py-2 px-4 hidden sm:flex">
            Browse All Vendors <ArrowRight size={14} />
          </Link>
        </div>

        {/* Pinterest-style masonry grid */}
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {allTiles.map((tile) => (
            <div
              key={tile.id}
              className="break-inside-avoid group relative rounded-2xl overflow-hidden border border-white/8 hover:border-brand-500/30 transition-all duration-300 cursor-pointer"
            >
              {tile.type === "vendor" ? (
                <Link href={`/vendors/${tile.vendorId}`} className="block">
                  <div className="relative overflow-hidden bg-white/5">
                    <Image
                      src={tile.url}
                      alt={tile.caption}
                      width={400}
                      height={0}
                      style={{ height: "auto", width: "100%" }}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {/* Tag badge */}
                    <div className="absolute top-2 left-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-black/60 text-white/90 backdrop-blur-sm">{tile.tag}</span>
                    </div>
                    {/* Hover actions */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.preventDefault(); toggleSave(tile.id); }}
                        className={cn("w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border transition-all", saves[tile.id] ? "bg-red-500/80 border-red-500/50" : "bg-black/50 border-white/20 hover:bg-black/70")}
                      >
                        <Heart size={12} className={saves[tile.id] ? "fill-white text-white" : "text-white"} />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); handleShare(tile.caption); }}
                        className="w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center backdrop-blur-sm hover:bg-black/70"
                      >
                        <Share2 size={12} className="text-white" />
                      </button>
                    </div>
                    {/* Caption bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-xs font-semibold text-white line-clamp-1">{tile.caption}</div>
                      <div className="text-xs text-white/60 mt-0.5">{tile.vendorName} · {tile.city}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Heart size={9} className="fill-brand-400 text-brand-400" />
                        <span className="text-xs text-white/60">{tile.saves}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link href={(tile as typeof staticTiles[0]).link} className="block">
                  <div className={cn("relative min-h-40 flex flex-col justify-end p-4 bg-gradient-to-br", (tile as typeof staticTiles[0]).gradient)}>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                    <div className="absolute top-3 right-3 text-2xl">{(tile as typeof staticTiles[0]).emoji}</div>
                    <div className="absolute top-2 left-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-black/40 text-white/80">{(tile as typeof staticTiles[0]).tag}</span>
                    </div>
                    {/* Hover save */}
                    <div className="absolute top-8 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.preventDefault(); toggleSave(tile.id); }}
                        className={cn("w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border", saves[tile.id] ? "bg-red-500/80 border-red-500/50" : "bg-black/50 border-white/20")}
                      >
                        <Heart size={12} className={saves[tile.id] ? "fill-white text-white" : "text-white"} />
                      </button>
                    </div>
                    <div className="relative z-10">
                      <div className="text-sm font-bold text-white mb-1">{tile.title}</div>
                      <div className="flex items-center gap-1 text-xs text-white/60">
                        <Bookmark size={9} />
                        {(tile as typeof staticTiles[0]).saves} saves
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/browse" className="btn-secondary">
            Discover More Vendors
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Compact version for homepage
export function InspirationPreview() {
  const TILES = [
    { title: "Floral Arch Dream", emoji: "🌸", tag: "Wedding", gradient: "from-rose-900/60 to-pink-900/60", saves: "1.2k", height: "h-52" },
    { title: "Neon Party Vibes", emoji: "🎉", tag: "Birthday", gradient: "from-purple-900/60 to-violet-900/60", saves: "934", height: "h-36" },
    { title: "Golden Reception", emoji: "✨", tag: "Wedding", gradient: "from-amber-900/60 to-orange-900/60", saves: "1.8k", height: "h-44" },
    { title: "Balloon Cloud", emoji: "🎈", tag: "Birthday", gradient: "from-blue-900/60 to-cyan-900/60", saves: "2.1k", height: "h-52" },
    { title: "Candlelit Dinner", emoji: "🕯️", tag: "Anniversary", gradient: "from-red-900/60 to-amber-900/60", saves: "723", height: "h-36" },
    { title: "Pastel Baby Shower", emoji: "👶", tag: "Baby Shower", gradient: "from-pink-900/60 to-purple-900/60", saves: "891", height: "h-44" },
    { title: "Marquee Fairy Lights", emoji: "💡", tag: "Wedding", gradient: "from-indigo-900/60 to-purple-900/60", saves: "1.1k", height: "h-40" },
    { title: "Corporate Gala", emoji: "🏢", tag: "Corporate", gradient: "from-slate-800/80 to-blue-900/60", saves: "445", height: "h-36" },
  ];

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-2">Get Inspired</p>
            <h2 className="text-3xl font-extrabold text-white">Trending Event Styles</h2>
            <p className="text-slate-400 mt-1 text-sm">Browse ideas from real UK events — then plan yours in one click.</p>
          </div>
          <Link href="/inspire" className="hidden sm:flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-medium">
            See all <ArrowRight size={14} />
          </Link>
        </div>

        {/* Masonry-style columns */}
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4 mb-8">
          {TILES.map((item, i) => (
            <Link
              key={i}
              href="/inspire"
              className="break-inside-avoid block group relative rounded-2xl overflow-hidden border border-white/10 hover:border-brand-500/30 transition-all card-hover"
            >
              <div className={cn(`${item.height} flex flex-col justify-end p-4 bg-gradient-to-br`, item.gradient)}>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/55" />
                <div className="absolute top-3 right-3 text-xl group-hover:scale-110 transition-transform">{item.emoji}</div>
                <div className="absolute top-2 left-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-black/40 text-white/80">{item.tag}</span>
                </div>
                <div className="relative z-10">
                  <div className="text-sm font-bold text-white leading-tight">{item.title}</div>
                  <div className="flex items-center gap-1 text-xs text-white/50 mt-0.5">
                    <Heart size={8} className="fill-brand-400 text-brand-400" /> {item.saves} saves
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center sm:hidden">
          <Link href="/inspire" className="btn-secondary inline-flex text-sm">
            <Sparkles size={13} />
            Explore All Inspiration
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Compact video/reel-style placeholder
export function VendorHighlightReel({ vendor }: { vendor: VendorItem }) {
  const cat = VENDOR_CATEGORIES[vendor.category as VendorCategory];
  const coverMedia = vendor.media?.find((m) => m.is_cover) ?? vendor.media?.[0];

  return (
    <Link href={`/vendors/${vendor.id}`} className="group flex-shrink-0 w-36">
      <div className="relative h-48 rounded-2xl overflow-hidden border border-white/10 group-hover:border-brand-500/30 transition-all">
        {coverMedia?.type === "image" ? (
          <Image
            src={coverMedia.url}
            alt={vendor.business_name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="144px"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-900/40 to-violet-900/40 flex items-center justify-center">
            <Play size={24} className="text-white/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        {/* Ring border on hover */}
        <div className="absolute inset-0 rounded-2xl ring-2 ring-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 left-2 right-2">
          <div className="text-xs font-bold text-white line-clamp-1">{vendor.business_name}</div>
          <div className="text-xs text-white/50">{cat?.label}</div>
        </div>
      </div>
    </Link>
  );
}
