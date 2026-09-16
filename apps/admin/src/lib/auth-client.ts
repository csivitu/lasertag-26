import { createAuthClient } from "better-auth/react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
});

export const { useSession, signIn, signOut } = authClient;
export { apiBaseUrl };
