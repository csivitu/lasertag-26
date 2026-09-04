import { Router, type Request, type Response } from "express";
import { and, eq, ilike } from "drizzle-orm";
import { db, bookings, users } from "@lasertag-26/database";

export const adminRegistrationsRouter = Router();

function queryParam(value: unknown): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw === "string" && raw.trim() !== "") return raw.trim();
  return undefined;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Registration:
 *       type: object
 *       description: A booking (packages/database/schema.ts `bookings`, joined to its `users` row).
 *       properties:
 *         regNo:
 *           type: string
 *           description: bookings.id
 *         type:
 *           type: string
 *           enum: [individual, team]
 *           description: bookings.type
 *         teamCode:
 *           type: string
 *           nullable: true
 *           description: bookings.team_code
 *         slotId:
 *           type: string
 *           format: uuid
 *           description: bookings.slot_id
 *         confirmationEmailSent:
 *           type: boolean
 *           description: bookings.confirmation_email_sent
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: users.id
 *             name:
 *               type: string
 *               description: users.name
 *             email:
 *               type: string
 *               description: users.email
 *             phone:
 *               type: string
 *               description: users.ph_number
 *             paid:
 *               type: boolean
 *               description: users.paid
 *             isCheckedIn:
 *               type: boolean
 *               description: users.is_checked_in
 *             checkedInAt:
 *               type: string
 *               format: date-time
 *               nullable: true
 *               description: users.checked_in_at
 *
 * /admin/registrations:
 *   get:
 *     summary: Search registrations
 *     description: >
 *       A "registration" is a booking. All query params are optional and
 *       combined with AND; reg_no matches bookings.id exactly, the rest
 *       match case-insensitive substrings against the booking's user.
 *       No params returns every registration.
 *     tags: [Registrations]
 *     parameters:
 *       - in: query
 *         name: reg_no
 *         schema:
 *           type: string
 *         description: Exact bookings.id
 *         example: reg-2026-0001
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Case-insensitive substring match on users.name
 *         example: Alicia
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: Case-insensitive substring match on users.ph_number
 *         example: '98765'
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Case-insensitive substring match on users.email
 *         example: alicia@example.com
 *     responses:
 *       200:
 *         description: Matching registrations (empty array if nothing matches)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Registration'
 *             example:
 *               - regNo: reg-2026-0001
 *                 type: individual
 *                 teamCode: null
 *                 slotId: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *                 confirmationEmailSent: true
 *                 user:
 *                   id: 7c9e6679-7425-40de-944b-e07fc1f90ae7
 *                   name: Alicia Rao
 *                   email: alicia@example.com
 *                   phone: '9876543210'
 *                   paid: true
 *                   isCheckedIn: false
 *                   checkedInAt: null
 */
// "Registration" is a booking (packages/database/schema.ts); reg_no is the
// booking's own id. name/phone/email live on the booking's user, so this
// joins bookings -> users and filters on whichever params were given.
adminRegistrationsRouter.get("/", async (req: Request, res: Response) => {
  const regNo = queryParam(req.query.reg_no);
  const name = queryParam(req.query.name);
  const phone = queryParam(req.query.phone);
  const email = queryParam(req.query.email);

  const conditions = [];
  if (regNo !== undefined) conditions.push(eq(bookings.id, regNo));
  if (name !== undefined) conditions.push(ilike(users.name, `%${name}%`));
  if (phone !== undefined) conditions.push(ilike(users.phNumber, `%${phone}%`));
  if (email !== undefined) conditions.push(ilike(users.email, `%${email}%`));

  const rows = await db
    .select({
      regNo: bookings.id,
      type: bookings.type,
      teamCode: bookings.teamCode,
      slotId: bookings.slotId,
      confirmationEmailSent: bookings.confirmationEmailSent,
      userId: users.id,
      name: users.name,
      email: users.email,
      phone: users.phNumber,
      paid: users.paid,
      isCheckedIn: users.isCheckedIn,
      checkedInAt: users.checkedInAt,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const registrations = rows.map((row) => ({
    regNo: row.regNo,
    type: row.type,
    teamCode: row.teamCode,
    slotId: row.slotId,
    confirmationEmailSent: row.confirmationEmailSent,
    user: {
      id: row.userId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      paid: row.paid,
      isCheckedIn: row.isCheckedIn,
      checkedInAt: row.checkedInAt,
    },
  }));

  res.json(registrations);
});
