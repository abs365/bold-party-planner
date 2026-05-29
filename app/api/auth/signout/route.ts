import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handleSignout(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Redirect to login at the same origin as the request (works locally and in prod)
  return NextResponse.redirect(new URL("/login", request.url), { status: 302 });
}

export async function POST(request: Request) {
  return handleSignout(request);
}

export async function GET(request: Request) {
  return handleSignout(request);
}
