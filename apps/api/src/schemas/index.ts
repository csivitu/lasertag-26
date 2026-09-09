import { z } from "zod";

export const soloRegistrationSchema = z.object({
    slotId: z.string().uuid({ message: "Invalid slotId format (must be a valid UUID)" }),
    name: z.string().trim().min(1, { message: "Name is required" }),
    regNo: z.string().trim().min(1, { message: "Registration number is required" }),
    studentEmailId: z.string().trim().email({ message: "Invalid email format" }),
    phNumber: z.string().trim().min(1, { message: "Phone number is required" }),
});

export const reservationParamSchema = z.object({
    reservation_id: z.string().trim().min(1, { message: "Reservation ID is required" }),
});

export const adminCheckinSchema = z.object({
    qrToken: z.string().trim().min(1, { message: "QR token is required" }),
});
