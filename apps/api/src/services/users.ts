import { eq } from "drizzle-orm";
import { db } from "@lasertag-26/database";
import { user } from "@lasertag-26/database/schema";
import { NotFoundError } from "../errors";
import {
  findUserById,
  findActiveRegistrationWithSlotForUser,
  findTeamForUser,
} from "../data/queries";
import type { UpdateMyDetailsInput } from "../validations/users.validation";

export type UserProfileDto = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  regNumber: string | null;
  paid: boolean;
  isCheckedIn: boolean;
  team: {
    teamCode: string;
    isLeader: boolean;
    leaderId: string;
    memberCount: number;
    maxMembers: number;
    members: Array<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      isLeader: boolean;
    }>;
  } | null;
  activeRegistration: {
    id: string;
    type: "individual" | "team";
    status: "reserved" | "confirmed" | "cancelled";
    slotId: string;
    teamCode: string | null;
    qrToken: string | null;
    confirmedAt: Date | null;
    cancelledAt: Date | null;
    slot: {
      id: string;
      startTime: Date;
      endTime: Date;
      capacity: number;
      slotDate: string;
      slotTime: string;
    };
  } | null;
};

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const [activeReg, team] = await Promise.all([
      findActiveRegistrationWithSlotForUser(userId),
      findTeamForUser(userId),
    ]);

    let slotDetails = null;
    if (activeReg) {
      // Arena wall-clock is IST regardless of where the server runs.
      const IST = "Asia/Kolkata";
      const sStart = new Date(activeReg.slot.startTime);
      const sEnd = new Date(activeReg.slot.endTime);

      const day = Number(
        new Intl.DateTimeFormat("en-US", { timeZone: IST, day: "numeric" }).format(sStart),
      );
      const nth = (d: number) => {
        if (d > 3 && d < 21) return `${d}th`;
        switch (d % 10) {
          case 1:  return `${d}st`;
          case 2:  return `${d}nd`;
          case 3:  return `${d}rd`;
          default: return `${d}th`;
        }
      };
      const month = sStart.toLocaleDateString("en-US", { month: "long", timeZone: IST });
      const year = sStart.toLocaleDateString("en-US", { year: "numeric", timeZone: IST });
      const slotDate = `${nth(day)} ${month},\n${year}`;

      const formatHour = (d: Date) =>
        d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: IST,
        });

      const slotTime = `${formatHour(sStart)} -\n${formatHour(sEnd)}`;

      slotDetails = {
        id: activeReg.slot.id,
        startTime: activeReg.slot.startTime,
        endTime: activeReg.slot.endTime,
        capacity: activeReg.slot.capacity,
        slotDate,
        slotTime,
      };
    }

    // Registration number + phone collected at select-mode onboarding.
    // Saved via PATCH /users/me/details; read back here for the pass.
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phNumber ?? null,
      regNumber: user.regNumber ?? null,
      paid: user.paid,
      isCheckedIn: user.isCheckedIn,
      team,
      activeRegistration: activeReg && slotDetails
        ? {
            id: activeReg.booking.id,
            type: activeReg.booking.type,
            status: activeReg.booking.status,
            slotId: activeReg.booking.slotId,
            teamCode: activeReg.booking.teamCode,
            qrToken: activeReg.booking.qrToken,
            confirmedAt: activeReg.booking.confirmedAt,
            cancelledAt: activeReg.booking.cancelledAt,
            slot: slotDetails,
          }
        : null,
    };
  },

  /** Saves select-mode onboarding fields onto the signed-in user's row. */
  async updateMyDetails(userId: string, input: UpdateMyDetailsInput) {
    const existing = await findUserById(userId);
    if (!existing) {
      throw new NotFoundError("User not found");
    }

    const [updated] = await db
      .update(user)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phNumber: input.phone } : {}),
        ...(input.reg_number !== undefined ? { regNumber: input.reg_number } : {}),
      })
      .where(eq(user.id, userId))
      .returning();

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phNumber ?? null,
      regNumber: updated.regNumber ?? null,
    };
  },
};
