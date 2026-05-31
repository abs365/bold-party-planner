"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Calendar, ShoppingBag, CreditCard,
  Bell, Menu, X, LogOut, User, ChevronRight, Star, Sparkles,
  Store, Users, BarChart3, Settings, FileText, AlertCircle,
  MessageSquare, Wallet, TrendingUp, CalendarCheck, BadgeCheck,
  Inbox, Heart, Mail, HelpCircle, Shield, Rocket, Server, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";
import { SmartConcierge } from "@/components/smart/SmartConcierge";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const CUSTOMER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/events", label: "My Events", icon: Calendar },
  { href: "/dashboard/bookings", label: "Bookings", icon: ShoppingBag },
  { href: "/dashboard/quotes", label: "Quotes", icon: Inbox },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/saved", label: "Saved Vendors", icon: Heart },
  { href: "/dashboard/invitations", label: "Invitations", icon: Mail },
  { href: "/browse", label: "Browse Vendors", icon: Store },
];

const VENDOR_NAV: NavItem[] = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/bookings", label: "Bookings", icon: ShoppingBag },
  { href: "/vendor/quotes", label: "Leads", icon: Inbox },
  { href: "/vendor/messages", label: "Messages", icon: MessageSquare },
  { href: "/vendor/profile", label: "My Profile", icon: User },
  { href: "/vendor/services", label: "Services & Packages", icon: Settings },
  { href: "/vendor/media", label: "Photos & Videos", icon: FileText },
  { href: "/vendor/reviews", label: "Reviews", icon: Star },
  { href: "/vendor/availability", label: "Availability", icon: CalendarCheck },
  { href: "/vendor/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/vendor/payouts", label: "Revenue & Payouts", icon: Wallet },
  { href: "/vendor/subscription", label: "Subscription", icon: BadgeCheck },
  { href: "/vendor/verification", label: "Get Verified", icon: Shield },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/vendors", label: "Vendors", icon: Store },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: ShoppingBag },
  { href: "/admin/quotes", label: "Quote Pipeline", icon: Inbox },
  { href: "/admin/payouts", label: "Payouts", icon: Wallet },
  { href: "/admin/disputes", label: "Disputes", icon: AlertCircle },
  { href: "/admin/verifications", label: "Verifications", icon: BadgeCheck },
  { href: "/admin/moderation", label: "Moderation", icon: Shield },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: BadgeCheck },
  { href: "/admin/monetization", label: "Monetization", icon: DollarSign },
  { href: "/admin/governance", label: "Governance", icon: Shield },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/support", label: "Support", icon: HelpCircle },
  { href: "/admin/system", label: "System", icon: Server },
  { href: "/admin/launch", label: "Launch Readiness", icon: Rocket },
];

interface SidebarContentProps {
  user: Profile;
  nav: NavItem[];
  roleLabel: string;
  pathname: string;
  onClose: () => void;
  onSignOut: () => void;
}

function SidebarContent({ user, nav, roleLabel, pathname, onClose, onSignOut }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      <Link href="/" className="flex items-center gap-2.5 px-6 py-5 border-b border-white/6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/elbold-mark.svg" width="28" height="28" alt="ELBOLD" />
        <span className="font-bold text-sm tracking-[0.18em]" style={{ color: "#C9A84C" }}>ELBOLD</span>
      </Link>

      <div className="px-4 py-4 border-b border-white/6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {user.full_name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user.full_name}</div>
            <div className="text-xs text-brand-400">{roleLabel}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand-500/12 text-brand-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <Icon size={16} className={active ? "text-brand-400" : "text-slate-500"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/6 space-y-0.5">
        <Link
          href="/dashboard/notifications"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
          onClick={onClose}
        >
          <Bell size={16} className="text-slate-500" />
          Notifications
        </Link>
        <Link
          href="/inspire"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
          onClick={onClose}
        >
          <Sparkles size={16} className="text-slate-500" />
          Inspiration Feed
        </Link>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-white/5 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: Profile;
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const nav =
    user.role === "admin" ? ADMIN_NAV :
    user.role === "vendor" ? VENDOR_NAV : CUSTOMER_NAV;

  const roleLabel =
    user.role === "admin" ? "Admin" :
    user.role === "vendor" ? "Vendor" : "Customer";

  async function handleSignOut() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const sidebarProps: SidebarContentProps = {
    user, nav, roleLabel, pathname,
    onClose: () => setSidebarOpen(false),
    onSignOut: handleSignOut,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-white/6 bg-[#0d0d18] flex-shrink-0">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-68 h-full bg-[#0d0d18] border-r border-white/6 flex flex-col">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/6 text-slate-400"
            >
              <X size={18} />
            </button>
            <SidebarContent {...sidebarProps} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 h-14 border-b border-white/6 bg-[#0a0a0f] flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={19} />
          </button>

          <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500">
            <span>Portal</span>
            <ChevronRight size={13} />
            <span className="text-slate-300 capitalize">{user.role}</span>
          </div>

          <div className="flex items-center gap-3">
            {user.role === "customer" && (
              <Link href="/dashboard/create-event" className="btn-primary text-xs py-1.5 px-3.5">
                <Sparkles size={12} />
                Plan Event
              </Link>
            )}
            <Link href="/dashboard/notifications" className="relative p-2 rounded-lg hover:bg-white/5">
              <Bell size={17} className="text-slate-400" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-500 rounded-full" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      {user.role === "customer" && <SmartConcierge />}
      <MobileBottomNav user={user} />
    </div>
  );
}
