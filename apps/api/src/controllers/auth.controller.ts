import type { Request, Response } from "express";
import { auth } from "../auth";

export const login = async (req: Request, res: Response) => {
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

        const { ...userData } = result.response.user;

        res.status(200).json({
            message: "Login successful",
            user: userData,
        });
    } catch (error) {
        console.error("Login error:", error);

        res.status(401).json({
            message: "Invalid email or password",
        });
    }
};

export const logout = async (req: Request, res: Response) => {
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
};
