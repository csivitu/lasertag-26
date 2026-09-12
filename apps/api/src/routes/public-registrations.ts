import { Router } from "express";

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
  validate(soloRegistrationSchema),
  asyncHandler(createSoloRegistration),
);

/**
 * POST /registrations/:reservation_id/confirm
 * Confirm a reservation and generate a QR token.
 */
publicRegistrationsRouter.post(
  "/:reservation_id/confirm",
  validate(confirmRegistrationSchema),
  asyncHandler(confirmRegistration),
);

/**
 * GET /registrations/:reservation_id
 * Get registration details by reservation ID (owner or admin).
 */
publicRegistrationsRouter.get(
  "/:reservation_id",
  requireAuth,
  validate(getRegistrationSchema),
  asyncHandler(getRegistration),
);

/**
 * GET /registrations/:reservation_id/qr
 * Get QR token details for a confirmed registration (owner or admin).
 */
publicRegistrationsRouter.get(
  "/:reservation_id/qr",
  requireAuth,
  validate(getRegistrationQrSchema),
  asyncHandler(getRegistrationQr),
);

/**
 * DELETE /registrations/:reservation_id
 * Cancel a registration (owner or admin).
 */
publicRegistrationsRouter.delete(
  "/:reservation_id",
  requireAuth,
  validate(cancelRegistrationSchema),
  asyncHandler(cancelRegistration),
);
