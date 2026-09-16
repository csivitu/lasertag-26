import { z } from "zod";

/**
 * Trim and lower-case before validating, not after: a leading space would
 * otherwise fail the format check on an address the user clearly meant.
 */
const email = z.string().trim().toLowerCase().pipe(z.email());

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1, "password is required"),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Staff login is password-only — the server maps the password to its account. */
export const adminLoginSchema = z.object({
  body: z.object({
    password: z.string().min(1, "password is required"),
  }),
});

/** Response shape, for the OpenAPI document only — never used to parse input. */
export const loginResponseSchema = z.object({
  message: z.string(),
  user: z.looseObject({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
});
