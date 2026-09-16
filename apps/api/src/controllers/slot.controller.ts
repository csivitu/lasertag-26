import { db } from "@lasertag-26/database";
import { slots, bookings, user, teams, teamMembers } from "@lasertag-26/database/schema";
import { eq, and, inArray, lt, gt } from "drizzle-orm";

import { HttpError as AppError } from "../errors";
import { dispatchBookingConfirmation } from "../services/booking-email";
import type { CreateSlotInput, ReserveSlotInput } from "../validations/slot.validation";

export const slotController = {
  async getAllSlots() {
    const allSlots = await db.select().from(slots);
    return allSlots;
  },

  async getSlotById(slotId: string) {
    const [slot] = await db
      .select()
      .from(slots)
      .where(eq(slots.id, slotId));

    if (!slot) {
      throw new AppError(404, "Slot not found.");
    }

    return slot;
  },

  async createSlot(input: CreateSlotInput) {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);
    const capacity = input.capacity;

    // Check for overlapping slots in the same time range
    const overlapping = await db
      .select()
      .from(slots)
      .where(and(lt(slots.startTime, endTime), gt(slots.endTime, startTime)));

    if (overlapping.length > 0) {
      throw new AppError(
        409,
        "A slot already exists that overlaps with this time range.",
      );
    }

    const [createdSlot] = await db
      .insert(slots)
      .values({
        startTime,
        endTime,
        capacity,
      })
      .returning();

    return createdSlot;
  },

  async updateSlot(
    slotId: string,
    updates: Partial<{ startTime: Date; endTime: Date; capacity: number }>,
  ) {
    // 1. Verify slot exists
    const [existingSlot] = await db
      .select()
      .from(slots)
      .where(eq(slots.id, slotId));

    if (!existingSlot) {
      throw new AppError(404, "Slot not found.");
    }

    const newStartTime = updates.startTime ? new Date(updates.startTime) : existingSlot.startTime;
    const newEndTime = updates.endTime ? new Date(updates.endTime) : existingSlot.endTime;

    // 2. Check overlap if times are modified
    if (updates.startTime || updates.endTime) {
      const overlapping = await db
        .select()
        .from(slots)
        .where(
          and(
            lt(slots.startTime, newEndTime),
            gt(slots.endTime, newStartTime),
            eq(slots.id, slotId), // Ensure it's not the same slot
          ),
        );

      // If we find any overlapping slot that isn't the slot being updated
      const otherOverlaps = overlapping.filter((s) => s.id !== slotId);
      if (otherOverlaps.length > 0) {
        throw new AppError(
          409,
          "The updated time range overlaps with another existing slot.",
        );
      }
    }

    const [updatedSlot] = await db
      .update(slots)
      .set(updates)
      .where(eq(slots.id, slotId))
      .returning();

    return updatedSlot;
  },

  async deleteSlot(slotId: string) {
    const [deletedSlot] = await db
      .delete(slots)
      .where(eq(slots.id, slotId))
      .returning();

    if (!deletedSlot) {
      throw new AppError(404, "Slot not found.");
    }

    return deletedSlot;
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

    if (targetSlot.capacity <= 0) {
      throw new AppError(400, "Selected slot is already fully booked.");
    }

    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, user_id));

    if (!targetUser) {
      throw new AppError(404, "User not found.");
    }

    // 1. If Solo (individual), verify user is NOT currently in a team
    if (type === "individual") {
      const userInTeam = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.userId, user_id));

      if (userInTeam.length > 0) {
        throw new AppError(
          400,
          "You are currently part of a team and cannot book an individual solo slot."
        );
      }
    }

    // 2. If Team, verify team exists and only the leader can reserve the slot
    if (type === "team") {
      if (!team_code) {
        throw new AppError(400, "Team code is required for team slot reservations.");
      }

      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.teamCode, team_code));

      if (!team) {
        // If team was pending creation from client session, establish it now with user as leader
        await db.insert(teams).values({
          teamCode: team_code,
          leaderId: user_id,
          members: 1,
        });

        await db
          .insert(teamMembers)
          .values({
            teamCode: team_code,
            userId: user_id,
          })
          .onConflictDoNothing();
      } else if (team.leaderId !== user_id) {
        throw new AppError(403, "Only the team leader can reserve a slot for the team.");
      }
    }

    // Check if user already has an active booking (to update slot rather than orphan bookings)
    const existingActiveBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, user_id),
          inArray(bookings.status, ["reserved", "confirmed"])
        )
      );

    let activeBooking;

    if (existingActiveBookings.length > 0) {
      const prevBooking = existingActiveBookings[0];
      // If slot changed, restore 1 capacity to the old slot
      if (prevBooking.slotId !== slot_id) {
        const [prevSlot] = await db.select().from(slots).where(eq(slots.id, prevBooking.slotId));
        if (prevSlot) {
          await db
            .update(slots)
            .set({ capacity: prevSlot.capacity + 1 })
            .where(eq(slots.id, prevBooking.slotId));
        }
      }

      const qrToken = prevBooking.qrToken || `QR-${prevBooking.id}`;

      const [updatedBooking] = await db
        .update(bookings)
        .set({
          slotId: slot_id,
          type,
          teamCode: type === "team" ? (team_code ?? null) : null,
          status: "confirmed",
          qrToken,
          confirmedAt: new Date(),
          confirmationEmailSent: false,
        })
        .where(eq(bookings.id, prevBooking.id))
        .returning();

      activeBooking = updatedBooking;
    } else {
      const bookingId = `BKG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const qrToken = `QR-${bookingId}`;

      const [newBooking] = await db
        .insert(bookings)
        .values({
          id: bookingId,
          type,
          status: "confirmed",
          userId: user_id,
          teamCode: type === "team" ? (team_code ?? null) : null,
          slotId: slot_id,
          qrToken,
          confirmedAt: new Date(),
          confirmationEmailSent: false,
        })
        .returning();

      activeBooking = newBooking;
    }

    const assignedQrToken = activeBooking.qrToken || `QR-${activeBooking.id}`;

    // Ensure user record also holds the qrToken for instant scanner lookups
    await db
      .update(user)
      .set({ qrToken: assignedQrToken })
      .where(eq(user.id, user_id));

    // Decrement new slot capacity
    await db
      .update(slots)
      .set({
        capacity: Math.max(0, targetSlot.capacity - 1),
      })
      .where(eq(slots.id, slot_id));

    // If team, reset per-member delivery tracking flags for this fresh/updated booking
    if (type === "team" && team_code) {
      await db
        .update(teamMembers)
        .set({ confirmationEmailSent: false, emailSentAt: null })
        .where(eq(teamMembers.teamCode, team_code));
    }

    // Asynchronous non-blocking dispatch with in-flight retry and per-member tracking
    const bookingId = activeBooking.id;
    void (async () => {
      try {
        await dispatchBookingConfirmation(bookingId);
      } catch (emailErr) {
        console.error("[Mailer] Background confirmation email dispatch error:", emailErr);
      }
    })();

    return activeBooking;
  },

  async resendConfirmation(bookingId: string, options?: { forceResend?: boolean }) {
    return await dispatchBookingConfirmation(bookingId, options);
  },
};
