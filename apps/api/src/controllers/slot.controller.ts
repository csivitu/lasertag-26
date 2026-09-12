import { db } from "@lasertag-26/database";
import {
  slots,
  bookings,
  user,
  teams,
  teamMembers,
} from "@lasertag-26/database/schema";
import { eq } from "drizzle-orm";
import { HttpError as AppError } from "../errors";
import { sendEmail } from "../services/mailer";

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

    if (type === "team" && team_code) {
      const teamUsers = await db
        .select({
          name: user.name,
          email: user.email,
        })
        .from(teamMembers)
        .innerJoin(user, eq(teamMembers.userId, user.id))
        .where(eq(teamMembers.teamCode, team_code));

      const emailResults = await Promise.all(
        teamUsers.map((member) =>
          sendEmail({
            to: member.email,
            subject: "LaserTag Slot Booked",
            template: "test",
            variables: {
              name: member.name,
              teamCode: team_code,
            },
          }),
        ),
      );

      const allEmailsSent = emailResults.every((messageId) => messageId !== null);

      if (allEmailsSent && teamUsers.length > 0) {
        await db
          .update(bookings)
          .set({
            confirmationEmailSent: true,
          })
          .where(eq(bookings.id, newBooking.id));
      }
    } else {
      const messageId = await sendEmail({
        to: targetUser.email,
        subject: "LaserTag Slot Booked",
        template: "test",
        variables: {
          name: targetUser.name,
        },
      });

      if (messageId) {
        await db
          .update(bookings)
          .set({
            confirmationEmailSent: true,
          })
          .where(eq(bookings.id, newBooking.id));
      }
    }

    return newBooking;
  },
};

export const slotService = slotController;
