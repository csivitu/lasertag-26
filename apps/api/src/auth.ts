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
    socialProviders: {
        ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
            ? {
                  google: {
                      clientId: env.GOOGLE_CLIENT_ID,
                      clientSecret: env.GOOGLE_CLIENT_SECRET,
                  },
              }
            : {}),
    },
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user",
                input: false,
            },
            regNo: {
                type: "string",
                required: false,
                input: false,
            },
            phNumber: {
                type: "string",
                required: false,
                input: false,
            },
            qrToken: {
                type: "string",
                required: false,
                input: false,
            },
            isCheckedIn: {
                type: "boolean",
                required: false,
                defaultValue: false,
                input: false,
            },
            paid: {
                type: "boolean",
                required: false,
                defaultValue: false,
                input: false,
            },
        },
    },
    onAPIError: {
        onError: (error) => {
            console.error("[Better-Auth API Error]:", error);
        },
        errorURL: `${env.WEB_ORIGIN || "http://localhost:3000"}/auth-error`,
    },
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [
        env.WEB_ORIGIN,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
});
