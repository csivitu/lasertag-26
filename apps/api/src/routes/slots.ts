import { Router, type Request, type Response } from "express";

import { slotController } from "../controllers/slot.controller";
import { asyncHandler } from "../middlewares/errorHandler";
import { bookingRateLimit } from "../middlewares/rateLimit";
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
  bookingRateLimit,
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
  bookingRateLimit,
  validateRequest(reserveSlotSchema),
  asyncHandler(async (req: Request<{ slot_id: string }, unknown, { user_id: string; type: "individual" | "team"; team_code?: string; side?: "red" | "blue" }>, res: Response): Promise<void> => {
    const newBooking = await slotController.reserveSlot({
      slot_id: req.params.slot_id,
      user_id: req.body.user_id,
      type: req.body.type,
      team_code: req.body.team_code,
      side: req.body.side,
    });
    res.status(201).json({
      success: true,
      message: "Slot reserved successfully.",
      data: newBooking,
    });
  }),
);
