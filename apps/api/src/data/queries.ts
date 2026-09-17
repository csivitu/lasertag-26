import { and, asc, count, desc, eq, gt, ilike, ne, or, sql } from "drizzle-orm";
import {
  db,
  bookings,
  slots,
  teams,
  teamMembers,
  user,
  verifiedParticipants,
} from "@lasertag-26/database";

import type { UserDeps } from "../services/adminAuth";
import type { VerifiedImportDeps } from "../services/paid-import";
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
  listSlots: async () => {
    const allSlots = await db.select().from(slots).orderBy(asc(slots.startTime));
    const activeBookings = await db
      .select({
        slotId: bookings.slotId,
        count: count(bookings.id),
      })
      .from(bookings)
      .where(ne(bookings.status, "cancelled"))
      .groupBy(bookings.slotId);

    const countMap = new Map<string, number>();
    for (const b of activeBookings) {
      countMap.set(b.slotId, Number(b.count));
    }

    return allSlots.map((s) => {
      const booked = countMap.get(s.id) ?? (s.totalCapacity > 0 ? Math.max(0, s.totalCapacity - s.capacity) : 0);
      const total = s.totalCapacity > 0 ? s.totalCapacity : Math.max(s.capacity + booked, 10);
      return {
        ...s,
        bookedCount: booked,
        totalCapacity: total,
      };
    });
  },

  findSlot: async (id) => {
    const [row] = await db.select().from(slots).where(eq(slots.id, id));
    return row;
  },

  countActiveBookings: (slotId) => countActiveBookingsForSlot(slotId),

  // New slots open with total = remaining; the claim/trigger pair keeps
  // total_capacity = capacity + active bookings from here on.
  insertSlots: (values) =>
    db
      .insert(slots)
      .values(values.map((v) => ({ ...v, totalCapacity: v.capacity })))
      .returning(),

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
    if (filters.type !== undefined) conditions.push(eq(bookings.type, filters.type));
    if (filters.reg_no !== undefined) conditions.push(eq(bookings.id, filters.reg_no));
    if (filters.name !== undefined) conditions.push(ilike(user.name, `%${filters.name}%`));
    if (filters.phone !== undefined)
      conditions.push(ilike(user.phNumber, `%${filters.phone}%`));
    if (filters.email !== undefined)
      conditions.push(ilike(user.email, `%${filters.email}%`));
    if (filters.q !== undefined) {
      const pattern = `%${filters.q}%`;
      conditions.push(
        or(
          ilike(user.name, pattern),
          ilike(user.phNumber, pattern),
          ilike(user.email, pattern),
          ilike(bookings.id, pattern),
          ilike(user.regNumber, pattern),
        ),
      );
    }

    const query = db
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(filters.limit ?? 30);
    return query;
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

/**
 * Lookups for the paid-list bulk import. Reg numbers are user-typed at
 * onboarding, so the match is case-insensitive; emails match
 * case-insensitively too. Additive only — nothing here ever unmarks anyone.
 */
export const paidImportQueries: VerifiedImportDeps = {
  findUserByRegNumber: async (regNumber) => {
    const [row] = await db
      .select({ id: user.id, paid: user.paid })
      .from(user)
      .where(sql`upper(${user.regNumber}) = ${regNumber}`);
    return row;
  },

  findUserByEmail: async (email) => {
    const [row] = await db
      .select({ id: user.id, paid: user.paid })
      .from(user)
      .where(ilike(user.email, email));
    return row;
  },

  setUserPaid: (userId, paid) => paymentQueries.setUserPaid(userId, paid),

  findAllowlisted: async (regNumber, email) => {
    const conditions = [];
    if (regNumber) conditions.push(eq(verifiedParticipants.regNumber, regNumber));
    if (email) conditions.push(eq(verifiedParticipants.email, email));
    if (conditions.length === 0) return undefined;
    const [row] = await db
      .select({
        id: verifiedParticipants.id,
        regNumber: verifiedParticipants.regNumber,
        email: verifiedParticipants.email,
      })
      .from(verifiedParticipants)
      .where(or(...conditions))
      .limit(1);
    return row;
  },

  insertAllowlistEntry: async (entry) => {
    const [row] = await db
      .insert(verifiedParticipants)
      .values(entry)
      .onConflictDoNothing()
      .returning({
        id: verifiedParticipants.id,
        regNumber: verifiedParticipants.regNumber,
        email: verifiedParticipants.email,
      });
    // onConflictDoNothing leaves nothing to return on a race; the caller
    // already checked, so fall back to a re-read in that corner.
    if (row) return row;
    const existing = await paidImportQueries.findAllowlisted(entry.regNumber, entry.email);
    return existing!;
  },
};

/**
 * True when this reg number or email sits in the verified-participants
 * allowlist. Used by the booking gate and the profile sync so someone is
 * declared verified by EITHER identifier.
 */
export async function isIdentityAllowlisted(
  regNumber: string | null,
  email: string | null,
): Promise<boolean> {
  if (!regNumber && !email) return false;
  const found = await paidImportQueries.findAllowlisted(regNumber, email);
  return found !== undefined;
}

