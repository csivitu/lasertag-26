import rateLimit from "express-rate-limit";

/**
 * 10 requests per minute per IP.
 * Applied only to the two booking POST endpoints to protect against
 * thundering-herd load during mass concurrent slot reservations.
 */
export const bookingRateLimit = rateLimit({
  windowMs: 60 * 1_000,
  max: 10,
  standardHeaders: true,  // Return RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers
  message: {
    success: false,
    error: "Too many requests. Please wait a moment and try again.",
  },
});
