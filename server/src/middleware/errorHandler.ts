import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '../types/common';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const response: ApiResponse = {
      success: false,
      error: {
        message: 'Invalid request payload',
        code: 'VALIDATION_ERROR',
        details: err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      meta: { timestamp: new Date().toISOString() },
    };
    res.status(400).json(response);
    return;
  }

  // Handle Known Application Errors
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
      meta: { timestamp: new Date().toISOString() },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Nova AI Errors (Configuration, Auth, Timeout, Validation)
  if (err.name === 'NovaConfigurationError' || err.name === 'NovaAuthError' || err.name === 'NovaTimeoutError' || err.name === 'NovaValidationError' || err.name === 'NovaError') {
    const statusCode = (err as any).statusCode || 500;
    const response: ApiResponse = {
      success: false,
      error: {
        message: err.message,
        code: err.name.toUpperCase(),
        details: {
          retryable: (err as any).isRetryable || false,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    };
    res.status(statusCode).json(response);
    return;
  }

  // Internal Unhandled Errors (Sanitized)
  console.error('[UNHANDLED_ERROR]:', err);
  const response: ApiResponse = {
    success: false,
    error: {
      message: 'Internal server error occurred while processing financial command',
      code: 'INTERNAL_ERROR',
    },
    meta: { timestamp: new Date().toISOString() },
  };
  res.status(500).json(response);
}
