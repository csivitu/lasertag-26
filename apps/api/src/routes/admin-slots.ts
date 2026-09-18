import { Router } from "express";

import {
  createSlot,
  createSlots,
  deleteSlot,
  getSlotBookings,
  listSlots,
  manualBookSlot,
  updateSlot,
} from "../controllers/admin-slots.controller";
import { requireAdmin, requireSuperAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import {
  bulkCreateSlotsSchema,
  createSlotSchema,
  manualBookSlotSchema,
  patchSlotSchema,
  slotIdSchema,
} from "../validations/slot.validation";

export const slotsRouter = Router();

// Staff access (admin and super_admin): view slots and slot bookings
slotsRouter.get("/", requireAdmin, listSlots);
slotsRouter.get("/:slot_id/bookings", requireAdmin, validate(slotIdSchema), getSlotBookings);

// Super admin only: create, update, delete, manual hidden-slot booking
slotsRouter.post("/", requireSuperAdmin, validate(createSlotSchema), createSlot);
slotsRouter.post("/bulk", requireSuperAdmin, validate(bulkCreateSlotsSchema), createSlots);
slotsRouter.post(
  "/:slot_id/manual-book",
  requireSuperAdmin,
  validate(manualBookSlotSchema),
  manualBookSlot,
);
slotsRouter.patch("/:slot_id", requireSuperAdmin, validate(patchSlotSchema), updateSlot);
slotsRouter.delete("/:slot_id", requireSuperAdmin, validate(slotIdSchema), deleteSlot);

