import { cn } from "@/lib/utils";

interface NotificationIndicatorProps {
  count: number;
  className?: string;
}

export function NotificationIndicator({ count, className }: NotificationIndicatorProps) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} unread notification${count !== 1 ? "s" : ""}`}
      className={cn(
        "absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold-400",
        className
      )}
    />
  );
}
