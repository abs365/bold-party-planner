import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = { title: "Brand Concepts | Elbold" };

const CONCEPTS = [
  {
    id: "A",
    name: "Refined Luxury",
    file: "/brand/elbold-concept-a.svg",
    fileWhite: "/brand/elbold-concept-a.svg",
    philosophy: "The existing EB emblem, refined to its purest form. The navy badge is removed. The mark stands alone as an open ring with precision crown rays and a generous serif monogram. Cleaner proportions, slimmer line weights, more deliberate spacing. This concept positions Elbold alongside Cartier and Rolex: a brand that does not need to shout.",
    bestFor: "Formal stationery, embossed wedding invitations, premium sponsor materials, watermarks on vendor media.",
    mood: ["Timeless", "Restrained", "Authoritative", "Classic"],
  },
  {
    id: "B",
    name: "Celebration Luxury",
    file: "/brand/elbold-concept-b.svg",
    philosophy: "The mark becomes a celebration starburst: 16 rays of light emanating from the EB centre, evoking fireworks, champagne, and the electric moment of a great event. The navy disc grounds the energy. This concept positions Elbold alongside Moet & Chandon and Veuve Clicquot: unmistakably celebratory, yet refined.",
    bestFor: "Homepage hero, social media, event photography overlays, app icons, launch materials.",
    mood: ["Celebratory", "Dynamic", "Premium", "Memorable"],
  },
  {
    id: "C",
    name: "Premium Wordmark + Monogram",
    file: "/brand/elbold-concept-c.svg",
    philosophy: "Confidence through restraint. A rotated diamond monogram (compact, geometric, timeless) paired with a commanding Elbold wordmark at maximum tracking. A thin rule and EVENTS caption ground the composition. No badge. No ornament. This concept positions Elbold alongside Bang & Olufsen and Four Seasons: luxury through absence.",
    bestFor: "Website navigation, email headers, professional credentials, vendor certificates, printed collateral.",
    mood: ["Minimal", "Commanding", "Modern Luxury", "Sophisticated"],
  },
];

