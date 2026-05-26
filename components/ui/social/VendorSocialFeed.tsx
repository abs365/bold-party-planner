"use client";

import { Play, Heart, MessageCircle, Share2, Camera, Film, Sparkles, TrendingUp, Plus, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SocialPost {
  id: string;
  type: "image" | "video" | "reel";
  thumbnailUrl?: string;
  caption?: string;
  likes?: number;
  views?: number;
  comments?: number;
  eventType?: string;
  isHighlight?: boolean;
  postedAt?: string;
}

interface VendorSocialFeedProps {
  posts?: SocialPost[];
  vendorName?: string;
  isVendorView?: boolean;
  className?: string;
}

const PLACEHOLDER_POSTS: SocialPost[] = [
  { id: "p1", type: "image",  thumbnailUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400", caption: "Wedding ceremony moment ✨",  likes: 312, views: 2840, comments: 18, eventType: "Wedding",   isHighlight: true },
  { id: "p2", type: "reel",   thumbnailUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400", caption: "Balloon installation timelapse 🎈", likes: 478, views: 6100, comments: 34, eventType: "Birthday",  isHighlight: false },
  { id: "p3", type: "video",  thumbnailUrl: "https://images.unsplash.com/photo-1605289982774-9a6fef564df8?w=400", caption: "Before & after: venue transform",    likes: 201, views: 3200, comments: 22, eventType: "Corporate", isHighlight: false },
  { id: "p4", type: "image",  thumbnailUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400", caption: "5-tier wedding cake reveal 🎂",       likes: 556, views: 4400, comments: 41, eventType: "Wedding",   isHighlight: true },
  { id: "p5", type: "reel",   thumbnailUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400", caption: "Dancefloor highlight reel 🎵",          likes: 389, views: 5200, comments: 27, eventType: "Birthday",  isHighlight: false },
  { id: "p6", type: "image",  thumbnailUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400", caption: "Ceremony arch in full bloom 🌸",      likes: 267, views: 2100, comments: 15, eventType: "Wedding",   isHighlight: false },
];

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function PostTypeIcon({ type, className }: { type: SocialPost["type"]; className?: string }) {
  if (type === "reel")  return <Film size={12} className={cn("text-white", className)} />;
  if (type === "video") return <Play size={12} className={cn("text-white", className)} />;
  return null;
}

export function VendorSocialFeed({ posts, vendorName, isVendorView, className }: VendorSocialFeedProps) {
  const items = posts?.length ? posts : PLACEHOLDER_POSTS;
  const ariaLabel = vendorName ? `${vendorName} event highlights` : "Event highlights";

  return (
    <div className={cn("space-y-4", className)} aria-label={ariaLabel}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-brand-400" />
          <h3 className="text-white font-semibold text-sm">Event Highlights</h3>
          {!posts?.length && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Sample content
            </span>
          )}
        </div>
        {isVendorView && (
          <button className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium">
            <Plus size={13} />
            Add Content
          </button>
        )}
      </div>

      {/* Highlights row */}
      {items.some((p) => p.isHighlight) && (
        <div>
          <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
            <TrendingUp size={11} className="text-brand-400" />
            Top Highlights
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {items.filter((p) => p.isHighlight).map((post) => (
              <div
                key={`hl-${post.id}`}
                className="flex-shrink-0 w-20 flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-full border-2 border-brand-500/60 p-0.5 group-hover:border-brand-400 transition-colors">
                  {post.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.thumbnailUrl}
                      alt={post.eventType ?? ""}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full gradient-brand flex items-center justify-center">
                      <Camera size={16} className="text-white" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-500 truncate w-full text-center leading-tight">
                  {post.eventType ?? "Event"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of posts */}
      <div className="grid grid-cols-3 gap-1.5">
        {items.slice(0, 6).map((post) => (
          <div
            key={post.id}
            className="relative aspect-square rounded-lg overflow-hidden bg-white/5 cursor-pointer group"
          >
            {post.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.thumbnailUrl}
                alt={post.caption ?? ""}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full gradient-brand flex items-center justify-center opacity-40">
                <Camera size={24} className="text-white" />
              </div>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3 text-white text-xs font-semibold">
                {post.likes != null && (
                  <span className="flex items-center gap-1">
                    <Heart size={12} className="fill-white" />
                    {formatCount(post.likes)}
                  </span>
                )}
                {post.views != null && (
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    {formatCount(post.views)}
                  </span>
                )}
              </div>
            </div>
            {/* Type badge */}
            {(post.type === "video" || post.type === "reel") && (
              <div className="absolute top-1.5 right-1.5 bg-black/60 rounded-full p-1">
                <PostTypeIcon type={post.type} />
              </div>
            )}
            {post.type === "reel" && (
              <div className="absolute bottom-1 left-1 bg-brand-500/80 rounded px-1 py-0.5 text-white text-[9px] font-bold uppercase tracking-wide">
                Reel
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Engagement summary */}
      {items.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Heart size={11} className="text-rose-400" />
              {formatCount(items.reduce((s, p) => s + (p.likes ?? 0), 0))} likes
            </span>
            <span className="flex items-center gap-1">
              <Eye size={11} className="text-blue-400" />
              {formatCount(items.reduce((s, p) => s + (p.views ?? 0), 0))} views
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={11} className="text-brand-400" />
              {formatCount(items.reduce((s, p) => s + (p.comments ?? 0), 0))} comments
            </span>
          </div>
          <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <Share2 size={11} />
            Share
          </button>
        </div>
      )}

      {isVendorView && !posts?.length && (
        <div className="p-4 rounded-xl border border-dashed border-white/15 text-center">
          <Film size={20} className="text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm font-medium">No content yet</p>
          <p className="text-white/25 text-xs mt-1 mb-3">Upload photos, event reels, and before/after showcases to attract more customers</p>
          <button className="btn-primary text-xs py-2 px-4">Upload Your First Highlight</button>
        </div>
      )}
    </div>
  );
}
