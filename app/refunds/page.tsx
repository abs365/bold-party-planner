import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = {
  title: "Refund Policy | ELBOLD",
  description: "ELBOLD's cancellation, refund, and dispute resolution policy.",
};

export default function RefundPolicy() {
  return (
    <LegalPage
      title="Refund Policy"
      subtitle="Our cancellation, refund, and dispute resolution process for bookings made through ELBOLD."
      lastUpdated="May 2026"
      sections={[
        {
          title: "1. Overview",
          content: "All bookings made through ELBOLD are covered by this Refund Policy. We aim to be fair to both customers and vendors while maintaining a trustworthy marketplace.",
        },
        {
          title: "2. Customer Cancellations",
          content: [
            "More than 30 days before the event: Full refund of the deposit, minus a 5% processing fee.",
            "15–30 days before the event: 50% refund of amounts paid.",
            "8–14 days before the event: 25% refund of amounts paid.",
            "7 days or fewer before the event: No refund. The vendor has allocated this date exclusively for your event.",
            "To cancel a booking, visit your booking page in the dashboard or contact support@elbold.com.",
          ],
        },
        {
          title: "3. Vendor Cancellations",
          content: [
            "If a vendor cancels a confirmed booking, you are entitled to a full refund of all amounts paid.",
            "We will also assist you in finding a replacement vendor from our approved marketplace.",
            "Vendors who cancel confirmed bookings receive a formal warning and may have their accounts suspended.",
          ],
        },
        {
          title: "4. Deposits",
          content: [
            "A 30% deposit is required to confirm your booking. This deposit is non-refundable if you cancel within 7 days of the event.",
            "Deposits are held securely by ELBOLD until the event is completed or a refund is issued.",
          ],
        },
        {
          title: "5. Service Disputes",
          content: [
            "If the vendor fails to deliver the agreed service, or delivers a service significantly below the standard described, you may raise a dispute.",
            "Disputes must be raised within 48 hours of the event by contacting disputes@elbold.com.",
            "We will review evidence from both parties (photos, messages, contracts) and make a fair determination within 5 business days.",
            "Dispute outcomes may include partial or full refunds depending on the circumstances.",
          ],
        },
        {
          title: "6. No-Show by Vendor",
          content: "If a vendor fails to appear for a confirmed booking without prior notice, you are entitled to a full refund of all amounts paid. Report no-shows immediately to urgent@elbold.com — we will respond as a matter of priority and assist you in finding a replacement vendor.",
        },
        {
          title: "7. Force Majeure",
          content: [
            "In exceptional circumstances beyond either party's control (severe weather, national emergency, venue closure), we will work with both parties to reschedule or issue appropriate refunds.",
            "Rescheduling is the preferred outcome. If rescheduling is not possible, refunds will be assessed case by case.",
          ],
        },
        {
          title: "8. Refund Processing Time",
          content: "Approved refunds are processed within 5–10 business days. The time for funds to appear in your account depends on your bank, typically 3–5 additional business days.",
        },
        {
          title: "9. Contact",
          content: "For refund requests and disputes: disputes@elbold.com or support@elbold.com. We aim to respond to all refund requests within 24 hours.",
        },
      ]}
    />
  );
}
