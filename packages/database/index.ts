import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as authSchema from './auth-schema';

export * from './schema';
export * from './auth-schema';

// `dotenv/config` loads .env from process.cwd(), which is the *consuming*
// package's directory (e.g. apps/api) when run via `bun run --filter`, not
// the monorepo root where the real .env lives — so DATABASE_URL was never
// found in that workflow. This package's own location is fixed, so resolve
// .env files relative to it instead of relying on cwd. dotenv never
// overwrites an already-set key, so later files are fallbacks only.
const packageDir = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(packageDir, '../../.env') });
config({ path: path.resolve(packageDir, '../../apps/api/.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined.');
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, {
  schema: {
    ...schema,
    ...authSchema,
  },
});