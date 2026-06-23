"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Calendar, ShoppingBag, CreditCard,
  Bell, Menu, X, LogOut, User, ChevronRight, Star, Sparkles,
  Store, Users, BarChart3, Settings, FileText, AlertCircle,
  MessageSquare, Wallet, TrendingUp, CalendarCheck, BadgeCheck,
  Inbox, Heart, Mail, HelpCircle, Shield, Rocket, Server, DollarSign, Activity, ThumbsUp,
  Scale, Eye, ClipboardList, Lock, Zap, GitBranch, Map, Send, Target, HeartPulse, BookUser,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";
import type { AdminRole } from "@/lib/auth/guards";

const ROLE_WEIGHT: Record<AdminRole, number> = {
  founder:      4,
  global_admin: 3,
  ops_admin:    2,
  reviewer:     1,
};
import { SmartConcierge } from "@/components/smart/SmartConcierge";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  minRole?: AdminRole; // undefined = ops_admin (default minimum)
}

interface NavGroup {
  label: string;
  items: NavItem[];
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
  { href: "/dashboard/feedback", label: "Share Feedback", icon: ThumbsUp },
];

const VENDOR_NAV: NavItem[] = [
  { href: "/vendor/dashboard",  label: "Dashboard",    icon: LayoutDashboard },
  { href: "/vendor/bookings",   label: "Bookings",     icon: ShoppingBag },
  { href: "/vendor/quotes",     label: "Leads",        icon: Inbox },
  { href: "/vendor/customers",  label: "Customers",    icon: Users },
  { href: "/vendor/contacts",   label: "Contacts",     icon: BookUser },
  { href: "/vendor/messages",   label: "Messages",     icon: MessageSquare },
  { href: "/vendor/profile", label: "My Profile", icon: User },
  { href: "/vendor/services", label: "Services & Packages", icon: Settings },
  { href: "/vendor/media", label: "Photos & Videos", icon: FileText },
  { href: "/vendor/reviews", label: "Reviews", icon: Star },
  { href: "/vendor/availability", label: "Availability", icon: CalendarCheck },
  { href: "/vendor/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/vendor/payouts", label: "Revenue & Payouts", icon: Wallet },
  { href: "/vendor/subscription", label: "Subscription", icon: BadgeCheck },
  { href: "/vendor/verification", label: "Get Verified", icon: Shield },
  { href: "/vendor/feedback", label: "Share Feedback", icon: ThumbsUp },
];

// Kept for type compatibility with nav prop; admin uses ADMIN_NAV_GROUPS below
const ADMIN_NAV: NavItem[] = [];

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Marketplace",
    items: [
      { href: "/admin",              label: "Overview",            icon: LayoutDashboard },
      { href: "/admin/scoreboard",   label: "Weekly Scoreboard",   icon: Target },
      { href: "/admin/health",       label: "Marketplace Health",  icon: HeartPulse },
      { href: "/admin/vendors",   label: "Vendors",        icon: Store },
      { href: "/admin/customers",       label: "Customers",      icon: Users },
      { href: "/admin/direct-contacts", label: "Direct Contacts", icon: BookUser },
      { href: "/admin/bookings",        label: "Bookings",        icon: ShoppingBag },
      { href: "/admin/quotes",    label: "Quote Pipeline", icon: Inbox },
      { href: "/admin/reviews",   label: "Reviews",        icon: Star },
    ],
  },
  {
    label: "Trust & Safety",
    items: [
      { href: "/admin/disputes",       label: "Disputes",        icon: Scale },
      { href: "/admin/verifications",  label: "Verifications",   icon: BadgeCheck },
      { href: "/admin/moderation",     label: "Moderation",      icon: Eye },
      { href: "/admin/governance",     label: "Governance",      icon: Shield },
      { href: "/admin/governance-log", label: "Governance Log",  icon: ClipboardList, minRole: "global_admin" as AdminRole },
      { href: "/admin/team",           label: "Admin Team",      icon: Users,         minRole: "founder" as AdminRole },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/finance",       label: "Finance Dashboard", icon: TrendingUp,  minRole: "global_admin" as AdminRole },
      { href: "/admin/payouts",       label: "Payouts",           icon: Wallet,      minRole: "global_admin" as AdminRole },
      { href: "/admin/subscriptions", label: "Subscriptions",     icon: BadgeCheck,  minRole: "global_admin" as AdminRole },
      { href: "/admin/monetization",  label: "Monetization",      icon: DollarSign,  minRole: "global_admin" as AdminRole },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/support",   label: "Support",   icon: HelpCircle },
      { href: "/admin/system",    label: "System",    icon: Server },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Vendor Acquisition",
    items: [
      { href: "/admin/vendor-growth",      label: "Acquisition Dashboard", icon: Target },
      { href: "/admin/vendor-acquisition", label: "Lead CRM",              icon: Users },
      { href: "/admin/vendor-pipeline",    label: "Pipeline Board",        icon: GitBranch },
      { href: "/admin/vendor-outreach",    label: "Outreach Queue",        icon: Send },
      { href: "/admin/vendor-coverage",    label: "Coverage Map",          icon: Map },
      { href: "/admin/vendor-activation",  label: "Vendor Activation",     icon: Zap },
    ],
  },
  {
    label: "Pilot Launch",
    items: [
      { href: "/admin/pilot",          label: "Pilot Ops",        icon: Activity },
      { href: "/admin/pilot/vendors",  label: "Pilot CRM",        icon: Users },
      { href: "/admin/pilot/report",   label: "Pilot Report",     icon: FileText },
      { href: "/admin/pilot/outreach", label: "Outreach Pack",    icon: MessageSquare },
      { href: "/admin/founder",            label: "Founder Dashboard",   icon: LayoutDashboard, minRole: "founder" as AdminRole },
      { href: "/admin/cohort",             label: "Founder Queue",       icon: Users,           minRole: "founder" as AdminRole },
      { href: "/admin/recruitment",        label: "Recruitment",         icon: TrendingUp },
      { href: "/admin/verification-audit", label: "Verification Audit",  icon: BadgeCheck },
      { href: "/admin/concierge",          label: "Concierge Requests",  icon: MessageSquare },
      { href: "/admin/launch",             label: "Launch Readiness",    icon: Rocket },
      { href: "/admin/launch-freeze",    label: "Launch Freeze",        icon: Lock,            minRole: "founder" as AdminRole },
      { href: "/admin/pilot-testing",    label: "Pilot Testing Centre", icon: ClipboardList },
    ],
  },
];

