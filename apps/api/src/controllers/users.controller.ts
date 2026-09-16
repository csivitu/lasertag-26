import type { Request, Response } from "express";

import { UnauthorizedError } from "../errors";
import { userService } from "../services/users";
import type { UpdateMyDetailsInput } from "../validations/users.validation";

export const getUserProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  const profile = await userService.getUserProfile(req.user.id);

  res.status(200).json({
    success: true,
    data: profile,
  });
};

export const updateMyDetails = async (
  req: Request<unknown, unknown, UpdateMyDetailsInput>,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  const updated = await userService.updateMyDetails(req.user.id, req.body);

  res.status(200).json({
    success: true,
    data: updated,
  });
};

export const usersController = {
  getUserProfile,
  updateMyDetails,
};
