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

  // 2. Authenticated → auth page: bounce to appropriate dashboard
  if (isAuthPage && user) {
    if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email ?? "")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Non-admin → admin route: redirect to customer dashboard
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
