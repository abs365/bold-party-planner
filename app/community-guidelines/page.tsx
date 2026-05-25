import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = {
  title: "Community Guidelines — Bold Party",
  description: "Bold Party's community standards for customers and vendors.",
};

export default function CommunityGuidelines() {
  return (
    <LegalPage
      title="Community Guidelines"
      subtitle="The standards that make Bold Party a trustworthy, respectful, and enjoyable marketplace for everyone."
      lastUpdated="May 2026"
      sections={[
        {
          title: "Our Community Values",
          content: [
            "Bold Party is built on trust between event hosts and event professionals. Our community thrives when everyone acts with honesty, respect, and professionalism.",
            "These guidelines apply to all users — customers, vendors, and anyone who interacts with our platform.",
          ],
        },
        {
          title: "For Everyone: Basic Standards",
          content: [
            "Be honest: don't misrepresent yourself, your services, or your experience.",
            "Be respectful: treat others the way you'd want to be treated. Discriminatory, harassing, or threatening behaviour is not tolerated.",
            "Communicate clearly: respond to messages promptly and professionally.",
            "Don't manipulate: fake reviews, fake profiles, and fake bookings are grounds for immediate removal.",
            "Protect privacy: don't share other users' personal information without their consent.",
          ],
        },
        {
          title: "For Customers",
          content: [
            "Provide accurate event information so vendors can quote correctly.",
            "Be available: respond to vendor queries and confirm details in a timely manner.",
            "Pay on time: complete payments by the agreed deadlines to avoid booking cancellation.",
            "Be fair in reviews: share your honest experience, but avoid reviews written in anger or exaggerating issues.",
            "Don't circumvent the platform: arranging direct payment with vendors outside Bold Party removes your booking protection.",
          ],
        },
        {
          title: "For Vendors",
          content: [
            "Be professional at all times — in communications, at events, and in your profile content.",
            "Only accept bookings you can genuinely fulfil. Cancelling confirmed bookings hurts real people's events.",
            "Respond to enquiries within 48 hours. Slow response times result in lost bookings.",
            "Photos on your profile must represent your actual work. Using others' work or stock photos is prohibited.",
            "Treat every customer as if they're your most important client — because for them, their event is exactly that.",
          ],
        },
        {
          title: "Prohibited Content",
          content: [
            "The following content is strictly prohibited on Bold Party: illegal services or content, adult or explicit material, counterfeit goods or services, misleading pricing, spam or automated messages, content that infringes intellectual property rights.",
            "Profile photos must be appropriate for all audiences. Portfolio content must relate to the event services offered.",
          ],
        },
        {
          title: "Reporting Violations",
          content: [
            "If you encounter behaviour that violates these guidelines, please report it immediately.",
            "Report a vendor: use the 'Report' button on any vendor profile.",
            "Report a message: use the flag icon in the messaging interface.",
            "Contact us directly: safety@boldparty.co.uk",
            "We take all reports seriously and investigate within 24 hours.",
          ],
        },
        {
          title: "Consequences of Violations",
          content: [
            "Minor violations: a warning with guidance on the correct behaviour.",
            "Repeated or serious violations: temporary suspension of account.",
            "Fraud, abuse, or illegal activity: permanent account termination and where appropriate, referral to law enforcement.",
            "Vendors with sustained low ratings or repeated complaints will be given an improvement period before account review.",
          ],
        },
        {
          title: "Our Responsibility",
          content: "We are committed to actively moderating our platform. We review flagged content, investigate reports, and proactively monitor for suspicious activity. We will always communicate clearly about any action taken on your account.",
        },
      ]}
    />
  );
}
