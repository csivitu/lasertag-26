import { Router } from "express";

import { scanCheckIn } from "../controllers/admin-checkin.controller";
import { asyncHandler } from "../middlewares/errorHandler";
import { validateRequest } from "../middlewares/validate";
import { checkInSchema } from "../validations/verification.validation";

export const adminCheckInRouter = Router();

/**
 * POST /admin/checkin/scan
 * Scan a QR token or registration ID to check in a participant.
 */
adminCheckInRouter.post(
  "/scan",
  validateRequest(checkInSchema),
  asyncHandler(scanCheckIn),
);
