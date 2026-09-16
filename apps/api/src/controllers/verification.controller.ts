import { db } from "@lasertag-26/database";
import { bookings, slots, user, teams } from "@lasertag-26/database/schema";
import { eq, or, and, inArray } from "drizzle-orm";
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
        type: "registration",
        data: {
          registration: {
            id: bookingRecord.booking.id,
            type: bookingRecord.booking.type,
            status: bookingRecord.booking.status,
            slot_id: bookingRecord.booking.slotId,
            team_code: bookingRecord.booking.teamCode,
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

    // Find active booking details to retrieve slot and team
    const [bookingRecord] = await db
      .select({
        booking: bookings,
        slot: slots,
      })
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .where(
        and(
          eq(bookings.userId, targetUser.id),
          inArray(bookings.status, ["reserved", "confirmed"]),
        ),
      );

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

    if (targetUser.isCheckedIn) {
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
        type: bookings.type,
        side: bookings.side,
        slotId: slots.id,
        slotStart: slots.startTime,
        slotEnd: slots.endTime,
        checkedInAt: bookings.checkedInAt,
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

    const teamCodes = Array.from(
      new Set(checkedInRows.map((r) => r.teamCode).filter((c): c is string => Boolean(c))),
    );

    const teamMetaMap: Record<string, { name: string; totalMembers: number }> = {};

    if (teamCodes.length > 0) {
      const allTeams = await db
        .select()
        .from(teams)
        .where(inArray(teams.teamCode, teamCodes));

      for (const t of allTeams) {
        teamMetaMap[t.teamCode] = {
          name: t.name || t.teamCode,
          totalMembers: t.members || 1,
        };
      }
    }

    // Compute arrival counts per team
    const teamArrivalCounts: Record<string, number> = {};
    for (const r of checkedInRows) {
      if (r.teamCode) {
        teamArrivalCounts[r.teamCode] = (teamArrivalCounts[r.teamCode] || 0) + 1;
      }
    }

    const waitlist = checkedInRows.map((r) => {
      const isTeam = Boolean(r.teamCode);
      const teamMeta = r.teamCode ? teamMetaMap[r.teamCode] : null;
      const teamName = isTeam ? (teamMeta?.name || r.teamCode!) : "SOLO";
      const totalTeamMembers = teamMeta?.totalMembers || 1;
      const arrived = r.teamCode ? (teamArrivalCounts[r.teamCode] || 1) : 1;

      return {
        id: r.bookingId,
        userId: r.userId,
        name: r.name,
        regNo: r.regNo || "N/A",
        email: r.email,
        phone: r.phone,
        isTeam,
        teamName,
        teamCode: r.teamCode || null,
        arrivedCount: arrived,
        totalTeamMembers,
        arrivalStatus: isTeam ? `${arrived} has arrived (${arrived}/${totalTeamMembers})` : "SOLO",
        slot: `${new Date(r.slotStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${new Date(r.slotStart).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
        side: (r.side || "red").toUpperCase(),
        checkedInAt: r.checkedInAt ? new Date(r.checkedInAt).toISOString() : new Date().toISOString(),
      };
    });

    waitlist.sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime());

    const teamGroups: Record<
      string,
      {
        teamCode: string;
        teamName: string;
        slot: string;
        side: string;
        arrivedCount: number;
        totalMembers: number;
        arrivalStatus: string;
        members: Array<{ id: string; name: string; regNo: string; checkedInAt: string }>;
      }
    > = {};

    const soloList: typeof waitlist = [];

    for (const item of waitlist) {
      if (item.isTeam && item.teamCode) {
        if (!teamGroups[item.teamCode]) {
          teamGroups[item.teamCode] = {
            teamCode: item.teamCode,
            teamName: item.teamName,
            slot: item.slot,
            side: item.side,
            arrivedCount: item.arrivedCount,
            totalMembers: item.totalTeamMembers,
            arrivalStatus: `${item.arrivedCount} has arrived (${item.arrivedCount}/${item.totalTeamMembers})`,
            members: [],
          };
        }
        teamGroups[item.teamCode].members.push({
          id: item.userId,
          name: item.name,
          regNo: item.regNo,
          checkedInAt: item.checkedInAt,
        });
      } else {
        soloList.push(item);
      }
    }

    return {
      totalWaiting: waitlist.length,
      waitlist,
      teams: Object.values(teamGroups),
      solos: soloList,
    };
  },
};

export const verificationService = verificationController;
