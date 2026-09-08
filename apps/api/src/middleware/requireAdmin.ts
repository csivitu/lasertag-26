import type { NextFunction, Request, RequestHandler, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../auth";
import { ForbiddenError, UnauthorizedError } from "../errors";

type Session = { user: { id: string; role?: string | null } };
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;

/**
 * Factory so tests can inject a fake `getSession` — importing `../auth`
 * directly pulls in @lasertag-26/database, which throws without DATABASE_URL.
 */
export function makeRequireAdmin(getSession: GetSession): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // fromNodeHeaders (not a hand-built Headers()) because IncomingHttpHeaders
    // values can be string[] (e.g. set-cookie), which the Headers constructor
    // rejects outright.
    const session = await getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) throw new UnauthorizedError();
    if (session.user.role !== "admin") throw new ForbiddenError();

    res.locals.user = session.user;
    next();
  };
}

export const requireAdmin = makeRequireAdmin((args) => auth.api.getSession(args));
