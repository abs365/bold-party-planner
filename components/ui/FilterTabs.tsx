"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

export interface FilterTab {
  key: string;
  label: string;
  count?: number;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeKey: string;
  paramKey?: string;
  className?: string;
}

export function FilterTabs({
  tabs,
  activeKey,
  paramKey = "status",
  className,
}: FilterTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSelect(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "all") {
      params.delete(paramKey);
    } else {
      params.set(paramKey, key);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <div
      role="tablist"
      aria-label="Filter results"
      className={cn("flex gap-2 flex-wrap", isPending && "opacity-60 pointer-events-none", className)}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(tab.key)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
              isActive
                ? "bg-brand-500/12 border-gold-400/30 text-gold-400"
                : "bg-white/4 border-white/8 text-white/60 hover:text-white hover:border-white/15 hover:bg-white/6"
            )}
          >
            <span className="capitalize">{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[1.125rem] h-4 px-1 rounded-full text-[10px] font-semibold leading-none",
                  isActive
                    ? "bg-gold-400/15 text-gold-400"
                    : "bg-white/8 text-white/40"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
