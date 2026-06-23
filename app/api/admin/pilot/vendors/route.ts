import { NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";
import { z } from "zod";

const schema = z.object({
  business_name:      z.string().min(1).max(200),
  category:           z.string().max(100).optional(),
  contact_name:       z.string().max(200).optional(),
  phone:              z.string().max(50).optional(),
  email:              z.string().email().optional().or(z.literal("")),
  instagram:          z.string().max(200).optional(),
  facebook:           z.string().max(200).optional(),
  website:            z.string().max(500).optional(),
  acquisition_source: z.string().max(100).optional(),
  status:             z.enum(["prospect","contacted","interested","registered","approved","verified","active","lost"]).optional(),
  notes:              z.string().max(2000).optional(),
  vendor_id:          z.string().uuid().optional().nullable(),
  contacted_at:       z.string().optional().nullable(),
  registered_at:      z.string().optional().nullable(),
});

export async function GET() {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const { data, error } = await auth.db
    .from("pilot_vendors")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await auth.db
    .from("pilot_vendors")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json();
  const parsed = schema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await auth.db
    .from("pilot_vendors")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await auth.db.from("pilot_vendors").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
