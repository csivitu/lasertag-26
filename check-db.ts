import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}

const sql = neon(process.env.DATABASE_URL);

async function checkDatabase() {
    console.log("\n--- TABLES ---");

    const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

    console.table(tables);

    console.log("\n--- USER COLUMNS ---");

    const columns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user'
    ORDER BY ordinal_position
  `;

    console.table(columns);

    console.log("\n--- APP USER FOREIGN KEYS ---");

    const foreignKeys = await sql`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS referenced_table
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name IN ('bookings', 'teams', 'team_members')
    ORDER BY tc.table_name, kcu.column_name
  `;

    console.table(foreignKeys);
}

checkDatabase().catch(console.error);