import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, CheckCircle2, Shield, Star, Heart, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About ELBOLD | Why We Exist, Who We Are, What We Stand For",
  description:
    "ELBOLD was founded because finding a trustworthy event vendor in the UK was harder than it should be. Read our story, our mission, and the values that guide every decision we make.",
  openGraph: {
    title: "About ELBOLD Events",
    description: "Founded to solve a real problem: helping UK event hosts find professionals they can genuinely trust.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
};

export const dynamic = "force-dynamic";

const VALUES = [
  {
    icon: Shield,
    title: "Trust is not a feature. It is the product.",
    body: "Every decision we make — from vendor approval to payment flow to review policy — starts with the same question: does this increase or decrease the trust a customer can place in ELBOLD? If it decreases trust, we do not build it.",
  },
  {
    icon: CheckCircle2,
    title: "Honesty over optimism.",
    body: "We do not write marketing that overpromises. We do not display statistics we cannot verify. We do not approve vendors we have not reviewed. We would rather tell you what we do not yet do than pretend we are something we are not.",
  },
  {
    icon: Star,
    title: "The vendor relationship is a partnership.",
    body: "Event professionals are not commodities in a directory. They are skilled, independent people building businesses. We keep 10% of bookings — not because it is market standard, but because it is fair. Vendors who earn well, stay. Vendors who stay, build their reputation. That is good for everyone.",
  },
  {
    icon: Heart,
    title: "Events matter because moments matter.",
    body: "A wedding is not a transaction. A 50th birthday is not a line item. Cultural celebrations, anniversaries, corporate milestones — these are the occasions that define how people remember their lives. We take that responsibility seriously.",
  },
  {
    icon: Users,
    title: "Accountability is visible, not buried.",
    body: "Our vendor standards are published. Our trust commitments are public. Our review policy is documented. We publish what we approve vendors on, what we remove them for, and what we guarantee customers. Nothing is hidden.",
  },
];

