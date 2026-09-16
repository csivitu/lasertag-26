import { db } from "@lasertag-26/database";
import { slots, bookings, user, teams, teamMembers } from "@lasertag-26/database/schema";
import { eq, and, inArray, lt, gt, sql, asc } from "drizzle-orm";
import QRCode from "qrcode";

import { HttpError as AppError } from "../errors";
import { sendEmail, MAILER_CONFIG } from "../services/mailer";
import type { CreateSlotInput, ReserveSlotInput } from "../validations/slot.validation";

export const slotController = {
  async getAllSlots() {
    const allSlots = await db.select().from(slots).orderBy(asc(slots.startTime));
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

    // Run verification, seat claiming, and booking insert inside an atomic transaction
    const { activeBooking, targetUser, slotForEmail, assignedQrToken } = await db.transaction(
      async (tx) => {
        const [targetUser] = await tx
          .select()
          .from(user)
          .where(eq(user.id, user_id));

        if (!targetUser) {
          throw new AppError(404, "User not found.");
        }

        // 1. If Solo (individual), verify user is NOT currently in a team
        if (type === "individual") {
          const userInTeam = await tx
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

        // 2. If Team, verify team exists and only the leader can reserve the slot
        if (type === "team") {
          if (!team_code) {
            throw new AppError(400, "Team code is required for team slot reservations.");
          }

          const [team] = await tx
            .select()
            .from(teams)
            .where(eq(teams.teamCode, team_code));

          if (!team) {
            // If team was pending creation from client session, establish it now with user as leader
            await tx.insert(teams).values({
              teamCode: team_code,
              leaderId: user_id,
              members: 1,
            });

            await tx
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
        const existingActiveBookings = await tx
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.userId, user_id),
              inArray(bookings.status, ["reserved", "confirmed"]),
            ),
          );

        const prevBooking = existingActiveBookings[0];
        const isSameSlot = prevBooking && prevBooking.slotId === slot_id;

        let slotForEmail;

        if (isSameSlot) {
          const [existingSlot] = await tx
            .select()
            .from(slots)
            .where(eq(slots.id, slot_id));

          if (!existingSlot) {
            throw new AppError(404, "Slot not found.");
          }
          slotForEmail = existingSlot;
        } else {
          // Atomic conditional decrement: seat claimed ONLY if capacity > 0
          const [claimedSlot] = await tx
            .update(slots)
            .set({ capacity: sql`${slots.capacity} - 1` })
            .where(and(eq(slots.id, slot_id), gt(slots.capacity, 0)))
            .returning();

          if (!claimedSlot) {
            const [existingSlot] = await tx
              .select()
              .from(slots)
              .where(eq(slots.id, slot_id));

            if (!existingSlot) {
              throw new AppError(404, "Slot not found.");
            }
            throw new AppError(400, "Selected slot is already fully booked.");
          }

          slotForEmail = claimedSlot;

          // If switching slots, restore 1 capacity to the old slot
          if (prevBooking && prevBooking.slotId !== slot_id) {
            await tx
              .update(slots)
              .set({ capacity: sql`${slots.capacity} + 1` })
              .where(eq(slots.id, prevBooking.slotId));
          }
        }

        let activeBooking;

        if (prevBooking) {
          const qrToken = prevBooking.qrToken || `QR-${prevBooking.id}`;

          const [updatedBooking] = await tx
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

          const [newBooking] = await tx
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
        await tx
          .update(user)
          .set({ qrToken: assignedQrToken })
          .where(eq(user.id, user_id));

        return { activeBooking, targetUser, slotForEmail, assignedQrToken };
      },
    );

    // Format slot date and time for confirmation email
    const slotStartDate = new Date(slotForEmail.startTime);
    const slotEndDate = new Date(slotForEmail.endTime);

    const slotDateStr = slotStartDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const formatHour = (d: Date) =>
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    const slotTimeStr = `${formatHour(slotStartDate)} - ${formatHour(slotEndDate)}`;
    const passUrl = `${process.env.WEB_ORIGIN || "http://localhost:3000"}/profile`;

    // Asynchronous non-blocking dispatch: Send confirmation email w/ embedded QR Ticket
    void (async () => {
      try {
        if (type === "team" && team_code) {
          const teamUsers = await db
            .select({
              id: user.id,
              name: user.name,
              email: user.email,
            })
            .from(teamMembers)
            .innerJoin(user, eq(teamMembers.userId, user.id))
            .where(eq(teamMembers.teamCode, team_code));

          const emailResults = await Promise.all(
            teamUsers.map(async (member) => {
              const memberQrToken = `QR-${activeBooking.id}-${member.id.slice(0, 6)}`;
              await db
                .update(user)
                .set({ qrToken: memberQrToken })
                .where(eq(user.id, member.id));

              // Render high-res QR code PNG buffer
              const memberQrBuffer = await QRCode.toBuffer(memberQrToken, {
                width: 360,
                margin: 1,
                color: {
                  dark: "#000000",
                  light: "#FFFFFF",
                },
              });

              return sendEmail({
                to: member.email,
                subject: `LaserTag 2026: Team Slot Confirmed (${team_code})`,
                template: MAILER_CONFIG.BOOKING_CONFIRMATION,
                variables: {
                  name: member.name,
                  bookingId: activeBooking.id,
                  bookingType: "Team Battle",
                  teamCode: team_code,
                  slotDate: slotDateStr,
                  slotTime: slotTimeStr,
                  passUrl,
                  qrToken: memberQrToken,
                },
                attachments: [
                  {
                    filename: `arena-pass-${memberQrToken}.png`,
                    content: memberQrBuffer,
                    cid: "qrTicketCode",
                  },
                ],
              });
            }),
          );

          const anySent = emailResults.some((messageId) => messageId !== null);
          if (anySent && teamUsers.length > 0) {
            await db
              .update(bookings)
              .set({ confirmationEmailSent: true })
              .where(eq(bookings.id, activeBooking.id));
          }
        } else {
          // Render high-res QR code PNG buffer for Solo operative
          const qrBuffer = await QRCode.toBuffer(assignedQrToken, {
            width: 360,
            margin: 1,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });

          const messageId = await sendEmail({
            to: targetUser.email,
            subject: "LaserTag 2026: Battle Pass Slot Confirmed",
            template: MAILER_CONFIG.BOOKING_CONFIRMATION,
            variables: {
              name: targetUser.name,
              bookingId: activeBooking.id,
              bookingType: "Solo Mission",
              teamCode: "N/A",
              slotDate: slotDateStr,
              slotTime: slotTimeStr,
              passUrl,
              qrToken: assignedQrToken,
            },
            attachments: [
              {
                filename: `arena-pass-${assignedQrToken}.png`,
                content: qrBuffer,
                cid: "qrTicketCode",
              },
            ],
          });

          if (messageId) {
            await db
              .update(bookings)
              .set({ confirmationEmailSent: true })
              .where(eq(bookings.id, activeBooking.id));
          }
        }
      } catch (emailErr) {
        console.error("[Mailer] Background confirmation email dispatch error:", emailErr);
      }
    })();

    return activeBooking;
  },
};
