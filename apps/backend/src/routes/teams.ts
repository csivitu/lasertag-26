import { Router, Request, Response } from 'express';
import { validateRequest } from '../middlewares/validate';
import {
  createTeamSchema,
  getTeamByCodeSchema,
  joinTeamSchema,
  getTeamMembersSchema,
  inviteTeamSchema,
} from '../schemas/team.schema';
import { teamService, AppError } from '../services/team.service';

const router = Router();

/**
 * @openapi
 * /teams:
 *   post:
 *     summary: Create a new team
 *     tags: [Teams]
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
router.post(
  '/',
  validateRequest(createTeamSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const newTeam = await teamService.createTeam(req.body);
      res.status(201).json({
        success: true,
        message: 'Team created successfully.',
        data: newTeam,
      });
    } catch (error: unknown) {
      console.error('Error creating team:', error);
      const err = error as Error;
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        success: false,
        error: err.message || 'Failed to create team.',
        details: err.message || String(error),
      });
    }
  }
);

/**
 * @openapi
 * /teams/code/{code}:
 *   get:
 *     summary: Get team details by code
 *     tags: [Teams]
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
router.get(
  '/code/:code',
  validateRequest(getTeamByCodeSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const teamData = await teamService.getTeamByCode(req.params.code as string);
      res.status(200).json({
        success: true,
        data: teamData,
      });
    } catch (error: unknown) {
      console.error('Error fetching team by code:', error);
      const err = error as Error;
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        success: false,
        error: err.message || 'Failed to fetch team details.',
        details: err.message || String(error),
      });
    }
  }
);

/**
 * @openapi
 * /teams/{team_id}/join:
 *   post:
 *     summary: Join a team
 *     tags: [Teams]
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
router.post(
  '/:team_id/join',
  validateRequest(joinTeamSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await teamService.joinTeam(req.params.team_id as string, req.body.user_id);
      res.status(200).json({
        success: true,
        message: 'Joined team successfully.',
        data: result,
      });
    } catch (error: unknown) {
      console.error('Error joining team:', error);
      const err = error as Error;
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        success: false,
        error: err.message || 'Failed to join team.',
        details: err.message || String(error),
      });
    }
  }
);

/**
 * @openapi
 * /teams/{team_id}/members:
 *   get:
 *     summary: Get all members of a team
 *     tags: [Teams]
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
router.get(
  '/:team_id/members',
  validateRequest(getTeamMembersSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await teamService.getTeamMembers(req.params.team_id as string);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      console.error('Error fetching team members:', error);
      const err = error as Error;
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        success: false,
        error: err.message || 'Failed to fetch team members.',
        details: err.message || String(error),
      });
    }
  }
);

/**
 * @openapi
 * /teams/{team_id}/invite:
 *   post:
 *     summary: Generate invite link for a team
 *     tags: [Teams]
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
router.post(
  '/:team_id/invite',
  validateRequest(inviteTeamSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await teamService.generateInvite(req.params.team_id as string);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      console.error('Error generating team invite:', error);
      const err = error as Error;
      const status = error instanceof AppError ? error.statusCode : 500;
      res.status(status).json({
        success: false,
        error: err.message || 'Failed to generate team invite.',
        details: err.message || String(error),
      });
    }
  }
);

export default router;
