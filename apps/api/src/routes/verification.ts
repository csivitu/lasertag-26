import { Router, Request, Response } from "express";
import { validateRequest } from "../middlewares/validate";
import { requireAdmin } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/errorHandler";
import {
  verifyRegistrationSchema,
  checkInSchema,
} from "../validations/verification.validation";
import { verificationController } from "../controllers/verification.controller";

const router = Router();

router.get(
  "/:registration_id",
  validateRequest(verifyRegistrationSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await verificationController.verifyRegistration(
      req.params.registration_id as string
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  })
);

router.post(
  "/check-in",
  requireAdmin,
  validateRequest(checkInSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await verificationController.checkInUser(req.body.identifier);
    res.status(200).json({
      success: true,
      message: result.already_checked_in
        ? "User is already checked in."
        : "User checked in successfully.",
      data: result.user,
    });
  })
);

export default router;
