import { Router } from "express";

import { bookingRateLimit } from "../middlewares/rateLimit";
import {
  createSoloRegistration,
  confirmRegistration,
  getRegistration,
  getRegistrationQr,
  cancelRegistration,
} from "../controllers/public-registrations.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/errorHandler";
import { validate } from "../middlewares/validate";
import {
  soloRegistrationSchema,
  confirmRegistrationSchema,
  getRegistrationSchema,
  getRegistrationQrSchema,
  cancelRegistrationSchema,
} from "../validations/registration.validation";

export const publicRegistrationsRouter = Router();

/**
 * POST /registrations/solo
 * Create a solo (individual) registration for a slot.
 */
publicRegistrationsRouter.post(
  "/solo",
  requireAuth,
  bookingRateLimit,
  validate(soloRegistrationSchema),
  asyncHandler(createSoloRegistration),
);

/**
 * POST /registrations/:reservation_id/confirm
 * Confirm a reservation and generate a QR token.
 */
publicRegistrationsRouter.post(
  "/:reservation_id/confirm",
  requireAuth,
  bookingRateLimit,
  validate(confirmRegistrationSchema),
  asyncHandler(confirmRegistration),
);

/**
 * GET /registrations/:reservation_id
 * Get registration details for the authenticated owner.
 */
publicRegistrationsRouter.get(
  "/:reservation_id",
  requireAuth,
  validate(getRegistrationSchema),
  asyncHandler(getRegistration),
);

/**
 * GET /registrations/:reservation_id/qr
 * Get QR token details for the authenticated owner.
 */
publicRegistrationsRouter.get(
  "/:reservation_id/qr",
  requireAuth,
  validate(getRegistrationQrSchema),
  asyncHandler(getRegistrationQr),
);

/**
 * DELETE /registrations/:reservation_id
 * Cancel a registration for the authenticated owner.
 */
publicRegistrationsRouter.delete(
  "/:reservation_id",
  requireAuth,
  validate(cancelRegistrationSchema),
  asyncHandler(cancelRegistration),
);
