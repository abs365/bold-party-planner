import { NextResponse } from "next/server";
import { requireAdmin, forbidden } from "@/lib/auth/guards";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return forbidden();

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  let query = auth.db
    .from("admin_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.eq("read", false);

  const { data, error } = await query;
  if (error) {
    if (error.message?.includes("does not exist") || error.code === "42P01") {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return forbidden();

  const { ids, markAllRead } = await req.json() as { ids?: string[]; markAllRead?: boolean };

  if (markAllRead) {
    const { error } = await auth.db
      .from("admin_alerts")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("read", false);
    if (error && !error.message?.includes("does not exist") && error.code !== "42P01") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  const { error } = await auth.db
    .from("admin_alerts")
    .update({ read: true, read_at: new Date().toISOString() })
    .in("id", ids);

  if (error && !error.message?.includes("does not exist") && error.code !== "42P01") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
