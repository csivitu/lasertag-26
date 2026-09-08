import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "password is required"),
});

/** Response shape, for the OpenAPI document only — never used to parse input. */
export const loginResponseSchema = z.object({
  message: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
});
