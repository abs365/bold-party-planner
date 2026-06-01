import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FeedbackForm } from "@/components/pwa/FeedbackForm";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function CustomerFeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Share Your Feedback</h1>
          <p className="text-white/50 mt-1 text-sm">
            You are one of ELBOLD&apos;s early customers. Your experience helps us improve the platform
            for everyone. This takes under 2 minutes.
          </p>
        </div>
        <FeedbackForm type="customer" />
      </div>
    </DashboardLayout>
  );
}
