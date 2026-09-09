import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

/**
 * Middleware: requireAuth
 * Allows any authenticated user (including admins) to proceed.
 * Attaches the BetterAuth session to res.locals.session.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    res.locals.session = session;
    next();
}

/**
 * Middleware: requireAdmin
 * Only allows users with role="admin" to proceed.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const user = session.user as typeof session.user & { role?: string };
    if (user.role !== "admin") {
        res.status(403).json({ error: "Forbidden: admin access required" });
        return;
    }
    res.locals.session = session;
    next();
}
