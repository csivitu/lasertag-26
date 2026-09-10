import { db } from "@lasertag-26/database";
import { bookings, user, slots } from "@lasertag-26/database/schema";
import { eq, or } from "drizzle-orm";
import { HttpError as AppError } from "../errors";

export const verificationController = {
  async verifyRegistration(registrationId: string) {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, registrationId));

    if (booking) {
      const [foundUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, booking.userId));

      const [slot] = await db
        .select()
        .from(slots)
        .where(eq(slots.id, booking.slotId));

      return {
        verified: true,
        type: "booking",
        data: {
          booking_id: booking.id,
          booking_type: booking.type,
          user: foundUser
            ? {
                id: foundUser.id,
                name: foundUser.name,
                email: foundUser.email,
                role: foundUser.role,
                is_checked_in: foundUser.isCheckedIn,
                paid: foundUser.paid,
              }
            : null,
          team_code: booking.teamCode,
          slot: slot
            ? {
                id: slot.id,
                start_time: slot.startTime,
                end_time: slot.endTime,
              }
            : null,
          confirmation_email_sent: booking.confirmationEmailSent,
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

    throw new AppError(404, "Registration / Ticket / User not found for the given ID.");
  },

  async checkInUser(identifier: string) {
    const [targetUser] = await db
      .select()
      .from(user)
      .where(or(eq(user.id, identifier), eq(user.qrToken, identifier)));

    if (!targetUser) {
      throw new AppError(404, "User not found.");
    }

    if (targetUser.isCheckedIn) {
      return {
        already_checked_in: true,
        user: targetUser,
      };
    }

    const [updatedUser] = await db
      .update(user)
      .set({
        isCheckedIn: true,
        checkedInAt: new Date(),
      })
      .where(eq(user.id, targetUser.id))
      .returning();

    return {
      already_checked_in: false,
      user: updatedUser,
    };
  },
};

export const verificationService = verificationController;
