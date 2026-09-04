import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, teams, teamMembers, users, bookings, slots } from "@lasertag-26/database";

export const adminTeamsRouter = Router();

// GET /admin/teams/:team_id — team detail: members (each with payment/QR
// status), and the slot booked for the team, if any. Uses the existing
// teams/teamMembers/users/bookings/slots schema (packages/database/schema.ts)
// — no new tables invented.
adminTeamsRouter.get("/:team_id", async (req: Request, res: Response) => {
  const { team_id } = req.params;
  if (typeof team_id !== "string" || team_id.trim() === "") {
    res.status(400).json({ error: "team_id is required" });
    return;
  }

  const [team] = await db.select().from(teams).where(eq(teams.teamCode, team_id));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  const memberRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phNumber,
      paid: users.paid,
      isCheckedIn: users.isCheckedIn,
      checkedInAt: users.checkedInAt,
      qrToken: users.qrToken,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamCode, team_id));

  const members = memberRows.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    isLeader: member.id === team.leaderId,
    paid: member.paid,
    isCheckedIn: member.isCheckedIn,
    checkedInAt: member.checkedInAt,
    hasQrToken: member.qrToken !== null,
  }));

  // A team's slot comes from its own booking (bookings.teamCode -> this
  // team, bookings.slotId -> the slot), not a direct column on teams.
  const [teamBooking] = await db
    .select({ slot: slots })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .where(eq(bookings.teamCode, team_id));

  res.json({
    teamCode: team.teamCode,
    leaderId: team.leaderId,
    memberCount: team.members,
    members,
    slot: teamBooking?.slot ?? null,
  });
});
