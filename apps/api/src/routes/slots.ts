import { Router, Request, Response } from "express";
import { validateRequest } from "../middlewares/validate";
import { requireAdmin } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/errorHandler";
import {
  reserveSlotSchema,
  createSlotSchema,
  deleteSlotSchema,
} from "../schemas/slot.schema";
import { slotController } from "../controllers/slot.controller";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const allSlots = await slotController.getAllSlots();
    res.status(200).json({
      success: true,
      data: allSlots,
    });
  })
);

router.post(
  "/",
  requireAdmin,
  validateRequest(createSlotSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const createdSlot = await slotController.createSlot(req.body);
    res.status(201).json({
      success: true,
      message: "Slot created successfully.",
      data: createdSlot,
    });
  })
);

router.delete(
  "/:slot_id",
  requireAdmin,
  validateRequest(deleteSlotSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await slotController.deleteSlot(req.params.slot_id as string);
    res.status(200).json({
      success: true,
      message: "Slot deleted successfully.",
      data: result,
    });
  })
);

router.post(
  "/:slot_id/reserve",
  validateRequest(reserveSlotSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const newBooking = await slotController.reserveSlot({
      slot_id: req.params.slot_id as string,
      user_id: req.body.user_id,
      type: req.body.type,
      team_code: req.body.team_code,
    });

    res.status(201).json({
      success: true,
      message: "Slot reserved successfully.",
      data: newBooking,
    });
  })
);

export default router;
