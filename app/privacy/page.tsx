import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Elbold",
  description: "How Elbold collects, uses, and protects your personal data.",
};

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your personal data."
      lastUpdated="June 2026"
      sections={[
        {
          title: "1. Who We Are",
          content: [
            "ELBOLD Ltd (trading as Elbold), registered in England and Wales, operates the event planning marketplace at elbold.com.",
            "In this policy, 'Elbold', 'we', 'us', and 'our' refer to ELBOLD Ltd.",
            "We act as a data controller under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.",
          ],
        },
        {
          title: "2. Data We Collect",
          content: [
            "Account information: your name, email address, phone number, and profile photo when you register.",
            "Event data: event details, guest lists, preferences, and planning information you enter on our platform.",
            "Payment information: we do not store card details. All payments are processed by Stripe, who handle payment data securely under PCI-DSS compliance.",
            "Vendor information: business name, description, location, portfolio photos and videos, packages, and pricing.",
            "Usage data: pages visited, features used, booking history, and interactions on the platform.",
            "Communications: messages sent between customers and vendors through our platform.",
            "Device information: IP address, browser type, and device identifiers for security and analytics purposes.",
          ],
        },
        {
          title: "3. How We Use Your Data",
          content: [
            "Providing our services: processing bookings, payments, and event planning features.",
            "Communications: sending transactional emails about bookings, payments, and account activity.",
            "Safety and security: detecting fraud, preventing abuse, and verifying vendor identities.",
            "Platform improvement: analysing usage patterns to improve our features and user experience.",
            "Legal compliance: fulfilling our legal obligations including tax, accounting, and dispute resolution.",
            "Marketing: only with your explicit consent, we may send promotional communications. You can opt out at any time.",
          ],
        },
        {
          title: "4. Legal Basis for Processing",
          content: [
            "Contract performance: processing necessary to fulfil bookings and provide our marketplace services.",
            "Legitimate interests: fraud prevention, platform security, and improving our services.",
            "Legal obligation: complying with applicable UK laws including tax and financial regulations.",
            "Consent: for marketing emails and non-essential cookies.",
          ],
        },
        {
          title: "5. Data Sharing and Third Parties",
          content: [
            "Supabase (Supabase Inc): our database and authentication provider. Data is stored on EU-region servers.",
            "Stripe (Stripe, Inc): our payment processor. Stripe handles all payment card data under PCI-DSS compliance.",
            "Resend (Resend Inc): our transactional email provider used to deliver booking confirmations and notifications.",
            "OpenAI (OpenAI, L.L.C): processes event planning queries through our Smart Planner feature. We do not send personally identifiable information to OpenAI.",
            "Vercel (Vercel Inc): our hosting provider. Application code and logs run on Vercel infrastructure.",
            "We do not sell your personal data to third parties. We do not share data with advertisers.",
          ],
        },
        {
          title: "6. Cookies",
          content: [
            "We use essential cookies required for authentication and security (set by Supabase). These cannot be disabled without breaking core functionality.",
            "We may use analytics cookies to understand how the platform is used. You can control non-essential cookies through your browser settings.",
          ],
        },
        {
          title: "7. Data Retention",
          content: [
            "Account data: retained for the lifetime of your account plus 7 years after account deletion for legal and tax purposes.",
            "Booking records: retained for 7 years to comply with financial regulations.",
            "Event data: retained for 2 years after the event date unless you request earlier deletion.",
            "Communications: retained for 3 years for dispute resolution purposes.",
          ],
        },
        {
          title: "8. Your Rights (UK GDPR)",
          content: [
            "Right of access: request a copy of all personal data we hold about you.",
            "Right to rectification: correct any inaccurate personal data.",
            "Right to erasure ('right to be forgotten'): request deletion of your personal data, subject to our legal retention obligations.",
            "Right to restriction: request we limit how we process your data in certain circumstances.",
            "Right to data portability: receive your data in a structured, machine-readable format.",
            "Right to object: object to processing based on legitimate interests.",
            "To exercise any of these rights, email privacy@elbold.com. We will respond within 30 days.",
          ],
        },
        {
          title: "9. Data Security",
          content: [
            "We implement appropriate technical and organisational security measures including encryption in transit (HTTPS/TLS), row-level security in our database, and regular security reviews.",
            "In the event of a data breach affecting your rights and freedoms, we will notify you and the ICO as required by UK GDPR.",
          ],
        },
        {
          title: "10. Changes to This Policy",
          content: "We may update this Privacy Policy periodically. We will notify you of material changes by email or prominent notice on the platform. Continued use of the platform after changes constitutes acceptance.",
        },
        {
          title: "11. Contact and Complaints",
          content: [
            "Data protection queries: privacy@elbold.com",
            "You have the right to lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk if you believe we have not handled your data correctly.",
          ],
        },
      ]}
    />
  );
}
