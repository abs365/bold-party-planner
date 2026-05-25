"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Sparkles, Bell, ChevronDown, LogOut, User, LayoutDashboard, Store, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

interface NavbarProps {
  user?: Profile | null;
}

export function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { href: "/browse", label: "Browse Vendors" },
    { href: "/inspire", label: "Inspiration" },
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
    window.location.href = "/login";
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="gradient-brand-text">Bold Party</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === link.href ? "text-brand-400" : "text-slate-400 hover:text-white"
              )}
            >
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
                Plan Event
              </Link>
              {user.role === "customer" && (
                <Link href="/vendor/apply" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">
                  Become a Vendor
                </Link>
              )}

              <Link href="/dashboard/notifications" className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
                <Bell size={18} className="text-slate-400" />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
              </Link>

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
                    {user.full_name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="text-sm text-slate-300">{user.full_name?.split(" ")[0]}</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 glass-card rounded-xl overflow-hidden shadow-2xl">
                    <Link
                      href={dashboardLink}
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <LayoutDashboard size={15} className="text-brand-400" />
                      Dashboard
                    </Link>
                    {user.role === "customer" && (
                      <Link
                        href="/vendor/apply"
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Store size={15} className="text-brand-400" />
                        Become a Vendor
                      </Link>
                    )}
                    <Link
                      href="/inspire"
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Compass size={15} className="text-brand-400" />
                      Inspiration
                    </Link>
                    <Link
                      href={user.role === "vendor" ? "/vendor/profile" : user.role === "admin" ? "/admin" : "/dashboard/settings"}
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User size={15} className="text-brand-400" />
                      Account Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5"
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
              <Link href="/vendor/apply" className="text-sm text-slate-400 hover:text-white transition-colors font-medium hidden lg:block">
                List Your Services
              </Link>
              <Link href="/login" className="btn-secondary text-sm py-2 px-4">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary text-sm py-2 px-4">
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-white/5"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-white/8 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm text-slate-300 py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/8 flex flex-col gap-2">
            {user ? (
              <>
                <Link href={dashboardLink} className="btn-secondary text-sm" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/dashboard/create-event" className="btn-primary text-sm" onClick={() => setMobileOpen(false)}>
                  Plan Event
                </Link>
              </>
            ) : (
              <>
                <Link href="/vendor/apply" className="block text-sm text-slate-300 py-2 border-b border-white/8 mb-1" onClick={() => setMobileOpen(false)}>
                  List Your Services →
                </Link>
                <Link href="/login" className="btn-secondary text-sm" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link href="/signup" className="btn-primary text-sm" onClick={() => setMobileOpen(false)}>
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
