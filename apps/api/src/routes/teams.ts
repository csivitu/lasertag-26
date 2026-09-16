import { Router, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth";
import { HttpError as AppError } from "../errors";
import { validateRequest } from "../middlewares/validate";
import { asyncHandler } from "../middlewares/errorHandler";
import {
  createTeamSchema,
  getTeamByCodeSchema,
  joinTeamSchema,
  getTeamMembersSchema,
  inviteTeamSchema,
  convertToSoloSchema,
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
    let leaderId = req.body.leader_id;
    if (!leaderId) {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (session?.user?.id) {
        leaderId = session.user.id;
      }
    }

    if (!leaderId) {
      throw new AppError(400, "leader_id is required or user must be signed in.");
    }

    const newTeam = await teamController.createTeam({
      ...req.body,
      leader_id: leaderId,
    });
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
  asyncHandler(async (req: Request<{ team_id: string }>, res: Response): Promise<void> => {
    let userId = req.body.user_id;
    if (!userId) {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (session?.user?.id) {
        userId = session.user.id;
      }
    }

    if (!userId) {
      throw new AppError(400, "user_id is required or user must be signed in.");
    }

    const result = await teamController.joinTeam(
      req.params.team_id,
      userId,
      {
        fullName: req.body.fullName,
        regNo: req.body.regNo,
        phone: req.body.phone,
      }
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

publicTeamsRouter.post(
  "/:team_id/convert-to-solo",
  validateRequest(convertToSoloSchema),
  asyncHandler(async (req: Request<{ team_id: string }, unknown, { user_id?: string }>, res: Response): Promise<void> => {
    const sessionUserId =
      (req as unknown as { session?: { user?: { id?: string } } }).session?.user?.id ||
      (req as unknown as { user?: { id?: string } }).user?.id ||
      req.body?.user_id;

    const result = await teamController.convertTeamToSolo(
      req.params.team_id,
      sessionUserId
    );
    res.status(200).json({
      success: true,
      message: "Team converted to solo mode successfully.",
      data: result,
    });
  })
);
