import Link from "next/link";
import { WifiOff } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0f]">
      <div className="text-center max-w-sm w-full">
        <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center mx-auto mb-8 shadow-lg shadow-brand-500/25">
          <WifiOff size={36} className="text-white" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">You&apos;re offline</h1>

        <p className="text-slate-400 leading-relaxed mb-10">
          Check your internet connection and try again. Pages you&apos;ve visited
          recently may still be available.
        </p>

        <div className="space-y-3">
          <Link href="/" className="btn-primary w-full gap-2 block text-center">
            Return to homepage
          </Link>

          <Link href="/browse" className="btn-secondary w-full block text-center">
            Browse vendors
          </Link>
        </div>

        <p className="text-xs text-slate-600 mt-8">
          ELBOLD Events works offline for cached pages. Connect to continue.
        </p>
      </div>
    </main>
  );
}
