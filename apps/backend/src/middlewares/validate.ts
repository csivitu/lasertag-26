import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export interface RequestValidators {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export const validateRequest = (validators: RequestValidators) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const errorMessage = firstIssue
          ? `${firstIssue.path.length > 0 ? firstIssue.path.join('.') + ' is invalid: ' : ''}${firstIssue.message}`
          : 'Validation error';

        res.status(400).json({
          success: false,
          error: errorMessage,
          details: error.issues,
        });
        return;
      }
      next(error);
    }
  };
};
