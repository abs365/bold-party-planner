"use client";

import { Sparkles, ChevronRight, LightbulbIcon } from "lucide-react";
import Link from "next/link";

const TIPS = [
  {
    category: "Budget",
    tip: "Book your DJ and photographer at least 8 weeks in advance — they're the first to sell out for popular dates.",
    cta: "Browse DJs",
    href: "/browse?category=dj",
  },
  {
    category: "Planning",
    tip: "For events over 80 guests, consider hiring an MC to manage flow and keep your timeline on track.",
    cta: "Find an MC",
    href: "/browse?category=mc",
  },
  {
    category: "Budget",
    tip: "Request quotes from 3 vendors in each category — you'll often find 20-30% price differences for similar quality.",
    cta: "Start comparing",
    href: "/browse",
  },
  {
    category: "Decoration",
    tip: "A floral arch or balloon backdrop adds instant visual impact and makes every photo look premium.",
    cta: "View decorators",
    href: "/browse?category=decorator",
  },
  {
    category: "Catering",
    tip: "Always request a food tasting session before confirming. Great caterers will happily arrange one.",
    cta: "Browse caterers",
    href: "/browse?category=caterer",
  },
  {
    category: "Timeline",
    tip: "Build in 30 minutes of buffer time between your ceremony and reception — it always takes longer than expected.",
    cta: "Use Smart Planner",
    href: "/dashboard/create-event",
  },
  {
    category: "Backup plan",
    tip: "If your event is outdoors, have a marquee or indoor backup confirmed. UK weather is always unpredictable.",
    cta: "Find marquees",
    href: "/browse?category=marquee_rental",
  },
  {
    category: "Photography",
    tip: "Ask your photographer for a shot list of must-have moments. This prevents missing key family photos.",
    cta: "Browse photographers",
    href: "/browse?category=photographer",
  },
];

// Pick a tip based on the day of the week (consistent within a day)
function getDailyTip() {
  const day = new Date().getDay();
  return TIPS[day % TIPS.length];
}

const CATEGORY_COLOR: Record<string, string> = {
  Budget: "bg-emerald-500/20 text-emerald-400",
  Planning: "bg-blue-500/20 text-blue-400",
  Decoration: "bg-pink-500/20 text-pink-400",
  Catering: "bg-amber-500/20 text-amber-400",
  Timeline: "bg-purple-500/20 text-purple-400",
  "Backup plan": "bg-orange-500/20 text-orange-400",
  Photography: "bg-cyan-500/20 text-cyan-400",
};

export function SmartTipsWidget() {
  const tip = getDailyTip();
  const colorCls = CATEGORY_COLOR[tip.category] ?? "bg-white/10 text-white/60";

  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
          <LightbulbIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-slate-400">Smart Tip</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorCls}`}>
              {tip.category}
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-3">{tip.tip}</p>
          <Link href={tip.href} className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
            <Sparkles className="w-3 h-3" />
            {tip.cta}
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
