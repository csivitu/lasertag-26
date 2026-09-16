import path from "path";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

import { readFileSync } from "node:fs";
import { db } from "@lasertag-26/database";
import { sql } from "drizzle-orm";

/**
 * Applies capacity-guard.sql (total_capacity backfill + slot overbooking
 * trigger) to the database. Idempotent — safe to rerun on every deploy.
 * Usage: bun run apps/api/src/scripts/apply-capacity-guard.ts
 *
 * The Neon HTTP driver accepts one statement per call, so the file is split
 * into statements by anchor (the function body itself contains semicolons
 * inside $func$ quoting and must travel as one piece).
 */
const ANCHORS = [
  "ALTER TABLE slots ADD COLUMN",
  "UPDATE slots",
  "CREATE OR REPLACE FUNCTION enforce_slot_capacity",
  "DROP TRIGGER IF EXISTS",
  "CREATE TRIGGER",
];

async function apply() {
  console.log("Applying slot capacity guard...");

  try {
    const sqlText = readFileSync(path.join(__dirname, "capacity-guard.sql"), "utf8");

    const starts = ANCHORS.map((a) => {
      const idx = sqlText.indexOf(a);
      if (idx === -1) throw new Error(`capacity-guard.sql anchor not found: ${a}`);
      return idx;
    });
    for (let i = 1; i < starts.length; i++) {
      if (starts[i] <= starts[i - 1]) throw new Error("capacity-guard.sql anchors out of order");
    }

    for (let i = 0; i < starts.length; i++) {
      const stmt = sqlText.slice(starts[i], starts[i + 1]).trim();
      await db.execute(sql.raw(stmt));
    }

    // Sanity check: trigger exists.
    const check = await db.execute(sql`
      SELECT tgname FROM pg_trigger WHERE tgname = 'bookings_capacity_guard';
    `);
    console.log("Trigger present:", JSON.stringify((check as { rows?: unknown }).rows ?? check));

    console.log("Slot capacity guard applied.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to apply capacity guard:", error);
    process.exit(1);
  }
}

apply();
