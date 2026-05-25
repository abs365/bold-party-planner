"use client";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "gold";
  className?: string;
}

const variantClasses = {
  default: "bg-white/10 text-slate-300",
  success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  danger: "bg-red-500/20 text-red-400 border border-red-500/30",
  info: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  gold: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("badge", variantClasses[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    pending: { variant: "warning", label: "Pending" },
    accepted: { variant: "info", label: "Accepted" },
    confirmed: { variant: "success", label: "Confirmed" },
    completed: { variant: "success", label: "Completed" },
    cancelled: { variant: "danger", label: "Cancelled" },
    rejected: { variant: "danger", label: "Rejected" },
    disputed: { variant: "warning", label: "Disputed" },
    approved: { variant: "success", label: "Approved" },
    suspended: { variant: "danger", label: "Suspended" },
    draft: { variant: "default", label: "Draft" },
    planning: { variant: "info", label: "Planning" },
    deposit_paid: { variant: "info", label: "Deposit Paid" },
    fully_paid: { variant: "success", label: "Paid" },
    refunded: { variant: "default", label: "Refunded" },
  };
  const config = map[status] ?? { variant: "default", label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
