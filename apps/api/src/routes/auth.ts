import { Router } from "express";
import { login, logout } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { loginSchema } from "../validations/auth.validation";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);

export default router;