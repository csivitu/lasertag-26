import { UnauthorizedError } from "../errors";

export type SessionUser = { id: string; name: string; email: string; [key: string]: unknown };

/** Everything this service needs from better-auth, and nothing more. */
export interface AuthDeps {
  signIn(email: string, password: string): Promise<{ user: SessionUser; cookies: string[] }>;
  signOut(cookie: string | undefined): Promise<{ cookies: string[] }>;
}

export function makeAuthService(deps: AuthDeps) {
  return {
    /** @throws UnauthorizedError */
    async login(email: string, password: string) {
      try {
        return await deps.signIn(email, password);
      } catch {
        // better-auth's own rejection reason (wrong password vs unknown email)
        // isn't surfaced — same message either way, so a probe can't use it
        // to enumerate registered emails.
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

export type AuthService = ReturnType<typeof makeAuthService>;
