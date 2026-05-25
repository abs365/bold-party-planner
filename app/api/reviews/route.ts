import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const reviewSchema = z.object({
  booking_id: z.string().uuid(),
  vendor_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { booking_id, vendor_id, rating, comment } = parsed.data;

    // Verify booking is completed and belongs to this customer
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, status, vendor:vendors(user_id, business_name), event:events(title)")
      .eq("id", booking_id)
      .eq("customer_id", user.id)
      .eq("status", "completed")
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found or not completed" }, { status: 403 });
    }

    // Check no existing review
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", booking_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Review already submitted" }, { status: 409 });
    }

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({ booking_id, vendor_id, customer_id: user.id, rating, comment: comment ?? null })
      .select()
      .single();

    if (error) throw error;

    // Notify vendor
    const vendor = booking.vendor as unknown as Record<string, string>;
    const eventData = booking.event as unknown as Record<string, string>;
    if (vendor?.user_id) {
      void supabase.rpc("notify_user", {
        p_user_id: vendor.user_id,
        p_title: "New Review Received ⭐",
        p_message: `${rating} star review received for ${eventData?.title ?? "an event"}.`,
        p_type: "review",
        p_link: `/vendor/reviews`,
      });
    }

    return NextResponse.json(review);
  } catch (err: unknown) {
    console.error("Review error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to submit review" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  // Vendor responds to review
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { review_id, response } = await request.json() as { review_id: string; response: string };
    if (!review_id || !response) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

    const { error } = await supabase
      .from("reviews")
      .update({ response })
      .eq("id", review_id)
      .eq("vendor_id", vendor.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}
