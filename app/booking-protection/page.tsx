import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = {
  title: "Booking Protection | ELBOLD",
  description: "How ELBOLD protects your bookings and payments.",
};

export default function BookingProtection() {
  return (
    <LegalPage
      title="Booking Protection"
      subtitle="Every booking made through ELBOLD is protected. Here's exactly how."
      lastUpdated="May 2026"
      sections={[
        {
          title: "The ELBOLD Guarantee",
          content: [
            "Every booking made through ELBOLD comes with our platform guarantee. We protect your money, your event, and your experience.",
            "We stand behind every transaction processed through our platform. If something goes wrong, we are here to help make it right.",
          ],
        },
        {
          title: "Secure Payments",
          content: [
            "All payments are processed by Stripe, one of the world's most trusted payment processors, under PCI-DSS Level 1 compliance.",
            "Your card details are never stored on ELBOLD's servers. Stripe handles all sensitive payment data.",
            "Your deposit is held securely and only released to the vendor after your event is completed successfully.",
          ],
        },
        {
          title: "Verified Vendors",
          content: [
            "Every vendor on ELBOLD has been manually reviewed and approved by our team before listing their services.",
            "Verified vendors display a verified badge on their profile. We check identity, business legitimacy, and service quality.",
            "We monitor vendor performance through customer reviews, booking completion rates, and response times.",
          ],
        },
        {
          title: "Digital Contracts",
          content: [
            "Every booking generates a digital contract that clearly outlines the services agreed, the event date, location, and payment terms.",
            "Both parties receive a copy of the contract. This provides clear evidence of what was agreed if a dispute arises.",
          ],
        },
        {
          title: "Dispute Resolution",
          content: [
            "If anything goes wrong with your booking, our dispute resolution team is here to help.",
            "Contact disputes@elbold.com within 48 hours of any issue. Our team will review the situation and reach a fair outcome within 5 business days.",
            "If the vendor fails to deliver, we will process a full or partial refund depending on the circumstances.",
            "If a vendor cancels your confirmed booking, you receive a 100% refund automatically.",
          ],
        },
        {
          title: "No-Show Protection",
          content: [
            "In the rare event that a vendor does not appear for your confirmed booking, you receive:",
            "• A full refund of all amounts paid.",
            "• A £50 platform credit as an apology.",
            "• Priority support to help you find a replacement vendor.",
            "Report a no-show immediately by calling our emergency line or emailing urgent@elbold.com.",
          ],
        },
        {
          title: "Review Protection",
          content: "All reviews on ELBOLD are from verified customers who have completed real bookings. We do not allow anonymous reviews, purchased reviews, or vendor review manipulation.",
        },
        {
          title: "Our Commitment",
          content: "We only earn when you have a successful event. Our business model is designed to align with your success, which means we work hard to ensure every booking goes smoothly.",
        },
      ]}
    />
  );
}
