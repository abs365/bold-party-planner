import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export function PendingVendorBanner() {
  return (
    <div className="bg-amber-500/8 border border-amber-500/25 rounded-2xl p-5 animate-fade-in-up">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Clock size={17} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-300 mb-3">Application Under Review</h3>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">While we review your application you can:</p>
              <ul className="space-y-1.5">
                {[
                  "Complete your profile",
                  "Upload photos and videos",
                  "Create service packages",
                  "Complete verification",
                  "Set availability",
                  "Configure your business settings",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Marketplace features activate after approval:</p>
              <ul className="space-y-1.5">
                {[
                  "Quote requests",
                  "Bookings",
                  "Reviews",
                  "Public listing",
                  "Priority placement",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-500">
                    <XCircle size={12} className="text-slate-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-xs text-amber-500/70 mt-4 flex items-center gap-1.5">
            <AlertCircle size={11} />
            Applications are usually reviewed within 2 working days.
          </p>
        </div>
      </div>
    </div>
  );
}
