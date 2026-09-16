import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(__dirname, "../../../../.env") });
config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);

interface SlotRow {
  id: string;
  start_time: string | Date;
  end_time: string | Date;
  capacity: number;
  booking_count: number;
}

const isDryRun = !process.argv.includes("--confirm") && !process.argv.includes("--execute");

async function run() {
  console.log("=== Apply Slot Constraint & Deduplication Script ===");
  if (isDryRun) {
    console.log("ℹ️  Running in DRY-RUN mode. No changes will be made to the database.");
    console.log("   To execute changes, re-run with: bun run src/scripts/apply-slot-constraint.ts --confirm\n");
  } else {
    console.log("⚠️  CONFIRM flag detected. Executing mutations...\n");
  }

  console.log("1. Checking btree_gist extension...");
  if (!isDryRun) {
    await sql.query("CREATE EXTENSION IF NOT EXISTS btree_gist");
    console.log("   btree_gist is enabled.");
  } else {
    console.log("   [DRY-RUN] Would enable extension btree_gist.");
  }

  console.log("2. Fetching current slots...");
  const rawSlots = (await sql.query(
    `SELECT s.id, s.start_time, s.end_time, s.capacity,
            (SELECT count(*)::int FROM bookings b WHERE b.slot_id = s.id AND b.status IN ('reserved', 'confirmed')) as booking_count
     FROM slots s
     ORDER BY s.start_time ASC, s.id ASC`
  )) as SlotRow[];

  console.log(`   Found ${rawSlots.length} slots.`);

  // Find non-overlapping subset, prioritizing slots that have bookings
  const kept: SlotRow[] = [];
  const toDelete: SlotRow[] = [];

  // Sort slots so those with bookings come first
  const sorted = [...rawSlots].sort((a, b) => {
    if (b.booking_count !== a.booking_count) {
      return b.booking_count - a.booking_count; // booked slots first
    }
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });

  for (const slot of sorted) {
    const sStart = new Date(slot.start_time).getTime();
    const sEnd = new Date(slot.end_time).getTime();

    // Check if slot overlaps with any already kept slot
    const overlaps = kept.some((k) => {
      const kStart = new Date(k.start_time).getTime();
      const kEnd = new Date(k.end_time).getTime();
      return sStart < kEnd && kStart < sEnd;
    });

    if (overlaps) {
      toDelete.push(slot);
    } else {
      kept.push(slot);
    }
  }

  console.log(`   Keeping ${kept.length} non-overlapping slots.`);
  console.log(`   Found ${toDelete.length} overlapping duplicate slots.`);

  // Safety check: Refuse to delete any slot that has active bookings!
  const bookedOverlap = toDelete.filter((s) => s.booking_count > 0);
  if (bookedOverlap.length > 0) {
    console.error(
      `❌ ABORTING: Found ${bookedOverlap.length} overlapping slot(s) that have active bookings!`,
    );
    for (const b of bookedOverlap) {
      console.error(
        `   - Slot ${b.id} (${new Date(b.start_time).toISOString()} - ${new Date(b.end_time).toISOString()}) has ${b.booking_count} active booking(s).`,
      );
    }
    console.error(
      "   Manual resolution required: Reassign or cancel conflicting bookings before applying constraint.",
    );
    process.exit(1);
  }

  if (toDelete.length > 0) {
    if (!isDryRun) {
      console.log("3. Removing redundant overlapping slots (with 0 bookings)...");
      for (const slot of toDelete) {
        await sql.query("DELETE FROM slots WHERE id = $1", [slot.id]);
      }
      console.log("   Deleted redundant overlapping slots.");
    } else {
      console.log(`3. [DRY-RUN] Would remove ${toDelete.length} redundant overlapping slots.`);
    }
  } else {
    console.log("3. No redundant overlapping slots needed removal.");
  }

  console.log("4. Applying GiST exclusion constraint...");
  if (!isDryRun) {
    await sql.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_slots'
        ) THEN
          ALTER TABLE slots
          ADD CONSTRAINT no_overlapping_slots
          EXCLUDE USING gist (
            tsrange(start_time, end_time) WITH &&
          );
        END IF;
      END $$;
    `);
    console.log("✅ Exclusion constraint 'no_overlapping_slots' applied successfully!");
  } else {
    console.log("   [DRY-RUN] Would apply constraint 'no_overlapping_slots' via GiST exclusion.");
    console.log("✅ Dry run completed successfully without errors.");
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  });
