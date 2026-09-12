import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type Parsed = { body?: unknown; params?: unknown; query?: unknown };
type ValidatorMap = { body?: ZodType; params?: ZodType; query?: ZodType };
type SchemaOrValidators = ZodType | ValidatorMap;

/**
 * Validates body/params/query against a Zod schema or per-part validator map
 * and writes the parsed (and transformed/sanitized) values back onto the request.
 */
export const validate =
  (schemaOrValidators: SchemaOrValidators) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (typeof (schemaOrValidators as { parse?: unknown }).parse === "function") {
      const schema = schemaOrValidators as ZodType;
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      }) as Parsed;

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.params !== undefined) req.params = parsed.params as Request["params"];

      if (parsed.query !== undefined) {
        Object.defineProperty(req, "query", {
          value: parsed.query,
          configurable: true,
          enumerable: true,
          writable: true,
        });
      }
    } else {
      const validators = schemaOrValidators as ValidatorMap;
      if (validators.body) req.body = validators.body.parse(req.body);
      if (validators.params) req.params = validators.params.parse(req.params) as Request["params"];
      if (validators.query) {
        Object.defineProperty(req, "query", {
          value: validators.query.parse(req.query),
          configurable: true,
          enumerable: true,
          writable: true,
        });
      }
    }

    next();
  };

export const validateRequest = validate;

