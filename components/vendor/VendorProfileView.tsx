"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Star, CheckCircle2, Play, Calendar, Clock,
  Share2, Heart, ChevronLeft, ChevronRight, MessageCircle,
  Package, X, ShieldCheck, BadgeCheck, ArrowRight,
} from "lucide-react";
import { BookingPromise } from "@/components/ui/BookingPromise";
import { cn, formatCurrency, formatPackagePrice, formatDate } from "@/lib/utils";
import { VENDOR_CATEGORIES, type Vendor, type VendorMedia, type Review, type Profile } from "@/types";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import { BookingProtectionCard, CompletedJobsPill, ResponseTimePill } from "@/components/ui/TrustBadges";
import { VendorTrustBadges, VendorBadgesRow } from "@/components/vendor/VendorTrustBadges";
import { VendorSocialFeed } from "@/components/ui/social/VendorSocialFeed";
import toast from "react-hot-toast";

interface VendorProfileViewProps {
  vendor: Vendor & {
    media: VendorMedia[];
    reviews: (Review & { profile?: Profile })[];
  };
  currentUser: Profile | null;
}

function ratingLabel(r: number): string {
  if (r >= 4.8) return "Outstanding";
  if (r >= 4.5) return "Excellent";
  if (r >= 4.0) return "Very Good";
  return "Good";
}

