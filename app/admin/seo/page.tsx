import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { CheckCircle2, Clock, Circle, ArrowRight, MapPin, FileText, Star } from "lucide-react";

export const metadata: Metadata = { title: "Local SEO Authority Roadmap | Elbold Admin" };
export const dynamic = "force-dynamic";

// ── Phase definitions ─────────────────────────────────────────────────────
const PHASES = [
  {
    phase: "Phase 1: Foundation (Months 1–2)",
    status: "active",
    goal: "Establish technical SEO correctness and baseline authority signals.",
    tasks: [
      { done: true,  label: "sitemap.xml covering all 91+ routes" },
      { done: true,  label: "robots.txt: allow all public pages" },
      { done: true,  label: "JSON-LD: Organization + WebSite on homepage" },
      { done: true,  label: "JSON-LD: LocalBusiness on all vendor profile pages" },
      { done: true,  label: "JSON-LD: Article + FAQPage + BreadcrumbList on all guide pages" },
      { done: true,  label: "JSON-LD: CollectionPage on category pages" },
      { done: true,  label: "Canonical metadata on every page" },
      { done: false, label: "Google Search Console verified and sitemap submitted" },
      { done: false, label: "Google Business Profile created (Elbold UK)" },
      { done: false, label: "Bing Webmaster Tools verified" },
      { done: false, label: "Core Web Vitals measured: LCP, CLS, FID baselines" },
    ],
  },
  {
    phase: "Phase 2: Local City Content (Months 2–4)",
    status: "next",
    goal: "Rank for '[service] in [city]' queries across Essex, Kent, and London.",
    tasks: [
      { done: true,  label: "/essex + /essex/djs + /essex/photographers + /essex/caterers" },
      { done: true,  label: "/kent + /kent/djs + /kent/photographers + /kent/caterers" },
      { done: true,  label: "/london + /london/djs + /london/photographers + /london/caterers" },
      { done: false, label: "Add /manchester page + 3 category sub-pages" },
      { done: false, label: "Add /birmingham page + 3 category sub-pages" },
      { done: false, label: "Add /bristol page + 3 category sub-pages" },
      { done: false, label: "Add /leeds page + 3 category sub-pages" },
      { done: false, label: "Extend location-page.tsx LOCATION_DATA with new cities" },
      { done: false, label: "Add LocalBusiness JSON-LD with areaServed for each city page" },
      { done: false, label: "Each city page: 300+ words of unique, relevant copy" },
    ],
  },
  {
    phase: "Phase 3: Guide Authority (Months 3–5)",
    status: "next",
    goal: "Rank for planning query keywords. Build Elbold as a trusted planning authority.",
    tasks: [
      { done: true,  label: "5 published guides with Article + FAQPage JSON-LD" },
      { done: false, label: "Guide: 'How much does a photographer cost in the UK?' (high volume)" },
      { done: false, label: "Guide: 'Wedding caterer cost UK 2026'" },
      { done: false, label: "Guide: 'How to plan a corporate event in London'" },
      { done: false, label: "Guide: 'Event decorator hire UK: what to expect'" },
      { done: false, label: "Guide: 'How to hire an entertainer for a children's party'" },
      { done: false, label: "Guide: 'Muslim wedding planning guide UK'" },
      { done: false, label: "Guide: 'Hindu wedding vendor guide UK'" },
      { done: false, label: "Guide: 'Afro-Caribbean event planning guide UK'" },
      { done: false, label: "Internal linking: every guide links to 2+ relevant browse pages" },
      { done: false, label: "Guides RSS feed or JSON index for Google Discover eligibility" },
    ],
  },
  {
    phase: "Phase 4: Category Depth (Months 4–6)",
    status: "pending",
    goal: "Rank for '[vendor type] hire near me' and '[vendor type] UK' queries.",
    tasks: [
      { done: false, label: "Unique 400-word intro copy on each /categories/[category] page" },
      { done: false, label: "Add 'Average price' section to each category page" },
      { done: false, label: "Add 'What to look for when hiring a [category]' section" },
      { done: false, label: "Add FAQ section with JSON-LD FAQPage markup on every category page" },
      { done: false, label: "Cross-link category pages to related guides" },
      { done: false, label: "Add 'Related categories' section (e.g., photographer → videographer, makeup)" },
    ],
  },
  {
    phase: "Phase 5: Link Authority (Months 6–12)",
    status: "pending",
    goal: "Build domain authority through genuine external links.",
    tasks: [
      { done: false, label: "Submit to UK wedding directories (Hitched, Weddingsonline, etc.)" },
      { done: false, label: "Submit to UK event planning directories (Eventbrite, Poptop, etc.)" },
      { done: false, label: "Partner outreach: UK wedding blogs for guest guide inclusion" },
      { done: false, label: "PR: pitch 'vendor verification' angle to UK wedding press" },
      { done: false, label: "Vendor profiles: encourage vendors to link from their own websites" },
      { done: false, label: "Guides: outreach for editorial backlinks (journalists, wedding forums)" },
      { done: false, label: "Elbold Google Business reviews: encourage vendor and customer reviews" },
    ],
  },
  {
    phase: "Phase 6: Review Schema and Trust Signals (Months 8–12)",
    status: "pending",
    goal: "Generate rich search snippets with star ratings. Build Google-visible trust.",
    tasks: [
      { done: false, label: "AggregateRating JSON-LD already on vendor profiles: verify in Rich Results Test" },
      { done: false, label: "Add Review JSON-LD for top 3 most recent reviews on vendor profiles" },
      { done: false, label: "Platform-wide review count: add to homepage JSON-LD Organization" },
      { done: false, label: "FAQ schema on /how-it-works, /our-commitments, /trust pages" },
      { done: false, label: "BreadcrumbList on all category pages, guide pages, location pages" },
      { done: false, label: "Test all JSON-LD in Google Rich Results Test tool" },
    ],
  },
];

