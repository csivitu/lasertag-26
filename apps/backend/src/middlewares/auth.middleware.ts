import { Request, Response, NextFunction } from 'express';
import { db } from '../../../../packages/database';
import { user } from '../../../../packages/database/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string | null;
  phNumber?: string | null;
  qrToken?: string | null;
  isCheckedIn?: boolean | null;
  paid?: boolean | null;
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

/**
 * Middleware to authenticate requests.
 * Accepts user ID from:
 * 1. Authorization header: "Bearer <user_id>"
 * 2. Custom header: "x-user-id: <user_id>"
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let userId: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7).trim();
    } else if (req.headers['x-user-id']) {
      userId = String(req.headers['x-user-id']).trim();
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing authentication credentials (x-user-id or Authorization header required).',
      });
      return;
    }

    const [foundUser] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phNumber: user.phNumber,
        qrToken: user.qrToken,
        isCheckedIn: user.isCheckedIn,
        paid: user.paid,
      })
      .from(user)
      .where(eq(user.id, userId));

    if (!foundUser) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: User not found or invalid token.',
      });
      return;
    }

    req.user = foundUser;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to restrict endpoints to admin users only.
 * Must be used after requireAuth or will execute requireAuth automatically.
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    await requireAuth(req, res, (err?: unknown) => {
      if (err) return next(err);
      if (!res.headersSent) {
        checkAdminRole(req, res, next);
      }
    });
  } else {
    checkAdminRole(req, res, next);
  }
}

function checkAdminRole(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Admin authorization required to access this resource.',
    });
    return;
  }
  next();
}
