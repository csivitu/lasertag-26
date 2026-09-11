import { Router, type Request, type Response } from "express";

import { slotController } from "../controllers/slot.controller";
import { asyncHandler } from "../middlewares/errorHandler";
import { validateRequest } from "../middlewares/validate";
import { reserveSlotSchema } from "../validations/slot.validation";

/**
 * Public & Mobile Workstation Slot Endpoints.
 * Connected directly to Neon PostgreSQL database via Drizzle ORM.
 */
export const publicSlotsRouter = Router();

publicSlotsRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ success: true, data: await slotController.getAllSlots() });
  }),
);

publicSlotsRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const newSlot = await slotController.createSlot({
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      capacity: req.body.capacity || 10,
    });
    res.status(201).json({
      success: true,
      message: "Slot created successfully.",
      data: newSlot,
    });
  }),
);

publicSlotsRouter.delete(
  "/:slot_id",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await slotController.deleteSlot(req.params.slot_id as string);
    res.status(200).json({
      success: true,
      message: "Slot deleted successfully.",
      data: result,
    });
  }),
);

publicSlotsRouter.post(
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
  }),
);
