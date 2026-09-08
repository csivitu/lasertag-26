import { Router, Request, Response } from 'express';
import { validateRequest } from '../middlewares/validate';
import { requireAdmin } from '../middlewares/auth.middleware';
import {
  verifyRegistrationSchema,
  checkInSchema,
} from '../schemas/verification.schema';
import { verificationService } from '../services/verification.service';
import { AppError } from '../services/team.service';

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
router.get(
  '/:registration_id',
  validateRequest(verifyRegistrationSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const registration_id = req.params.registration_id as string;
      const result = await verificationService.verifyRegistration(registration_id);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: unknown) {
      console.error('Error verifying registration:', error);
      const err = error as Error;
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        success: false,
        verified: false,
        error: err.message || 'Failed to verify registration.',
        details: err.message || String(error),
      });
    }
  }
);

/**
 * @openapi
 * /verification/check-in:
 *   post:
 *     summary: Check-in a user at the venue (Admin Only)
 *     tags: [Verification]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: User ID or QR Token
 *     responses:
 *       200:
 *         description: User checked in successfully
 *       403:
 *         description: Forbidden (Admin only)
 */
router.post(
  '/check-in',
  requireAdmin,
  validateRequest(checkInSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await verificationService.checkInUser(req.body.identifier);
      res.status(200).json({
        success: true,
        message: result.already_checked_in
          ? 'User was already checked in.'
          : 'User checked in successfully.',
        data: result,
      });
    } catch (error: unknown) {
      console.error('Error checking in user:', error);
      const err = error as Error;
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        success: false,
        error: err.message || 'Failed to check in user.',
        details: err.message || String(error),
      });
    }
  }
);

export default router;
