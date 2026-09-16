import { Router } from "express";

import { getUserProfile, updateUserProfile } from "../controllers/users.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/errorHandler";

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
 * PATCH /users/me
 * Updates user profile details directly in the database (name, regNo, phone).
 */
usersRouter.patch(
  "/me",
  requireAuth,
  asyncHandler(updateUserProfile),
);
