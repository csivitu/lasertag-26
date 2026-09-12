import { db } from "@lasertag-26/database";
import { slots, bookings, user, teams } from "@lasertag-26/database/schema";
import { eq } from "drizzle-orm";
import { HttpError as AppError } from "../errors";

import type { ReserveSlotInput } from "../validations/slot.validation";

export interface CreateSlotInput {
  startTime: string;
  endTime: string;
  capacity: number;
}

export const slotController = {
  async getAllSlots() {
    return db.select().from(slots);
  },

  async createSlot(input: CreateSlotInput) {
    const [newSlot] = await db
      .insert(slots)
      .values({
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        capacity: input.capacity,
      })
      .returning();

    return newSlot;
  },

  async deleteSlot(slotId: string) {
    const [existingSlot] = await db
      .select()
      .from(slots)
      .where(eq(slots.id, slotId));

    if (!existingSlot) {
      throw new AppError(404, "Slot not found.");
    }

    await db.delete(slots).where(eq(slots.id, slotId));
    return { id: slotId, deleted: true };
  },

  async reserveSlot(input: ReserveSlotInput) {
    const { slot_id, user_id, type, team_code } = input;

    const [targetSlot] = await db
      .select()
      .from(slots)
      .where(eq(slots.id, slot_id));

    if (!targetSlot) {
      throw new AppError(404, "Slot not found.");
    }

    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, user_id));

    if (!targetUser) {
      throw new AppError(404, "User not found.");
    }

    if (type === "team") {
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.teamCode, team_code!));

      if (!team) {
        throw new AppError(404, "Team not found.");
      }
    }

    const bookingId = `BKG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [newBooking] = await db
      .insert(bookings)
      .values({
        id: bookingId,
        type,
        userId: user_id,
        teamCode: type === "team" ? (team_code ?? null) : null,
        slotId: slot_id,
        confirmationEmailSent: false,
      })
      .returning();

    return newBooking;
  },
};

export const slotService = slotController;
