import Link from "next/link";

const PLATFORM_LINKS = [
  { label: "Browse Vendors", href: "/browse" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About ELBOLD", href: "/about" },
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
    <footer style={{ background: "#091529", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/elbold-mark.svg" width="30" height="30" alt="ELBOLD" />
              <span className="font-bold tracking-[0.18em] text-sm" style={{ color: "#C9A84C" }}>
                ELBOLD
              </span>
            </Link>
            <p
              className="text-sm leading-relaxed mb-5 font-light"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Trusted vendors for extraordinary celebrations across the United Kingdom.
            </p>
            <div
              className="flex items-center gap-2 text-xs mb-6 font-light"
              style={{ color: "rgba(201,168,76,0.45)" }}
            >
              <span style={{ color: "#C9A84C", opacity: 0.6 }}>&#x2605;</span>
              Stripe-secured payments
            </div>
            <div className="flex gap-3" aria-hidden="true">
              {["IG", "X", "FB"].map((label) => (
                <div
                  key={label}
                  className="w-8 h-8 rounded flex items-center justify-center"
                  style={{
                    border: "1px solid rgba(201,168,76,0.12)",
                    background: "rgba(201,168,76,0.03)",
                  }}
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color: "rgba(201,168,76,0.3)" }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {[
            { heading: "Platform", links: PLATFORM_LINKS },
            { heading: "Vendors", links: VENDOR_LINKS },
            { heading: "Legal", links: LEGAL_LINKS },
            { heading: "Support", links: SUPPORT_LINKS },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <h4
                className="text-xs tracking-[0.2em] font-semibold mb-5 uppercase"
                style={{ color: "rgba(201,168,76,0.6)" }}
              >
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="footer-link">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p
            className="text-xs font-light"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            &copy; {new Date().getFullYear()} ELBOLD Ltd. All rights reserved. Registered in England and Wales.
          </p>
          <div
            className="flex items-center gap-5 text-xs font-light"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            <Link href="/privacy" className="hover:opacity-60 transition-opacity">Privacy</Link>
            <Link href="/terms" className="hover:opacity-60 transition-opacity">Terms</Link>
            <Link href="/refunds" className="hover:opacity-60 transition-opacity">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
