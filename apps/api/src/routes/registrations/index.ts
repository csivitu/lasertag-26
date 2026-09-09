import { Router } from "express";
import { eq, count } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "../../lib/db";
import { users, bookings, slots } from "@lasertag/database/schema";
import { validateBody, validateParams } from "../../middleware/validate";
import { soloRegistrationSchema, reservationParamSchema } from "../../schemas";

const router = Router();

// POST /registrations/solo
// Body: { slotId, name, regNo, studentEmailId, phNumber }
router.post("/solo", validateBody(soloRegistrationSchema), async (req, res) => {
    try {
        const { slotId, name, regNo, studentEmailId, phNumber } = req.body;

        // Verify the slot exists
        const [slot] = await db.select().from(slots).where(eq(slots.id, slotId));
        if (!slot) {
            res.status(404).json({ error: "Slot not found" });
            return;
        }

        // Check slot capacity
        const [{ value: bookedCount }] = await db
            .select({ value: count() })
            .from(bookings)
            .where(eq(bookings.slotId, slotId));

        if (bookedCount >= slot.capacity) {
            res.status(409).json({ error: "Slot is fully booked" });
            return;
        }

        // Guard against duplicate registration by email
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, studentEmailId));

        if (existingUser) {
            res.status(409).json({ error: "A user with this email is already registered" });
            return;
        }

        // Create user entry with a unique qrToken
        const qrToken = crypto.randomUUID();
        const [newUser] = await db
            .insert(users)
            .values({
                name,
                email: studentEmailId,
                regNo,
                phNumber,
                qrToken,
            })
            .returning();

        // Create solo booking
        const reservationId = crypto.randomUUID();
        const [booking] = await db
            .insert(bookings)
            .values({
                id: reservationId,
                type: "individual",
                userId: newUser.id,
                slotId,
            })
            .returning();

        res.status(201).json({ reservationId: booking.id, user: newUser });
    } catch (err) {
        console.error("POST /registrations/solo error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /registrations/:reservation_id/confirm
router.post("/:reservation_id/confirm", validateParams(reservationParamSchema), async (req, res) => {
    try {
        const reservation_id = req.params.reservation_id as string;

        const [booking] = await db
            .update(bookings)
            .set({ confirmationEmailSent: true })
            .where(eq(bookings.id, reservation_id))
            .returning();

        if (!booking) {
            res.status(404).json({ error: "Booking not found" });
            return;
        }

        res.status(200).json({ message: "Booking confirmed", booking });
    } catch (err) {
        console.error("POST /registrations/:id/confirm error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE /registrations/:reservation_id
router.delete("/:reservation_id", validateParams(reservationParamSchema), async (req, res) => {
    try {
        const reservation_id = req.params.reservation_id as string;

        const [deleted] = await db
            .delete(bookings)
            .where(eq(bookings.id, reservation_id))
            .returning();

        if (!deleted) {
            res.status(404).json({ error: "Booking not found" });
            return;
        }

        res.status(200).json({ message: "Booking deleted", booking: deleted });
    } catch (err) {
        console.error("DELETE /registrations/:id error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /registrations/:reservation_id/qr — must be before /:reservation_id
router.get("/:reservation_id/qr", validateParams(reservationParamSchema), async (req, res) => {
    try {
        const reservation_id = req.params.reservation_id as string;

        const result = await db
            .select({ qrToken: users.qrToken })
            .from(bookings)
            .innerJoin(users, eq(bookings.userId, users.id))
            .where(eq(bookings.id, reservation_id));

        if (result.length === 0) {
            res.status(404).json({ error: "Booking not found" });
            return;
        }

        const token = result[0].qrToken;
        if (!token) {
            res.status(404).json({ error: "No QR token associated with this user" });
            return;
        }

        // Generate QR code Data URL from the user's qrToken
        const qrCodeUrl = await QRCode.toDataURL(token);
        res.status(200).json({ qrToken: token, qrCodeUrl });
    } catch (err) {
        console.error("GET /registrations/:id/qr error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /registrations/:reservation_id
router.get("/:reservation_id", validateParams(reservationParamSchema), async (req, res) => {
    try {
        const reservation_id = req.params.reservation_id as string;

        const result = await db
            .select({
                booking: bookings,
                slot: slots,
                user: users,
            })
            .from(bookings)
            .innerJoin(slots, eq(bookings.slotId, slots.id))
            .innerJoin(users, eq(bookings.userId, users.id))
            .where(eq(bookings.id, reservation_id));

        if (result.length === 0) {
            res.status(404).json({ error: "Booking not found" });
            return;
        }

        res.status(200).json(result[0]);
    } catch (err) {
        console.error("GET /registrations/:id error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
