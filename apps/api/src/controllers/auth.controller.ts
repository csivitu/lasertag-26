import type { Request, Response } from "express";

import { credentialQueries } from "../data/credentials";
import { makeAuthService } from "../services/auth";

const auth = makeAuthService(credentialQueries);

// Handlers stay `async` with no try/catch: Express 5 forwards rejections to
// the error middleware, which is the only place errors become responses.

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, cookies } = await auth.login(email, password);
  cookies.forEach((cookie) => res.append("Set-Cookie", cookie));
  res.json({ message: "Login successful", user });
};

export const logout = async (req: Request, res: Response) => {
  const { cookies } = await auth.logout(req.headers.cookie);
  cookies.forEach((cookie) => res.append("Set-Cookie", cookie));
  res.json({ message: "Logout successful" });
};
