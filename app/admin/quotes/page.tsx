import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminQuotesView } from "@/components/admin/AdminQuotesView";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export default async function AdminQuotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const db = await createAdminClient();

  // Load recent quotes with full relations (limit 200 to keep response fast)
  const { data: quotes } = await db
    .from("quotes")
    .select(`
      id, status, lead_score,
      event_type, event_date, guest_count,
      budget_min, budget_max, city, category,
      created_at, responded_at, accepted_at, viewed_at,
      shortlisted_at, rejected_at, withdrawn_at,
      vendor_decline_reason, customer_rejection_reason,
      converted_booking_id,
      vendor:vendors(id, business_name, category, city),
      customer:profiles(id, full_name),
      event:events(id, title, date),
      response:quote_responses(id, price, deposit_amount, status, created_at)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  // Aggregate stats
  const allQuotes = quotes ?? [];
  const stats = {
    total:       allQuotes.length,
    pending:     allQuotes.filter((q) => q.status === "pending").length,
    responded:   allQuotes.filter((q) => ["responded", "viewed"].includes(q.status)).length,
    shortlisted: allQuotes.filter((q) => q.status === "shortlisted").length,
    converted:   allQuotes.filter((q) => q.status === "converted").length,
    declined:    allQuotes.filter((q) => ["declined", "rejected", "withdrawn"].includes(q.status)).length,
    expired:     allQuotes.filter((q) => q.status === "expired").length,
    conversionRate:
      allQuotes.length > 0
        ? Math.round((allQuotes.filter((q) => q.status === "converted").length / allQuotes.length) * 100)
        : 0,
  };

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Quote Pipeline</h1>
          <p className="text-white/50 mt-1 text-sm">Platform-wide quote visibility — last 200 quotes</p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <AdminQuotesView quotes={allQuotes as any} stats={stats} />
      </div>
    </DashboardLayout>
  );
}
