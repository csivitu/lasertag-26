import path from "path";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

import { db } from "@lasertag-26/database";
import { sql } from "drizzle-orm";

async function clean() {
  console.log("🧹 Clearing all database tables...");

  try {
    await db.execute(
      sql`TRUNCATE TABLE "bookings", "team_members", "teams", "slots", "session", "account", "verification", "user" CASCADE;`
    );

    console.log("✅ Database completely wiped clean!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to clean database:", error);
    process.exit(1);
  }
}

clean();
