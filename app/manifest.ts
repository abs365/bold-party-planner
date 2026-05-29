import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ELBOLD Events",
    short_name: "ELBOLD",
    description: "The UK's premium event vendor marketplace. Book verified DJs, decorators, caterers, photographers and more.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0d1b3e",
    theme_color: "#0d1b3e",
    lang: "en-GB",
    categories: ["lifestyle", "business"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Browse Vendors",
        short_name: "Browse",
        url: "/browse",
        description: "Find and book event vendors",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "My Events",
        short_name: "Events",
        url: "/dashboard/events",
        description: "Manage your planned events",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Plan an Event",
        short_name: "Plan",
        url: "/dashboard/create-event",
        description: "Start planning a new event",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/home-mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "ELBOLD Events Home",
      },
    ],
  };
}
