import { Router } from "express";
import { auth } from "../auth";

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags:
 *       - Authentication
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
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

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

        res.status(200).json({
            message: "Login successful",
            user: result.response.user,
        });
    } catch (error) {
        console.error("Login error:", error);

        res.status(401).json({
            message: "Invalid email or password",
        });
    }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout the current user
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Not authenticated
 */
router.post("/logout", async (req, res) => {
    try {
        const headers = new Headers();

        const cookie = req.headers.cookie;

        if (cookie) {
            headers.set("cookie", cookie);
        }

        const result = await auth.api.signOut({
            headers,
            returnHeaders: true,
        });

        const cookies = result.headers.getSetCookie();

        cookies.forEach((cookie) => {
            res.append("Set-Cookie", cookie);
        });

        res.status(200).json({
            message: "Logout successful",
        });
    } catch (error) {
        console.error("Logout error:", error);

        res.status(401).json({
            message: "Not authenticated",
        });
    }
});

export default router;