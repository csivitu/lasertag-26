import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { users } from "@lasertag/database/schema";
import { requireAdmin } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { adminCheckinSchema } from "../../schemas";

const router = Router();

// POST /admin/checkin/scan
// Protected: admin only
// Body: { qrToken }
router.post("/checkin/scan", requireAdmin, validateBody(adminCheckinSchema), async (req, res) => {
    try {
        const { qrToken } = req.body;

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.qrToken, qrToken));

        if (!user) {
            res.status(404).json({ error: "No user found with that QR token" });
            return;
        }

        if (user.isCheckedIn) {
            res.status(409).json({ error: "User already checked in", user });
            return;
        }

        const [updated] = await db
            .update(users)
            .set({
                isCheckedIn: true,
                checkedInAt: new Date(),
            })
            .where(eq(users.qrToken, qrToken))
            .returning();

        res.status(200).json({ message: "Check-in successful", user: updated });
    } catch (err) {
        console.error("POST /admin/checkin/scan error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
