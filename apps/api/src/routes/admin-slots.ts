import { Router } from "express";

import {
  createSlot,
  createSlots,
  deleteSlot,
  getSlotBookings,
  listSlots,
  updateSlot,
} from "../controllers/admin-slots.controller";
import { requireAdmin, requireSuperAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import {
  bulkCreateSlotsSchema,
  createSlotSchema,
  patchSlotSchema,
  slotIdSchema,
} from "../validations/slot.validation";

export const slotsRouter = Router();

// Staff access (admin and super_admin): view slots and slot bookings
slotsRouter.get("/", requireAdmin, listSlots);
slotsRouter.get("/:slot_id/bookings", requireAdmin, validate(slotIdSchema), getSlotBookings);

// Super admin only: create, update, delete
slotsRouter.post("/", requireSuperAdmin, validate(createSlotSchema), createSlot);
slotsRouter.post("/bulk", requireSuperAdmin, validate(bulkCreateSlotsSchema), createSlots);
slotsRouter.patch("/:slot_id", requireSuperAdmin, validate(patchSlotSchema), updateSlot);
slotsRouter.delete("/:slot_id", requireSuperAdmin, validate(slotIdSchema), deleteSlot);

