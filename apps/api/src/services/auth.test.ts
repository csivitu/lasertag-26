import { describe, expect, mock, test } from "bun:test";

import { UnauthorizedError } from "../errors";
import { makeAuthService, type AuthDeps } from "./auth";

const user = { id: "u1", name: "Alicia Rao", email: "alicia@example.com" };

describe("makeAuthService.login", () => {
  test("returns the user and cookies on success", async () => {
    const signIn = mock(async () => ({ user, cookies: ["session=abc"] }));
    const deps: AuthDeps = { signIn, signOut: mock(async () => ({ cookies: [] })) };
    const service = makeAuthService(deps);

    const result = await service.login("alicia@example.com", "correct-password");

    expect(signIn).toHaveBeenCalledWith("alicia@example.com", "correct-password");
    expect(result).toEqual({ user, cookies: ["session=abc"] });
  });

  test("wraps a rejected sign-in as UnauthorizedError", async () => {
    const signIn = mock(async () => {
      throw new Error("invalid credentials");
    });
    const deps: AuthDeps = { signIn, signOut: mock(async () => ({ cookies: [] })) };
    const service = makeAuthService(deps);

    await expect(service.login("alicia@example.com", "wrong")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});

describe("makeAuthService.logout", () => {
  test("returns the cookies on success", async () => {
    const signOut = mock(async () => ({ cookies: ["session=; Max-Age=0"] }));
    const deps: AuthDeps = { signIn: mock(async () => ({ user, cookies: [] })), signOut };
    const service = makeAuthService(deps);

    const result = await service.logout("session=abc");

    expect(signOut).toHaveBeenCalledWith("session=abc");
    expect(result).toEqual({ cookies: ["session=; Max-Age=0"] });
  });

  test("wraps a rejected sign-out as UnauthorizedError", async () => {
    const signOut = mock(async () => {
      throw new Error("no session");
    });
    const deps: AuthDeps = { signIn: mock(async () => ({ user, cookies: [] })), signOut };
    const service = makeAuthService(deps);

    await expect(service.logout(undefined)).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
