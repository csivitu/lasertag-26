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
import { env } from "../env";
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
    const { leader_id, team_code, members, name, fullName, regNo, phone } = input;

    if (!leader_id) {
      throw new AppError(400, "leader_id is required.");
    }

    const leaderExists = await db
      .select()
      .from(user)
      .where(eq(user.id, leader_id));

    if (leaderExists.length === 0) {
      throw new AppError(404, "Leader user not found.");
    }

    // Persist leader profile updates if provided
    if (fullName || regNo || phone) {
      const updateData: Partial<{ name: string; regNo: string; phNumber: string }> = {};
      if (fullName) updateData.name = fullName;
      if (regNo) updateData.regNo = regNo;
      if (phone) updateData.phNumber = phone;
      await db.update(user).set(updateData).where(eq(user.id, leader_id));
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

  async joinTeam(
    teamId: string,
    userId: string,
    details?: { fullName?: string; regNo?: string; phone?: string }
  ) {
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

    // Persist operative profile updates if provided
    if (details?.fullName || details?.regNo || details?.phone) {
      const updateData: Partial<{ name: string; regNo: string; phNumber: string }> = {};
      if (details.fullName) updateData.name = details.fullName;
      if (details.regNo) updateData.regNo = details.regNo;
      if (details.phone) updateData.phNumber = details.phone;
      await db.update(user).set(updateData).where(eq(user.id, userId));
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
        slotStatusStr = `Confirmed: ${slotStartDate.toDateString()} at ${slotStartDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      }
    }

    // Send Team Join Confirmation Email asynchronously
    if (foundUser.email) {
      try {
        await sendEmail({
          to: foundUser.email,
          subject: `LaserTag 2026 - Squad Deployment Confirmation (${team.name || teamId})`,
          template: MAILER_CONFIG.TEAM_JOIN,
          variables: {
            name: foundUser.name || "Operative",
            teamName: team.name || teamId,
            teamCode: teamId,
            leaderName: leaderUser?.name || "Squad Leader",
            slotDetails: slotStatusStr,
            dashboardUrl: `${env.WEB_ORIGIN}/profile`,
          },
        });
      } catch (emailErr) {
        console.error(`Failed to send team-join email to ${foundUser.email}:`, emailErr);
      }
    }

    return updatedTeam;
  },

  async getTeamMembers(teamId: string) {
    const members = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phNumber: user.phNumber,
        regNo: user.regNo,
      })
      .from(teamMembers)
      .innerJoin(user, eq(teamMembers.userId, user.id))
      .where(eq(teamMembers.teamCode, teamId));

    return members;
  },

  async generateInvite(teamId: string) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, teamId));

    if (!team) {
      throw new AppError(404, "Team not found.");
    }

    return {
      team_id: teamId,
      team_code: team.teamCode,
      name: team.name,
      share_link: `/join?code=${team.teamCode}`,
    };
  },

  async convertTeamToSolo(teamId?: string, userId?: string) {
    if (!userId) {
      throw new AppError(400, "user_id is required to convert to solo mode.");
    }

    // 1. If teamId is not provided, locate which team the user is currently in
    let targetTeamCode = teamId;
    if (!targetTeamCode) {
      const [membership] = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.userId, userId));

      if (!membership) {
        throw new AppError(404, "Operative is not currently part of any squad.");
      }
      targetTeamCode = membership.teamCode;
    }

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, targetTeamCode));

    if (!team) {
      throw new AppError(404, "Squad not found.");
    }

    // 2. Remove user from team members
    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamCode, targetTeamCode),
          eq(teamMembers.userId, userId)
        )
      );

    // 3. Remove any active team bookings for this user/team
    await db
      .delete(bookings)
      .where(
        and(
          eq(bookings.teamCode, targetTeamCode),
          eq(bookings.userId, userId)
        )
      );

    // 4. If the user was the squad leader, delete the entire team and disband other members
    if (team.leaderId === userId) {
      // Remove all remaining members
      await db
        .delete(teamMembers)
        .where(eq(teamMembers.teamCode, targetTeamCode));

      // Remove remaining team bookings
      await db
        .delete(bookings)
        .where(eq(bookings.teamCode, targetTeamCode));

      // Delete the squad
      await db
        .delete(teams)
        .where(eq(teams.teamCode, targetTeamCode));
    } else {
      // Decrement team member count
      const remainingMembers = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.teamCode, targetTeamCode));

      await db
        .update(teams)
        .set({ members: remainingMembers.length })
        .where(eq(teams.teamCode, targetTeamCode));
    }

    return {
      message: "Operative successfully detached to Solo Operative mode.",
      disbanded: team.leaderId === userId,
    };
  },
};
