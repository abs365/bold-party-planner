"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Sparkles, Bell, ChevronDown, LogOut, User, LayoutDashboard, Store, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

interface NavbarProps {
  user?: Profile | null;
  lightBg?: boolean;
  notificationCount?: number;
}

export function Navbar({ user, lightBg = false, notificationCount = 0 }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { href: "/browse", label: "Find Vendors" },
    { href: "/how-it-works", label: "How It Works" },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const dashboardLink =
    user?.role === "vendor" ? "/vendor/dashboard" :
    user?.role === "admin" ? "/admin" : "/dashboard";

  async function handleSignOut() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  const headerClass = lightBg
    ? "fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200"
    : "fixed top-0 left-0 right-0 z-50 bg-[#0B1F4D]/70 backdrop-blur-md border-b border-white/6";

  const linkClass = (href: string) => cn(
    "text-sm font-medium transition-colors",
    lightBg
      ? (pathname === href ? "text-gray-900" : "text-gray-500 hover:text-gray-900")
      : (pathname === href ? "text-brand-400" : "text-slate-400 hover:text-white")
  );

  const dropdownClass = lightBg
    ? "absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg"
    : "absolute right-0 top-full mt-2 w-48 bg-white/4 border border-white/6 rounded-xl rounded-xl overflow-hidden shadow-2xl";

  const dropdownItemClass = lightBg
    ? "flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    : "flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors";

  const mobileMenuClass = lightBg
    ? "md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3"
    : "md:hidden bg-white/4 border-t border-white/8 px-4 py-4 space-y-3";

  return (
    <header className={headerClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo: full wordmark SVG */}
        <Link href="/" className="flex items-center flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightBg ? "/brand/elbold-logo-final.svg" : "/brand/elbold-logo-white.svg"}
            width="160"
            height="32"
            alt="Elbold"
            className="h-8 w-auto"
            fetchPriority="high"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard/create-event" className="btn-primary text-sm py-2 px-4">
                <Sparkles size={14} />
                Create Event
              </Link>
              {user.role === "customer" && (
                <Link
                  href="/vendor/apply"
                  className={cn(
                    "text-sm font-medium transition-colors",
                    lightBg ? "text-gray-500 hover:text-gray-900" : "text-slate-400 hover:text-white"
                  )}
                >
                  Join as a Vendor
                </Link>
              )}
              <Link
                href="/dashboard/notifications"
                className={cn(
                  "relative p-2 rounded-lg transition-colors",
                  lightBg ? "hover:bg-gray-100" : "hover:bg-white/5"
                )}
              >
                <Bell size={18} className={lightBg ? "text-gray-500" : "text-slate-400"} />
                {notificationCount > 0 && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4AF37] rounded-full" />
                )}
              </Link>

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={cn(
                    "flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg transition-colors",
                    lightBg ? "hover:bg-gray-100" : "hover:bg-white/5"
                  )}
                >
                  <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
                    {user.full_name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className={cn("text-sm", lightBg ? "text-gray-700" : "text-slate-300")}>
                    {user.full_name?.split(" ")[0]}
                  </span>
                  <ChevronDown size={14} className={lightBg ? "text-gray-400" : "text-slate-500"} />
                </button>

                {profileOpen && (
                  <div className={dropdownClass}>
                    <Link
                      href={dashboardLink}
                      className={dropdownItemClass}
                      onClick={() => setProfileOpen(false)}
                    >
                      <LayoutDashboard size={15} className="text-brand-500" />
                      Dashboard
                    </Link>
                    {user.role === "customer" && (
                      <Link
                        href="/vendor/apply"
                        className={dropdownItemClass}
                        onClick={() => setProfileOpen(false)}
                      >
                        <Store size={15} className="text-brand-500" />
                        Join as a Vendor
                      </Link>
                    )}
                    <Link
                      href="/inspire"
                      className={dropdownItemClass}
                      onClick={() => setProfileOpen(false)}
                    >
                      <Compass size={15} className="text-brand-500" />
                      Inspiration
                    </Link>
                    <Link
                      href={user.role === "vendor" ? "/vendor/profile" : user.role === "admin" ? "/admin" : "/dashboard/settings"}
                      className={dropdownItemClass}
                      onClick={() => setProfileOpen(false)}
                    >
                      <User size={15} className="text-brand-500" />
                      Account Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 transition-colors border-t",
                        lightBg ? "hover:bg-red-50 border-gray-100" : "hover:bg-red-500/10 border-white/5"
                      )}
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/vendor/apply"
                className={cn(
                  "text-sm font-medium transition-colors hidden lg:block",
                  lightBg ? "text-gray-500 hover:text-gray-900" : "text-slate-400 hover:text-white"
                )}
              >
                Join as a Vendor
              </Link>
              {lightBg ? (
                <>
                  <Link href="/login" className="btn-secondary-light text-sm py-2 px-4">
                    Sign In
                  </Link>
                  <Link href="/signup" className="btn-primary text-sm py-2 px-4">
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary text-sm py-2 px-4">
                    Sign In
                  </Link>
                  <Link href="/browse" className="btn-luxury text-sm py-2 px-4">
                    Begin Planning
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={cn(
            "md:hidden p-2 rounded-lg transition-colors",
            lightBg ? "hover:bg-gray-100 text-gray-700" : "hover:bg-white/5 text-slate-300"
          )}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={mobileMenuClass}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block text-sm py-2",
                lightBg ? "text-gray-700" : "text-slate-300"
              )}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className={cn("pt-2 border-t flex flex-col gap-2", lightBg ? "border-gray-100" : "border-white/8")}>
            {user ? (
              <>
                <Link href={dashboardLink} className={lightBg ? "btn-secondary-light text-sm" : "btn-secondary text-sm"} onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/dashboard/create-event" className="btn-primary text-sm" onClick={() => setMobileOpen(false)}>
                  Create Event
                </Link>
              </>
            ) : (
              <>
                <Link href="/browse" className="btn-primary text-sm" onClick={() => setMobileOpen(false)}>
                  Find Professionals
                </Link>
                <Link href="/login" className={lightBg ? "btn-secondary-light text-sm" : "btn-secondary text-sm"} onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link
                  href="/vendor/apply"
                  className={cn(
                    "block text-sm py-2 text-center",
                    lightBg ? "text-gray-500" : "text-slate-400"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  Join as a Vendor
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
