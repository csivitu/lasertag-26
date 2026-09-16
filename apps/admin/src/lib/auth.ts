export type StaffRole = "admin" | "super_admin";

let cachedRole: StaffRole | null | undefined;

export async function getStaffRole(): Promise<StaffRole | null> {
  if (cachedRole !== undefined) return cachedRole;
  const res = await import("./api-client").then((m) =>
    m.apiFetch<{ user?: { role?: string } }>("/admin-auth/me"),
  );
  const role = res.data?.user?.role;
  cachedRole = role === "super_admin" || role === "admin" ? role : null;
  return cachedRole;
}

export const isSuperAdmin = (role: StaffRole | null) => role === "super_admin";

export function clearStaffRole() {
  cachedRole = undefined;
}
