import { Router, type Request, type Response } from "express";

import { slotController } from "../controllers/slot.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/errorHandler";
import { bookingRateLimit } from "../middlewares/rateLimit";
import { validateRequest } from "../middlewares/validate";
import { listSlotsSchema, reserveSlotSchema } from "../validations/slot.validation";

/**
 * Public & Mobile Workstation Slot Endpoints.
 * Read + reserve only. Mutations (create/delete) live under /admin/slots
 * behind requireSuperAdmin — leaving them here would bypass RBAC entirely.
 */
export const publicSlotsRouter = Router();

publicSlotsRouter.get(
  "/",
  validateRequest(listSlotsSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { limit = 200, offset = 0 } = req.query as unknown as {
      limit?: number;
      offset?: number;
    };
    res.status(200).json({ success: true, data: await slotController.getAllSlots({ limit, offset }) });
  }),
);

publicSlotsRouter.post(
  "/:slot_id/reserve",
  requireAuth,
  bookingRateLimit,
  validateRequest(reserveSlotSchema),
  asyncHandler(async (req: Request<{ slot_id: string }, unknown, { type: "individual" | "team"; team_code?: string }>, res: Response): Promise<void> => {
    const newBooking = await slotController.reserveSlot({
      slot_id: req.params.slot_id,
      // Identity from the verified session, never the client body.
      user_id: req.user!.id,
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
