import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { VENDOR_CATEGORIES } from "@/types";
import { TEST_VENDOR_EXCLUSION } from "@/lib/test-vendors";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1.0, changeFrequency: "weekly", lastModified: now },
    { url: `${base}/browse`, priority: 0.9, changeFrequency: "daily", lastModified: now },
    { url: `${base}/how-it-works`, priority: 0.7, changeFrequency: "monthly", lastModified: now },
    { url: `${base}/vendor/apply`, priority: 0.7, changeFrequency: "monthly", lastModified: now },
    { url: `${base}/founding-vendors`, priority: 0.8, changeFrequency: "monthly", lastModified: now },
    { url: `${base}/login`, priority: 0.4, changeFrequency: "yearly", lastModified: now },
    { url: `${base}/signup`, priority: 0.5, changeFrequency: "yearly", lastModified: now },
    // Trust & content pages
    { url: `${base}/about`, priority: 0.8, changeFrequency: "monthly", lastModified: now },
    { url: `${base}/trust`, priority: 0.8, changeFrequency: "monthly", lastModified: now },
    { url: `${base}/our-commitments`, priority: 0.8, changeFrequency: "monthly", lastModified: now },
    { url: `${base}/vendor-standards`, priority: 0.8, changeFrequency: "monthly", lastModified: now },
    { url: `${base}/why-elbold`, priority: 0.7, changeFrequency: "monthly", lastModified: now },
    { url: `${base}/how-we-verify`, priority: 0.8, changeFrequency: "monthly", lastModified: now },
    // Vendor acquisition & spotlights
    { url: `${base}/vendor-spotlights`, priority: 0.7, changeFrequency: "weekly", lastModified: now },
    // Resources hub
    { url: `${base}/resources`, priority: 0.8, changeFrequency: "weekly", lastModified: now },
    // Inspiration
    { url: `${base}/inspire`, priority: 0.7, changeFrequency: "weekly", lastModified: now },
    // Guides hub
    { url: `${base}/guides`, priority: 0.8, changeFrequency: "weekly", lastModified: now },
    // Support
    { url: `${base}/support`, priority: 0.6, changeFrequency: "monthly", lastModified: now },
    { url: `${base}/help`, priority: 0.5, changeFrequency: "monthly", lastModified: now },
    // Legal & trust pages
    { url: `${base}/booking-protection`, priority: 0.5, changeFrequency: "monthly", lastModified: now },
    { url: `${base}/privacy`, priority: 0.3, changeFrequency: "yearly", lastModified: now },
    { url: `${base}/terms`, priority: 0.3, changeFrequency: "yearly", lastModified: now },
    { url: `${base}/refunds`, priority: 0.3, changeFrequency: "monthly", lastModified: now },
    { url: `${base}/vendor-terms`, priority: 0.3, changeFrequency: "yearly", lastModified: now },
    { url: `${base}/community-guidelines`, priority: 0.3, changeFrequency: "yearly", lastModified: now },
  ];

  // Category SEO pages
  const categoryRoutes: MetadataRoute.Sitemap = Object.keys(VENDOR_CATEGORIES).map((cat) => ({
    url: `${base}/categories/${cat}`,
    priority: 0.8,
    changeFrequency: "weekly" as const,
    lastModified: now,
  }));

  // Location SEO pages
  const locationRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/essex`, priority: 0.85, changeFrequency: "weekly" as const, lastModified: now },
    { url: `${base}/kent`, priority: 0.85, changeFrequency: "weekly" as const, lastModified: now },
    { url: `${base}/london`, priority: 0.9, changeFrequency: "weekly" as const, lastModified: now },
    { url: `${base}/essex/djs`, priority: 0.8, changeFrequency: "weekly" as const, lastModified: now },
    { url: `${base}/essex/photographers`, priority: 0.8, changeFrequency: "weekly" as const, lastModified: now },
    { url: `${base}/essex/caterers`, priority: 0.8, changeFrequency: "weekly" as const, lastModified: now },
    { url: `${base}/kent/djs`, priority: 0.8, changeFrequency: "weekly" as const, lastModified: now },
    { url: `${base}/kent/photographers`, priority: 0.8, changeFrequency: "weekly" as const, lastModified: now },
    { url: `${base}/kent/caterers`, priority: 0.8, changeFrequency: "weekly" as const, lastModified: now },
    { url: `${base}/london/djs`, priority: 0.85, changeFrequency: "weekly" as const, lastModified: now },
    { url: `${base}/london/photographers`, priority: 0.85, changeFrequency: "weekly" as const, lastModified: now },
    { url: `${base}/london/caterers`, priority: 0.85, changeFrequency: "weekly" as const, lastModified: now },
  ];

  // Approved vendor profile pages
  let vendorRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data: vendors } = await supabase
      .from("vendors")
      .select("id, updated_at")
      .eq("status", "approved")
      .not("id", "in", TEST_VENDOR_EXCLUSION)
      .order("updated_at", { ascending: false })
      .limit(200);

    vendorRoutes = (vendors ?? []).map((v) => ({
      url: `${base}/vendors/${v.id}`,
      priority: 0.6,
      changeFrequency: "weekly" as const,
      lastModified: v.updated_at ? new Date(v.updated_at as string) : now,
    }));
  } catch { /* non-fatal — sitemap still works without vendor URLs */ }

  const guideRoutes: MetadataRoute.Sitemap = [
    "how-much-does-a-dj-cost-in-essex",
    "wedding-planning-checklist-uk",
    "how-to-choose-a-photographer",
    "birthday-party-planning-guide",
    "corporate-event-planning-checklist",
  ].map((slug) => ({
    url: `${base}/guides/${slug}`,
    priority: 0.7,
    changeFrequency: "monthly" as const,
    lastModified: now,
  }));

  return [...staticRoutes, ...categoryRoutes, ...locationRoutes, ...guideRoutes, ...vendorRoutes];
}
