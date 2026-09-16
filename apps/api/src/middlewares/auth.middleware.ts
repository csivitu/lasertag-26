import type { NextFunction, Request, RequestHandler, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { ForbiddenError, UnauthorizedError } from "../errors";
import { staffSessionHeaders } from "../auth-cookies";

export interface AuthenticatedUser {
  id: string;
  name?: string;
  email?: string;
  role?: string | null;
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

type Session = { user: AuthenticatedUser };
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;

/**
 * Identity comes from the signed better-auth session cookie, never from a
 * client-supplied header.
 *
 * The previous implementation read the user id straight out of `x-user-id` /
 * `Authorization: Bearer <user_id>` and looked it up — but a user id is a
 * database primary key, not a secret, and it is returned by the unauthenticated
 * team endpoints. Anyone holding an admin's id could therefore assume that
 * admin's identity. Verifying the session cookie is what actually proves the
 * caller authenticated.
 *
 * Factory so tests can inject a fake `getSession` — importing `../auth`
 * directly pulls in @lasertag-26/database, which throws without DATABASE_URL.
 */
export function makeRequireAuth(getSession: GetSession): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // fromNodeHeaders (not a hand-built Headers()) because IncomingHttpHeaders
    // values can be string[] (e.g. set-cookie), which Headers() rejects.
    const session = await getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) throw new UnauthorizedError();

    req.user = session.user;
    next();
  };
}

export function makeRequireAdmin(getSession: GetSession): RequestHandler {
  const authenticate = makeRequireAuth(getSession);

  return async (req: Request, res: Response, next: NextFunction) => {
    await authenticate(req, res, () => {});
    if (req.user?.role !== "admin" && req.user?.role !== "super_admin")
      throw new ForbiddenError();

    res.locals.user = req.user;
    next();
  };
}

/** Super admin only — full access (e.g. create/delete slots). */
export function makeRequireSuperAdmin(getSession: GetSession): RequestHandler {
  const authenticate = makeRequireAuth(getSession);

  return async (req: Request, res: Response, next: NextFunction) => {
    await authenticate(req, res, () => {});
    if (req.user?.role !== "super_admin") throw new ForbiddenError();

    res.locals.user = req.user;
    next();
  };
}

const getSession: GetSession = async (args) => {
  const { auth } = await import("../auth");
  return auth.api.getSession(args);
};

/**
 * Staff session reader: same as getSession, but accepts the `staff.*` cookie
 * namespace (translated back before better-auth sees it). Participant
 * session cookies are invisible here, and vice versa — the two sessions
 * cannot roam across apps even when sharing one cookie jar.
 */
const getStaffSession: GetSession = async (args) => {
  const { auth } = await import("../auth");
  return auth.api.getSession({ headers: staffSessionHeaders(args.headers) });
};

export const requireAuth = makeRequireAuth(getSession);
export const requireAdmin = makeRequireAdmin(getStaffSession);
export const requireSuperAdmin = makeRequireSuperAdmin(getStaffSession);