const KEYWORD_CLUSTERS = [
  {
    cluster: "Local vendor discovery",
    priority: "HIGH",
    examples: [
      "wedding DJ Essex",
      "photographer London hire",
      "caterer Kent wedding",
      "decorator Manchester event",
      "event planner Birmingham",
    ],
    targetPages: "/essex, /kent, /london + sub-pages",
  },
  {
    cluster: "Vendor type + hire",
    priority: "HIGH",
    examples: [
      "hire a wedding photographer UK",
      "DJ hire near me wedding",
      "event decorator hire UK",
      "catering company hire UK",
      "entertainment hire party UK",
    ],
    targetPages: "/categories/[category]",
  },
  {
    cluster: "Planning intent",
    priority: "MEDIUM",
    examples: [
      "how to plan a wedding UK",
      "wedding planning checklist UK",
      "how much does a DJ cost",
      "what does a photographer cost UK",
      "birthday party planning guide",
    ],
    targetPages: "/guides/[slug], /resources",
  },
  {
    cluster: "Trust and verification",
    priority: "MEDIUM",
    examples: [
      "trusted event vendors UK",
      "verified wedding photographer",
      "how to find reliable event professionals",
      "event vendor scam how to avoid",
    ],
    targetPages: "/trust, /how-we-verify, /our-commitments",
  },
  {
    cluster: "Cultural events",
    priority: "HIGH (underserved)",
    examples: [
      "Asian wedding DJ UK",
      "Nigerian party catering London",
      "Hindu wedding photographer",
      "Caribbean party vendor UK",
      "Muslim wedding planner Essex",
    ],
    targetPages: "Requires new guide content + cultural category filters",
  },
  {
    cluster: "Brand authority",
    priority: "LONG TERM",
    examples: [
      "Elbold events",
      "Elbold vendor reviews",
      "Elbold vs [competitor]",
    ],
    targetPages: "/about, /trust, homepage",
  },
];

const statusIcon = (done: boolean) =>
  done
    ? <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
    : <Circle size={14} className="text-gray-200 flex-shrink-0" />;

