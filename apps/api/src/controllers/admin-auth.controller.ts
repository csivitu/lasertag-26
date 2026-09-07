import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { auth } from "../auth";
import { db, user } from "@lasertag-26/database";

export const adminLogin = async (req: Request, res: Response) => {
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

        const { ...userData } = result.response.user;

        return res.status(200).json({
            message: "Admin login successful",
            user: userData,
        });
    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(401).json({
            message: "Invalid email or password",
        });
    }
};

export const adminLogout = async (req: Request, res: Response) => {
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
};
