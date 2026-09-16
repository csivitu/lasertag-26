import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  text,
  uuid,
  boolean,
  timestamp,
  integer,
  primaryKey,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

// 1. Enum Definitions
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const bookingTypeEnum = pgEnum('booking_type', ['individual', 'team']);
export const bookingStatusEnum = pgEnum('booking_status', [
  'reserved',
  'confirmed',
  'cancelled',
]);

// Alias users -> user for backward compatibility
export const users = user;
export { user };

// 2. Teams Table
export const teams = pgTable(
  'teams',
  {
    teamCode: text('team_code').primaryKey(),
    name: text('name'),
    leaderId: text('leader_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    members: integer('members').notNull(),
  },
  (table) => [
    index('teams_leader_id_idx').on(table.leaderId),
  ]
);

// 3. Slots Table
// PostgreSQL Exclusion Constraint enforced at DB level via GiST index:
// CONSTRAINT no_overlapping_slots EXCLUDE USING gist (tsrange(start_time, end_time) WITH &&)
//
// Two capacity columns with distinct jobs:
// - capacity: seats REMAINING. Atomically decremented by claimSlotSeat (the
//   concurrency serialization point) and restored on moves/cancels.
// - totalCapacity: seats TOTAL at creation. Compared against the active
//   booking count by the bookings_capacity_guard trigger (the backstop).
// Invariant: totalCapacity = capacity + active bookings.
export const slots = pgTable(
  'slots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    capacity: integer('capacity').notNull(),
    totalCapacity: integer('total_capacity').notNull().default(0),
    isHidden: boolean('is_hidden').notNull().default(false),
  },
  (table) => [
    index('slots_start_time_idx').on(table.startTime),
    check('slots_positive_capacity', sql`${table.capacity} >= 0`),
  ]
);

// 4. Team Members Table (Junction Table with Composite PK & 1-Team-Per-User Constraint)
export const teamMembers = pgTable(
  'team_members',
  {
    teamCode: text('team_code')
      .notNull()
      .references(() => teams.teamCode, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.teamCode, table.userId],
      name: 'team_members_team_code_user_id_pk',
    }),
    uniqueIndex('team_members_single_user_idx').on(table.userId),
    index('team_members_team_code_idx').on(table.teamCode),
  ]
);

// 5. Bookings / Battle Pass Tickets Table
export const bookings = pgTable(
  'bookings',
  {
    id: text('id').primaryKey(),
    type: bookingTypeEnum('type').notNull(),
    status: bookingStatusEnum('status').notNull().default('reserved'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    teamCode: text('team_code').references(() => teams.teamCode, {
      onDelete: 'set null',
    }),
    slotId: uuid('slot_id')
      .notNull()
      .references(() => slots.id, { onDelete: 'cascade' }),

    // Arena Pass, Verification & Check-in
    qrToken: text('qr_token'),
    isCheckedIn: boolean('is_checked_in').notNull().default(false),
    checkedInAt: timestamp('checked_in_at'),

    confirmedAt: timestamp('confirmed_at'),
    cancelledAt: timestamp('cancelled_at'),
    confirmationEmailSent: boolean('confirmation_email_sent')
      .notNull()
      .default(false),
  },
  (table) => [
    index('bookings_user_id_idx').on(table.userId),
    index('bookings_slot_id_idx').on(table.slotId),
    index('bookings_team_code_idx').on(table.teamCode),
    index('bookings_qr_token_idx').on(table.qrToken),
    index('bookings_status_idx').on(table.status),
    uniqueIndex('bookings_active_user_slot_idx')
      .on(table.userId, table.slotId)
      .where(sql`status IN ('reserved', 'confirmed')`),
    // One active booking per user, period — a "change slot" moves the row
    // instead of duplicating it, and double-submits fail safe at the DB.
    uniqueIndex('bookings_one_active_per_user_idx')
      .on(table.userId)
      .where(sql`status IN ('reserved', 'confirmed')`),
  ]
);

// 6. Drizzle ORM Relations
export const slotsRelations = relations(slots, ({ many }) => ({
  bookings: many(bookings),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  leader: one(user, {
    fields: [teams.leaderId],
    references: [user.id],
  }),
  members: many(teamMembers),
  bookings: many(bookings),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamCode],
    references: [teams.teamCode],
  }),
  user: one(user, {
    fields: [teamMembers.userId],
    references: [user.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(user, {
    fields: [bookings.userId],
    references: [user.id],
  }),
  slot: one(slots, {
    fields: [bookings.slotId],
    references: [slots.id],
  }),
  team: one(teams, {
    fields: [bookings.teamCode],
    references: [teams.teamCode],
  }),
}));
