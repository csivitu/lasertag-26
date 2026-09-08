import { db } from '../../../../packages/database';
import { teams, teamMembers, users } from '../../../../packages/database/schema';
import { eq, and } from 'drizzle-orm';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export interface CreateTeamInput {
  leader_id: string;
  team_code: string;
  members?: number;
}

export const teamService = {
  async createTeam(input: CreateTeamInput) {
    const { leader_id, team_code, members } = input;

    const leaderExists = await db
      .select()
      .from(users)
      .where(eq(users.id, leader_id));

    if (leaderExists.length === 0) {
      throw new AppError(404, 'Leader user not found.');
    }

    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, team_code));

    if (existingTeam.length > 0) {
      throw new AppError(400, 'Team code already exists.');
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
      throw new AppError(404, 'Team not found.');
    }

    const [leader] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phNumber: users.phNumber,
      })
      .from(users)
      .where(eq(users.id, team.leaderId));

    return {
      ...team,
      leader: leader || null,
    };
  },

  async joinTeam(teamId: string, userId: string) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, teamId));

    if (!team) {
      throw new AppError(404, 'Team not found.');
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new AppError(404, 'User not found.');
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
      throw new AppError(400, 'User is already a member of this team.');
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
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async getTeamMembers(teamId: string) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, teamId));

    if (!team) {
      throw new AppError(404, 'Team not found.');
    }

    const membersList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phNumber: users.phNumber,
        isCheckedIn: users.isCheckedIn,
        paid: users.paid,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
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
      throw new AppError(404, 'Team not found.');
    }

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/join?team_code=${encodeURIComponent(team.teamCode)}`;

    return {
      team_code: team.teamCode,
      invite_code: team.teamCode,
      invite_url: inviteUrl,
    };
  },
};
