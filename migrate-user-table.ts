import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}

const sql = neon(process.env.DATABASE_URL);

async function migrateUserTable() {
    console.log("Starting database migration...");

    // 1. Add application columns to Better Auth's user table

    await sql`
    ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS "ph_number" text
  `;

    await sql`
    ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS "qr_token" text
  `;

    await sql`
    ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS "is_checked_in" boolean DEFAULT false NOT NULL
  `;

    await sql`
    ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS "checked_in_at" timestamp
  `;

    await sql`
    ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS "paid" boolean DEFAULT false NOT NULL
  `;

    await sql`
    ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user' NOT NULL
  `;

    console.log("✓ Added application columns to user table");

    // 2. Drop foreign keys pointing to the old users table

    await sql`
    ALTER TABLE "bookings"
    DROP CONSTRAINT IF EXISTS "bookings_user_id_users_id_fk"
  `;

    await sql`
    ALTER TABLE "team_members"
    DROP CONSTRAINT IF EXISTS "team_members_user_id_users_id_fk"
  `;

    await sql`
    ALTER TABLE "teams"
    DROP CONSTRAINT IF EXISTS "teams_leader_id_users_id_fk"
  `;

    console.log("✓ Removed old user foreign keys");

    // 3. Change UUID columns to text

    await sql`
    ALTER TABLE "bookings"
    ALTER COLUMN "user_id" TYPE text USING "user_id"::text
  `;

    await sql`
    ALTER TABLE "team_members"
    ALTER COLUMN "user_id" TYPE text USING "user_id"::text
  `;

    await sql`
    ALTER TABLE "teams"
    ALTER COLUMN "leader_id" TYPE text USING "leader_id"::text
  `;

    console.log("✓ Changed user ID columns to text");

    // 4. Add foreign keys pointing to Better Auth's user table

    await sql`
    ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_user_id_user_id_fk"
    FOREIGN KEY ("user_id")
    REFERENCES "user"("id")
    ON DELETE CASCADE
  `;

    await sql`
    ALTER TABLE "team_members"
    ADD CONSTRAINT "team_members_user_id_user_id_fk"
    FOREIGN KEY ("user_id")
    REFERENCES "user"("id")
    ON DELETE CASCADE
  `;

    await sql`
    ALTER TABLE "teams"
    ADD CONSTRAINT "teams_leader_id_user_id_fk"
    FOREIGN KEY ("leader_id")
    REFERENCES "user"("id")
    ON DELETE CASCADE
  `;

    console.log("✓ Added new Better Auth user foreign keys");

    // 5. Remove the old empty users table

    await sql`
    DROP TABLE IF EXISTS "users"
  `;

    console.log("✓ Removed old users table");

    console.log("\nMigration completed successfully! 🎉");
}

migrateUserTable().catch((error) => {
    console.error("\nMigration failed:");
    console.error(error);
    process.exit(1);
});