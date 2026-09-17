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

slotsRouter.get("/", requireSuperAdmin, listSlots);
// Super admin only: list, create, update, delete. Plain admins have no
// slot-manager access (frontend hides the page; this enforces it).
slotsRouter.post("/", requireSuperAdmin, validate(createSlotSchema), createSlot);
slotsRouter.post("/bulk", requireSuperAdmin, validate(bulkCreateSlotsSchema), createSlots);
slotsRouter.patch("/:slot_id", requireSuperAdmin, validate(patchSlotSchema), updateSlot);
slotsRouter.delete("/:slot_id", requireSuperAdmin, validate(slotIdSchema), deleteSlot);
