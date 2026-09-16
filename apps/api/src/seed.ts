import path from "path";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { db } from "@lasertag-26/database";
import { user, teams, teamMembers, slots, bookings } from "@lasertag-26/database/schema";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    const user1Id = "11111111-1111-1111-1111-111111111111";
    const user2Id = "22222222-2222-2222-2222-222222222222";

    await db
      .insert(user)
      .values([
        {
          id: user1Id,
          name: "Alex Mercer",
          email: "alex@example.com",
          phNumber: "9876543210",
          qrToken: "QR-ALEX-111",
          isCheckedIn: true,
          checkedInAt: new Date(),
          paid: true,
        },
        {
          id: user2Id,
          name: "Sam Riley",
          email: "sam@example.com",
          phNumber: "9876543211",
          qrToken: "QR-SAM-222",
          isCheckedIn: false,
          paid: true,
        },
      ])
      .onConflictDoNothing();

    console.log("✅ Inserted test users");

    const teamCode = "ALPHA_01";

    await db
      .insert(teams)
      .values({
        teamCode,
        leaderId: user1Id,
        members: 2,
      })
      .onConflictDoNothing();

    console.log("✅ Inserted test team");

    await db
      .insert(teamMembers)
      .values([
        { teamCode, userId: user1Id },
        { teamCode, userId: user2Id },
      ])
      .onConflictDoNothing();

    console.log("✅ Inserted team members");

    const slot1Id = "33333333-3333-3333-3333-333333333333";
    const slot2Id = "44444444-4444-4444-4444-444444444444";

    await db
      .insert(slots)
      .values([
        {
          id: slot1Id,
          startTime: new Date("2026-09-10T10:00:00Z"),
          endTime: new Date("2026-09-10T11:00:00Z"),
          capacity: 10,
          totalCapacity: 10,
        },
        {
          id: slot2Id,
          startTime: new Date("2026-09-10T14:00:00Z"),
          endTime: new Date("2026-09-10T15:00:00Z"),
          capacity: 10,
          totalCapacity: 10,
        },
      ])
      .onConflictDoNothing();

    console.log("✅ Inserted test slots");

    const bookingId = "BKG-TEST-001";

    await db
      .insert(bookings)
      .values({
        id: bookingId,
        type: "team",
        userId: user1Id,
        teamCode,
        slotId: slot1Id,
        confirmationEmailSent: true,
      })
      .onConflictDoNothing();

    console.log("✅ Inserted test booking");

    console.log("\n🎉 Database successfully seeded!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