function filterByRole(items: NavItem[], adminRole?: AdminRole): NavItem[] {
  if (!adminRole) return items;
  return items.filter((item) => {
    const min = item.minRole ?? "ops_admin";
    return ROLE_WEIGHT[adminRole] >= ROLE_WEIGHT[min];
  });
}

interface SidebarContentProps {
  user: Profile;
  nav: NavItem[];
  navGroups?: NavGroup[];
  roleLabel: string;
  pathname: string;
  adminRole?: AdminRole;
  onClose: () => void;
  onSignOut: () => void;
}

function SidebarContent({ user, nav, navGroups, roleLabel, pathname, adminRole, onClose, onSignOut }: SidebarContentProps) {
  function NavLink({ href, label, icon: Icon }: NavItem) {
    const active = pathname === href;
    return (
      <Link
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
  }

  return (
    <div className="flex flex-col h-full">
      <Link href="/" className="flex items-center px-5 py-4 border-b border-white/6">
        <span className="text-lg font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
          Elbold
        </span>
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

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navGroups ? (
          // Grouped nav: admin command centre — filtered by adminRole
          navGroups.map((group) => {
            const visibleItems = filterByRole(group.items, adminRole);
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label} className="mb-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-1">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => <NavLink key={item.href} {...item} />)}
                </div>
              </div>
            );
          })
        ) : (
          // Flat nav: customer / vendor
          <div className="space-y-0.5">
            {nav.map((item) => <NavLink key={item.href} {...item} />)}
          </div>
        )}
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
  user?: Profile;
  adminRole?: AdminRole;
}

const ADMIN_PLACEHOLDER: Profile = {
  id: "", email: "", role: "admin", full_name: null,
  phone: null, phone_verified: false, avatar_url: null,
  created_at: "",
};

export function DashboardLayout({ children, user, adminRole }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const resolvedUser = user ?? ADMIN_PLACEHOLDER;

  const nav =
    resolvedUser.role === "admin" ? ADMIN_NAV :
    resolvedUser.role === "vendor" ? VENDOR_NAV : CUSTOMER_NAV;

  const roleLabel =
    resolvedUser.role === "admin" ? "Admin" :
    resolvedUser.role === "vendor" ? "Vendor" : "Customer";

  async function handleSignOut() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const sidebarProps: SidebarContentProps = {
    user: resolvedUser, nav, roleLabel, pathname,
    navGroups: resolvedUser.role === "admin" ? ADMIN_NAV_GROUPS : undefined,
    adminRole: resolvedUser.role === "admin" ? adminRole : undefined,
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
            <span className="text-slate-300 capitalize">{resolvedUser.role}</span>
          </div>

          <div className="flex items-center gap-3">
            {resolvedUser.role === "customer" && (
              <Link href="/dashboard/create-event" className="btn-primary text-xs py-1.5 px-3.5">
                <Sparkles size={12} />
                Plan Event
              </Link>
            )}
            <Link href="/dashboard/notifications" className="relative p-2 rounded-lg hover:bg-white/5">
              <Bell size={17} className="text-slate-400" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      {resolvedUser.role === "customer" && <SmartConcierge />}
      <MobileBottomNav user={resolvedUser} />
    </div>
  );
}
