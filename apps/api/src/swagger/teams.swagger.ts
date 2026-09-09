/**
 * @swagger
 * /teams:
 *   post:
 *     summary: Create a new team
 *     tags:
 *       - Teams
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leader_id, team_code]
 *             properties:
 *               leader_id:
 *                 type: string
 *               team_code:
 *                 type: string
 *               members:
 *                 type: number
 *     responses:
 *       201:
 *         description: Team created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /teams/code/{code}:
 *   get:
 *     summary: Get team details by code
 *     tags:
 *       - Teams
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team details
 *       404:
 *         description: Team not found
 */

/**
 * @swagger
 * /teams/{team_id}/join:
 *   post:
 *     summary: Join a team
 *     tags:
 *       - Teams
 *     parameters:
 *       - in: path
 *         name: team_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Joined team successfully
 */

/**
 * @swagger
 * /teams/{team_id}/members:
 *   get:
 *     summary: Get all members of a team
 *     tags:
 *       - Teams
 *     parameters:
 *       - in: path
 *         name: team_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of team members
 */

/**
 * @swagger
 * /teams/{team_id}/invite:
 *   post:
 *     summary: Generate invite link for a team
 *     tags:
 *       - Teams
 *     parameters:
 *       - in: path
 *         name: team_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team invite details
 */
