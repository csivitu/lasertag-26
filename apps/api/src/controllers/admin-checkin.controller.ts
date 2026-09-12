import type { Request, Response } from "express";

import { registrationService } from "../services/registrations";

export const scanCheckIn = async (
  req: Request<Record<string, never>, unknown, { identifier: string }>,
  res: Response,
): Promise<void> => {
  const { identifier } = req.body;

  const result = await registrationService.scanRegistration(identifier);

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
