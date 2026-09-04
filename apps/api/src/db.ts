import { db, slots, teams, teamMembers, bookings, users } from "@lasertag-26/database";

/**
 * Read-only view over the shared domain schema (packages/database/schema.ts).
 * slots/teams/bookings already exist there and are owned by whatever flow
 * writes them — apps/api only reads through here, so only `select`/`query`
 * are exposed. Do not add `insert`/`update`/`delete`/`transaction` to this
 * file; write access belongs elsewhere.
 */
export const readonlyDb = {
  select: db.select.bind(db),
  query: db.query,
};

export { slots, teams, teamMembers, bookings, users };
