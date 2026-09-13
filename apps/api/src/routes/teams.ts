import { Router, Request, Response } from "express";
import { validateRequest } from "../middlewares/validate";
import { asyncHandler } from "../middlewares/errorHandler";
import {
  createTeamSchema,
  getTeamByCodeSchema,
  joinTeamSchema,
  getTeamMembersSchema,
  inviteTeamSchema,
} from "../validations/team.validation";
import { teamController } from "../controllers/team.controller";

export const publicTeamsRouter = Router();

publicTeamsRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const teamsList = await teamController.getAllTeams();
    res.status(200).json({
      success: true,
      data: teamsList,
    });
  })
);

publicTeamsRouter.post(
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

publicTeamsRouter.get(
  "/code/:code",
  validateRequest(getTeamByCodeSchema),
  asyncHandler(async (req: Request<{ code: string }>, res: Response): Promise<void> => {
    const teamData = await teamController.getTeamByCode(req.params.code);
    res.status(200).json({
      success: true,
      data: teamData,
    });
  })
);

publicTeamsRouter.post(
  "/:team_id/join",
  validateRequest(joinTeamSchema),
  asyncHandler(async (req: Request<{ team_id: string }, unknown, { user_id: string }>, res: Response): Promise<void> => {
    const result = await teamController.joinTeam(
      req.params.team_id,
      req.body.user_id
    );
    res.status(200).json({
      success: true,
      message: "Joined team successfully.",
      data: result,
    });
  })
);

publicTeamsRouter.get(
  "/:team_id/members",
  validateRequest(getTeamMembersSchema),
  asyncHandler(async (req: Request<{ team_id: string }>, res: Response): Promise<void> => {
    const result = await teamController.getTeamMembers(req.params.team_id);
    res.status(200).json({
      success: true,
      data: result,
    });
  })
);

publicTeamsRouter.post(
  "/:team_id/invite",
  validateRequest(inviteTeamSchema),
  asyncHandler(async (req: Request<{ team_id: string }>, res: Response): Promise<void> => {
    const result = await teamController.generateInvite(req.params.team_id);
    res.status(200).json({
      success: true,
      data: result,
    });
  })
);

