"use client";

import Link from "next/link";
import {
  CheckCircle2, Circle, ChevronRight, User, Package, Camera,
  ShieldCheck, Clock, Rocket, Star, Zap, ArrowRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompletionResult, OnboardingStep } from "@/lib/vendor/completion";

const STEP_ICONS: Record<string, React.ElementType> = {
  profile: User,
  services: Package,
  media: Camera,
  verification: ShieldCheck,
  trust: Clock,
  ready: Rocket,
};

const SCORE_COLOR = (score: number) =>
  score >= 75 ? "from-emerald-500 to-emerald-400"
  : score >= 50 ? "from-amber-500 to-amber-400"
  : score >= 25 ? "from-[#0B1F4D] to-[#D4AF37]"
  : "from-slate-500 to-slate-400";

const SCORE_TEXT = (score: number) =>
  score >= 75 ? "text-emerald-400"
  : score >= 50 ? "text-amber-400"
  : "text-brand-400";

interface Props {
  completion: CompletionResult;
  vendorName: string;
}

export function VendorOnboardingProgress({ completion, vendorName }: Props) {
  const { score, steps, strengthLabel, isMarketplaceReady } = completion;
  const completedCount = steps.filter((s) => s.complete).length;

  return (
    <div className="space-y-6">
      {/* Score Header */}
      <div className="bg-white/4 border border-white/6 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {isMarketplaceReady && (
                <Sparkles size={18} className="text-emerald-400 flex-shrink-0" />
              )}
              {isMarketplaceReady
                ? `You're marketplace ready, ${vendorName.split(" ")[0]}!`
                : `Welcome to ELBOLD Events, ${vendorName.split(" ")[0]}!`}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {isMarketplaceReady
                ? "Keep improving your profile to rank higher and get more leads."
                : "Complete these steps to go live on the marketplace and start receiving leads."}
            </p>
          </div>
          <div className="flex-shrink-0 text-center">
            <div className={cn("text-4xl font-black", SCORE_TEXT(score))}>{score}%</div>
            <div className="text-xs text-slate-500 mt-0.5">{strengthLabel}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white/5 rounded-full h-2.5 overflow-hidden mb-3">
          <div
            className={cn("h-2.5 rounded-full bg-gradient-to-r transition-all duration-700", SCORE_COLOR(score))}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{completedCount} of {steps.length} steps complete</span>
          <span>{score}/100 points</span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <StepCard key={step.id} step={step} idx={idx} />
        ))}
      </div>

      {/* Next action CTA */}
      {completion.nextStep && (
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">Recommended next step</div>
              <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{completion.nextActionText}</div>
            </div>
            <Link href={completion.nextActionHref ?? "#"} className="btn-primary text-sm py-2 px-4 flex-shrink-0 flex items-center gap-1.5">
              {completion.nextStep.cta} <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {isMarketplaceReady && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex items-center gap-3">
          <Star size={18} className="text-emerald-400 fill-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-white">Great profile score!</div>
            <div className="text-xs text-slate-400 mt-0.5">You rank in the top tier of the marketplace. Keep your availability up to date to maximise leads.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepCard({ step, idx }: { step: OnboardingStep; idx: number }) {
  const Icon = STEP_ICONS[step.id] ?? Circle;
  const pct = step.maxPoints > 0 ? Math.round((step.earnedPoints / step.maxPoints) * 100) : 0;

  return (
    <div className={cn(
      "bg-white/4 border rounded-xl overflow-hidden transition-all",
      step.complete
        ? "border-emerald-500/20"
        : step.earnedPoints > 0
          ? "border-amber-500/20"
          : "border-white/6"
    )}>
      <div className="flex items-center gap-4 p-4">
        {/* Step number / icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
          step.complete
            ? "bg-emerald-500/15 border-emerald-500/25"
            : step.earnedPoints > 0
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-white/5 border-white/10"
        )}>
          {step.complete
            ? <CheckCircle2 size={18} className="text-emerald-400" />
            : <Icon size={16} className={step.earnedPoints > 0 ? "text-amber-400" : "text-slate-500"} />
          }
        </div>

        {/* Title + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-slate-600 font-medium">Step {idx + 1}</span>
            {step.complete && (
              <span className="text-xs font-medium text-emerald-400">Complete</span>
            )}
            {!step.complete && step.earnedPoints > 0 && (
              <span className="text-xs font-medium text-amber-400">In progress</span>
            )}
          </div>
          <div className="font-semibold text-white text-sm">{step.label}</div>
          <div className="text-xs text-slate-500 mt-0.5">{step.description}</div>
        </div>

        {/* Points */}
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold text-white">{step.earnedPoints}/{step.maxPoints}</div>
          <div className="text-xs text-slate-600">pts</div>
        </div>

        {/* CTA */}
        {!step.complete && (
          <Link
            href={step.href}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors ml-2"
          >
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {/* Sub-items (always visible) */}
      <div className="border-t border-white/5 px-4 pb-4 pt-3">
        <div className="space-y-2">
          {step.items.map((item) => (
            <div key={item.label} className="flex items-start gap-2.5">
              {item.done
                ? <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                : <Circle size={13} className="text-slate-600 flex-shrink-0 mt-0.5" />
              }
              <div className="flex-1 min-w-0">
                <span className={cn("text-xs", item.done ? "text-slate-400 line-through" : "text-slate-300")}>
                  {item.label}
                </span>
                {!item.done && (
                  <div className="text-xs text-slate-600 mt-0.5">{item.tip}</div>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium flex-shrink-0",
                item.done ? "text-emerald-500" : "text-slate-600"
              )}>
                +{item.points}pt{item.points !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>

        {/* Sub-progress bar */}
        {step.earnedPoints > 0 && !step.complete && (
          <div className="mt-3">
            <div className="bg-white/5 rounded-full h-1 overflow-hidden">
              <div
                className="h-1 rounded-full bg-amber-500/60 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {!step.complete && (
          <Link
            href={step.href}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
          >
            {step.cta} <ChevronRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}
