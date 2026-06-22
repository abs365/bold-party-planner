import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { createAuditLog, ipFromRequest } from "@/lib/audit";

const packageSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  includes: z.array(z.string()).default([]),
  description: z.string().max(500).optional(),
  duration_hours: z.number().int().positive().optional(),
  max_guests: z.number().int().positive().optional(),
});

const bodySchema = z.object({
  packages: z.array(packageSchema).min(1).max(10),
});

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendor_id") ?? vendor.id;

  const { data, error } = await supabase.from("vendor_packages").select("*").eq("vendor_id", vendorId).order("price");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id, status").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  // Suspended and rejected vendors cannot create packages.
  // Pending vendors may create packages in advance; they are not visible to
  // customers until the vendor is approved (matching API filters status = approved).
  if (vendor.status === "suspended" || vendor.status === "rejected") {
    return NextResponse.json({ error: "Account not active" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const rows = parsed.data.packages.map((p) => ({ ...p, vendor_id: vendor.id }));
  const { data, error } = await supabase.from("vendor_packages").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void createAuditLog({
    actorUserId: user.id,
    actorRole: "vendor",
    action: "vendor.package.create",
    entityType: "vendor_package",
    entityId: vendor.id,
    ipAddress: ipFromRequest(req),
  });

  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { package_id } = await req.json() as { package_id: string };
  if (!package_id) return NextResponse.json({ error: "Missing package_id" }, { status: 400 });

  const { error } = await supabase.from("vendor_packages").delete().eq("id", package_id).eq("vendor_id", vendor.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void createAuditLog({
    actorUserId: user.id,
    actorRole: "vendor",
    action: "vendor.package.delete",
    entityType: "vendor_package",
    entityId: package_id,
    ipAddress: ipFromRequest(req),
  });

  return NextResponse.json({ success: true });
}
