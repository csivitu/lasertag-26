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

  async convertTeamToSolo(teamCode: string, userId: string) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, teamCode));

    if (!team) {
      throw new AppError(404, "Team not found.");
    }

    if (team.leaderId !== userId) {
      throw new AppError(
        403,
        "Only the team leader can convert the team to solo mode."
      );
    }

    // Check members list
    const membersList = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamCode, teamCode));

    const otherMembers = membersList.filter((m) => m.userId !== userId);
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
      .where(eq(bookings.teamCode, teamCode));

    // Delete team membership and the team record
    await db.delete(teamMembers).where(eq(teamMembers.teamCode, teamCode));
    await db.delete(teams).where(eq(teams.teamCode, teamCode));

    return {
      converted: true,
      teamCode,
      message: "Team converted to solo mode successfully.",
    };
  },

  /**
   * Removes the caller from whatever team they are currently in.
   * A leader with other active members cannot leave (remove members or
   * convert first); a sole-member leader deletes the team as well.
   * Missing membership is a 404 so solo onboarding can treat it as "nothing
   * to do" instead of a failure.
   */
  async leaveTeam(userId: string) {
    const memberships = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));

    if (memberships.length === 0) {
      throw new AppError(404, "You are not currently in a team.");
    }

    const teamCode = memberships[0].teamCode;
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, teamCode));

    if (team && team.leaderId === userId) {
      const squad = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.teamCode, teamCode));
      const otherMembers = squad.filter((m) => m.userId !== userId);
      if (otherMembers.length > 0) {
        throw new AppError(
          400,
          "As team leader with active members, remove members or convert the team before leaving."
        );
      }
      // Sole-member leader: leaving deletes the team as well.
      await db.delete(teamMembers).where(eq(teamMembers.teamCode, teamCode));
      await db.delete(teams).where(eq(teams.teamCode, teamCode));
      return { left: true, teamCode, teamDeleted: true };
    }

    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamCode, teamCode),
          eq(teamMembers.userId, userId)
        )
      );
    return { left: true, teamCode, teamDeleted: false };
  },

  /**
   * Self-service convert: derives the team from the caller's membership,
   * so clients that never learned the team code (profile convert button,
   * solo onboarding) don't need it.
   */
  async convertMyTeamToSolo(userId: string) {
    const memberships = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));

    if (memberships.length === 0) {
      throw new AppError(404, "You are not currently in a team.");
    }

    return teamController.convertTeamToSolo(memberships[0].teamCode, userId);
  },
};

export const teamService = teamController;
