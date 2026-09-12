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

export const usersController = {
  getUserProfile,
};
