import { z } from "zod";

/**
 * An optional search filter.
 *
 * Blank and whitespace-only values mean "not filtering on this", not "invalid"
 * — a form that submits every field with some left empty must not 400. Express
 * yields an array when a key is repeated (`?name=a&name=b`), so the first
 * value wins rather than the query erroring.
 */
const optionalFilter = z.preprocess((value) => {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : undefined;
}, z.string().optional());

/** Non-strict: unknown query params are ignored rather than rejected. */
export const registrationQuerySchema = z.object({
  query: z.object({
    reg_no: optionalFilter,
    name: optionalFilter,
    phone: optionalFilter,
    email: optionalFilter,
  }),
});

/** POST /registrations/solo */
export const soloRegistrationSchema = z.object({
  body: z.object({
    slot_id: z.uuid("slot_id must be a valid UUID"),
  }),
});

/** Common reservation_id path parameter schema */
export const reservationIdParams = z.object({
  reservation_id: z.string().trim().min(1, "reservation_id is required"),
});

export const reservationIdSchema = z.object({
  params: reservationIdParams,
});

/** POST /registrations/:reservation_id/confirm */
export const confirmRegistrationSchema = reservationIdSchema;

/** DELETE /registrations/:reservation_id */
export const cancelRegistrationSchema = reservationIdSchema;

/** GET /registrations/:reservation_id */
export const getRegistrationSchema = reservationIdSchema;

/** GET /registrations/:reservation_id/qr */
export const getRegistrationQrSchema = reservationIdSchema;
