import { NotFoundError } from "../errors";
import {
  findUserById,
  findActiveRegistrationWithSlotForUser,
  findTeamForUser,
} from "../data/queries";

export type UserProfileDto = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
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
      const sStart = new Date(activeReg.slot.startTime);
      const sEnd = new Date(activeReg.slot.endTime);

      const day = sStart.getDate();
      const nth = (d: number) => {
        if (d > 3 && d < 21) return `${d}th`;
        switch (d % 10) {
          case 1:  return `${d}st`;
          case 2:  return `${d}nd`;
          case 3:  return `${d}rd`;
          default: return `${d}th`;
        }
      };
      const month = sStart.toLocaleDateString("en-US", { month: "long" });
      const year = sStart.getFullYear();
      const slotDate = `${nth(day)} ${month},\n${year}`;

      const formatHour = (d: Date) =>
        d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

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

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phNumber ?? null,
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
};
