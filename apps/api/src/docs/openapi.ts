import { z } from "zod";

import {
  createSlotSchema,
  patchSlotSchema,
  slotResponseSchema,
} from "../schemas/slots";

/**
 * A plain object, not swagger-jsdoc scanning route-file comments.
 *
 * swagger-jsdoc parses TypeScript *source* at runtime via its glob, which is
 * cwd-relative and, worse, has no equivalent once the app is bundled to
 * dist/ — there is no source there to scan. A plain object is just data: it
 * bundles like any other import and works identically in dev and from the
 * built output.
 *
 * Schemas are derived from the zod validators via `toJSONSchema` so the docs
 * cannot drift from what the API actually accepts. `io: "input"` matters
 * here: create/patch schemas `.transform()` an ISO string into a `Date`, and
 * it is the *input* side (the string) that a client sends.
 */
const toSchema = (schema: z.ZodType) =>
  z.toJSONSchema(schema, { target: "openapi-3.0", io: "input", unrepresentable: "any" });

const errorSchema = {
  type: "object" as const,
  properties: {
    error: { type: "string" },
    code: { type: "string" },
  },
};

const conflictSchema = {
  type: "object" as const,
  properties: {
    error: { type: "string" },
    code: { type: "string" },
    bookingCount: { type: "integer" },
    requestedCapacity: { type: "integer" },
  },
};

export const openapiDocument = {
  openapi: "3.0.0",
  info: {
    title: "Laser Tag Admin API",
    version: "1.0.0",
  },
  components: {
    schemas: {
      Slot: toSchema(slotResponseSchema),
      SlotInput: toSchema(createSlotSchema),
      SlotPatch: toSchema(patchSlotSchema),
      Error: errorSchema,
      Conflict: conflictSchema,
    },
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
        description: "Sign in via the better-auth endpoints and reuse the resulting cookie.",
      },
    },
  },
  security: [{ sessionCookie: [] }],
  paths: {
    "/admin/slots": {
      get: {
        summary: "List all slots",
        tags: ["Slots"],
        responses: {
          200: {
            description: "Array of slots",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Slot" } },
              },
            },
          },
          401: { description: "Not signed in", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          403: { description: "Signed in, not an admin", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      post: {
        summary: "Create one slot",
        tags: ["Slots"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SlotInput" } } },
        },
        responses: {
          201: {
            description: "The created slot",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Slot" } } },
          },
          400: {
            description: "Invalid input",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/admin/slots/bulk": {
      post: {
        summary: "Create multiple slots",
        tags: ["Slots"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "array", items: { $ref: "#/components/schemas/SlotInput" } },
            },
          },
        },
        responses: {
          201: {
            description: "The created slots",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Slot" } },
              },
            },
          },
          400: {
            description: "Invalid input — non-empty array required, every slot validated the same as single-create",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/admin/slots/{slot_id}": {
      patch: {
        summary: "Edit a slot",
        tags: ["Slots"],
        parameters: [
          { in: "path", name: "slot_id", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          description: "Any subset of fields; only the given ones change.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SlotPatch" } } },
        },
        responses: {
          200: { description: "The updated slot", content: { "application/json": { schema: { $ref: "#/components/schemas/Slot" } } } },
          400: { description: "Invalid slot_id or field values", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Slot not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: {
            description: "capacity would drop below the slot's current booking count",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Conflict" } } },
          },
        },
      },
      delete: {
        summary: "Delete a slot",
        tags: ["Slots"],
        parameters: [
          { in: "path", name: "slot_id", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          204: { description: "Slot deleted" },
          400: { description: "slot_id is not a valid UUID", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Slot not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: {
            description: "Slot has existing bookings",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Conflict" } } },
          },
        },
      },
    },
    "/admin/teams/{team_id}": {
      get: {
        summary: "Get team detail",
        description:
          "Team members with payment and QR/check-in status, plus the slot booked for the team (found via the team leader's own booking), if any.",
        tags: ["Teams"],
        parameters: [{ in: "path", name: "team_id", required: true, schema: { type: "string" }, description: "teams.team_code" }],
        responses: {
          200: { description: "Team detail" },
          400: { description: "team_id is required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Team not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/admin/registrations": {
      get: {
        summary: "Search registrations",
        description:
          "A 'registration' is a booking. All query params are optional and combined with AND; reg_no matches bookings.id exactly, the rest are case-insensitive substring matches against the booking's user. No params returns every registration.",
        tags: ["Registrations"],
        parameters: [
          { in: "query", name: "reg_no", schema: { type: "string" }, description: "Exact bookings.id" },
          { in: "query", name: "name", schema: { type: "string" }, description: "Substring match on user.name" },
          { in: "query", name: "phone", schema: { type: "string" }, description: "Substring match on user.ph_number" },
          { in: "query", name: "email", schema: { type: "string" }, description: "Substring match on user.email" },
        ],
        responses: {
          200: { description: "Matching registrations (empty array if nothing matches)" },
        },
      },
    },
  },
};
