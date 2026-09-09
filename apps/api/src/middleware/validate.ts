import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Middleware factory to validate req.body against a Zod schema.
 */
export function validateBody(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                error: "Validation error",
                details: result.error.errors.map((e) => ({
                    field: e.path.join("."),
                    message: e.message,
                })),
            });
            return;
        }
        req.body = result.data;
        next();
    };
}

/**
 * Middleware factory to validate req.params against a Zod schema.
 */
export function validateParams(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            res.status(400).json({
                error: "Validation error",
                details: result.error.errors.map((e) => ({
                    field: e.path.join("."),
                    message: e.message,
                })),
            });
            return;
        }
        next();
    };
}
