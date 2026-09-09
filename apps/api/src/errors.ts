/**
 * Domain errors. Services throw these; `middlewares/errorHandler.ts` is the
 * only place that turns them into HTTP responses, so nothing below the route
 * layer needs to know about status codes or `res`.
 */

/** Extra fields spread into the JSON response body alongside `error` and `code`. */
export type ErrorDetail = Record<string, unknown>;

export class AppError extends Error {
  // Constructor-parameter properties rather than subclass field initializers:
  // under `useDefineForClassFields` (implied by target ESNext) a subclass
  // field is defined *after* super() runs, so anything the base constructor
  // reads off `this` would see undefined. Assigning in super()'s own frame
  // avoids that class of bug entirely.
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly detail?: ErrorDetail,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, detail?: ErrorDetail) {
    super(400, "validation_error", message, detail);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", detail?: ErrorDetail) {
    super(401, "unauthorized", message, detail);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Admin access required", detail?: ErrorDetail) {
    super(403, "forbidden", message, detail);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, detail?: ErrorDetail) {
    super(404, "not_found", message, detail);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, detail?: ErrorDetail) {
    super(409, "conflict", message, detail);
  }
}

/** A route that exists and is wired up, but whose implementation is pending. */
export class NotImplementedError extends AppError {
  constructor(message: string, detail?: ErrorDetail) {
    super(501, "not_implemented", message, detail);
  }
}

/**
 * Two-argument form used by the team/slot/verification services carried over
 * from `dev`, whose throw sites read `new AppError(404, "…")`. Extending the
 * hierarchy means `middlewares/errorHandler.ts` renders them like every other
 * error instead of falling through to the generic 500 branch.
 */
export class HttpError extends AppError {
  constructor(status: number, message: string, detail?: ErrorDetail) {
    const code =
      { 400: "validation_error", 401: "unauthorized", 403: "forbidden", 404: "not_found", 409: "conflict" }[
        status
      ] ?? "error";
    super(status, code, message, detail);
  }
}
