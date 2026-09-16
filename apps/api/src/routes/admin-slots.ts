import { Router } from "express";

import {
  createSlot,
  createSlots,
  deleteSlot,
  listSlots,
  updateSlot,
} from "../controllers/admin-slots.controller";
import { requireSuperAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import {
  bulkCreateSlotsSchema,
  createSlotSchema,
  patchSlotSchema,
  slotIdSchema,
} from "../validations/slot.validation";

export const slotsRouter = Router();

slotsRouter.get("/", listSlots);
// Super admin only: create + delete. Both roles can list, patch, verify/scan.
slotsRouter.post("/", requireSuperAdmin, validate(createSlotSchema), createSlot);
slotsRouter.post("/bulk", requireSuperAdmin, validate(bulkCreateSlotsSchema), createSlots);
slotsRouter.patch("/:slot_id", validate(patchSlotSchema), updateSlot);
slotsRouter.delete("/:slot_id", requireSuperAdmin, validate(slotIdSchema), deleteSlot);
