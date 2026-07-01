"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import type { BusinessHealthScore } from "@/lib/vendor/business-control-centre";

const BAR_COLOUR = (score: number) =>
  score >= 85 ? "from-emerald-500 to-emerald-400" :
  score >= 70 ? "from-green-500 to-green-400"    :
  score >= 55 ? "from-blue-500 to-blue-400"      :
  score >= 40 ? "from-amber-500 to-amber-400"    :
                "from-slate-500 to-slate-400";

interface Props {
  healthScore: BusinessHealthScore;
}

export function BusinessHealthWidget({ healthScore }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { overall, tierLabel, tierColour, categories, weakestCategoryKey, actionText, actionHref } = healthScore;

  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-5">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between mb-2"
      >
        <span className="text-sm font-semibold text-white">Business Health</span>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${tierColour}`}>{overall}</span>
          <span className="text-xs text-slate-400">{tierLabel}</span>
          {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </div>
      </button>

      <div className="bg-white/5 rounded-full h-1.5 overflow-hidden mb-3">
        <div
          className={`h-1.5 rounded-full bg-gradient-to-r transition-all duration-500 ${BAR_COLOUR(overall)}`}
          style={{ width: `${overall}%` }}
        />
      </div>

      {!expanded && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Weakest: {categories[weakestCategoryKey].label}
            {categories[weakestCategoryKey].score != null && ` — ${categories[weakestCategoryKey].score}/100`}
          </span>
          <Link href={actionHref} className="flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300">
            {actionText} <ArrowRight size={11} />
          </Link>
        </div>
      )}

      {expanded && (
        <div className="space-y-2.5 mt-2">
          {(Object.keys(categories) as Array<keyof typeof categories>).map((key) => {
            const cat = categories[key];
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300">{cat.label}</span>
                  <span className="text-xs font-medium text-slate-300">
                    {cat.score != null ? `${cat.score}/100 · ${cat.tierLabel}` : cat.insufficientDataReason}
                  </span>
                </div>
                <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full bg-gradient-to-r ${cat.score != null ? BAR_COLOUR(cat.score) : "from-slate-700 to-slate-700"}`}
                    style={{ width: `${cat.score ?? 0}%` }}
                  />
                </div>
              </div>
            );
          })}
          <Link href={actionHref} className="flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300 pt-1">
            {actionText} <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </div>
  );
}
