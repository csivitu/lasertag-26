import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "./db";

/**
 * BetterAuth instance.
 * - Manages its own user/session/account tables (separate from the domain users table).
 * - The `admin` plugin adds role-based access: users with role="admin" can access admin routes.
 * - Mount the handler at /api/auth/* in index.ts via toNodeHandler(auth).
 */
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    plugins: [admin()],
    emailAndPassword: {
        enabled: true,
    },
});
