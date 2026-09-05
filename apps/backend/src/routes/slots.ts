import { Router, Request, Response } from 'express';
import { db } from '../../../../packages/database';
import { slots, bookings, users, teams } from '../../../../packages/database/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * @openapi
 * /slots:
 *   get:
 *     summary: Query available slots
 *     tags: [Slots]
 *     responses:
 *       200:
 *         description: List of all slots
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const allSlots = await db.select().from(slots);

    res.status(200).json({
      success: true,
      data: allSlots,
    });
  } catch (error: unknown) {
    console.error('Error fetching slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch slots.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * @openapi
 * /slots/{slot_id}/reserve:
 *   post:
 *     summary: Reserve a slot
 *     tags: [Slots]
 *     parameters:
 *       - in: path
 *         name: slot_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, type]
 *             properties:
 *               user_id:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [individual, team]
 *               team_code:
 *                 type: string
 *     responses:
 *       201:
 *         description: Slot reserved successfully
 */
router.post('/:slot_id/reserve', async (req: Request, res: Response): Promise<void> => {
  try {
    const slot_id = req.params.slot_id as string;
    const { user_id, type, team_code } = req.body;

    if (!user_id || !type) {
      res.status(400).json({
        success: false,
        error: 'user_id and type (individual/team) are required fields.',
      });
      return;
    }

    if (type !== 'individual' && type !== 'team') {
      res.status(400).json({
        success: false,
        error: 'type must be either "individual" or "team".',
      });
      return;
    }

    const [targetSlot] = await db
      .select()
      .from(slots)
      .where(eq(slots.id, slot_id));

    if (!targetSlot) {
      res.status(404).json({
        success: false,
        error: 'Slot not found.',
      });
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, user_id as string));

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found.',
      });
      return;
    }

    if (type === 'team') {
      if (!team_code) {
        res.status(400).json({
          success: false,
          error: 'team_code is required for team booking.',
        });
        return;
      }

      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.teamCode, team_code as string));

      if (!team) {
        res.status(404).json({
          success: false,
          error: 'Team not found.',
        });
        return;
      }
    }

    const bookingId = `BKG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [newBooking] = await db
      .insert(bookings)
      .values({
        id: bookingId,
        type,
        userId: user_id as string,
        teamCode: type === 'team' ? (team_code as string) : null,
        slotId: slot_id,
        confirmationEmailSent: false,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Slot reserved successfully.',
      data: newBooking,
    });
  } catch (error: unknown) {
    console.error('Error reserving slot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reserve slot.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
