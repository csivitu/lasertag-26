import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@lasertag-26/database";
import * as authSchema from "@lasertag-26/database/auth-schema";

import { env } from "./env";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: authSchema,
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            // `role` already exists on the `user` table (auth-schema.ts); this
            // just tells better-auth to select it into the session payload.
            // `input: false` is not optional — without it a client can pass
            // {"role":"admin"} to sign-up/update-user and self-grant admin.
            role: {
                type: "string",
                required: false,
                defaultValue: "user",
                input: false,
            },
        },
    },
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.WEB_ORIGIN],
});