/**
 * @swagger
 * /slots:
 *   get:
 *     summary: Query available slots
 *     tags:
 *       - Slots
 *     responses:
 *       200:
 *         description: List of all slots
 */

/**
 * @swagger
 * /slots:
 *   post:
 *     summary: Create a new slot (Admin Only)
 *     tags:
 *       - Slots
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

/**
 * @swagger
 * /slots/{slot_id}:
 *   delete:
 *     summary: Delete a slot (Admin Only)
 *     tags:
 *       - Slots
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

/**
 * @swagger
 * /slots/{slot_id}/reserve:
 *   post:
 *     summary: Reserve a slot
 *     tags:
 *       - Slots
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
