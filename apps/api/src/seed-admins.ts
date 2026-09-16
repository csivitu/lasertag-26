import { eq } from "drizzle-orm";

import { db } from "@lasertag-26/database";
import { user } from "@lasertag-26/database/auth-schema";

import { auth } from "./auth";
import type { Env } from "./env";

const SEEDS = (env: Env) =>
  [
    { email: env.SUPER_ADMIN_EMAIL, password: env.SUPER_ADMIN_PASSWORD, role: "super_admin", name: "Super Admin" },
    { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, role: "admin", name: "Admin" },
  ] as const;

/** Ensures the two env-defined staff accounts exist. Idempotent — never resets passwords. */
export async function seedAdmins(env: Env) {
  for (const s of SEEDS(env)) {
    const existing = await db.select().from(user).where(eq(user.email, s.email)).limit(1);
    if (existing.length > 0) {
      if (existing[0].role !== s.role) {
        await db.update(user).set({ role: s.role }).where(eq(user.email, s.email));
        console.log(`Updated ${s.email} role -> ${s.role}`);
      }
      continue;
    }
    await auth.api.signUpEmail({ body: { email: s.email, password: s.password, name: s.name } });
    await db.update(user).set({ role: s.role, emailVerified: true }).where(eq(user.email, s.email));
    console.log(`Seeded ${s.role}: ${s.email}`);
  }
}
