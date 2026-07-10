import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { RevenueBreakdown } from "@/lib/vendor/business-control-centre";

interface Props {
  revenue: RevenueBreakdown;
}

const ROWS: Array<{ key: keyof Omit<RevenueBreakdown, "hasData">; label: string; barColour: string; textColour: string; estimate?: boolean }> = [
  { key: "confirmed", label: "Confirmed Revenue", barColour: "bg-emerald-500", textColour: "text-emerald-400" },
  { key: "pipeline", label: "Pipeline Revenue", barColour: "bg-amber-500", textColour: "text-amber-400" },
  { key: "potential", label: "Potential Revenue", barColour: "bg-gold-400", textColour: "text-gold-400", estimate: true },
];

export function RevenuePanel({ revenue }: Props) {
  if (!revenue.hasData) {
    return (
      <div className="bg-white/4 border border-white/6 rounded-xl p-5">
        <p className="text-sm font-semibold text-white mb-2">Revenue</p>
        <p className="text-xs text-slate-400">No active pipeline yet. Your first booking will appear here.</p>
      </div>
    );
  }

  const rowsWithValues = ROWS.filter((r) => revenue[r.key] > 0);
  const max = Math.max(revenue.confirmed, revenue.pipeline, revenue.potential, 1);
  const total = revenue.confirmed + revenue.pipeline + revenue.potential;
  const showTotal = rowsWithValues.length >= 2;

  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-5">
      <p className="text-sm font-semibold text-white mb-3">Revenue</p>
      <div className="space-y-3">
        {ROWS.map((row) => (
          <div key={row.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-300">
                {row.label}
                {row.estimate && revenue[row.key] > 0 && <span className="text-slate-500"> (estimate)</span>}
              </span>
              <span className={`text-xs font-semibold ${row.textColour}`}>{formatCurrency(revenue[row.key])}</span>
            </div>
            <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${row.barColour}`}
                style={{ width: `${(revenue[row.key] / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {showTotal && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/6">
          <span className="text-xs font-medium text-slate-400">Total across all stages</span>
          <span className="text-sm font-bold text-white">{formatCurrency(total)}</span>
        </div>
      )}

      <p className="text-xs text-slate-500 mt-3">
        Confirmed Revenue is bookings with at least a deposit paid — it isn&apos;t all paid out to you yet; see Business Operations below for exactly what&apos;s owed. Pipeline reflects quote requests in progress. Potential Revenue is an estimate based on customer-stated budgets.
      </p>

      <Link href="/vendor/payouts" className="text-xs font-medium text-gold-400 hover:text-gold-300 mt-2 inline-block">
        View Payouts →
      </Link>
    </div>
  );
}
