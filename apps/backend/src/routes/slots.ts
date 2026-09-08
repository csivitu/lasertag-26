import { Router, Request, Response } from 'express';
import { validateRequest } from '../middlewares/validate';
import { requireAdmin } from '../middlewares/auth.middleware';
import {
  reserveSlotSchema,
  createSlotSchema,
  deleteSlotSchema,
} from '../schemas/slot.schema';
import { slotService } from '../services/slot.service';
import { AppError } from '../services/team.service';

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
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const allSlots = await slotService.getAllSlots();
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
 * /slots:
 *   post:
 *     summary: Create a new slot (Admin Only)
 *     tags: [Slots]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startTime, endTime, capacity]
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               capacity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Slot created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.post(
  '/',
  requireAdmin,
  validateRequest(createSlotSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const createdSlot = await slotService.createSlot(req.body);
      res.status(201).json({
        success: true,
        message: 'Slot created successfully.',
        data: createdSlot,
      });
    } catch (error: unknown) {
      console.error('Error creating slot:', error);
      const err = error as Error;
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        success: false,
        error: err.message || 'Failed to create slot.',
        details: err.message || String(error),
      });
    }
  }
);

/**
 * @openapi
 * /slots/{slot_id}:
 *   delete:
 *     summary: Delete a slot (Admin Only)
 *     tags: [Slots]
 *     parameters:
 *       - in: path
 *         name: slot_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Slot deleted successfully
 *       403:
 *         description: Forbidden (Admin only)
 */
router.delete(
  '/:slot_id',
  requireAdmin,
  validateRequest(deleteSlotSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await slotService.deleteSlot(req.params.slot_id as string);
      res.status(200).json({
        success: true,
        message: 'Slot deleted successfully.',
        data: result,
      });
    } catch (error: unknown) {
      console.error('Error deleting slot:', error);
      const err = error as Error;
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        success: false,
        error: err.message || 'Failed to delete slot.',
        details: err.message || String(error),
      });
    }
  }
);

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
 *     
 */
router.post(
  '/:slot_id/reserve',
  validateRequest(reserveSlotSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const newBooking = await slotService.reserveSlot({
        slot_id: req.params.slot_id as string,
        user_id: req.body.user_id,
        type: req.body.type,
        team_code: req.body.team_code,
      });

      res.status(201).json({
        success: true,
        message: 'Slot reserved successfully.',
        data: newBooking,
      });
    } catch (error: unknown) {
      console.error('Error reserving slot:', error);
      const err = error as Error;
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        success: false,
        error: err.message || 'Failed to reserve slot.',
        details: err.message || String(error),
      });
    }
  }
);

export default router;
