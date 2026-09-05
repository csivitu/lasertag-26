import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, teams, teamMembers, user, bookings, slots } from "@lasertag-26/database";

export const adminTeamsRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TeamMember:
 *       type: object
 *       description: A teams.team_code member, joined from team_members -> user (auth-schema.ts).
 *       properties:
 *         id:
 *           type: string
 *           description: user.id
 *           example: 3paBx9yqT2fJd8x2s0h1mZ
 *         name:
 *           type: string
 *           description: user.name
 *           example: Priya Nair
 *         email:
 *           type: string
 *           description: user.email
 *           example: priya@example.com
 *         phone:
 *           type: string
 *           description: user.ph_number
 *           example: '9876543210'
 *         isLeader:
 *           type: boolean
 *           description: Derived — whether this member is teams.leader_id
 *           example: true
 *         paid:
 *           type: boolean
 *           description: user.paid — payment status
 *           example: true
 *         isCheckedIn:
 *           type: boolean
 *           description: user.is_checked_in
 *           example: false
 *         checkedInAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: user.checked_in_at
 *           example: null
 *         hasQrToken:
 *           type: boolean
 *           description: Derived — whether user.qr_token has been issued
 *           example: true
 *     TeamDetail:
 *       type: object
 *       properties:
 *         teamCode:
 *           type: string
 *           description: teams.team_code (primary key)
 *           example: TEAM-042
 *         leaderId:
 *           type: string
 *           description: teams.leader_id
 *           example: 3paBx9yqT2fJd8x2s0h1mZ
 *         memberCount:
 *           type: integer
 *           description: teams.members
 *           example: 4
 *         members:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TeamMember'
 *         slot:
 *           allOf:
 *             - $ref: '#/components/schemas/Slot'
 *           nullable: true
 *           description: The slot from this team's own booking (bookings.team_code -> bookings.slot_id), or null if the team has no booking.
 *
 * /admin/teams/{team_id}:
 *   get:
 *     summary: Get team detail
 *     description: >
 *       Team members with payment and QR/check-in status, plus the slot
 *       booked for the team (found via the team's own booking), if any.
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: team_id
 *         required: true
 *         schema:
 *           type: string
 *         description: teams.team_code
 *         example: TEAM-042
 *     responses:
 *       200:
 *         description: Team detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamDetail'
 *             example:
 *               teamCode: TEAM-042
 *               leaderId: 3paBx9yqT2fJd8x2s0h1mZ
 *               memberCount: 2
 *               members:
 *                 - id: 3paBx9yqT2fJd8x2s0h1mZ
 *                   name: Priya Nair
 *                   email: priya@example.com
 *                   phone: '9876543210'
 *                   isLeader: true
 *                   paid: true
 *                   isCheckedIn: false
 *                   checkedInAt: null
 *                   hasQrToken: true
 *                 - id: 9kLmN2pQ7rStUvWx3yZ0aB
 *                   name: Arjun Mehta
 *                   email: arjun@example.com
 *                   phone: '9123456780'
 *                   isLeader: false
 *                   paid: false
 *                   isCheckedIn: false
 *                   checkedInAt: null
 *                   hasQrToken: false
 *               slot:
 *                 id: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *                 startTime: 2026-03-14T09:00:00.000Z
 *                 endTime: 2026-03-14T10:00:00.000Z
 *                 capacity: 10
 *       400:
 *         description: team_id is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: team_id is required
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Team not found
 */
// Uses the existing teams/teamMembers/user/bookings/slots schema
// (packages/database/schema.ts + auth-schema.ts) — no new tables invented.
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
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phNumber,
      paid: user.paid,
      isCheckedIn: user.isCheckedIn,
      checkedInAt: user.checkedInAt,
      qrToken: user.qrToken,
    })
    .from(teamMembers)
    .innerJoin(user, eq(teamMembers.userId, user.id))
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
