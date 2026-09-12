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

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // better-auth signs session cookies with this. A short or missing secret
  // means sessions silently fail to verify, which surfaces as every admin
  // request 401ing for no visible reason.
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url().default("http://localhost:3001"),
  WEB_ORIGIN: z.url().default("http://localhost:3000"),
  SMTP_HOST: z.string().min(1).default("smtp.resend.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_USER: z.string().min(1).default("resend"),
  SMTP_PASS:
    process.env.NODE_ENV === "production"
      ? z.string().min(1, "SMTP_PASS is required in production")
      : z.string().default("dummy_pass"),
  MAIL_FROM:
    process.env.NODE_ENV === "production"
      ? z.string().min(1, "MAIL_FROM is required in production")
      : z.string().default("noreply@lasertag.com"),
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
    console.error(`Invalid environment configuration:\n${lines.join("\n")}`);
    process.exit(1);
  }

  return Object.freeze(parsed.data);
}

export const env = loadEnv();
