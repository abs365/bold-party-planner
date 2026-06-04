import Link from "next/link";
import { ArrowRight, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompletionResult } from "@/lib/vendor/completion";
import { getActivationMessages, type ActivationMessage } from "@/lib/vendor/completion";

interface Props {
  completion: CompletionResult;
  compact?: boolean;
}

const barColor = (score: number) =>
  score >= 75 ? "from-emerald-500 to-emerald-400"
  : score >= 50 ? "from-amber-500 to-amber-400"
  : "from-brand-500 to-purple-500";

const scoreTextColor = (score: number) =>
  score >= 75 ? "text-emerald-400"
  : score >= 50 ? "text-amber-400"
  : "text-brand-400";

export function ProfileStrengthWidget({ completion, compact = false }: Props) {
  const { score, strengthLabel, steps, isMarketplaceReady } = completion;
  const messages: ActivationMessage[] = getActivationMessages(completion);

  if (compact) {
    return (
      <div className="bg-white/4 border border-white/6 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-white">Profile Strength</span>
          </div>
          <span className={cn("text-sm font-bold", scoreTextColor(score))}>{score}%</span>
        </div>
        <div className="bg-white/5 rounded-full h-1.5 mb-3 overflow-hidden">
          <div
            className={cn("h-1.5 rounded-full bg-gradient-to-r transition-all", barColor(score))}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="text-xs text-slate-500 mb-3">{strengthLabel}</div>
        {messages.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {messages.slice(0, 2).map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="flex items-start gap-1.5 hover:text-white transition-colors group"
              >
                <AlertCircle size={10} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-slate-400 group-hover:text-slate-300 leading-tight">{item.message}</span>
              </Link>
            ))}
          </div>
        )}
        {isMarketplaceReady && messages.length === 0 && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 size={11} />
            <span>Fully optimised</span>
          </div>
        )}
        <Link
          href="/vendor/onboarding"
          className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
        >
          View full checklist <ArrowRight size={10} />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-slate-400" />
          <span className="text-sm font-semibold text-white">Profile Strength</span>
        </div>
        <span className={cn("text-lg font-bold", scoreTextColor(score))}>{score}%</span>
      </div>
      <div className="text-xs text-slate-500 mb-3">{strengthLabel}</div>
      <div className="bg-white/5 rounded-full h-2 mb-4 overflow-hidden">
        <div
          className={cn("h-2 rounded-full bg-gradient-to-r transition-all duration-700", barColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>

      {messages.length > 0 && (
        <div className="space-y-2 mb-4">
          {messages.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-white/3 border border-white/6 hover:border-white/10 hover:bg-white/5 transition-all group"
            >
              <AlertCircle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-slate-300 group-hover:text-white transition-colors leading-tight flex-1">{item.message}</span>
              <ArrowRight size={11} className="text-slate-600 group-hover:text-slate-400 flex-shrink-0 mt-0.5 transition-colors" />
            </Link>
          ))}
        </div>
      )}

      {isMarketplaceReady && messages.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 mb-4 px-1">
          <CheckCircle2 size={13} />
          <span>Profile fully optimised — you rank highly in search</span>
        </div>
      )}

      <Link
        href="/vendor/onboarding"
        className="flex items-center justify-between text-xs text-slate-400 hover:text-slate-300 transition-colors pt-2 border-t border-white/5"
      >
        <span>View full checklist ({steps.filter((s) => s.complete).length}/{steps.length} complete)</span>
        <ArrowRight size={11} />
      </Link>
    </div>
  );
}
