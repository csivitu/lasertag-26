import { auth } from "../auth";
import type { AuthDeps } from "../services/auth";

/**
 * The only module that adapts better-auth's `auth.api` to `AuthDeps`.
 *
 * Kept out of services/: importing `../auth` pulls in @lasertag-26/database,
 * which throws without DATABASE_URL, and the services need to stay
 * constructible from a plain object in tests. Same reasoning as
 * data/queries.ts, and the same reason `makeRequireAdmin` takes its
 * `getSession` as an argument.
 */
export const credentialQueries: AuthDeps = {
  signIn: async (email, password) => {
    const result = await auth.api.signInEmail({
      body: { email, password },
      returnHeaders: true,
    });
    return { user: result.response.user, cookies: result.headers.getSetCookie() };
  },

  signOut: async (cookie) => {
    const headers = new Headers();
    if (cookie) headers.set("cookie", cookie);
    const result = await auth.api.signOut({ headers, returnHeaders: true });
    return { cookies: result.headers.getSetCookie() };
  },
};
