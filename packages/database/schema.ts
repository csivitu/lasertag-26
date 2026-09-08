import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core';

// 1. Enum Definitions
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const bookingTypeEnum = pgEnum('booking_type', ['individual', 'team']);

// 2. Users Table (Mapped to PostgreSQL "user" table)
export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phNumber: text('ph_number'),
  qrToken: text('qr_token'),
  isCheckedIn: boolean('is_checked_in').default(false),
  checkedInAt: timestamp('checked_in_at'),
  paid: boolean('paid').notNull().default(false),
  role: text('role').default('user'),
});
export const user = users;

// 3. Teams Table
export const teams = pgTable('teams', {
  teamCode: text('team_code').primaryKey(),
  leaderId: text('leader_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
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
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.teamCode, table.userId] }),
  ]
);

// 6. Bookings Table
export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(),
  type: bookingTypeEnum('type').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
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
