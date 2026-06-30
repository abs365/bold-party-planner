import { cn } from "@/lib/utils";

type IconVariant = "success" | "warning" | "error" | "info";

interface StatusPageProps {
  theme?: "dark" | "light";
  icon: React.ReactNode;
  iconVariant: IconVariant;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}

const DARK_ICON_STYLES: Record<IconVariant, string> = {
  success: "bg-emerald-500/12 border border-emerald-500/20 text-emerald-400",
  warning: "bg-amber-500/12 border border-amber-500/20 text-amber-400",
  error:   "bg-red-500/12 border border-red-500/20 text-red-400",
  info:    "bg-blue-500/12 border border-blue-500/20 text-blue-400",
};

const LIGHT_ICON_STYLES: Record<IconVariant, string> = {
  success: "bg-emerald-50 border border-emerald-200 text-emerald-600",
  warning: "bg-amber-50 border border-amber-200 text-amber-600",
  error:   "bg-red-50 border border-red-200 text-red-600",
  info:    "bg-blue-50 border border-blue-200 text-blue-600",
};

export function StatusPage({
  theme = "dark",
  icon,
  iconVariant,
  title,
  description,
  children,
  className,
}: StatusPageProps) {
  const isDark = theme === "dark";
  const iconStyle = isDark
    ? DARK_ICON_STYLES[iconVariant]
    : LIGHT_ICON_STYLES[iconVariant];

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center px-4",
        isDark ? "bg-[#0a0a0f]" : "bg-white",
        className
      )}
    >
      <div className="max-w-md w-full text-center">
        <div
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8",
            iconStyle
          )}
        >
          {icon}
        </div>

        <h1
          className={cn(
            "text-2xl font-bold mb-3",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          {title}
        </h1>

        <p
          className={cn(
            "mb-8 leading-relaxed text-sm",
            isDark ? "text-white/50" : "text-gray-500"
          )}
        >
          {description}
        </p>

        {children}
      </div>
    </div>
  );
}
