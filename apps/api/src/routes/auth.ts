import { Router } from "express";

import { auth } from "../auth";
import { loginSchema } from "../schemas/auth";
import { makeAuthService, type AuthDeps } from "../services/auth";

/**
 * Adapts better-auth's `auth.api` to `AuthDeps`. Kept out of services/auth.ts:
 * importing `../auth` pulls in @lasertag-26/database, which throws without
 * DATABASE_URL, and the service needs to stay constructible from a plain
 * object in tests.
 */
const credentialsAuth: AuthDeps = {
  signIn: async (email, password) => {
    const result = await auth.api.signInEmail({ body: { email, password }, returnHeaders: true });
    return { user: result.response.user, cookies: result.headers.getSetCookie() };
  },

  signOut: async (cookie) => {
    const headers = new Headers();
    if (cookie) headers.set("cookie", cookie);
    const result = await auth.api.signOut({ headers, returnHeaders: true });
    return { cookies: result.headers.getSetCookie() };
  },
};

const authService = makeAuthService(credentialsAuth);

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const { user, cookies } = await authService.login(email, password);
  cookies.forEach((cookie) => res.append("Set-Cookie", cookie));
  res.json({ message: "Login successful", user });
});

authRouter.post("/logout", async (req, res) => {
  const { cookies } = await authService.logout(req.headers.cookie);
  cookies.forEach((cookie) => res.append("Set-Cookie", cookie));
  res.json({ message: "Logout successful" });
});
