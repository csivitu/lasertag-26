import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { users } from "@lasertag/database/schema";
import { requireAuth } from "../../middleware/auth";

const router = Router();

// GET /users/me/profile
// Protected: any authenticated user (including admins) can access their own profile
router.get("/me/profile", requireAuth, async (req, res) => {
    try {
        const session = res.locals.session;

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, session.user.email));

        if (!user) {
            res.status(404).json({ error: "User profile not found" });
            return;
        }

        res.status(200).json({ user });
    } catch (err) {
        console.error("GET /users/me/profile error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
