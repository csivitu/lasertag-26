import { db } from "@lasertag-26/database";
import { slots, bookings, user, teams } from "@lasertag-26/database/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { HttpError as AppError, NotFoundError } from "../errors";

export const verificationController = {
  async verifyRegistration(registrationId: string) {
    // 1. Check if ID matches a booking ID or QR token
    const [bookingRecord] = await db
      .select({
        booking: bookings,
        user: user,
        slot: slots,
      })
      .from(bookings)
      .innerJoin(user, eq(bookings.userId, user.id))
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .where(
        or(
          eq(bookings.id, registrationId),
          eq(bookings.qrToken, registrationId),
        ),
      );

    if (bookingRecord) {
      let teamName = "SOLO";
      if (bookingRecord.booking.teamCode) {
        const [t] = await db
          .select()
          .from(teams)
          .where(eq(teams.teamCode, bookingRecord.booking.teamCode));
        teamName = t?.name || bookingRecord.booking.teamCode;
      }

      return {
        verified: true,
        type: "booking",
        data: {
          booking: {
            id: bookingRecord.booking.id,
            type: bookingRecord.booking.type,
            status: bookingRecord.booking.status,
            side: bookingRecord.booking.side,
            qr_token: bookingRecord.booking.qrToken,
            is_checked_in: bookingRecord.booking.isCheckedIn,
            checked_in_at: bookingRecord.booking.checkedInAt,
            confirmed_at: bookingRecord.booking.confirmedAt,
            confirmation_email_sent: bookingRecord.booking.confirmationEmailSent,
          },
          user: {
            id: bookingRecord.user.id,
            name: bookingRecord.user.name,
            regNo: bookingRecord.user.regNo,
            email: bookingRecord.user.email,
            role: bookingRecord.user.role,
            ph_number: bookingRecord.user.phNumber,
            qr_token: bookingRecord.user.qrToken,
            is_checked_in: bookingRecord.user.isCheckedIn,
            checked_in_at: bookingRecord.user.checkedInAt,
            paid: bookingRecord.user.paid,
          },
          team: {
            name: teamName,
            code: bookingRecord.booking.teamCode,
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
            regNo: foundUser.regNo,
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

  async checkInUser(
    identifier: string,
    payload?: { name?: string; regNo?: string; team?: string; slot?: string; side?: string },
  ) {
    let targetBooking = await db
      .select()
      .from(bookings)
      .where(
        or(
          eq(bookings.qrToken, identifier),
          eq(bookings.id, identifier),
        ),
      )
      .then((rows) => rows[0]);

    if (!targetBooking) {
      const [u] = await db.select().from(user).where(eq(user.qrToken, identifier));
      if (u) {
        const [ub] = await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.userId, u.id),
              inArray(bookings.status, ["reserved", "confirmed"]),
            ),
          );
        targetBooking = ub;
      }
    }

    if (!targetBooking) {
      throw new NotFoundError("Registration not found for the given QR token or registration ID.");
    }

    if (targetBooking.status === "cancelled") {
      throw new AppError(400, "This registration has been cancelled.");
    }
    if (targetBooking.status !== "confirmed") {
      throw new AppError(400, "Registration must be confirmed before check-in.");
    }

    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, targetBooking.userId));

    if (!targetUser) {
      throw new NotFoundError("Participant not found.");
    }

    if (!targetUser.paid) {
      throw new AppError(400, "Participant has not completed payment.");
    }

    // Find active booking details to retrieve slot and team
    const [bookingRecord] = await db
      .select({
        booking: bookings,
        slot: slots,
      })
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .where(eq(bookings.id, targetBooking.id));

    let teamName = "SOLO";
    let isTeam = false;
    let arrivedCount = 1;
    let totalTeamCount = 1;
    let arrivalMessage = "SOLO operative verified & waiting";

    if (bookingRecord?.booking?.teamCode) {
      isTeam = true;
      const [t] = await db
        .select()
        .from(teams)
        .where(eq(teams.teamCode, bookingRecord.booking.teamCode));
      teamName = t?.name || bookingRecord.booking.teamCode;

      const teamMembers = await db
        .select({
          userId: bookings.userId,
          isCheckedIn: bookings.isCheckedIn,
          userName: user.name,
        })
        .from(bookings)
        .innerJoin(user, eq(bookings.userId, user.id))
        .where(
          and(
            eq(bookings.teamCode, bookingRecord.booking.teamCode),
            inArray(bookings.status, ["reserved", "confirmed"]),
          ),
        );

      totalTeamCount = teamMembers.length || 1;
      arrivedCount = teamMembers.filter((m) => m.isCheckedIn || m.userId === targetUser.id).length;
      arrivalMessage = `${arrivedCount} has arrived (${arrivedCount}/${totalTeamCount})`;
    }

    const slotStr = bookingRecord
      ? `${new Date(bookingRecord.slot.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${new Date(bookingRecord.slot.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
      : (payload?.slot || "Confirmed");

    const sideStr = bookingRecord?.booking?.side?.toUpperCase() || payload?.side || "RED";

    if (targetUser.isCheckedIn || targetBooking.isCheckedIn) {
      return {
        already_checked_in: true,
        user: targetUser,
        name: targetUser.name || payload?.name,
        regNo: targetUser.regNo || payload?.regNo || "N/A",
        isTeam,
        teamName: teamName || payload?.team || (isTeam ? "TEAM" : "SOLO"),
        arrivedCount,
        totalTeamCount,
        arrivalMessage,
        slot: slotStr,
        side: sideStr,
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

    // Mark exactly THIS single booking checked in (no broad userId updates)
    await db
      .update(bookings)
      .set({
        isCheckedIn: true,
        checkedInAt: now,
      })
      .where(eq(bookings.id, targetBooking.id));

    return {
      already_checked_in: false,
      user: updatedUser,
      name: updatedUser.name || payload?.name,
      regNo: updatedUser.regNo || payload?.regNo || "N/A",
      isTeam,
      teamName: teamName || payload?.team || (isTeam ? "TEAM" : "SOLO"),
      arrivedCount,
      totalTeamCount,
      arrivalMessage,
      slot: slotStr,
      side: sideStr,
    };
  },

  async getWaitingQueue() {
    const checkedInRows = await db
      .select({
        bookingId: bookings.id,
        userId: user.id,
        name: user.name,
        regNo: user.regNo,
        email: user.email,
        phone: user.phNumber,
        teamCode: bookings.teamCode,
        side: bookings.side,
        type: bookings.type,
        checkedInAt: bookings.checkedInAt,
        slotStartTime: slots.startTime,
        slotEndTime: slots.endTime,
      })
      .from(bookings)
      .innerJoin(user, eq(bookings.userId, user.id))
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .where(
        and(
          eq(bookings.isCheckedIn, true),
          inArray(bookings.status, ["reserved", "confirmed"]),
        ),
      );

    // Group teams vs solos
    const teamMap: Record<
      string,
      {
        teamCode: string;
        teamName: string;
        side: string;
        slotStartTime: Date;
        slotEndTime: Date;
        arrivedMembers: Array<{ name: string; regNo: string | null; checkedInAt: Date | null }>;
      }
    > = {};

    const solos: Array<{
      bookingId: string;
      userId: string;
      name: string;
      regNo: string | null;
      side: string;
      slotStartTime: Date;
      slotEndTime: Date;
      checkedInAt: Date | null;
    }> = [];

    for (const row of checkedInRows) {
      if (row.type === "team" && row.teamCode) {
        if (!teamMap[row.teamCode]) {
          const [team] = await db.select().from(teams).where(eq(teams.teamCode, row.teamCode));
          teamMap[row.teamCode] = {
            teamCode: row.teamCode,
            teamName: team?.name || row.teamCode,
            side: (row.side || "RED").toUpperCase(),
            slotStartTime: row.slotStartTime,
            slotEndTime: row.slotEndTime,
            arrivedMembers: [],
          };
        }
        teamMap[row.teamCode].arrivedMembers.push({
          name: row.name,
          regNo: row.regNo,
          checkedInAt: row.checkedInAt,
        });
      } else {
        solos.push({
          bookingId: row.bookingId,
          userId: row.userId,
          name: row.name,
          regNo: row.regNo,
          side: (row.side || "RED").toUpperCase(),
          slotStartTime: row.slotStartTime,
          slotEndTime: row.slotEndTime,
          checkedInAt: row.checkedInAt,
        });
      }
    }

    return {
      teams: Object.values(teamMap),
      solos,
      totalWaiting: checkedInRows.length,
    };
  },
};
