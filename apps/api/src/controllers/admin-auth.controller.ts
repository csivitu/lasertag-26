import type { Request, Response } from "express";

import { credentialQueries } from "../data/credentials";
import { userQueries } from "../data/queries";
import { toAuthCookieHeader } from "../auth-cookies";
import { env } from "../env";
import { UnauthorizedError } from "../errors";
import { makeAdminAuthService } from "../services/adminAuth";

const adminAuth = makeAdminAuthService({ ...credentialQueries, ...userQueries });

export const adminLogin = async (req: Request, res: Response) => {
  // Trimmed: mobile keyboards/autofill love appending a trailing space, and
  // staff passwords carry no meaningful edge whitespace (env vars are
  // trimmed at load too), so an exact match on raw input would reject
  // correct passwords for invisible reasons.
  const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";
  // Password-only login: the password itself selects the account.
  // Emails stay server-side (seeded from env) — staff never see them.
  const email =
    password === env.SUPER_ADMIN_PASSWORD
      ? env.SUPER_ADMIN_EMAIL
      : password === env.ADMIN_PASSWORD
        ? env.ADMIN_EMAIL
        : null;
  if (!email) {
    // Log which case failed server-side only; the client always gets a
    // generic 401 so a prober can't enumerate staff passwords.
    console.warn("Admin login rejected: password matched no staff account");
    throw new UnauthorizedError("Invalid password");
  }
  let result: { user: unknown; cookies: string[] };
  try {
    result = await adminAuth.login(email, password);
  } catch (err) {
    // Env password matched but the stored better-auth hash didn't (e.g. the
    // password was changed after seeding — see seedAdmins RESET flag).
    console.warn(`Admin login rejected for a known staff slot: ${err instanceof Error ? err.message : "unauthorized"}`);
    throw err;
  }
  // Single first-party session cookie (better-auth.*), shared by the whole
  // single-domain deployment. The staff role is enforced by requireAdmin, not
  // by a separate cookie namespace.
  result.cookies.forEach((cookie) => res.append("Set-Cookie", cookie));
  res.json({ message: "Admin login successful", user: result.user });
};

export const adminMe = async (req: Request, res: Response) => {
  res.json({ user: req.user });
};

export const adminLogout = async (req: Request, res: Response) => {
  // Accept both the current better-auth.* cookies and legacy staff.* cookies
  // (pre-revamp browsers may still hold them) so logout always clears.
  const raw = req.headers.cookie;
  const translated = toAuthCookieHeader(raw);
  const combined =
    raw && translated && translated !== raw ? `${raw}; ${translated}` : (translated ?? raw);
  const { cookies } = await adminAuth.logout(combined);
  cookies.forEach((cookie) => res.append("Set-Cookie", cookie));
  res.json({ message: "Admin logout successful" });
};
