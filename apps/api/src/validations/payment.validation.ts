import { z } from "zod";

/** `bookings.id` is a free-form text primary key, so only non-blank is enforced. */
const registrationIdParams = z.object({
  registration_id: z.string().trim().min(1, "registration_id is required"),
});

export const getPaymentDetailsSchema = z.object({ params: registrationIdParams });

export const updatePaymentSchema = z.object({
  params: registrationIdParams,
  body: z.object({ paid: z.boolean() }),
});

export type GetPaymentDetailsInput = z.infer<typeof getPaymentDetailsSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

/** Pasted verification list: raw text, split server-side. */
export const pasteImportSchema = z.object({
  body: z.object({
    text: z
      .string()
      .trim()
      .min(1, "Paste at least one reg number or email.")
      .max(20000, "Pasted list is too long — split it and retry."),
  }),
});

export type PasteImportInput = z.infer<typeof pasteImportSchema>;

/** Response shapes, for the OpenAPI document only — never used to parse input. */
export const paymentDetailResponseSchema = z.object({
  bookingId: z.string(),
  type: z.enum(["individual", "team"]),
  userId: z.string(),
  paid: z.boolean(),
  userName: z.string(),
  userEmail: z.string(),
});

export const updatePaymentResponseSchema = z.object({
  message: z.string(),
  registrationId: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    paid: z.boolean(),
  }),
});
