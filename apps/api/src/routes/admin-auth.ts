import { Router } from "express";
import { adminLogin, adminLogout } from "../controllers/admin-auth.controller";
import { validate } from "../middleware/validate";
import { loginSchema } from "../validations/auth.validation";

const router = Router();

router.post("/login", validate(loginSchema), adminLogin);
router.post("/logout", adminLogout);

export default router;