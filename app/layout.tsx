import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://boldparty.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Bold Party | Plan. Book. Celebrate.",
    template: "%s | Bold Party",
  },
  description:
    "The UK's premium event planning marketplace. Book verified DJs, decorators, caterers, photographers and more for birthdays, weddings, corporate events and every occasion.",
  keywords: [
    "event planner UK", "party planning", "book event vendors", "DJ hire UK",
    "wedding caterers", "birthday decorators", "event photographer UK", "event marketplace",
  ],
  authors: [{ name: "Bold Party", url: APP_URL }],
  creator: "Bold Party",
  publisher: "Bold Party",
  openGraph: {
    siteName: "Bold Party",
    title: "Bold Party | Plan. Book. Celebrate.",
    description: "Book verified event vendors across the UK. DJs, caterers, photographers, decorators and more.",
    type: "website",
    url: APP_URL,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bold Party | Plan. Book. Celebrate.",
    description: "Book verified event vendors across the UK.",
    creator: "@boldpartyuk",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen antialiased">
        {children}
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
            success: { iconTheme: { primary: "#d946ef", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
