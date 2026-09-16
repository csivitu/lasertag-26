import { Router } from "express";

import { adminLogin, adminLogout, adminMe } from "../controllers/admin-auth.controller";
import { requireAdmin } from "../middlewares/auth.middleware";
import { loginRateLimit } from "../middlewares/rateLimit";
import { validate } from "../middlewares/validate";
import { adminLoginSchema } from "../validations/auth.validation";

/**
 * Not mounted under `/admin` — that whole subtree requires an existing admin
 * session (see routes/admin.ts), and logging in can't presuppose one.
 */
export const adminAuthRouter = Router();

adminAuthRouter.post("/login", loginRateLimit, validate(adminLoginSchema), adminLogin);
adminAuthRouter.post("/logout", adminLogout);
adminAuthRouter.get("/me", requireAdmin, adminMe);
