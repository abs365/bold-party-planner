import Link from "next/link";
import { Trophy, Clock, AlertTriangle, Calendar, MessageSquare, CheckCircle2, ArrowRight } from "lucide-react";
import type { Priority, PriorityColour } from "@/lib/vendor/business-control-centre";

const ICON_MAP: Record<PriorityColour, typeof Trophy> = {
  gold: Trophy,
  amber: Clock,
  red: AlertTriangle,
  blue: Calendar,
  slate: MessageSquare,
  emerald: CheckCircle2,
};

const BORDER_MAP: Record<PriorityColour, string> = {
  gold: "border-gold-400/30 bg-brand-500/12",
  amber: "border-amber-500/25 bg-white/4",
  red: "border-red-500/25 bg-white/4",
  blue: "border-blue-500/20 bg-white/4",
  slate: "border-white/6 bg-white/4",
  emerald: "border-emerald-500/20 bg-white/4",
};

const TEXT_MAP: Record<PriorityColour, string> = {
  gold: "text-gold-400",
  amber: "text-amber-400",
  red: "text-red-400",
  blue: "text-blue-400",
  slate: "text-slate-400",
  emerald: "text-emerald-400",
};

interface Props {
  priority: Priority;
}

export function TodaysPrioritiesCard({ priority }: Props) {
  const Icon = ICON_MAP[priority.borderColour];

  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border px-5 py-4 ${BORDER_MAP[priority.borderColour]}`}>
      <div className="flex items-start gap-3 min-w-0">
        <Icon size={18} className={`flex-shrink-0 mt-0.5 ${TEXT_MAP[priority.borderColour]}`} />
        <p className="text-sm text-white leading-snug">{priority.message}</p>
      </div>
      <Link
        href={priority.ctaHref}
        className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300 transition-colors whitespace-nowrap"
      >
        {priority.ctaLabel}
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}
