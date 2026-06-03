import { NextResponse } from "next/server";
import { requireAdmin, forbidden } from "@/lib/auth/guards";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { track } from "@/lib/analytics";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return forbidden();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = auth.db
    .from("vendors")
    .select("*, profile:profiles(full_name, email, phone)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("business_name", `%${search}%`);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return forbidden();

  const { vendor_id, status, featured, verified, phone_verified, rejection_reason } = await request.json() as {
    vendor_id: string;
    status?: string;
    featured?: boolean;
    verified?: boolean;
    phone_verified?: boolean;
    rejection_reason?: string;
  };

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (typeof featured === "boolean") updates.featured = featured;
  if (typeof verified === "boolean") updates.verified = verified;
  if (typeof phone_verified === "boolean") updates.phone_verified = phone_verified;

  const { data: vendorBefore } = await auth.db
    .from("vendors")
    .select("status")
    .eq("id", vendor_id)
    .maybeSingle();

  const { data: vendor, error } = await auth.db
    .from("vendors")
    .update(updates)
    .eq("id", vendor_id)
    .select("*, profile:profiles(email, full_name)")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const auditAction =
    status === "approved" ? "admin.vendor.approve" :
    status === "rejected" ? "admin.vendor.reject" :
    "vendor.profile.update";
  void createAuditLog({
    actorUserId: auth.user.id,
    actorRole: "admin",
    action: auditAction,
    entityType: "vendor",
    entityId: vendor_id,
    before: vendorBefore ? { status: vendorBefore.status } : undefined,
    after: updates.status !== undefined ? { status: updates.status } : undefined,
    ipAddress: ipFromRequest(request),
  });

  if (status === "approved" || status === "rejected") {
    void track({
      event: status === "approved" ? "admin.vendor.approved" : "admin.vendor.rejected",
      userId: auth.user.id,
      properties: { vendor_id },
    });
  }

  const profile = vendor.profile as Record<string, string>;
  if (status === "approved" && profile?.email) {
    const { sendVendorApproved } = await import("@/lib/resend");
    void sendVendorApproved(profile.email, profile.full_name ?? "Vendor", vendor.business_name);
  } else if (status === "rejected" && profile?.email) {
    const { sendVendorRejected } = await import("@/lib/resend");
    void sendVendorRejected(profile.email, profile.full_name ?? "Vendor", vendor.business_name, rejection_reason);
  }

  return NextResponse.json(vendor);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return forbidden();

  const { vendor_ids, action, rejection_reason } = await request.json() as {
    vendor_ids: string[];
    action: "approve" | "reject" | "suspend";
    rejection_reason?: string;
  };

  if (!Array.isArray(vendor_ids) || vendor_ids.length === 0) {
    return NextResponse.json({ error: "No vendor IDs provided" }, { status: 400 });
  }

  const statusMap = { approve: "approved", reject: "rejected", suspend: "suspended" } as const;
  const newStatus = statusMap[action];

  const { data: vendorsBefore } = await auth.db
    .from("vendors")
    .select("id, status, business_name, profile:profiles(email, full_name)")
    .in("id", vendor_ids);

  const { data: updated, error } = await auth.db
    .from("vendors")
    .update({ status: newStatus })
    .in("id", vendor_ids)
    .select("id, status");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const auditAction = action === "approve" ? "admin.vendor.approve" : action === "reject" ? "admin.vendor.reject" : "admin.vendor.suspend";
  const ip = ipFromRequest(request);

  for (const v of vendorsBefore ?? []) {
    const profile = v.profile as unknown as Record<string, string> | null;
    void createAuditLog({
      actorUserId: auth.user.id,
      actorRole: "admin",
      action: auditAction,
      entityType: "vendor",
      entityId: String(v.id),
      before: { status: v.status },
      after: { status: newStatus },
      ipAddress: ip,
    });
    if (profile?.email) {
      if (action === "approve") {
        const { sendVendorApproved } = await import("@/lib/resend");
        void sendVendorApproved(profile.email, profile.full_name ?? "Vendor", v.business_name ?? "Your business");
      } else if (action === "reject") {
        const { sendVendorRejected } = await import("@/lib/resend");
        void sendVendorRejected(profile.email, profile.full_name ?? "Vendor", v.business_name ?? "Your business", rejection_reason);
      }
    }
  }

  void track({
    event: `admin.vendor.bulk_${action}` as "admin.vendor.bulk_approve",
    userId: auth.user.id,
    properties: { count: vendor_ids.length },
  });

  return NextResponse.json({ updated: updated?.length ?? vendor_ids.length });
}
