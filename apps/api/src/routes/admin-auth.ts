import { Router } from "express";

import { auth } from "../auth";
import { userQueries } from "../data/queries";
import { loginSchema } from "../schemas/auth";
import { makeAdminAuthService, type AdminAuthDeps } from "../services/adminAuth";

/**
 * Not mounted under `/admin` — that whole subtree requires an existing admin
 * session (see routes/admin.ts), and logging in can't presuppose one.
 */
const credentialsAuth: AdminAuthDeps = {
  findRoleByEmail: userQueries.findRoleByEmail,

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

const adminAuthService = makeAdminAuthService(credentialsAuth);

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const { user, cookies } = await adminAuthService.login(email, password);
  cookies.forEach((cookie) => res.append("Set-Cookie", cookie));
  res.json({ message: "Admin login successful", user });
});

adminAuthRouter.post("/logout", async (req, res) => {
  const { cookies } = await adminAuthService.logout(req.headers.cookie);
  cookies.forEach((cookie) => res.append("Set-Cookie", cookie));
  res.json({ message: "Admin logout successful" });
});
