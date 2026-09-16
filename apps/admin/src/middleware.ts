import { NextResponse, type NextRequest } from "next/server";

// Server-side address (runtime env). The browser never calls this host
// directly anymore — it goes same-origin through /api/* (see next.config).
// INTERNAL_API_URL / API_INTERNAL_URL take precedence for single-domain
// deployments where the API is reachable over the internal network.
const API_BASE =
  process.env.INTERNAL_API_URL ??
  process.env.API_INTERNAL_URL ??
  process.env.ADMIN_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

/**
 * Password-gates every admin page server-side, before any HTML renders.
 * Not a second auth system: it forwards the request cookies to the API's
 * GET /admin-auth/me (which enforces requireAdmin for both staff roles)
 * and only lets the navigation through on 200.
 *
 * Two distinct failures, two destinations — previously both looked like
 * "password not accepted":
 * - 401/403 (bad or expired session) -> plain /login.
 * - API unreachable / timeout -> /login?reason=unavailable with a banner,
 *   so staff know to retry instead of retyping the password.
 */
export async function middleware(request: NextRequest) {
  const cookie = request.headers.get("cookie");

  try {
    const res = await fetch(`${API_BASE}/admin-auth/me`, {
      headers: cookie ? { cookie } : {},
      cache: "no-store",
      // Cold API + sleeping DB can exceed 5s on first hit; 10s avoids
      // bouncing a valid session back to /login on wake-up.
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  } catch {
    // Fail closed: no verified session, no page — but say why.
    return NextResponse.redirect(new URL("/login?reason=unavailable", request.url));
  }
}

export const config = {
  // Everything except the API proxy, /login, Next internals, and static files.
  // /api/* must pass through untouched: middleware runs BEFORE rewrites, so
  // gating it here would redirect API calls (POST /api/... replays as POST
  // /login -> 405) instead of proxying them.
  matcher: ["/((?!api|login|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