const phaseStatusBadge = (status: string) => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active:  { label: "In Progress", color: "#C9A84C", bg: "rgba(201,168,76,0.1)" },
    next:    { label: "Next",        color: "#0B1F4D", bg: "rgba(11,31,77,0.08)" },
    pending: { label: "Planned",     color: "#999",    bg: "rgba(0,0,0,0.04)" },
  };
  const { label, color, bg } = map[status] ?? map.pending;
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded" style={{ color, background: bg }}>
      {label}
    </span>
  );
};

export default async function SeoRoadmapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const totalTasks = PHASES.flatMap((p) => p.tasks).length;
  const doneTasks  = PHASES.flatMap((p) => p.tasks).filter((t) => t.done).length;
  const pct = Math.round((doneTasks / totalTasks) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />

      <div className="max-w-5xl mx-auto px-4 py-10 pt-24">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <Link href="/admin" className="hover:text-gray-700 transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-gray-700">SEO Roadmap</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Local SEO Authority Roadmap</h1>
          <p className="text-sm text-gray-500 font-light">
            Elbold&apos;s strategy to build local search authority across the UK event marketplace.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-gray-100 p-7 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-semibold text-gray-900">{pct}%</div>
              <div className="text-xs text-gray-400 font-light">{doneTasks} of {totalTasks} tasks complete</div>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">{PHASES.filter((p) => p.status === "active").length}</div>
                <div className="text-xs text-gray-400 font-light">Active phases</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{PHASES.length}</div>
                <div className="text-xs text-gray-400 font-light">Total phases</div>
              </div>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#D4AF37" }} />
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-5 mb-12">
          {PHASES.map(({ phase, status, goal, tasks }) => {
            const done = tasks.filter((t) => t.done).length;
            return (
              <div key={phase} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-start justify-between p-6 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      {phaseStatusBadge(status)}
                      <h3 className="font-semibold text-gray-900 text-sm">{phase}</h3>
                    </div>
                    <p className="text-xs text-gray-400 font-light">{goal}</p>
                  </div>
                  <span className="text-xs text-gray-400 font-light flex-shrink-0 ml-4">{done}/{tasks.length}</span>
                </div>
                <ul className="p-5 space-y-2.5">
                  {tasks.map((task) => (
                    <li key={task.label} className="flex items-center gap-3">
                      {statusIcon(task.done)}
                      <span className={`text-xs font-light ${task.done ? "text-gray-400 line-through" : "text-gray-700"}`}>
                        {task.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Keyword Clusters */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Target Keyword Clusters</h2>
          <p className="text-sm text-gray-400 font-light mb-6">
            Organised by commercial intent and current page coverage.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {KEYWORD_CLUSTERS.map(({ cluster, priority, examples, targetPages }) => {
            const priorityColor = priority.startsWith("HIGH") ? "#C9A84C" : priority === "MEDIUM" ? "#0B1F4D" : "#aaa";
            return (
              <div key={cluster} className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-sm">{cluster}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: priorityColor, background: `${priorityColor}14` }}>
                    {priority}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {examples.map((kw) => (
                    <span key={kw} className="text-xs px-2 py-0.5 rounded bg-gray-50 border border-gray-100 text-gray-500 font-light">
                      {kw}
                    </span>
                  ))}
                </div>
                <div className="flex items-start gap-1.5 text-xs text-gray-400 font-light">
                  <FileText size={11} className="flex-shrink-0 mt-0.5" />
                  Target: {targetPages}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-7">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Immediate Next Actions</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: "Submit sitemap to Google Search Console", href: "https://search.google.com/search-console" },
              { label: "Create Google Business Profile", href: "https://business.google.com" },
              { label: "Verify sitemap is correct", href: "/sitemap.xml" },
              { label: "Test JSON-LD in Rich Results Tool", href: "https://search.google.com/test/rich-results" },
              { label: "Check guides are indexed", href: "/guides" },
              { label: "Review location pages", href: "/essex" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex items-center justify-between rounded-lg px-4 py-3 border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-xs font-medium text-gray-700 group"
              >
                {label}
                <ArrowRight size={11} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-2 mt-8 text-xs text-gray-400 font-light">
          <Clock size={11} />
          Roadmap last reviewed: June 2026
        </div>
      </div>
    </div>
  );
}
