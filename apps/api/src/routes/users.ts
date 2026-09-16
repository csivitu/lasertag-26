import { Router } from "express";

import { getUserProfile, updateMyDetails } from "../controllers/users.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/errorHandler";
import { validate } from "../middlewares/validate";
import { updateMyDetailsSchema } from "../validations/users.validation";

export const usersRouter = Router();

/**
 * GET /users/me/profile
 * Returns profile details for the authenticated user along with their active registration.
 */
usersRouter.get(
  "/me/profile",
  requireAuth,
  asyncHandler(getUserProfile),
);

/**
 * PATCH /users/me/details
 * Saves select-mode onboarding fields (name, phone, reg_number) for the
 * authenticated user. Identity comes from the session, never the body.
 */
usersRouter.patch(
  "/me/details",
  requireAuth,
  validate(updateMyDetailsSchema),
  asyncHandler(updateMyDetails),
);
