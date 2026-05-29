import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

interface LegalSection {
  title: string;
  content: string | string[];
}

interface LegalPageProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
}

async function getProfile() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    return data;
  } catch { return null; }
}

export async function LegalPage({ title, subtitle, lastUpdated, sections }: LegalPageProps) {
  const profile = await getProfile();

  return (
    <div className="min-h-screen">
      <Navbar user={profile} />

      <div className="max-w-3xl mx-auto px-4 pt-28 pb-24">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-brand-400 text-sm hover:text-brand-300 transition-colors mb-6 inline-block">
            ← Back to ELBOLD
          </Link>
          <h1 className="text-3xl font-extrabold text-white mb-3">{title}</h1>
          <p className="text-slate-400">{subtitle}</p>
          <p className="text-slate-600 text-sm mt-2">Last updated: {lastUpdated}</p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-lg font-bold text-white mb-3">{section.title}</h2>
              <div className="space-y-3">
                {Array.isArray(section.content) ? (
                  section.content.map((para, j) => (
                    <p key={j} className="text-slate-400 text-sm leading-relaxed">{para}</p>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm leading-relaxed">{section.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-16 bg-white/4 rounded-xl p-6 border border-brand-500/15">
          <p className="text-white/60 text-sm">
            Questions about this document? Contact us at{" "}
            <a href="mailto:legal@elbold.com" className="text-brand-400 hover:text-brand-300 transition-colors">
              legal@elbold.com
            </a>
            {" "}or{" "}
            <a href="mailto:support@elbold.com" className="text-brand-400 hover:text-brand-300 transition-colors">
              support@elbold.com
            </a>.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
