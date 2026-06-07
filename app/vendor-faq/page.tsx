import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { ChevronDown, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Vendor FAQ | How Bookings, Payments and Verification Work | ELBOLD Events",
  description:
    "Everything you need to know about how ELBOLD works for event professionals. How bookings are handled, how and when you get paid, what verification involves, and what happens if a customer cancels.",
};

const SECTIONS = [
  {
    id: "bookings",
    title: "How bookings work",
    questions: [
      {
        q: "How do customers contact me?",
        a: "Customers browse the marketplace, view your profile, and click to send you a quote request. This is not a phone call or a direct message. It is a structured request that includes their event type, date, location, guest count and budget. You respond with your price and availability. If they accept, a booking is created.",
      },
      {
        q: "What information do I get when a quote comes in?",
        a: "You receive a notification by email and on your dashboard. The quote request includes the customer name, event type, event date, location, approximate guest count, their budget range, and any specific requirements they have noted. You have 7 days to respond before the quote expires.",
      },
      {
        q: "What does a confirmed booking mean?",
        a: "A booking is confirmed once the customer has accepted your quote and paid the deposit. At that point, the event date and your involvement are agreed in writing on the platform. The customer cannot request a refund simply because they changed their mind.",
      },
      {
        q: "Can I decline a booking request?",
        a: "Yes. You are not obligated to accept every enquiry. If you are unavailable for the date, the event is outside your service area, or the budget does not match your pricing, you can decline. Respond promptly regardless so the customer can find someone else.",
      },
      {
        q: "What if I am already booked for that date?",
        a: "Decline the enquiry and let the customer know. We encourage all vendors to set their availability calendar to minimise this, but we understand it is not always current. If you consistently receive enquiries for dates you cannot fulfil, updating your calendar will save everyone time.",
      },
      {
        q: "How do I set my availability?",
        a: "You can mark blocked dates in your vendor dashboard under the Availability section. Customers can see your available dates before sending a quote request. This is optional but it improves the quality of enquiries you receive.",
      },
    ],
  },
  {
    id: "payments",
    title: "How payments work",
    questions: [
      {
        q: "How much do I keep from each booking?",
        a: "You keep 90% of every booking. ELBOLD earns a 10% platform fee on completed bookings. There are no listing fees, no monthly subscriptions required to receive enquiries, and no additional charges for verified badge status.",
      },
      {
        q: "How does the customer pay?",
        a: "All payments are handled through Stripe, one of the world's most trusted payment platforms. The customer pays a deposit (typically 30% of the total) when they confirm a booking. The remaining balance is collected closer to or after the event. ELBOLD holds the payment until the booking is marked as completed, then releases your 90% share directly to your account.",
      },
      {
        q: "When do I actually receive the money?",
        a: "Payment is released to you after the event is marked as completed. The timeline for the funds to appear in your bank account depends on your bank, but it is typically within 2 to 5 business days after we initiate the transfer.",
      },
      {
        q: "Do I need to send the customer an invoice?",
        a: "No. ELBOLD generates the payment record and confirms the transaction on both sides. You do not need to raise invoices or chase payment. All of that is handled by the platform.",
      },
      {
        q: "What if the customer does not pay the remaining balance?",
        a: "If the customer does not pay the final balance on time, ELBOLD will follow up on your behalf. If the balance is not settled, the dispute resolution process is initiated. You will not lose money that is owed to you without us being involved.",
      },
      {
        q: "Are there any other fees?",
        a: "There are no hidden fees. The only cost to you is the 10% platform fee on completed bookings. Premium subscription plans for enhanced visibility and features are available separately and are entirely optional.",
      },
    ],
  },
  {
    id: "verification",
    title: "How verification works",
    questions: [
      {
        q: "Why does ELBOLD require verification?",
        a: "Customers booking event professionals are often planning some of the most important days of their lives. Verification is how we prove to them that the vendors on ELBOLD are real, legitimate, and who they say they are. A verified vendor profile performs better in search and receives higher conversion from enquiries.",
      },
      {
        q: "What are the verification levels?",
        a: "There are four levels. Level 1 is Email Confirmed, which happens automatically when you register. Level 2 is ID Verified, which requires a government-issued photo ID. Level 3 is Address Verified, which requires proof of your address or business address. Level 4 is Business Verified, which is for registered companies with supporting documentation.",
      },
      {
        q: "What documents do I need to submit?",
        a: "For ID Verified status, you need to upload a clear photo of a government-issued ID such as a passport, driving licence, or national identity card. For Address Verified, a recent utility bill, bank statement, or council tax letter will work. All documents must be clear, unedited, and show your name and address.",
      },
      {
        q: "How long does verification take?",
        a: "Our team reviews submitted documents within 24 hours on business days. You will receive an email notification when your verification status changes. If anything is unclear, we will ask you to resubmit with a clearer photo rather than simply rejecting.",
      },
      {
        q: "Is verification required to receive enquiries?",
        a: "You can receive enquiries without full verification. However, vendors with ID Verified status or above display a verification badge on their profile and in every search result. Customers actively prefer verified vendors. We strongly recommend completing verification as early as possible.",
      },
      {
        q: "What if my documents are rejected?",
        a: "If a document is rejected, you will receive an explanation and guidance on what to resubmit. Common reasons include a blurry image, an expired document, or a document that does not clearly show the required details. Rejection is not permanent. You can resubmit at any time.",
      },
      {
        q: "Is my personal information safe?",
        a: "Yes. Documents submitted for verification are handled securely and are only used for the purpose of verifying your identity. We do not share your documents with third parties. Our full data handling policy is published at elbold.com/privacy.",
      },
    ],
  },
  {
    id: "cancellations",
    title: "What happens if customers cancel",
    questions: [
      {
        q: "Can a customer cancel after the booking is confirmed?",
        a: "Yes, but the terms are designed to protect you. The customer paid a deposit when they confirmed. If they cancel, the deposit may not be refunded depending on how close to the event the cancellation is. The specific terms are set out in our cancellation policy and are communicated to customers before they book.",
      },
      {
        q: "Do I keep the deposit if a customer cancels?",
        a: "In most cases, yes. If the customer cancels and the cancellation is not due to fault on your part, the deposit is not returned to them. The exact outcome depends on the notice period and any special circumstances. ELBOLD will review the situation before any funds are moved.",
      },
      {
        q: "What if the customer cancels with very little notice?",
        a: "Late cancellations are treated seriously. The closer to the event, the stronger your protection. If a customer cancels within 7 days of the event, they are typically not entitled to any refund of funds already collected.",
      },
      {
        q: "What if I need to cancel as the vendor?",
        a: "Vendor-initiated cancellations are taken very seriously and investigated through our dispute process. If you cancel a confirmed booking, the customer is entitled to a full refund of any payment made, and your profile will receive a cancellation mark that is visible to future customers. If you have a genuine emergency, contact us immediately. We will work with you to find a resolution.",
      },
      {
        q: "What if there is a disagreement about the quality of service delivered?",
        a: "If a customer raises a complaint about the service you delivered, ELBOLD will initiate a dispute process. Both sides provide their account of events, and we make a decision based on the evidence. We aim to be fair to both parties. Vendors who consistently deliver on what they promise have nothing to worry about.",
      },
      {
        q: "Is there anything I can do to protect myself from unfair cancellations?",
        a: "Yes. Be specific in your packages about exactly what is included and what is not. Respond to all communications through the ELBOLD platform so there is a written record. Confirm details with the customer in advance. The more clearly expectations are set, the less room there is for disputes.",
      },
    ],
  },
];

