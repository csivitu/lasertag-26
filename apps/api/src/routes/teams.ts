import { Router } from "express";

import { teamQueries } from "../data/queries";
import { teamIdParamsSchema } from "../schemas/common";
import { makeTeamsService } from "../services/teams";

const teams = makeTeamsService(teamQueries);

export const teamsRouter = Router();

teamsRouter.get("/:team_id", async (req, res) => {
  const { team_id } = teamIdParamsSchema.parse(req.params);
  res.json(await teams.getDetail(team_id));
});
