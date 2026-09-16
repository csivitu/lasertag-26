import { NextResponse, type NextRequest } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Password-gates every admin page server-side, before any HTML renders.
 * Not a second auth system: it forwards the request cookies to the API's
 * GET /admin-auth/me (which enforces requireAdmin for both staff roles)
 * and only lets the navigation through on 200. Anything else — 401, 403,
 * API unreachable — fails closed to /login.
 */
export async function middleware(request: NextRequest) {
  const cookie = request.headers.get("cookie");

  try {
    const res = await fetch(`${API_BASE}/admin-auth/me`, {
      headers: cookie ? { cookie } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return NextResponse.next();
  } catch {
    // Fail closed: no verified session, no page.
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Everything except /login, Next internals, and static/file requests.
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
