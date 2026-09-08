/**
 * @swagger
 * /admin/payments/verify:
 *   post:
 *     summary: Verify payments using a payment CSV
 *     tags:
 *       - Admin Payments
 *     description: Cross-references payment records from a CSV with registrations in the database.
 *     responses:
 *       200:
 *         description: Payment verification completed successfully
 *       400:
 *         description: Invalid CSV or request
 */

/**
 * @swagger
 * /admin/payments/{registration_id}:
 *   get:
 *     summary: Get payment details
 *     tags:
 *       - Admin Payments
 *     parameters:
 *       - in: path
 *         name: registration_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking registration ID
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 */

/**
 * @swagger
 * /admin/payments/{registration_id}:
 *   patch:
 *     summary: Update payment status
 *     tags:
 *       - Admin Payments
 *     parameters:
 *       - in: path
 *         name: registration_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking registration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paid
 *             properties:
 *               paid:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Registration not found
 */
