import { describe, expect, mock, test } from "bun:test";
import type { Request, Response } from "express";
import { z } from "zod";

import { ConflictError } from "../errors";
import { errorHandler } from "./errorHandler";

function fakeRes() {
  const state: { status?: number; body?: unknown } = {};
  const res = {
    headersSent: false,
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

describe("errorHandler", () => {
  test("AppError: spreads detail at the top level of the body", () => {
    const { res, state } = fakeRes();
    const err = new ConflictError("Cannot reduce capacity below the current booking count", {
      bookingCount: 8,
      requestedCapacity: 6,
    });

    errorHandler(err, {} as Request, res, mock(() => {}));

    expect(state.status).toBe(409);
    expect(state.body).toEqual({
      error: "Cannot reduce capacity below the current booking count",
      code: "conflict",
      bookingCount: 8,
      requestedCapacity: 6,
    });
  });

  test("ZodError: 400 with a populated issues array", () => {
    const { res, state } = fakeRes();
    const schema = z.object({ capacity: z.number().min(0) });
    let zodErr: unknown;
    try {
      schema.parse({ capacity: -1 });
    } catch (err) {
      zodErr = err;
    }

    errorHandler(zodErr, {} as Request, res, mock(() => {}));

    expect(state.status).toBe(400);
    const body = state.body as { code: string; issues: unknown[] };
    expect(body.code).toBe("validation_error");
    expect(body.issues.length).toBeGreaterThan(0);
  });

  test("an unrecognised error: 500 with neither the message nor a stack in the body", () => {
    const { res, state } = fakeRes();
    const originalError = console.error;
    console.error = mock(() => {});

    errorHandler(new Error("connection to db failed"), {} as Request, res, mock(() => {}));

    console.error = originalError;

    expect(state.status).toBe(500);
    const body = JSON.stringify(state.body);
    expect(body).not.toContain("connection to db failed");
    expect(state.body).toEqual({ error: "Internal server error", code: "internal_error" });
  });

  test("delegates to next(err) once headers are already sent", () => {
    const next = mock(() => {});
    const res = { headersSent: true } as Response;
    const err = new Error("too late");

    errorHandler(err, {} as Request, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
