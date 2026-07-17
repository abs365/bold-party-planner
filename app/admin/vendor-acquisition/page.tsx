"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AcquisitionCRMView } from "@/components/admin/AcquisitionCRMView";
import { OutreachQueueView } from "@/components/admin/OutreachQueueView";
import { PipelineBoardView } from "@/components/admin/PipelineBoardView";

// EPD-003-WP1: this page consolidates what were three separate routes
// (/admin/vendor-acquisition, /admin/vendor-outreach, /admin/vendor-pipeline)
// into one page with three view modes over the same vendor_leads data and
// the same shared /api/admin/vendor-leads* API layer. See ADR-001.

type ViewMode = "crm" | "outreach" | "pipeline";

const VIEWS: { key: ViewMode; label: string }[] = [
  { key: "crm",      label: "All Leads" },
  { key: "outreach", label: "Outreach Queue" },
  { key: "pipeline", label: "Pipeline Board" },
];

function VendorAcquisitionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = (["crm", "outreach", "pipeline"] as const).includes(searchParams.get("view") as ViewMode)
    ? (searchParams.get("view") as ViewMode)
    : "crm";

  function setView(next: ViewMode) {
    router.push(next === "crm" ? "/admin/vendor-acquisition" : `/admin/vendor-acquisition?view=${next}`);
  }

  return (
    <DashboardLayout>
      <div className="border-b border-gray-100 bg-white px-4">
        <div className="max-w-screen-2xl mx-auto flex gap-1 pt-4">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
                view === key
                  ? "border-current text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
              style={view === key ? { borderColor: "#0B1F4D" } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "crm" && <AcquisitionCRMView />}
      {view === "outreach" && <OutreachQueueView />}
      {view === "pipeline" && <PipelineBoardView />}
    </DashboardLayout>
  );
}

export default function VendorAcquisitionPage() {
  return (
    <Suspense fallback={null}>
      <VendorAcquisitionContent />
    </Suspense>
  );
}
