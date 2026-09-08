import { Request, Response, NextFunction } from 'express';

interface CustomError {
  status?: number;
  statusCode?: number;
  message?: string;
}

export const errorHandler = (
  err: CustomError | Error | unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  console.error('Unhandled Server Error:', err);
  const errorObj = err as CustomError;
  const status = errorObj.status || errorObj.statusCode || 500;
  const message = errorObj.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message,
    details: err instanceof Error ? err.message : String(err),
  });
};
