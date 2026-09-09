import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../controllers/team.controller";

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

interface CustomError {
  status?: number;
  statusCode?: number;
  message?: string;
}

export const errorHandler = (
  err: CustomError | Error | ZodError | unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  console.error("Unhandled Error:", err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    const errorMessage = firstIssue
      ? `${firstIssue.path.length > 0 ? firstIssue.path.join(".") + " is invalid: " : ""}${firstIssue.message}`
      : "Validation error";

    res.status(400).json({
      success: false,
      error: errorMessage,
      details: err.issues,
    });
    return;
  }

  const errorObj = err as CustomError;
  const status = errorObj.status || errorObj.statusCode || 500;
  const message = errorObj.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    error: message,
    details: err instanceof Error ? err.message : String(err),
  });
};
