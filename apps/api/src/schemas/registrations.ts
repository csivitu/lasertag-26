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
  reg_no: optionalFilter,
  name: optionalFilter,
  phone: optionalFilter,
  email: optionalFilter,
});
