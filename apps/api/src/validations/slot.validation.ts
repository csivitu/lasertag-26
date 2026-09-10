import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { slots } from "@lasertag-26/database";
import { z } from "zod";

/**
 * ISO-8601 string in, Date out.
 *
 * Deliberately not `z.coerce.date()`, which runs `new Date(input)` and only
 * rejects NaN — that accepts `null`, `0` and `true` as the epoch. This
 * requires a real timestamp; `{ offset: true }` allows `+05:30` as well as `Z`.
 */
const isoDate = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

/**
 * Column shape, derived from the drizzle table so validation cannot drift from
 * the schema. `id` is dropped because it is `defaultRandom()` — without the
 * omit, drizzle-zod would expose it as optional and let a client choose its own
 * primary key.
 */
const slotFields = createInsertSchema(slots, {
  capacity: (schema) => schema.min(0, "capacity must be a non-negative integer"),
})
  .omit({ id: true })
  .extend({ startTime: isoDate, endTime: isoDate });

export const slotInputSchema = slotFields.refine(
  (value) => value.startTime < value.endTime,
  { message: "startTime must be before endTime", path: ["startTime"] },
);

/**
 * Shape only. The start-before-end rule needs the stored row to compare
 * against when just one of the two fields is supplied, so it lives in
 * `resolveSlotWindow` in the service instead of being half-expressed here.
 */
export const slotPatchSchema = slotFields
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No valid fields to update",
  });

const slotIdParams = z.object({
  slot_id: z.uuid("slot_id must be a valid UUID"),
});

export const createSlotSchema = z.object({ body: slotInputSchema });

export const bulkCreateSlotsSchema = z.object({
  body: z.array(slotInputSchema).min(1, "Request body must be a non-empty array of slots"),
});

export const patchSlotSchema = z.object({
  params: slotIdParams,
  body: slotPatchSchema,
});

export const slotIdSchema = z.object({ params: slotIdParams });

/**
 * Response shape, for the OpenAPI document only — never used to parse input.
 * The timestamps are declared as ISO strings because that is what JSON
 * serialisation produces, whereas `createSelectSchema` types them as `Date`,
 * which has no JSON Schema representation.
 */
export const slotResponseSchema = createSelectSchema(slots).extend({
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
});

/**
 * Participant-facing slot reservation, carried over from `dev`.
 * Shaped as separate part-schemas for `validateRequest`.
 */
export const reserveSlotSchema = {
  params: z.object({
    slot_id: z.uuid("slot_id must be a valid UUID"),
  }),
  body: z
    .object({
      user_id: z
        .string()
        .min(1, "user_id and type (individual/team) are required fields."),
      type: z.enum(["individual", "team"], {
        message: 'type must be either "individual" or "team".',
      }),
      team_code: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.type === "team") {
          return Boolean(data.team_code && data.team_code.trim().length > 0);
        }
        return true;
      },
      {
        message: "team_code is required for team booking.",
        path: ["team_code"],
      }
    ),
};