export default async function AboutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  const { count: vendorCount } = await supabase
    .from("vendors")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[60vh] flex flex-col items-center justify-center overflow-hidden pt-16"
        style={{ background: "linear-gradient(160deg, #0B1F4D 0%, #091529 50%, #060e1e 100%)" }}
      >
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80"
            alt="Elegant wedding celebration"
            fill priority quality={75}
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0" style={{ background: "rgba(6,12,30,0.85)" }} />

        <div className="relative z-10 text-center max-w-3xl mx-auto px-6 py-28">
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="h-px w-10" style={{ background: "rgba(212,175,55,0.22)" }} />
            <span className="text-xs tracking-[0.45em] font-light" style={{ color: "rgba(212,175,55,0.45)" }}>
              ABOUT ELBOLD EVENTS
            </span>
            <div className="h-px w-10" style={{ background: "rgba(212,175,55,0.22)" }} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight leading-[1.1] text-white mb-6">
            We exist because trust in
            <br />
            the event industry was
            <br />
            <span style={{ color: "#D4AF37" }}>broken. We are fixing it.</span>
          </h1>
          <p className="text-base font-light leading-relaxed max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
            ELBOLD was founded in the United Kingdom to solve a specific, documented problem:
            event hosts could not tell which vendors were genuine professionals and which were not.
          </p>
        </div>
      </section>

      {/* ── FOUNDER STORY ────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <p className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase" style={{ color: "#C9A84C" }}>
              Why ELBOLD Exists
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 tracking-tight mb-8">
              The problem we set out to solve.
            </h2>
          </div>

          <div className="space-y-6 text-gray-600 font-light leading-[1.85] text-base">
            <p>
              Planning a significant event in the UK — a wedding, a milestone birthday, a cultural celebration —
              involves trusting a group of people you have likely never met with one of the most important days of your life.
              You are trusting that a DJ you found through Instagram is who they say they are.
              You are trusting that a decorator whose Facebook page looks beautiful will show up prepared.
              You are trusting that a caterer&apos;s five-star reviews are real.
            </p>
            <p>
              The reality, experienced by thousands of UK event hosts every year, is that this trust is frequently misplaced.
              Vendors cancel without notice. Photographers deliver work that bears no resemblance to their portfolio.
              Deposits disappear. Disputes go unresolved. And because there is no central, accountable body verifying
              who these professionals are, the same thing happens to someone else the following weekend.
            </p>
            <p>
              ELBOLD was founded to change this. Not with a promise of perfection — no marketplace can guarantee that.
              But with a genuine system of accountability: vendors reviewed before they appear, payments held by Stripe
              until events complete, reviews tied to confirmed bookings only, and a published set of standards that
              every vendor agrees to before joining the platform.
            </p>
            <p>
              We are a small team. We are growing carefully. We are not trying to be the biggest event marketplace
              in the UK. We are trying to be the one that event hosts can genuinely trust — and that vendors are proud to be part of.
            </p>
          </div>
        </div>
      </section>

      {/* ── MISSION AND VISION ───────────────────────────────────────── */}
      <section style={{ background: "#f8f7f5" }} className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                label: "Mission",
                text: "Give every event host in the United Kingdom access to verified, accountable event professionals — and give every professional a platform that rewards quality.",
              },
              {
                label: "Vision",
                text: "Become the UK's most trusted name in event services — the platform that customers recommend because it has never let them down.",
              },
              {
                label: "Method",
                text: "Build slowly. Verify individually. Publish our standards. Keep our commitments. Grow only as fast as our trust system can scale without compromise.",
              },
            ].map(({ label, text }) => (
              <div key={label} className="bg-white rounded-2xl p-8 border border-gray-100">
                <p className="text-xs tracking-[0.35em] font-semibold uppercase mb-4" style={{ color: "#C9A84C" }}>
                  {label}
                </p>
                <p className="text-gray-700 font-light leading-relaxed text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.35em] font-semibold mb-4 uppercase" style={{ color: "#C9A84C" }}>
              What We Believe
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">
              Five values. All of them load-bearing.
            </h2>
          </div>

          <div className="space-y-5">
            {VALUES.map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                className="flex gap-6 rounded-2xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(11,31,77,0.06)" }}
                >
                  <Icon size={17} style={{ color: "#0B1F4D" }} />
                </div>
                <div>
                  <div className="text-xs text-gray-300 font-light mb-2 tabular-nums">0{i + 1}</div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm leading-snug">{title}</h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE ELBOLD STANDARD ──────────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: "#0B1F4D" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs tracking-[0.35em] font-semibold mb-5 uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>
                The ELBOLD Standard
              </p>
              <h2 className="text-3xl font-light tracking-tight mb-6" style={{ color: "rgba(255,255,255,0.92)" }}>
                What every vendor agrees to before joining.
              </h2>
              <p className="text-sm font-light leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.38)" }}>
                Our Vendor Standards are not aspirational. They are the minimum requirements for joining
                the platform — and we enforce them actively, not just at onboarding.
              </p>
              <div className="space-y-4">
                {[
                  "Accurate portfolio — only real, recent, personal work",
                  "Honest pricing — no undisclosed fees after booking",
                  "Reliable communication — response within 24 hours",
                  "Professional conduct — at the event and through the platform",
                  "Accountability — agree to our dispute resolution process",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={14} style={{ color: "#D4AF37", flexShrink: 0, marginTop: 2 }} />
                    <span className="text-sm font-light" style={{ color: "rgba(255,255,255,0.55)" }}>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/vendor-standards" className="text-sm font-semibold flex items-center gap-2" style={{ color: "rgba(212,175,55,0.7)" }}>
                  Read the full Vendor Standards <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              {vendorCount && vendorCount > 0 ? (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,175,55,0.07)" }}
                >
                  <div className="text-4xl font-light mb-2" style={{ color: "#D4AF37" }}>{vendorCount}+</div>
                  <div className="text-sm font-light" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Vendors individually reviewed and approved
                  </div>
                </div>
              ) : null}
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,175,55,0.07)" }}
              >
                <div className="text-4xl font-light mb-2" style={{ color: "#D4AF37" }}>100%</div>
                <div className="text-sm font-light" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Of vendors reviewed by a real person before approval
                </div>
              </div>
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,175,55,0.07)" }}
              >
                <div className="text-4xl font-light mb-2" style={{ color: "#D4AF37" }}>0</div>
                <div className="text-sm font-light" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Reviews that are not tied to a confirmed, completed booking
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST PROMISE ────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.35em] font-semibold mb-5 uppercase" style={{ color: "#C9A84C" }}>
            Our Commitment
          </p>
          <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-6">
            What we promise every customer.
          </h2>
          <p className="text-gray-500 font-light text-sm leading-relaxed mb-10 max-w-xl mx-auto">
            These are not aspirational. They are specific, checkable commitments that we make to every customer
            who uses ELBOLD — and that we hold ourselves accountable to publicly.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 text-left mb-10">
            {[
              { title: "Every vendor reviewed before listing", desc: "No vendor appears on ELBOLD without a manual review of their application, portfolio, and identity." },
              { title: "Deposits held by Stripe until after your event", desc: "Your 30% deposit is not released to the vendor until your event has taken place and you have not raised a dispute." },
              { title: "Reviews from real bookings only", desc: "Reviews cannot be left by anyone who has not made a confirmed booking through the platform." },
              { title: "Full refund if vendor cancels", desc: "If a vendor cancels your confirmed booking, you receive your full deposit back. No exceptions. No delays." },
            ].map(({ title, desc }) => (
              <div key={title} className="rounded-xl p-6 border border-gray-100 bg-gray-50">
                <CheckCircle2 size={14} className="mb-3" style={{ color: "#0B1F4D" }} />
                <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <Link href="/our-commitments" className="btn-luxury-dark inline-flex text-sm px-8">
            Read All Our Commitments <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── NAVIGATION ───────────────────────────────────────────────── */}
      <section style={{ background: "#f8f7f5" }} className="py-16 px-4 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-[0.3em] font-semibold uppercase mb-8 text-center" style={{ color: "#C9A84C" }}>
            Learn More
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "How We Verify Vendors", href: "/how-we-verify", desc: "Our review process, verification levels, and quality standards." },
              { label: "Vendor Standards", href: "/vendor-standards", desc: "What we expect from every vendor, and what happens when standards fall." },
              { label: "Our Commitments", href: "/our-commitments", desc: "Specific, checkable promises we make to every customer." },
              { label: "Trust Hub", href: "/trust", desc: "The complete ELBOLD trust system in one place." },
            ].map(({ label, href, desc }) => (
              <Link
                key={label}
                href={href}
                className="rounded-xl p-5 bg-white border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <h3 className="font-semibold text-gray-900 text-sm mb-1.5 group-hover:text-gray-700">{label}</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">{desc}</p>
                <ArrowRight size={11} className="mt-3" style={{ color: "#C9A84C" }} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
