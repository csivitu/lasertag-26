import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type Parsed = { body?: unknown; params?: unknown; query?: unknown };

/**
 * Validates body/params/query against one schema and writes the parsed values
 * back onto the request, so handlers read validated (and transformed) data.
 *
 * Throws rather than responding: `middleware/errorHandler.ts` is the only
 * place that turns errors into HTTP responses, so a validation failure comes
 * out in the same shape as every other error instead of a second one. Express
 * 5 forwards sync throws from middleware to the error handler.
 */
export const validate =
  (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    }) as Parsed;

    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.params !== undefined) req.params = parsed.params as Request["params"];

    // `req.query` is a lazy getter in Express 5 — a plain assignment throws
    // ("Cannot set property query of #<IncomingMessage> which has only a
    // getter"), so the parsed value has to be defined over it instead.
    if (parsed.query !== undefined) {
      Object.defineProperty(req, "query", {
        value: parsed.query,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    }

    next();
  };
