import Link from "next/link";
import { Sparkles, Shield } from "lucide-react";

const PLATFORM_LINKS = [
  { label: "Browse Vendors", href: "/browse" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Create an Event", href: "/dashboard/create-event" },
  { label: "Booking Protection", href: "/booking-protection" },
];

const VENDOR_LINKS = [
  { label: "Founding Vendor Programme", href: "/founding-vendors" },
  { label: "Join as a Vendor", href: "/vendor/apply" },
  { label: "Vendor Dashboard", href: "/vendor/dashboard" },
  { label: "Subscription Plans", href: "/vendor/subscription" },
  { label: "Vendor Terms", href: "/vendor-terms" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Refund Policy", href: "/refunds" },
  { label: "Community Guidelines", href: "/community-guidelines" },
];

const SUPPORT_LINKS = [
  { label: "Help Centre", href: "/how-it-works" },
  { label: "Contact Us", href: "mailto:support@elbold.com" },
  { label: "Report an Issue", href: "mailto:safety@elbold.com" },
  { label: "Dispute Resolution", href: "mailto:disputes@elbold.com" },
];

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="gradient-brand-text">ELBOLD</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              ELBOLD Events — trusted vendors for extraordinary celebrations across the UK.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
              <Shield size={12} className="text-gray-400" />
              Stripe-secured payments
            </div>
            <div className="flex gap-3">
              {["IG", "X", "FB"].map((label) => (
                <div
                  key={label}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {PLATFORM_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-gray-500 text-sm hover:text-gray-900 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Vendors</h4>
            <ul className="space-y-2.5">
              {VENDOR_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-gray-500 text-sm hover:text-gray-900 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-gray-500 text-sm hover:text-gray-900 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-gray-500 text-sm hover:text-gray-900 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} ELBOLD Ltd. All rights reserved. Registered in England and Wales.
          </p>
          <div className="flex items-center gap-4 text-gray-400 text-xs">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
            <Link href="/refunds" className="hover:text-gray-600 transition-colors">Refunds</Link>
            <span>Powered by Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
