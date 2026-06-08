import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle2, XCircle, ArrowRight, AlertCircle, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Commitments | What ELBOLD Promises Every Customer",
  description:
    "A transparent statement of what ELBOLD commits to on every booking, what we do not guarantee, and how to hold us accountable. No vague promises. Specific, checkable commitments only.",
  openGraph: {
    title: "ELBOLD: Our Commitments",
    description: "What we promise. What we do not guarantee. How to hold us accountable.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
};

export const dynamic = "force-dynamic";

const COMMITMENTS = [
  {
    id: "C-01",
    title: "Every vendor is reviewed before appearing on the platform.",
    detail: "No vendor is listed through automated approval. Every application is assessed by a member of the ELBOLD team against our published Vendor Standards: portfolio quality, pricing accuracy, and identity confirmation. We reject applicants who do not meet the standard.",
    howToVerify: "If you encounter a vendor whose listing appears to misrepresent their work or services, report it to quality@elbold.com. We will review within 2 business days.",
  },
  {
    id: "C-02",
    title: "Your deposit is secured until after your event.",
    detail: "The 30% deposit you pay on booking is processed securely through Stripe and managed by ELBOLD according to the Booking Protection and Refund Policy. It is not released to the vendor until your event has completed and no dispute has been raised.",
    howToVerify: "Your Stripe payment confirmation email will confirm the amount charged and the payment processor. If you have questions about payment handling, contact support@elbold.com.",
  },
  {
    id: "C-03",
    title: "If a vendor cancels your confirmed booking, you receive a full refund.",
    detail: "A confirmed booking is one where a deposit has been paid through ELBOLD. If the vendor cancels after this point, the deposit is returned in full. There is no deduction for platform fees in the event of a vendor cancellation.",
    howToVerify: "If a vendor has cancelled a confirmed booking and your refund has not been processed within 5 business days, contact disputes@elbold.com.",
  },
  {
    id: "C-04",
    title: "Every review is from a customer who booked through the platform.",
    detail: "Reviews can only be submitted by users who have a completed booking record on ELBOLD for the relevant vendor. Anonymous reviews are not possible. Reviews submitted outside the booking system are not accepted. We do not allow vendors to solicit or incentivise reviews.",
    howToVerify: "If you believe a review is fabricated, contact quality@elbold.com with the review URL and your reason for concern.",
  },
  {
    id: "C-05",
    title: "Our Vendor Standards are published and enforced.",
    detail: "The criteria we use to approve, warn, suspend, and remove vendors are published at /vendor-standards. We apply them consistently. When a vendor is suspended or removed, it is because they failed to meet these criteria, not because of personal or commercial considerations.",
    howToVerify: "Read the Vendor Standards at elbold.com/vendor-standards. If you believe a vendor on the platform should not be listed given those standards, contact quality@elbold.com.",
  },
  {
    id: "C-06",
    title: "Customer complaints are acknowledged within 2 business days.",
    detail: "All emails sent to support@elbold.com, disputes@elbold.com, and quality@elbold.com receive an acknowledgement within 2 business days. Resolution timelines vary by complexity, but you will always receive confirmation that your issue is being handled.",
    howToVerify: "If you have not received an acknowledgement within 2 business days of contacting us, forward your original email to support@elbold.com with the subject line RE: No Response.",
  },
];

const NON_COMMITMENTS = [
  {
    title: "We cannot guarantee the quality of your event experience.",
    detail: "We verify vendors before listing. We do not guarantee that your event will go exactly as planned. Event delivery is the vendor's responsibility. Our role is to ensure vendors are genuine, qualified, and accountable, not to supervise them.",
  },
  {
    title: "We cannot guarantee vendor availability on your date.",
    detail: "Vendor availability is managed by the vendor, not by ELBOLD. Enquiring through the platform does not reserve the vendor. A date is only held once a booking is confirmed and a deposit is paid.",
  },
  {
    title: "We cannot guarantee the accuracy of all vendor pricing at all times.",
    detail: "Vendors maintain their own pricing. While our standards require accurate pricing, prices may change between a customer visiting a profile and making an enquiry. Always confirm pricing directly with the vendor before booking.",
  },
  {
    title: "We do not guarantee outcomes in disputed bookings.",
    detail: "If a dispute is raised, ELBOLD will mediate and apply our dispute resolution policy. We cannot guarantee the outcome in every case. Where disputes involve matters of law, we may direct both parties to seek independent advice.",
  },
  {
    title: "We do not represent that approved vendors are licensed or insured.",
    detail: "We check portfolio quality, identity, and professional conduct. We do not currently verify professional licences, insurance coverage, or sector-specific certifications. Customers should ask vendors for evidence of relevant licences before booking where applicable (e.g., food hygiene for caterers, public liability insurance for any vendor working at your venue).",
  },
];

