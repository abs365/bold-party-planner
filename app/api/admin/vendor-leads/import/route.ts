import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { scoreLead } from "@/lib/vendor-acquisition/scoring";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/ /g, "_"));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

function normalise(v: string | undefined) {
  return (v ?? "").trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length === 0) return NextResponse.json({ error: "No data rows found" }, { status: 400 });

  const db = await createAdminClient();
  const { data: existing } = await db.from("vendor_leads").select("email, website, instagram, business_name, city");

  const existingEmails    = new Set((existing ?? []).map((r) => normalise(r.email)));
  const existingWebsites  = new Set((existing ?? []).map((r) => normalise(r.website)));
  const existingIg        = new Set((existing ?? []).map((r) => normalise(r.instagram)));
  const existingNameCity  = new Set((existing ?? []).map((r) => `${normalise(r.business_name)}|${normalise(r.city)}`));

  const toInsert: object[] = [];
  const skipped: string[] = [];

  for (const row of rows) {
    const name = row.business_name ?? row.name ?? "";
    if (!name) { skipped.push("(unnamed row)"); continue; }

    const email    = row.email ?? "";
    const website  = row.website ?? "";
    const ig       = row.instagram ?? "";
    const city     = row.city ?? row.location ?? "";
    const nameCity = `${normalise(name)}|${normalise(city)}`;

    const isDup =
      (email    && existingEmails.has(normalise(email)))    ||
      (website  && existingWebsites.has(normalise(website)))||
      (ig       && existingIg.has(normalise(ig)))           ||
      existingNameCity.has(nameCity);

    if (isDup) { skipped.push(name); continue; }

    const region   = row.region ?? null;
    const category = row.category ?? null;
    const score    = scoreLead({
      region, category, website: website || null,
      instagram: ig || null, facebook: row.facebook || null,
      email: email || null, phone: row.phone || null,
      rating: row.rating ? parseFloat(row.rating) : null,
      review_count: row.review_count ? parseInt(row.review_count) : null,
    });

    toInsert.push({
      business_name: name,
      category:      category || "other",
      location:      row.location ?? city,
      city:          city || null,
      region:        region || null,
      website:       website || null,
      instagram:     ig || null,
      facebook:      row.facebook || null,
      email:         email || null,
      phone:         row.phone || null,
      source:        row.source || "CSV import",
      notes:         row.notes || null,
      lead_score:    score.total,
      priority:      score.priority,
      status:        "new",
    });

    // Update duplicate detection sets
    if (email)   existingEmails.add(normalise(email));
    if (website) existingWebsites.add(normalise(website));
    if (ig)      existingIg.add(normalise(ig));
    existingNameCity.add(nameCity);
  }

  let inserted = 0;
  if (toInsert.length > 0) {
    const { error } = await db.from("vendor_leads").insert(toInsert);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    inserted = toInsert.length;
  }

  return NextResponse.json({ inserted, skipped: skipped.length, skipped_names: skipped });
}
