import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { CookieConsentClient } from "@/components/CookieConsentClient";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.elbold.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d1b3e",
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "ELBOLD Events | Find Trusted Event Professionals Across the UK",
    template: "%s | ELBOLD Events",
  },
  description:
    "Find trusted event professionals for life's most important celebrations. Verified DJs, photographers, caterers, decorators and more for weddings, birthdays, corporate events and cultural celebrations across the UK.",
  keywords: [
    "event professionals UK", "wedding vendors UK", "find event vendors", "DJ hire UK",
    "wedding photographer UK", "event caterer UK", "party decorator UK", "ELBOLD Events",
    "verified event professionals", "book event vendors UK",
  ],
  authors: [{ name: "ELBOLD Events", url: APP_URL }],
  creator: "ELBOLD Events",
  publisher: "ELBOLD Events",
  openGraph: {
    siteName: "ELBOLD Events",
    title: "ELBOLD Events | Find Trusted Event Professionals Across the UK",
    description: "Find trusted event professionals for life's most important celebrations. Every vendor individually reviewed.",
    type: "website",
    url: APP_URL,
    locale: "en_GB",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "ELBOLD Events – Find Premium Event Vendors Across the UK",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ELBOLD Events | Trusted Vendors for Extraordinary Celebrations",
    description: "Book verified event vendors across the UK.",
    creator: "@elbold",
    images: [
      {
        url: "/icons/icon-512.png",
        alt: "ELBOLD Events – Find Premium Event Vendors Across the UK",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: APP_URL,
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ELBOLD",
  },
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    icon: [
      { url: "/brand/elbold-favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen antialiased">
        {children}
        <CookieConsentClient />
        <ServiceWorkerRegistration />
        <InstallPrompt />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#111118",
              border: "1px solid #e5e7eb",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              fontSize: "0.875rem",
            },
            success: { iconTheme: { primary: "#0B1F4D", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
