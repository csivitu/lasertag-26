import { db } from "@lasertag-26/database";
import { slots, bookings, user, teams, teamMembers } from "@lasertag-26/database/schema";
import { asc, eq, and, inArray, lt, gt } from "drizzle-orm";

import { claimSlotSeat, isIdentityAllowlisted, releaseSlotSeat } from "../data/queries";
import { HttpError as AppError } from "../errors";
import { sendBookingConfirmationEmail, sendSlotChangeEmail } from "../services/mailer/booking-mailer";
import type { CreateSlotInput, ReserveSlotInput } from "../validations/slot.validation";

/** Max slot changes per user, lifetime. Same-slot re-books don't count. */
export const MAX_SLOT_CHANGES = 3;

export interface PastBooking {
  slotId: string;
  slotChangeCount: number;
  cancelledAt: Date | null;
}

/**
 * Pure: seed count for a fresh booking after cancel(s). Inherits the highest
 * count the user ever reached; re-booking a DIFFERENT slot than the most
 * recently held one consumes one change, same as a move. Returns null when
 * the allowance is exhausted.
 */
export function computeRebookSeedCount(
  history: PastBooking[],
  targetSlotId: string,
  maxChanges: number = MAX_SLOT_CHANGES,
): number | null {
  if (history.length === 0) return 0;
  const used = Math.max(...history.map((b) => b.slotChangeCount ?? 0));
  const recent = [...history].sort(
    (a, b) => (b.cancelledAt?.getTime() ?? 0) - (a.cancelledAt?.getTime() ?? 0),
  )[0];
  const seed = used + (recent.slotId !== targetSlotId ? 1 : 0);
  return seed > maxChanges ? null : seed;
}

/** Allowlist lookup that fails closed (false) instead of 500ing the booking. */
async function isAllowlistedSafe(targetUser: {
  regNumber: string | null;
  email: string;
}): Promise<boolean> {
  try {
    return await isIdentityAllowlisted(targetUser.regNumber, targetUser.email);
  } catch {
    return false;
  }
}

/** Postgres unique-violation, unwrapped through driver error nesting. */
function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; cause?: unknown };
  if (e.code === "23505") return true;
  return isUniqueViolation(e.cause ?? null);
}

