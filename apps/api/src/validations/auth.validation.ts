import { z } from "zod";

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
    }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const userResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    createdAt: z.union([z.string(), z.date()]),
    updatedAt: z.union([z.string(), z.date()]),
});

export const loginResponseSchema = z.object({
    message: z.string(),
    user: userResponseSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
