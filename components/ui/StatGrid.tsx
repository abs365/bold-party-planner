import { cn } from "@/lib/utils";

export interface StatItem {
  value: string;
  label: string;
}

interface StatGridProps {
  stats: StatItem[];
  theme?: "dark" | "light";
  className?: string;
}

const COL_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

export function StatGrid({ stats, theme = "dark", className }: StatGridProps) {
  const isDark = theme === "dark";
  const cols = COL_CLASS[Math.min(stats.length, 4)] ?? "grid-cols-2 sm:grid-cols-4";

  return (
    <div className={cn("grid gap-6", cols, className)}>
      {stats.map(({ value, label }) => (
        <div key={label} className="text-center">
          <div
            className={cn(
              "text-3xl font-light tracking-tight mb-1",
              isDark ? "text-gold-400" : "text-brand-500"
            )}
          >
            {value}
          </div>
          <div
            className={cn(
              "text-xs font-light leading-snug",
              isDark ? "text-white/30" : "text-gray-500"
            )}
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
