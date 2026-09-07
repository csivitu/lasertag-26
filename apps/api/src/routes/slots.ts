import { Router } from "express";

import { slotQueries } from "../data/queries";
import {
  bulkCreateSlotsSchema,
  createSlotSchema,
  patchSlotSchema,
  slotIdParamsSchema,
} from "../schemas/slots";
import { makeSlotsService } from "../services/slots";

const slots = makeSlotsService(slotQueries);

export const slotsRouter = Router();

// Handlers stay `async` with no try/catch: Express 5 forwards rejections
// (including the ZodError from .parse) to the error middleware.

slotsRouter.get("/", async (_req, res) => {
  res.json(await slots.list());
});

slotsRouter.post("/", async (req, res) => {
  const input = createSlotSchema.parse(req.body);
  res.status(201).json(await slots.create(input));
});

slotsRouter.post("/bulk", async (req, res) => {
  const inputs = bulkCreateSlotsSchema.parse(req.body);
  res.status(201).json(await slots.createMany(inputs));
});

slotsRouter.patch("/:slot_id", async (req, res) => {
  const { slot_id } = slotIdParamsSchema.parse(req.params);
  const patch = patchSlotSchema.parse(req.body);
  res.json(await slots.update(slot_id, patch));
});

slotsRouter.delete("/:slot_id", async (req, res) => {
  const { slot_id } = slotIdParamsSchema.parse(req.params);
  await slots.remove(slot_id);
  res.status(204).send();
});
