import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { track } from "@/lib/analytics";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("quotes")
    .select(`
      *,
      vendor:vendors(id, business_name, category, city, rating, review_count, bio,
        verification_level, response_rate, completed_jobs_count,
        media:vendor_media(url, is_cover, type),
        packages:vendor_packages(id, name, price, includes)),
      customer:profiles(id, full_name, avatar_url),
      event:events(id, title, date, city, guest_count),
      response:quote_responses(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle();
  const isCustomer = data.customer_id === user.id;
  const isVendor   = vendor != null && data.vendor_id === vendor.id;

  if (!isCustomer && !isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const { action } = body;

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).maybeSingle();
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: vendorRow } = await supabase.from("vendors").select("id, user_id, status").eq("user_id", user.id).maybeSingle();
  const isCustomer = quote.customer_id === user.id;
  const isVendor   = vendorRow != null && quote.vendor_id === vendorRow.id;
  const db         = await createAdminClient();

  // ── VENDOR: respond (submit quote) ──────────────────────────────────────────
  if (action === "respond" && isVendor) {
    if (vendorRow.status !== "approved") {
      return NextResponse.json({ error: "Your vendor account is not currently active" }, { status: 403 });
    }
    const price = Number(body.price);
    if (!price || price <= 0) {
      return NextResponse.json({ error: "A valid price is required" }, { status: 400 });
    }
    if (!["pending", "viewed", "responded"].includes(quote.status)) {
      return NextResponse.json({ error: "Cannot respond to this quote in its current state" }, { status: 400 });
    }

    const deposit = body.deposit_amount != null
      ? Number(body.deposit_amount)
      : Math.round(price * 0.3);

    const responsePayload = {
      quote_id:        id,
      vendor_id:       vendorRow.id,
      price,
      deposit_amount:  deposit,
      message:         body.message  ? String(body.message)  : null,
      title:           body.title    ? String(body.title)    : null,
      description:     body.description ? String(body.description) : null,
      services:        Array.isArray(body.services) ? body.services as string[] : null,
      terms:           body.terms    ? String(body.terms)    : null,
      duration_hours:  body.duration_hours != null ? Number(body.duration_hours) : null,
      includes:        Array.isArray(body.includes) ? body.includes as string[] : [],
      valid_until:     body.valid_until ? String(body.valid_until) : null,
      status:          "pending" as const,
    };

    const { data: response, error } = await db
      .from("quote_responses")
      .upsert(responsePayload, { onConflict: "quote_id" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("quotes")
      .update({ status: "responded", responded_at: new Date().toISOString() })
      .eq("id", id);

    void db.from("quote_events").insert({
      quote_id: id, actor_id: user.id, actor_role: "vendor",
      event_type: "quote_submitted",
      details: { price, deposit, has_title: !!body.title },
    });
    void createAuditLog({ actorUserId: user.id, actorRole: "vendor",
      action: "quote.responded", entityType: "quote", entityId: id,
      ipAddress: ipFromRequest(req) });
    void track({ event: "quote.responded", userId: user.id,
      properties: { quote_id: id, price } });
    void supabase.rpc("notify_user", {
      p_user_id: quote.customer_id, p_title: "Quote Response Received",
      p_message: "A vendor has responded with a price. Review your quotes.",
      p_type: "booking", p_link: `/dashboard/quotes/${id}`,
    });

    // Transactional email to customer
    void (async () => {
      const { data: customerContact } = await db.from("profiles").select("email, full_name").eq("id", quote.customer_id).maybeSingle();
      const { data: vendorProfile } = await db.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const { data: vendorRow } = await db.from("vendors").select("business_name").eq("user_id", user.id).maybeSingle();
      if (customerContact?.email) {
        const { sendQuoteResponseToCustomer } = await import("@/lib/resend");
        void sendQuoteResponseToCustomer(
          customerContact.email,
          customerContact.full_name ?? "there",
          vendorRow?.business_name ?? vendorProfile?.full_name ?? "Your vendor",
          price,
          id
        );
      }
    })();

    return NextResponse.json(response);
  }

  // ── VENDOR: decline to quote ─────────────────────────────────────────────
  if (action === "vendor_decline" && isVendor) {
    const reason = body.reason ? String(body.reason) : null;
    await supabase.from("quotes")
      .update({ status: "declined", vendor_decline_reason: reason })
      .eq("id", id);

    void db.from("quote_events").insert({
      quote_id: id, actor_id: user.id, actor_role: "vendor",
      event_type: "vendor_declined", details: { reason },
    });
    void supabase.rpc("notify_user", {
      p_user_id: quote.customer_id, p_title: "Vendor Not Available",
      p_message: "A vendor has declined your quote request. Try a different vendor.",
      p_type: "booking", p_link: "/dashboard/quotes",
    });

    return NextResponse.json({ success: true });
  }

  // ── CUSTOMER: mark as viewed ─────────────────────────────────────────────
  if (action === "view" && isCustomer) {
    const wasViewed = !!quote.viewed_at;
    await supabase.from("quotes")
      .update({ viewed_at: new Date().toISOString(), status: quote.status === "responded" ? "viewed" : quote.status })
      .eq("id", id);

    if (!wasViewed) {
      void db.from("quote_events").insert({
        quote_id: id, actor_id: user.id, actor_role: "customer",
        event_type: "customer_viewed", details: null,
      });
    }
    return NextResponse.json({ success: true });
  }

  // ── CUSTOMER: shortlist ──────────────────────────────────────────────────
  if (action === "shortlist" && isCustomer) {
    const shortlisted = body.shortlisted !== false; // default true
    const update = shortlisted
      ? { status: "shortlisted", shortlisted_at: new Date().toISOString() }
      : { status: quote.status === "shortlisted" ? "viewed" : quote.status, shortlisted_at: null };
    await supabase.from("quotes").update(update).eq("id", id);

    void db.from("quote_events").insert({
      quote_id: id, actor_id: user.id, actor_role: "customer",
      event_type: shortlisted ? "shortlisted" : "shortlist_removed", details: null,
    });
    return NextResponse.json({ success: true });
  }

  // ── CUSTOMER: accept quote ───────────────────────────────────────────────
  if (action === "accept" && isCustomer) {
    if (!["responded", "viewed", "shortlisted"].includes(quote.status)) {
      return NextResponse.json({ error: "Quote cannot be accepted in its current state" }, { status: 400 });
    }

    // event_id is required — bookings.event_id is NOT NULL in the schema.
    // Quotes can be created without an event, but acceptance must be linked.
    if (!quote.event_id) {
      return NextResponse.json({
        error: "This quote is not linked to an event. Please create an event first and request a new quote from the vendor.",
      }, { status: 400 });
    }

    const { data: response } = await supabase
      .from("quote_responses").select("*").eq("quote_id", id).maybeSingle();
    if (!response) return NextResponse.json({ error: "No vendor quote to accept" }, { status: 400 });

    // Enforce quote expiry — if valid_until is set and in the past, reject the accept
    if (response.valid_until && new Date(response.valid_until) < new Date()) {
      return NextResponse.json(
        { error: "This quote has expired. Please request a new quote from this vendor." },
        { status: 409 }
      );
    }

    const { data: booking, error: bookErr } = await db
      .from("bookings")
      .insert({
        customer_id: quote.customer_id,
        vendor_id:   quote.vendor_id,
        event_id:    quote.event_id ?? null,
        total_amount: response.price,
        deposit_amount: response.deposit_amount ?? Math.round(response.price * 0.3),
        vendor_payout:  response.price * 0.9,
        commission_amount: response.price * 0.1,
        status: "pending_payment",
        payment_status: "pending",
        notes: `Accepted from quote ${id}. Requirements: ${quote.requirements ?? quote.notes ?? "None"}`,
      })
      .select()
      .single();

    if (bookErr) return NextResponse.json({ error: bookErr.message }, { status: 500 });

    await db.from("quote_responses").update({ status: "accepted" }).eq("id", response.id);
    await supabase.from("quotes")
      .update({ status: "converted", accepted_at: new Date().toISOString(), converted_booking_id: booking.id })
      .eq("id", id);

    // Reject other open quotes for the same event (only one booking per event per vendor category)
    if (quote.event_id) {
      await supabase.from("quotes")
        .update({ status: "rejected", rejected_at: new Date().toISOString(),
          customer_rejection_reason: "Another vendor was selected for this event" })
        .eq("customer_id", user.id)
        .eq("event_id", quote.event_id)
        .in("status", ["pending", "responded", "viewed", "shortlisted"])
        .neq("id", id);
    }

    void db.from("quote_events").insert({
      quote_id: id, actor_id: user.id, actor_role: "customer",
      event_type: "accepted",
      details: { booking_id: booking.id, price: response.price },
    });
    void createAuditLog({ actorUserId: user.id, actorRole: "customer",
      action: "quote.accepted", entityType: "quote", entityId: id,
      after: { booking_id: booking.id }, ipAddress: ipFromRequest(req) });
    void track({ event: "quote.accepted", userId: user.id,
      properties: { quote_id: id, price: response.price, booking_id: booking.id } });
    void supabase.rpc("notify_user", {
      p_user_id: quote.vendor_id,
      p_title: "Quote Accepted — Awaiting Payment",
      p_message: "A customer has accepted your quote. A booking has been created and awaits payment.",
      p_type: "booking", p_link: `/vendor/bookings/${booking.id}`,
    });

    // In-app notification to customer — prompt them to pay
    void supabase.rpc("notify_user", {
      p_user_id: quote.customer_id,
      p_title: "Booking Created — Pay Deposit to Confirm",
      p_message: "Your booking has been created. Pay the deposit now to secure your date.",
      p_type: "payment", p_link: `/dashboard/bookings/${booking.id}`,
    });

    // Transactional email to vendor on acceptance
    void (async () => {
      const { data: vendorUser } = await db.from("vendors").select("user_id, business_name").eq("id", quote.vendor_id).maybeSingle();
      if (vendorUser?.user_id) {
        const { data: vendorContact } = await db.from("profiles").select("email, full_name").eq("id", vendorUser.user_id).maybeSingle();
        if (vendorContact?.email) {
          const { sendQuoteAcceptedToVendor } = await import("@/lib/resend");
          const { data: customerProfile } = await db.from("profiles").select("full_name").eq("id", quote.customer_id).maybeSingle();
          void sendQuoteAcceptedToVendor(
            vendorContact.email,
            vendorContact.full_name ?? "there",
            customerProfile?.full_name ?? "A customer",
            quote.event_type ?? "event",
            response.price,
            booking.id
          );
        }
      }
    })();

    // Transactional email to customer — prompt deposit payment
    void (async () => {
      const { data: customerContact } = await db.from("profiles").select("email, full_name").eq("id", quote.customer_id).maybeSingle();
      if (customerContact?.email) {
        const { data: vendorInfo } = await db.from("vendors").select("business_name").eq("id", quote.vendor_id).maybeSingle();
        const { data: eventInfo } = await db.from("events").select("title, date").eq("id", quote.event_id).maybeSingle();
        const { sendBookingAwaitingPayment } = await import("@/lib/resend");
        void sendBookingAwaitingPayment(
          customerContact.email,
          customerContact.full_name ?? "there",
          vendorInfo?.business_name ?? "your vendor",
          eventInfo?.title ?? "your event",
          eventInfo?.date ?? null,
          booking.deposit_amount,
          booking.id
        );
      }
    })();

    return NextResponse.json({ booking });
  }

  // ── CUSTOMER: reject a specific vendor's quote ───────────────────────────
  if (action === "reject" && isCustomer) {
    const reason = body.reason ? String(body.reason) : null;
    await supabase.from("quotes")
      .update({ status: "rejected", rejected_at: new Date().toISOString(),
        customer_rejection_reason: reason })
      .eq("id", id);

    void db.from("quote_events").insert({
      quote_id: id, actor_id: user.id, actor_role: "customer",
      event_type: "rejected", details: { reason },
    });
    void track({ event: "quote.rejected", userId: user.id, properties: { quote_id: id } });

    // Notify vendor by email that their quote was not selected
    void (async () => {
      const { data: vendorUser } = await db.from("vendors").select("user_id").eq("id", quote.vendor_id).maybeSingle();
      if (vendorUser?.user_id) {
        const { data: vendorContact } = await db.from("profiles").select("email, full_name").eq("id", vendorUser.user_id).maybeSingle();
        if (vendorContact?.email) {
          const { sendQuoteRejectedToVendor } = await import("@/lib/resend");
          const { data: customerProfile } = await db.from("profiles").select("full_name").eq("id", quote.customer_id).maybeSingle();
          void sendQuoteRejectedToVendor(
            vendorContact.email,
            vendorContact.full_name ?? "there",
            customerProfile?.full_name ?? "The customer",
            quote.event_type ?? "event"
          );
        }
      }
    })();

    return NextResponse.json({ success: true });
  }

  // ── CUSTOMER: withdraw request ───────────────────────────────────────────
  if (action === "withdraw" && isCustomer) {
    if (!["pending"].includes(quote.status)) {
      return NextResponse.json({ error: "Can only withdraw a pending quote request" }, { status: 400 });
    }
    const reason = body.reason ? String(body.reason) : null;
    await supabase.from("quotes")
      .update({ status: "withdrawn", withdrawn_at: new Date().toISOString(),
        customer_rejection_reason: reason })
      .eq("id", id);

    void db.from("quote_events").insert({
      quote_id: id, actor_id: user.id, actor_role: "customer",
      event_type: "withdrawn", details: { reason },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action or insufficient permissions" }, { status: 400 });
}
