import { describe, expect, mock, test } from "bun:test";
import type { Request, Response } from "express";

import { bookingRateLimit } from "./rateLimit";

function fakeReq(ip: string) {
  return { ip, socket: {} } as unknown as Request;
}

function fakeRes() {
  const state: { status?: number; body?: unknown; headers?: Record<string, string> } = {};
  const res = {
    set(field: string, value: string) {
      state.headers = { ...(state.headers ?? {}), [field]: value };
      return this;
    },
    status(code: number) {
      state.status = code;
      return this;
    },
    json(body: unknown) {
      state.body = body;
      return this;
    },
  } as unknown as Response;
  return { res, state };
}

describe("bookingRateLimit", () => {
  test("allows requests under the limit, then 429s", () => {
    for (let i = 0; i < 30; i++) {
      const { res, state } = fakeRes();
      const next = mock(() => {});
      bookingRateLimit(fakeReq("10.0.0.1"), res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(state.status).toBeUndefined();
    }

    const { res, state } = fakeRes();
    const next = mock(() => {});
    bookingRateLimit(fakeReq("10.0.0.1"), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(state.status).toBe(429);
    expect(state.body).toEqual({ error: "Too many booking requests, try again shortly" });
    expect(state.headers?.["Retry-After"]).toBe("60");
  });

  test("limits per IP independently", () => {
    const { res, state } = fakeRes();
    const next = mock(() => {});
    bookingRateLimit(fakeReq("10.0.0.2"), res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(state.status).toBeUndefined();
  });
});
