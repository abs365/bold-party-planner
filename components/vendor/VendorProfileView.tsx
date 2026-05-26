"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin, Star, CheckCircle2, Play, Calendar, Clock,
  Share2, Heart, ChevronLeft, ChevronRight, MessageCircle,
  Package, X, Zap,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { VENDOR_CATEGORIES, type Vendor, type VendorMedia, type Review, type Profile } from "@/types";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import { BookingProtectionCard, CompletedJobsPill, ResponseTimePill } from "@/components/ui/TrustBadges";
import { VendorSocialFeed } from "@/components/ui/social/VendorSocialFeed";
import toast from "react-hot-toast";

interface VendorProfileViewProps {
  vendor: Vendor & {
    media: VendorMedia[];
    reviews: (Review & { profile?: Profile })[];
  };
  currentUser: Profile | null;
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
      toast.error("Please sign in to book a vendor");
      router.push("/login");
      return;
    }
    if (currentUser.role === "vendor") {
      toast.error("Vendors cannot book other vendors");
      return;
    }
    router.push(`/dashboard/bookings/new?vendor=${vendor.id}&package=${selectedPackage ?? ""}`);
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 pb-28 lg:pb-10">
      {/* Lightbox */}
      {lightboxIndex !== null && mediaList[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20">
            <X size={20} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prevMedia(); }} className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20">
            <ChevronLeft size={20} />
          </button>
          <div className="max-w-4xl max-h-[80vh] relative" onClick={(e) => e.stopPropagation()}>
            {mediaList[lightboxIndex].type === "image" ? (
              <Image
                src={mediaList[lightboxIndex].url}
                alt=""
                width={1200}
                height={800}
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            ) : (
              <video src={mediaList[lightboxIndex].url} controls autoPlay className="max-h-[80vh] w-auto rounded-xl" />
            )}
            {mediaList[lightboxIndex].caption && (
              <p className="text-center text-sm text-slate-400 mt-3">{mediaList[lightboxIndex].caption}</p>
            )}
          </div>
          <button onClick={(e) => { e.stopPropagation(); nextMedia(); }} className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20">
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-4 text-sm text-slate-500">
            {lightboxIndex + 1} / {mediaList.length}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Media + Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media Gallery */}
          {mediaList.length > 0 ? (
            <div>
              {/* Main image */}
              <div
                className="relative h-96 rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => openLightbox(0)}
              >
                {mediaList[0].type === "image" ? (
                  <Image
                    src={mediaList[0].url}
                    alt={vendor.business_name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority
                  />
                ) : (
                  <video src={mediaList[0].url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                  View all {mediaList.length} photos
                </div>
              </div>

              {/* Thumbnails */}
              {mediaList.length > 1 && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {mediaList.slice(1, 6).map((media, i) => (
                    <div
                      key={media.id}
                      className="relative h-20 rounded-xl overflow-hidden cursor-pointer group"
                      onClick={() => openLightbox(i + 1)}
                    >
                      {media.type === "image" ? (
                        <Image src={media.url} alt="" fill className="object-cover group-hover:opacity-80 transition-opacity" sizes="20vw" />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          <Play size={20} className="text-white" />
                        </div>
                      )}
                      {i === 4 && mediaList.length > 6 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm font-bold">
                          +{mediaList.length - 6}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 rounded-2xl bg-white/5 flex items-center justify-center">
              <span className="text-6xl">{cat?.icon}</span>
            </div>
          )}

          {/* Vendor Info */}
          <div className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-brand-400 mb-1">
                  <span>{cat?.icon}</span>
                  <span className="font-medium">{cat?.label}</span>
                </div>
                <h1 className="text-2xl font-bold text-white">{vendor.business_name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-500" />
                    <span className="text-sm text-slate-400">{vendor.city}</span>
                  </div>
                  {vendor.travel_radius_km && (
                    <span className="text-sm text-slate-500">· Travels up to {vendor.travel_radius_km}km</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
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
                  className={cn("p-2.5 rounded-xl transition-all", saved ? "bg-red-500/20 border border-red-500/30" : "bg-white/5 hover:bg-white/8")}
                  title={saved ? "Unsave vendor" : "Save vendor"}
                >
                  <Heart size={18} className={saved ? "fill-red-400 text-red-400" : "text-slate-400"} />
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: vendor.business_name, text: `Check out ${vendor.business_name} on Bold Party`, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/8 transition-colors"
                  title="Share this vendor"
                >
                  <Share2 size={18} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-5">
              {vendor.verified && (
                <Badge variant="success">
                  <CheckCircle2 size={12} /> Verified Vendor
                </Badge>
              )}
              {(vendor.subscription_plan === "featured" || vendor.featured) && (
                <Badge variant="gold">⭐ Featured</Badge>
              )}
              {vendor.subscription_plan === "pro" && !vendor.featured && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 text-xs font-medium hover:bg-pink-500/20 transition-colors"
                >
                  <span className="font-bold text-[10px] leading-none">IG</span> Instagram
                </a>
              )}
            </div>

            {/* Rating Summary */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/8 border border-amber-500/15 mb-5">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-white">{avgRating.toFixed(1)}</div>
                  <StarRating rating={avgRating} size={14} className="justify-center mt-1" />
                </div>
                <div className="flex-1">
                  {[5,4,3,2,1].map((n) => {
                    const count = reviews.filter((r) => Math.floor(r.rating) === n).length;
                    return (
                      <div key={n} className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 w-2">{n}</span>
                        <div className="flex-1 bg-white/5 rounded-full h-1.5">
                          <div
                            className="bg-amber-400 h-1.5 rounded-full"
                            style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : "0%" }}
                          />
                        </div>
                        <span className="text-slate-600 w-4">{count}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-white">{reviews.length}</div>
                  <div className="text-xs text-slate-500">reviews</div>
                </div>
              </div>
            )}

            {/* Bio */}
            {vendor.bio && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">About</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{vendor.bio}</p>
              </div>
            )}
          </div>

          {/* Social / Event Highlights */}
          <div className="glass-card p-6">
            <VendorSocialFeed vendorName={vendor.business_name} />
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-bold text-white mb-5 flex items-center gap-2">
                <MessageCircle size={17} className="text-brand-400" />
                Customer Reviews ({reviews.length})
              </h3>
              <div className="space-y-5">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="border-b border-white/8 pb-5 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-sm font-bold text-white">
                          {review.profile?.full_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{review.profile?.full_name ?? "Anonymous"}</div>
                          <div className="text-xs text-slate-600">{formatDate(review.created_at)}</div>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size={13} />
                    </div>
                    {review.comment && (
                      <p className="text-slate-400 text-sm leading-relaxed mt-2">{review.comment}</p>
                    )}
                    {review.response && (
                      <div className="mt-3 ml-4 p-3 rounded-xl bg-white/4 border-l-2 border-brand-500/40">
                        <div className="text-xs font-semibold text-brand-400 mb-1">Vendor reply:</div>
                        <p className="text-slate-400 text-sm">{review.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking Panel (desktop) */}
        <div className="space-y-5">
          {/* Packages */}
          <div className="glass-card p-5 sticky top-24">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Package size={17} className="text-brand-400" />
              Packages & Pricing
            </h3>

            {packages.length > 0 ? (
              <div className="space-y-3 mb-5">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id === selectedPackage ? null : pkg.id)}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all",
                      selectedPackage === pkg.id
                        ? "border-brand-500/40 bg-brand-500/10"
                        : "border-white/10 bg-white/4 hover:border-white/20"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="text-sm font-semibold text-white">{pkg.name}</div>
                        {pkg.is_popular && (
                          <span className="text-xs text-amber-400 font-medium">Most Popular</span>
                        )}
                      </div>
                      <div className="text-lg font-bold text-white">{formatCurrency(pkg.price)}</div>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{pkg.description}</p>
                    {pkg.duration_hours && (
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Clock size={11} />
                        {pkg.duration_hours}h
                      </div>
                    )}
                    {pkg.includes.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {pkg.includes.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                            <CheckCircle2 size={11} className="text-brand-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/4 border border-white/8 mb-5 text-center">
                {vendor.min_price ? (
                  <div>
                    <div className="text-sm text-slate-400">Starting from</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {formatCurrency(vendor.min_price)}
                    </div>
                    {vendor.max_price && (
                      <div className="text-xs text-slate-500">up to {formatCurrency(vendor.max_price)}</div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Contact for pricing</p>
                )}
              </div>
            )}

            {/* Selected package summary */}
            {selectedPackage && (() => {
              const pkg = packages.find((p) => p.id === selectedPackage);
              if (!pkg) return null;
              return (
                <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 mb-4 flex items-center justify-between">
                  <div className="text-xs text-slate-400 truncate mr-2">{pkg.name}</div>
                  <div className="text-lg font-bold text-white flex-shrink-0">{formatCurrency(pkg.price)}</div>
                </div>
              );
            })()}

            <button
              onClick={handleBookNow}
              disabled={booking}
              className="btn-primary w-full py-3.5"
            >
              <Calendar size={16} />
              {selectedPackage ? "Book Selected Package" : "Book Now"}
            </button>

            <button
              onClick={() => {
                if (!currentUser) {
                  toast.error("Please sign in to request a quote");
                  router.push("/login");
                  return;
                }
                if (currentUser.role === "vendor") {
                  toast.error("Vendors cannot request quotes");
                  return;
                }
                router.push(`/dashboard/quotes/new?vendor=${vendor.id}&name=${encodeURIComponent(vendor.business_name)}`);
              }}
              className="btn-secondary w-full py-3 mt-2 text-sm"
            >
              <MessageCircle size={14} />
              Request Free Quote
            </button>

            <p className="text-center text-xs text-slate-600 mt-3">
              You won&apos;t be charged until the vendor confirms
            </p>

            {/* Quick trust signals */}
            <div className="border-t border-white/8 mt-5 pt-5 space-y-3">
              {[
                {
                  icon: Zap,
                  text: `Responds within ${(vendor.rating ?? 0) >= 4.8 ? "1 hour" : (vendor.rating ?? 0) >= 4.5 ? "2 hours" : "24 hours"}`,
                },
                { icon: CheckCircle2, text: "Free to request a quote" },
                { icon: Star, text: "Money-back guarantee" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-slate-400">
                  <Icon size={14} className="text-brand-400" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Booking Protection Card */}
          <BookingProtectionCard vendorName={vendor.business_name} />
        </div>
      </div>

      {/* Mobile sticky CTA bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/10 px-4 py-3 flex items-center gap-3">
        {vendor.min_price ? (
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500">From</div>
            <div className="text-base font-bold text-white">{formatCurrency(vendor.min_price)}</div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{vendor.business_name}</div>
          </div>
        )}
        <button
          onClick={() => {
            if (!currentUser) { toast.error("Please sign in"); router.push("/login"); return; }
            router.push(`/dashboard/quotes/new?vendor=${vendor.id}&name=${encodeURIComponent(vendor.business_name)}`);
          }}
          className="btn-secondary py-2.5 px-4 text-sm flex-shrink-0"
        >
          Quote
        </button>
        <button
          onClick={handleBookNow}
          className="btn-primary py-2.5 px-5 text-sm flex-shrink-0"
        >
          <Calendar size={14} />
          Book Now
        </button>
      </div>
    </div>
  );
}
