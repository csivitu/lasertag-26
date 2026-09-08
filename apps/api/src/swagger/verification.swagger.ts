/**
 * @swagger
 * /verification/{registration_id}:
 *   get:
 *     summary: Verify ticket registration or user by ID
 *     tags:
 *       - Verification
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
 *         description: Not found
 */

/**
 * @swagger
 * /verification/check-in:
 *   post:
 *     summary: Perform venue check-in for a user (Admin Only)
 *     tags:
 *       - Verification
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
 *         description: Check-in completed successfully
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: User not found
 */
