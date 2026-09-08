import { Router } from "express";

import { getTeamDetail } from "../controllers/teams.controller";
import { validate } from "../middleware/validate";
import { teamIdSchema } from "../validations/team.validation";

export const teamsRouter = Router();

teamsRouter.get("/:team_id", validate(teamIdSchema), getTeamDetail);
