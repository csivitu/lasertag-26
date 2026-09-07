import { Router } from "express";

import { registrationQueries } from "../data/queries";
import { registrationQuerySchema } from "../schemas/registrations";
import { makeRegistrationsService } from "../services/registrations";

const registrations = makeRegistrationsService(registrationQueries);

export const registrationsRouter = Router();

registrationsRouter.get("/", async (req, res) => {
  const filters = registrationQuerySchema.parse(req.query);
  res.json(await registrations.list(filters));
});