export default async function OurCommitmentsPage() {
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
            Transparency
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-5" style={{ color: "rgba(255,255,255,0.95)" }}>
            What we promise.
            <br />
            <span style={{ color: "#D4AF37" }}>And what we do not.</span>
          </h1>
          <p className="text-base font-light max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Most platforms promise everything. We publish exactly what we commit to, and we are honest
            about where our responsibility ends. This is the basis on which customers should decide
            whether to use ELBOLD.
          </p>
        </div>
      </div>

      {/* ── COMMITMENTS ──────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Part 1
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-3">
              What ELBOLD commits to.
            </h2>
            <p className="text-sm text-gray-500 font-light max-w-xl">
              These are specific, checkable commitments. Each one includes how to verify it and how to hold us accountable if we fall short.
            </p>
          </div>

          <div className="space-y-5">
            {COMMITMENTS.map(({ id, title, detail, howToVerify }) => (
              <div key={id} className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-start gap-5 p-7">
                  <CheckCircle2 size={18} style={{ color: "#0B1F4D", flexShrink: 0, marginTop: 2 }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold text-gray-300 tabular-nums">{id}</span>
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug">{title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 font-light leading-relaxed mb-4">{detail}</p>
                    <div
                      className="rounded-lg p-4"
                      style={{ background: "rgba(11,31,77,0.04)", border: "1px solid rgba(11,31,77,0.06)" }}
                    >
                      <p className="text-xs text-gray-500 font-light leading-relaxed">
                        <span className="font-semibold text-gray-700">How to verify this: </span>
                        {howToVerify}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE DON'T GUARANTEE ─────────────────────────────────── */}
      <section style={{ background: "#f8f7f5" }} className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <p className="text-xs tracking-[0.35em] font-semibold mb-3 uppercase" style={{ color: "#C9A84C" }}>
              Part 2
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-3">
              What ELBOLD does not guarantee.
            </h2>
            <p className="text-sm text-gray-500 font-light max-w-xl">
              Honest marketplaces publish their limitations. These are the areas where we cannot make
              the same commitments, and the reasons why.
            </p>
          </div>

          <div className="space-y-4">
            {NON_COMMITMENTS.map(({ title, detail }) => (
              <div key={title} className="flex gap-5 bg-white rounded-xl p-6 border border-gray-100">
                <XCircle size={16} style={{ color: "#aaa", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h3 className="font-semibold text-gray-700 text-sm mb-1.5">{title}</h3>
                  <p className="text-xs text-gray-500 font-light leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACCOUNTABILITY ───────────────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: "#0B1F4D" }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-xs tracking-[0.35em] font-semibold mb-5 uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>
                Holding Us Accountable
              </p>
              <h2 className="text-2xl font-light tracking-tight mb-5" style={{ color: "rgba(255,255,255,0.92)" }}>
                What to do if we fail to keep a commitment.
              </h2>
              <div className="space-y-4 text-sm font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                <p>
                  If you believe ELBOLD has failed to honour a specific commitment listed on this page,
                  contact us at{" "}
                  <a href="mailto:commitments@elbold.com" className="font-semibold" style={{ color: "#D4AF37" }}>
                    commitments@elbold.com
                  </a>{" "}
                  with the commitment reference (e.g. C-02), a description of what occurred, and any
                  relevant booking details.
                </p>
                <p>
                  We will investigate and provide a written response within 5 business days.
                  If the breach is confirmed, we will document the corrective action taken.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: "Support", href: "mailto:support@elbold.com", desc: "General questions and booking support" },
                { label: "Disputes",   href: "mailto:disputes@elbold.com",   desc: "Raise a dispute about a vendor or booking" },
                { label: "Commitments", href: "mailto:commitments@elbold.com", desc: "Report a breach of the commitments on this page" },
                { label: "Quality",    href: "mailto:quality@elbold.com",    desc: "Report a vendor listing concern or review fraud" },
              ].map(({ label, href, desc }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center justify-between rounded-xl px-5 py-4 transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,175,55,0.07)" }}
                >
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>{label}</div>
                    <div className="text-xs font-light" style={{ color: "rgba(255,255,255,0.28)" }}>{desc}</div>
                  </div>
                  <ArrowRight size={13} style={{ color: "rgba(212,175,55,0.4)" }} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER NOTE ──────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 py-8 px-4 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={13} className="text-gray-300 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 font-light leading-relaxed max-w-xl">
              These commitments were last reviewed in June 2026. ELBOLD will notify registered users
              of any material changes to this document with a minimum of 30 days notice.
              Reading these commitments does not constitute a legal contract.
            </p>
          </div>
          <div className="flex gap-4 flex-shrink-0">
            <Link href="/trust" className="text-xs text-gray-400 hover:text-gray-700 font-light transition-colors flex items-center gap-1">
              <Shield size={10} /> Trust Hub
            </Link>
            <Link href="/vendor-standards" className="text-xs text-gray-400 hover:text-gray-700 font-light transition-colors">
              Vendor Standards
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
