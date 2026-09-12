import { Router } from "express";

import { getUserProfile } from "../controllers/users.controller";
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
