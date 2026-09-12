import { Router, type Request, type Response } from "express";

import { slotController } from "../controllers/slot.controller";
import { asyncHandler } from "../middlewares/errorHandler";
import { validateRequest } from "../middlewares/validate";
import { reserveSlotSchema } from "../validations/slot.validation";

/**
 * Participant-facing slots, carried over from `dev`. Admin slot CRUD lives at
 * /admin/slots (routes/admin.ts) behind the session gate — `dev`'s POST / and
 * DELETE /:slot_id are dropped here rather than duplicated, since that router
 * also covers bulk create, patch, and the capacity-vs-bookings rule.
 */
export const publicSlotsRouter = Router();

publicSlotsRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ success: true, data: await slotController.getAllSlots() });
  }),
);

publicSlotsRouter.post(
  "/:slot_id/reserve",
  validateRequest(reserveSlotSchema),
  asyncHandler(async (req: Request<{ slot_id: string }, unknown, { user_id: string; type: "individual" | "team"; team_code?: string }>, res: Response): Promise<void> => {
    const newBooking = await slotController.reserveSlot({
      slot_id: req.params.slot_id,
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
