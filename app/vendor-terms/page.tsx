import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = {
  title: "Vendor Terms | ELBOLD",
  description: "Terms and conditions for vendors listing services on the ELBOLD marketplace.",
};

export default function VendorTerms() {
  return (
    <LegalPage
      title="Vendor Terms of Service"
      subtitle="Additional terms and obligations for event professionals listing services on ELBOLD."
      lastUpdated="June 2026"
      sections={[
        {
          title: "1. Vendor Status",
          content: [
            "The marketplace is operated by ELBOLD Ltd (trading as ELBOLD Events), company number [COMPANY_NUMBER], registered in England and Wales, registered office: [REGISTERED_OFFICE].",
            "By applying as a vendor on ELBOLD, you agree to these Vendor Terms in addition to our general Terms of Service.",
            "Vendor status is granted at our discretion following an application review. We may decline applications without giving reasons.",
            "You are an independent business, not an employee, agent, or contractor of ELBOLD.",
          ],
        },
        {
          title: "2. Listing Requirements",
          content: [
            "All information on your vendor profile must be accurate, complete, and current. Misleading descriptions, fake reviews, or exaggerated claims are prohibited.",
            "Portfolio photos and videos must be your own original work or content you have the right to use. Stock photos misrepresenting your actual work are prohibited.",
            "Pricing shown on your profile must reflect the actual prices you charge. Hidden fees not disclosed upfront are prohibited.",
            "You must respond to booking requests and customer messages within 48 hours.",
          ],
        },
        {
          title: "3. Commission and Payments",
          content: [
            "ELBOLD charges a 10% commission on the total booking value. This is deducted from your payout before funds are transferred.",
            "Example: A £500 booking results in a £450 payout to you (90%).",
            "Payouts are processed within 7 working days of the event completion date via bank transfer. You receive 90% of the agreed booking value.",
            "Payouts are made by bank transfer to the account details you provide. You are responsible for providing accurate bank details.",
            "Pro plan subscribers (£29/month) retain priority placement in search. Featured plan subscribers (£79/month) receive homepage placement.",
          ],
        },
        {
          title: "4. Booking Obligations",
          content: [
            "Once you accept a booking request, you are legally obligated to deliver the agreed service.",
            "If you are unable to fulfil a confirmed booking, you must notify us and the customer at least 7 days in advance except in genuine emergency.",
            "Repeated cancellations of confirmed bookings will result in account suspension.",
            "You must bring and use any equipment specified in the booking. Substituting significantly inferior equipment without customer consent is a breach of contract.",
          ],
        },
        {
          title: "5. Standards of Conduct",
          content: [
            "You must behave professionally at all times when representing services booked through ELBOLD.",
            "You must arrive on time for events. If a delay is unavoidable, contact the customer immediately.",
            "You must treat customers and their guests with respect. Rude, discriminatory, or threatening behaviour will result in immediate account suspension.",
            "You must not engage in any activity that could bring ELBOLD's reputation into disrepute.",
          ],
        },
        {
          title: "6. Content and Intellectual Property",
          content: [
            "You retain ownership of photos, videos, and content you upload to your profile.",
            "By uploading content, you grant ELBOLD a non-exclusive licence to display that content on the platform and in marketing materials.",
            "You confirm you own or have the right to use all uploaded content.",
          ],
        },
        {
          title: "7. Insurance and Compliance",
          content: [
            "You are responsible for holding appropriate public liability insurance for your business activities.",
            "You are responsible for complying with all applicable laws including health and safety, data protection, and any industry-specific regulations.",
            "Proof of insurance may be requested during the verification process.",
          ],
        },
        {
          title: "8. Reviews and Reputation",
          content: [
            "Customers may leave honest reviews following completed bookings. You must not offer incentives for positive reviews or request removal of honest negative reviews.",
            "You may respond publicly to reviews on your profile.",
            "Fake or incentivised reviews are prohibited and may result in account termination and legal action.",
          ],
        },
        {
          title: "9. Account Suspension and Termination",
          content: [
            "We may suspend or terminate vendor accounts for: breaching these terms, poor conduct, repeated cancellations, fraudulent activity, consistently low ratings without improvement, or failing to respond to customers.",
            "Suspended vendors will be notified by email. You may appeal a suspension by contacting vendor-support@elbold.com.",
          ],
        },
        {
          title: "10. Changes to Vendor Terms",
          content: "We may update these Vendor Terms with 30 days' notice. Continued use of the platform after the effective date constitutes acceptance of the new terms.",
        },
      ]}
    />
  );
}
