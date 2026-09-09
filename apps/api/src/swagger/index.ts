import { paymentPaths, paymentSchemas } from "./admin-payments.swagger";
import { authPaths, authSchemas } from "./auth.swagger";
import { participantPaths } from "./participant.swagger";
import { registrationPaths } from "./registrations.swagger";
import { conflictSchema, errorSchema } from "./shared";
import { slotPaths, slotSchemas } from "./slots.swagger";
import { teamPaths } from "./teams.swagger";

/**
 * A plain object, not swagger-jsdoc scanning these files' comments.
 *
 * swagger-jsdoc parses TypeScript *source* at runtime via a cwd-relative
 * glob, which has no equivalent once the app is bundled to dist/ — there is
 * no source there to scan, so the docs silently empty out in production. A
 * plain object bundles like any other import and behaves identically in dev
 * and from the built output.
 */
export const openapiDocument = {
  openapi: "3.0.0",
  info: {
    title: "Laser Tag API",
    version: "1.0.0",
  },
  components: {
    schemas: {
      ...slotSchemas,
      ...authSchemas,
      ...paymentSchemas,
      Error: errorSchema,
      Conflict: conflictSchema,
    },
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
        description: "Sign in via /auth/login or /admin-auth/login and reuse the resulting cookie.",
      },
    },
  },
  security: [{ sessionCookie: [] }],
  paths: {
    ...authPaths,
    ...participantPaths,
    ...paymentPaths,
    ...slotPaths,
    ...teamPaths,
    ...registrationPaths,
  },
};
