import { NotFoundError } from "../errors";
import type { Slot } from "./slots";

export type Team = { teamCode: string; leaderId: string; members: number };

/** A row as it comes back from the team_members -> user join. */
export type MemberRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  paid: boolean;
  isCheckedIn: boolean;
  checkedInAt: Date | null;
  qrToken: string | null;
};

export type TeamMemberDto = Omit<MemberRow, "qrToken"> & {
  isLeader: boolean;
  hasQrToken: boolean;
};

export type TeamDetail = {
  teamCode: string;
  leaderId: string;
  memberCount: number;
  members: TeamMemberDto[];
  slot: Slot | null;
};

export interface TeamsDeps {
  findTeam(teamCode: string): Promise<Team | undefined>;
  listMembers(teamCode: string): Promise<MemberRow[]>;
  findTeamSlot(teamCode: string, leaderId: string): Promise<Slot | undefined>;
}

/**
 * Pure row-to-DTO mapping, kept separate from the fetching so it can be tested
 * without any database plumbing.
 *
 * `memberCount` is the stored `teams.members` value, deliberately not
 * `members.length` — the two can legitimately disagree (a member row can be
 * missing) and the stored figure is the source of truth.
 */
export function toTeamDetail(
  team: Team,
  memberRows: MemberRow[],
  slot: Slot | null,
): TeamDetail {
  return {
    teamCode: team.teamCode,
    leaderId: team.leaderId,
    memberCount: team.members,
    members: memberRows.map(({ qrToken, ...member }) => ({
      ...member,
      isLeader: member.id === team.leaderId,
      // Issued-or-not, so an empty-string token still counts as issued.
      hasQrToken: qrToken !== null,
    })),
    slot,
  };
}

export function makeTeamsService(deps: TeamsDeps) {
  return {
    /** @throws NotFoundError */
    async getDetail(teamCode: string): Promise<TeamDetail> {
      const team = await deps.findTeam(teamCode);
      if (!team) throw new NotFoundError("Team not found");

      const [members, slot] = await Promise.all([
        deps.listMembers(teamCode),
        deps.findTeamSlot(teamCode, team.leaderId),
      ]);

      return toTeamDetail(team, members, slot ?? null);
    },
  };
}

export type TeamsService = ReturnType<typeof makeTeamsService>;
