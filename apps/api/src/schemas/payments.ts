import { z } from "zod";

/** `bookings.id` is a free-form text primary key, so only non-blank is enforced. */
export const registrationIdParamsSchema = z.object({
  registration_id: z.string().trim().min(1, "registration_id is required"),
});

export const updatePaymentSchema = z.object({
  paid: z.boolean(),
});

/** Response shapes, for the OpenAPI document only — never used to parse input. */
export const paymentDetailResponseSchema = z.object({
  bookingId: z.string(),
  type: z.string(),
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
