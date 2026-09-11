/**
 * Seed script: creates 5 test users, a team, team memberships, a slot, and a
 * team booking so you can test the mailer flow end-to-end.
 *
 * Run with:  bun run src/services/mailer/seed-test-team.ts
 */
import { db } from "@lasertag-26/database";
import { user, teams, teamMembers, slots, bookings } from "@lasertag-26/database/schema";
import { randomUUID } from "node:crypto";

const TEAM_CODE = "TEST-TEAM-001";

const testUsers = [
  { id: randomUUID(), name: "Alice Leader",  email: "alice.test@example.com" },
  { id: randomUUID(), name: "Bob Member",    email: "bob.test@example.com" },
  { id: randomUUID(), name: "Charlie Member", email: "charlie.test@example.com" },
  { id: randomUUID(), name: "Diana Member",  email: "diana.test@example.com" },
  { id: randomUUID(), name: "Eve Member",    email: "eve.test@example.com" },
];

async function seed() {
  console.log("🌱 Seeding test data...\n");

  // 1. Insert users
  for (const u of testUsers) {
    await db.insert(user).values({
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();
  }
  console.log(`✅ Created ${testUsers.length} test users`);

  // 2. Create team (Alice is leader)
  await db.insert(teams).values({
    teamCode: TEAM_CODE,
    leaderId: testUsers[0].id,
    members: testUsers.length,
  }).onConflictDoNothing();
  console.log(`✅ Created team "${TEAM_CODE}" (leader: ${testUsers[0].name})`);

  // 3. Add all users as team members
  for (const u of testUsers) {
    await db.insert(teamMembers).values({
      teamCode: TEAM_CODE,
      userId: u.id,
    }).onConflictDoNothing();
  }
  console.log(`✅ Added ${testUsers.length} team members`);

  // 4. Create a slot (1 hour from now, capacity 10)
  const now = new Date();
  const startTime = new Date(now.getTime() + 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  const [slot] = await db.insert(slots).values({
    startTime,
    endTime,
    capacity: 10,
  }).returning();
  console.log(`✅ Created slot ${slot.id} (${startTime.toISOString()} → ${endTime.toISOString()})`);

  // 5. Create a team booking (by the leader)
  const bookingId = randomUUID();
  const [booking] = await db.insert(bookings).values({
    id: bookingId,
    type: "team",
    userId: testUsers[0].id,
    teamCode: TEAM_CODE,
    slotId: slot.id,
    confirmationEmailSent: false,
  }).returning();
  console.log(`✅ Created team booking ${booking.id}`);

  console.log("\n🎉 Seed complete! Test data summary:");
  console.log(`   Team code : ${TEAM_CODE}`);
  console.log(`   Slot ID   : ${slot.id}`);
  console.log(`   Booking ID: ${booking.id}`);
  console.log(`   Users     : ${testUsers.map((u) => u.email).join(", ")}`);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
