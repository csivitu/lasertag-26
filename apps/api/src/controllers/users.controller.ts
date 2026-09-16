import type { Request, Response } from "express";

import { UnauthorizedError } from "../errors";
import { userService } from "../services/users";

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

export const updateUserProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  const { name, regNo, phone } = req.body;
  const updated = await userService.updateUserProfile(req.user.id, {
    name,
    regNo,
    phone,
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    data: updated,
  });
};

export const usersController = {
  getUserProfile,
  updateUserProfile,
};
