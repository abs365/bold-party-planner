import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Calendar, CreditCard, RefreshCw, AlertTriangle,
  Settings, Shield, Mail, Clock, ChevronRight, ArrowRight,
  MessageCircle, Search,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Support Centre | ELBOLD Events",
  description:
    "Get help with bookings, payments, refunds, vendor issues, and account questions. ELBOLD support responds within 1 working day.",
};

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    icon: Calendar,
    title: "Booking Questions",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.15)",
    questions: [
      {
        q: "How do I request a quote from a vendor?",
        a: "Visit any vendor's profile and click 'Request a Quote'. Fill in your event details — date, location, guest count, and any requirements. The vendor will respond with a price within 24 hours.",
      },
      {
        q: "My quote request has had no response. What should I do?",
        a: "Vendors are expected to respond within 48 hours. If you haven't heard back, you can withdraw the request and send it to another vendor. Contact support@elbold.com if you need help finding an alternative.",
      },
      {
        q: "Can I book more than one vendor for the same event?",
        a: "Yes. You can send quote requests to multiple vendors across different categories (e.g. a DJ and a photographer) for the same event.",
      },
      {
        q: "How do I confirm a booking after accepting a quote?",
        a: "After accepting a vendor's quote, you'll be taken to the payment screen to pay the deposit. Once the deposit is paid, your booking is confirmed and the vendor is notified.",
      },
      {
        q: "Can I change my event details after booking?",
        a: "Contact the vendor directly through your booking page to discuss changes. Significant changes (date, location, guest count) may affect pricing and require the vendor's agreement.",
      },
    ],
  },
  {
    icon: CreditCard,
    title: "Payment Questions",
    color: "#10B981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.15)",
    questions: [
      {
        q: "Is my payment secure?",
        a: "All payments are processed by Stripe, one of the world's most trusted payment processors. Your card details are never stored by ELBOLD. Stripe is PCI-DSS Level 1 certified — the highest security standard available.",
      },
      {
        q: "How much deposit do I pay?",
        a: "A 30% deposit is required to confirm any booking. The deposit is held securely by Stripe and released to the vendor only after your event is completed.",
      },
      {
        q: "When is the remaining balance due?",
        a: "The remaining balance is agreed directly with the vendor as part of your booking terms. Many vendors accept the balance on the day of the event. Check your booking details for the specific terms.",
      },
      {
        q: "Why was my payment declined?",
        a: "Common reasons include: insufficient funds, card expiry, or a bank security block on online transactions. Try a different card, or contact your bank. Your booking will remain on hold for 24 hours while you retry.",
      },
      {
        q: "I paid but haven't received a confirmation email.",
        a: "Check your spam folder first. If you genuinely haven't received a confirmation within 30 minutes of payment, contact support@elbold.com with your booking reference.",
      },
    ],
  },
  {
    icon: RefreshCw,
    title: "Refund Questions",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.15)",
    questions: [
      {
        q: "What is the refund policy?",
        a: "Refunds depend on how far in advance you cancel: 30+ days before the event: full refund minus a 5% processing fee. 15–30 days: 50% refund. 8–14 days: 25% refund. 7 days or fewer: no refund. Vendor cancellations always result in a 100% refund regardless of timing.",
      },
      {
        q: "How do I request a refund?",
        a: "Email disputes@elbold.com with your booking reference and the reason for your request. We aim to respond within 1 working day. Approved refunds are processed within 5–10 business days.",
      },
      {
        q: "The vendor cancelled. When will I receive my refund?",
        a: "Vendor cancellations entitle you to a 100% refund. Once we confirm the cancellation, your refund is processed within 5–10 business days back to your original payment card.",
      },
      {
        q: "How long do refunds take?",
        a: "Once approved, refunds take 5–10 business days to process. After that, your bank may take an additional 3–5 days to credit the funds. Total expected time: up to 15 business days.",
      },
    ],
  },
  {
    icon: AlertTriangle,
    title: "Vendor Issues",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.15)",
    questions: [
      {
        q: "The vendor did not show up for my event.",
        a: "Email urgent@elbold.com immediately. We monitor this address as a priority. You are entitled to a full refund of all amounts paid. Include your booking reference and any evidence (messages, photos) when you contact us.",
      },
      {
        q: "The service was not as described. What can I do?",
        a: "Raise a dispute within 48 hours of your event by emailing disputes@elbold.com. Include your booking reference, a clear description of what was agreed vs delivered, and any supporting evidence (photos, messages, contracts). We will review both sides and reach a decision within 5 business days.",
      },
      {
        q: "I want to leave a review but can't.",
        a: "Reviews can only be left for completed bookings. Your booking must be marked as completed before the review option appears. If your event has passed and you're unable to review, contact support@elbold.com.",
      },
      {
        q: "I have a concern about a vendor's behaviour.",
        a: "Email safety@elbold.com. We take professional conduct seriously and investigate all reports. Vendors who breach our standards may be suspended or removed from the platform.",
      },
    ],
  },
  {
    icon: Settings,
    title: "Technical Issues",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.15)",
    questions: [
      {
        q: "I can't log in to my account.",
        a: "Try resetting your password using the 'Forgot password' link on the login page. If you're still unable to access your account, email support@elbold.com with the email address associated with your account.",
      },
      {
        q: "Something on the platform isn't working.",
        a: "Email support@elbold.com with a description of the issue, what you were trying to do, and which browser or device you're using. Screenshots are helpful. We'll investigate and respond within 1 working day.",
      },
      {
        q: "I'm not receiving emails from ELBOLD.",
        a: "Check your spam/junk folder and add noreply@elbold.com to your safe senders list. If you use Gmail, check the Promotions or Updates tabs. If emails are still not arriving, contact support@elbold.com.",
      },
    ],
  },
  {
    icon: Shield,
    title: "Safety & Trust",
    color: "#C9A84C",
    bg: "rgba(201,168,76,0.08)",
    border: "rgba(201,168,76,0.15)",
    questions: [
      {
        q: "How do I know a vendor is genuine?",
        a: "Every vendor on ELBOLD has been manually reviewed by our team before being listed. We check business identity, portfolio quality, and service legitimacy. Look for the 'ELBOLD Verified' badge on vendor profiles — click it to learn what the verification level means.",
      },
      {
        q: "A vendor asked me to pay outside of ELBOLD. What should I do?",
        a: "Do not pay outside the platform. ELBOLD's payment protection only covers payments made through the platform. If a vendor asks you to pay by bank transfer, PayPal, or cash, report it to safety@elbold.com. This is a breach of vendor terms.",
      },
      {
        q: "How are reviews on ELBOLD different from other platforms?",
        a: "Every review on ELBOLD comes from a real customer who completed a confirmed booking through the platform. We do not accept reviews from unverified users. This means you can trust that ratings reflect real experiences — not friends, family, or incentivised posts.",
      },
      {
        q: "What happens if a vendor is reported?",
        a: "All reports are investigated by our team. Depending on the severity, outcomes include: a formal warning, temporary suspension, permanent removal, or referral to relevant authorities. We take platform safety seriously.",
      },
    ],
  },
];

