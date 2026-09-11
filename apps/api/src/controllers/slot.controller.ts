import { db } from "@lasertag-26/database";
import { slots, bookings, user, teams } from "@lasertag-26/database/schema";
import { eq, gte, lte, and, asc } from "drizzle-orm";
import { HttpError as AppError } from "../errors";

export interface ReserveSlotInput {
  slot_id: string;
  user_id: string;
  type: "individual" | "team";
  team_code?: string;
}

export interface CreateSlotInput {
  startTime: string;
  endTime: string;
  capacity: number;
}

export const slotController = {
  async getAllSlots() {
    return db.select().from(slots).orderBy(asc(slots.startTime));
  },

  async createSlot(input: CreateSlotInput) {
    const slotDate = new Date(input.startTime);
    const startOfDay = new Date(slotDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(slotDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingSlotsToday = await db
      .select()
      .from(slots)
      .where(and(gte(slots.startTime, startOfDay), lte(slots.startTime, endOfDay)));

    if (existingSlotsToday.length >= 100) {
      throw new AppError(
        400,
        "Daily slot limit reached. Maximum 100 slots allowed per day."
      );
    }

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
      if (!team_code) {
        throw new AppError(400, "team_code is required for team booking.");
      }

      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.teamCode, team_code));

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
        teamCode: type === "team" ? (team_code as string) : null,
        slotId: slot_id,
        confirmationEmailSent: false,
      })
      .returning();

    return newBooking;
  },
};

export const slotService = slotController;
