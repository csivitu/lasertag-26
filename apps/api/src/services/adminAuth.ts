import { UnauthorizedError } from "../errors";
import type { AuthDeps } from "./auth";

/** The user lookup admin login needs, split out so data/queries.ts can be typed against it. */
export interface UserDeps {
  findRoleByEmail(email: string): Promise<string | null>;
}

export interface AdminAuthDeps extends AuthDeps, UserDeps {}

export function makeAdminAuthService(deps: AdminAuthDeps) {
  return {
    /** @throws UnauthorizedError */
    async login(email: string, password: string) {
      const role = await deps.findRoleByEmail(email);

      // Same error, same status, whether the email doesn't exist or exists
      // but isn't an admin — a 401-vs-403 split would tell a prober which
      // case they hit.
      if (role !== "admin") {
        throw new UnauthorizedError("Invalid email or password");
      }

      try {
        return await deps.signIn(email, password);
      } catch {
        throw new UnauthorizedError("Invalid email or password");
      }
    },

    /** @throws UnauthorizedError */
    async logout(cookie: string | undefined) {
      try {
        return await deps.signOut(cookie);
      } catch {
        throw new UnauthorizedError("Not authenticated");
      }
    },
  };
}

export type AdminAuthService = ReturnType<typeof makeAdminAuthService>;
