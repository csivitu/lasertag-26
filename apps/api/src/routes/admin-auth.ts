import { Router } from "express";

import { adminLogin, adminLogout } from "../controllers/admin-auth.controller";
import { validate } from "../middleware/validate";
import { loginSchema } from "../validations/auth.validation";

/**
 * Not mounted under `/admin` — that whole subtree requires an existing admin
 * session (see routes/admin.ts), and logging in can't presuppose one.
 */
export const adminAuthRouter = Router();

adminAuthRouter.post("/login", validate(loginSchema), adminLogin);
adminAuthRouter.post("/logout", adminLogout);
