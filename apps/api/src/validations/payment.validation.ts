import { z } from "zod";

export const getPaymentDetailsSchema = z.object({
    params: z.object({
        registration_id: z.string().min(1),
    }),
});

export const updatePaymentSchema = z.object({
    params: z.object({
        registration_id: z.string().min(1),
    }),
    body: z.object({
        paid: z.boolean(),
    }),
});

export const paymentDetailsResponseSchema = z.object({
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

export type GetPaymentDetailsInput = z.infer<typeof getPaymentDetailsSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PaymentDetailsResponse = z.infer<typeof paymentDetailsResponseSchema>;
export type UpdatePaymentResponse = z.infer<typeof updatePaymentResponseSchema>;