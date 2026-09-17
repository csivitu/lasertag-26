import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { z } from "zod";

// Resolved from this file's own location, not process.cwd(): `bun run --filter`
// and turbo both run tasks from the repo root, so a cwd-relative path would
// silently load nothing. Same reasoning as packages/database/index.ts.
const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// App-local first, repo root second. dotenv never overwrites an already-set
// key, so this order gives apps/api/.env precedence over the shared root .env
// while still inheriting DATABASE_URL from it.
config({ path: path.join(apiDir, ".env"), quiet: true });
config({ path: path.resolve(apiDir, "../../.env"), quiet: true });

const emptyToUndefined = (val: unknown) => {
  if (typeof val === "string" && val.trim() === "") {
    return undefined;
  }
  return val;
};

// Dashboard editors and copy-paste love smuggling in edge whitespace, which
// would silently desync login comparisons and seed hashes. Staff credential
// fields carry no meaningful surrounding whitespace, so trim them at load.
const trimmedString = (val: unknown) =>
  typeof val === "string" ? val.trim() : val;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().default(3001),
  ),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // better-auth signs session cookies with this. No production default: a
  // hardcoded fallback here would let anyone forge sessions for any user.
  BETTER_AUTH_SECRET: z.preprocess(
    emptyToUndefined,
    process.env.NODE_ENV === "production"
      ? z.string({ error: "BETTER_AUTH_SECRET is required in production" }).min(32, "BETTER_AUTH_SECRET must be at least 32 characters")
      : z
          .string()
          .min(32, "BETTER_AUTH_SECRET must be at least 32 characters")
          .default("lasertag_dev_secret_key_32_characters_minimum_length_required"),
  ),
  BETTER_AUTH_URL: z.preprocess(
    emptyToUndefined,
    z.url().default("http://localhost:3001"),
  ),
  WEB_ORIGIN: z.preprocess(
    emptyToUndefined,
    z.url().default("http://localhost:3000"),
  ),
  ADMIN_ORIGIN: z.preprocess(
    emptyToUndefined,
    z.url().default("http://localhost:3002"),
  ),
  GOOGLE_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  GOOGLE_CLIENT_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  SUPER_ADMIN_EMAIL: z.preprocess(
    (val) => trimmedString(emptyToUndefined(val)),
    z.string().default("superadmin@lasertag.local"),
  ),
  // Staff passwords select the account at login — public defaults would hand
  // both roles to anyone reading the repo. Required in production.
  SUPER_ADMIN_PASSWORD: z.preprocess(
    (val) => trimmedString(emptyToUndefined(val)),
    process.env.NODE_ENV === "production"
      ? z.string({ error: "SUPER_ADMIN_PASSWORD is required in production" }).min(8, "SUPER_ADMIN_PASSWORD must be at least 8 characters")
      : z.string().default("super30admin"),
  ),
  ADMIN_EMAIL: z.preprocess(
    (val) => trimmedString(emptyToUndefined(val)),
    z.string().default("admin@lasertag.local"),
  ),
  ADMIN_PASSWORD: z.preprocess(
    (val) => trimmedString(emptyToUndefined(val)),
    process.env.NODE_ENV === "production"
      ? z.string({ error: "ADMIN_PASSWORD is required in production" }).min(8, "ADMIN_PASSWORD must be at least 8 characters")
      : z.string().default("admin12345"),
  ),
  RESET_STAFF_PASSWORDS: z.preprocess(
    emptyToUndefined,
    z.coerce.boolean().default(false),
  ),
  SMTP_HOST: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("smtp.gmail.com"),
  ),
  SMTP_PORT: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().default(587),
  ),
  SMTP_USER: z.preprocess(
    emptyToUndefined,
    process.env.NODE_ENV === "production"
      ? z.string().min(1, "SMTP_USER is required in production")
      : z.string().default("dev_user"),
  ),
  SMTP_PASS: z.preprocess(
    emptyToUndefined,
    process.env.NODE_ENV === "production"
      ? z.string().min(1, "SMTP_PASS is required in production")
      : z.string().default("dummy_pass"),
  ),
  MAIL_FROM: z.preprocess(
    emptyToUndefined,
    process.env.NODE_ENV === "production"
      ? z.string().min(1, "MAIL_FROM is required in production")
      : z.string().default("LaserTag 2026 <noreply@lasertag.com>"),
  ),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates process.env and exits with a readable report if anything is
 * missing. Called once from index.ts before the app is built, so a
 * misconfigured deploy fails at boot rather than on the first request.
 */
export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const lines = parsed.error.issues.map(
      (issue) => `  - ${issue.path.join(".")}: ${issue.message}`,
    );
    console.error(
      `Invalid environment configuration:\n${lines.join("\n")}`,
    );
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
