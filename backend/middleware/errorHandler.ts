import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      statusCode: 400,
      details: formattedErrors,
    });
  }

  // 2. Custom Application Operational Errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      statusCode: err.statusCode,
      details: err.details,
    });
  }

  // 3. JWT Authentication Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid or malformed authentication token',
      statusCode: 401,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication token has expired. Please log in again.',
      statusCode: 401,
    });
  }

  // 4. Multer File Upload Errors
  if ('code' in err && typeof (err as any).code === 'string' && (err as any).name === 'MulterError') {
    const multerCode = (err as any).code;
    if (multerCode === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large. Maximum allowed file size is 50MB.',
        statusCode: 413,
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
      statusCode: 400,
    });
  }

  // 5. Uncaught / Generic 500 Server Errors
  console.error('💥 Unhandled Exception:', err);

  const responsePayload: any = {
    success: false,
    error: 'Internal server error occurred',
    statusCode: 500,
  };

  if (env.NODE_ENV === 'development') {
    responsePayload.message = err.message;
    responsePayload.stack = err.stack;
  }

  return res.status(500).json(responsePayload);
}
