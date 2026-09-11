import { db } from "@lasertag-26/database";
import { teams, teamMembers, user, bookings, slots } from "@lasertag-26/database/schema";
import { eq, and, or, inArray, asc } from "drizzle-orm";

import { HttpError as AppError } from "../errors";


export interface CreateTeamInput {
  leader_id: string;
  team_code: string;
  members?: number;
}

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
          name: t.teamCode,
          leaderId: t.leaderId,
          leader: leader || null,
          memberCount: t.members,
          members: membersList,
          bookings: teamBookings,
        };
      })
    );

    return teamsWithDetails;
  },

  async createTeam(input: CreateTeamInput) {
    const { leader_id, team_code, members } = input;

    const leaderExists = await db
      .select()
      .from(user)
      .where(eq(user.id, leader_id));

    if (leaderExists.length === 0) {
      throw new AppError(404, "Leader user not found.");
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
        leaderId: leader_id,
        members: members || 1,
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

    const existingMembership = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamCode, teamId),
          eq(teamMembers.userId, userId)
        )
      );

    if (existingMembership.length > 0) {
      throw new AppError(400, "User is already a member of this team.");
    }

    await db.insert(teamMembers).values({
      teamCode: teamId,
      userId: userId,
    });

    const [updatedTeam] = await db
      .update(teams)
      .set({ members: team.members + 1 })
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
};

export const teamService = teamController;
