import { db } from "@lasertag-26/database";
import {
  teams,
  teamMembers,
  user,
  bookings,
  slots,
} from "@lasertag-26/database/schema";
import { eq, and, or, inArray, asc } from "drizzle-orm";

import { HttpError as AppError } from "../errors";
import { sendEmail, MAILER_CONFIG } from "../services/mailer";
import type { CreateTeamInput } from "../validations/team.validation";

export const teamController = {
  async getAllTeams() {
    const allTeams = await db.select().from(teams);

    const teamsWithDetails = await Promise.all(
      allTeams.map(async (t) => {
        const [leader] = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
          })
          .from(user)
          .where(eq(user.id, t.leaderId));

        const membersList = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
          })
          .from(teamMembers)
          .innerJoin(user, eq(teamMembers.userId, user.id))
          .where(eq(teamMembers.teamCode, t.teamCode));

        const memberIds = [t.leaderId, ...membersList.map((m) => m.id)];

        const teamBookings = await db
          .select({
            id: bookings.id,
            type: bookings.type,
            userId: bookings.userId,
            slotId: bookings.slotId,
            confirmationEmailSent: bookings.confirmationEmailSent,
            startTime: slots.startTime,
            endTime: slots.endTime,
          })
          .from(bookings)
          .innerJoin(slots, eq(bookings.slotId, slots.id))
          .where(
            or(
              eq(bookings.teamCode, t.teamCode),
              inArray(bookings.userId, memberIds)
            )
          )
          .orderBy(asc(slots.startTime));

        return {
          id: t.teamCode,
          teamCode: t.teamCode,
          name: t.name || t.teamCode,
          leaderId: t.leaderId,
          leader: leader || null,
          memberCount: membersList.length,
          maxMembers: 5,
          members: membersList,
          bookings: teamBookings,
        };
      })
    );

    return teamsWithDetails;
  },

  async createTeam(input: CreateTeamInput) {
    const { leader_id, team_code, members, name } = input;

    const leaderExists = await db
      .select()
      .from(user)
      .where(eq(user.id, leader_id));

    if (leaderExists.length === 0) {
      throw new AppError(404, "Leader user not found.");
    }

    // 1. User can only create 1 team at a time and only be in 1 team at a time
    const userInAnyTeam = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, leader_id));

    if (userInAnyTeam.length > 0) {
      const existingMyTeam = await db
        .select()
        .from(teams)
        .where(and(eq(teams.teamCode, team_code), eq(teams.leaderId, leader_id)));
      if (existingMyTeam.length > 0) {
        if (name && existingMyTeam[0].name !== name) {
          const [updated] = await db
            .update(teams)
            .set({ name })
            .where(eq(teams.teamCode, team_code))
            .returning();
          return updated;
        }
        return existingMyTeam[0];
      }

      throw new AppError(
        400,
        "You are already in a team. You can only create or be in 1 team at a time."
      );
    }

    // 2. Cannot create a team if user already has an active individual/solo booking
    const activeSoloBooking = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, leader_id),
          eq(bookings.type, "individual"),
          inArray(bookings.status, ["reserved", "confirmed"])
        )
      );

    if (activeSoloBooking.length > 0) {
      throw new AppError(
        400,
        "You have an active solo pass. You cannot create a team while playing solo."
      );
    }

    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, team_code));

    if (existingTeam.length > 0) {
      throw new AppError(400, "Team code already exists.");
    }

    const [newTeam] = await db
      .insert(teams)
      .values({
        teamCode: team_code,
        name: name || team_code,
        leaderId: leader_id,
        members: members ? Math.min(5, members) : 1,
      })
      .returning();

    await db.insert(teamMembers).values({
      teamCode: team_code,
      userId: leader_id,
    });

    return newTeam;
  },

  async getTeamByCode(code: string) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, code));

    if (!team) {
      throw new AppError(404, "Team not found.");
    }

    const [leader] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phNumber: user.phNumber,
      })
      .from(user)
      .where(eq(user.id, team.leaderId));

    const membersList = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phNumber: user.phNumber,
      })
      .from(teamMembers)
      .innerJoin(user, eq(teamMembers.userId, user.id))
      .where(eq(teamMembers.teamCode, code));

    const memberIds = [team.leaderId, ...membersList.map((m) => m.id)];

    const teamBookings = await db
      .select({
        id: bookings.id,
        type: bookings.type,
        userId: bookings.userId,
        slotId: bookings.slotId,
        confirmationEmailSent: bookings.confirmationEmailSent,
        startTime: slots.startTime,
        endTime: slots.endTime,
      })
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .where(
        or(
          eq(bookings.teamCode, team.teamCode),
          inArray(bookings.userId, memberIds)
        )
      )
      .orderBy(asc(slots.startTime));

    return {
      ...team,
      maxMembers: 5,
      memberCount: membersList.length,
      leader: leader || null,
      members: membersList,
      bookings: teamBookings,
    };
  },

  async joinTeam(teamId: string, userId: string) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, teamId));

    if (!team) {
      throw new AppError(404, "Team not found.");
    }

    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId));

    if (!foundUser) {
      throw new AppError(404, "User not found.");
    }

    // 1. Team limit is strictly MAX 5 members
    const currentTeamMembers = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamCode, teamId));

    if (currentTeamMembers.length >= 5 || team.members >= 5) {
      throw new AppError(400, "Team is full. The maximum limit is 5 members.");
    }

    // 2. User can only be in 1 team at a time
    const userInAnyTeam = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));

    if (userInAnyTeam.length > 0) {
      throw new AppError(
        400,
        "You are already a member of a team. You can only be in 1 team at a time."
      );
    }

    // 3. User cannot join a team if already holding an active solo pass
    const activeSoloBooking = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, userId),
          eq(bookings.type, "individual"),
          inArray(bookings.status, ["reserved", "confirmed"])
        )
      );

    if (activeSoloBooking.length > 0) {
      throw new AppError(
        400,
        "You have an active solo pass. You cannot join a team while playing solo."
      );
    }

    await db.insert(teamMembers).values({
      teamCode: teamId,
      userId,
    });

    const [updatedTeam] = await db
      .update(teams)
      .set({ members: currentTeamMembers.length + 1 })
      .where(eq(teams.teamCode, teamId))
      .returning();

    // Fetch team leader info
    const [leaderUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, team.leaderId));

    // Check if squad already has a confirmed slot booking
    const activeTeamBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.teamCode, teamId),
          inArray(bookings.status, ["reserved", "confirmed"])
        )
      );

    let slotStatusStr = "Pending: Your squad leader will reserve the arena slot.";

    if (activeTeamBookings.length > 0) {
      const refBooking = activeTeamBookings[0];
      const [targetSlot] = await db
        .select()
        .from(slots)
        .where(eq(slots.id, refBooking.slotId));

      if (targetSlot) {
        const slotStartDate = new Date(targetSlot.startTime);
        const slotEndDate = new Date(targetSlot.endTime);
        const slotDateStr = slotStartDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        const formatHour = (d: Date) =>
          d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        const slotTimeStr = `${formatHour(slotStartDate)} - ${formatHour(slotEndDate)}`;
        slotStatusStr = `${slotDateStr} (${slotTimeStr}) [${(refBooking.side || "RED").toUpperCase()} SQUAD]`;

        // Automatically assign this newly joined member to the team's booked slot
        const memberQrToken = `QR-${refBooking.slotId.slice(0, 4)}-${userId.slice(0, 6)}-${Math.floor(100 + Math.random() * 900)}`;
        const bookingId = `BKG-${Date.now()}-${userId.slice(0, 6)}`;

        await db.insert(bookings).values({
          id: bookingId,
          type: "team",
          status: "confirmed",
          userId,
          teamCode: teamId,
          slotId: refBooking.slotId,
          side: refBooking.side,
          qrToken: memberQrToken,
          confirmedAt: new Date(),
          confirmationEmailSent: false,
        });

        await db.update(user).set({ qrToken: memberQrToken }).where(eq(user.id, userId));

        if (targetSlot.capacity > 0) {
          await db
            .update(slots)
            .set({ capacity: Math.max(0, targetSlot.capacity - 1) })
            .where(eq(slots.id, refBooking.slotId));
        }
      }
    }

    // Asynchronously send team join confirmation email
    void (async () => {
      try {
        await sendEmail({
          to: foundUser.email,
          subject: `LaserTag 2026: Squad Enlistment Confirmed [${team.name || team.teamCode}]`,
          template: MAILER_CONFIG.TEAM_JOIN,
          variables: {
            name: foundUser.name,
            teamName: team.name || team.teamCode,
            teamCode: team.teamCode,
            leaderName: leaderUser?.name || "Squad Leader",
            memberCount: currentTeamMembers.length + 1,
            slotStatus: slotStatusStr,
            passUrl: `${process.env.WEB_ORIGIN || "http://localhost:3000"}/profile`,
          },
        });
      } catch (mailErr) {
        console.error("[Mailer] Failed to send team join email:", mailErr);
      }
    })();

    return {
      team: updatedTeam,
      joined_user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
      },
    };
  },

  async getTeamMembers(teamId: string) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, teamId));

    if (!team) {
      throw new AppError(404, "Team not found.");
    }

    const membersList = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phNumber: user.phNumber,
        isCheckedIn: user.isCheckedIn,
        paid: user.paid,
      })
      .from(teamMembers)
      .innerJoin(user, eq(teamMembers.userId, user.id))
      .where(eq(teamMembers.teamCode, teamId));

    return {
      team_code: team.teamCode,
      total_members: membersList.length,
      max_members: 5,
      members: membersList,
    };
  },

  async generateInvite(teamId: string) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, teamId));

    if (!team) {
      throw new AppError(404, "Team not found.");
    }

    const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/join?team_code=${encodeURIComponent(team.teamCode)}`;

    return {
      team_code: team.teamCode,
      invite_code: team.teamCode,
      invite_url: inviteUrl,
    };
  },

  async convertTeamToSolo(targetTeamCode?: string, targetUserId?: string) {
    let resolvedUserId = targetUserId;
    let resolvedTeamCode = targetTeamCode;

    if (!resolvedUserId && resolvedTeamCode) {
      const [t] = await db.select().from(teams).where(eq(teams.teamCode, resolvedTeamCode));
      if (t) resolvedUserId = t.leaderId;
    }

    if (!resolvedTeamCode && resolvedUserId) {
      const [membership] = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.userId, resolvedUserId));
      if (membership) {
        resolvedTeamCode = membership.teamCode;
      }
    }

    if (!resolvedTeamCode || !resolvedUserId) {
      throw new AppError(400, "Unable to resolve team code or user for solo conversion.");
    }

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, resolvedTeamCode));

    if (!team) {
      throw new AppError(404, "Team not found.");
    }

    if (team.leaderId !== resolvedUserId) {
      throw new AppError(
        403,
        "Only the team leader can convert the team to solo mode."
      );
    }

    // Check members list: only allowed if there's only 1 member (the leader)
    const membersList = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamCode, resolvedTeamCode));

    const otherMembers = membersList.filter((m) => m.userId !== resolvedUserId);
    if (otherMembers.length > 0) {
      throw new AppError(
        400,
        "Cannot convert team with active members to solo mode. Remove other members first."
      );
    }

    // Convert any existing team bookings to individual bookings for the leader
    await db
      .update(bookings)
      .set({
        type: "individual",
        teamCode: null,
      })
      .where(eq(bookings.teamCode, resolvedTeamCode));

    // Delete team membership and the team record
    await db.delete(teamMembers).where(eq(teamMembers.teamCode, resolvedTeamCode));
    await db.delete(teams).where(eq(teams.teamCode, resolvedTeamCode));

    return {
      converted: true,
      teamCode: resolvedTeamCode,
      message: "Team converted to solo mode successfully.",
    };
  },
};

export const teamService = teamController;
