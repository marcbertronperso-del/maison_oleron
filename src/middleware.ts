import { type NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isLoginPage = pathname === "/admin/login";

  if (!isAdminRoute || isLoginPage) return NextResponse.next();

  // Auth.js v5 stores session in "authjs.session-token" (dev) or
  // "__Secure-authjs.session-token" (prod/HTTPS).
  // Cookie existence is sufficient here — each server component and API route
  // independently calls auth() which fully validates the JWT with AUTH_SECRET.
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"],
};
