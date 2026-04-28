import { auth } from "~/server/auth";

// Protects all /admin/* and /api/admin/* routes
export default auth((req) => {
  const isAdminRoute =
    req.nextUrl.pathname.startsWith("/admin") ||
    req.nextUrl.pathname.startsWith("/api/admin");

  if (isAdminRoute && !req.auth) {
    const loginUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"],
};
