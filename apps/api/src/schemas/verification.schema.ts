import { z } from "zod";

export const verifyRegistrationSchema = {
  params: z.object({
    registration_id: z
      .string()
      .min(1, "registration_id is required."),
  }),
};

export const checkInSchema = {
  body: z.object({
    identifier: z.string().min(1, "identifier (user ID or QR token) is required."),
  }),
};
