import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError } from "../errors";

/** Terminal 404 handler. Mount after every route, before `errorHandler`. */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.path}`,
    code: "not_found",
  });
}

/**
 * The single place errors become HTTP responses.
 *
 * Express 5 forwards both sync throws and async rejections from handlers to
 * here (router/lib/layer.js), so route handlers can be plain `async` functions
 * with no try/catch and no asyncHandler wrapper.
 *
 * Must declare all four parameters — Express identifies error middleware by
 * arity, not by position.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Once headers are out the door only Express's default handler can correctly
  // tear down a half-written response.
  if (res.headersSent) {
    next(err);
    return;
  }

  if (
    err instanceof AppError ||
    (Boolean(err) &&
      typeof err === "object" &&
      "status" in (err as Record<string, unknown>) &&
      typeof (err as Record<string, unknown>).status === "number")
  ) {
    const appErr = err as AppError;
    res.status(appErr.status).json({
      error: appErr.message,
      code: appErr.code || "error",
      ...appErr.detail,
    });
    return;
  }

  if (err instanceof ZodError) {
    const issues = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    const first = issues[0];
    res.status(400).json({
      error: first
        ? first.path
          ? `${first.path}: ${first.message}`
          : first.message
        : "Invalid request",
      code: "validation_error",
      issues,
    });
    return;
  }

  // express.json() reports malformed bodies as a SyntaxError carrying `body`.
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Malformed JSON body", code: "invalid_json" });
    return;
  }

  // Anything unrecognised is a bug. Log it server-side; never return the
  // message or stack, which on an admin API would leak schema and paths.
  console.error("[api] unhandled error", err);
  res.status(500).json({ error: "Internal server error", code: "internal_error" });
}

/**
 * Kept for the routes carried over from `dev`, which wrap their handlers in it.
 * Express 5 already forwards rejected promises from handlers, so new code does
 * not need this — it is a no-op safety net rather than a requirement.
 */
export const asyncHandler =
  <Req extends Request = Request>(
    fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as unknown as Req, res, next)).catch(next);
  };
