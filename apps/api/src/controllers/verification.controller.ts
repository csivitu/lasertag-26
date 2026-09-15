import { db } from "@lasertag-26/database";
import { bookings, slots, user } from "@lasertag-26/database/schema";
import { eq, or } from "drizzle-orm";
import { NotFoundError } from "../errors";

export const verificationController = {
  async verifyRegistration(registrationId: string) {
    const [bookingRecord] = await db
      .select({
        booking: bookings,
        user: user,
        slot: slots,
      })
      .from(bookings)
      .innerJoin(user, eq(bookings.userId, user.id))
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .where(or(eq(bookings.id, registrationId), eq(bookings.qrToken, registrationId)));

    if (bookingRecord) {
      return {
        verified: true,
        type: "registration",
        data: {
          registration: {
            id: bookingRecord.booking.id,
            type: bookingRecord.booking.type,
            status: bookingRecord.booking.status,
            slot_id: bookingRecord.booking.slotId,
            team_code: bookingRecord.booking.teamCode,
            qr_token: bookingRecord.booking.qrToken,
            is_checked_in: bookingRecord.booking.isCheckedIn,
            checked_in_at: bookingRecord.booking.checkedInAt,
            confirmed_at: bookingRecord.booking.confirmedAt,
            confirmation_email_sent: bookingRecord.booking.confirmationEmailSent,
          },
          user: {
            id: bookingRecord.user.id,
            name: bookingRecord.user.name,
            email: bookingRecord.user.email,
            role: bookingRecord.user.role,
            ph_number: bookingRecord.user.phNumber,
            qr_token: bookingRecord.user.qrToken,
            is_checked_in: bookingRecord.user.isCheckedIn,
            checked_in_at: bookingRecord.user.checkedInAt,
            paid: bookingRecord.user.paid,
          },
          slot: {
            id: bookingRecord.slot.id,
            start_time: bookingRecord.slot.startTime,
            end_time: bookingRecord.slot.endTime,
            capacity: bookingRecord.slot.capacity,
          },
        },
      };
    }

    const [foundUser] = await db
      .select()
      .from(user)
      .where(or(eq(user.id, registrationId), eq(user.qrToken, registrationId)));

    if (foundUser) {
      const userBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.userId, foundUser.id));

      return {
        verified: true,
        type: "user",
        data: {
          user: {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            role: foundUser.role,
            ph_number: foundUser.phNumber,
            qr_token: foundUser.qrToken,
            is_checked_in: foundUser.isCheckedIn,
            checked_in_at: foundUser.checkedInAt,
            paid: foundUser.paid,
          },
          bookings: userBookings,
        },
      };
    }

    throw new NotFoundError("Registration / Ticket / User not found for the given ID.");
  },

  async checkInUser(identifier: string) {
    let [targetUser] = await db
      .select()
      .from(user)
      .where(or(eq(user.id, identifier), eq(user.qrToken, identifier)));

    if (!targetUser) {
      const [booking] = await db
        .select()
        .from(bookings)
        .where(
          or(
            eq(bookings.id, identifier),
            eq(bookings.qrToken, identifier),
          ),
        );

      if (booking) {
        const [foundUser] = await db
          .select()
          .from(user)
          .where(eq(user.id, booking.userId));
        targetUser = foundUser;
      }
    }

    if (!targetUser) {
      throw new NotFoundError("User not found.");
    }

    if (targetUser.isCheckedIn) {
      return {
        already_checked_in: true,
        user: targetUser,
      };
    }

    const now = new Date();
    const [updatedUser] = await db
      .update(user)
      .set({
        isCheckedIn: true,
        checkedInAt: now,
      })
      .where(eq(user.id, targetUser.id))
      .returning();

    // Also update booking check-in state
    await db
      .update(bookings)
      .set({
        isCheckedIn: true,
        checkedInAt: now,
      })
      .where(
        or(
          eq(bookings.id, identifier),
          eq(bookings.qrToken, identifier),
          eq(bookings.userId, targetUser.id),
        ),
      );

    return {
      already_checked_in: false,
      user: updatedUser,
    };
  },
};

export const verificationService = verificationController;
