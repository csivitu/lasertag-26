import { and, count, eq, ilike, ne, or } from "drizzle-orm";
import {
  db,
  bookings,
  slots,
  teams,
  teamMembers,
  user,
} from "@lasertag-26/database";

import type { UserDeps } from "../services/adminAuth";
import type { PaymentsDeps } from "../services/payments";
import type { RegistrationsDeps, RegistrationRow } from "../services/registrations";
import type { SlotsDeps } from "../services/slots";
import type { TeamsDeps } from "../services/teams";

/**
 * The only module in src/ that imports @lasertag-26/database for values.
 *
 * That package throws at import time when DATABASE_URL is unset, so keeping
 * every value-import here means the service modules can reach their types via
 * `import type` alone (erased at compile time). Services are therefore
 * constructible in tests from plain object literals — no database, no module
 * mocking, no test preload.
 *
 * SQL lives here; rules live in services.
 */

export const slotQueries: SlotsDeps = {
  listSlots: () => db.select().from(slots),

  findSlot: async (id) => {
    const [row] = await db.select().from(slots).where(eq(slots.id, id));
    return row;
  },

  countBookings: async (slotId) => {
    const [row] = await db
      .select({ value: count() })
      .from(bookings)
      .where(eq(bookings.slotId, slotId));
    return row?.value ?? 0;
  },

  insertSlots: (values) => db.insert(slots).values(values).returning(),

  applyUpdate: async (id, patch) => {
    const [row] = await db
      .update(slots)
      .set(patch)
      .where(eq(slots.id, id))
      .returning();
    // The caller has already established the row exists.
    return row!;
  },

  removeSlot: async (id) => {
    await db.delete(slots).where(eq(slots.id, id));
  },
};

export const teamQueries: TeamsDeps = {
  findTeam: async (teamCode) => {
    const [row] = await db.select().from(teams).where(eq(teams.teamCode, teamCode));
    return row;
  },

  listMembers: (teamCode) =>
    db
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
      .where(eq(teamMembers.teamCode, teamCode)),

  // `bookings` holds one row per member, all sharing the team's code, so
  // filtering on teamCode alone returns N rows in unspecified order. Anchor on
  // the leader's booking instead: one row, and semantically "the team's slot".
  findTeamSlot: async (teamCode, leaderId) => {
    const [row] = await db
      .select({ slot: slots })
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .where(and(eq(bookings.teamCode, teamCode), eq(bookings.userId, leaderId)))
      .limit(1);
    return row?.slot;
  },
};

export const registrationQueries: RegistrationsDeps = {
  search: (filters): Promise<RegistrationRow[]> => {
    const conditions = [];
    if (filters.reg_no !== undefined) conditions.push(eq(bookings.id, filters.reg_no));
    if (filters.name !== undefined) conditions.push(ilike(user.name, `%${filters.name}%`));
    if (filters.phone !== undefined)
      conditions.push(ilike(user.phNumber, `%${filters.phone}%`));
    if (filters.email !== undefined)
      conditions.push(ilike(user.email, `%${filters.email}%`));

    return db
      .select({
        regNo: bookings.id,
        type: bookings.type,
        teamCode: bookings.teamCode,
        slotId: bookings.slotId,
        confirmationEmailSent: bookings.confirmationEmailSent,
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phNumber,
        paid: user.paid,
        isCheckedIn: user.isCheckedIn,
        checkedInAt: user.checkedInAt,
      })
      .from(bookings)
      .innerJoin(user, eq(bookings.userId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);
  },
};

export const paymentQueries: PaymentsDeps = {
  findBookingWithUser: async (registrationId) => {
    const [row] = await db
      .select({
        bookingId: bookings.id,
        type: bookings.type,
        userId: user.id,
        paid: user.paid,
        userName: user.name,
        userEmail: user.email,
      })
      .from(bookings)
      .innerJoin(user, eq(bookings.userId, user.id))
      .where(eq(bookings.id, registrationId));
    return row;
  },

  findBookingUserId: async (registrationId) => {
    const [row] = await db
      .select({ userId: bookings.userId })
      .from(bookings)
      .where(eq(bookings.id, registrationId));
    return row?.userId;
  },

  setUserPaid: async (userId, paid) => {
    const [row] = await db
      .update(user)
      .set({ paid })
      .where(eq(user.id, userId))
      .returning({ id: user.id, name: user.name, email: user.email, paid: user.paid });
    // The caller has already established the row exists.
    return row!;
  },
};

/** Only what admin login needs to decide whether to attempt sign-in at all. */
export const userQueries: UserDeps = {
  findRoleByEmail: async (email) => {
    const [row] = await db.select({ role: user.role }).from(user).where(eq(user.email, email));
    return row?.role ?? null;
  },
};

// ==========================================
// Participant & Registration Helper Queries
// ==========================================

export async function findSlotById(slotId: string) {
  const [row] = await db.select().from(slots).where(eq(slots.id, slotId));
  return row;
}

export async function countActiveBookingsForSlot(slotId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(bookings)
    .where(and(eq(bookings.slotId, slotId), ne(bookings.status, "cancelled")));
  return row?.value ?? 0;
}

export async function findUserById(userId: string) {
  const [row] = await db.select().from(user).where(eq(user.id, userId));
  return row;
}

export async function findActiveRegistrationForUser(userId: string) {
  const [row] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.userId, userId), ne(bookings.status, "cancelled")));
  return row;
}

export async function findActiveRegistrationWithSlotForUser(userId: string) {
  const [row] = await db
    .select({
      booking: bookings,
      slot: slots,
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .where(and(eq(bookings.userId, userId), ne(bookings.status, "cancelled")));

  return row;
}

export async function createSoloRegistration(input: {
  userId: string;
  slotId: string;
  id?: string;
}) {
  const bookingId =
    input.id ?? `REG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const [newBooking] = await db
    .insert(bookings)
    .values({
      id: bookingId,
      type: "individual",
      status: "reserved",
      userId: input.userId,
      slotId: input.slotId,
    })
    .returning();

  return newBooking;
}

export async function findRegistrationWithUserAndSlot(reservationId: string) {
  const [row] = await db
    .select({
      booking: bookings,
      user: user,
      slot: slots,
    })
    .from(bookings)
    .innerJoin(user, eq(bookings.userId, user.id))
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .where(eq(bookings.id, reservationId));

  return row;
}

export async function confirmRegistration(reservationId: string, qrToken: string) {
  const [updated] = await db
    .update(bookings)
    .set({
      status: "confirmed",
      qrToken: qrToken,
      confirmedAt: new Date(),
    })
    .where(eq(bookings.id, reservationId))
    .returning();

  return updated;
}

export async function cancelRegistration(reservationId: string) {
  const [updated] = await db
    .update(bookings)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
    })
    .where(eq(bookings.id, reservationId))
    .returning();

  return updated;
}

export async function findRegistrationForScan(identifier: string) {
  const [row] = await db
    .select({
      booking: bookings,
      user: user,
      slot: slots,
    })
    .from(bookings)
    .innerJoin(user, eq(bookings.userId, user.id))
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .where(or(eq(bookings.qrToken, identifier), eq(bookings.id, identifier)));

  return row;
}

export async function markUserCheckedIn(userId: string) {
  const [updated] = await db
    .update(user)
    .set({
      isCheckedIn: true,
      checkedInAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning();

  return updated;
}
