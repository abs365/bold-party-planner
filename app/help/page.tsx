import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Help Centre | ELBOLD Events",
  description: "Find answers to common questions about booking vendors, managing events, payments, and getting verified on ELBOLD Events.",
};

export const dynamic = "force-dynamic";

const CUSTOMER_FAQS = [
  {
    q: "How do I book a vendor?",
    a: "Browse vendors, visit their profile, and click 'Request a Quote'. You can include your event date, guest count, budget, and any specific requirements. The vendor will respond with a price — you then choose to accept or decline.",
  },
  {
    q: "Is my payment secure?",
    a: "All payments are processed by Stripe, one of the world's most trusted payment processors. ELBOLD holds the payment in trust until your event is completed — protecting both you and the vendor.",
  },
  {
    q: "What is Booking Protection?",
    a: "If a vendor cancels a confirmed booking for any reason, you receive a 100% refund of all amounts paid. We also help you find a replacement vendor. Full details are on our Booking Protection page.",
  },
  {
    q: "Can I get a refund?",
    a: "Refund eligibility depends on when you cancel. Cancelling more than 30 days before the event: full refund minus a 5% processing fee. 15–30 days: 50% refund. 8–14 days: 25% refund. 7 days or fewer: no refund. See our Refund Policy page for full details.",
  },
  {
    q: "How do I cancel a quote request?",
    a: "Visit your Quotes page, open the quote request, and select 'Withdraw'. You can withdraw any pending request before the vendor has responded.",
  },
  {
    q: "What does 'ID Verified' mean?",
    a: "ID Verified vendors have submitted a government-issued ID that has been checked by the ELBOLD team. This means we know who they are. Higher levels (Address Verified, Business Verified) require additional document checks.",
  },
];

const VENDOR_FAQS = [
  {
    q: "How do I join ELBOLD?",
    a: "Click 'Join as a Vendor' and complete the short application. Our team reviews every application within 24–48 hours. Once approved, your profile goes live and you can start receiving enquiries.",
  },
  {
    q: "Is there a cost to join?",
    a: "No. Listing your services on ELBOLD is free. We take a 10% platform fee only when a booking is completed. Optional subscription plans (Pro, Featured) provide enhanced visibility for a monthly fee.",
  },
  {
    q: "How do I get paid?",
    a: "Add your UK bank account details on your Revenue & Payouts page. ELBOLD processes payouts manually within 7 working days of a booking being marked complete. You receive 90% of the agreed booking value.",
  },
  {
    q: "How does verification improve my ranking?",
    a: "Verified vendors (ID Verified and above) rank higher in marketplace search, appear in verified-only filters, and display trust badges on their profile. Customers trust verified vendors significantly more.",
  },
  {
    q: "What happens if a customer disputes a booking?",
    a: "Contact support@elbold.com immediately. We review both sides fairly. Your audit trail, messages, and booking record are all available to us during the review.",
  },
  {
    q: "Can I set my own prices?",
    a: "Absolutely. ELBOLD never sets or influences your pricing. You submit your own quote for each request. Customers see your price and decide. We do not share quotes between competing vendors.",
  },
];

const SECTIONS = [
  { title: "For Customers", faqs: CUSTOMER_FAQS },
  { title: "For Vendors", faqs: VENDOR_FAQS },
];

export default async function HelpPage() {
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
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-xs tracking-[0.3em] font-semibold mb-5 uppercase" style={{ color: "rgba(201,168,76,0.6)" }}>
            Help Centre
          </p>
          <h1 className="text-4xl font-light tracking-tight mb-4" style={{ color: "rgba(255,255,255,0.92)" }}>
            How can we help?
          </h1>
          <p className="text-base font-light leading-relaxed max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Common questions about bookings, payments, verification, and getting the most from ELBOLD.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-16">
        {SECTIONS.map(({ title, faqs }) => (
          <section key={title}>
            <h2 className="text-xl font-light text-gray-900 tracking-tight mb-8 pb-3 border-b border-gray-100">
              {title}
            </h2>
            <div className="space-y-6">
              {faqs.map(({ q, a }) => (
                <div key={q}>
                  <h3 className="font-semibold text-gray-900 text-base mb-2">{q}</h3>
                  <p className="text-gray-500 font-light leading-relaxed text-sm">{a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Contact */}
        <section className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center">
          <h2 className="text-lg font-light text-gray-900 mb-2">Still need help?</h2>
          <p className="text-gray-400 text-sm font-light mb-6">Our support team responds within 24 hours on working days.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:support@elbold.com" className="btn-luxury-dark text-sm py-3 px-6">
              Email Support
            </a>
            <Link href="/how-it-works" className="btn-secondary-light text-sm py-3 px-6">
              How It Works
            </Link>
          </div>
          <p className="text-xs text-gray-300 mt-4">support@elbold.com · disputes@elbold.com · safety@elbold.com</p>
        </section>
      </div>

      <Footer />
    </div>
  );
}