/** Newest-first allowlist slice for the admin verification screen. */
export async function markUserPaid(userId: string): Promise<void> {
  await db.update(user).set({ paid: true }).where(eq(user.id, userId));
}export async function listAllowlistEntries(limit = 200) {
  const capped = Math.min(Math.max(limit, 1), 500);
  return db
    .select({
      id: verifiedParticipants.id,
      regNumber: verifiedParticipants.regNumber,
      email: verifiedParticipants.email,
      name: verifiedParticipants.name,
      source: verifiedParticipants.source,
      createdAt: verifiedParticipants.createdAt,
    })
    .from(verifiedParticipants)
    .orderBy(sql`${verifiedParticipants.createdAt} DESC`)
    .limit(capped);
}

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

/**
 * Atomically claims one seat: decrements only when capacity > 0 and reports
 * whether a seat was taken. This single statement is the serialization point
 * for concurrent bookings — Postgres takes a row lock on the slots row, so
 * racing claims queue up and exactly `capacity` of them succeed. The Neon
 * HTTP driver cannot hold multi-statement transactions, which is why the
 * check and the decrement must not be separate statements.
 */
export async function claimSlotSeat(slotId: string): Promise<boolean> {
  const [row] = await db
    .update(slots)
    .set({ capacity: sql`${slots.capacity} - 1` })
    .where(and(eq(slots.id, slotId), gt(slots.capacity, 0)))
    .returning({ id: slots.id });
  return row !== undefined;
}

/** Compensation: gives back a seat claimed by claimSlotSeat. */
export async function releaseSlotSeat(slotId: string): Promise<void> {
  await db
    .update(slots)
    .set({ capacity: sql`${slots.capacity} + 1` })
    .where(eq(slots.id, slotId));
}

export async function findUserById(userId: string) {
  const [row] = await db.select().from(user).where(eq(user.id, userId));
  return row;
}

export async function findActiveRegistrationForUser(userId: string) {
  // Newest first + LIMIT 1: deterministic even if duplicate active rows
  // somehow exist (the partial unique index normally prevents that).
  const [row] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.userId, userId), ne(bookings.status, "cancelled")))
    .orderBy(desc(bookings.confirmedAt))
    .limit(1);
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
    .where(and(eq(bookings.userId, userId), ne(bookings.status, "cancelled")))
    .orderBy(desc(bookings.confirmedAt))
    .limit(1);

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

export async function markUserCheckedIn(bookingId: string) {
  const [updated] = await db
    .update(bookings)
    .set({
      isCheckedIn: true,
      checkedInAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  return updated;
}

/** Mirrors the booking stamp onto the user row so both check-in columns agree. */
export async function markUserRowCheckedIn(userId: string) {
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

export async function findTeamForUser(userId: string) {
  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));

  if (!membership) return null;

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.teamCode, membership.teamCode));

  if (!team) return null;

  const memberRows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phNumber,
    })
    .from(teamMembers)
    .innerJoin(user, eq(teamMembers.userId, user.id))
    .where(eq(teamMembers.teamCode, membership.teamCode));

  return {
    teamCode: team.teamCode,
    isLeader: team.leaderId === userId,
    leaderId: team.leaderId,
    memberCount: memberRows.length,
    maxMembers: 5,
    members: memberRows.map((m) => ({
      ...m,
      isLeader: m.id === team.leaderId,
    })),
  };
}

export async function getSlotBookingsWithUsers(slotId: string) {
  const [slot] = await db.select().from(slots).where(eq(slots.id, slotId));
  if (!slot) return null;

  const rows = await db
    .select({
      bookingId: bookings.id,
      type: bookings.type,
      status: bookings.status,
      teamCode: bookings.teamCode,
      confirmedAt: bookings.confirmedAt,
      isCheckedIn: bookings.isCheckedIn,
      checkedInAt: bookings.checkedInAt,
      userId: user.id,
      name: user.name,
      email: user.email,
      regNumber: user.regNumber,
      phNumber: user.phNumber,
    })
    .from(bookings)
    .innerJoin(user, eq(bookings.userId, user.id))
    .where(and(eq(bookings.slotId, slotId), ne(bookings.status, "cancelled")))
    .orderBy(asc(bookings.id));

  const bookedCount = rows.length;
  const totalCapacity =
    slot.totalCapacity > 0 ? slot.totalCapacity : Math.max(slot.capacity + bookedCount, 10);

  return {
    slot: {
      ...slot,
      bookedCount,
      totalCapacity,
    },
    bookings: rows.map((r) => ({
      bookingId: r.bookingId,
      type: r.type,
      status: r.status,
      teamCode: r.teamCode,
      confirmedAt: r.confirmedAt,
      isCheckedIn: r.isCheckedIn,
      checkedInAt: r.checkedInAt,
      user: {
        id: r.userId,
        name: r.name,
        email: r.email,
        regNumber: r.regNumber,
        phNumber: r.phNumber,
      },
    })),
  };
}

