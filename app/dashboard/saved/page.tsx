import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Heart, Store, Search } from "lucide-react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function SavedVendorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/saved");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { data: saved } = await supabase
    .from("saved_vendors")
    .select("vendor_id, created_at, vendor:vendors(id, business_name, category, city, rating, review_count, media:vendor_media(url, is_cover))")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const vendors = (saved ?? []).map((s) => ({ ...(s.vendor as unknown as Record<string, unknown>), saved_at: s.created_at }));

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Saved Vendors</h1>
            <p className="text-slate-400 text-sm mt-1">Vendors you&apos;ve bookmarked for your events</p>
          </div>
          {vendors.length > 0 && (
            <Link href="/browse" className="btn-secondary text-sm">
              <Store size={14} />
              Browse More
            </Link>
          )}
        </div>

        {vendors.length === 0 ? (
          <>
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
                <Heart size={28} className="text-brand-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">No saved vendors yet</h2>
              <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                Browse the marketplace and tap the heart icon on any vendor profile to save them here for easy access when planning your next event.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/browse" className="btn-primary">
                  <Store size={15} />
                  Browse Vendors
                </Link>
                <Link href="/browse" className="btn-secondary">
                  <Search size={15} />
                  Search by Category
                </Link>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-semibold text-white mb-3">How saving works</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: "❤️", title: "Heart a vendor", desc: "Tap the heart icon on any vendor profile or listing card" },
                  { icon: "📋", title: "Organise by event", desc: "Saved vendors stay here so you can compare and shortlist" },
                  { icon: "📨", title: "Request quotes", desc: "Send a quote request directly from your saved list" },
                ].map((step) => (
                  <div key={step.title} className="p-4 rounded-xl bg-white/4 border border-white/6">
                    <div className="text-2xl mb-2">{step.icon}</div>
                    <div className="text-sm font-semibold text-white mb-1">{step.title}</div>
                    <div className="text-xs text-slate-400">{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {vendors.map((v) => {
              const vendor = v as { id: string; business_name: string; category: string; city: string; rating: number; review_count: number; media?: { url: string; is_cover: boolean }[]; saved_at: string };
              const cover = vendor.media?.find((m) => m.is_cover)?.url;
              return (
                <Link key={vendor.id} href={`/vendors/${vendor.id}`} className="glass-card p-4 flex gap-4 hover:bg-white/5 transition-colors">
                  <div className="w-16 h-16 rounded-xl bg-brand-500/15 flex-shrink-0 overflow-hidden">
                    {cover ? (
                      <img src={cover} alt={vendor.business_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-400 text-2xl">
                        {vendor.business_name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{vendor.business_name}</h3>
                    <p className="text-slate-400 text-xs capitalize mt-0.5">{vendor.category.replace("_", " ")} · {vendor.city}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="text-white text-xs font-medium">{vendor.rating.toFixed(1)}</span>
                      <span className="text-slate-500 text-xs">({vendor.review_count})</span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/quotes/new?vendor=${vendor.id}&name=${encodeURIComponent(vendor.business_name)}`}
                    className="self-center btn-secondary text-xs px-3 py-1.5 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Quote
                  </Link>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
