import { z } from "zod";

/**
 * Schemas are derived from the zod validators via `toJSONSchema` so the docs
 * cannot drift from what the API actually accepts. `io: "input"` matters here:
 * the slot schemas `.transform()` an ISO string into a `Date`, and it is the
 * *input* side (the string) that a client sends.
 */
export const toSchema = (schema: z.ZodType) =>
  z.toJSONSchema(schema, { target: "openapi-3.0", io: "input", unrepresentable: "any" });

export const errorSchema = {
  type: "object" as const,
  properties: {
    error: { type: "string" },
    code: { type: "string" },
  },
};

export const conflictSchema = {
  type: "object" as const,
  properties: {
    error: { type: "string" },
    code: { type: "string" },
    bookingCount: { type: "integer" },
    requestedCapacity: { type: "integer" },
  },
};

const errorResponse = (description: string) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
});

export const responses = {
  unauthorized: errorResponse("Not signed in"),
  forbidden: errorResponse("Signed in, not an admin"),
  notFound: errorResponse("Not found"),
  badRequest: errorResponse("Invalid input"),
  error: errorResponse,
};
