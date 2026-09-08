import { z } from "zod";

import { loginResponseSchema, loginSchema } from "../schemas/auth";
import {
  paymentDetailResponseSchema,
  updatePaymentResponseSchema,
  updatePaymentSchema,
} from "../schemas/payments";
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
      Login: toSchema(loginSchema),
      LoginResponse: toSchema(loginResponseSchema),
      PaymentDetail: toSchema(paymentDetailResponseSchema),
      PaymentPatch: toSchema(updatePaymentSchema),
      PaymentUpdateResponse: toSchema(updatePaymentResponseSchema),
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
    "/auth/login": {
      post: {
        summary: "Sign in",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Login" } } },
        },
        responses: {
          200: {
            description: "Signed in; session cookie set on the response",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } },
          },
          401: {
            description: "Invalid email or password",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Sign out",
        tags: ["Auth"],
        responses: {
          200: { description: "Signed out" },
          401: {
            description: "Not authenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/admin-auth/login": {
      post: {
        summary: "Sign in as an admin",
        description:
          "Same as /auth/login, but rejects the attempt before checking the password if the email isn't an admin's — with the same 401 either way, so the response can't be used to tell 'unknown email' apart from 'exists, not an admin'.",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Login" } } },
        },
        responses: {
          200: {
            description: "Signed in; session cookie set on the response",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } },
          },
          401: {
            description: "Invalid email or password, or not an admin",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/admin-auth/logout": {
      post: {
        summary: "Sign out of an admin session",
        tags: ["Auth"],
        responses: {
          200: { description: "Signed out" },
          401: {
            description: "Not authenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/admin/payments/verify": {
      post: {
        summary: "Bulk-verify payments",
        description: "Not implemented yet — waiting on the payment gateway's CSV format.",
        tags: ["Payments"],
        responses: {
          501: {
            description: "Not implemented",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/admin/payments/{registration_id}": {
      get: {
        summary: "Get payment detail for a registration",
        tags: ["Payments"],
        parameters: [
          { in: "path", name: "registration_id", required: true, schema: { type: "string" }, description: "bookings.id" },
        ],
        responses: {
          200: { description: "Payment detail", content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentDetail" } } } },
          404: { description: "Registration not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        summary: "Set a registration's payment status",
        description: "Updates the paid flag on the booking's user, not the booking itself.",
        tags: ["Payments"],
        parameters: [
          { in: "path", name: "registration_id", required: true, schema: { type: "string" }, description: "bookings.id" },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentPatch" } } },
        },
        responses: {
          200: { description: "The updated user's payment status", content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentUpdateResponse" } } } },
          400: { description: "Invalid registration_id or paid value", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Registration not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
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
