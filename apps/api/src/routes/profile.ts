import { Router, Request, Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler";
import { profileController } from "../controllers/profile.controller";

export const profileRouter = Router();

profileRouter.get(
  "/solo",
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const data = await profileController.getSoloProfile();
    res.status(200).json({ success: true, data });
  })
);

profileRouter.get(
  "/team",
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const data = await profileController.getTeamProfile();
    res.status(200).json({ success: true, data });
  })
);

export default profileRouter;
