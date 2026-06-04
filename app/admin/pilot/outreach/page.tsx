import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CopyButton } from "@/components/ui/CopyButton";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

const EMAIL = {
  subject: "Join ELBOLD Events — Free listing, keep 90% of every booking",
  body: `Hi [Name],

I came across [Business Name] and wanted to reach out personally.

I'm building ELBOLD Events — a new UK marketplace connecting event hosts with trusted vendors for weddings, birthdays, and corporate events across the UK.

I'm currently inviting a small group of founding vendors to join before we open to the public. As a founding vendor, you would:

• List your services for free — no monthly fees during our launch period
• Keep 90% of every booking you receive
• Get a Founding Vendor badge on your profile
• Receive direct quote requests from real event hosts in your area
• Build your reviews and reputation from day one

There's no long-term commitment. You set your own prices. We handle the payment processing, dispute protection, and customer trust infrastructure.

To apply, it takes about 5 minutes: https://www.elbold.com/vendor/apply

I'm personally reviewing every application and I'd love to have [Business Name] on the platform.

Any questions, reply here or WhatsApp me directly.

Best,
[Your Name]
ELBOLD Events
hello@elbold.com`,
};

const WHATSAPP = `Hi [Name], I'm [Your Name] from ELBOLD Events — a new UK marketplace for event vendors. I came across your work and I think you'd be a great fit for our founding vendor programme. Free to list, keep 90% of bookings, and you'd get a Founding Vendor badge. Takes 5 minutes to apply: elbold.com/vendor/apply — happy to answer any questions here!`;

const INSTAGRAM_DM = `Hi [Name] 👋 Love your work! I run ELBOLD Events — a new UK marketplace connecting event hosts with vendors like you. We're onboarding our founding vendors right now and I think [Business Name] would be a perfect fit.

Free to list, you keep 90% of every booking, and you get a Founding Vendor badge. No monthly fees during our launch.

Interested? Takes 5 mins: elbold.com/vendor/apply ✨`;

const FOLLOW_UP_EMAIL = `Hi [Name],

Just following up on my message from [X days] ago about ELBOLD Events.

We're now live with our first vendors and receiving real quote requests from event hosts in [City/Region].

If you're open to a quick chat about how it works, I'm happy to walk you through it — no obligation at all.

Reply here or WhatsApp: [Your Number]

Best,
[Your Name]`;

export default async function OutreachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  return (
    <DashboardLayout user={(profile ?? { id: user.id, email: user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile}>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendor Outreach Pack</h1>
          <p className="text-white/50 text-sm mt-1">
            Copy-and-paste scripts for recruiting founding vendors. Personalise the fields in brackets.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Target Categories</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { cat: "DJs", icon: "🎧", target: 2 },
              { cat: "Photographers", icon: "📷", target: 2 },
              { cat: "Decorators", icon: "🌸", target: 2 },
              { cat: "Caterers", icon: "🍽️", target: 2 },
              { cat: "Cake Makers", icon: "🎂", target: 2 },
            ].map(({ cat, icon, target }) => (
              <div key={cat} className="bg-white/4 border border-white/8 rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{icon}</div>
                <p className="text-white text-xs font-semibold">{cat}</p>
                <p className="text-white/30 text-xs">Target: {target}</p>
              </div>
            ))}
          </div>
        </div>

        {[
          {
            title: "Outreach Email",
            sub: "Use for cold email or LinkedIn/Facebook message. Personalise [Name], [Business Name], [City].",
            content: EMAIL.subject + "\n\n---\n\n" + EMAIL.body,
            label: "Copy Email",
          },
          {
            title: "Follow-up Email",
            sub: "Send 5–7 days after initial outreach if no response.",
            content: FOLLOW_UP_EMAIL,
            label: "Copy Follow-up",
          },
          {
            title: "WhatsApp Message",
            sub: "Under 160 words — works well as a first message after finding them on Instagram.",
            content: WHATSAPP,
            label: "Copy WhatsApp",
          },
          {
            title: "Instagram DM Script",
            sub: "Casual, emoji-friendly. Works best after liking 2–3 of their posts first.",
            content: INSTAGRAM_DM,
            label: "Copy DM",
          },
        ].map(({ title, sub, content, label }) => (
          <section key={title}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-white font-semibold">{title}</h2>
                <p className="text-white/40 text-xs mt-0.5">{sub}</p>
              </div>
              <CopyButton text={content} label={label} />
            </div>
            <pre className="bg-white/4 border border-white/6 rounded-xl p-5 text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-sans overflow-x-auto">
              {content}
            </pre>
          </section>
        ))}

        {/* Tips */}
        <section className="bg-white/4 border border-white/6 rounded-xl p-5 space-y-3">
          <h2 className="text-white font-semibold text-sm">Outreach Tips</h2>
          <ul className="space-y-2 text-xs text-white/50 list-disc list-inside">
            <li>Engage with 2–3 of their Instagram posts before DMing — response rates are 3x higher</li>
            <li>Personalise the business name and location in every message — generic outreach gets ignored</li>
            <li>Follow up exactly once, 5–7 days after the first message, then mark as Lost</li>
            <li>Prioritise vendors with 200–5,000 followers — big enough to be active, small enough to need us</li>
            <li>Vendors who respond to the email within 24 hours are almost always Worth pursuing</li>
            <li>Log every contact in the Pilot Vendor CRM immediately — do not rely on memory</li>
          </ul>
        </section>
      </div>
    </DashboardLayout>
  );
}

