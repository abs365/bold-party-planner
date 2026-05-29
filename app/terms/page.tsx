import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | ELBOLD",
  description: "Terms and conditions for using the ELBOLD event marketplace.",
};

export default function TermsOfService() {
  return (
    <LegalPage
      title="Terms of Service"
      subtitle="The terms and conditions governing your use of the ELBOLD platform."
      lastUpdated="May 2026"
      sections={[
        {
          title: "1. Agreement to Terms",
          content: "By accessing or using ELBOLD Events ('the Platform'), you agree to be bound by these Terms of Service. If you do not agree, you must not use the Platform. These terms apply to all users including customers, vendors, and visitors.",
        },
        {
          title: "2. Description of Service",
          content: [
            "ELBOLD is an online marketplace that connects event hosts (customers) with event service providers (vendors) across the United Kingdom.",
            "We provide tools for event planning, vendor discovery, booking management, payment processing, and communication. We are a marketplace platform and do not directly provide event services.",
            "We reserve the right to modify, suspend, or discontinue any aspect of the Platform at any time with reasonable notice.",
          ],
        },
        {
          title: "3. Account Registration",
          content: [
            "You must be at least 18 years of age to create an account. By registering, you confirm you meet this requirement.",
            "You are responsible for maintaining the security of your account credentials. Notify us immediately at support@elbold.com if you suspect unauthorised access.",
            "You must provide accurate, current, and complete information during registration. We reserve the right to suspend accounts with false or misleading information.",
            "You may not transfer or sell your account to another person.",
          ],
        },
        {
          title: "4. Customer Terms",
          content: [
            "When you request a booking, you enter into a direct contract with the vendor for the services described. ELBOLD facilitates this transaction but is not party to the service contract.",
            "You agree to pay the agreed amounts in full, including the required 30% deposit within the timeframe specified.",
            "You are responsible for providing accurate event details, including date, location, guest count, and any special requirements.",
            "Cancellations and refunds are governed by our Refund Policy.",
          ],
        },
        {
          title: "5. Vendor Terms",
          content: [
            "Vendors must apply and receive approval before listing services. We reserve the right to decline or revoke approval at our discretion.",
            "Vendors are independent businesses and not employees, agents, or partners of ELBOLD.",
            "ELBOLD charges a 10% platform commission on completed bookings. Payouts are made within 7 business days of event completion.",
            "Vendors must respond to booking requests within 48 hours to maintain good standing.",
            "Vendors must honour all confirmed bookings. Cancellation of confirmed bookings may result in account suspension.",
            "Vendor conduct is further governed by the Vendor Terms of Service.",
          ],
        },
        {
          title: "6. Payments and Pricing",
          content: [
            "All prices on the Platform are in British Pounds (GBP) and are inclusive of VAT where applicable.",
            "Payments are processed securely by Stripe. We do not store card details on our servers.",
            "A 30% deposit is required to confirm bookings. The remaining balance is due no later than 14 days before the event date.",
            "ELBOLD charges a service fee to vendors (10% commission). This is included in the prices shown to customers.",
          ],
        },
        {
          title: "7. Prohibited Conduct",
          content: [
            "You must not: post false, misleading, or fraudulent content; impersonate any person or entity; circumvent our payment system by transacting directly with vendors to avoid fees; upload malicious code or attempt to gain unauthorised access; harass, threaten, or abuse other users.",
            "Attempting to contact or transact with vendors outside the ELBOLD platform (to avoid fees) is a breach of these terms and may result in account termination.",
          ],
        },
        {
          title: "8. Intellectual Property",
          content: [
            "ELBOLD and its content (excluding user-generated content) are protected by UK copyright and intellectual property law.",
            "By uploading content (photos, videos, descriptions) to the Platform, you grant ELBOLD a non-exclusive, worldwide, royalty-free licence to use, display, and reproduce that content for the purpose of operating and promoting the Platform.",
            "You retain ownership of your content. You confirm you have the right to upload any content you post.",
          ],
        },
        {
          title: "9. Disclaimers and Limitation of Liability",
          content: [
            "The Platform is provided 'as is'. We do not guarantee uninterrupted or error-free operation.",
            "ELBOLD is not liable for the quality, safety, or legality of vendor services. We facilitate connections but do not provide the underlying services.",
            "To the maximum extent permitted by UK law, our total liability to you for any claim arising from use of the Platform shall not exceed the total fees paid by you to ELBOLD in the preceding 12 months.",
            "Nothing in these terms excludes liability for death or personal injury caused by negligence, fraud, or fraudulent misrepresentation.",
          ],
        },
        {
          title: "10. Disputes Between Users",
          content: [
            "In the event of a dispute between a customer and vendor, we offer a dispute resolution service. Contact disputes@elbold.com within 48 hours of the issue arising.",
            "ELBOLD's decision in dispute matters is made in good faith but is not binding arbitration. Parties retain their legal rights.",
          ],
        },
        {
          title: "11. Termination",
          content: "We may suspend or terminate your account for breach of these terms, fraudulent activity, or any conduct that harms the Platform or its users. You may close your account at any time via account settings. Termination does not affect rights and obligations arising before termination.",
        },
        {
          title: "12. Governing Law",
          content: "These Terms of Service are governed by the laws of England and Wales. Any disputes arising shall be subject to the exclusive jurisdiction of the courts of England and Wales.",
        },
        {
          title: "13. Changes to Terms",
          content: "We may update these terms. Material changes will be communicated by email with at least 14 days' notice. Continued use after the effective date constitutes acceptance.",
        },
      ]}
    />
  );
}
