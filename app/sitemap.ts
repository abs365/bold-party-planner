import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { VENDOR_CATEGORIES } from "@/types";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://elbold.com";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1.0, changeFrequency: "weekly", lastModified: now },
    { url: `${base}/browse`, priority: 0.9, changeFrequency: "daily", lastModified: now },
    { url: `${base}/how-it-works`, priority: 0.7, changeFrequency: "monthly", lastModified: now },
    { url: `${base}/vendor/apply`, priority: 0.7, changeFrequency: "monthly", lastModified: now },
    { url: `${base}/founding-vendors`, priority: 0.8, changeFrequency: "monthly", lastModified: now },
    { url: `${base}/login`, priority: 0.4, changeFrequency: "yearly", lastModified: now },
    { url: `${base}/signup`, priority: 0.5, changeFrequency: "yearly", lastModified: now },
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

  // Approved vendor profile pages
  let vendorRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data: vendors } = await supabase
      .from("vendors")
      .select("id, updated_at")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(200);

    vendorRoutes = (vendors ?? []).map((v) => ({
      url: `${base}/vendors/${v.id}`,
      priority: 0.6,
      changeFrequency: "weekly" as const,
      lastModified: v.updated_at ? new Date(v.updated_at as string) : now,
    }));
  } catch { /* non-fatal — sitemap still works without vendor URLs */ }

  return [...staticRoutes, ...categoryRoutes, ...vendorRoutes];
}
