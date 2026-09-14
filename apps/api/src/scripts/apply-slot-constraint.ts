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

async function run() {
  console.log("1. Enabling btree_gist extension...");
  await sql.query("CREATE EXTENSION IF NOT EXISTS btree_gist");
  console.log("   btree_gist is enabled.");

  console.log("2. Fetching current slots...");
  const rawSlots = (await sql.query(
    `SELECT s.id, s.start_time, s.end_time, s.capacity,
            (SELECT count(*)::int FROM bookings b WHERE b.slot_id = s.id) as booking_count
     FROM slots s
     ORDER BY s.start_time ASC, s.id ASC`
  )) as SlotRow[];

  console.log(`   Found ${rawSlots.length} slots.`);

  // Find non-overlapping subset, prioritizing slots that have bookings
  const kept: SlotRow[] = [];
  const toDelete: string[] = [];

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
    // [sStart, sEnd) overlaps with [kStart, kEnd) if sStart < kEnd && kStart < sEnd
    const overlaps = kept.some((k) => {
      const kStart = new Date(k.start_time).getTime();
      const kEnd = new Date(k.end_time).getTime();
      return sStart < kEnd && kStart < sEnd;
    });

    if (overlaps) {
      toDelete.push(slot.id);
    } else {
      kept.push(slot);
    }
  }

  console.log(`   Keeping ${kept.length} non-overlapping slots.`);
  console.log(`   Found ${toDelete.length} overlapping duplicate slots to delete.`);

  if (toDelete.length > 0) {
    console.log("3. Removing overlapping slots...");
    for (const id of toDelete) {
      await sql.query("DELETE FROM slots WHERE id = $1", [id]);
    }
    console.log("   Deleted redundant overlapping slots.");
  } else {
    console.log("3. No redundant overlapping slots needed removal.");
  }

  console.log("4. Adding GiST exclusion constraint...");
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
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error applying constraint:", err);
    process.exit(1);
  });
