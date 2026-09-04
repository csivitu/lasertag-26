import { Router } from "express";
import { eq } from "drizzle-orm";
import { auth } from "../auth";
import { db, user } from "@lasertag-26/database";

const router = Router();

/**
 * @swagger
 * /admin/auth/login:
 *   post:
 *     summary: Login an admin
 *     tags:
 *       - Admin Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin login successful
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Admin access required
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        // Check whether this email belongs to an admin
        const adminUser = await db
            .select({
                id: user.id,
                role: user.role,
            })
            .from(user)
            .where(eq(user.email, email))
            .limit(1);

        // Don't reveal whether the email exists
        if (adminUser.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        if (adminUser[0].role !== "admin") {
            return res.status(403).json({
                message: "Admin access required",
            });
        }

        // Let Better Auth verify the password and create the session
        const result = await auth.api.signInEmail({
            body: {
                email,
                password,
            },
            returnHeaders: true,
        });

        const cookies = result.headers.getSetCookie();

        cookies.forEach((cookie) => {
            res.append("Set-Cookie", cookie);
        });

        return res.status(200).json({
            message: "Admin login successful",
            user: result.response.user,
        });
    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(401).json({
            message: "Invalid email or password",
        });
    }
});

/**
 * @swagger
 * /admin/auth/logout:
 *   post:
 *     summary: Logout the current admin
 *     tags:
 *       - Admin Authentication
 *     responses:
 *       200:
 *         description: Admin logout successful
 *       401:
 *         description: Not authenticated
 */
router.post("/logout", async (req, res) => {
    try {
        const headers = new Headers();

        if (req.headers.cookie) {
            headers.set("cookie", req.headers.cookie);
        }

        const result = await auth.api.signOut({
            headers,
            returnHeaders: true,
        });

        const cookies = result.headers.getSetCookie();

        cookies.forEach((cookie) => {
            res.append("Set-Cookie", cookie);
        });

        return res.status(200).json({
            message: "Admin logout successful",
        });
    } catch (error) {
        console.error("Admin logout error:", error);

        return res.status(401).json({
            message: "Not authenticated",
        });
    }
});

export default router;