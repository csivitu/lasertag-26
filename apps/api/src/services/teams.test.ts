import { describe, expect, mock, test } from "bun:test";

import { NotFoundError } from "../errors";
import type { Slot } from "./slots";
import { makeTeamsService, toTeamDetail, type MemberRow, type Team, type TeamsDeps } from "./teams";

const team: Team = { teamCode: "TEAM-042", leaderId: "leader-1", members: 2 };

const leaderRow: MemberRow = {
  id: "leader-1",
  name: "Priya Nair",
  email: "priya@example.com",
  phone: "9876543210",
  paid: true,
  isCheckedIn: false,
  checkedInAt: null,
  qrToken: "tok-1",
};

const memberRow: MemberRow = {
  id: "member-1",
  name: "Arjun Mehta",
  email: "arjun@example.com",
  phone: null,
  paid: false,
  isCheckedIn: false,
  checkedInAt: null,
  qrToken: null,
};

const slot: Slot = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  startTime: new Date("2026-03-14T09:00:00.000Z"),
  endTime: new Date("2026-03-14T10:00:00.000Z"),
  capacity: 10,
};

describe("toTeamDetail", () => {
  test("marks isLeader true only for the row matching leaderId", () => {
    const detail = toTeamDetail(team, [leaderRow, memberRow], slot);
    expect(detail.members.find((m) => m.id === "leader-1")?.isLeader).toBe(true);
    expect(detail.members.find((m) => m.id === "member-1")?.isLeader).toBe(false);
  });

  test("hasQrToken is false for null and true for an issued token", () => {
    const detail = toTeamDetail(team, [leaderRow, memberRow], slot);
    expect(detail.members.find((m) => m.id === "leader-1")?.hasQrToken).toBe(true);
    expect(detail.members.find((m) => m.id === "member-1")?.hasQrToken).toBe(false);
  });

  test("hasQrToken is true for an empty-string token (issued-or-not, not truthiness)", () => {
    const detail = toTeamDetail(team, [{ ...leaderRow, qrToken: "" }], slot);
    expect(detail.members[0]?.hasQrToken).toBe(true);
  });

  test("memberCount comes from teams.members, not members.length", () => {
    const detail = toTeamDetail(team, [leaderRow], slot);
    expect(detail.memberCount).toBe(2);
    expect(detail.members).toHaveLength(1);
  });

  test("slot is null when the team has no booking", () => {
    const detail = toTeamDetail(team, [leaderRow], null);
    expect(detail.slot).toBeNull();
  });

  test("handles an empty member list", () => {
    const detail = toTeamDetail(team, [], slot);
    expect(detail.members).toEqual([]);
  });
});

function makeDeps(overrides: Partial<TeamsDeps> = {}): TeamsDeps {
  return {
    findTeam: mock(async () => team),
    listMembers: mock(async () => [leaderRow, memberRow]),
    findTeamSlot: mock(async () => slot),
    ...overrides,
  };
}

describe("makeTeamsService", () => {
  test("getDetail: 404s on an unknown team and never fetches members", async () => {
    const listMembers = mock(async () => [leaderRow]);
    const deps = makeDeps({ findTeam: mock(async () => undefined), listMembers });
    const service = makeTeamsService(deps);

    await expect(service.getDetail("NOPE")).rejects.toBeInstanceOf(NotFoundError);
    expect(listMembers).not.toHaveBeenCalled();
  });

  test("getDetail: assembles the full detail for a known team", async () => {
    const service = makeTeamsService(makeDeps());
    const detail = await service.getDetail("TEAM-042");

    expect(detail.teamCode).toBe("TEAM-042");
    expect(detail.members).toHaveLength(2);
    expect(detail.slot).toEqual(slot);
  });
});
