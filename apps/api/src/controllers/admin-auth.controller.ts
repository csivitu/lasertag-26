import type { Request, Response } from "express";

import { credentialQueries } from "../data/credentials";
import { userQueries } from "../data/queries";
import { env } from "../env";
import { UnauthorizedError } from "../errors";
import { makeAdminAuthService } from "../services/adminAuth";

const adminAuth = makeAdminAuthService({ ...credentialQueries, ...userQueries });

export const adminLogin = async (req: Request, res: Response) => {
  const { password } = req.body;
  // Password-only login: the password itself selects the account.
  // Emails stay server-side (seeded from env) — staff never see them.
  const email =
    password === env.SUPER_ADMIN_PASSWORD
      ? env.SUPER_ADMIN_EMAIL
      : password === env.ADMIN_PASSWORD
        ? env.ADMIN_EMAIL
        : null;
  if (!email) throw new UnauthorizedError("Invalid password");
  const { user, cookies } = await adminAuth.login(email, password);
  cookies.forEach((cookie) => res.append("Set-Cookie", cookie));
  res.json({ message: "Admin login successful", user });
};

export const adminMe = async (req: Request, res: Response) => {
  res.json({ user: req.user });
};

export const adminLogout = async (req: Request, res: Response) => {
  const { cookies } = await adminAuth.logout(req.headers.cookie);
  cookies.forEach((cookie) => res.append("Set-Cookie", cookie));
  res.json({ message: "Admin logout successful" });
};