export default async function BrandConceptsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  if (profile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B1F4D" }}>
        <p style={{ color: "rgba(255,255,255,0.4)" }}>Not authorised.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#07111e" }}>
      <Navbar user={profile} />

      <div className="pt-24 pb-32 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-20">
            <p
              className="text-xs tracking-[0.4em] font-semibold mb-5 uppercase"
              style={{ color: "rgba(212,175,55,0.5)" }}
            >
              Brand Evolution Sprint
            </p>
            <h1
              className="text-4xl sm:text-5xl font-light tracking-tight mb-5"
              style={{ color: "rgba(255,255,255,0.92)" }}
            >
              Logo Concepts
            </h1>
            <p className="text-sm font-light max-w-xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
              Three directions for the Elbold visual identity. Each concept maintains the
              deep navy and rich gold brand palette while expressing a distinct personality.
            </p>
          </div>

          {/* Concepts */}
          <div className="space-y-16">
            {CONCEPTS.map((concept) => (
              <div
                key={concept.id}
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(212,175,55,0.1)" }}
              >
                {/* Label bar */}
                <div
                  className="flex items-center justify-between px-8 py-4"
                  style={{ background: "rgba(212,175,55,0.05)", borderBottom: "1px solid rgba(212,175,55,0.08)" }}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="text-xs font-bold tracking-widest px-3 py-1 rounded"
                      style={{ background: "#0B1F4D", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)" }}
                    >
                      CONCEPT {concept.id}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {concept.name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {concept.mood.map((m) => (
                      <span
                        key={m}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-0">
                  {/* Light preview */}
                  <div
                    className="p-16 flex flex-col items-center justify-center gap-12"
                    style={{ background: "#ffffff", borderRight: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <p className="text-xs tracking-widest text-gray-300 font-light uppercase">On white</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={concept.file}
                      alt={`Elbold Logo Concept ${concept.id}`}
                      style={{ height: "60px", width: "auto" }}
                    />
                    {/* Scaled down usage */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={concept.file}
                      alt={`Elbold Logo Concept ${concept.id} small`}
                      style={{ height: "32px", width: "auto", opacity: 0.8 }}
                    />
                  </div>

                  {/* Dark preview */}
                  <div
                    className="p-16 flex flex-col items-center justify-center gap-12"
                    style={{ background: "#0B1F4D" }}
                  >
                    <p className="text-xs tracking-widest font-light uppercase" style={{ color: "rgba(212,175,55,0.35)" }}>
                      On navy
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={concept.file}
                      alt={`Elbold Logo Concept ${concept.id} dark`}
                      style={{ height: "60px", width: "auto", filter: "brightness(1.05)" }}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={concept.file}
                      alt={`Elbold Logo Concept ${concept.id} dark small`}
                      style={{ height: "32px", width: "auto", opacity: 0.75, filter: "brightness(1.05)" }}
                    />
                  </div>
                </div>

                {/* Philosophy */}
                <div
                  className="px-8 py-8 grid sm:grid-cols-2 gap-8"
                  style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(212,175,55,0.06)" }}
                >
                  <div>
                    <p className="text-xs tracking-wider font-semibold mb-3 uppercase" style={{ color: "rgba(212,175,55,0.45)" }}>
                      Design Philosophy
                    </p>
                    <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {concept.philosophy}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs tracking-wider font-semibold mb-3 uppercase" style={{ color: "rgba(212,175,55,0.45)" }}>
                      Best Used For
                    </p>
                    <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {concept.bestFor}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RECOMMENDATION */}
          <div
            className="mt-16 rounded-2xl overflow-hidden"
            style={{ border: "2px solid rgba(212,175,55,0.35)" }}
          >
            {/* Header */}
            <div
              className="px-8 py-5 flex items-center gap-4"
              style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.05) 100%)", borderBottom: "1px solid rgba(212,175,55,0.15)" }}
            >
              <span
                className="text-xs font-bold tracking-widest px-3 py-1.5 rounded"
                style={{ background: "#D4AF37", color: "#0B1F4D" }}
              >
                SELECTED DIRECTION
              </span>
              <span className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                Concept B &mdash; Celebration Luxury
              </span>
            </div>

            <div className="px-8 py-8 grid md:grid-cols-2 gap-10">
              {/* Rationale */}
              <div>
                <p className="text-xs tracking-wider font-semibold uppercase mb-4" style={{ color: "rgba(212,175,55,0.55)" }}>
                  Why Concept B
                </p>
                <div className="space-y-3 text-sm font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <p>
                    The starburst is not decoration &mdash; it is the product. Elbold sells celebrations, and the mark
                    literally radiates celebratory energy. Every competitor uses a neutral wordmark. Elbold should
                    own the moment of festivity.
                  </p>
                  <p>
                    At 16px favicon: the navy disc with gold EB is clean, distinctive, and immediately recognisable.
                    No other event platform has this mark.
                  </p>
                  <p>
                    At 512px social icon: the full starburst reads as premium champagne energy &mdash; it competes
                    visually with Moet and Veuve Clicquot in the celebration space.
                  </p>
                </div>
              </div>

              {/* Identity system */}
              <div>
                <p className="text-xs tracking-wider font-semibold uppercase mb-4" style={{ color: "rgba(212,175,55,0.55)" }}>
                  Full Identity System &mdash; Built
                </p>
                <div className="space-y-2.5">
                  {[
                    { file: "/brand/elbold-logo-final.svg", label: "Primary logo (on light)", usage: "Website, print, proposals" },
                    { file: "/brand/elbold-logo-white.svg", label: "Primary logo (on dark)", usage: "Navbar, email hero, dark UI" },
                    { file: "/brand/elbold-monogram.svg", label: "Monogram mark", usage: "App icon, stamps, emboss" },
                    { file: "/brand/elbold-social-icon.svg", label: "Social profile icon", usage: "Instagram, Facebook, Twitter/X" },
                    { file: "/brand/elbold-email-header.svg", label: "Email header logo", usage: "Transactional + marketing email" },
                    { file: "/icon.svg", label: "SVG favicon", usage: "Browser tab (all modern browsers)" },
                  ].map(({ file, label, usage }) => (
                    <div key={file} className="flex items-center justify-between gap-3 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <div>
                        <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{label}</div>
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{usage}</div>
                      </div>
                      <code className="text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(212,175,55,0.1)", color: "rgba(212,175,55,0.7)" }}>
                        {file}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Brand rules */}
            <div
              className="px-8 py-6 grid sm:grid-cols-3 gap-6 text-xs"
              style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(212,175,55,0.08)" }}
            >
              {[
                {
                  rule: "Minimum size",
                  detail: "32px height for wordmark + mark combined. 16px for monogram alone. Never smaller.",
                },
                {
                  rule: "Clear space",
                  detail: "Maintain clear space equal to the height of the 'E' in Elbold on all four sides.",
                },
                {
                  rule: "Colour usage",
                  detail: "Navy #0B1F4D + Gold #D4AF37 on white. White wordmark + Gold mark on navy. Never on colour backgrounds.",
                },
              ].map(({ rule, detail }) => (
                <div key={rule}>
                  <div className="font-semibold mb-1.5" style={{ color: "rgba(212,175,55,0.65)" }}>{rule}</div>
                  <div className="font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
