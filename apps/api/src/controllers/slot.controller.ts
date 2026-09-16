import { randomBytes } from "node:crypto";
import { db } from "@lasertag-26/database";
import { slots, bookings, user, teams, teamMembers } from "@lasertag-26/database/schema";
import { eq, and, inArray, lt, gt } from "drizzle-orm";
import QRCode from "qrcode";

import { HttpError as AppError } from "../errors";
import { env } from "../env";
import { sendEmail, MAILER_CONFIG } from "../services/mailer";
import type { CreateSlotInput, ReserveSlotInput } from "../validations/slot.validation";

export const slotController = {
  async getAllSlots() {
    const allSlots = await db.select().from(slots);

    // Fetch active bookings to calculate Red vs Blue faction breakdown
    const activeBookings = await db
      .select({
        slotId: bookings.slotId,
        side: bookings.side,
        type: bookings.type,
      })
      .from(bookings)
      .where(inArray(bookings.status, ["reserved", "confirmed"]));

    const slotsWithSides = allSlots.map((slot) => {
      const slotBookings = activeBookings.filter((b) => b.slotId === slot.id);
      const redOccupied = slotBookings.filter((b) => b.side === "red").length;
      const blueOccupied = slotBookings.filter((b) => b.side === "blue").length;
      const unassignedOccupied = slotBookings.filter(
        (b) => !b.side || (b.side !== "red" && b.side !== "blue"),
      ).length;

      // Available spots calculation (total capacity 10, 5 per side)
      const maxPerSide = 5;
      const redAvailable = Math.max(0, maxPerSide - redOccupied);
      const blueAvailable = Math.max(0, maxPerSide - blueOccupied);
      const totalBooked = redOccupied + blueOccupied + unassignedOccupied;
      const totalAvailable = Math.max(0, slot.capacity - totalBooked);

      return {
        ...slot,
        totalBooked,
        totalAvailable,
        redOccupied,
        redAvailable,
        blueOccupied,
        blueAvailable,
      };
    });

    return slotsWithSides;
  },

  async getSlotById(slotId: string) {
    const [slot] = await db.select().from(slots).where(eq(slots.id, slotId));
    if (!slot) {
      throw new AppError(404, "Slot not found.");
    }

    const activeBookings = await db
      .select({
        slotId: bookings.slotId,
        side: bookings.side,
        type: bookings.type,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.slotId, slotId),
          inArray(bookings.status, ["reserved", "confirmed"]),
        ),
      );

    const redOccupied = activeBookings.filter((b) => b.side === "red").length;
    const blueOccupied = activeBookings.filter((b) => b.side === "blue").length;
    const unassignedOccupied = activeBookings.filter(
      (b) => !b.side || (b.side !== "red" && b.side !== "blue"),
    ).length;

    const maxPerSide = 5;
    const redAvailable = Math.max(0, maxPerSide - redOccupied);
    const blueAvailable = Math.max(0, maxPerSide - blueOccupied);
    const totalBooked = redOccupied + blueOccupied + unassignedOccupied;
    const totalAvailable = Math.max(0, slot.capacity - totalBooked);

    return {
      ...slot,
      totalBooked,
      totalAvailable,
      redOccupied,
      redAvailable,
      blueOccupied,
      blueAvailable,
    };
  },

  async createSlot(input: CreateSlotInput) {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    if (endTime <= startTime) {
      throw new AppError(400, "endTime must be after startTime.");
    }

    const capacity = input.capacity;

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
    const [existingSlot] = await db
      .select()
      .from(slots)
      .where(eq(slots.id, slotId));

    if (!existingSlot) {
      throw new AppError(404, "Slot not found.");
    }

    const newStartTime = updates.startTime ? new Date(updates.startTime) : existingSlot.startTime;
    const newEndTime = updates.endTime ? new Date(updates.endTime) : existingSlot.endTime;

    if (updates.startTime || updates.endTime) {
      const overlapping = await db
        .select()
        .from(slots)
        .where(
          and(
            lt(slots.startTime, newEndTime),
            gt(slots.endTime, newStartTime),
            eq(slots.id, slotId),
          ),
        );

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
    const { slot_id, user_id, type, team_code, side } = input;

    const [targetSlot] = await db
      .select()
      .from(slots)
      .where(eq(slots.id, slot_id));

    if (!targetSlot) {
      throw new AppError(404, "Slot not found.");
    }

    if (new Date(targetSlot.endTime) <= new Date()) {
      throw new AppError(400, "Cannot book a slot that has already ended.");
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
          "You are currently part of a team and cannot book an individual solo slot.",
        );
      }
    }

    let teamUsers: Array<{ id: string; name: string; email: string; regNo: string | null }> = [];
    let currentTeamName = "";

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
        throw new AppError(404, "Team not found.");
      }

      if (team.leaderId !== user_id) {
        throw new AppError(403, "Only the team leader can book the slot for the squad.");
      }

      currentTeamName = team.name || team.teamCode;

      // Check team members count: leader can only book if at least 1 teammate has joined (min 2 members)
      const currentTeamMemberRows = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          regNo: user.regNo,
        })
        .from(teamMembers)
        .innerJoin(user, eq(teamMembers.userId, user.id))
        .where(eq(teamMembers.teamCode, team_code));

      if (currentTeamMemberRows.length < 2) {
        throw new AppError(
          400,
          "Leader can only book a slot when all team members have joined or at least 1 member has joined.",
        );
      }

      teamUsers = currentTeamMemberRows;
    } else {
      teamUsers = [
        {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          regNo: targetUser.regNo,
        },
      ];
    }

    const partySize = teamUsers.length;

    // Check slot side capacity (5v5 Red vs Blue)
    const activeSlotBookings = await db
      .select({
        id: bookings.id,
        side: bookings.side,
        userId: bookings.userId,
      })
      .from(bookings)
      .where(and(eq(bookings.slotId, slot_id), inArray(bookings.status, ["reserved", "confirmed"])));

    // Filter out users from current party if they are rescheduling the same slot
    const currentPartyUserIds = new Set(teamUsers.map((u) => u.id));
    const redOccupied = activeSlotBookings.filter(
      (b) => b.side === "red" && !currentPartyUserIds.has(b.userId),
    ).length;
    const blueOccupied = activeSlotBookings.filter(
      (b) => b.side === "blue" && !currentPartyUserIds.has(b.userId),
    ).length;

    let chosenSide = side;
    if (!chosenSide) {
      // Pick side with sufficient room
      if (5 - redOccupied >= partySize) {
        chosenSide = "red";
      } else if (5 - blueOccupied >= partySize) {
        chosenSide = "blue";
      } else {
        throw new AppError(
          400,
          `Selected slot cannot fit your party of ${partySize}. Red side has ${5 - redOccupied} spots and Blue side has ${5 - blueOccupied} spots remaining.`,
        );
      }
    } else {
      const availableOnSide = chosenSide === "red" ? 5 - redOccupied : 5 - blueOccupied;
      if (availableOnSide < partySize) {
        throw new AppError(
          400,
          `Not enough spots remaining on the ${chosenSide.toUpperCase()} side. (${availableOnSide} available, party size: ${partySize}).`,
        );
      }
    }

    // Format slot date and time
    const slotStartDate = new Date(targetSlot.startTime);
    const slotEndDate = new Date(targetSlot.endTime);
    const slotDateStr = slotStartDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const formatHour = (d: Date) =>
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const slotTimeStr = `${formatHour(slotStartDate)} - ${formatHour(slotEndDate)}`;
    const passUrl = `${env.WEB_ORIGIN}/profile`;

    // Process bookings and tickets for all party members
    let leaderBooking: typeof bookings.$inferSelect | undefined;

    for (const member of teamUsers) {
      const existing = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.userId, member.id),
            inArray(bookings.status, ["reserved", "confirmed"]),
          ),
        );

      let memberBooking: typeof bookings.$inferSelect;
      // Cryptographically secure QR token
      const memberQrToken = randomBytes(32).toString("hex");

      if (existing.length > 0) {
        const [updated] = await db
          .update(bookings)
          .set({
            slotId: slot_id,
            type,
            teamCode: type === "team" ? (team_code ?? null) : null,
            side: chosenSide,
            status: "confirmed",
            qrToken: existing[0].qrToken || memberQrToken,
            confirmedAt: new Date(),
            confirmationEmailSent: false,
          })
          .where(eq(bookings.id, existing[0].id))
          .returning();
        memberBooking = updated;
      } else {
        const bookingId = `BKG-${Date.now()}-${member.id.slice(0, 6)}`;
        const [created] = await db
          .insert(bookings)
          .values({
            id: bookingId,
            type,
            status: "confirmed",
            userId: member.id,
            teamCode: type === "team" ? (team_code ?? null) : null,
            slotId: slot_id,
            side: chosenSide,
            qrToken: memberQrToken,
            confirmedAt: new Date(),
            confirmationEmailSent: false,
          })
          .returning();
        memberBooking = created;
      }

      const assignedToken = memberBooking.qrToken || memberQrToken;
      await db.update(user).set({ qrToken: assignedToken }).where(eq(user.id, member.id));

      if (member.id === user_id) {
        leaderBooking = memberBooking;
      }
    }

    // Fixed capacity ceiling: do not decrement slots.capacity!
    // Active bookings count determines remaining availability dynamically.

    // Asynchronous email dispatch to ALL party members
    void (async () => {
      try {
        await Promise.all(
          teamUsers.map(async (member) => {
            const [memberBookingRecord] = await db
              .select()
              .from(bookings)
              .where(
                and(
                  eq(bookings.userId, member.id),
                  eq(bookings.slotId, slot_id),
                  inArray(bookings.status, ["reserved", "confirmed"]),
                ),
              );

            const token = memberBookingRecord?.qrToken || randomBytes(32).toString("hex");

            // Build structured QR payload encoding verification info
            const qrPayload = JSON.stringify({
              token,
              name: member.name,
              regNo: member.regNo,
              slotTime: slotTimeStr,
              side: chosenSide,
              type,
            });

            // Generate high-resolution QR Buffer
            const qrBuffer = await QRCode.toBuffer(qrPayload, {
              width: 320,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
            });

            const emailSubject =
              type === "team"
                ? `Combat Pass: Squad ${currentTeamName} - LaserTag 2026`
                : "Combat Pass: Solo Operative - LaserTag 2026";

            await sendEmail({
              to: member.email,
              subject: emailSubject,
              template: MAILER_CONFIG.BOOKING_CONFIRMATION,
              variables: {
                name: member.name || "Operative",
                bookingId: memberBookingRecord?.id || "N/A",
                bookingType: type.toUpperCase(),
                teamCode: currentTeamName || "N/A",
                slotDate: slotDateStr,
                slotTime: slotTimeStr,
                qrToken: token,
                side: (chosenSide || "red").toUpperCase(),
                passUrl,
              },
              attachments: [
                {
                  filename: "combat-pass-qr.png",
                  content: qrBuffer,
                  cid: "qrTicketCode",
                },
              ],
            });

            if (memberBookingRecord) {
              await db
                .update(bookings)
                .set({ confirmationEmailSent: true })
                .where(eq(bookings.id, memberBookingRecord.id));
            }
          }),
        );
      } catch (emailErr) {
        console.error("Failed to deliver combat pass confirmation email:", emailErr);
      }
    })();

    return leaderBooking;
  },
};
