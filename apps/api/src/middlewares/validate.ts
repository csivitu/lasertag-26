import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export interface RequestValidators {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export const validateRequest = (validators: RequestValidators) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (validators.body) {
        req.body = await validators.body.parseAsync(req.body);
      }
      if (validators.params) {
        req.params = (await validators.params.parseAsync(req.params)) as Record<string, string>;
      }
      if (validators.query) {
        req.query = (await validators.query.parseAsync(req.query)) as Record<string, string>;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const data = result.data as Record<string, unknown>;

    if (data.body) req.body = data.body;
    if (data.params) req.params = data.params as typeof req.params;
    if (data.query) req.query = data.query as typeof req.query;

    next();
  };
};
