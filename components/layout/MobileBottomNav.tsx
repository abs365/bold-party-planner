"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, ShoppingBag, MessageSquare, Compass,
  Store, FileText, TrendingUp, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

interface MobileBottomNavProps {
  user: Profile;
}

interface Tab {
  href: string;
  label: string;
  icon: React.ElementType;
  exact: boolean;
  highlight?: boolean;
}

const CUSTOMER_TABS: Tab[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/events", label: "Events", icon: Calendar, exact: false },
  { href: "/dashboard/create-event", label: "Plan", icon: Plus, exact: false, highlight: true },
  { href: "/inspire", label: "Inspire", icon: Compass, exact: false },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare, exact: false },
];

const VENDOR_TABS: Tab[] = [
  { href: "/vendor/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/vendor/bookings", label: "Bookings", icon: ShoppingBag, exact: false },
  { href: "/vendor/quotes", label: "Leads", icon: FileText, exact: false },
  { href: "/browse", label: "Browse", icon: Store, exact: false },
  { href: "/vendor/analytics", label: "Analytics", icon: TrendingUp, exact: false },
];

export function MobileBottomNav({ user }: MobileBottomNavProps) {
  const pathname = usePathname();
  const tabs = user.role === "vendor" ? VENDOR_TABS : CUSTOMER_TABS;

  if (user.role === "admin") return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/6 safe-area-bottom" style={{ background: "rgba(13,13,24,0.97)" }}>
      <div className="flex items-stretch h-16">
        {tabs.map(({ href, label, icon: Icon, exact, highlight }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          if (highlight) {
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
              >
                <div className="w-11 h-11 rounded-2xl gradient-brand flex items-center justify-center shadow-md -mt-4">
                  <Icon size={20} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-brand-400 mt-0.5">{label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2 relative transition-colors",
                active ? "text-brand-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Icon size={21} className={active ? "text-brand-400" : "text-slate-500"} />
              <span className={cn("text-xs font-medium", active ? "text-brand-400" : "text-slate-500")}>{label}</span>
              {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 gradient-brand rounded-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
