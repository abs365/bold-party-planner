import Link from "next/link";
import { Sparkles, Shield, Star, CheckCircle2 } from "lucide-react";

const PLATFORM_LINKS = [
  { label: "Browse Vendors", href: "/browse" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Create an Event", href: "/dashboard/create-event" },
  { label: "Booking Protection", href: "/booking-protection" },
];

const VENDOR_LINKS = [
  { label: "Join as Vendor", href: "/vendor/apply" },
  { label: "Vendor Dashboard", href: "/vendor/dashboard" },
  { label: "Subscription Plans", href: "/vendor/subscription" },
  { label: "Vendor Terms", href: "/vendor-terms" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Refund Policy", href: "/refunds" },
  { label: "Community Guidelines", href: "/community-guidelines" },
];

const SUPPORT_LINKS = [
  { label: "Help Centre", href: "/how-it-works" },
  { label: "Contact Us", href: "mailto:support@boldparty.co.uk" },
  { label: "Report an Issue", href: "mailto:safety@boldparty.co.uk" },
  { label: "Dispute Resolution", href: "mailto:disputes@boldparty.co.uk" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-black/30">
      {/* Social proof strip */}
      <div className="border-b border-white/6 bg-white/2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "2,400+", label: "Events Planned" },
              { value: "500+", label: "Verified Vendors" },
              { value: "4.9★", label: "Average Rating" },
              { value: "98%", label: "Happy Customers" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-xl font-extrabold gradient-brand-text">{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 mt-6 pt-6 border-t border-white/6">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CheckCircle2 size={12} className="text-brand-400" />
              Manually verified vendors
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Shield size={12} className="text-brand-400" />
              Stripe-secured payments
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              Money-back guarantee
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="gradient-brand-text">Bold Party</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              The UK&apos;s trusted event planning marketplace. Plan, book, and celebrate with confidence.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
              <Shield size={12} className="text-brand-400" />
              Stripe-secured payments
            </div>
            <div className="flex gap-3">
              {["IG", "X", "FB"].map((label) => (
                <div key={label} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                  <span className="text-xs font-bold text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {PLATFORM_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-slate-400 text-sm hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Vendors</h4>
            <ul className="space-y-2.5">
              {VENDOR_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-slate-400 text-sm hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-slate-400 text-sm hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-slate-400 text-sm hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Bold Party Event Planner Ltd. All rights reserved. Registered in England and Wales.
          </p>
          <div className="flex items-center gap-4 text-slate-600 text-xs">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="/refunds" className="hover:text-slate-400 transition-colors">Refunds</Link>
            <span>Powered by Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
