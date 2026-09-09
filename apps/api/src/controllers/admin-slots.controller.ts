import type { Request, Response } from "express";

import { slotQueries } from "../data/queries";
import { makeSlotsService, type SlotInput, type SlotPatch } from "../services/slots";

const slots = makeSlotsService(slotQueries);

type SlotIdParams = { slot_id: string };

export const listSlots = async (_req: Request, res: Response) => {
  res.json(await slots.list());
};

export const createSlot = async (
  req: Request<unknown, unknown, SlotInput>,
  res: Response,
) => {
  res.status(201).json(await slots.create(req.body));
};

export const createSlots = async (
  req: Request<unknown, unknown, SlotInput[]>,
  res: Response,
) => {
  res.status(201).json(await slots.createMany(req.body));
};

export const updateSlot = async (
  req: Request<SlotIdParams, unknown, SlotPatch>,
  res: Response,
) => {
  res.json(await slots.update(req.params.slot_id, req.body));
};

export const deleteSlot = async (req: Request<SlotIdParams>, res: Response) => {
  await slots.remove(req.params.slot_id);
  res.status(204).send();
};
