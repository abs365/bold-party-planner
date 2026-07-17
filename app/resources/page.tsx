import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, BookOpen, CheckSquare, Calculator, Calendar, MapPin, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Event Planning Resources | Guides, Checklists and Tools",
  description:
    "Free event planning guides, checklists, budget templates and tools from Elbold. Plan your wedding, birthday, corporate event or celebration with expert resources.",
  openGraph: {
    title: "Event Planning Resources | Elbold",
    description: "Free guides, checklists, and planning tools for UK event hosts.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
};

export const dynamic = "force-dynamic";

// ── Real guides from lib/guides.ts ───────────────────────────────────────
const GUIDES = [
  {
    slug: "wedding-planning-checklist-uk",
    title: "Wedding Planning Checklist UK",
    category: "Weddings",
    readTime: "12 min read",
    desc: "A complete, month-by-month timeline covering every milestone from venue booking to the day itself.",
    accent: "#0B1F4D",
  },
  {
    slug: "how-to-choose-a-photographer",
    title: "How to Choose the Right Photographer",
    category: "Photography",
    readTime: "8 min read",
    desc: "Portfolio assessment, contract terms, pricing benchmarks, and the questions every couple should ask.",
    accent: "#162047",
  },
  {
    slug: "how-much-does-a-dj-cost-in-essex",
    title: "How Much Does a DJ Cost in Essex?",
    category: "Music & DJs",
    readTime: "6 min read",
    desc: "Transparent pricing ranges for weddings, parties, and corporate events across Essex.",
    accent: "#132a18",
  },
  {
    slug: "birthday-party-planning-guide",
    title: "Birthday Party Planning Guide",
    category: "Birthdays",
    readTime: "9 min read",
    desc: "From intimate dinners to large celebrations — a practical guide to planning a memorable birthday event.",
    accent: "#2a1010",
  },
  {
    slug: "corporate-event-planning-checklist",
    title: "Corporate Event Planning Checklist",
    category: "Corporate",
    readTime: "10 min read",
    desc: "A professional checklist for conferences, team events, awards ceremonies and corporate celebrations.",
    accent: "#0d1e2e",
  },
];

// ── Budget guides (inline content, no separate pages yet) ────────────────
const BUDGET_GUIDES = [
  {
    title: "UK Wedding Budget Guide 2026",
    desc: "Average costs for venues, photography, catering, decoration, and entertainment. Based on real UK vendor pricing.",
    ranges: [
      { label: "Intimate wedding (under 50 guests)", range: "£8,000 – £18,000" },
      { label: "Mid-size wedding (50–100 guests)", range: "£18,000 – £35,000" },
      { label: "Large wedding (100+ guests)", range: "£35,000+" },
    ],
  },
  {
    title: "Birthday Party Budget Guide",
    desc: "What to budget for a UK birthday celebration, from a hired venue gathering to a large event.",
    ranges: [
      { label: "House party / small venue (20–40 people)", range: "£500 – £2,500" },
      { label: "Event space hire (40–80 people)", range: "£2,500 – £8,000" },
      { label: "Large celebration (80+ people)", range: "£8,000 – £25,000" },
    ],
  },
  {
    title: "Corporate Event Budget Guide",
    desc: "Planning costs for team events, conferences, and corporate celebrations in the UK.",
    ranges: [
      { label: "Team day / small event (20–50 people)", range: "£1,500 – £6,000" },
      { label: "Conference or awards (50–150 people)", range: "£6,000 – £25,000" },
      { label: "Large corporate event (150+ people)", range: "£25,000+" },
    ],
  },
];

// ── Checklists ────────────────────────────────────────────────────────────
const CHECKLISTS = [
  {
    title: "Wedding Day Vendor Confirmation Checklist",
    items: [
      "Venue: confirm setup time, final headcount, catering briefing",
      "Photographer: confirm arrival time, shot list, second shooter status",
      "DJ or band: confirm playlist, PA system requirements, break timing",
      "Decorator: confirm delivery window, setup/teardown times, POC on the day",
      "Caterer: confirm menu, dietary accommodations, service style",
      "All vendor contact numbers saved and accessible on the day",
    ],
  },
  {
    title: "Vendor Enquiry Checklist",
    items: [
      "Confirm availability for your date before discussing anything else",
      "Ask to see a full recent gallery, not just highlights",
      "Request a written quote including all potential additional costs",
      "Ask about deposit, payment schedule, and cancellation terms",
      "Ask how they prefer to communicate and their expected response time",
      "Ask what happens if they are ill or cannot attend",
      "Request a written contract before paying any deposit",
    ],
  },
  {
    title: "6-Week Pre-Event Checklist",
    items: [
      "Confirm all vendor bookings are still in place",
      "Send final headcount to venue and caterer",
      "Finalise timings and share with all vendors",
      "Confirm vendor access requirements (parking, loading, setup)",
      "Create a point-of-contact document with all vendor numbers",
      "Pay any outstanding balances due before the event",
      "Arrange any required licences (music, alcohol, temporary events notice)",
    ],
  },
];

// ── Location resources ─────────────────────────────────────────────────────
const LOCATION_RESOURCES = [
  { city: "Essex", href: "/essex", categories: ["DJs", "Photographers", "Caterers"] },
  { city: "Kent", href: "/kent", categories: ["Caterers", "Florists", "DJs"] },
  { city: "London", href: "/london", categories: ["Venues", "Photographers", "Entertainers"] },
];

