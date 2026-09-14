import { createAuthClient } from "better-auth/react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
});

export const { useSession, signIn, signUp, signOut } = authClient;
export { apiBaseUrl };
