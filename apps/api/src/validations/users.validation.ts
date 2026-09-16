import { z } from "zod";

/**
 * PATCH /users/me/details — saves the onboarding fields collected in the
 * select-mode popups (name, 10-digit phone, registration number) onto the
 * signed-in user's row. At least one field is required.
 */
export const updateMyDetailsSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(100).optional(),
      phone: z
        .string()
        .trim()
        .regex(/^\d{10}$/, "phone must be a 10-digit number")
        .optional(),
      reg_number: z.string().trim().min(1).max(50).optional(),
    })
    .refine((b) => b.name !== undefined || b.phone !== undefined || b.reg_number !== undefined, {
      message: "At least one of name, phone, reg_number is required.",
    }),
});

export type UpdateMyDetailsInput = z.infer<typeof updateMyDetailsSchema>["body"];
