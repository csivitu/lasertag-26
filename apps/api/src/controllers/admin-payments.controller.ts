import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db, bookings, user } from "@lasertag-26/database";
import type {
    GetPaymentDetailsInput,
    UpdatePaymentInput,
} from "../validations/payment.validation";

export const verifyPayments = async (_req: Request, res: Response) => {
    res.status(501).json({
        message:
            "Payment verification is not implemented yet. Waiting for the payment CSV format.",
    });
};

export const getPaymentDetails = async (
    req: Request<GetPaymentDetailsInput["params"]>,
    res: Response
) => {
    try {
        const { registration_id } = req.params;

        const result = await db
            .select({
                bookingId: bookings.id,
                type: bookings.type,
                userId: bookings.userId,
                paid: user.paid,
                userName: user.name,
                userEmail: user.email,
            })
            .from(bookings)
            .innerJoin(user, eq(bookings.userId, user.id))
            .where(eq(bookings.id, registration_id));

        if (result.length === 0) {
            return res.status(404).json({
                message: "Registration not found",
            });
        }

        res.json(result[0]);
    } catch (error) {
        console.error("Error fetching payment details:", error);

        res.status(500).json({
            message: "Failed to fetch payment details",
        });
    }
};

export const updatePaymentStatus = async (
    req: Request<
        UpdatePaymentInput["params"],
        unknown,
        UpdatePaymentInput["body"]
    >,
    res: Response
) => {
    try {
        const { registration_id } = req.params;
        const { paid } = req.body;

        // Find the booking first
        const bookingResult = await db
            .select({
                userId: bookings.userId,
            })
            .from(bookings)
            .where(eq(bookings.id, registration_id));

        if (bookingResult.length === 0) {
            return res.status(404).json({
                message: "Registration not found",
            });
        }

        // Update the payment status of the associated user
        const updatedUser = await db
            .update(user)
            .set({
                paid,
            })
            .where(eq(user.id, bookingResult[0].userId))
            .returning({
                id: user.id,
                name: user.name,
                email: user.email,
                paid: user.paid,
            });

        res.status(200).json({
            message: "Payment status updated successfully",
            registrationId: registration_id,
            user: updatedUser[0],
        });
    } catch (error) {
        console.error("Error updating payment status:", error);

        res.status(500).json({
            message: "Failed to update payment status",
        });
    }
};
