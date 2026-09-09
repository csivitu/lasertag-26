import { Router } from "express";

import { getTeamDetail } from "../controllers/admin-teams.controller";
import { validate } from "../middlewares/validate";
import { teamIdSchema } from "../validations/team.validation";

export const adminTeamsRouter = Router();

adminTeamsRouter.get("/:team_id", validate(teamIdSchema), getTeamDetail);
