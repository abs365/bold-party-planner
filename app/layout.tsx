import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { CookieConsentClient } from "@/components/CookieConsentClient";
import { AttributionCapture } from "@/components/AttributionCapture";
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
    default: "Elbold | Trusted Professionals Across the UK",
    template: "%s | Elbold",
  },
  description:
    "The UK marketplace for trusted, verified professionals. Every professional individually reviewed before joining. Every booking protected. Every review from a real, confirmed booking.",
  keywords: [
    "trusted professionals UK", "verified professionals UK", "find professionals UK", "DJ hire UK",
    "wedding photographer UK", "event caterer UK", "party decorator UK", "Elbold",
    "verified event professionals", "book professionals UK",
  ],
  authors: [{ name: "Elbold", url: APP_URL }],
  creator: "Elbold",
  publisher: "Elbold",
  openGraph: {
    siteName: "Elbold",
    title: "Elbold | Trusted Professionals Across the UK",
    description: "Find trusted, verified professionals for every occasion. Every professional individually reviewed before joining.",
    type: "website",
    url: APP_URL,
    locale: "en_GB",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Elbold – Trusted Professionals Across the UK",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elbold | Trusted Professionals Across the UK",
    description: "Find and book verified professionals across the UK. Every professional individually reviewed.",
    creator: "@elbold",
    images: [
      {
        url: "/icons/icon-512.png",
        alt: "Elbold – Trusted Professionals Across the UK",
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
    title: "Elbold",
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
        <AttributionCapture />
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