export const slotController = {
  /**
   * Bounded listing: chronological, capped at 500 rows. The table is tiny
   * today, but an unbounded full-table scan is a free DoS primitive.
   */
  async getAllSlots(pagination?: { limit?: number; offset?: number }) {
    const limit = Math.min(Math.max(pagination?.limit ?? 200, 1), 500);
    const offset = Math.max(pagination?.offset ?? 0, 0);
    const allSlots = await db
      .select()
      .from(slots)
      .orderBy(asc(slots.startTime))
      .limit(limit)
      .offset(offset);
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
        totalCapacity: capacity,
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

    // Paid-verification gate: only verified (paid) participants may take a
    // FIRST slot. Changing an already-held slot stays open — that path is
    // governed by the MAX_SLOT_CHANGES allowance below instead.
    // The client also grey-outs booking, but this is the enforced check.

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

    // Claim one seat atomically BEFORE writing the booking. This single
    // statement is the serialization point for concurrent requests: losers
    // get zero rows back and fail here with 409 instead of overbooking.
    // Same-slot re-books already hold a seat and skip the claim.
    const prevBooking = existingActiveBookings[0];
    const needsSeat = !prevBooking || prevBooking.slotId !== slot_id;

    // First-time bookings require a verified (paid) participant. Slot
    // CHANGES skip this: holders keep moving within their change allowance.
    // The allowlist is checked live so freshly-verified users aren't stuck
    // behind a stale paid flag. Allowlist failures fail closed to the 403
    // below instead of 500ing the booking.
    if (!prevBooking && !targetUser.paid && !(await isAllowlistedSafe(targetUser))) {
      throw new AppError(
        403,
        "Slot booking is open only for verified participants. If you have registered but slot booking is not available, please contact us."
      );
    }

    // Change-slot limit: a user may move between slots at most
    // MAX_SLOT_CHANGES times, lifetime — not per booking row. Checked before
    // claiming so a rejected change never consumes a seat. Re-booking the
    // SAME slot is always allowed.
    if (needsSeat && prevBooking && (prevBooking.slotChangeCount ?? 0) >= MAX_SLOT_CHANGES) {
      throw new AppError(409, `Slot change limit reached (max ${MAX_SLOT_CHANGES} changes).`);
    }

    // Cancel + rebook must not reset the allowance: a fresh booking inherits
    // the highest count the user ever reached, and taking a different slot
    // than last held consumes one change — same as a move.
    let rebookSeedCount = 0;
    if (!prevBooking) {
      const history = await db
        .select({
          slotId: bookings.slotId,
          slotChangeCount: bookings.slotChangeCount,
          cancelledAt: bookings.cancelledAt,
        })
        .from(bookings)
        .where(eq(bookings.userId, user_id));
      const seed = computeRebookSeedCount(history, slot_id);
      if (seed === null) {
        throw new AppError(409, `Slot change limit reached (max ${MAX_SLOT_CHANGES} changes).`);
      }
      rebookSeedCount = seed;
    }

    if (needsSeat) {
      const claimed = await claimSlotSeat(slot_id);
      if (!claimed) {
        throw new AppError(409, "Selected slot is already fully booked.");
      }
    }

    let activeBooking;

    // Moves an existing active booking into the target slot. Shared by the
    // normal path and the race-recovery path so both behave identically.
    const moveBookingToSlot = async (
      prev: typeof existingActiveBookings[number],
    ) => {
      const changedSlot = prev.slotId !== slot_id;
      // Enforced here too (not just pre-claim) so the race-recovery path
      // can't push a booking past the allowance either.
      if (changedSlot && (prev.slotChangeCount ?? 0) >= MAX_SLOT_CHANGES) {
        throw new AppError(409, `Slot change limit reached (max ${MAX_SLOT_CHANGES} changes).`);
      }
      // If slot changed, restore 1 capacity to the old slot (atomic).
      if (changedSlot) {
        await releaseSlotSeat(prev.slotId);
      }

      const qrToken = prev.qrToken || `QR-${prev.id}`;

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
          // Same booking keeps its id and QR across moves; only real moves
          // consume from the change allowance.
          slotChangeCount: changedSlot ? (prev.slotChangeCount ?? 0) + 1 : (prev.slotChangeCount ?? 0),
        })
        .where(eq(bookings.id, prev.id))
        .returning();

      return updatedBooking;
    };

    // Heal: cancel duplicate active bookings beyond the first, freeing their
    // seats, so one user can never hold two slots at once.
    const healStrays = async (strays: typeof existingActiveBookings) => {
      for (const stray of strays) {
        await releaseSlotSeat(stray.slotId);
        await db
          .update(bookings)
          .set({ status: "cancelled", cancelledAt: new Date() })
          .where(eq(bookings.id, stray.id));
      }
    };

    try {
      if (prevBooking) {
        await healStrays(existingActiveBookings.slice(1));
        activeBooking = await moveBookingToSlot(prevBooking);
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
            // Carry the lifetime count so cancel + rebook can't reset it.
            slotChangeCount: rebookSeedCount,
          })
          .returning();

        activeBooking = newBooking;
      }
    } catch (err) {
      if (!activeBooking && isUniqueViolation(err)) {
        // Lost a race: a parallel request created the active booking first
        // (one-active-per-user index). Move that row instead of duplicating;
        // the seat claimed above becomes its seat, so it must not be released.
        const rivals = await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.userId, user_id),
              inArray(bookings.status, ["reserved", "confirmed"])
            )
          );
        const winner = rivals[0];
        if (winner) {
          await healStrays(rivals.slice(1));
          activeBooking = await moveBookingToSlot(winner);
          if (winner.slotId === slot_id) {
            // Same-slot double submit: the claimed seat is spare, give it back.
            await releaseSlotSeat(slot_id);
          }
        }
      }
      if (!activeBooking) {
        // Give the claimed seat back so a failed booking never leaks capacity.
        if (needsSeat) {
          await releaseSlotSeat(slot_id);
        }
        throw err;
      }
    }

    const assignedQrToken = activeBooking.qrToken || `QR-${activeBooking.id}`;

    // Ensure user record also holds the qrToken for instant scanner lookups
    await db
      .update(user)
      .set({ qrToken: assignedQrToken })
      .where(eq(user.id, user_id));

    // Format slot date and time for confirmation email (arena wall-clock: IST)
    const IST = "Asia/Kolkata";
    const slotStartDate = new Date(targetSlot.startTime);
    const slotEndDate = new Date(targetSlot.endTime);

    const slotDateStr = slotStartDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: IST,
    });

    const formatHour = (d: Date) =>
      d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: IST,
      });

    const slotTimeStr = `${formatHour(slotStartDate)} - ${formatHour(slotEndDate)}`;
    const passUrl = `${process.env.WEB_ORIGIN || "http://localhost:3000"}/profile`;

    const emailParams = {
      bookingId: activeBooking.id,
      userId: user_id,
      userName: targetUser.name,
      userEmail: targetUser.email,
      type,
      teamCode: type === "team" ? (team_code ?? null) : null,
      qrToken: assignedQrToken,
      newSlot: { slotDate: slotDateStr, slotTime: slotTimeStr },
      passUrl,
    };

    // Asynchronous non-blocking dispatch: Send the right email based on
    // whether this is a brand-new booking or a slot change.
    const isSlotChange = prevBooking && prevBooking.slotId !== slot_id;

    if (isSlotChange) {
      // Fetch the OLD slot row for the "rescheduled" email. prevBooking still
      // holds the original slotId from before moveBookingToSlot overwrote it.
      void (async () => {
        try {
          const [oldSlot] = await db
            .select()
            .from(slots)
            .where(eq(slots.id, prevBooking.slotId));

          let oldSlotDateStr = "N/A";
          let oldSlotTimeStr = "N/A";
          if (oldSlot) {
            const os = new Date(oldSlot.startTime);
            const oe = new Date(oldSlot.endTime);
            oldSlotDateStr = os.toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "short", day: "numeric", timeZone: IST,
            });
            oldSlotTimeStr = `${formatHour(os)} - ${formatHour(oe)}`;
          }

          await sendSlotChangeEmail({
            ...emailParams,
            oldSlot: { slotDate: oldSlotDateStr, slotTime: oldSlotTimeStr },
          });
        } catch (emailErr) {
          console.error("[Mailer] Background slot-change email dispatch error:", emailErr);
        }
      })();
    } else {
      void sendBookingConfirmationEmail(emailParams);
    }

    return activeBooking;
  },
};
