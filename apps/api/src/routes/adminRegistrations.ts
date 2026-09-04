import { Router, type Request, type Response } from "express";
import { and, eq, ilike } from "drizzle-orm";
import { db, bookings, users } from "@lasertag-26/database";

export const adminRegistrationsRouter = Router();

function queryParam(value: unknown): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw === "string" && raw.trim() !== "") return raw.trim();
  return undefined;
}

// GET /admin/registrations — search by optional reg_no, name, phone, email.
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
