"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivationTask {
  label: string;
  done: boolean;
  href: string;
  weight: number; // contribution to 100%
}

interface Props {
  mediaCount: number;
  packageCount: number;
  verificationLevel: number;
  hasCoverPhoto: boolean;
  phoneVerified: boolean;
}

export function VendorActivationChecklist({
  mediaCount,
  packageCount,
  verificationLevel,
  hasCoverPhoto,
  phoneVerified,
}: Props) {
  const tasks: ActivationTask[] = [
    {
      label: "Upload a profile (cover) photo",
      done:  hasCoverPhoto,
      href:  "/vendor/media",
      weight: 15,
    },
    {
      label: "Upload 3 portfolio images",
      done:  mediaCount >= 3,
      href:  "/vendor/media",
      weight: 20,
    },
    {
      label: "Create your first service package",
      done:  packageCount >= 1,
      href:  "/vendor/services",
      weight: 20,
    },
    {
      label: "Verify your phone number",
      done:  phoneVerified,
      href:  "/vendor/profile",
      weight: 15,
    },
    {
      label: "Verify your identity (government ID)",
      done:  verificationLevel >= 2,
      href:  "/vendor/verification",
      weight: 20,
    },
    {
      label: "Verify your address",
      done:  verificationLevel >= 3,
      href:  "/vendor/verification",
      weight: 10,
    },
  ];

  const earnedWeight = tasks.filter((t) => t.done).reduce((s, t) => s + t.weight, 0);
  const progress = earnedWeight; // already sums to 100
  const doneCount = tasks.filter((t) => t.done).length;

  const barColor =
    progress >= 80 ? "from-emerald-500 to-emerald-400"
    : progress >= 50 ? "from-amber-500 to-amber-400"
    : "from-brand-500 to-[#D4AF37]";

  const scoreColor =
    progress >= 80 ? "text-emerald-400"
    : progress >= 50 ? "text-amber-400"
    : "text-brand-400";

  return (
    <div className="bg-white/4 border border-white/6 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">Activation Checklist</h3>
          <span className={cn("text-sm font-bold", scoreColor)}>{progress}%</span>
        </div>
        <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
          <div
            className={cn("h-1.5 rounded-full bg-gradient-to-r transition-all duration-700", barColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          {doneCount} of {tasks.length} tasks complete
        </p>
      </div>

      {/* Task list */}
      <div className="divide-y divide-white/4">
        {tasks.map((task) => (
          <Link
            key={task.label}
            href={task.done ? "#" : task.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 transition-colors",
              task.done
                ? "opacity-60 cursor-default"
                : "hover:bg-white/3 group"
            )}
          >
            {task.done
              ? <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              : <Circle size={15} className="text-slate-600 flex-shrink-0 group-hover:text-slate-400 transition-colors" />}
            <span className={cn(
              "flex-1 text-xs",
              task.done ? "text-slate-500 line-through" : "text-slate-300"
            )}>
              {task.label}
            </span>
            {!task.done && (
              <ArrowRight size={11} className="text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
            )}
          </Link>
        ))}
      </div>

      {progress === 100 && (
        <div className="p-3 bg-emerald-500/8 border-t border-emerald-500/20 text-center">
          <p className="text-xs text-emerald-400 font-medium">Profile fully activated</p>
        </div>
      )}
    </div>
  );
}
