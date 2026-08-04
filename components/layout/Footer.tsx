import Link from "next/link";

const PLATFORM_LINKS = [
  { label: "Browse Vendors", href: "/browse" },
  { label: "Planning Resources", href: "/resources" },
  { label: "Event Inspiration", href: "/inspire" },
  { label: "Planning Guides", href: "/guides" },
  { label: "How It Works", href: "/how-it-works" },
];

const TRUST_LINKS = [
  { label: "The Elbold Trust System", href: "/trust" },
  { label: "How We Verify Vendors", href: "/how-we-verify" },
  { label: "Vendor Standards", href: "/vendor-standards" },
  { label: "Our Commitments", href: "/our-commitments" },
  { label: "Booking Protection", href: "/booking-protection" },
];

// HOTFIX-001 (2026-07-17): the site-wide footer's regional link column was
// removed as a brand-positioning correction — ELBOLD's public brand is
// UK-wide, and a global footer repeating "Essex / Kent / London" on every
// page contradicted that. This is distinct from, and does not change,
// EDR-05's region-first growth *strategy*: the underlying regional SEO
// landing pages (/essex, /kent, /london and their category sub-pages) are
// untouched, still live, and still indexed via sitemap.ts. Only their
// direct link from this global footer was removed.

const VENDOR_LINKS = [
  { label: "Founding Vendor Programme", href: "/founding-vendors" },
  { label: "Vendor Spotlights", href: "/vendor-spotlights" },
  { label: "Join as a Vendor", href: "/vendor/apply" },
  { label: "Vendor Standards", href: "/vendor-standards" },
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
  { label: "Help Centre", href: "/help" },
  { label: "Contact Us", href: "mailto:support@elbold.com" },
  { label: "Report an Issue", href: "mailto:safety@elbold.com" },
  { label: "Dispute Resolution", href: "/dashboard/bookings" },
];

export function Footer() {
  return (
    <footer style={{ background: "#091529", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-14">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="block mb-5">
              <span className="text-xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
                Elbold
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
          </div>

          {[
            { heading: "Platform", links: PLATFORM_LINKS },
            { heading: "Trust", links: TRUST_LINKS },
            { heading: "Vendors", links: VENDOR_LINKS },
            { heading: "Legal", links: LEGAL_LINKS },
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
            &copy; {new Date().getFullYear()} Elbold. United Kingdom.
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
