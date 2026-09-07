/**
 * @swagger
 * /admin/auth/login:
 *   post:
 *     summary: Login an admin
 *     tags:
 *       - Admin Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin login successful
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Admin access required
 */

/**
 * @swagger
 * /admin/auth/logout:
 *   post:
 *     summary: Logout the current admin
 *     tags:
 *       - Admin Authentication
 *     responses:
 *       200:
 *         description: Admin logout successful
 *       401:
 *         description: Not authenticated
 */
