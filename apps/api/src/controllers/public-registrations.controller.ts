import type { Request, Response } from "express";

import { UnauthorizedError } from "../errors";
import { registrationService } from "../services/registrations";

export const createSoloRegistration = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  const { slot_id } = req.body;
  const booking = await registrationService.createSoloRegistration(
    req.user.id,
    slot_id as string,
  );

  res.status(201).json({
    success: true,
    message: "Solo registration created successfully.",
    data: booking,
  });
};

export const confirmRegistration = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const reservation_id = req.params.reservation_id as string;
  const result = await registrationService.confirmRegistration(reservation_id);

  res.status(200).json({
    success: true,
    message: result.alreadyConfirmed
      ? "Registration was already confirmed."
      : "Registration confirmed successfully.",
    data: result,
  });
};

export const getRegistration = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  const reservation_id = req.params.reservation_id as string;
  const requester = {
    id: req.user.id,
    role: req.user.role ?? "user",
  };

  const registration = await registrationService.getRegistration(
    reservation_id,
    requester,
  );

  res.status(200).json({
    success: true,
    data: registration,
  });
};

export const getRegistrationQr = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  const reservation_id = req.params.reservation_id as string;
  const requester = {
    id: req.user.id,
    role: req.user.role ?? "user",
  };

  const qrData = await registrationService.getRegistrationQr(
    reservation_id,
    requester,
  );

  res.status(200).json({
    success: true,
    data: qrData,
  });
};

export const cancelRegistration = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  const reservation_id = req.params.reservation_id as string;
  const requester = {
    id: req.user.id,
    role: req.user.role ?? "user",
  };

  const result = await registrationService.cancelRegistration(
    reservation_id,
    requester,
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
