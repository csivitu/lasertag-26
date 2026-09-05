import { Router, Request, Response } from 'express';
import { db } from '../../../../packages/database';
import { teams, teamMembers, users } from '../../../../packages/database/schema';
import { eq, and } from 'drizzle-orm';

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
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { leader_id, team_code, members } = req.body;

    if (!leader_id || !team_code) {
      res.status(400).json({
        success: false,
        error: 'leader_id and team_code are required fields.',
      });
      return;
    }

    const leaderExists = await db
      .select()
      .from(users)
      .where(eq(users.id, leader_id as string));

    if (leaderExists.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Leader user not found.',
      });
      return;
    }

    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, team_code as string));

    if (existingTeam.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Team code already exists.',
      });
      return;
    }

    const [newTeam] = await db
      .insert(teams)
      .values({
        teamCode: team_code as string,
        leaderId: leader_id as string,
        members: members || 1,
      })
      .returning();

    await db.insert(teamMembers).values({
      teamCode: team_code as string,
      userId: leader_id as string,
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully.',
      data: newTeam,
    });
  } catch (error: unknown) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create team.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

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
router.get('/code/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.params.code as string;

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, code));

    if (!team) {
      res.status(404).json({
        success: false,
        error: 'Team not found.',
      });
      return;
    }

    const [leader] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phNumber: users.phNumber,
      })
      .from(users)
      .where(eq(users.id, team.leaderId));

    res.status(200).json({
      success: true,
      data: {
        ...team,
        leader,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching team by code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team details.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

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
router.post('/:team_id/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const team_id = req.params.team_id as string;
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({
        success: false,
        error: 'user_id is required to join a team.',
      });
      return;
    }

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, team_id));

    if (!team) {
      res.status(404).json({
        success: false,
        error: 'Team not found.',
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

    const existingMembership = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamCode, team_id),
          eq(teamMembers.userId, user_id as string)
        )
      );

    if (existingMembership.length > 0) {
      res.status(400).json({
        success: false,
        error: 'User is already a member of this team.',
      });
      return;
    }

    await db.insert(teamMembers).values({
      teamCode: team_id,
      userId: user_id as string,
    });

    const [updatedTeam] = await db
      .update(teams)
      .set({ members: team.members + 1 })
      .where(eq(teams.teamCode, team_id))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Joined team successfully.',
      data: {
        team: updatedTeam,
        joined_user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Error joining team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join team.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

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
router.get('/:team_id/members', async (req: Request, res: Response): Promise<void> => {
  try {
    const team_id = req.params.team_id as string;

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, team_id));

    if (!team) {
      res.status(404).json({
        success: false,
        error: 'Team not found.',
      });
      return;
    }

    const membersList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phNumber: users.phNumber,
        isCheckedIn: users.isCheckedIn,
        paid: users.paid,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamCode, team_id));

    res.status(200).json({
      success: true,
      data: {
        team_code: team.teamCode,
        total_members: membersList.length,
        members: membersList,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching team members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team members.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

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
router.post('/:team_id/invite', async (req: Request, res: Response): Promise<void> => {
  try {
    const team_id = req.params.team_id as string;

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.teamCode, team_id));

    if (!team) {
      res.status(404).json({
        success: false,
        error: 'Team not found.',
      });
      return;
    }

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/join?team_code=${encodeURIComponent(team.teamCode)}`;

    res.status(200).json({
      success: true,
      data: {
        team_code: team.teamCode,
        invite_code: team.teamCode,
        invite_url: inviteUrl,
      },
    });
  } catch (error: unknown) {
    console.error('Error generating team invite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate team invite.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
