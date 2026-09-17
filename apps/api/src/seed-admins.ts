import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

import { db } from "@lasertag-26/database";
import { account, user } from "@lasertag-26/database/auth-schema";

import { auth } from "./auth";
import type { Env } from "./env";

const SEEDS = (env: Env) =>
  [
    { email: env.SUPER_ADMIN_EMAIL, password: env.SUPER_ADMIN_PASSWORD, role: "super_admin", name: "Super Admin" },
    { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, role: "admin", name: "Admin" },
  ] as const;

/** Ensures the two env-defined staff accounts exist. Idempotent — passwords
 * are only (re)set for new accounts, or for existing ones when
 * RESET_STAFF_PASSWORDS=true (needed after changing ADMIN_PASSWORD /
 * SUPER_ADMIN_PASSWORD post-seed; otherwise login keeps failing against the
 * old hash). Never logs passwords. */
export async function seedAdmins(env: Env) {
  for (const s of SEEDS(env)) {
    const existing = await db.select().from(user).where(eq(user.email, s.email)).limit(1);
    if (existing.length > 0) {
      if (existing[0].role !== s.role) {
        await db.update(user).set({ role: s.role }).where(eq(user.email, s.email));
        console.log(`Updated ${s.email} role -> ${s.role}`);
      }
      if (env.RESET_STAFF_PASSWORDS) {
        const hashed = await hashPassword(s.password);
        await db
          .update(account)
          .set({ password: hashed })
          .where(and(eq(account.userId, existing[0].id), eq(account.providerId, "credential")));
        console.log(`Reset password hash for ${s.email}`);
      }
      continue;
    }
    await auth.api.signUpEmail({ body: { email: s.email, password: s.password, name: s.name } });
    await db.update(user).set({ role: s.role, emailVerified: true }).where(eq(user.email, s.email));
    console.log(`Seeded ${s.role}: ${s.email}`);
  }
}