export function VendorProfileView({ vendor, currentUser }: VendorProfileViewProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [booking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const cat = VENDOR_CATEGORIES[vendor.category];
  const router = useRouter();

  const mediaList = vendor.media ?? [];
  const packages = vendor.packages ?? [];
  const reviews = vendor.reviews ?? [];

  function openLightbox(index: number) { setLightboxIndex(index); }
  function closeLightbox() { setLightboxIndex(null); }
  function prevMedia() { setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : mediaList.length - 1)); }
  function nextMedia() { setLightboxIndex((i) => (i !== null ? (i + 1) % mediaList.length : 0)); }

  async function handleBookNow() {
    if (!currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(`/vendors/${vendor.id}`)}`);
      return;
    }
    if (currentUser.role === "vendor") { toast.error("Vendors cannot book other vendors"); return; }
    router.push(`/dashboard/bookings/new?vendor=${vendor.id}&package=${selectedPackage ?? ""}`);
  }

  function handleQuote() {
    if (!currentUser) {
      const quoteUrl = `/dashboard/quotes/new?vendor=${vendor.id}&name=${encodeURIComponent(vendor.business_name)}`;
      router.push(`/login?redirect=${encodeURIComponent(quoteUrl)}`);
      return;
    }
    if (currentUser.role === "vendor") { toast.error("Vendors cannot request quotes"); return; }
    router.push(`/dashboard/quotes/new?vendor=${vendor.id}&name=${encodeURIComponent(vendor.business_name)}`);
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const heroMedia = mediaList[0];
  const thumbnails = mediaList.slice(1, 5);

  return (
    <div className="bg-white">
      {/* Lightbox */}
      {lightboxIndex !== null && mediaList[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X size={18} className="text-white" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prevMedia(); }} className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div className="max-w-5xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            {mediaList[lightboxIndex].type === "image" ? (
              <Image
                src={mediaList[lightboxIndex].url}
                alt=""
                width={1400}
                height={900}
                className="max-h-[85vh] w-auto object-contain rounded-xl"
              />
            ) : (
              <video src={mediaList[lightboxIndex].url} controls autoPlay className="max-h-[85vh] w-auto rounded-xl" />
            )}
            {mediaList[lightboxIndex].caption && (
              <p className="text-center text-sm text-slate-400 mt-3">{mediaList[lightboxIndex].caption}</p>
            )}
          </div>
          <button onClick={(e) => { e.stopPropagation(); nextMedia(); }} className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronRight size={20} className="text-white" />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-slate-500 tabular-nums">
            {lightboxIndex + 1} / {mediaList.length}
          </div>
        </div>
      )}

      {/* HERO: cinematic full-width image with vendor identity overlay */}
      <div className="relative w-full overflow-hidden" style={{ height: "clamp(320px, 55vw, 520px)" }}>
        {heroMedia ? (
          heroMedia.type === "image" ? (
            <Image
              src={heroMedia.url}
              alt={vendor.business_name}
              fill
              priority
              className="object-cover object-center cursor-pointer"
              sizes="100vw"
              onClick={() => openLightbox(0)}
            />
          ) : (
            <video src={heroMedia.url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
          )
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(160deg, #0B1F4D 0%, #091529 100%)" }} />
        )}

        {/* Dark gradient overlay: anchors identity text at bottom, photography visible above */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(4,8,20,0.88) 0%, rgba(4,8,20,0.42) 40%, rgba(4,8,20,0.06) 100%)" }}
        />

        {/* Top-right controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {mediaList.length > 1 && (
            <button
              onClick={() => openLightbox(0)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              {mediaList.length} photos
            </button>
          )}
          <button
            onClick={async () => {
              if (!currentUser) { toast.error("Sign in to save vendors"); return; }
              setSavePending(true);
              try {
                const res = await fetch("/api/saved-vendors", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ vendor_id: vendor.id }),
                });
                const data = await res.json() as { saved?: boolean };
                setSaved(!!data.saved);
                toast.success(data.saved ? "Saved to your list!" : "Removed from saved");
              } catch {
                toast.error("Could not save vendor");
              } finally {
                setSavePending(false);
              }
            }}
            disabled={savePending}
            className="p-2.5 rounded-full transition-all"
            style={{
              background: saved ? "rgba(239,68,68,0.85)" : "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
            title={saved ? "Unsave vendor" : "Save vendor"}
          >
            <Heart size={16} className={saved ? "fill-white text-white" : "text-white"} />
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: vendor.business_name, text: `Book ${vendor.business_name} on ELBOLD Events`, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied!");
              }
            }}
            className="p-2.5 rounded-full transition-colors"
            style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <Share2 size={16} className="text-white" />
          </button>
        </div>

        {/* Bottom: Vendor identity */}
        <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-8 pb-6 pt-16">
          {/* Category + verification chips */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase"
              style={{ background: "rgba(212,175,55,0.2)", border: "1px solid rgba(212,175,55,0.35)", color: "#D4AF37" }}
            >
              <span>{cat?.icon}</span>
              <span>{vendor.category === "other" && vendor.custom_category_description ? vendor.custom_category_description : cat?.label}</span>
            </span>
            {vendor.verified && (
              <Link
                href="/how-we-verify"
                title="Learn how ELBOLD verifies vendors"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-opacity"
                style={{ background: "rgba(5,150,105,0.25)", border: "1px solid rgba(5,150,105,0.4)", color: "#34d399" }}
              >
                <CheckCircle2 size={11} />
                ELBOLD Verified
              </Link>
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-2 leading-tight">
            {vendor.business_name}
          </h1>

          {/* Location + Rating + Price row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              <MapPin size={14} style={{ color: "#D4AF37" }} />
              {vendor.city}
              {vendor.travel_radius_km && (
                <span style={{ color: "rgba(255,255,255,0.4)" }}>
                  &nbsp;&middot;&nbsp;Travels up to {vendor.travel_radius_km}km
                </span>
              )}
            </div>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((n) => (
                    <Star
                      key={n}
                      size={13}
                      style={avgRating >= n ? { fill: "#fbbf24", color: "#fbbf24" } : { fill: "none", color: "rgba(255,255,255,0.25)" }}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-white">{avgRating.toFixed(1)}</span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {ratingLabel(avgRating)} &middot; {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}
            {vendor.min_price && (
              <div className="text-sm">
                <span style={{ color: "rgba(255,255,255,0.5)" }}>From </span>
                <span className="font-bold" style={{ color: "#D4AF37" }}>{formatCurrency(vendor.min_price)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {thumbnails.length > 0 && (
        <div className="flex gap-1.5 px-4 sm:px-6 py-3 overflow-x-auto" style={{ background: "#09111f" }}>
          {thumbnails.map((media, i) => (
            <div
              key={media.id}
              className="relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => openLightbox(i + 1)}
            >
              {media.type === "image" ? (
                <Image src={media.url} alt="" fill className="object-cover group-hover:opacity-75 transition-opacity" sizes="96px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "#1a2744" }}>
                  <Play size={18} className="text-white/60" />
                </div>
              )}
              {i === 3 && mediaList.length > 5 && (
                <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">+{mediaList.length - 5}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main content grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-28 lg:pb-12">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT column: Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Badges row */}
            <div className="flex flex-wrap gap-2 items-center">
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
              />
              {(vendor.subscription_plan === "featured" || vendor.featured) && (
                <Badge variant="gold">Featured</Badge>
              )}
              {vendor.subscription_plan === "pro" && !vendor.featured && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-50 text-[#0B1F4D] border border-slate-200 font-medium">
                  <CheckCircle2 size={11} /> Pro Vendor
                </span>
              )}
              {vendor.years_experience && (
                <Badge>{vendor.years_experience}+ years experience</Badge>
              )}
              <ResponseTimePill avgHours={vendor.rating >= 4.8 ? 1 : vendor.rating >= 4.5 ? 3 : 12} />
              <CompletedJobsPill reviewCount={vendor.review_count} />
              {vendor.instagram_url && (
                <a
                  href={vendor.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium hover:bg-pink-50 transition-colors")}
                >
                  <span className="font-bold text-[10px] leading-none">IG</span> Instagram
                </a>
              )}
            </div>

            {/* Rating summary */}
            {reviews.length > 0 && (
              <div
                className="flex items-center gap-5 p-5 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(212,175,55,0.02) 100%)",
                  border: "1px solid rgba(212,175,55,0.18)",
                }}
              >
                <div className="text-center min-w-[64px]">
                  <div className="text-4xl font-bold" style={{ color: "#0B1F4D" }}>{avgRating.toFixed(1)}</div>
                  <div className="text-xs font-semibold mt-1" style={{ color: "#D4AF37" }}>{ratingLabel(avgRating)}</div>
                  <StarRating rating={avgRating} size={12} className="justify-center mt-1.5" />
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5,4,3,2,1].map((n) => {
                    const count = reviews.filter((r) => Math.floor(r.rating) === n).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={n} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400 w-2 text-right">{n}</span>
                        <Star size={10} style={{ fill: "#D4AF37", color: "#D4AF37" }} />
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%`, background: "#D4AF37" }}
                          />
                        </div>
                        <span className="text-gray-400 w-4">{count}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center min-w-[48px]">
                  <div className="text-2xl font-bold text-gray-900">{reviews.length}</div>
                  <div className="text-xs text-gray-400 mt-0.5">reviews</div>
                </div>
              </div>
            )}

            {/* About */}
            {vendor.bio && (
              <div className="p-6 rounded-2xl" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <h2 className="text-lg font-bold text-gray-900 mb-3">About {vendor.business_name}</h2>
                <p className="text-gray-600 leading-relaxed">{vendor.bio}</p>
              </div>
            )}

            {/* Social / Highlights: only render when vendor has uploaded media to avoid
                showing placeholder data ("Sample content") to prospective customers */}
            {mediaList.length > 0 && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "#0B1829", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="p-6">
                  <VendorSocialFeed vendorName={vendor.business_name} />
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-5">What Clients Say</h2>
                <div className="space-y-4">
                  {reviews.slice(0, 6).map((review) => (
                    <div
                      key={review.id}
                      className="rounded-2xl p-5"
                      style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #0B1F4D, #1e3a6e)" }}
                          >
                            {review.profile?.full_name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{review.profile?.full_name ?? "Verified Client"}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{formatDate(review.created_at)}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StarRating rating={review.rating} size={14} />
                          <span className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: "rgba(5,150,105,0.8)" }}>
                            Verified
                          </span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                      )}
                      {review.response && (
                        <div
                          className="mt-4 ml-2 pl-4 py-3 rounded-xl"
                          style={{ borderLeft: "3px solid #D4AF37", background: "rgba(212,175,55,0.04)" }}
                        >
                          <div className="text-xs font-semibold mb-1.5" style={{ color: "#0B1F4D" }}>
                            Response from {vendor.business_name}:
                          </div>
                          <p className="text-gray-500 text-sm leading-relaxed">{review.response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Why book through ELBOLD */}
            <div
              className="rounded-2xl p-6"
              style={{ background: "linear-gradient(135deg, #0B1F4D 0%, #162447 100%)", border: "1px solid rgba(212,175,55,0.12)" }}
            >
              <h3 className="text-base font-bold mb-5" style={{ color: "rgba(255,255,255,0.92)" }}>
                Why Book Through ELBOLD
              </h3>
              <div className="grid sm:grid-cols-3 gap-5">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Secure Payments",
                    body: "Every booking goes through Stripe. Your money is held safely until the event is complete.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Verified Vendors",
                    body: "Every vendor is individually reviewed by our team before appearing on the platform.",
                  },
                  {
                    icon: BadgeCheck,
                    title: "Dispute Protection",
                    body: "If something goes wrong, our team steps in. You are never left to handle it alone.",
                  },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={15} style={{ color: "#D4AF37", flexShrink: 0 }} />
                      <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{title}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT column: Booking panel */}
          <div className="space-y-4">
            <div className="sticky top-24">

              {/* Main booking card */}
              <div className="rounded-2xl overflow-hidden shadow-lg" style={{ border: "1px solid rgba(11,31,77,0.1)" }}>

                {/* Navy header */}
                <div
                  className="px-5 py-4"
                  style={{ background: "linear-gradient(135deg, #0B1F4D 0%, #162447 100%)" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div
                        className="text-xs tracking-widest uppercase font-semibold mb-1"
                        style={{ color: "rgba(212,175,55,0.65)" }}
                      >
                        Book This Vendor
                      </div>
                      <div className="text-white font-bold text-sm leading-snug max-w-[140px]">
                        {vendor.business_name}
                      </div>
                    </div>
                    {vendor.min_price && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>From</div>
                        <div className="text-xl font-bold" style={{ color: "#D4AF37" }}>{formatCurrency(vendor.min_price)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 bg-white">
                  {/* Packages */}
                  {packages.length > 0 && (
                    <>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        <Package size={11} />
                        Choose a Package
                      </div>
                      <div className="space-y-2 mb-5">
                        {packages.map((pkg) => (
                          <div
                            key={pkg.id}
                            onClick={() => setSelectedPackage(pkg.id === selectedPackage ? null : pkg.id)}
                            className="p-3.5 rounded-xl border cursor-pointer transition-all"
                            style={
                              selectedPackage === pkg.id
                                ? { borderColor: "#D4AF37", background: "rgba(212,175,55,0.05)" }
                                : { borderColor: "#e5e7eb", background: "#f9fafb" }
                            }
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 leading-snug">{pkg.name}</div>
                                {pkg.is_popular && (
                                  <div className="text-xs font-semibold mt-0.5" style={{ color: "#D4AF37" }}>Most Popular</div>
                                )}
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pkg.description}</p>
                              </div>
                              <div className="text-sm font-bold text-gray-900 flex-shrink-0 text-right">
                                {formatPackagePrice(pkg.price, pkg.pricing_type)}
                              </div>
                            </div>
                            {pkg.duration_hours && pkg.pricing_type !== "price_on_request" && (
                              <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                <Clock size={10} />
                                {pkg.duration_hours}h
                              </div>
                            )}
                            {pkg.includes.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {pkg.includes.slice(0, 3).map((item, i) => (
                                  <li key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <CheckCircle2 size={10} style={{ color: "#059669", flexShrink: 0 }} />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Price display (no packages) */}
                  {packages.length === 0 && vendor.min_price && (
                    <div
                      className="p-4 rounded-xl mb-5 text-center"
                      style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.18)" }}
                    >
                      <div className="text-xs text-gray-500 mb-1">Starting from</div>
                      <div className="text-2xl font-bold" style={{ color: "#0B1F4D" }}>{formatCurrency(vendor.min_price)}</div>
                      {vendor.max_price && (
                        <div className="text-xs text-gray-400 mt-0.5">up to {formatCurrency(vendor.max_price)}</div>
                      )}
                    </div>
                  )}

                  {packages.length === 0 && !vendor.min_price && (
                    <div className="p-4 rounded-xl mb-5 text-center" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                      <p className="text-sm text-gray-500">Request a quote for pricing</p>
                    </div>
                  )}

                  {/* Primary CTA: Get Free Quote */}
                  <button
                    onClick={handleQuote}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                    style={{ background: "#0B1F4D", color: "#D4AF37", border: "none" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#162447"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#0B1F4D"; }}
                  >
                    <MessageCircle size={15} />
                    Request Free Quote
                    <ArrowRight size={14} />
                  </button>

                  {/* Secondary: Book now (if packages selected) */}
                  {(() => {
                    const selPkg = packages.find((p) => p.id === selectedPackage);
                    const isPOR = selPkg?.pricing_type === "price_on_request";
                    if (isPOR) return null;
                    return (
                      <button
                        onClick={handleBookNow}
                        disabled={booking}
                        className="w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 mt-2.5 transition-colors"
                        style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#e5e7eb"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                      >
                        <Calendar size={14} />
                        {selectedPackage ? "Book Selected Package" : "Book Now"}
                      </button>
                    );
                  })()}

                  <p className="text-center text-xs text-gray-400 mt-3">
                    Free to request &nbsp;&middot;&nbsp; No payment until confirmed
                  </p>

                  {/* Trust signals */}
                  <div className="border-t border-gray-100 mt-4 pt-4 space-y-2.5">
                    {[
                      { icon: MessageCircle, text: "Free to enquire, no obligation" },
                      { icon: CheckCircle2, text: "Deposit held by Stripe until event" },
                      { icon: ShieldCheck, text: "Full refund if vendor cancels" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
                        <Icon size={13} style={{ color: "#0B1F4D", flexShrink: 0 }} />
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trust badges panel */}
              <VendorTrustBadges
                verificationLevel={vendor.verification_level}
                verified={vendor.verified}
                responseRate={vendor.response_rate}
                completedJobsCount={vendor.completed_jobs_count}
                yearsExperience={vendor.years_experience}
                cancellationRate={vendor.cancellation_rate}
                className="mt-4"
              />

              {/* Booking protection card */}
              <BookingProtectionCard vendorName={vendor.business_name} />

              {/* Booking promise */}
              <BookingPromise vendorName={vendor.business_name} variant="both" className="mt-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA bar */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3 flex items-center gap-3 shadow-2xl"
        style={{ background: "#0B1F4D", borderTop: "1px solid rgba(212,175,55,0.2)" }}
      >
        {vendor.min_price ? (
          <div className="flex-1 min-w-0">
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>From</div>
            <div className="text-base font-bold" style={{ color: "#D4AF37" }}>{formatCurrency(vendor.min_price)}</div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{vendor.business_name}</div>
            {vendor.verified && (
              <div className="flex items-center gap-1 mt-0.5">
                <CheckCircle2 size={10} style={{ color: "#34d399" }} />
                <span className="text-xs" style={{ color: "#34d399" }}>Verified</span>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleBookNow}
          className="py-2.5 px-4 rounded-xl text-sm font-medium flex-shrink-0 transition-colors"
          style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          Book
        </button>
        <button
          onClick={handleQuote}
          className="py-2.5 px-5 rounded-xl text-sm font-semibold flex-shrink-0 flex items-center gap-1.5"
          style={{ background: "#D4AF37", color: "#0B1F4D" }}
        >
          <MessageCircle size={14} />
          Get Free Quote
        </button>
      </div>
    </div>
  );
}