export default async function ResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="pt-16" style={{ background: "#0B1F4D" }}>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase" style={{ color: "rgba(212,175,55,0.6)" }}>
            Planning Resources
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-5" style={{ color: "rgba(255,255,255,0.95)" }}>
            Everything you need to
            <br />
            plan with confidence.
          </h1>
          <p className="text-base font-light max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Expert planning guides, budget benchmarks, vendor checklists and local resources —
            all free, all written by people who understand how UK events actually work.
          </p>
        </div>
      </div>

      {/* ── QUICK NAVIGATION ─────────────────────────────────────────── */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex gap-6 overflow-x-auto">
          {[
            { label: "Guides",     href: "#guides" },
            { label: "Budgets",    href: "#budgets" },
            { label: "Checklists", href: "#checklists" },
            { label: "By Location", href: "#locations" },
            { label: "Find Vendors", href: "/browse" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-xs font-semibold whitespace-nowrap transition-colors hover:text-gray-900 text-gray-400"
              style={{ letterSpacing: "0.06em" }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* ── PLANNING GUIDES ──────────────────────────────────────────── */}
      <section id="guides" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
                Expert Guides
              </p>
              <h2 className="text-3xl font-light text-gray-900 tracking-tight">
                Plan with expert guidance.
              </h2>
            </div>
            <Link href="/guides" className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 font-light transition-colors">
              All guides <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all overflow-hidden flex flex-col"
              >
                <div className="h-1.5" style={{ background: guide.accent }} />
                <div className="p-7 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs tracking-[0.3em] font-semibold uppercase" style={{ color: "rgba(11,31,77,0.35)" }}>
                      {guide.category}
                    </span>
                    <span className="text-xs text-gray-400 font-light">{guide.readTime}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-3 flex-1">{guide.title}</h3>
                  <p className="text-xs text-gray-400 font-light leading-relaxed mb-5">{guide.desc}</p>
                  <div className="flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2 transition-all" style={{ color: "#0B1F4D" }}>
                    <BookOpen size={11} /> Read guide <ArrowRight size={10} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUDGET GUIDES ────────────────────────────────────────────── */}
      <section id="budgets" style={{ background: "#f8f7f5" }} className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Budget Benchmarks
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-3">
              What events actually cost in the UK.
            </h2>
            <p className="text-sm text-gray-500 font-light max-w-xl">
              Real price ranges based on current UK market data.
              Figures reflect typical total event spend including venue, catering, and key suppliers.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BUDGET_GUIDES.map(({ title, desc, ranges }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(11,31,77,0.06)" }}>
                    <Calculator size={15} style={{ color: "#0B1F4D" }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-2">{title}</h3>
                  <p className="text-xs text-gray-400 font-light leading-relaxed">{desc}</p>
                </div>
                <div className="p-5 space-y-3">
                  {ranges.map(({ label, range }) => (
                    <div key={label} className="flex items-start justify-between gap-3">
                      <span className="text-xs text-gray-500 font-light">{label}</span>
                      <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">{range}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 font-light mt-5 text-center">
            Ranges are indicative. Actual costs depend on guest count, location, date, vendor tier, and event requirements. Always obtain written quotes.
          </p>
        </div>
      </section>

      {/* ── CHECKLISTS ───────────────────────────────────────────────── */}
      <section id="checklists" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Practical Checklists
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">
              Checklists that prevent problems.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CHECKLISTS.map(({ title, items }) => (
              <div key={title} className="rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-all">
                <div className="p-5 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(11,31,77,0.06)" }}>
                    <CheckSquare size={15} style={{ color: "#0B1F4D" }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                </div>
                <ul className="p-5 space-y-3">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />
                      <span className="text-xs text-gray-500 font-light leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BY LOCATION ──────────────────────────────────────────────── */}
      <section id="locations" style={{ background: "#f8f7f5" }} className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Local Resources
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">
              Find vendors near you.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {LOCATION_RESOURCES.map(({ city, href, categories }) => (
              <Link
                key={city}
                href={href}
                className="bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={15} style={{ color: "#C9A84C" }} />
                  <span className="font-semibold text-gray-900 text-sm">Event Vendors in {city}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {categories.map((c) => (
                    <span key={c} className="text-xs px-2.5 py-1 rounded-full border border-gray-100 text-gray-500 font-light">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold group-hover:gap-1.5 transition-all" style={{ color: "#0B1F4D" }}>
                  Browse vendors <ArrowRight size={10} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SMART PLANNER CTA ────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: "#0B1F4D" }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>
            Smart Event Planner
          </p>
          <h2 className="text-2xl font-light tracking-tight mb-4" style={{ color: "rgba(255,255,255,0.92)" }}>
            Let us help you plan your event.
          </h2>
          <p className="text-sm font-light leading-relaxed mb-8 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.38)" }}>
            Tell us about your event — type, date, guest count, and budget.
            Our Smart Planner will suggest which vendors to book first, and in what order.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/create-event" className="btn-luxury text-sm px-10">
              Start Planning Free <ArrowRight size={14} />
            </Link>
            <Link href="/browse" className="btn-luxury-outline text-sm px-10">
              Browse Vendors
            </Link>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-6 text-xs font-light" style={{ color: "rgba(255,255,255,0.18)" }}>
            <Users size={11} />
            Free to use. No account required to browse.
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
