export type StaffRole = "admin" | "super_admin";

/**
 * Always reads the live session — no module-level cache. The cached version
 * caused "logged in but bounced to /login" states after expiry or logout in
 * another tab. One extra /me call per mount is cheap and always correct.
 */
export async function getStaffRole(): Promise<StaffRole | null> {
  const res = await import("./api-client").then((m) =>
    m.apiFetch<{ user?: { role?: string } }>("/admin-auth/me"),
  );
  const role = res.data?.user?.role;
  return role === "super_admin" || role === "admin" ? role : null;
}

export const isSuperAdmin = (role: StaffRole | null) => role === "super_admin";

/** Kept for call-site compatibility; session state is no longer cached. */
export function clearStaffRole() {}
