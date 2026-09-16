import path from "path";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { db } from "@lasertag-26/database";
import { user } from "@lasertag-26/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "./auth";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const password = process.argv[3]?.trim();

  if (!email) {
    console.error("❌ Please provide an email address.");
    console.log("Usage: bun src/make-admin.ts <user-email> [password]");
    process.exit(1);
  }

  // Check if user exists
  const existingUsers = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existingUsers.length === 0) {
    if (!password) {
      console.error(`❌ User with email "${email}" not found in database.`);
      console.log(`💡 To create a new admin with password, run: bun src/make-admin.ts ${email} <password>`);
      process.exit(1);
    }

    // Create user via better-auth
    console.log(`Creating new admin account for ${email}...`);
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: email.split("@")[0] || "Admin",
      },
    });

    const updated = await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.email, email))
      .returning();

    console.log(`🎉 Success! Created new admin "${updated[0].name}" (${updated[0].email}) with password.`);
    process.exit(0);
  }

  // User already exists
  const updated = await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.email, email))
    .returning();

  if (password) {
    try {
      // Try to sign up credential if not exists or set password
      await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: updated[0].name || "Admin",
        },
      });
      console.log(`🔑 Password set/created for "${updated[0].name}" (${updated[0].email}).`);
    } catch {
      console.log(`ℹ️ Account credentials processed for existing user.`);
    }
  }

  console.log(`🎉 Success! User "${updated[0].name}" (${updated[0].email}) is confirmed as 'admin'.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error updating user role:", err);
  process.exit(1);
});
