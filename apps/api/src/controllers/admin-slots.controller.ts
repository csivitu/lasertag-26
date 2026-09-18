import type { Request, Response } from "express";

import { getSlotBookingsWithUsers, slotQueries } from "../data/queries";
import { NotFoundError } from "../errors";
import { makeSlotsService, type SlotInput, type SlotPatch } from "../services/slots";
import { slotController } from "./slot.controller";

const slots = makeSlotsService(slotQueries);

type SlotIdParams = { slot_id: string };

export const listSlots = async (_req: Request, res: Response) => {
  res.json(await slots.list());
};

export const getSlotBookings = async (req: Request<SlotIdParams>, res: Response) => {
  const data = await getSlotBookingsWithUsers(req.params.slot_id);
  if (!data) throw new NotFoundError("Slot not found");
  res.json(data);
};

/**
 * Super-admin manual booking into a hidden slot by reg number.
 * Signed-up + verified users only; rejects already-booked participants
 * instead of moving them.
 */
export const manualBookSlot = async (
  req: Request<SlotIdParams, unknown, { regNumber: string }>,
  res: Response,
) => {
  const booking = await slotController.manualBookSlot({
    slot_id: req.params.slot_id,
    regNumber: req.body.regNumber,
  });
  res.status(201).json({
    success: true,
    message: "Participant added to hidden slot.",
    data: booking,
  });
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
