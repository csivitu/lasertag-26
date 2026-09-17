import type { NextFunction, Request, Response } from "express";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
};

function defaultKeyGenerator(req: Request): string {
  // If user is authenticated, rate limit per user session so multiple
  // students sharing campus Wi-Fi / NAT IP don't lock each other out.
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

/**
 * Minimal in-memory sliding-window limiter.
 * Keys by authenticated user session (or IP fallback).
 * Good enough for one instance; use Redis if multi-instance.
 */
function createRateLimiter({ windowMs, max, message, keyGenerator = defaultKeyGenerator }: RateLimitOptions) {
  const hits = new Map<string, number[]>();

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = keyGenerator(req);
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

    if (recent.length >= max) {
      res.set("Retry-After", String(Math.ceil(windowMs / 1000)));
      res.status(429).json({ error: message });
      return;
    }

    recent.push(now);
    hits.set(key, recent);
    next();
  };
}

/** Password-only staff login: 20 attempts per minute per IP, then 429. */
export const loginRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many login attempts, try again later",
  keyGenerator: (req) => req.ip ?? req.socket.remoteAddress ?? "unknown",
});

/** Booking hot path: 30 requests per minute per user session (or IP fallback), then 429. */
export const bookingRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many booking requests, try again shortly",
});
