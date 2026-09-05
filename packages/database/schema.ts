import { user } from "./auth-schema";

import {
  pgTable,
  pgEnum,
  text,
  uuid,
  boolean,
  timestamp,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core';

// 1. Enum Definition
export const bookingTypeEnum = pgEnum('booking_type', ['individual', 'team']);

// 3. Teams Table
export const teams = pgTable('teams', {
  teamCode: text('team_code').primaryKey(),
  leaderId: text('leader_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  members: integer('members').notNull(),
});

// 4. Slots Table
export const slots = pgTable('slots', {
  id: uuid('id').defaultRandom().primaryKey(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  capacity: integer('capacity').notNull(),
});

// 5. Team Members Table (Junction Table with Composite PK)
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
      name: "team_members_team_code_user_id_pk",
    }),

  ]
);

// 6. Bookings Table
export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(), // Or uuid('id').defaultRandom().primaryKey()
  type: bookingTypeEnum('type').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  teamCode: text('team_code').references(() => teams.teamCode, {
    onDelete: 'set null',
  }),
  slotId: uuid('slot_id')
    .notNull()
    .references(() => slots.id, { onDelete: 'cascade' }),
  confirmationEmailSent: boolean('confirmation_email_sent')
    .notNull()
    .default(false),
});
