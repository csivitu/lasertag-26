import type { NextFunction, Request, Response } from "express";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
};

/**
 * Minimal in-memory sliding-window limiter. Single-process Map keyed by IP.
 * Good enough for one EC2 instance; use Redis if multi-instance.
 */
function createRateLimiter({ windowMs, max, message }: RateLimitOptions) {
  const hits = new Map<string, number[]>();

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

    if (recent.length >= max) {
      res.status(429).json({ error: message });
      return;
    }

    recent.push(now);
    hits.set(key, recent);
    next();
  };
}

/** Password-only staff login: 20 attempts per 10 minutes, then 429. */
export const loginRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Too many login attempts, try again later",
});

/** Booking hot path: 30 requests per minute per IP, then 429. */
export const bookingRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many booking requests, try again shortly",
});
