import Link from "next/link";
import { Target, ArrowRight } from "lucide-react";
import type { DailyHighestImpactAction } from "@/lib/vendor/business-control-centre";

interface Props {
  action: DailyHighestImpactAction;
}

export function DailyHighestImpactActionCard({ action }: Props) {
  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Target size={14} className="text-gold-400" />
        <span className="text-sm font-semibold text-white">Daily Highest-Impact Action</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-white leading-snug">{action.message}</p>
          {action.measurableClaim && <p className="text-xs text-slate-400 mt-1">{action.measurableClaim}</p>}
        </div>
        <Link
          href={action.ctaHref}
          className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300 whitespace-nowrap"
        >
          {action.ctaLabel}
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
