import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { track } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const MIN_FILE_SIZE = 1024;              // 1 KB — reject empty/corrupt files

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",  // .mov
  "video/webm",
  "video/x-msvideo", // .avi
]);

const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "gif",
  "mp4", "mov", "webm", "avi",
]);

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 64);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rlHour = rateLimit({ identifier: `uploads:hr:${user.id}`, limit: 20, windowMs: 60 * 60_000 });
    const rlDay  = rateLimit({ identifier: `uploads:day:${user.id}`, limit: 100, windowMs: 24 * 60 * 60_000 });
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const vendorId = formData.get("vendorId") as string | null;
    const declaredType = formData.get("type") as string | null;
    const sortOrder = Number(formData.get("sortOrder") ?? 0);

    // ── Input validation ──────────────────────────────────────────────────────
    if (!file || !vendorId) {
      return NextResponse.json({ error: "Missing file or vendorId" }, { status: 400 });
    }

    if (file.size < MIN_FILE_SIZE) {
      return NextResponse.json({ error: "File is too small or empty" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const mimeType = file.type.toLowerCase();
    const isImage = ALLOWED_IMAGE_TYPES.has(mimeType);
    const isVideo = ALLOWED_VIDEO_TYPES.has(mimeType);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: `File type '${mimeType}' is not allowed. Supported: JPG, PNG, WebP, MP4, MOV, WebM` },
        { status: 400 }
      );
    }

    // Validate extension matches MIME type
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: `File extension '.${ext}' is not allowed` }, { status: 400 });
    }

    const mediaType: "image" | "video" = isVideo ? "video" : "image";

    // If caller specified a type, validate it matches actual MIME
    if (declaredType && declaredType !== mediaType) {
      return NextResponse.json(
        { error: "Declared file type does not match actual file content" },
        { status: 400 }
      );
    }

    // ── Vendor ownership check ────────────────────────────────────────────────
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("id", vendorId)
      .eq("user_id", user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found or access denied" }, { status: 403 });
    }

    // Check media count limit (max 20)
    const { count } = await supabase
      .from("vendor_media")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendorId)
      .is("deleted_at", null);

    if ((count ?? 0) >= 20) {
      return NextResponse.json({ error: "Maximum of 20 media files per vendor" }, { status: 400 });
    }

    // ── Upload to Supabase Storage ────────────────────────────────────────────
    const safeName = sanitizeFilename(file.name.replace(/\.[^.]+$/, ""));
    const fileName = `${vendorId}/${Date.now()}_${safeName}.${ext}`;
    const bucket = mediaType === "video" ? "vendor-videos" : "vendor-images";

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      void track({ event: "upload.failed", userId: user.id, properties: { reason: uploadError.message, vendorId } });
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    // ── Save to DB ────────────────────────────────────────────────────────────
    const { data: mediaRecord, error: dbError } = await supabase
      .from("vendor_media")
      .insert({
        vendor_id: vendorId,
        url: urlData.publicUrl,
        type: mediaType,
        sort_order: sortOrder,
        is_cover: sortOrder === 0,
      })
      .select()
      .single();

    if (dbError) {
      // Clean up the uploaded file if DB insert fails
      await supabase.storage.from(bucket).remove([fileName]);
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
    }

    void createAuditLog({
      actorUserId: user.id,
      actorRole: "vendor",
      action: "vendor.media.upload",
      entityType: "vendor_media",
      entityId: mediaRecord.id,
      ipAddress: ipFromRequest(request),
    });
    void track({ event: "upload.completed", userId: user.id, properties: { mediaType, vendorId } });

    return NextResponse.json(mediaRecord, {
      headers: {
        "X-RateLimit-Limit": "20",
        "X-RateLimit-Remaining": String(Math.min(rlHour.remaining, rlDay.remaining)),
        "X-RateLimit-Reset": String(Math.ceil(Math.min(rlHour.resetAt, rlDay.resetAt) / 1000)),
      },
    });
  } catch (err: unknown) {
    logger.error("upload.unexpected_error", { err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
