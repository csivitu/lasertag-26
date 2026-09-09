import type { Request, Response } from "express";

import { registrationQueries } from "../data/queries";
import { makeRegistrationsService } from "../services/registrations";

const registrations = makeRegistrationsService(registrationQueries);

export const listRegistrations = async (req: Request, res: Response) => {
  res.json(await registrations.list(req.query));
};
