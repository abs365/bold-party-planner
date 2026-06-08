import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateOutreachMessages } from "@/lib/vendor-acquisition/outreach";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lead = await req.json();
  const messages = await generateOutreachMessages(lead);
  return NextResponse.json({ messages });
}
