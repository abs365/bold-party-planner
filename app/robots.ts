import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elbold.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/browse", "/how-it-works"],
        disallow: ["/dashboard/", "/vendor/", "/admin/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
