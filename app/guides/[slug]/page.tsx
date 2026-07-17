import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { GUIDES, getGuide, getRelatedGuides } from "@/lib/guides";
import { ArrowRight, Clock, BookOpen, ChevronRight, Search } from "lucide-react";

export async function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide Not Found" };
  return {
    title: `${guide.title} | Guides`,
    description: guide.description,
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
      publishedTime: guide.publishedDate,
    },
  };
}

export default async function GuidePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  const relatedGuides = getRelatedGuides(guide.relatedSlugs ?? []);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedDate,
    author: { "@type": "Organization", name: "Elbold" },
    publisher: {
      "@type": "Organization",
      name: "Elbold",
      url: "https://elbold.co.uk",
    },
  };

  const faqSchema = guide.faqs
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: guide.faqs.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://elbold.co.uk" },
      { "@type": "ListItem", position: 2, name: "Guides", item: "https://elbold.co.uk/guides" },
      { "@type": "ListItem", position: 3, name: guide.title },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Navbar user={profile} />

      {/* Hero */}
      <div className="pt-16" style={{ background: "#0D1B3E" }}>
        <div className="max-w-3xl mx-auto px-4 py-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Link href="/" className="hover:opacity-60 transition-opacity">Home</Link>
            <ChevronRight size={12} />
            <Link href="/guides" className="hover:opacity-60 transition-opacity">Guides</Link>
            <ChevronRight size={12} />
            <span style={{ color: "rgba(255,255,255,0.6)" }}>{guide.category}</span>
          </nav>

          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-5"
            style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}
          >
            {guide.heroTag}
          </div>
          <h1
            className="text-3xl md:text-4xl font-light tracking-tight mb-4 leading-snug"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            {guide.title}
          </h1>
          <div className="flex items-center gap-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            <div className="flex items-center gap-1.5 text-xs">
              <Clock size={12} />
              {guide.readingMinutes} min read
            </div>
            <span>&middot;</span>
            <div className="flex items-center gap-1.5 text-xs">
              <BookOpen size={12} />
              {guide.category}
            </div>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="max-w-3xl mx-auto px-4 py-16">

        {/* Intro */}
        <p className="text-lg text-gray-600 font-light leading-relaxed mb-12 border-l-4 pl-6" style={{ borderColor: "#D4AF37" }}>
          {guide.intro}
        </p>

        {/* Sections */}
        <div className="space-y-10">
          {guide.sections.map(({ heading, content }) => (
            <div key={heading}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{heading}</h2>
              {typeof content === "string" ? (
                <p className="text-gray-500 font-light leading-relaxed">{content}</p>
              ) : (
                <ul className="space-y-2.5">
                  {content.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-500">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                        style={{ background: "#D4AF37" }}
                      />
                      <span className="font-light leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        {guide.faqs && guide.faqs.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-8">Frequently asked questions</h2>
            <div className="space-y-3">
              {guide.faqs.map(({ q, a }) => (
                <details key={q} className="group border border-gray-100 rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between px-6 py-5 cursor-pointer text-sm font-semibold text-gray-900 select-none list-none">
                    {q}
                    <Search
                      size={15}
                      className="flex-shrink-0 transition-transform duration-200 group-open:rotate-90"
                      style={{ color: "#C9A84C" }}
                    />
                  </summary>
                  <div className="px-6 pb-5">
                    <p className="text-sm text-gray-500 font-light leading-relaxed">{a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div
          className="mt-16 rounded-2xl p-8 text-center"
          style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #162447 100%)", border: "1px solid rgba(212,175,55,0.12)" }}
        >
          <h3
            className="text-xl font-light tracking-tight mb-3"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Ready to find a verified vendor?
          </h3>
          <p className="text-sm font-light mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
            Every vendor on Elbold is individually reviewed before listing.
          </p>
          <Link
            href={guide.ctaHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ background: "#D4AF37", color: "#0D1B3E" }}
          >
            {guide.ctaLabel}
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Related guides */}
        {relatedGuides.length > 0 && (
          <div className="mt-16">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Related guides</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {relatedGuides.map((related) => (
                <Link
                  key={related.slug}
                  href={`/guides/${related.slug}`}
                  className="group p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-semibold mb-1" style={{ color: "#C9A84C" }}>
                      {related.heroTag}
                    </div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors leading-snug">
                      {related.title}
                    </div>
                  </div>
                  <ArrowRight size={14} className="flex-shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronRight size={14} className="rotate-180" />
            All guides
          </Link>
        </div>

      </div>

      <Footer />
    </div>
  );
}
