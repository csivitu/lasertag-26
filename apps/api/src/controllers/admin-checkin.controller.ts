import type { Request, Response } from "express";

import { registrationService } from "../services/registrations";

export const scanCheckIn = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { identifier } = req.body;

  const result = await registrationService.scanRegistration(identifier as string);

  res.status(200).json({
    success: true,
    message: result.alreadyCheckedIn
      ? "User is already checked in."
      : "User checked in successfully.",
    data: result,
  });
};

export const adminCheckInController = {
  scanCheckIn,
};
