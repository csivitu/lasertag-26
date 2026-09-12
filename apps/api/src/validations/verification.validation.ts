import { z } from "zod";

export const verifyRegistrationSchema = z.object({
  params: z.object({
    registration_id: z
      .string()
      .trim()
      .min(1, "registration_id is required."),
  }),
});

export const checkInSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(1, "identifier (user ID or QR token) is required."),
  }),
});

