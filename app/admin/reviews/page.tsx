import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminReviewsView } from "@/components/admin/AdminReviewsView";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const db = await createAdminClient();
  const { data: profile } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const { data: reviews } = await db
    .from("reviews")
    .select(`
      id, booking_id, vendor_id, customer_id, rating, comment, response, response_at,
      communication_rating, professionalism_rating, punctuality_rating, quality_rating, value_rating,
      moderation_status, moderation_notes, moderated_by, moderated_at,
      is_verified, verified_at, created_at,
      vendor:vendors(id, business_name),
      customer:profiles!reviews_customer_id_fkey(full_name, email),
      reports:review_reports(id, reason, status)
    `)
    .order("created_at", { ascending: false })
    .limit(300);

  return (
    <DashboardLayout user={(profile ?? { id: user.id, email: user.email ?? "", role: "admin" as const, full_name: null, phone: null, phone_verified: false, avatar_url: null, created_at: new Date().toISOString() }) as Profile}>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Review Moderation</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage flagged reviews and maintain marketplace trust.
          </p>
        </div>
        <AdminReviewsView initialReviews={(reviews ?? []) as unknown as Parameters<typeof AdminReviewsView>[0]["initialReviews"]} />
      </div>
    </DashboardLayout>
  );
}