async function getProfile() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    return data;
  } catch {
    return null;
  }
}

export default async function VendorFAQPage() {
  const profile = await getProfile();

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={profile} />

      {/* Header */}
      <section className="pt-16 pb-16 px-4" style={{ background: "#0D1B3E" }}>
        <div className="max-w-3xl mx-auto text-center pt-16">
          <p className="text-xs tracking-[0.3em] font-semibold mb-5 uppercase" style={{ color: "rgba(201,168,76,0.6)" }}>
            Vendor FAQ
          </p>
          <h1 className="text-4xl font-light tracking-tight mb-5" style={{ color: "rgba(255,255,255,0.92)" }}>
            How ELBOLD works for event professionals.
          </h1>
          <p className="font-light leading-relaxed text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.42)" }}>
            Straight answers to the questions we get asked most. If something is not covered here, contact us at support@elbold.com.
          </p>
        </div>
      </section>

      {/* Navigation anchors */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-6 overflow-x-auto py-3 text-sm font-light">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap pb-1 border-b border-transparent hover:border-gray-300"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ content */}
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-16">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="text-xl font-semibold text-gray-900 mb-8 pb-4 border-b border-gray-100">
              {section.title}
            </h2>
            <div className="space-y-6">
              {section.questions.map((item) => (
                <details key={item.q} className="group">
                  <summary className="flex items-start justify-between gap-4 cursor-pointer list-none py-4 border-b border-gray-50 group-open:border-transparent">
                    <span className="text-sm font-semibold text-gray-900 leading-snug">{item.q}</span>
                    <ChevronDown
                      size={16}
                      className="text-gray-400 flex-shrink-0 mt-0.5 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <div className="pb-4 pt-2">
                    <p className="text-sm text-gray-600 font-light leading-relaxed">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <section className="py-16 px-4" style={{ background: "#f8f7f5" }}>
        <div className="max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-7">
              <h3 className="font-semibold text-gray-900 mb-2">Ready to apply?</h3>
              <p className="text-sm text-gray-500 font-light mb-5 leading-relaxed">
                Joining as a Founding Vendor takes under 5 minutes. We review within 24 hours and contact you with the outcome.
              </p>
              <Link href="/vendor/apply" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-5 py-2.5 rounded-xl" style={{ background: "#0D1B3E" }}>
                Apply Now <ArrowRight size={13} />
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-7">
              <h3 className="font-semibold text-gray-900 mb-2">Still have questions?</h3>
              <p className="text-sm text-gray-500 font-light mb-5 leading-relaxed">
                We are a small team and we read every email. If something was not answered here, reach out directly.
              </p>
              <a href="mailto:support@elbold.com" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 border border-gray-200 px-5 py-2.5 rounded-xl hover:border-gray-400 transition-colors">
                Email Us <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
