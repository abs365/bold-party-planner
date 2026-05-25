import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that require any authenticated session
const PROTECTED_PREFIXES = [
  "/dashboard",
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
  "/admin",
];

// Routes that only admin emails can visit
const ADMIN_PREFIXES = ["/admin"];

// Auth pages — logged-in users should be bounced to their dashboard
const AUTH_PAGES = ["/login", "/signup"];

// Admin emails from env (comma-separated)
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

  // Refresh session (extends expiry, sets refreshed cookies in response)
  const { data: { user } } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p);
  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));

  // 1. Unauthenticated user hitting a protected route → login
  if (isProtected && !user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 2. Authenticated user hitting /login or /signup → bounce to their dashboard
  if (isAuthPage && user) {
    // We can't do a DB query here without extra latency, so check email for admin
    if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email ?? "")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // Default: send to customer dashboard (vendor dashboard is linked from there)
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Admin-only route: check email (consistent with page-level checks)
  if (isAdminRoute && user) {
    if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email ?? "")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
