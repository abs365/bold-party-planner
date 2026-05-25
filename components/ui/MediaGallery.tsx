"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Play, Star, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorMedia } from "@/types";

interface MediaGalleryProps {
  media: VendorMedia[];
  className?: string;
  showCoverBadge?: boolean;
}

export function MediaGallery({ media, className, showCoverBadge = false }: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i - 1 + media.length) % media.length : null));
  }, [media.length]);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i + 1) % media.length : null));
  }, [media.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, goPrev, goNext]);

  if (media.length === 0) return null;

  const current = lightboxIndex !== null ? media[lightboxIndex] : null;

  return (
    <>
      {/* Masonry Grid */}
      <div className={cn("columns-2 sm:columns-3 gap-3 space-y-3", className)}>
        {media.map((item, i) => (
          <div
            key={item.id}
            className="break-inside-avoid relative group cursor-pointer rounded-xl overflow-hidden bg-white/4 border border-white/8"
            onClick={() => openLightbox(i)}
          >
            {item.type === "video" ? (
              <div className="relative aspect-video bg-black/50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-brand-500/40 transition-colors">
                    <Play size={18} className="text-white ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">Video</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Image
                  src={item.url}
                  alt={item.caption ?? item.alt_text ?? ""}
                  width={400}
                  height={300}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {showCoverBadge && item.is_cover && (
                <span className="badge bg-gold-500/80 text-black text-xs font-bold">
                  <Star size={9} />Cover
                </span>
              )}
              {item.is_featured && (
                <span className="badge bg-brand-500/80 text-white text-xs">Featured</span>
              )}
            </div>

            {/* Caption */}
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white">{item.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {current && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-scale-in"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            onClick={closeLightbox}
          >
            <X size={20} className="text-white" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {media.length}
          </div>

          {/* Prev */}
          {media.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
          )}

          {/* Main media */}
          <div
            className="max-w-4xl max-h-[85vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {current.type === "video" ? (
              <video
                src={current.url}
                controls
                autoPlay
                className="max-h-[85vh] max-w-full rounded-xl"
              />
            ) : (
              <div className="relative max-h-[85vh]">
                <Image
                  src={current.url}
                  alt={current.caption ?? current.alt_text ?? ""}
                  width={900}
                  height={700}
                  className="max-h-[85vh] w-auto object-contain rounded-xl"
                  sizes="90vw"
                  priority
                />
              </div>
            )}
            {current.caption && (
              <p className="text-center text-white/70 text-sm mt-3">{current.caption}</p>
            )}
          </div>

          {/* Next */}
          {media.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          )}

          {/* Thumbnails strip */}
          {media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto pb-1">
              {media.map((m, i) => (
                <button
                  key={m.id}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={cn(
                    "flex-shrink-0 w-12 h-9 rounded-lg overflow-hidden border-2 transition-all",
                    i === lightboxIndex ? "border-brand-500 opacity-100" : "border-white/20 opacity-50 hover:opacity-75"
                  )}
                >
                  {m.type === "video" ? (
                    <div className="w-full h-full bg-black/50 flex items-center justify-center">
                      <Play size={10} className="text-white" />
                    </div>
                  ) : (
                    <Image src={m.url} alt="" width={48} height={36} className="object-cover w-full h-full" sizes="48px" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/** Compact horizontal thumbnail strip */
export function MediaStrip({ media, maxVisible = 4, onOpenGallery }: { media: VendorMedia[]; maxVisible?: number; onOpenGallery?: (index: number) => void }) {
  const visible = media.slice(0, maxVisible);
  const overflow = media.length - maxVisible;

  if (visible.length === 0) return null;

  return (
    <div className="flex gap-1.5">
      {visible.map((m, i) => (
        <div
          key={m.id}
          className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group"
          onClick={() => onOpenGallery?.(i)}
        >
          {m.type === "video" ? (
            <div className="w-full h-full bg-black/50 flex items-center justify-center">
              <Play size={12} className="text-white" />
            </div>
          ) : (
            <Image src={m.url} alt="" width={64} height={64} className="object-cover w-full h-full group-hover:scale-110 transition-transform" sizes="64px" />
          )}
          {i === maxVisible - 1 && overflow > 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-sm font-bold">+{overflow}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
