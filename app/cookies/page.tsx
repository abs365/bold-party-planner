import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Elbold uses cookies and similar technologies.",
};

export default function CookiePolicy() {
  return (
    <LegalPage
      title="Cookie Policy"
      subtitle="How we use cookies and similar technologies on the Elbold platform."
      lastUpdated="May 2026"
      sections={[
        {
          title: "1. What Are Cookies",
          content: [
            "Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work, or work more efficiently, and to provide information to site owners.",
            "We also use similar technologies such as local storage and session storage that function similarly to cookies.",
          ],
        },
        {
          title: "2. Cookies We Use",
          content: [
            "Essential cookies (always active): These are necessary for the platform to function. They include authentication tokens set by Supabase (sb-*) that keep you logged in, CSRF protection tokens, and session management cookies. You cannot opt out of these without breaking the platform.",
            "Preference cookies (optional): These remember your settings and preferences, such as your currency choice or display preferences. They improve your experience but are not required.",
            "Analytics cookies (optional, with consent): We may use analytics tools to understand how visitors interact with our platform. This data is aggregated and anonymised. We only set these cookies after you have given explicit consent.",
            "Marketing cookies (not used): We do not currently use any advertising or marketing cookies, and we do not share your data with advertising networks.",
          ],
        },
        {
          title: "3. Third-Party Cookies",
          content: [
            "Stripe: When you make a payment, Stripe may set cookies for fraud prevention and payment processing. These are subject to Stripe's own privacy policy.",
            "Supabase: Our authentication provider sets cookies (sb-* prefix) that are essential for maintaining your login session.",
            "We do not embed third-party advertising networks, social media widgets, or tracking pixels that set additional cookies.",
          ],
        },
        {
          title: "4. Your Cookie Choices",
          content: [
            "When you first visit Elbold, you will be shown a cookie consent notice. You may accept all cookies or restrict to necessary cookies only.",
            "You can change your cookie preferences at any time by clicking 'Cookie Settings' in the footer of any page.",
            "You can also control cookies through your browser settings. Most browsers allow you to refuse, delete, or get notified when cookies are set. Note that blocking essential cookies will prevent you from using certain features.",
          ],
        },
        {
          title: "5. How Long Cookies Last",
          content: [
            "Session cookies: expire when you close your browser.",
            "Authentication cookies: typically last 7 days (or longer if you select 'Remember me').",
            "Preference cookies: typically last 12 months.",
            "Consent records: your cookie consent choice is stored for 12 months.",
          ],
        },
        {
          title: "6. Changes to This Policy",
          content:
            "We may update this Cookie Policy when we change the cookies we use. We will notify you of material changes through our cookie consent banner or by email.",
        },
        {
          title: "7. Contact",
          content:
            "If you have questions about our use of cookies, please email privacy@elbold.com.",
        },
      ]}
    />
  );
}
