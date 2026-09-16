/**
 * Staff session cookie isolation.
 *
 * Participant and staff sessions share one better-auth instance (and, on
 * localhost, one cookie jar across ports — cookies are host-scoped). Without
 * this, a staff login in the admin panel would also authenticate the holder
 * as that staff user on the participant web app, and vice versa.
 *
 * Fix: staff flows use a `staff.*` cookie namespace. better-auth itself only
 * knows `better-auth.*`, so we translate at the admin boundary —
 * outgoing Set-Cookie on login/logout, incoming Cookie header on every
 * staff-guarded request. Participant flows never see or send `staff.*`
 * cookies, and staff guards never read `better-auth.*` ones.
 */
const AUTH_COOKIE_PREFIX = "better-auth.";
export const STAFF_COOKIE_PREFIX = "staff.";

/** Outgoing: rewrite better-auth Set-Cookie names into the staff namespace. */
export function toStaffSetCookies(cookies: string[]): string[] {
  return cookies.map((cookie) => {
    const eq = cookie.indexOf("=");
    const end = eq < 0 ? cookie.length : eq;
    const name = cookie.slice(0, end);
    if (!name.startsWith(AUTH_COOKIE_PREFIX)) return cookie;
    return STAFF_COOKIE_PREFIX + cookie.slice(AUTH_COOKIE_PREFIX.length);
  });
}

/** Incoming: rewrite staff cookie names back to what better-auth expects. */
export function toAuthCookieHeader(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return cookieHeader;
  return cookieHeader
    .split(";")
    .map((pair, index) => {
      // Join separator supplies the single space after ";" — drop each
      // subsequent pair's own leading whitespace to avoid doubling it.
      const segment = index === 0 ? pair : pair.trimStart();
      const eq = segment.indexOf("=");
      const name = (eq < 0 ? segment : segment.slice(0, eq)).trim();
      if (!name.startsWith(STAFF_COOKIE_PREFIX)) return segment;
      return `${AUTH_COOKIE_PREFIX}${name.slice(STAFF_COOKIE_PREFIX.length)}${eq < 0 ? "" : segment.slice(eq)}`;
    })
    .join("; ");
}

/** Apply the incoming translation to a Headers object in place. */
export function staffSessionHeaders(headers: Headers): Headers {
  const cookie = headers.get("cookie");
  const translated = toAuthCookieHeader(cookie ?? undefined);
  if (translated) headers.set("cookie", translated);
  return headers;
}
