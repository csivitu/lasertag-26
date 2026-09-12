import { NotFoundError } from "../errors";
import {
  findUserById,
  findActiveRegistrationWithSlotForUser,
} from "../data/queries";

export type UserProfileDto = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  paid: boolean;
  isCheckedIn: boolean;
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
    };
  } | null;
};

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const activeReg = await findActiveRegistrationWithSlotForUser(userId);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phNumber ?? null,
      paid: user.paid,
      isCheckedIn: user.isCheckedIn,
      activeRegistration: activeReg
        ? {
            id: activeReg.booking.id,
            type: activeReg.booking.type,
            status: activeReg.booking.status,
            slotId: activeReg.booking.slotId,
            teamCode: activeReg.booking.teamCode,
            qrToken: activeReg.booking.qrToken,
            confirmedAt: activeReg.booking.confirmedAt,
            cancelledAt: activeReg.booking.cancelledAt,
            slot: {
              id: activeReg.slot.id,
              startTime: activeReg.slot.startTime,
              endTime: activeReg.slot.endTime,
              capacity: activeReg.slot.capacity,
            },
          }
        : null,
    };
  },
};
