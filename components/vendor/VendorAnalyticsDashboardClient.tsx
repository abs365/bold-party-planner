"use client";

import dynamic from "next/dynamic";

const VendorAnalyticsDashboard = dynamic(
  () => import("@/components/vendor/VendorAnalyticsDashboard").then((m) => ({ default: m.VendorAnalyticsDashboard })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/4 border border-white/6 rounded-xl animate-pulse h-28" />
        ))}
      </div>
    ),
  }
);

export function VendorAnalyticsDashboardClient() {
  return <VendorAnalyticsDashboard />;
}
