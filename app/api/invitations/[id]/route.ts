import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeParseBody, updateInvitationSchema } from "@/lib/validate";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = safeParseBody(updateInvitationSchema, body);
  if (!result.data) return NextResponse.json({ error: result.error ?? "Invalid input" }, { status: 400 });
  const parsed = result.data;

  const { data, error } = await supabase
    .from("invitations")
    .update({ ...parsed, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("customer_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", id)
    .eq("customer_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
