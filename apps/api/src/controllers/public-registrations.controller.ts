import type { Request, Response } from "express";

import { UnauthorizedError } from "../errors";
import { registrationService } from "../services/registrations";
import { slotController } from "./slot.controller";

export const createSoloRegistration = async (
  req: Request<Record<string, never>, unknown, { slot_id: string }>,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  const { slot_id } = req.body;
  const booking = await slotController.reserveSlot({
    slot_id,
    user_id: req.user.id,
    type: "individual",
  });

  res.status(201).json({
    success: true,
    message: "Solo registration created successfully.",
    data: booking,
  });
};

export const confirmRegistration = async (
  req: Request<{ reservation_id: string }>,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  const { reservation_id } = req.params;
  const result = await registrationService.confirmRegistration(
    reservation_id,
    req.user.id,
  );

  res.status(200).json({
    success: true,
    message: result.alreadyConfirmed
      ? "Registration was already confirmed."
      : "Registration confirmed successfully.",
    data: result,
  });
};

export const getRegistration = async (
  req: Request<{ reservation_id: string }>,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  const { reservation_id } = req.params;
  const registration = await registrationService.getRegistration(
    reservation_id,
    req.user.id,
  );

  res.status(200).json({
    success: true,
    data: registration,
  });
};

export const getRegistrationQr = async (
  req: Request<{ reservation_id: string }>,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  const { reservation_id } = req.params;
  const qrData = await registrationService.getRegistrationQr(
    reservation_id,
    req.user.id,
  );

  res.status(200).json({
    success: true,
    data: qrData,
  });
};

export const cancelRegistration = async (
  req: Request<{ reservation_id: string }>,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  const { reservation_id } = req.params;
  const result = await registrationService.cancelRegistration(
    reservation_id,
    req.user.id,
  );

  res.status(200).json({
    success: true,
    message: "Registration cancelled successfully.",
    data: result,
  });
};

export const publicRegistrationsController = {
  createSoloRegistration,
  confirmRegistration,
  getRegistration,
  getRegistrationQr,
  cancelRegistration,
};
