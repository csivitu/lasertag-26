import { Router } from "express";

import {
  createSlot,
  createSlots,
  deleteSlot,
  listSlots,
  updateSlot,
} from "../controllers/slots.controller";
import { validate } from "../middleware/validate";
import {
  bulkCreateSlotsSchema,
  createSlotSchema,
  patchSlotSchema,
  slotIdSchema,
} from "../validations/slot.validation";

export const slotsRouter = Router();

slotsRouter.get("/", listSlots);
slotsRouter.post("/", validate(createSlotSchema), createSlot);
slotsRouter.post("/bulk", validate(bulkCreateSlotsSchema), createSlots);
slotsRouter.patch("/:slot_id", validate(patchSlotSchema), updateSlot);
slotsRouter.delete("/:slot_id", validate(slotIdSchema), deleteSlot);
