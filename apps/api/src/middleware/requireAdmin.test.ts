import { describe, expect, mock, test } from "bun:test";
import type { Request, Response } from "express";

import { ForbiddenError, UnauthorizedError } from "../errors";
import { makeRequireAdmin } from "./requireAdmin";

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
});
