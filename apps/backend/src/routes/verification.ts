import { Router, Request, Response } from 'express';
import { db } from '../../../../packages/database';
import { bookings, users, slots } from '../../../../packages/database/schema';
import { eq, or } from 'drizzle-orm';

const router = Router();

/**
 * @openapi
 * /verification/{registration_id}:
 *   get:
 *     summary: Verify booking, ticket, or user by ID / QR token
 *     tags: [Verification]
 *     parameters:
 *       - in: path
 *         name: registration_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verification details
 *       404:
 *         description: Registration or user not found
 */
router.get('/:registration_id', async (req: Request, res: Response): Promise<void> => {
  try {
    const registration_id = req.params.registration_id as string;

    if (!registration_id) {
      res.status(400).json({
        success: false,
        error: 'registration_id is required.',
      });
      return;
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, registration_id));

    if (booking) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, booking.userId));

      const [slot] = await db
        .select()
        .from(slots)
        .where(eq(slots.id, booking.slotId));

      res.status(200).json({
        success: true,
        verified: true,
        type: 'booking',
        data: {
          booking_id: booking.id,
          booking_type: booking.type,
          user: user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                is_checked_in: user.isCheckedIn,
                paid: user.paid,
              }
            : null,
          team_code: booking.teamCode,
          slot: slot
            ? {
                id: slot.id,
                start_time: slot.startTime,
                end_time: slot.endTime,
              }
            : null,
          confirmation_email_sent: booking.confirmationEmailSent,
        },
      });
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.id, registration_id), eq(users.qrToken, registration_id)));

    if (user) {
      const userBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.userId, user.id));

      res.status(200).json({
        success: true,
        verified: true,
        type: 'user',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            ph_number: user.phNumber,
            qr_token: user.qrToken,
            is_checked_in: user.isCheckedIn,
            checked_in_at: user.checkedInAt,
            paid: user.paid,
          },
          bookings: userBookings,
        },
      });
      return;
    }

    res.status(404).json({
      success: false,
      verified: false,
      error: 'Registration / Ticket / User not found for the given ID.',
    });
  } catch (error: unknown) {
    console.error('Error verifying registration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify registration.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
