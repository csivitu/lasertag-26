import { db } from "@lasertag-26/database";
import { slots, bookings, user, teams } from "@lasertag-26/database/schema";
import { eq } from "drizzle-orm";
import { HttpError as AppError } from "../errors";

export interface ReserveSlotInput {
  slot_id: string;
  user_id: string;
  type: "individual" | "team";
  team_code?: string;
}

export const slotController = {
  async getAllSlots() {
    return db.select().from(slots);
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

