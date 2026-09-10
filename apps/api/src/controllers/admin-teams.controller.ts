import type { Request, Response } from "express";

import { teamQueries } from "../data/queries";
import { makeTeamsService } from "../services/teams";

const teams = makeTeamsService(teamQueries);

export const getTeamDetail = async (
  req: Request<{ team_id: string }>,
  res: Response,
) => {
  res.json(await teams.getDetail(req.params.team_id));
};
