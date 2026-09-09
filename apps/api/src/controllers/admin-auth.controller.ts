import type { Request, Response } from "express";

import { credentialQueries } from "../data/credentials";
import { userQueries } from "../data/queries";
import { makeAdminAuthService } from "../services/adminAuth";

const adminAuth = makeAdminAuthService({ ...credentialQueries, ...userQueries });

export const adminLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, cookies } = await adminAuth.login(email, password);
  cookies.forEach((cookie) => res.append("Set-Cookie", cookie));
  res.json({ message: "Admin login successful", user });
};

export const adminLogout = async (req: Request, res: Response) => {
  const { cookies } = await adminAuth.logout(req.headers.cookie);
  cookies.forEach((cookie) => res.append("Set-Cookie", cookie));
  res.json({ message: "Admin logout successful" });
};
