import { Router } from "express";

import { login, logout } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { loginSchema } from "../validations/auth.validation";

export const authRouter = Router();

authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/logout", logout);
