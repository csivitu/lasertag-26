import { Router, Request, Response } from "express";
import { validateRequest } from "../middlewares/validate";
import { asyncHandler } from "../middlewares/errorHandler";
import {
  createTeamSchema,
  getTeamByCodeSchema,
  joinTeamSchema,
  getTeamMembersSchema,
  inviteTeamSchema,
} from "../schemas/team.schema";
import { teamController } from "../controllers/team.controller";

const router = Router();

router.post(
  "/",
  validateRequest(createTeamSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const newTeam = await teamController.createTeam(req.body);
    res.status(201).json({
      success: true,
      message: "Team created successfully.",
      data: newTeam,
    });
  })
);

router.get(
  "/code/:code",
  validateRequest(getTeamByCodeSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const teamData = await teamController.getTeamByCode(req.params.code as string);
    res.status(200).json({
      success: true,
      data: teamData,
    });
  })
);

router.post(
  "/:team_id/join",
  validateRequest(joinTeamSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await teamController.joinTeam(
      req.params.team_id as string,
      req.body.user_id
    );
    res.status(200).json({
      success: true,
      message: "Joined team successfully.",
      data: result,
    });
  })
);

router.get(
  "/:team_id/members",
  validateRequest(getTeamMembersSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await teamController.getTeamMembers(req.params.team_id as string);
    res.status(200).json({
      success: true,
      data: result,
    });
  })
);

router.post(
  "/:team_id/invite",
  validateRequest(inviteTeamSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await teamController.generateInvite(req.params.team_id as string);
    res.status(200).json({
      success: true,
      data: result,
    });
  })
);

export default router;