const RESPONSE_TIMES = [
  { channel: "support@elbold.com", sla: "Within 1 working day", use: "General booking, payment, and account questions" },
  { channel: "disputes@elbold.com", sla: "Within 1 working day", use: "Refund requests and formal disputes" },
  { channel: "safety@elbold.com", sla: "Within 1 working day", use: "Vendor conduct concerns and safety reports" },
  { channel: "urgent@elbold.com", sla: "Priority — monitored daily", use: "Vendor no-shows and day-of emergencies" },
];

export default async function SupportPage() {
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

      {/* Hero */}
      <div className="pt-16" style={{ background: "#0D1B3E" }}>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-semibold tracking-widest uppercase"
            style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)", color: "rgba(212,175,55,0.85)" }}
          >
            <MessageCircle size={12} />
            Support Centre
          </div>
          <h1
            className="text-4xl md:text-5xl font-light tracking-tight mb-5"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            How can we help?
          </h1>
          <p className="text-base font-light leading-relaxed max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Find answers to common questions about bookings, payments, refunds, and vendors.
            Our team responds to all emails within 1 working day.
          </p>

          {/* Quick links */}
          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {SECTIONS.map((s) => (
              <a
                key={s.title}
                href={`#${s.title.toLowerCase().replace(/ /g, "-")}`}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20 space-y-16">

        {/* Response time card */}
        <div className="rounded-2xl overflow-hidden border border-gray-100">
          <div className="px-6 py-4 flex items-center gap-2" style={{ background: "#0D1B3E" }}>
            <Clock size={14} style={{ color: "#C9A84C" }} />
            <h2 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
              Contact channels &amp; response times
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {RESPONSE_TIMES.map(({ channel, sla, use }) => (
              <div key={channel} className="grid sm:grid-cols-3 gap-2 px-6 py-4 items-center">
                <a
                  href={`mailto:${channel}`}
                  className="text-sm font-semibold text-gray-900 hover:underline"
                >
                  {channel}
                </a>
                <span className="text-xs font-medium" style={{ color: "#059669" }}>{sla}</span>
                <span className="text-xs text-gray-500">{use}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ sections */}
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section
              key={section.title}
              id={section.title.toLowerCase().replace(/ /g, "-")}
            >
              <div className="flex items-center gap-3 mb-8">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: section.bg, border: `1px solid ${section.border}` }}
                >
                  <Icon size={18} style={{ color: section.color }} />
                </div>
                <h2 className="text-xl font-light text-gray-900 tracking-tight">{section.title}</h2>
              </div>

              <div className="space-y-3">
                {section.questions.map(({ q, a }) => (
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
            </section>
          );
        })}

        {/* Emergency escalation */}
        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} style={{ color: "#EF4444" }} />
            <h2 className="text-base font-semibold text-gray-900">Day-of emergency?</h2>
          </div>
          <p className="text-sm text-gray-500 font-light leading-relaxed mb-4">
            If your vendor has not arrived and your event is today, email us immediately.
            We monitor our urgent address and will respond as a priority.
          </p>
          <a
            href="mailto:urgent@elbold.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "#EF4444", color: "#ffffff" }}
          >
            urgent@elbold.com
            <ArrowRight size={14} />
          </a>
        </div>

        {/* Contact support */}
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}
        >
          <Mail size={24} className="mx-auto mb-4" style={{ color: "#C9A84C" }} />
          <h2 className="text-xl font-light text-gray-900 mb-3">Still need help?</h2>
          <p className="text-sm text-gray-500 font-light mb-6 max-w-md mx-auto">
            Our team responds to all support emails within 1 working day.
            Please include your booking reference where relevant.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="mailto:support@elbold.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ background: "#0D1B3E", color: "#D4AF37" }}
            >
              support@elbold.com
              <ArrowRight size={14} />
            </a>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View FAQ
              <ChevronRight size={14} />
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-5">
            For vendor applications: <a href="mailto:support@elbold.com" className="underline">support@elbold.com</a>{" "}
            &nbsp;&middot;&nbsp;
            For disputes: <a href="mailto:disputes@elbold.com" className="underline">disputes@elbold.com</a>
          </p>
        </div>

      </div>

      <Footer />
    </div>
  );
}
