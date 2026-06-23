import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";
import { generateOutreachMessages } from "@/lib/vendor-acquisition/outreach";

export async function POST(req: NextRequest) {
  const auth = await requireAdminRole("ops_admin");
  if (!auth) return forbidden();

  const lead = await req.json();
  const messages = await generateOutreachMessages(lead);
  return NextResponse.json({ messages });
}
