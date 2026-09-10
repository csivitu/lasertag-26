import { Router } from "express";

import { listRegistrations } from "../controllers/registrations.controller";
import { validate } from "../middlewares/validate";
import { registrationQuerySchema } from "../validations/registration.validation";

export const registrationsRouter = Router();

registrationsRouter.get("/", validate(registrationQuerySchema), listRegistrations);
