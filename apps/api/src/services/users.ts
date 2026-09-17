import { eq } from "drizzle-orm";
import { db } from "@lasertag-26/database";
import { user } from "@lasertag-26/database/schema";
import { NotFoundError, ConflictError } from "../errors";
import {
  findUserById,
  findActiveRegistrationWithSlotForUser,
  findTeamForUser,
  isIdentityAllowlisted,
  markUserPaid,
  paidImportQueries,
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
  qrToken: string | null;
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
    slotChangeCount: number;
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

/** VIT student mailbox suffix. External participants use any other domain. */
export const VIT_EMAIL_DOMAIN = "@vitstudent.ac.in";

/** Shared external-participant marker. Many users hold it, so it is never unique-checked. */
export const EXTERNAL_REG_NUMBER = "N/A";

export function isVitEmailAddress(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase().endsWith(VIT_EMAIL_DOMAIN);
}

/**
 * Pure reg-number transition rule (no DB): returns the normalized value to
 * save, or throws a user-facing ConflictError.
 *
 * - Empty row: anything goes (first save).
 * - "N/A" row: upgrades to a real reg, or stays N/A (externals only).
 * - Real reg row: locked, same value only.
 * - "N/A" is accepted only for non-VIT emails; uniqueness is checked by the
 *   caller (skipped for "N/A", which is shared).
 */
export function resolveRegNumberUpdate(
  existingRegNumber: string | null | undefined,
  existingEmail: string | null | undefined,
  inputRegNumber: string | undefined,
): string | undefined {
  if (inputRegNumber === undefined) return undefined;
  const next = inputRegNumber.trim().toUpperCase();
  const current = (existingRegNumber ?? "").trim().toUpperCase();
  const currentLocked = current !== "" && current !== EXTERNAL_REG_NUMBER;
  if (currentLocked && next !== current) {
    throw new ConflictError(
      "Your registration number is locked and cannot be changed. Please contact us for help.",
    );
  }
  if (next === EXTERNAL_REG_NUMBER) {
    if (isVitEmailAddress(existingEmail)) {
      throw new ConflictError("VIT participants must save their registration number.");
    }
    return next;
  }
  return next;
}

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Self-healing verification: someone declared verified by reg number or
    // email (allowlist) flips to paid on read, so every consumer of the paid
    // flag — booking gate, check-in, client grey-out — just works.
    // Never let this break profile loads (e.g. allowlist table not yet
    // migrated): fail closed to unpaid, the popup/grey-out still guide right.
    let paid = user.paid;
    if (!paid) {
      try {
        if (await isIdentityAllowlisted(user.regNumber, user.email)) {
          await markUserPaid(userId);
          paid = true;
        }
      } catch {
        // fall through as unverified
      }
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
      paid,
      isCheckedIn: user.isCheckedIn,
      qrToken: user.qrToken ?? null,
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
            slotChangeCount: activeReg.booking.slotChangeCount ?? 0,
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

    // Reg numbers are unique per player (case-insensitive). Saving someone
    // else's number would corrupt paid-verification and check-in matching,
    // so reject with a plain-language message the popup shows as-is.
    const regNumber = resolveRegNumberUpdate(
      existing.regNumber,
      existing.email,
      input.reg_number,
    );
    if (regNumber !== undefined && regNumber !== EXTERNAL_REG_NUMBER) {
      const holder = await paidImportQueries.findUserByRegNumber(regNumber);
      if (holder && holder.id !== userId) {
        throw new ConflictError(
          "This registration number is already registered. Please check your registration number and try again, or contact us for help.",
        );
      }
    }

    const [updated] = await db
      .update(user)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phNumber: input.phone } : {}),
        ...(regNumber !== undefined ? { regNumber } : {}),
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
