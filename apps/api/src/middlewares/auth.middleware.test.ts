import { describe, expect, mock, test } from "bun:test";
import type { Request, Response } from "express";

import { ForbiddenError, UnauthorizedError } from "../errors";
import { makeRequireAdmin, makeRequireSuperAdmin } from "./auth.middleware";

function fakeReqRes() {
  const req = { headers: {} } as Request;
  const res = { locals: {} } as Response;
  const next = mock(() => {});
  return { req, res, next };
}

describe("requireAdmin", () => {
  test("throws UnauthorizedError when there is no session", async () => {
    const middleware = makeRequireAdmin(async () => null);
    const { req, res, next } = fakeReqRes();

    await expect(middleware(req, res, next)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(next).not.toHaveBeenCalled();
  });

  test("throws ForbiddenError when the session's user is not an admin", async () => {
    const middleware = makeRequireAdmin(async () => ({ user: { id: "u1", role: "user" } }));
    const { req, res, next } = fakeReqRes();

    await expect(middleware(req, res, next)).rejects.toBeInstanceOf(ForbiddenError);
    expect(next).not.toHaveBeenCalled();
  });

  test("calls next() with no argument when the user is an admin", async () => {
    const middleware = makeRequireAdmin(async () => ({ user: { id: "u1", role: "admin" } }));
    const { req, res, next } = fakeReqRes();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(res.locals.user).toEqual({ id: "u1", role: "admin" });
  });

  test("calls next() when the user is a super_admin", async () => {
    const middleware = makeRequireAdmin(async () => ({ user: { id: "u9", role: "super_admin" } }));
    const { req, res, next } = fakeReqRes();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("requireSuperAdmin", () => {
  test("throws ForbiddenError for a plain admin", async () => {
    const middleware = makeRequireSuperAdmin(async () => ({ user: { id: "u1", role: "admin" } }));
    const { req, res, next } = fakeReqRes();

    await expect(middleware(req, res, next)).rejects.toBeInstanceOf(ForbiddenError);
    expect(next).not.toHaveBeenCalled();
  });

  test("calls next() for a super_admin", async () => {
    const middleware = makeRequireSuperAdmin(async () => ({ user: { id: "u9", role: "super_admin" } }));
    const { req, res, next } = fakeReqRes();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("header-based identity is not accepted", () => {
  // Regression guard for the previous implementation, which read the caller's
  // id straight out of `x-user-id` / `Authorization: Bearer <user_id>` and
  // trusted any id that existed in the database. A user id is a primary key,
  // not a secret — and the unauthenticated team endpoints return them — so
  // anyone holding an admin's id could assume that admin's identity.
  const forgedHeaders = [
    { "x-user-id": "some-admin-id" },
    { authorization: "Bearer some-admin-id" },
  ];

  for (const headers of forgedHeaders) {
    const [name] = Object.keys(headers);

    test(`rejects a forged ${name} when the session cookie says otherwise`, async () => {
      // getSession is what decides identity now; no session means no access,
      // regardless of what the client asserts in headers.
      const middleware = makeRequireAdmin(async () => null);
      const req = { headers } as unknown as Request;
      const res = { locals: {} } as Response;
      const next = mock(() => {});

      await expect(middleware(req, res, next)).rejects.toBeInstanceOf(UnauthorizedError);
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  }

  test("takes the role from the verified session, not from the request", async () => {
    const middleware = makeRequireAdmin(async () => ({
      user: { id: "u1", role: "user" },
    }));
    const req = {
      headers: { "x-user-id": "some-admin-id" },
      user: { id: "spoofed", role: "admin" },
    } as unknown as Request;
    const res = { locals: {} } as Response;
    const next = mock(() => {});

    await expect(middleware(req, res, next)).rejects.toBeInstanceOf(ForbiddenError);
    expect(next).not.toHaveBeenCalled();
  });
});
