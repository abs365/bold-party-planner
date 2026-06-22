import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that require any authenticated session
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/vendor/apply",
  "/vendor/dashboard",
  "/vendor/profile",
  "/vendor/media",
  "/vendor/services",
  "/vendor/bookings",
  "/vendor/reviews",
  "/vendor/messages",
  "/vendor/quotes",
  "/vendor/analytics",
  "/vendor/subscription",
  "/vendor/availability",
  "/vendor/onboarding",
  "/vendor/verification",
  "/vendor/payouts",
  "/admin",
];

const ADMIN_PREFIXES = ["/admin"];
const AUTH_PAGES     = ["/login", "/signup"];

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — extends cookie expiry and populates response Set-Cookie
  const { data: { user } } = await supabase.auth.getUser();

  const isProtected  = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage   = AUTH_PAGES.some((p) => pathname === p);
  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));

  // 1. Unauthenticated → protected route: redirect to login
  if (isProtected && !user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 2. Authenticated → auth page: bounce to appropriate dashboard (or honour explicit redirect)
  if (isAuthPage && user) {
    // If the user was sent to the auth page to authenticate before reaching a specific destination,
    // return them there now that they are authenticated — regardless of role.
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    if (redirectParam && !AUTH_PAGES.some((p) => redirectParam.startsWith(p))) {
      return NextResponse.redirect(new URL(redirectParam, request.url));
    }

    if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email ?? "")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // user_metadata.role is set at signup and kept in sync by /api/vendor/apply and /api/auth/set-role.
    // This avoids a DB round-trip in middleware while still routing roles correctly.
    const metaRole = user.user_metadata?.role as string | undefined;
    if (metaRole === "vendor") {
      return NextResponse.redirect(new URL("/vendor/dashboard", request.url));
    }
    if (!metaRole) {
      // Role is missing — guide user to pick one before entering the app.
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Non-admin → admin route: redirect to customer dashboard
  if (isAdminRoute && user) {
    if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email ?? "")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 4. Vendor route access — two-tier model:
  //    OS routes  → accessible from application submission (pending + approved)
  //    Marketplace routes → approved only
  //    Apply and onboarding are always accessible.
  const VENDOR_ALWAYS_OPEN = ["/vendor/apply", "/vendor/onboarding"];
  const VENDOR_OS_PREFIXES = [
    "/vendor/dashboard",
    "/vendor/profile",
    "/vendor/media",
    "/vendor/services",
    "/vendor/contacts",
    "/vendor/customers",
    "/vendor/analytics",
    "/vendor/verification",
    "/vendor/availability",
    "/vendor/subscription",
  ];

  const isVendorRoute = pathname.startsWith("/vendor/");
  const isVendorAlwaysOpen = VENDOR_ALWAYS_OPEN.some((p) => pathname.startsWith(p));
  const isVendorOsRoute = VENDOR_OS_PREFIXES.some((p) => pathname.startsWith(p));

  if (isVendorRoute && !isVendorAlwaysOpen && user) {
    const metaRole = user.user_metadata?.role as string | undefined;
    if (metaRole === "vendor") {
      const { data: vendorRow } = await supabase
        .from("vendors")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (vendorRow) {
        const { status } = vendorRow;
        if (isVendorOsRoute) {
          // OS routes: accessible to pending and approved; redirect suspended/rejected
          if (status !== "approved" && status !== "pending") {
            return NextResponse.redirect(new URL("/vendor/onboarding", request.url));
          }
        } else {
          // Marketplace routes: approved only
          if (status !== "approved") {
            return NextResponse.redirect(new URL("/vendor/onboarding", request.url));
          }
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
