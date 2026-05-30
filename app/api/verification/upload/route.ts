import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createAdminAlert } from "@/lib/verification-automation";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const BUCKET = "verification-documents";

// Allowed document types (matches DB constraint)
const ALLOWED_DOC_TYPES = new Set([
  "government_id", "insurance", "business_registration", "food_hygiene",
  "sia_license", "operator_license", "proof_of_address", "bank_verification",
  "portfolio_authenticity",
]);

function ext(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  return map[mime] ?? "bin";
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rlHour = rateLimit({ identifier: `ver-upload:hr:${user.id}`, limit: 20, windowMs: 60 * 60_000 });
  const rlDay  = rateLimit({ identifier: `ver-upload:day:${user.id}`, limit: 100, windowMs: 24 * 60 * 60_000 });
  if (!rlHour.allowed || !rlDay.allowed) {
    const rl = !rlHour.allowed ? rlHour : rlDay;
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "20",
          "X-RateLimit-Remaining": String(Math.min(rlHour.remaining, rlDay.remaining)),
          "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
        },
      }
    );
  }

  // Get vendor record
  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 403 });

  // Parse multipart form
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const docType = String(formData.get("docType") ?? "");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_DOC_TYPES.has(docType)) {
    return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  }

  // MIME validation
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WebP and PDF files are accepted" },
      { status: 422 }
    );
  }

  // Size check
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 10MB" }, { status: 422 });
  }
  if (file.size < 100) {
    return NextResponse.json({ error: "File appears to be empty or corrupted" }, { status: 422 });
  }

  // Build private storage path: verification/{vendorId}/{docType}/{timestamp}.{ext}
  const timestamp = Date.now();
  const filename = `${timestamp}.${ext(file.type)}`;
  const storagePath = `verification/${vendor.id}/${docType}/${filename}`;

  // Use admin client for storage upload (bypasses RLS on bucket operations)
  const adminSupabase = await createAdminClient();
  const { error: uploadError } = await adminSupabase.storage
    .from(BUCKET)
    .upload(storagePath, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
  }

  // Create short-lived signed URL for immediate preview (1 hour)
  const { data: signedData } = await adminSupabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);

  // Create admin alert for new submission
  await createAdminAlert(adminSupabase, {
    type: "verification_submitted",
    title: `New verification: ${docType.replace(/_/g, " ")}`,
    body: `Vendor submitted a ${docType.replace(/_/g, " ")} document for review.`,
    vendor_id: vendor.id,
    severity: "info",
  });

  return NextResponse.json(
    {
      path: storagePath,
      signedUrl: signedData?.signedUrl ?? null,
      docType,
      filename,
      size: file.size,
      mimeType: file.type,
    },
    {
      headers: {
        "X-RateLimit-Limit": "20",
        "X-RateLimit-Remaining": String(Math.min(rlHour.remaining, rlDay.remaining)),
        "X-RateLimit-Reset": String(Math.ceil(Math.min(rlHour.resetAt, rlDay.resetAt) / 1000)),
      },
    }
  );
}
