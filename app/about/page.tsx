import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle2, Shield, Star, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About ELBOLD",
  description: "ELBOLD is a UK event vendor marketplace connecting event hosts with trusted, verified professionals for weddings, birthdays, corporate events and more.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} lightBg />

      {/* Hero */}
      <div className="pt-16" style={{ background: "#0D1B3E" }}>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p
            className="text-xs tracking-[0.3em] font-semibold mb-5 uppercase"
            style={{ color: "rgba(201,168,76,0.6)" }}
          >
            About ELBOLD
          </p>
          <h1
            className="text-4xl md:text-5xl font-light tracking-tight mb-5"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            A marketplace built on trust.
          </h1>
          <p className="text-base font-light leading-relaxed max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            ELBOLD connects event hosts across the United Kingdom with verified, professional vendors —
            from DJs and photographers to caterers, decorators and event planners.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-20 space-y-16">

        {/* Why we exist */}
        <section>
          <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-5">Why ELBOLD exists</h2>
          <div className="space-y-4 text-gray-500 font-light text-base leading-relaxed">
            <p>
              Booking vendors for an event is harder than it should be. Finding someone reliable, agreeing
              on pricing, handling payments, and managing the communication — it&apos;s fragmented, slow, and
              frequently stressful.
            </p>
            <p>
              At the same time, talented event professionals spend too much time chasing enquiries,
              managing invoices, and building visibility with no centralised platform to support them.
            </p>
            <p>
              ELBOLD exists to fix both sides of that problem. A single, transparent marketplace where
              customers can find and book trusted vendors, and where vendors can grow their business
              without administrative friction.
            </p>
          </div>
        </section>

        {/* Our standards */}
        <section>
          <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-8">Our standards</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                icon: CheckCircle2,
                title: "Every vendor is reviewed",
                desc: "We manually review every vendor application before they are listed. Automated approvals do not exist on this platform.",
              },
              {
                icon: Shield,
                title: "Secure payments only",
                desc: "All booking payments are processed through Stripe. Deposits are held securely and released upon completion, with a dispute resolution process for edge cases.",
              },
              {
                icon: Star,
                title: "Verified reviews",
                desc: "Reviews are collected only from customers who completed a confirmed booking with the vendor. We do not allow anonymous or unverified reviews.",
              },
              {
                icon: Users,
                title: "No fake profiles",
                desc: "Every vendor profile must pass our review process. We actively remove listings that do not meet our quality standards.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="border border-gray-100 rounded-2xl p-6">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "#0D1B3E" }}
                >
                  <Icon size={16} style={{ color: "#C9A84C" }} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-2">{title}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How we make money */}
        <section>
          <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-5">How we make money</h2>
          <div className="space-y-4 text-gray-500 font-light text-base leading-relaxed">
            <p>
              ELBOLD is free to use for customers. Vendors can list their services, receive enquiries, and
              manage their profiles at no cost.
            </p>
            <p>
              We earn a 10% service fee on completed bookings, deducted automatically from the vendor
              payout. Customers pay the listed price — there are no booking fees added at checkout.
            </p>
            <p>
              Optional subscription plans are available for vendors who want enhanced visibility,
              analytics, or priority placement. These are never required to use the platform.
            </p>
          </div>
        </section>

        {/* Marketplace principles */}
        <section>
          <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-5">Marketplace principles</h2>
          <div className="space-y-3">
            {[
              "Vendor quality over vendor quantity — we would rather have fewer, better-reviewed vendors than a large unmoderated directory.",
              "Transparency in pricing — vendors set clear package prices. Hidden fees and post-booking surcharges are not permitted.",
              "Customer and vendor interests are aligned — ELBOLD only earns when bookings complete successfully.",
              "Disputes are handled fairly — our dispute resolution process considers both parties. Neither side is automatically favoured.",
              "Reviews reflect reality — we remove reviews that violate our guidelines, whether positive or negative.",
            ].map((principle) => (
              <div key={principle} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0 mt-2" />
                <p className="text-sm text-gray-500 font-light leading-relaxed">{principle}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pt-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse" className="btn-luxury-dark text-sm py-3">
              Browse Vendors
            </Link>
            <Link href="/founding-vendors" className="btn-secondary-light text-sm py-3">
              List Your Services
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
