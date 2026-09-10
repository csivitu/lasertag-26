import { describe, expect, mock, test } from "bun:test";

import { UnauthorizedError } from "../errors";
import { makeAdminAuthService, type AdminAuthDeps } from "./adminAuth";

const admin = { id: "u1", name: "Admin User", email: "admin@example.com" };

function makeDeps(overrides: Partial<AdminAuthDeps> = {}): AdminAuthDeps {
  return {
    findRoleByEmail: mock(async () => "admin"),
    signIn: mock(async () => ({ user: admin, cookies: ["session=abc"] })),
    signOut: mock(async () => ({ cookies: [] })),
    ...overrides,
  };
}

describe("makeAdminAuthService.login", () => {
  test("signs in when the email belongs to an admin", async () => {
    const deps = makeDeps();
    const service = makeAdminAuthService(deps);

    const result = await service.login("admin@example.com", "correct-password");

    expect(deps.signIn).toHaveBeenCalledWith("admin@example.com", "correct-password");
    expect(result).toEqual({ user: admin, cookies: ["session=abc"] });
  });

  test("rejects with the same error whether the email is unknown or just not an admin", async () => {
    const unknown = makeAdminAuthService(makeDeps({ findRoleByEmail: mock(async () => null) }));
    const notAdmin = makeAdminAuthService(
      makeDeps({ findRoleByEmail: mock(async () => "user") }),
    );

    const [unknownError, notAdminError] = await Promise.all([
      unknown.login("nobody@example.com", "x").catch((e: unknown) => e),
      notAdmin.login("user@example.com", "x").catch((e: unknown) => e),
    ]);

    expect(unknownError).toBeInstanceOf(UnauthorizedError);
    expect(notAdminError).toBeInstanceOf(UnauthorizedError);
    expect((unknownError as UnauthorizedError).message).toBe(
      (notAdminError as UnauthorizedError).message,
    );
  });

  test("never calls signIn when the role check fails", async () => {
    const deps = makeDeps({ findRoleByEmail: mock(async () => "user") });
    const service = makeAdminAuthService(deps);

    await service.login("user@example.com", "x").catch(() => {});

    expect(deps.signIn).not.toHaveBeenCalled();
  });

  test("wraps a rejected sign-in as UnauthorizedError", async () => {
    const deps = makeDeps({
      signIn: mock(async () => {
        throw new Error("bad password");
      }),
    });
    const service = makeAdminAuthService(deps);

    await expect(service.login("admin@example.com", "wrong")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});

describe("makeAdminAuthService.logout", () => {
  test("wraps a rejected sign-out as UnauthorizedError", async () => {
    const deps = makeDeps({
      signOut: mock(async () => {
        throw new Error("no session");
      }),
    });
    const service = makeAdminAuthService(deps);

    await expect(service.logout(undefined)).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
